# Client apps

Optional native and companion clients that connect to your instance. The web app needs none of
this — it runs in any browser. Ready-made downloads live under **Settings → App**; the steps below
are for **building your own** against your instance.

## Desktop app (Tauri)

The desktop app is a native Tauri v2 shell (Linux) that loads your live SPA. It lives in its
own repository,
[`personal-agent-org/desktop`](https://github.com/personal-agent-org/desktop). You enter your
**Server URL** on first launch and can change it later from the tray. It surfaces background
pushes as native OS notifications and keeps the SPA's in-window Keycloak login.

Build it with the repo's Docker image (produces an AppImage + `.deb`):

```bash
docker build -t personal-agent-desktop .
```

See the repo's `README.md` for the build details and the optional `TAURI_IDENTIFIER` build-arg.

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
