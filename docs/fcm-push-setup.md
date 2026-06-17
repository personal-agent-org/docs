# Enabling FCM push (companion app)

The Android companion app has **two push paths**:

- **WebSocket (default, FOSS).** A foreground `Service` holds a socket on
  `/api/v1/ws`. Works with no external service — this is the `minimal`
  (F-Droid) flavor's only path. The socket sleeps when the screen is off or the
  network is metered, so a backgrounded phone can miss a wake.
- **FCM (optional, `full`/Play flavor).** Firebase Cloud Messaging wakes the
  phone even when the app is backgrounded and the socket is asleep. Push-worthy
  frames — including the agent's **device commands** (alarms, timers, speak,
  navigation) — are mirrored to FCM so they reach the phone reliably.

FCM is **off until configured on both sides**: the server needs a Firebase
service account, and the app's `full` build needs the matching client config.
Without either, everything degrades cleanly to the WebSocket path.

> The code is already wired end-to-end (`realtime/fcm.py`, the `push_tokens`
> registry, `PersonalAgentFcmService`). This guide is the **operational setup**.

---

## 1. Create the Firebase project

1. In the [Firebase console](https://console.firebase.google.com/) create a
   project (or reuse one). FCM uses the **HTTP v1** API — no legacy server key
   needed.
2. **Project settings → Cloud Messaging:** confirm the *Firebase Cloud
   Messaging API (V1)* is **Enabled**.
3. Register an **Android app** in the project with the companion app's
   application id (`dev.luebke.personalagent`, or your own if you re-brand it via
   the `applicationId` in `apps/android/app/build.gradle.kts`).

You do **not** need `google-services.json` — the app initializes Firebase
programmatically from four build values (see §3).

---

## 2. Server: mount the service account

1. **Project settings → Service accounts → Generate new private key.** This
   downloads a JSON file (contains `project_id`, `client_email`, `private_key`,
   `token_uri`). Treat it as a secret.
2. Mount it into **both** the `backend` and `worker` containers (both publish
   user events through the same funnel, so both need the sender) and point the
   app at it. With the bundled Compose file
   (`deploy/compose/docker-compose.prod.yml`), add a read-only mount to the
   `backend` and `worker` services and set the env var on the shared
   `x-backend-env` anchor:

   ```yaml
   x-backend-env: &backend-env
     # … existing keys …
     PERSONAL_AGENT__PUSH__FCM_CREDENTIALS_FILE: /run/secrets/fcm-service-account.json

   services:
     backend:
       # … existing config …
       volumes:
         - ./secrets/fcm-service-account.json:/run/secrets/fcm-service-account.json:ro
     worker:
       # … existing config …
       volumes:
         - ./secrets/fcm-service-account.json:/run/secrets/fcm-service-account.json:ro
   ```

   On Kubernetes, mount the JSON from a `Secret` and set the same env var via the
   Helm chart's values.

3. Restart `backend` + `worker`. On startup each logs
   `fcm_enabled project_id=…`. If the file is missing/unreadable you'll see
   `fcm_credentials_unreadable` (or nothing) and the sender stays a **no-op** —
   the app keeps working over the WebSocket.

The env var also gates an optional knob, `PERSONAL_AGENT__PUSH__TOKEN_TTL_DAYS`
(default `90`): a daily maintenance job reaps push tokens not seen for that long.
Set `0` to disable the reaper.

---

## 3. Android: build the `full` flavor with the client config

The `full` flavor reads four **gradle properties** at build time
(`apps/android/app/build.gradle.kts`). Get the values from the Firebase Android
app you registered in §1 (Project settings → General → *Your apps*):

| Gradle property              | Firebase value                          |
| ---------------------------- | --------------------------------------- |
| `personalAgentFcmProjectId`  | Project ID                              |
| `personalAgentFcmAppId`      | App ID (`1:NNN:android:…`)              |
| `personalAgentFcmApiKey`     | Web/Android API key                     |
| `personalAgentFcmSenderId`   | Project number / Sender ID              |

Build the `full` variant (not the default `minimal`), e.g.:

```bash
cd apps/android
./gradlew :app:assembleFullRelease \
  -PpersonalAgentFcmProjectId=my-project \
  -PpersonalAgentFcmAppId=1:1234567890:android:abcdef \
  -PpersonalAgentFcmApiKey=AIza… \
  -PpersonalAgentFcmSenderId=1234567890
```

Prefer keeping these in `~/.gradle/gradle.properties` or injecting them from CI
secrets rather than committing them. **Empty values ⇒ the `full` build still
compiles but runs FCM-off** (reports `push_type:"ws"` and never fetches a token),
so the build never breaks for contributors without a Firebase project.

When FCM is configured, the app's default connection mode switches to
**screen-on** (the socket can sleep because FCM wakes the phone); without it the
default stays **always-on**.

---

## 4. Verify end-to-end

1. **App registers a token.** Sign in on a `full` build. The app POSTs to
   `POST /api/v1/push/tokens` (`push_type:"fcm"`). Confirm with
   `GET /api/v1/push/tokens` (as that user) — you should see an `fcm` row.
2. **Server can send.** Trigger a push-worthy event — the simplest is an agent
   **device command** (e.g. "weck mich um 7" / set an alarm) with the app
   **backgrounded and the screen off**. The phone should wake and act. Watch the
   backend/worker logs: a failure logs `fcm_send_failed` with the FCM status; a
   dead token logs `fcm_token_unregistered_dropped` and self-heals on the next
   app launch.
3. **Quiet hours don't block commands.** Device commands bypass the notify-pref
   gate (master toggle + quiet hours) — they're functional actuation, not
   notifications — so a nightly alarm still goes through. Ordinary notifications
   continue to respect the user's quiet hours.

---

## Notes & limitations

- **One Firebase project per backend.** The sender is process-global/single
  project — fine for self-host and single-tenant. Per-org Firebase projects would
  need a rethink.
- **Payload cap.** FCM data messages cap at ~4 KB; oversized frames are skipped
  for FCM (the WebSocket still delivers them in-app) rather than rejected.
- **Command acks over FCM.** The agent waits a few seconds for the phone to
  confirm a command. FCM high-priority data messages usually arrive within
  seconds, but under Doze/throttling the agent may report the action as
  *unconfirmed* (sent, not yet acked) rather than failed — which is accurate.
