# Docker / Podman

The self-contained way to run a real instance on a single machine — the whole
stack as containers. This is the usual choice for self-hosting on a box or VPS.

It uses the single-host production compose file
(`compose/docker-compose.prod.yml`) from the `personal-agent-org/deploy` repo, which
ships Postgres+pgvector, Redis, Temporal, Keycloak and the three app workloads (API,
worker, frontend) together. The prod stack **pulls** the prebuilt
`ghcr.io/personal-agent-org/personal-agent-*` images; there is no local build context.

## Prerequisites

- **Docker** with Compose v2 (`docker compose`), **or** **Podman** 4.4+
  (`podman compose`).
- A domain (or hostnames) for the app + Keycloak, and a model-provider key (or a
  local model endpoint) to add later in the admin console.
- A **reverse proxy** terminating TLS in front of the stack (Caddy, nginx,
  Traefik, …). It must route the app origin to the `frontend` container (`:80`) and
  the `/api`, `/webhooks`, SSE and WebSocket paths to the `backend` container
  (`:8000`); it must **not buffer** SSE responses and must allow WebSocket
  upgrades. The reverse proxy lives outside the deploy repo.
- A reachable **Keycloak** (the OIDC provider). The compose file bundles one for
  single-host use and imports the realm for you (see [Keycloak realm](#keycloak-realm)).

Postgres+pgvector, Redis and a single-host Temporal dev server are bundled in the
compose file — you don't provide those yourself.

## Bring it up

```bash
git clone https://github.com/personal-agent-org/deploy.git
cd deploy

cp compose/.env.example compose/.env
# Edit compose/.env: set APP_ORIGIN, KEYCLOAK_ORIGIN, OIDC_ISSUER and the secrets.

docker compose -f compose/docker-compose.prod.yml --env-file compose/.env up -d
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
docker compose -f compose/docker-compose.prod.yml --env-file compose/.env run --rm migrate
```

## Updating

```bash
git pull
docker compose -f compose/docker-compose.prod.yml --env-file compose/.env pull
docker compose -f compose/docker-compose.prod.yml --env-file compose/.env up -d
```

## Podman

Podman 4.4+ is a drop-in replacement — swap `docker compose` for `podman compose`
(or use the `podman-compose` shim). The compose file is unchanged.

!!! note "Just trying it out?"
    For a throwaway all-in-one stack with no `.env` editing, use the **dev**
    compose file instead:

    ```bash
    docker compose -f compose/docker-compose.yml up
    ```

## Configuration

The `.env` knobs above (origins, OIDC issuer, CORS, secrets) plus the SPA's runtime config are the
full set — see the [Configuration reference](configuration.md). Health endpoints on the backend:
`GET /healthz` (liveness), `GET /readyz` (DB + Redis), `GET /health/deps` (soft deps: Temporal,
JWKS).

## Keycloak realm

The realm definition lives at `keycloak/realm-personal-agent.json` and is imported
**idempotently** — you don't click through the Keycloak admin UI. The bundled `keycloak` service
runs `start-dev --import-realm` with the `keycloak/` directory mounted into
`/opt/keycloak/data/import`, so the realm is created (or overwritten) on start.

When you adapt the realm to your domain, point each client's redirect URIs / web origins at your
`APP_ORIGIN` and keep the API audience (`personal-agent-api`) matching
`PERSONAL_AGENT__OIDC__AUDIENCE`. The full client / mapper / role reference — and how to use a
non-Keycloak provider — is in [OIDC provider configuration](oidc.md). The shipped realm is a
**minimal example** (only the `personal-agent-*` clients, with placeholder origins) — fine for dev,
but configure your own for production.

## Next steps

- [Configuration reference](configuration.md) — every environment variable and the SPA runtime config.
- [OIDC provider configuration](oidc.md) — the Keycloak realm and other identity providers.
- [Client apps](client-apps.md) — build the desktop, browser-extension and Android clients for your instance.
