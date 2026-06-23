# personal-agent - Disaster Recovery Runbook

Procedures to recover the personal-agent platform after data loss, corruption, or a
cluster/region failure. Scope: PostgreSQL (CloudNativePG, the app + Temporal
clusters), Temporal visibility store (Elasticsearch/OpenSearch),
and Redis (ephemeral). Covers PITR drills, snapshot
guidance, and a restore-order checklist.

> System of record = Postgres. Everything else is either reconstructable from
> git (Helm, manifests), rebuildable from Postgres (Temporal
> visibility), or intentionally ephemeral (Redis).

---

## RPO / RTO targets

| Component | Store | RPO (max data loss) | RTO (time to restore) | Backup mechanism |
|-----------|-------|--------------------|----------------------|------------------|
| App DB (chats, messages, usage_records, templates, BYOK ciphertext) | CNPG `personal-agent-db` | **≤ 5 min** (continuous WAL archive) | ≤ 60 min | WAL archiving + base backups, PITR |
| Temporal persistence | CNPG `temporal-db` | ≤ 5 min | ≤ 90 min | WAL/PITR |
| Temporal visibility | Elasticsearch/OpenSearch | ≤ 24 h (snapshot) | ≤ 90 min (or rebuild) | ES snapshot repo; **rebuildable** from temporal-db |
| Redis (stream replay buffers, control/presence, rate-limit counters) | Redis | **N/A - ephemeral** | ≤ 5 min (just restart) | None by design |
| Helm chart, manifests | git | 0 (in VCS) | minutes | git |

**Cluster-wide RTO target: ≤ 2 hours** for full platform restore in a new
cluster from object storage + git.

---

## What Redis loses on failure (and why it is acceptable)

Redis is **not** a system of record. On total Redis loss you lose:

* **In-flight AG-UI stream replay buffers** (the `personal_agent:{run_id}:stream`
  Redis STREAMs, ~900s retention). A client mid-stream can no longer resume via
  `Last-Event-Id`. Recovery: the app emits the `personal_agent.resume_expired` CUSTOM
  event and the SPA re-loads the transcript from Postgres via REST. INLINE runs
  in progress will error and must be retried; DURABLE runs continue in Temporal
  and keep publishing to the fresh Redis.
* **Control / presence Pub/Sub** (cancel, typing) - purely ephemeral.
* **Rate-limit / quota token buckets** (`personal_agent:quota:*`) - counters reset,
  briefly relaxing limits. Self-heals within one window.

No durable data is lost: messages and usage_records are already persisted to
Postgres after each step. Recovery from Redis loss = restart Redis (or let the
StatefulSet reschedule); no restore procedure required.

---

## 1. CloudNativePG - WAL archiving + PITR

### 1.1 Prerequisites (CNPG Clusters provisioned alongside the chart)

The `personal-agent` Helm chart bundles the CloudNativePG **operator** as a
subchart but does NOT define the `Cluster` custom resources; those are
provisioned separately. The chart references the app DB only by service name:
`personal-agent-pg-app-rw` (see `jobs.migrate.waitForDb.host` and the API DSN).
The cluster names used below (`personal-agent-db`, `temporal-db`) are illustrative
placeholders for your two CNPG Clusters; substitute your real `metadata.name` /
`serverName` values.

Each CNPG `Cluster` is expected to have continuous WAL archiving to object
storage (Barman Cloud plugin or `spec.backup.barmanObjectStore`), e.g.:

```yaml
# (reference only - lives in the deploy repo charts/, not edited here)
spec:
  backup:
    barmanObjectStore:
      destinationPath: s3://personal-agent-backups/cnpg/personal-agent-db
      endpointURL: https://<object-storage-endpoint>
      s3Credentials: { ... ESO-managed secret ... }
      wal: { compression: gzip, maxParallel: 2 }
      data: { compression: gzip }
    retentionPolicy: "30d"
  # Scheduled base backups:
# ScheduledBackup kind, every 24h, immediate=true on first apply.
```

