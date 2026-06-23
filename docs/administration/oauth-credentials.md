# OAuth credentials

The **OAuth credentials** page (admin console → `OAuth credentials`) stores the OAuth2
**client configuration** for integration domains that connect a user's account by signing in
at the provider (the OAuth authorization-code flow), rather than by pasting an API key.

One row per integration **domain**. When an integration's setup wizard needs OAuth, it uses
the client config registered here to send the user to the provider, capture the redirect, and
exchange + refresh tokens. The per-user tokens (access/refresh/expiry) are encrypted and stored
on that user's integration **config entry**, not here. The store is global platform config (no
org scope, no RLS); the API enforces `admin` role on every route.

## The redirect URI

The page shows a single, copy-able **redirect URI**:
`https://<your-app-origin>/oauth/callback`. Register this **exactly** in the provider's OAuth
application as an allowed redirect/callback URL; the provider rejects the login otherwise. It is
server-derived from the app's public origin (`public_base_url`, falling back to the first
configured CORS origin), so it's identical for every domain.

## Fields

| Field | Notes |
| --- | --- |
| `domain` | The integration domain these credentials belong to (the folder integration's manifest `domain`). Read-only when editing an existing row. |
| `client_id` | The OAuth app's public client id. |
| `client_secret` | The OAuth app's secret. **Write-only**: it is never returned or logged. The list view shows only whether one is set (`secret set (••••<last4>)`) or `no secret set`. Envelope-encrypted at rest with the same BYOK envelope as integration secrets (Frozen Contract #5). |
| `authorize_url` | The provider's authorization endpoint (where the user is sent to consent). |
| `token_url` | The provider's token endpoint (code-to-token exchange + refresh). |
| `scopes` | Space-separated OAuth scopes to request. |

## Actions

- **Add / edit** a domain's credentials. The save validates that `client_id`, `client_secret`,
  `authorize_url` and `token_url` are present. Because saving is a full upsert of the row, you
  must re-enter the `client_secret` every time you edit (a blank-secret save is blocked).
- **Delete** a domain's credentials.

Storing a secret requires BYOK envelope encryption to be configured; without it, saving fails
with `BYOK encryption is not configured; cannot store a client secret`.

!!! note "API"
    Backed by `GET /admin/oauth-credentials`, `GET`/`PUT`/`DELETE
    /admin/oauth-credentials/{domain}` (all `admin`-only). Set and delete are recorded in the
    audit log (`oauth_credential.set` / `oauth_credential.delete`); the secret is never included.

## How a user then connects

With credentials registered, a config flow can hand the user off to the provider via an external
step: the SPA opens the provider's authorize URL, the provider redirects back to the redirect
URI (`/oauth/callback`), and the returned `code`/`state` resume the flow to create the
integration entry with the encrypted tokens. Expired access tokens are refreshed automatically
from the stored refresh token; if a refresh fails the entry is stamped with a setup error and the
integration should surface a re-auth flow.

!!! note "No first-party OAuth integration ships yet"
    This is the platform-level plumbing. An integration only shows the Connect step once its
    config flow opts into OAuth — register credentials here for the domains that need it.
