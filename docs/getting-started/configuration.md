# Configuration

Personal Agent is **domain-agnostic**: one built image serves every deployment, and you point it at
your own domain through a handful of environment variables. Throughout the docs, `app.example.com`
and `id.example.com` are **placeholders** — substitute your own hostnames.

All backend settings use the `PERSONAL_AGENT__` env prefix (`__` nests - e.g.
`PERSONAL_AGENT__OIDC__ISSUER`). The Docker / Compose path reads them from `compose/.env` in the
`personal-agent-org/deploy` repo; the Helm chart (`charts/personal-agent` in the same repo) sets the
non-secret ones under `config.*` and the secrets under `externalSecrets.data`. The defaults are
sensible - most operators only set the domain knobs and the secrets below.

!!! note "Identity provider has its own page"
    Issuer, audience, the OIDC clients and how to use a non-Keycloak provider are documented
    separately in [OIDC provider configuration](oidc.md).

---

## Environment variables

Everything domain-specific derives from a few top-level variables (in `compose/.env`, copied
from `compose/.env.example`):

| Variable | Example | Meaning |
| --- | --- | --- |
| `APP_ORIGIN` | `https://app.example.com` | The app's public origin (SPA + API as seen by a browser / device). Sets `PERSONAL_AGENT__PUBLIC_BASE_URL`. |
| `KEYCLOAK_ORIGIN` | `https://id.example.com` | Keycloak base URL. |
| `REALM` | `personal-agent` | Keycloak realm name. |
| `OIDC_ISSUER` | `https://id.example.com/realms/personal-agent` | External OIDC issuer configured on the backend. The backend publishes its discovered client contract to every frontend. |
| `CORS_ORIGINS` | `["https://app.example.com"]` | JSON array of allowed browser origins. Usually just the app origin. Sets `PERSONAL_AGENT__SECURITY__CORS_ORIGINS`. |

### Secrets

Generate strong, unique values (e.g. `openssl rand -base64 32`):

| Variable | Meaning |
| --- | --- |
| `POSTGRES_PASSWORD` | Application database password. |
| `BYOK_MASTER_KEY` | Master key for envelope-encrypting admin-managed provider keys (sets `PERSONAL_AGENT__SECURITY__BYOK_MASTER_KEY`). Required to store/use any provider credential. |
| `WHATSAPP_WEBHOOK_SECRET` | Shared HMAC secret for the optional WhatsApp bridge webhook (sets `PERSONAL_AGENT__INTEGRATIONS__WHATSAPP_WEBHOOK_SECRET`). |

### Same-origin defaults

If the SPA, API, SSE and WebSocket are served from the **same origin** (the usual single-host
reverse-proxy setup), you only need the backend identity configuration and secrets — the browser uses
API/SSE/WS bases from `window.location` at runtime. Set the `PA_*` overrides only if the API is on a
**different** origin than the SPA:

| Variable | Default | When to set |
| --- | --- | --- |
| `PA_API_BASE` | `<origin>/api/v1` | API on a different origin. |
| `PA_SSE_BASE` | `<origin>/api/v1` | SSE on a different origin. |
| `PA_WS_BASE` | `ws(s)://<origin>/api/v1` | WS on a different origin. |
| `PA_APP_ORIGIN` | `<origin>` | Override the app origin used to build OIDC redirect URIs. |

The backend config defaults are env-driven and need no changes — only the `.env` edge values above.

---

## How the SPA gets its config

The frontend is **one static image** for every deployment. Runtime config is rendered at container
start by `compose/frontend-entrypoint.sh` (in the `personal-agent-org/deploy` repo), which writes `/config.js`
(`window.__APRIL_CONFIG__`) from the environment and then runs nginx — no rebuild per environment.

The SPA obtains authentication mode, external issuer and public client id from
`GET /api/v1/public/client-config`. It has no identity-provider URL override or fallback. When the
`PA_API_BASE` / `PA_SSE_BASE` / `PA_WS_BASE` / `PA_APP_ORIGIN` transport overrides are empty, the
entrypoint uses same-origin values from `window.location`; the redirect paths remain part of the
SPA itself.

---

## Public base URL & cloud sandboxes

`PERSONAL_AGENT__PUBLIC_BASE_URL` (set from `APP_ORIGIN`) is the origin that on-demand **cloud
coding/browser sandboxes** and **Computer Service instances** dial back to (and the SPA / browser-extension OIDC
bootstrap read it). It must be the externally reachable origin, not an internal service name; if
unset, the backend falls back to the first `CORS_ORIGINS` entry.

Inside the Compose network, spawned sandbox containers reach the backend by service name via
`PERSONAL_AGENT__SANDBOX__BACKEND_URL` (`http://backend:8000` by default) on the
`PERSONAL_AGENT__SANDBOX__NETWORK` network - that internal URL is separate from the public origin
above and normally needs no change.

By default a cloud sandbox's workspace is **ephemeral** (torn down with the container). Set
`SANDBOX_STORAGE_BACKEND` (which maps to `PERSONAL_AGENT__SANDBOX__STORAGE_BACKEND`) to persist it
and restore it into a fresh sandbox: `none` (default), `local` (a backend volume), or `s3` (an
S3/MinIO bucket, configured via the `PERSONAL_AGENT__SANDBOX__STORAGE_S3_*` settings).

The bundled web tools' outbound `User-Agent` and the Met.no weather integration's contact string
default to a generic project URL; configure a real contact on the weather integration if you use it
heavily (Met.no's ToS asks for one).

---

## LLM provider credentials

!!! warning "Not environment variables"
    LLM provider credentials are **not** env vars. They are admin-managed "platform keys" entered in
    the admin console (**Admin -> Providers**, at `/admin/providers`) and stored envelope-encrypted in
    the database using `BYOK_MASTER_KEY`. Set that secret before adding any provider; with no master
    key set, key storage is disabled.
