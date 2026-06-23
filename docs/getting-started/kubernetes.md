# Kubernetes (Helm)

For a scaled-out, highly-available deployment. The umbrella chart in
`charts/personal-agent/` (in the `personal-agent-org/deploy` repo) deploys Personal Agent to a
self-managed cluster.

## What it deploys

First-party workloads (always rendered):

| Workload | Kind | Notes |
| --- | --- | --- |
| `personal-agent-api` | Deployment | FastAPI, 3 replicas, **HPA on CPU**, readiness `/readyz` + liveness `/healthz`, preStop drain, no session affinity (Redis-Streams fanout). |
| `personal-agent-worker` | Deployment | Temporal worker, **KEDA** `ScaledObject` on the `personal-agent-agents` task-queue backlog (no scale-to-zero). |
| `personal-agent-frontend` | Deployment | nginx serving the static Quasar build; runtime `/config.js` from a ConfigMap. No secrets. |

Plus Services, PodDisruptionBudgets, default-deny NetworkPolicies, a Gateway +
HTTPRoutes (Gateway API), ExternalSecrets, and the `db-migrate` /
`realm-import` hook Jobs.

The platform operators/data services are declared as subchart dependencies but
**disabled by default** (so the chart renders fully offline): CloudNativePG,
Redis, Temporal, KEDA, cert-manager, External Secrets, HAProxy + Gateway API.
Enable the ones you need with `<name>.enabled=true`.

## Prerequisites

- A Kubernetes cluster + [`helm`](https://helm.sh/) v3.
- The dependency chart repos added (below), or the operators already installed.

## Install

```bash
# Clone the deploy repo (charts only; the api/worker/frontend images are pulled from ghcr):
git clone https://github.com/personal-agent-org/deploy.git
cd deploy

# Add the dependency repos, then vendor them into the chart:
helm repo add cnpg https://cloudnative-pg.github.io/charts
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add temporal https://go.temporal.io/helm-charts
helm repo add kedacore https://kedacore.github.io/charts
helm repo add jetstack https://charts.jetstack.io
helm repo add external-secrets https://charts.external-secrets.io
helm repo add haproxytech https://haproxytech.github.io/helm-charts
helm dependency build charts/personal-agent

# Install (rolls back on a failed migrate hook):
helm upgrade --install --atomic personal-agent charts/personal-agent \
  -n personal-agent --create-namespace \
  -f charts/personal-agent/values-prod.yaml
```

`--atomic` rolls back on a failed migrate hook, enforcing the migrate-gate.

## Install order

The chart enforces the order via Helm hook weights + initContainer gates:

1. **`db-migrate`** Job (pre-install/upgrade) — waits for the database, runs
   `alembic upgrade head`.
2. **`realm-import`** Job — waits for Keycloak, then runs `keycloak-config-cli` to import the
   `personal-agent` realm (idempotent) from a ConfigMap built from `files/realm-*.json`. It sets
   `IMPORT_VARSUBSTITUTION_ENABLED=true`, so the realm JSON's `${VAR}` placeholders are substituted
   from the Job's environment — supply your origins via `jobs.realmImport.realmVars` (`APP_ORIGIN`,
   `KEYCLOAK_ORIGIN`, `EXTENSION_ID`). See [OIDC provider configuration](oidc.md) for the realm's
   clients and roles.
3. **api / worker / frontend** roll out only after the hooks succeed.

!!! note "Frozen Contract #8"
    Postgres extensions (`vector` / `pgcrypto` / `citext`) come from CloudNativePG
    `postInitSQL`, **not** from the migrate Job.

## Configuration

- `config.*` — all non-secret `PERSONAL_AGENT__*` settings.
- `externalSecrets.data` — DB DSN, Redis URL, BYOK master key, provider keys.
- `api.autoscaling.*`, `worker.keda.*`, `gateway.sse.*`, `gateway.tls.*`.

See `charts/personal-agent/values.yaml` (defaults) and `charts/personal-agent/values-prod.yaml`
(example); the `PERSONAL_AGENT__*` settings themselves are documented in the
[Configuration reference](configuration.md).

## Offline render

The chart templates without a cluster or network (deps disabled):

```bash
helm lint charts/personal-agent
helm template personal-agent charts/personal-agent \
  -f charts/personal-agent/values.yaml
```

Full reference: the
[chart README](https://github.com/personal-agent-org/deploy/tree/main/charts/personal-agent),
the [Configuration reference](configuration.md), and
[OIDC provider configuration](oidc.md).
