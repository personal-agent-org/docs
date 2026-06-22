# Configuration

Personal Agent is **domain-agnostic**: one built image serves every deployment, and you point it at
your own domain through a handful of environment variables. Throughout the docs, `app.example.com`
and `id.example.com` are **placeholders** — substitute your own hostnames.

All backend settings use the `PERSONAL_AGENT__` env prefix (`__` nests — e.g.
`PERSONAL_AGENT__OIDC__ISSUER`). The Docker / Compose path reads them from `deploy/compose/.env`;
the Helm chart sets the non-secret ones under `config.*` and the secrets under
`externalSecrets.data`. The defaults are sensible — most operators only set the domain knobs and the
secrets below.

!!! note "Identity provider has its own page"
    Issuer, audience, the OIDC clients and how to use a non-Keycloak provider are documented
    separately in [OIDC provider configuration](../oidc.md).

---

## Environment variables

Everything domain-specific derives from a few top-level variables (in `deploy/compose/.env`, copied
from `deploy/compose/.env.example`):

| Variable | Example | Meaning |
| --- | --- | --- |
| `APP_ORIGIN` | `https://app.example.com` | The app's public origin (SPA + API as seen by a browser / device). Sets `PERSONAL_AGENT__PUBLIC_BASE_URL`. |
| `KEYCLOAK_ORIGIN` | `https://id.example.com` | Keycloak base URL. |
| `REALM` | `personal-agent` | Keycloak realm name. |
| `OIDC_ISSUER` | `https://id.example.com/realms/personal-agent` | The OIDC issuer = `${KEYCLOAK_ORIGIN}/realms/${REALM}`. Compose does **not** expand variables inside `.env`, so write the full value. Sets `PERSONAL_AGENT__OIDC__ISSUER` (backend) and `PA_OIDC_AUTHORITY` (SPA). |
| `CORS_ORIGINS` | `["https://app.example.com"]` | JSON array of allowed browser origins. Usually just the app origin. Sets `PERSONAL_AGENT__SECURITY__CORS_ORIGINS`. |

### Secrets

Generate strong, unique values (e.g. `openssl rand -base64 32`):

| Variable | Meaning |
| --- | --- |
| `POSTGRES_PASSWORD` | Application database password. |
| `BYOK_MASTER_KEY` | Master key for envelope-encrypting admin-managed provider keys. Required to store/use any provider credential. |
| `WHATSAPP_WEBHOOK_SECRET` | Shared HMAC secret for the optional WhatsApp bridge webhook. |

### Same-origin defaults

If the SPA, API, SSE and WebSocket are served from the **same origin** (the usual single-host
reverse-proxy setup), you only need the OIDC issuer and the secrets — the browser derives the
API/SSE/WS bases from `window.location` at runtime. Set the `PA_*` overrides only if the API is on a
**different** origin than the SPA:

| Variable | Default | When to set |
| --- | --- | --- |
| `PA_API_BASE` | `<origin>/api/v1` | API on a different origin. |
| `PA_SSE_BASE` | `<origin>/api/v1` | SSE on a different origin. |
| `PA_WS_BASE` | `ws(s)://<origin>/api/v1` | WS on a different origin. |
| `PA_APP_ORIGIN` | `<origin>` | Override the app origin used to build OIDC redirect URIs. |
| `PA_OIDC_CLIENT_ID` | `personal-agent-spa` | The SPA's Keycloak public client id. |

The backend config defaults are env-driven and need no changes — only the `.env` edge values above.

---

## How the SPA gets its config

The frontend is **one static image** for every deployment. Runtime config is rendered at container
start by `deploy/compose/frontend-entrypoint.sh`, which writes `/config.js`
(`window.__APRIL_CONFIG__`) from the environment and then runs nginx — no rebuild per environment.

The only value the browser cannot derive on its own is the OIDC authority, so `PA_OIDC_AUTHORITY`
(wired to `OIDC_ISSUER` in the Compose file) is **required**. When the `PA_API_BASE` / `PA_SSE_BASE`
/ `PA_WS_BASE` / `PA_APP_ORIGIN` overrides are empty, the entrypoint emits JavaScript that derives
same-origin values from `window.location`; the OIDC redirect URIs (`/auth/callback`, logout `/`) are
derived the same way. So a single-host reverse-proxy deployment only needs the issuer.

---

## Public base URL & cloud sandboxes

`PERSONAL_AGENT__PUBLIC_BASE_URL` (set from `APP_ORIGIN`) is the origin that on-demand **cloud
coding/browser sandboxes** and **device agents** dial back to (and the SPA / browser-extension OIDC
bootstrap read it). It must be the externally reachable origin, not an internal service name; if
unset, the backend falls back to the first `CORS_ORIGINS` entry.

Inside the Compose network, spawned sandbox containers reach the backend by service name via
`PERSONAL_AGENT__SANDBOX_BACKEND_URL` (`http://backend:8000` by default) on the
`PERSONAL_AGENT__SANDBOX_NETWORK` network — that internal URL is separate from the public origin
above and normally needs no change.

The bundled web tools' outbound `User-Agent` and the Met.no weather integration's contact string
default to a generic project URL; configure a real contact on the weather integration if you use it
heavily (Met.no's ToS asks for one).

---

## LLM provider credentials

!!! warning "Not environment variables"
    LLM provider credentials are **not** env vars. They are admin-managed "platform keys" entered in
    the admin UI (**Settings → Providers**) and stored envelope-encrypted in the database using
    `BYOK_MASTER_KEY`. Set that secret before adding any provider.
