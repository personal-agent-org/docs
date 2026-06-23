# Development

This section is for contributors working on Personal Agent itself. It complements the
[Run locally](../getting-started/run-locally.md) guide — that page gets the stack up; this
section explains how the codebase is laid out and how to extend it.

## Workspace layout

The repository is a single [`uv`](https://docs.astral.sh/uv/) workspace. Three members are
proper Python packages; everything else is loaded by the running app or built separately.

| Path | What it is |
| --- | --- |
| `packages/personal-agent-contracts/` | The single source of truth shared by API + worker: IDs, the `RunSpec`/`ToolsetSnapshot`, AG-UI events, control frames, usage, keys, world-memory and workflow-trigger contracts. |
| `services/api/` | The FastAPI app (`personal_agent`). App factory `personal_agent.main:create_app` (`app = create_app()`); subpackages for config, DB, auth, the agent, toolset assembly, realtime, integrations, workflows and more. |
| `services/worker/` | The Temporal worker (`personal_agent_worker`) — the durable `ChatAgentWorkflow` plus curator / goal / workflow-schedule / entity-sync / world-maintenance workflows and their activities. |
| `integrations/<domain>/` | Home-Assistant-style integration folders (manifest + config flow + integration class), discovered at runtime by the `IntegrationRegistry`. **Not** uv-workspace members. |
| `apps/web/` | The Quasar / Vue 3 single-page app. `apps/desktop/` is a Tauri shell wrapping it; the Android app is a separate repo (`personal-agent-org/android`). |
| `clients/` | The Rust `device-agent` (jailed FS + PTY), the terminal client (`tui`), and the `browser-sandbox` cloud `browser` device. (The Chrome/Firefox extension, the other `browser` device, lives in its own repo `personal-agent-org/browser-extension`.) |

Supporting directories: `deploy/` (Compose, Helm charts, Keycloak realm-as-code,
observability), `docs/` (these pages), and `tools/` (scripts).

!!! note "Conventions"
    Python 3.12, async SQLAlchemy 2.0 + asyncpg. Linting is `ruff` (line length 100), types
    are checked with `pyright`. All hard-coded backend strings are English; user-facing
    language comes from the model and frontend i18n. IDs are time-ordered UUIDv7;
    `run_id = run:{uuidv7}` is the cross-transport key.

## Two run paths, one envelope

A chat turn executes on one of two paths, but both emit the **same** AG-UI events onto a
per-run Redis Stream, which the server relays to the client over SSE.

| | Inline | Durable |
| --- | --- | --- |
| Where it runs | A FastAPI background task (`realtime/producers/inline.py`) | A Temporal workflow (`ChatAgentWorkflow` in `services/worker/`) |
| Streaming | pydantic-ai's `AGUIAdapter` | hand-built identical AG-UI events via a shared converter |
| Used for | Short, interactive turns | Long-running / durable runs that must survive restarts |

`api/routers/runs.py` (`_launch_run`) is the shared chokepoint that decides INLINE vs DURABLE
and builds the `RunSpec`. The tools available to a run are **snapshotted into the `RunSpec`**
at run start — the workflow never queries live DB state during a run or replay.

!!! warning "Streaming is one envelope"
    AG-UI is the only streaming envelope, on the Redis bus and on the SSE wire. The pydantic-ai
    `run_stream*` / `iter` helpers are forbidden inside a Temporal workflow — the durable path
    hand-builds the identical events through the shared converter.

## Dev task runner

Use [`just`](https://github.com/casey/just) — running `just` (or `just --list`) shows every
recipe. The ones you reach for most:

```bash
just setup      # uv sync + frontend deps (pnpm install)
just up         # start dev infra: Postgres / Redis / Temporal / Keycloak
just migrate    # alembic upgrade head

# then, in separate terminals:
just api        # run the API (uvicorn --reload) — needs `just up` + `just migrate`
just worker     # run the Temporal worker
just web        # run the Quasar dev server

just test       # pytest (some tests need PG + Redis); `just test-unit` for fast tests only
just check      # pre-PR gate: fmt-check + lint + types + test
```

`just check` is the gate to run before opening a PR. Other useful recipes include `just lint`,
`just fmt`, `just types`, `just docs` (serve these docs with live reload), and `just migration
"msg"` to autogenerate a migration. Read the `justfile` for the exact command behind any recipe.

!!! note "Tests run from the repo root"
    The e2e tests (`requires_services`) need local Postgres + Redis at DSN
    `postgresql+asyncpg://personal_agent:personal_agent@localhost:5432/personal_agent`.
    pytest is `asyncio_mode = "auto"`, so async tests need no decorator.

## Where to start

The most common contribution is a new **integration** — a self-contained folder that declares
its capabilities and is discovered at runtime, with no changes to the core app. Start here:

- [Integrations](integrations.md) — the folder layout (manifest + config flow + integration
  class) and how the `IntegrationRegistry` discovers them.
- [Integration capabilities](integration-capabilities.md) — the capability providers an
  integration can declare (message reader/sender/listener, web search/fetch, weather, compute)
  and the entity types it contributes.
- [Config flows](config-flows.md) — how an integration collects and validates its setup input.

Beyond integrations, two more extension surfaces live here:

- [Skills](skills.md) — user-authored capability packages with progressive disclosure.
- [Surfaces](surfaces.md) — composable views (chat / editor / terminal) that integrations and
  the core app can contribute.

For the invariants that hold the run paths and tenancy together, see the
[Frozen contracts](../architecture/frozen-contracts.md).
