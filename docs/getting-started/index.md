# Getting started

Personal Agent is a containerised platform. You can spin up the **full stack
locally** in minutes for development, or deploy your **own instance** on your own
domain for real use.

<div class="grid cards" markdown>

-   :material-laptop:{ .lg .middle } __Run locally__

    ---

    Resolve the `uv` workspace and bring up Postgres, Redis, Temporal and
    Keycloak via Docker Compose — then run the API, worker and web dev server.

    [:octicons-arrow-right-24: Run locally](run-locally.md)

-   :material-server-network:{ .lg .middle } __Self-host__

    ---

    Point one built image at your own domain through a handful of environment
    variables. Single-host Compose or scaled-out Kubernetes via Helm.

    [:octicons-arrow-right-24: Self-hosting guide](../self-hosting.md)

</div>

## Prerequisites

- [`uv`](https://docs.astral.sh/uv/) — the Python workspace + task runner backend.
- Either **Docker** (Compose v2) **or** a local **Postgres + pgvector** and **Redis**.
- [`just`](https://github.com/casey/just) — the dev task runner (recommended).

## The 60-second tour

```bash
uv sync                      # resolve the workspace
cp .env.example .env         # adjust as needed

# Full stack via Docker Compose:
docker compose -f deploy/compose/docker-compose.yml up
```

That brings up Postgres+pgvector, Redis, a single-host Temporal dev server and
Keycloak alongside the app. From there, head to [Run locally](run-locally.md) for
the developer workflow, or the [Self-hosting guide](../self-hosting.md) to put it
on your own domain.

!!! tip "Use `just`"
    The repo ships a [`just`](https://github.com/casey/just) task runner. Run
    `just` (or `just --list`) to see every recipe — `just setup`, `just up`,
    `just migrate`, `just api`, `just worker`, `just web`, `just check`.
