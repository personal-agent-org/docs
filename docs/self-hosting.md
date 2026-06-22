# Self-hosting Personal Agent

Personal Agent is domain-agnostic: one built image serves every deployment, and
the operator points it at their own domain through a handful of environment
variables. Throughout this guide, `app.example.com` and `id.example.com` are
**placeholders** — substitute your own hostnames.

This guide covers the single-host **Docker Compose** path
(`deploy/compose/docker-compose.prod.yml`). The scaled-out Kubernetes path uses
the same knobs via the Helm umbrella chart (`deploy/charts/personal-agent/`); see
that chart's `values.yaml` and `README.md`.

---

## 1. Prerequisites

- **Docker** + Compose v2 (`docker compose`).
- A **reverse proxy** terminating TLS in front of the stack (Caddy, nginx,
  Traefik, …). It must:
  - route the app origin to the `frontend` container (port 80) and `/api`,
    `/webhooks`, SSE and WebSocket paths to the `backend` container (port 8000);
  - **not buffer** SSE responses and allow WebSocket upgrades.
  The reverse proxy lives outside this repo — Compose only ships the app and its
  data services.
- A reachable **Keycloak** instance (the OIDC provider). You can run your own;
  the realm is imported for you (see §5).
- Public DNS for your app and Keycloak hostnames.

The Postgres+pgvector, Redis, and a single-host Temporal dev server are bundled in
the Compose file — you don't provide those yourself.

> LLM provider credentials are **not** environment variables. They are
> admin-managed "platform keys" entered in the admin UI (Settings → Providers),
> stored envelope-encrypted in the database using `BYOK_MASTER_KEY`.

---

## 2. Canonical environment knobs

Everything domain-specific derives from a few top-level variables. They live in
`deploy/compose/.env` (copied from `deploy/compose/.env.example`):

| Variable | Example | Meaning |
| --- | --- | --- |
| `APP_ORIGIN` | `https://app.example.com` | The app's public origin (SPA + API as seen by a browser / device). Sets `PERSONAL_AGENT__PUBLIC_BASE_URL`. |
| `KEYCLOAK_ORIGIN` | `https://id.example.com` | Keycloak base URL. |
| `REALM` | `personal-agent` | Keycloak realm name. |
| `OIDC_ISSUER` | `https://id.example.com/realms/personal-agent` | The OIDC issuer = `${KEYCLOAK_ORIGIN}/realms/${REALM}`. Compose does **not** expand variables inside `.env`, so write the full value. Sets `PERSONAL_AGENT__OIDC__ISSUER` (backend) and `PA_OIDC_AUTHORITY` (SPA). |
| `CORS_ORIGINS` | `["https://app.example.com"]` | JSON array of allowed browser origins. Usually just the app origin. Sets `PERSONAL_AGENT__SECURITY__CORS_ORIGINS`. |

Secrets (generate strong, unique values, e.g. `openssl rand -base64 32`):

| Variable | Meaning |
| --- | --- |
| `POSTGRES_PASSWORD` | Application database password. |
| `BYOK_MASTER_KEY` | Master key for envelope-encrypting admin-managed provider keys. Required to store/use any provider credential. |
| `WHATSAPP_WEBHOOK_SECRET` | Shared HMAC secret for the optional WhatsApp bridge webhook. |

**Same-origin is the default.** If the SPA, API, SSE and WebSocket are served from
the same origin (the usual single-host reverse-proxy setup), you only need to set
the OIDC issuer and the secrets — the browser derives API/SSE/WS bases from
`window.location` at runtime. Only set the `PA_*` overrides below if the API is on
a different origin than the SPA.

| Variable | Default | When to set |
| --- | --- | --- |
| `PA_API_BASE` | `<origin>/api/v1` | API on a different origin. |
| `PA_SSE_BASE` | `<origin>/api/v1` | SSE on a different origin. |
| `PA_WS_BASE` | `ws(s)://<origin>/api/v1` | WS on a different origin. |
| `PA_APP_ORIGIN` | `<origin>` | Override the app origin used to build OIDC redirect URIs. |
| `PA_OIDC_CLIENT_ID` | `personal-agent-spa` | The SPA's Keycloak public client id. |

