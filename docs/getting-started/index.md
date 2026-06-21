# Installation

Personal Agent is a containerised platform. There are **three ways** to run it —
pick the one that matches your goal:

<div class="grid cards" markdown>

-   :material-laptop:{ .lg .middle } __Local (development)__

    ---

    Run the API, worker and web dev server from source, against dev infra
    (Postgres, Redis, Temporal, Keycloak). Hot reload, the full test suite.

    [:octicons-arrow-right-24: Jump to Local](#local-development)

-   :material-docker:{ .lg .middle } __Docker / Podman__

    ---

    The whole stack as containers on a single host — the usual way to self-host
    your own instance on a box or VPS.

    [:octicons-arrow-right-24: Jump to Docker / Podman](#docker-podman-single-host)

-   :material-kubernetes:{ .lg .middle } __Kubernetes__

    ---

    Scaled-out, HA deployment via the Helm umbrella chart (HPA, KEDA, Gateway
    API, CloudNativePG, cert-manager).

    [:octicons-arrow-right-24: Jump to Kubernetes](#kubernetes-helm)

</div>

---

## Local (development)

Best for hacking on the code. You need [`uv`](https://docs.astral.sh/uv/),
[`just`](https://github.com/casey/just) and Docker (for the dev infra), or a local
Postgres + pgvector and Redis.

```bash
just setup           # uv sync + frontend deps (pnpm install)
just up              # dev infra: Postgres / Redis / Temporal / Keycloak (compose)
just migrate         # alembic upgrade head
just api             # the API (uvicorn --reload)
just worker          # the Temporal worker
just web             # the Quasar dev server
```

Run `just` (or `just --list`) to see every recipe. Full developer workflow,
health endpoints and quality gates: **[Run locally](run-locally.md)**.

---

## Docker / Podman (single host)

The self-contained way to run a real instance on one machine. Uses the
single-host production compose file (`deploy/compose/docker-compose.prod.yml`),
which ships Postgres+pgvector, Redis, Temporal, Keycloak and the app together.

```bash
cp .env.example .env
# Edit .env: set APP_ORIGIN, KEYCLOAK_ORIGIN, OIDC_ISSUER and the secrets.

docker compose -f deploy/compose/docker-compose.prod.yml --env-file .env up -d --build
```

The `migrate` service runs `alembic upgrade head` automatically before the API
starts; the app comes up on the origin you configured. Re-run migrations any time
with:

```bash
docker compose -f deploy/compose/docker-compose.prod.yml --env-file .env run --rm migrate
```

!!! tip "Podman"
    Podman 4.4+ is a drop-in: replace `docker compose` with `podman compose`
    (or use the `podman-compose` shim). The compose file is unchanged.

!!! note "Just trying it out?"
    For a throwaway all-in-one stack (no `.env` editing) use the **dev** compose
    file instead — `docker compose -f deploy/compose/docker-compose.yml up`.

Putting it on your own domain (origins, Keycloak realm, TLS, the device clients):
**[Self-hosting guide](../self-hosting.md)**.

---

## Kubernetes (Helm)

For a scaled-out, highly-available deployment. The umbrella chart in
`deploy/charts/personal-agent/` deploys the three first-party workloads
(`api` with an HPA, `worker` with KEDA autoscaling on the Temporal backlog,
`frontend`) plus optional platform operators as subchart dependencies
(CloudNativePG, Redis, Temporal, KEDA, cert-manager, External Secrets,
HAProxy + Gateway API — all disabled by default so the chart renders offline).

```bash
# Add the dependency repos, then vendor them:
helm repo add cnpg https://cloudnative-pg.github.io/charts
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add temporal https://go.temporal.io/helm-charts
helm repo add kedacore https://kedacore.github.io/charts
helm repo add jetstack https://charts.jetstack.io
helm repo add external-secrets https://charts.external-secrets.io
helm repo add haproxytech https://haproxytech.github.io/helm-charts
helm dependency build deploy/charts/personal-agent

# Install (rolls back on a failed migrate hook):
helm upgrade --install --atomic personal-agent deploy/charts/personal-agent \
  -n personal-agent --create-namespace \
  -f deploy/charts/personal-agent/values-prod.yaml
```

The chart enforces the install order via Helm hooks — **DB migrate → Keycloak
realm-import → api/worker rollout**. Set your origins under
`jobs.realmImport.realmVars` and the app config/secrets under `config.*` /
`externalSecrets.data`. Full reference: the
[chart README](https://github.com/luebke-dev/personal-assistant/tree/main/deploy/charts/personal-agent)
and the [Self-hosting guide](../self-hosting.md).