Verify archiving is healthy before relying on it:

```bash
kubectl -n personal-agent get cluster personal-agent-db -o jsonpath='{.status.conditions}'
kubectl -n personal-agent exec personal-agent-db-1 -c postgres -- \
  psql -tAc "SELECT last_archived_wal, last_failed_wal FROM pg_stat_archiver;"
# last_failed_wal must be NULL / stale; last_archived_wal must advance.
kubectl -n personal-agent get backups.postgresql.cnpg.io   # base backups present & completed
```

### 1.2 PITR restore (recover to a point in time)

CNPG restores by **bootstrapping a NEW cluster** from the object-store backup;
you do not restore in place. Pick a target time just BEFORE the incident.

```yaml
# pitr-restore.yaml - apply to recover personal-agent-db to a timestamp.
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: personal-agent-db-restore
  namespace: personal-agent
spec:
  instances: 3
  imageName: ghcr.io/cloudnative-pg/postgresql:17   # MUST match the running operand major (the app runs Postgres 17 + pgvector)
  bootstrap:
    recovery:
      source: personal-agent-db
      recoveryTarget:
        targetTime: "2026-05-30 11:45:00.00000+00"   # <-- just before incident
  externalClusters:
    - name: personal-agent-db
      barmanObjectStore:
        serverName: personal-agent-db                          # original cluster's serverName
        destinationPath: s3://personal-agent-backups/cnpg/personal-agent-db
        endpointURL: https://<object-storage-endpoint>
        s3Credentials: { ... ESO-managed secret ... }
        wal: { maxParallel: 4 }
```

```bash
kubectl apply -f pitr-restore.yaml
kubectl -n personal-agent get cluster personal-agent-db-restore -w     # wait for healthy
# Validate data, then cut over:
#   - point the app DSN Secret at personal-agent-db-restore-rw, OR
#   - promote and rename per CNPG cut-over docs.
```

