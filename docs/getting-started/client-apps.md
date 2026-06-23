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
`personal-agent-browser` client — see [OIDC provider configuration](oidc.md) for the client and
redirect-URI details, and the extension repo for packaging.

## Android app

The Android app lives in its own repository,
[`personal-agent-org/android`](https://github.com/personal-agent-org/android). It's self-hostable:
build the APK once and enter your **Server URL** in-app on first launch (the OIDC issuer and client
id are discovered from the instance). Build via the repo's Docker image, or
`./gradlew assembleMinimalRelease`.

Register the app's OIDC redirect URI `org.personalagent.android:/oauth/callback` on the
`personal-agent-app` Keycloak client. The default flavor uses foreground-WebSocket push (no Google
services); the `full` flavor adds **Firebase Cloud Messaging** (see [FCM push setup](../fcm-push-setup.md)).
