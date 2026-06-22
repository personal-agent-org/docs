# OIDC provider configuration

Personal Agent authenticates every user and client with **OpenID Connect**. The API is a
**bearer-only resource server**: it never runs a login itself — it only *validates* the access
tokens that your identity provider (IdP) issues, on every request. **Keycloak** is the reference
IdP and ships as realm-as-code, but any standards-compliant OIDC provider works as long as it can
mint access tokens in the shape described in [§2](#2-the-token-contract).

This page is the canonical reference for that setup. For *how* the bundled Keycloak realm is
imported, see the realm-import steps for [Docker](getting-started/docker.md#keycloak-realm) and
[Kubernetes](getting-started/kubernetes.md#install-order).

---

## 1. How authentication works

- The browser/app logs in against your IdP with **authorization-code + PKCE** (public clients, no
  secret). Headless clients (the device agent, MCP) use the **device authorization grant**.
- The client receives an **access token** audienced to the API and sends it as a
  `Authorization: Bearer …` header (for WebSockets, via the `Sec-WebSocket-Protocol` subprotocol —
  never a query string).
- The API verifies the token's **signature, issuer, audience and expiry** with **RS256** keys
  fetched from the IdP's JWKS endpoint (discovered from
  `{issuer}/.well-known/openid-configuration`), then derives the user's identity, org and roles from
  the token's claims. There is no server-side session.
- Users are **provisioned lazily** on first request (keyed by the `sub` claim); you do not
  pre-create them in Personal Agent — you manage them in your IdP.

!!! note "JWKS is a soft dependency"
    The API's readiness probe (`/readyz`) gates only on **Postgres + Redis**. The IdP/JWKS is a
    *soft* dependency reported by `/health/deps` (`jwks_ready`), so a Keycloak blip never takes the
    API offline — the next request just re-fetches the keys.

---

## 2. The token contract

Every access token the API accepts **must** be an RS256 JWT with these claims:

| Claim | Required | Value / shape | Used for |
| --- | --- | --- | --- |
| `sub` | **yes** | stable subject id | the user's primary key (lazy provisioning, ownership of all data) |
| `iss` | **yes** | exactly your issuer (`PERSONAL_AGENT__OIDC__ISSUER`) | issuer validation |
| `aud` | **yes** | must contain `personal-agent-api` (`PERSONAL_AGENT__OIDC__AUDIENCE`) | resource-server audience |
| `exp`, `iat` | **yes** | standard | expiry / freshness |
| `organization` | optional | org id(s) — string, array, or object keyed by org id | multi-tenant; validated against the `X-Personal-Agent-Org` header |
| `realm_access.roles` and/or `resource_access.personal-agent-api.roles` | optional | array of role names; include `admin` for platform admins (`org-admin`, `user` also recognised) | authorization (admin features) |
| `groups` | optional | array of full group paths, e.g. `["/Engineering"]` | group-shared content + per-group roles |
| `email` | optional | user email | stored on the user record (informational) |

!!! warning "The four non-negotiables"
    1. The token is signed with **RS256** and verifiable against the IdP's JWKS.
    2. `iss` equals `PERSONAL_AGENT__OIDC__ISSUER` **exactly** (scheme, host, path).
    3. `aud` contains **`personal-agent-api`** — a token audienced only to the SPA/public client is
       rejected. Most IdPs need an explicit *audience mapper* (Keycloak) or *API/resource* request
       (others) to add this.
    4. The JWKS URL is reachable over **HTTPS** (HTTP is allowed only in dev).

Anything not in the *required* rows is optional: a single-user / single-tenant instance works with
no `organization`, `groups`, or role claims at all (the user is a normal non-admin user in the
default org). OAuth **scopes are not enforced** by the API — `offline_access` and refresh tokens are
handled entirely client-side and never reach the backend.

---

## 3. Backend settings

All under the `PERSONAL_AGENT__OIDC__` env prefix (`__` nests). Most self-hosters only set the
issuer (via the `OIDC_ISSUER` Compose alias) and leave the rest at their defaults.

| Setting | Default | Meaning |
| --- | --- | --- |
| `PERSONAL_AGENT__OIDC__ISSUER` | `http://localhost:8080/realms/personal-agent` | Issuer URL; JWKS is discovered from it. Set to `${KEYCLOAK_ORIGIN}/realms/${REALM}`. |
| `PERSONAL_AGENT__OIDC__AUDIENCE` | `personal-agent-api` | Required `aud`. Change only if your IdP emits a different audience identifier. |
| `PERSONAL_AGENT__OIDC__SPA_CLIENT_ID` | `personal-agent-spa` | Public client id advertised to the web SPA. |
| `PERSONAL_AGENT__OIDC__BROWSER_CLIENT_ID` | `personal-agent-browser` | Public client id for the browser extension. |
| `PERSONAL_AGENT__OIDC__ANDROID_CLIENT_ID` | `personal-agent-app` | Public client id for the Android shell. |
| `PERSONAL_AGENT__OIDC__ALGORITHMS` | `RS256` | Accepted signing algorithms. |
| `PERSONAL_AGENT__OIDC__JWKS_CACHE_SECONDS` | `300` | JWKS cache TTL. |
| `PERSONAL_AGENT__OIDC__ORG_HEADER` | `X-Personal-Agent-Org` | Header the SPA sends to select the active org. |

The Compose `.env` exposes the common ones as plain knobs — `OIDC_ISSUER` (feeds both the backend
issuer and the SPA's `PA_OIDC_AUTHORITY`), `KEYCLOAK_ORIGIN`, `REALM`, `PA_OIDC_CLIENT_ID`. See the
[Configuration reference](getting-started/configuration.md#environment-variables).

---

## 4. Keycloak (the reference setup)

The fastest path is to **import the shipped realm** and re-point its hostnames to your domain — see
the realm-import steps for [Docker](getting-started/docker.md#keycloak-realm) and
[Kubernetes](getting-started/kubernetes.md#install-order). The rest of this section documents what
that realm contains, so you can verify it or build it by hand on an existing Keycloak.

### Clients

The realm `personal-agent` defines one resource server plus a public client per front end. All are
**public** (PKCE, no secret) except the API, which is **bearer-only**.

| Client | Access type | Flow | Used by |
| --- | --- | --- | --- |
| `personal-agent-api` | bearer-only (confidential) | — (validates tokens) | the FastAPI backend — **this is the audience** |
| `personal-agent-spa` | public, PKCE S256 | auth-code | the web SPA |
| `personal-agent-device` | public | **device grant** | the Rust device agent (headless) |
| `personal-agent-browser` | public, PKCE S256 | auth-code | the browser extension |
| `personal-agent-app` | public, PKCE S256 | auth-code | the Android shell (custom redirect scheme) |
| `personal-agent-mcp` | public, PKCE S256 | auth-code **and** device grant | external MCP clients (Claude, Cursor, …) |

Each **login** client (everything except `personal-agent-api`) needs, in addition to its
redirect URIs and web origins:

- an **audience mapper** that injects `aud=personal-agent-api` into the access token (in the shipped
  realm this is a per-client `oidc-audience-mapper` — there is no shared scope for it). Without it,
  tokens are audienced to the public client and the API rejects them;
- the default **`roles`** client scope (carries `realm_access.roles` / `resource_access`);
- for auth-code clients, **PKCE method S256**;
- (multi-tenant only) the optional **`organization`** scope, requested by the client;
- (optional) a **group-membership mapper** emitting full paths into `groups`.

!!! note "Exact redirect URIs"
    Keycloak only honours a *trailing* `*` in a redirect URI — a mid-host wildcard
    (`https://*.example.com/*`) is rejected at the authorize step. Register each exact host:
    `${APP_ORIGIN}/*` + `${APP_ORIGIN}/auth/callback` for the SPA, the
    `https://<ext-id>.chromiumapp.org/` host for the extension (see the
    [extension repo](https://github.com/personal-agent-org/browser-extension)), and the Android
    custom-scheme callback.

### Roles → admin

Create the realm roles `admin`, `org-admin`, `user`. The backend grants **platform admin** to any
token whose `realm_access.roles` **or** `resource_access.personal-agent-api.roles` contains the role
named **`admin`** (case-insensitive). Assign `admin` to your administrator(s); everyone
authenticated is implicitly a normal `user`. There is **no** admin-by-group and no standalone admin
claim.

### Organizations → tenancy (multi-tenant only)

For a multi-tenant instance, enable **Keycloak Organizations**, add the `organization` client scope
(an `oidc-organization-membership-mapper` emitting the `organization` claim), and have clients
request `scope=organization`. The SPA then sends the active org in the `X-Personal-Agent-Org`
header, which the API validates against the token's `organization` claim every request (Postgres
row-level security enforces it as defense-in-depth). **Single-tenant instances skip this entirely** —
with no `organization` claim the user simply operates without an org scope.

### Groups (optional)

Add a **Group Membership** mapper (full path, claim name `groups`) to enable group-shared chats,
workflows and folders. The shipped realm also gates *which* app a user may log into by group →
realm-role (e.g. membership in group *Personal Agent* → role `app-pa`) via a Keycloak browser-flow
override; that gating is **Keycloak-side, not enforced by the backend**, so omit it if you don't
need per-app access control. New users get no groups by default (and self-registration is off), so
grant access by adding users to a group.

---

## 5. Using a different OIDC provider

Any OIDC provider (Auth0, Authentik, Microsoft Entra ID, Okta, Google, …) works if it produces the
[token contract](#2-the-token-contract). Map the Personal Agent clients onto your provider's
concepts:

| Personal Agent needs | Generic OIDC equivalent |
| --- | --- |
| `personal-agent-spa` (+ browser/Android) | a **public / SPA application** with **PKCE** and your redirect URIs |
| `personal-agent-api` (the audience) | an **API / resource / audience** identifier; configure the front-end app to request it so tokens carry `aud=personal-agent-api` — *or* set `PERSONAL_AGENT__OIDC__AUDIENCE` to whatever identifier your provider emits |
| `personal-agent-device`, `personal-agent-mcp` | applications enabled for the **device authorization grant** |
| `admin` role | a claim **`realm_access.roles`** (or `resource_access.personal-agent-api.roles`) containing `admin` |
| `organization` (multi-tenant) | a top-level **`organization`** claim with the user's org id(s) |
| `groups` (sharing) | a **`groups`** claim of path strings |

!!! warning "Claim shapes are Keycloak-flavoured"
    The role, org and group claims use Keycloak's nesting (`realm_access.roles`, `organization`,
    `groups`). Non-Keycloak providers rarely emit these by default — you'll need a **custom
    claim/rule/mapping** to produce exactly these names and shapes. If you can't, the affected
    feature simply stays off: no `realm_access.roles` → no admin UI; no `organization` → run
    single-tenant; no `groups` → no group sharing. Core sign-in (token with `sub` + `iss` +
    `aud=personal-agent-api`) still works.

Provider notes:

- **Authentik** is closest to Keycloak — it can emit custom property mappings for `realm_access`,
  `organization` and `groups` directly, and supports the device flow.
- **Auth0 / Okta / Entra ID** use API audiences + RBAC; add a rule/action/claim-mapping that writes
  the nested `realm_access.roles` (and, for multi-tenant, `organization`). Confirm device-flow
  support if you use the device agent or MCP.
- **Google** can sign users in (PKCE + device flow) but emits no roles/groups/org claims — fine for
  a single-user instance where you don't need the admin UI or sharing.

Whatever the provider: set `PERSONAL_AGENT__OIDC__ISSUER` to its issuer, ensure RS256 + a reachable
HTTPS JWKS, and make the tokens carry `aud=personal-agent-api`.

---

## 6. Verify it works

1. Sign in to the web app — you should land in a chat and see a session.
2. Inspect an access token (browser dev-tools, or `/api/v1/me`'s request). Decode it and confirm
   `iss` = your issuer, `aud` contains `personal-agent-api`, and (for an admin) `realm_access.roles`
   includes `admin`.
3. From a shell:
   ```bash
   curl -H "Authorization: Bearer <access-token>" https://app.example.com/api/v1/me
   ```
   A `200` with your profile means the token contract is satisfied; a `401` points at §7.
4. Open an admin-only page (e.g. **Platform settings**) as your admin user to confirm the `admin`
   role maps through.
5. `GET /health/deps` reports `jwks_ready: true` once the first token has been verified.

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `401` immediately after a successful login | `aud` ≠ `personal-agent-api` (token audienced only to the public client) | add the audience mapper / request the API audience, or set `PERSONAL_AGENT__OIDC__AUDIENCE` to your provider's value |
| `401` invalid issuer | `iss` ≠ `PERSONAL_AGENT__OIDC__ISSUER` | match the issuer exactly (scheme/host/realm path) |
| `401` signature / key errors | algorithm ≠ RS256, or JWKS unreachable/HTTP | use RS256; ensure `{issuer}/.well-known/openid-configuration` and its `jwks_uri` resolve over HTTPS |
| `403` "organization is not granted by the token" | `X-Personal-Agent-Org` value not in the token's `organization` claim | add the user to that org / emit the claim, or run single-tenant (no header) |
| Logged in but no admin features | `admin` missing from `realm_access.roles` / `resource_access.personal-agent-api.roles` | grant the `admin` realm role |
| `Invalid parameter: redirect_uri` | the exact redirect URI isn't registered | register it verbatim (no mid-host wildcards) |
| Group sharing doesn't pick up membership | no `groups` claim (full paths) | add the group-membership mapper |