> **Extensions note (Frozen Contract #8):** `vector`, `pgcrypto`, `citext` are
> created by CNPG `bootstrap.postInitSQL` as superuser at cluster init - they
> come back automatically on the restored cluster. Never re-create them in
> Alembic; the app role is unprivileged.

> **BYOK note:** the `byok_keys` table stores only envelope-encrypted ciphertext
> (per-row AES-GCM DEK wrapped by the master key; the master key is never in the
> DB). These are the admin-managed **platform provider keys** set via
> `PUT /api/v1/admin/providers/{id}/key`. A restored DB is useless without the
> master key, injected as `PERSONAL_AGENT__SECURITY__BYOK_MASTER_KEY` from Vault
> (chart `externalSecrets` maps it from `personal-agent/data/byok`, property
> `master_key`). Ensure that key is recoverable as part of DR; losing it
> permanently bricks every stored provider key (re-enter each in the admin UI).

### 1.3 Quarterly PITR drill (required)

1. Trigger an on-demand base backup; note the time.
2. Insert a sentinel row (`INSERT INTO chats ... 'DR-DRILL-<ts>'`); note T0.
3. Apply `pitr-restore.yaml` with `targetTime` = T0 + 30s into a scratch
   namespace.
4. Confirm the sentinel row is present and `usage_records` UNIQUE constraint
   (`run_id, request_index`) is intact (`\d usage_records`).
5. Record actual RTO; tear down the scratch cluster. File results in the DR log.

---

## 2. Temporal - Elasticsearch / visibility snapshot guidance

Temporal has two stores:

* **Persistence (temporal-db, CNPG):** workflow histories - the durable system
  of record for in-flight runs. Recovered via CNPG PITR (§1.2). This is what
  matters: restoring it brings back in-flight `ChatAgentWorkflow` runs.
* **Visibility (Elasticsearch/OpenSearch):** an INDEX for list/search of
  workflows. It is **rebuildable** from persistence and is not authoritative.

### 2.1 ES/OpenSearch snapshots (optional, speeds RTO)

Register a snapshot repository backed by the same object storage and schedule
SLM/snapshots of the Temporal visibility indices:

```bash
# Register repo (run against the ES/OpenSearch endpoint):
PUT _snapshot/personal_agent_dr
{ "type": "s3",
  "settings": { "bucket": "personal-agent-backups", "base_path": "temporal-es",
                "endpoint": "<object-storage-endpoint>" } }

# Snapshot the visibility indices (temporal_visibility_v1_*):
PUT _snapshot/personal_agent_dr/%3Cvis-%7Bnow%2Fd%7D%3E
{ "indices": "temporal_visibility_v1_*", "include_global_state": false }
```

Daily snapshots → ~24h RPO on visibility (acceptable; it is an index).

### 2.2 Restore options

* **Fast path:** restore the ES snapshot into a fresh ES cluster, then point
  Temporal at it. Restore temporal-db via PITR. Start Temporal frontend/history/
  matching.
* **Rebuild path (if no usable snapshot):** restore temporal-db via PITR, stand
  up an EMPTY ES/OpenSearch, and let Temporal re-index. Set up the schema with
  `temporal-sql-tool`/`tctl` index setup; visibility back-fills as workflows
  progress (older closed-workflow search may be incomplete but histories are
  intact).
* Verify the Temporal namespace `personal_agent` (config `temporal.namespace`,
  underscore) exists before starting workers. The worker registers a single task
  queue, `personal-agent-agents` (config `temporal.task_queue`); all workflows and
  activities run on it.

---

## 3. Restore-order checklist (full cluster rebuild)

Restore in dependency order; gate each step on the previous being healthy.

1. **Cluster + operators** - CNPG, KEDA, cert-manager, External
   Secrets Operator, HAProxy/Gateway-API, Prometheus/OTel operators.
2. **Secrets** - ESO syncs from Vault: DB DSNs, Redis,
   Temporal mTLS, **`byok_master_key`**, provider keys, object-storage creds.
   (Without `byok_master_key`, stored BYOK keys are unrecoverable.)
3. **Object storage reachable** - confirm the DR bucket is accessible (CNPG
   WAL source, ES snapshots all live here).
4. **CNPG clusters via PITR** - restore `personal-agent-db`,
   `temporal-db` (§1.2). Wait for all `Ready`. Extensions auto-created by
   `postInitSQL`.
5. **Redis** - fresh StatefulSet (no restore; ephemeral). Just needs to be up.
6. **Temporal** - ES restore/rebuild (§2) + restored `temporal-db`; start
   frontend/history/matching; confirm the `personal_agent` namespace exists.
7. **db-migrate Job** - the `<release>-db-migrate` Helm pre-install/pre-upgrade
   hook runs `alembic upgrade head` (via `ENTRYPOINT_MODE=migrate`) against the
   restored app DB (no-op if already at head; safe + idempotent). Its
   `wait-for-db` initContainer blocks on `personal-agent-pg-app-rw:5432` until CNPG
   is Ready.
8. **API + Worker** - roll out `personal-agent-api` then `personal-agent-worker`. KEDA scales the
   worker off the `personal-agent-agents` task-queue backlog with
   `minReplicaCount: 1` (never scale-to-zero, so in-flight runs are not orphaned).
9. **Verify (smoke):** `/readyz` = 200; `/health/deps` shows Temporal/JWKS
    healthy; `GET /me` works (OIDC); run one INLINE chat (Flow A) and one DURABLE
    run (Flow B) end-to-end; confirm a new `usage_records` row is written with a
    valid cost.

---

## DR contacts & logs

Record every drill and real restore (date, scenario, measured RPO/RTO,
deviations) in the team DR log. Review RPO/RTO targets quarterly against actuals.
