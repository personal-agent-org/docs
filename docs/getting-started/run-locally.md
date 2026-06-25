# Run locally

This page covers the developer workflow. For a production deployment on your own
domain, see [Docker / Podman](docker.md) (or [Kubernetes](kubernetes.md)) and the
[Configuration reference](configuration.md).

The dev-from-source workflow now spans three repos: infra comes from
`personal-agent-org/deploy`, the API + worker from `personal-agent-org/backend`,
and the SPA from `personal-agent-org/frontend`. Clone the ones you need.

## Prerequisites

- [`uv`](https://docs.astral.sh/uv/), and either Docker or a local
  Postgres + pgvector and Redis.
- [`just`](https://github.com/casey/just) — the dev task runner.
- For the frontend: [Node.js](https://nodejs.org/) 22+ and
  [`pnpm`](https://pnpm.io/) — e.g. `corepack enable pnpm` (bundled with Node),
  or `brew install pnpm` / `npm install -g pnpm`.

## Bring up the stack

=== "With `just` (recommended)"

    Dev infra (Postgres/Redis/Temporal/Keycloak) from the deploy repo:

    ```bash
    git clone https://github.com/personal-agent-org/deploy.git
    cd deploy
    docker compose -f compose/docker-compose.yml up
    ```

    Backend (API + worker) from the backend repo:

    ```bash
    git clone https://github.com/personal-agent-org/backend.git
    cd backend
    just setup           # uv sync + install git hooks
    just migrate         # alembic upgrade head
    just api             # run the API (uvicorn --reload, port 9000)
    just worker          # run the Temporal worker
    ```

    Frontend (Quasar/Vue 3 SPA) from the frontend repo:

    ```bash
    git clone https://github.com/personal-agent-org/frontend.git
    cd frontend
    just setup           # pnpm install + install git hooks
    just dev             # run the Quasar dev server
    ```

=== "Raw commands"

    ```bash
    # Dev infra via Docker Compose (deploy repo):
    git clone https://github.com/personal-agent-org/deploy.git
    cd deploy
    cp compose/.env.example compose/.env    # adjust as needed
    docker compose -f compose/docker-compose.yml up

    # Backend against local services (backend repo):
    git clone https://github.com/personal-agent-org/backend.git
    cd backend
    uv sync
    uv run alembic upgrade head
    uv run uvicorn personal_agent.main:app --reload --port 9000
    uv run python -m personal_agent.worker.entrypoint    # Temporal worker

    # Frontend (frontend repo):
    git clone https://github.com/personal-agent-org/frontend.git
    cd frontend
    pnpm install
    pnpm dev
    ```

## Health endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /healthz` | Liveness |
| `GET /readyz` | Readiness — gates only on **hard deps** (DB + Redis) |
| `GET /health/deps` | Soft deps (Temporal / JWKS) — a Keycloak/Temporal blip can't take the API offline |

## Quality gates

In the backend repo:

```bash
just lint            # ruff check
just fmt             # ruff format
just types           # pyright (basic mode)
just test            # pytest (some tests need PG + Redis)
just test-unit       # fast tests only (no live PG/Redis)
just check           # pre-PR gate: lint + types + test-unit
```

In the frontend repo:

```bash
just lint            # ESLint
just test            # frontend unit tests (vitest)
just check           # pre-PR gate: lint + i18n + test + build
```

Or the raw commands:

```bash
# Backend repo:
uv run ruff check src integrations tools   # lint
uv run pyright                             # type check (basic mode)
uv run pytest -q                           # api/worker/contracts tests

# Frontend repo:
pnpm test                                  # frontend unit tests (vitest)
```

Per-commit hooks run via **pre-commit** (`prek`): ruff check + format and file
hygiene in the backend repo, plus a Conventional Commits check on the commit
message in both repos (pyright, tests and the frontend ESLint/i18n/build run in
`just check` and CI, not as git hooks). Set up with:

```bash
uv tool install prek
prek install
prek install --hook-type commit-msg   # the Conventional Commits check
```

!!! note "Tests run from the repo root"
    The e2e tests (`requires_services`) need local Postgres + Redis at DSN
    `postgresql+asyncpg://personal_agent:personal_agent@localhost:5432/personal_agent`.
    pytest is `asyncio_mode = "auto"`, so async tests need no decorator.

## Versioning & releases

Releases use **CalVer** (`YYYY.M.MICRO`). Each repo carries its own GitHub Actions
`release.yml`, dispatched manually (pick the MICRO for the month): it runs the CI
gate, builds + pushes the OCI image to ghcr, tags `vYYYY.M.MICRO`, and cuts a
Release with auto-generated notes (Conventional Commits). Deploy config (compose,
Helm) in the `personal-agent-org/deploy` repo references the published image tags.
