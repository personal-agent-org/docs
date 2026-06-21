# OAuth credentials

The **OAuth credentials** page (admin console → `OAuth credentials`) stores the OAuth2
**client configuration** for integration domains that connect a user's account by signing in
at the provider (the OAuth authorization-code flow), rather than by pasting an API key.

One entry per integration **domain**. When an integration's setup wizard needs OAuth, it uses
the client config registered here to send the user to the provider, capture the redirect, and
exchange + refresh tokens — the per-user tokens are encrypted and stored on that user's
integration entry. It is visible only to principals holding the `admin` role.

## The redirect URI

The page shows a single, copy-able **redirect URI** —
`https://<your-app-origin>/oauth/callback`. Register this **exactly** in the provider's OAuth
application as an allowed redirect/callback URL; the provider rejects the login otherwise. It is
derived from the app's public origin, so it's the same for every domain.

## Fields

| Field | Notes |
| --- | --- |
| `domain` | The integration domain these credentials belong to (e.g. the folder integration's `domain`). |
| `client_id` | The OAuth app's public client id. |
| `client_secret` | The OAuth app's secret. **Write-only** — once saved it's shown as `•••• <last4>`; leave the field blank when editing to keep the stored value. Envelope-encrypted at rest (the same scheme as integration secrets); never returned or logged. |
| `authorize_url` | The provider's authorization endpoint (where the user is sent to consent). |
| `token_url` | The provider's token endpoint (code→token exchange + refresh). |
| `scopes` | Space-separated OAuth scopes to request. |

## Actions

- **Add / edit** a domain's credentials (the form validates that `client_id`, `client_secret`,
  `authorize_url` and `token_url` are present).
- **Delete** a domain's credentials.

## How a user then connects

With credentials registered, a user configuring that integration sees a **Connect** step in the
setup wizard: it opens the provider's login in a popup, the provider redirects back to the
redirect URI, and on success the integration entry is created with the encrypted tokens. Expired
access tokens are refreshed automatically; if a refresh fails the entry is marked for re-auth.

!!! note "No first-party OAuth integration ships yet"
    This is the platform-level plumbing. An integration only shows the Connect step once its
    config flow opts into OAuth — register credentials here for the domains that need it.
