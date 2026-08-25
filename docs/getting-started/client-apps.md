# Client apps

Optional native and companion clients that connect to your instance. The web app needs none of
this: it runs in any browser. Ready-made downloads live under **Settings → App** (desktop, Android,
browser extension, terminal client, plus the MCP server URL and access tokens). The desktop/TUI, Android
and other client artifacts are proxied by the backend from each client repo's GitHub release (the routes are
under `/api/v1/devices/...`), so the same instance always serves a matching build. The steps below
are for **building your own** against your instance.

## Desktop app (Tauri)

The desktop app is a native Tauri v2 / WebKitGTK shell (Linux, x86_64) that loads your live SPA.
It shares one repository and one `pa` binary with the terminal UI:
[`personal-agent-org/pa`](https://github.com/personal-agent-org/pa). You enter your
**Server URL** on first launch and can change it later from the tray. It surfaces background
pushes as native OS notifications and keeps the SPA's in-window Keycloak login. Builds ship as an
AppImage (the recommended download) and a `.deb`.

Build it with the repo's Docker image (produces an AppImage + `.deb`):

```bash
docker build -t personal-agent-desktop .
```

See the repo's `README.md` for the build details and the optional `TAURI_IDENTIFIER` build-arg.

## Browser extension

The browser extension is an MV3 (Chrome/Firefox) extension that connects as a `kind=browser` device
and acts in your logged-in browser session. After sign-in a "Browser" device appears under
**Settings → Devices**; pick it in a chat to give the assistant `browser_*` tools. It lives in its
own repository,
[`personal-agent-org/browser-extension`](https://github.com/personal-agent-org/browser-extension)
(Chrome Web Store for the auto-updating Chrome build, plus the Firefox build and source on GitHub),
and asks only for your **Server URL**. It discovers whether the instance uses external OIDC or the
backend's local authentication, plus all relevant endpoints and client ids. External-OIDC sign-in
uses OAuth 2 PKCE; the redirect URI is keyed to the extension ID
(`https://<ext-id>.chromiumapp.org/`) and must be registered on the `personal-agent-browser` client.
See [OIDC provider configuration](oidc.md) for the client and redirect-URI details, and the extension
repo for packaging.

## Android app

The Android app lives in its own repository,
[`personal-agent-org/android`](https://github.com/personal-agent-org/android). It's self-hostable:
build the APK once and enter your **Server URL** in-app on first launch (the OIDC issuer and client
id are discovered from the instance). Build via the repo's Docker image, or
`./gradlew assembleMinimalRelease`.

Register the app's OIDC redirect URI on the `personal-agent-app` Keycloak client. The shipped realm
templates this from `ANDROID_REDIRECT_SCHEME` (compose default `org.personalagent.android`, giving
`org.personalagent.android:/oauth/callback`); match it to your build's redirect scheme. The default
flavor (`minimal`) uses foreground-WebSocket push (no Google services); the `full` flavor adds
**Firebase Cloud Messaging** (see [FCM push setup](../fcm-push-setup.md)).

## Terminal client (TUI)

A Rust terminal chat client that speaks the **same `/api/v1` HTTP and SSE endpoints as the web app**
(no special-purpose API). It lives alongside the desktop app in
[`personal-agent-org/pa`](https://github.com/personal-agent-org/pa), and ships as the `pa` binary.
Build it with `cargo build --release`, then log in via the discovered **device flow**:

```bash
pa login --server https://pa.example.com
pa
```

The backend advertises either its local device grant or the external provider's discovered device
grant. Login acts *as the user* without a client secret. Unlike Computer Service,
`pa` is a chat client and never announces tools, sensors, or host capabilities to the backend.
The desktop offers Computer Service setup under Settings; the TUI offers
`/computer-service [device name]`. Both launch a separate one-time service enrollment after the
client has restored its normal UI/terminal state, and neither shares its chat token with the
running service.

## Use this assistant from other tools (MCP)

Your instance also exposes itself **as** an MCP server so another agent (Claude Code, Cursor, any
MCP client) can use your knowledge (entity/document search, memory, notes, commitments, chats) and
message you. It is a stateless streamable-HTTP server mounted at `/api/mcp`.

- **OAuth (recommended):** OAuth-capable clients only need the server URL; they sign in through your
  normal Keycloak login. The server advertises RFC 9728 protected-resource metadata at
  `/api/mcp/.well-known/oauth-protected-resource` and answers an unauthenticated request with a
  `401` + `WWW-Authenticate: Bearer resource_metadata=...` challenge.
- **Access token (headless fallback):** for clients that cannot do OAuth, create a Personal Access
  Token under **Settings → App** and send it as `Authorization: Bearer pa_pat_…`. Tokens are managed
  via `POST /api/v1/me/api-tokens` (plaintext shown once), `GET /api/v1/me/api-tokens`, and
  `DELETE /api/v1/me/api-tokens/{id}`; an optional `ttl_days` sets an expiry.
