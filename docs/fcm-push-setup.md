# Enabling FCM push (companion app)

The Android companion app has **two push paths**:

- **WebSocket (default, FOSS).** A foreground `Service` holds a socket on
  `/api/v1/ws`. Works with no external service - this is the `minimal`
  (F-Droid) flavor's only path. The socket sleeps when the screen is off or the
  network is metered, so a backgrounded phone can miss a wake.
- **FCM (optional, `full`/Play flavor).** Firebase Cloud Messaging wakes the
  phone even when the app is backgrounded and the socket is asleep. Push-worthy
  frames - including the agent's **device commands** (`phone_command`: alarms,
  timers, speak, navigation, and more) - trigger an FCM wake so they reach the
  phone reliably. The FCM message itself carries no content (see "wake-and-fetch"
  below); it only nudges the phone to fetch the real frame over its own
  authenticated channel.

FCM is **off until configured on both sides**: the server needs a Firebase
service account, and the app's `full` build needs the matching client config.
Without either, everything degrades cleanly to the WebSocket path.

> The code is already wired end-to-end: the server sender lives in
> `realtime/fcm.py` and is fanned out from the single `publish_user_event` funnel
> (`realtime/bus/user_events.py`); the `push_tokens` table backs the registry; the
> app's `PersonalAgentFcmService` receives the wake. This guide is the
> **operational setup**.

---

## 1. Create the Firebase project

1. In the [Firebase console](https://console.firebase.google.com/) create a
   project (or reuse one). FCM uses the **HTTP v1** API - no legacy server key
   needed.
2. **Project settings → Cloud Messaging:** confirm the *Firebase Cloud
   Messaging API (V1)* is **Enabled**.
3. Register an **Android app** in the project with the companion app's
   application id (`org.personalagent.android`, or your own if you re-brand it via
   the `applicationId` in `app/build.gradle.kts` in the Android app repo,
   `personal-agent-org/android`).

You do **not** need `google-services.json` - the app initializes Firebase
programmatically from four build values (see §3).

---

## 2. Server: mount the service account

1. **Project settings → Service accounts → Generate new private key.** This
   downloads a JSON file (contains `project_id`, `client_email`, `private_key`,
   `token_uri`). Treat it as a secret.
2. Mount it into **both** the `backend` and `worker` containers (both publish
   user events through the same funnel, so both need the sender) and point the
   app at it. With the bundled Compose file in the `personal-agent-org/deploy`
   repo (`compose/docker-compose.prod.yml`), add a read-only mount to the
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
   `fcm_credentials_unreadable` (or nothing) and the sender stays a **no-op** -
   the app keeps working over the WebSocket.

The env var also gates an optional knob, `PERSONAL_AGENT__PUSH__TOKEN_TTL_DAYS`
(default `90`): a daily maintenance job reaps push tokens not seen for that long.
Set `0` to disable the reaper.

---

## 3. Android: build the `full` flavor with the client config

The `full` flavor reads four **gradle properties** at build time
(`app/build.gradle.kts` in the Android app repo, `personal-agent-org/android`). Get the values from
the Firebase Android app you registered in §1 (Project settings → General → *Your apps*):

| Gradle property              | Firebase value                          |
| ---------------------------- | --------------------------------------- |
| `personalAgentFcmProjectId`  | Project ID                              |
| `personalAgentFcmAppId`      | App ID (`1:NNN:android:…`)              |
| `personalAgentFcmApiKey`     | Web/Android API key                     |
| `personalAgentFcmSenderId`   | Project number / Sender ID              |

Build the `full` variant (not the default `minimal`), e.g.:

```bash
# in a clone of personal-agent-org/android:
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
   `GET /api/v1/push/tokens` (as that user) - you should see an `fcm` row (the
   token is returned only as its `last4`, never in full). Tokens deregister via
   `DELETE /api/v1/push/tokens/{token}`.
2. **Server can send.** Trigger a push-worthy event - the simplest is an agent
   **device command** (e.g. "weck mich um 7" / set an alarm) with the app
   **backgrounded and the screen off**. The phone should wake and act. Watch the
   backend/worker logs: a failure logs `fcm_send_failed` with the FCM status; a
   dead token (a 404/410 or an `UNREGISTERED` response) logs
   `fcm_token_unregistered_dropped`, deletes the row, and self-heals on the next
   app launch.
3. **Quiet hours don't block commands.** `phone_command` frames bypass the
   notify-pref gate (master toggle + per-event toggle + quiet hours) - they're
   functional actuation the user explicitly asked for, not notifications - so a
   nightly alarm still goes through. Every other push-worthy frame respects the
   gate (the in-app WebSocket publish is never suppressed, only the FCM wake).

---

## Notes & limitations

- **One Firebase project per backend.** The sender is process-global/single
  project - fine for self-host and single-tenant. Per-org Firebase projects would
  need a rethink.
- **Wake-and-fetch (content stays off Google).** The FCM data message carries
  only `{type, payload_id}`, never the notification content. The full frame is
  stashed in Redis under an owner-scoped key (1-hour TTL,
  `PUSH_PAYLOAD_TTL_SECONDS`); the app fetches it via
  `GET /api/v1/push/payload/{payload_id}` over its own authenticated connection,
  so the content never transits FCM/Google. An expired/unknown id is a 404.
- **Payload cap.** The wake frame is tiny, but the sender still enforces a ~3.8 KB
  safety cap (`_MAX_DATA_BYTES`): an oversized frame is logged (`fcm_frame_too_large`)
  and skipped for FCM rather than rejected - the WebSocket still delivers it in-app.
- **Command acks over FCM.** The agent waits a few seconds for the phone to
  confirm a command. FCM high-priority data messages usually arrive within
  seconds, but under Doze/throttling the agent may report the action as
  *unconfirmed* (sent, not yet acked) rather than failed - which is accurate.
