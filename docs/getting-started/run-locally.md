# Run locally

This page covers the developer workflow. For a production deployment on your own
domain, see [Docker / Podman](docker.md) (or [Kubernetes](kubernetes.md)) and the
[Configuration reference](configuration.md).

## Prerequisites

- [`uv`](https://docs.astral.sh/uv/), and either Docker or a local
  Postgres + pgvector and Redis.
- [`just`](https://github.com/casey/just) — the dev task runner.

## Bring up the stack

=== "With `just` (recommended)"

    ```bash
    just setup           # uv sync + frontend deps (pnpm install)
    just up              # start dev infra (Postgres/Redis/Temporal/Keycloak)
    just migrate         # alembic upgrade head
    just api             # run the API (uvicorn --reload)
    just worker          # run the Temporal worker
    just web             # run the Quasar dev server
    ```

=== "Raw commands"

    ```bash
    uv sync                      # resolve the workspace
    cp .env.example .env         # adjust as needed

    # Full stack via Docker Compose:
    docker compose -f deploy/compose/docker-compose.yml up

    # Or run the API directly against local services:
    cd services/api && uv run alembic upgrade head
    uv run uvicorn personal_agent.main:app --reload --port 8000
    ```

## Health endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /healthz` | Liveness |
| `GET /readyz` | Readiness — gates only on **hard deps** (DB + Redis) |
| `GET /health/deps` | Soft deps (Temporal / JWKS) — a Keycloak/Temporal blip can't take the API offline |

## Quality gates

```bash
just lint            # ruff check
just fmt             # ruff format
just types           # pyright (basic mode)
just test            # pytest (some tests need PG + Redis)
just test-unit       # fast tests only (no live PG/Redis)
just check           # pre-PR gate: fmt-check + lint + types + test
```

Or the raw commands:

```bash
uv run ruff check .          # lint
uv run pyright               # type check (basic mode)
uv run pytest -q             # backend/worker/contracts tests
cd apps/web && pnpm test     # frontend unit tests (vitest)
```

These run per commit via **pre-commit** (`prek`) — ruff, frontend ESLint, file
hygiene and Conventional Commits. Set up with:

```bash
uv tool install prek && prek install
```

!!! note "Tests run from the repo root"
    The e2e tests (`requires_services`) need local Postgres + Redis at DSN
    `postgresql+asyncpg://personal_agent:personal_agent@localhost:5432/personal_agent`.
    pytest is `asyncio_mode = "auto"`, so async tests need no decorator.

## Versioning & releases

Releases use **CalVer** (`YYYY.M.MICRO`). `just release` dispatches the GitHub
Actions `release.yml` workflow: it runs the CI gate, tags `vYYYY.M.MICRO` on
`origin/main`, publishes a Release with auto-generated notes (Conventional
Commits), and attaches the device-agent binaries.

```bash
just release-preview   # show the next CalVer + changelog
just release           # cut it (refuses a dirty tree or unpushed commits)
```