The backend config defaults are env-driven and need no changes — only the `.env`
edge values above.

---

## 3. Compose quickstart

```bash
cp deploy/compose/.env.example deploy/compose/.env
# edit deploy/compose/.env: set APP_ORIGIN, KEYCLOAK_ORIGIN, REALM, OIDC_ISSUER,
# CORS_ORIGINS, and the secrets.

docker compose -f deploy/compose/docker-compose.prod.yml up -d --build
```

This builds the backend, worker, and frontend images, runs the Alembic
`migrate` job (ordered before the API/worker start), and brings up Postgres,
Redis, and the Temporal dev server. Point your reverse proxy at the `frontend`
(`:80`) and `backend` (`:8000`) services and you're up.

Health endpoints on the backend: `GET /healthz` (liveness), `GET /readyz`
(DB + Redis), `GET /health/deps` (soft deps: Temporal, JWKS).

---

## 4. How the SPA is configured at container start

The frontend is **one static image** for every deployment. Runtime config is
rendered at container start by `deploy/compose/frontend-entrypoint.sh`, which
writes `/config.js` (`window.__APRIL_CONFIG__`) from the environment and then runs
nginx. The image needs no rebuild per environment.

The only value the browser cannot derive on its own is the OIDC authority, so
`PA_OIDC_AUTHORITY` (wired to `OIDC_ISSUER` in the Compose file) is **required**.
When the `PA_API_BASE` / `PA_SSE_BASE` / `PA_WS_BASE` / `PA_APP_ORIGIN` overrides
are empty, the entrypoint emits JavaScript that derives same-origin values from
`window.location` in the browser; the OIDC redirect URIs (`/auth/callback`, logout
`/`) are derived the same way. So a single-host reverse-proxy deployment only needs
the issuer.

---

## 5. How the Keycloak realm is imported with your domain

The realm definition lives at `keycloak/realm-personal-agent.json` and is imported
**idempotently** — you don't click through the Keycloak admin UI.

- **Compose (dev / single-host with bundled Keycloak):** the `keycloak` service
  runs `start-dev --import-realm` with the `keycloak/` directory mounted into
  `/opt/keycloak/data/import`. The realm is created (or overwritten) on start.
- **Kubernetes (Helm):** a pre-install/pre-upgrade `realm-import` Job runs
  `keycloak-config-cli` against your Keycloak (`templates/jobs/realm-import.yaml`),
  fed by a ConfigMap built from `files/realm-*.json`. It sets
  `IMPORT_VARSUBSTITUTION_ENABLED=true`, so the realm JSON may contain `${VAR}`
  placeholders that are substituted from the Job's environment, and it waits for
  Keycloak readiness via an init container before importing.

When you adapt the realm to your domain, set these per OIDC client so logins and
redirects work for your hostnames:

- the SPA client (`personal-agent-spa`): `rootUrl`, `redirectUris`
  (`https://app.example.com/*`, `https://app.example.com/auth/callback`),
  `webOrigins`, and `post.logout.redirect.uris` — point them at your `APP_ORIGIN`;
- the API resource server audience (`personal-agent-api`) — keep it matching
  `PERSONAL_AGENT__OIDC__AUDIENCE`;
- the device client (`personal-agent`) and the browser-extension client
  (`personal-agent-browser`) — see §7.

The shipped realm file carries example clients for adjacent standalone apps
(a VPN UI, an Open WebUI) that are **not** part of Personal Agent; remove or
re-point them to your own domains as needed. Either edit the JSON to your
hostnames, or (on Helm) parameterize them with `${VAR}` placeholders and supply
the values to the import Job.

---

## 6. Remote sandbox + public URL note

