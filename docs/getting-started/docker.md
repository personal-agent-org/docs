# Docker / Podman

The self-contained way to run a real instance on a single machine — the whole
stack as containers. This is the usual choice for self-hosting on a box or VPS.

It uses the single-host production compose file
(`deploy/compose/docker-compose.prod.yml`), which ships Postgres+pgvector, Redis,
Temporal, Keycloak and the three app workloads (API, worker, frontend) together.

## Prerequisites

- **Docker** with Compose v2 (`docker compose`), **or** **Podman** 4.4+
  (`podman compose`).
- A domain (or hostnames) for the app + Keycloak, and a model-provider key (or a
  local model endpoint) to add later in the admin console.

## Bring it up

```bash
cp .env.example .env
# Edit .env: set APP_ORIGIN, KEYCLOAK_ORIGIN, OIDC_ISSUER and the secrets.

docker compose -f deploy/compose/docker-compose.prod.yml --env-file .env up -d --build
```

The `migrate` service runs `alembic upgrade head` automatically before the API
starts; the app then comes up on the origin you configured.

!!! warning "Use the prod file alone"
    Pass **only** `-f docker-compose.prod.yml`. The dev base file publishes
    Postgres/Redis on host ports and is meant for development — mixing the two can
    collide with services already on the host.

## Database migrations

`up` applies migrations via the `migrate` service. To run them on demand (e.g.
after pulling a new image):

```bash
docker compose -f deploy/compose/docker-compose.prod.yml --env-file .env run --rm migrate
```

## Updating

```bash
git pull
docker compose -f deploy/compose/docker-compose.prod.yml --env-file .env up -d --build
```

## Podman

Podman 4.4+ is a drop-in replacement — swap `docker compose` for `podman compose`
(or use the `podman-compose` shim). The compose file is unchanged.

!!! note "Just trying it out?"
    For a throwaway all-in-one stack with no `.env` editing, use the **dev**
    compose file instead:

    ```bash
    docker compose -f deploy/compose/docker-compose.yml up
    ```

## Putting it on your own domain

Origins, the Keycloak realm, TLS, and wiring up the device clients are covered in
the **[Self-hosting guide](../self-hosting.md)**.
