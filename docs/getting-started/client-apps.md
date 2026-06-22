# Client apps

Optional native and companion clients that connect to your instance. The web app needs none of
this — it runs in any browser. Ready-made downloads live under **Settings → App**; the steps below
are for **building your own** against your instance.

## Desktop app (Tauri)

The desktop shell wraps your live SPA and is configured at build time (`personal-agent-desktop/`):

```bash
docker build personal-agent-desktop \
  --build-arg PA_APP_URL=https://app.example.com \
  --build-arg TAURI_IDENTIFIER=com.example.personalagent.desktop \
  -t personal-agent-desktop
```

`PA_APP_URL` (defaults to `http://localhost:9000`) is your SPA's public origin; the navigation
allowlist and the Tauri `remote.urls` capability derive from it. See
`personal-agent-desktop/README.md` for the full build-arg table.

## Browser extension

The browser extension is a `kind=browser` device that acts in your logged-in browser session. It
lives in its own repository,
[`personal-agent-org/browser-extension`](https://github.com/personal-agent-org/browser-extension),
and asks for your **Server URL** and **Keycloak issuer** at runtime, so the same build works against
any instance. Its OAuth redirect URI is keyed to the extension ID and must be registered on the
`personal-agent-browser` client — see [OIDC provider configuration](../oidc.md) for the client and
redirect-URI details, and the extension repo for packaging.

## Android app

The Android WebView shell (`personal-agent-android/`) bakes its instance config at build time via
Gradle properties (example.com defaults). Copy `personal-agent-android/gradle.properties.example`
and set your values, or pass them on the command line:

```bash
./gradlew assembleMinimalRelease \
  -PpaBaseUrl=https://app.example.com \
  -PpaOidcIssuer=https://id.example.com/realms/personal-agent \
  -PpaOidcClientId=personal-agent-app
```

The app's OIDC redirect URI is `<applicationId>:/oauth/callback` (`applicationId` defaults to
`dev.luebke.personalagent`); register that exact value on the `personal-agent-app` Keycloak client
(change `applicationId` in `app/build.gradle.kts` if you fork the package name).

`assembleMinimalRelease` (the default flavor) uses the foreground-WebSocket push path and needs no
Google services. To wake a backgrounded phone via **Firebase Cloud Messaging** — and to reliably
deliver the agent's device commands (alarms, timers) when the screen is off — build the `full`
flavor and configure the server side: see [FCM push setup](../fcm-push-setup.md).