`PERSONAL_AGENT__PUBLIC_BASE_URL` (set from `APP_ORIGIN`) is the origin that
on-demand **cloud coding/browser sandboxes** and **device agents** use to dial
back to the backend (and the SPA / browser-extension OIDC bootstrap read it).
It must be the externally reachable origin, not an internal service name. If it is
unset, the backend falls back to the first `CORS_ORIGINS` entry.

Inside the Compose network, spawned sandbox containers reach the backend by service
name via `PERSONAL_AGENT__SANDBOX_BACKEND_URL` (`http://backend:8000` by default)
on the `PERSONAL_AGENT__SANDBOX_NETWORK` network — that internal URL is separate
from the public origin above and normally needs no change.

The bundled web tools' outbound `User-Agent` and the Met.no weather integration's
contact string default to a generic project URL; configure a real contact on the
weather integration if you use it heavily (Met.no's ToS asks for one).

---

## 7. Building the client apps for your instance

### Desktop app (Tauri)

The desktop shell wraps your live SPA and is configured at build time
(`personal-agent-desktop/`). Build with:

```bash
docker build personal-agent-desktop \
  --build-arg PA_APP_URL=https://app.example.com \
  --build-arg TAURI_IDENTIFIER=com.example.personalagent.desktop \
  -t personal-agent-desktop
```

`PA_APP_URL` (defaults to `http://localhost:9000`) is your SPA's public origin;
the navigation allowlist and the Tauri `remote.urls` capability derive from it.
See `personal-agent-desktop/README.md` for the full build-arg table.

### Browser extension (Chrome MV3)

The extension is a `kind=browser` device that acts in your logged-in browser
session. At runtime it asks for your **Server URL** (your `APP_ORIGIN`) and
**Keycloak issuer** (your `OIDC_ISSUER`), so the same build works against any
instance. Two things must match your Keycloak realm:

- a public client `personal-agent-browser` (auth-code + PKCE, no secret) with
  audience `personal-agent-api`;
- the extension's OAuth **redirect URI**, which is keyed to its extension ID.
  Keycloak rejects mid-host wildcards, so the **exact** host must be listed. The
  shipped `manifest.json` `key` pins the published Chrome Web Store ID; to run your
  own build with a different, stable ID, replace the `key` (generate one with
  `chromium --pack-extension`, then
  `openssl rsa … -pubout -outform DER | base64 -w0`) and add its
  `chrome.identity.getRedirectURL()` value (`https://<ID>.chromiumapp.org/` and
  `…/*`) to the client. Firefox derives a separate
  `https://<hash>.extensions.allizom.org/` redirect from its add-on id — add that
  host too if you ship the Firefox build.

See the browser extension repo
([`personal-agent-org/browser-extension`](https://github.com/personal-agent-org/browser-extension))
for packaging details.

### Android app

The Android WebView shell (`personal-agent-android/`) bakes its instance config
at build time via Gradle properties (example.com defaults). Copy
`personal-agent-android/gradle.properties.example` and set your values, or pass
them on the command line:

```bash
./gradlew assembleMinimalRelease \
  -PpaBaseUrl=https://app.example.com \
  -PpaOidcIssuer=https://id.example.com/realms/personal-agent \
  -PpaOidcClientId=personal-agent-app
```

The app's OIDC redirect URI is `<applicationId>:/oauth/callback`
(`applicationId` defaults to `dev.luebke.personalagent`); register that exact
value on the `personal-agent-app` Keycloak client (change `applicationId` in
`app/build.gradle.kts` if you fork the package name).

`assembleMinimalRelease` (the default flavor) uses the foreground-WebSocket push
path and needs no Google services. To wake a backgrounded phone via **Firebase
Cloud Messaging** — and to reliably deliver the agent's device commands (alarms,
timers) when the screen is off — build the `full` flavor and configure the
server side: see [FCM push setup](fcm-push-setup.md).
