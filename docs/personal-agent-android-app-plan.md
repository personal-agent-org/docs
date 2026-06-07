# Implementierungsplan: aipril Companion App (Android-first)

> **Prinzip (von Home Assistant übernommen):** Eine native Android-Shell wrappt die **bestehende aipril-Quasar-SPA** in einer WebView und ergänzt sie um native Integrationen (Push, Voice/Wake-Word, Sensoren, Deep-Links). Das ist exakt das Modell der HA-App: `WebViewActivity` hostet das HA-Frontend, ein **External Bus** (JS-Bridge) verbindet Web ↔ Native, der Rest (Sensoren, Notifications, Voice) lebt nativ. Wir kopieren die Seams, ersetzen aber HA-spezifische Mechanismen (OAuth/IndieAuth, Multi-*Server*) durch aipril-Äquivalente (Keycloak/OIDC, Multi-*Org*).

---

## 0. Zielbild & Leitentscheidungen

| Thema | HA-Muster (Quelle) | aipril-Entscheidung |
|---|---|---|
| Shell | Kotlin + WebView in Compose-Activity (`WebViewActivity.kt`, `WebViewContentScreen.kt`) | **Identisch**: Kotlin, Jetpack Compose, eine WebView-Host-Activity, die `https://aipril.luebke.dev` lädt |
| Web vs. Native | UI/State/Logik bleiben im Frontend; nur OS-Capabilities nativ | **Identisch**: Quasar-SPA bleibt vollständig die UI. Nativ nur: Auth-Storage, Push, Voice-Capture, Sensoren, Datei/Share, Deep-Links |
| Bridge | External Bus V1 (`addJavascriptInterface`) + V2 (`WebViewCompat.addWebMessageListener`) | **V1 zuerst** (`addJavascriptInterface("aiprilNative")`), V2 als späterer Hardening-Schritt |
| Auth | OAuth authorization_code, WebView-Redirect-Intercept, Token in Room+Keystore | **AppAuth/OIDC gegen Keycloak**, Token in **EncryptedSharedPreferences**, Handoff in die SPA via Bridge |
| Multi-* | Multi-**Server** (`ServerManager`, serverId) | aipril = **ein Server, mehrere Orgs**. Kein Server-Picker; stattdessen Org-Auswahl bleibt in der SPA (`X-Aipril-Org`). Multi-Server bewusst out-of-scope (siehe Risiken) |
| Push | FCM (full) + WebSocket-Fallback (minimal/FOSS) (`FirebaseCloudMessagingService.kt`, `WebsocketManager.kt`) | **Identisches Dual-Path**: FCM-Flavor + FOSS-Flavor über aipril-Control-WS `/api/v1/ws` + `user_events_channel` |
| Build | Multi-Modul + Convention-Plugins + Full/Minimal-Flavors (`build-logic/`) | **Übernommen, verschlankt** (3 Module statt 8) |

**Cross-Platform:** Android zuerst. iOS später als analoge `WKWebView`-Shell (gleiche Bridge-Verträge, gleiche Server-Endpunkte). Wear/Automotive ausdrücklich Post-MVP.

---

## 1. Prinzip & Architektur

### 1.1 Was bleibt Web, was wird nativ

**Bleibt Web (Quasar-SPA, unverändert bedient):** komplette Chat-UI, Streaming-Rendering (SSE), Markstream, Settings, Entities/Automations-UI, Drafts/Comms, Device-Agents-UI, Org-Wahl. Die SPA ist bereits responsive — das ist die Voraussetzung, die HA ebenfalls nutzt (Frontend ist mobile-optimiert und wird 1:1 in die WebView geladen).

**Wird nativ:**
- WebView-Hosting + TLS/Cookie/Header-Handling (vgl. `TLSWebViewClient.kt`, `HAWebViewClient.kt`)
- OIDC-Login-Flow + verschlüsselte Token-Persistenz + Token-Handoff in die SPA (vgl. `ServerSessionManager.kt` / `getExternalAuth`)
- Push-Empfang (FCM + WS-Fallback) und Rendering als native Notifications inkl. Action-Buttons (vgl. `MessagingManager.kt`, `NotificationActionReceiver.kt`)
- Voice-Capture (Mikrofon, optionales On-Device-Wake-Word) (vgl. `microwakeword/`, `WakeWordListener.kt`, `AssistViewModelBase.kt`)
- Phone-als-Entity-Sensoren (opt-in) (vgl. `SensorManager.kt`, `SensorWorker.kt`)
- Datei-Upload/Kamera/Download/Share/Deep-Links (vgl. External-Bus File-Handling in `WebViewActivity.kt`)

### 1.2 Empfohlener Stack

- **Sprache/UI:** Kotlin, Jetpack Compose (Material3), eine `MainActivity`/`WebViewActivity` als Host (analog HAs Trennung *Activity = Lifecycle* vs. *Compose = UI* in `WebViewActivity.kt` + `WebViewContentScreen.kt`).
- **DI:** Hilt (wie HA), aber nur ein `SingletonComponent`-Graph. Kein Room nötig im MVP (HA braucht Room für Sensor/Notification-History; aipril hält Zustand serverseitig). **Persistenz im MVP = EncryptedSharedPreferences** (Tokens, Push-Token, Settings). Room nur einführen, falls Sensor-Historie/Outbox (Phase 6) es verlangt.
- **Networking:** OkHttp + Retrofit (wie HA) — nur für native Calls (OIDC-Token-Endpoint, aipril Push-Register, FCM-loses WS). Die SPA macht ihre eigenen HTTP-Calls in der WebView.
- **WS:** OkHttp-WebSocket für den FOSS-Push-Pfad (analog `WebsocketManager.kt`).
- **AppAuth:** `net.openid:appauth` für den OIDC-Code-Flow gegen Keycloak.
- **Coroutines/Flow** für Pipeline-/Event-Streams (wie HA).

### 1.3 Modul-Layout (verschlankt aus HAs `build-logic`-Ansatz)

HA hat 8 Module; aipril braucht im MVP **3**, mit der gleichen Convention-Plugin-Idee (`AndroidApplicationConventionPlugin.kt`, `AndroidFullMinimalFlavorConventionPlugin.kt`), um Flavor-Boilerplate zentral zu halten:

```
personal-agent-android/
  build-logic/                      # Convention-Plugins (Application, Flavor full/minimal)
  :app                              # WebView-Host, Bridge, Onboarding, Notifications-Rendering, Voice-UI
      src/main                      # gemeinsamer Code
      src/full     (FCM/GMS)        # FirebaseMessagingService, Play-Services
      src/minimal  (FOSS)           # MinimalApplicationModule: leerer Push-Token, WS-Push always-on
  :common                           # Auth (AppAuth), Bridge-Verträge, OkHttp/Retrofit, EncryptedPrefs, WS-Client
  :wakeword         (später)        # optional, C++/TFLite-Micro analog HAs :microwakeword
```

**Flavors `full` vs `minimal`** sind direkt aus HA übernommen (`app/src/full` vs `app/src/minimal`, `FullApplicationModule.kt` vs `MinimalApplicationModule.kt`): *full* = Google Play, mit FCM/GMS; *minimal* = F-Droid/FOSS, ohne GMS, Push ausschließlich über aiprils Control-WS. Beide teilen `src/main`.

---

## 2. WebView-Host + Native↔JS-Bridge

### 2.1 WebView-Host

Eine Compose-Activity lädt `AIPRIL_BASE_URL` (`https://aipril.luebke.dev`). Wir übernehmen aus `WebViewActivity.kt`:
- **Activity hält Lifecycle/Fehlerbehandlung**, Compose rendert (`WebViewContentScreen.kt`).
- **Custom `WebViewClient`** (analog `HAWebViewClient.kt`): Fehlertypisierung (`SSL`, `AUTHENTICATION`, `TIMEOUT`), gefiltert nach Host, damit Subresource-Fehler keine Fehlerseite triggern.
- **`WebChromeClient`** für `onShowFileChooser` (Datei-Upload/Kamera), `onPermissionRequest` (Mikrofon-Permission für WebRTC/`getUserMedia` der SPA — wichtig, da aiprils STT im Browser läuft).
- **Cookie/Header-Injection** statt mTLS: aipril nutzt Keycloak-Bearer-JWT, **keine** Client-Zertifikate. Wir injizieren den Bearer-Token nicht pauschal in jeden Request (die SPA/oidc-client macht das selbst), sondern liefern ihn **on demand** über die Bridge (`getExternalAuth`, s. u.) — exakt HAs Modell (`ServerSessionManager` antwortet auf `getExternalAuth`).
- **JS-Settings:** `domStorageEnabled = true` (oidc-client braucht localStorage/sessionStorage), `javaScriptEnabled`, `mediaPlaybackRequiresUserGesture = false` (für TTS-Autoplay).

### 2.2 Bridge-Vertrag (External Bus, V1)

Native exponiert `window.aiprilNative` via `addJavascriptInterface` (HAs `externalApp`-Muster, `FrontendJsBridge.kt`). Nachrichten folgen HAs Discriminator-Design (`id + type + command/result`, `ExternalBusMessage.kt`): die SPA sendet `{id, type, payload}`, Native antwortet asynchron via `evaluateJavascript(window.aiprilNativeCallback(...))`.

**SPA → Native (Commands):**

| Command | Zweck | HA-Analogon |
|---|---|---|
| `config/get` | Native meldet Capabilities: `hasMic`, `hasNotifications`, `hasWakeWord`, `hasDeviceSensors`, `pushType` (`fcm`/`ws`), `appVersion`, `safeArea` | HAs `config/get` (`has-mic`, `has-play-stream`, …) |
| `getExternalAuth` | Native liefert gültigen Access-Token `{access_token, expires_in}` (Refresh falls abgelaufen) | `getExternalAuth` / `ServerSessionManager` |
| `revokeExternalAuth` | Logout, Token löschen | `revokeExternalAuth` |
| `theme-update` | SPA meldet aktuelle Theme-Farbe → Native färbt Statusleiste/Splash | HA theme-color extraction |
| `haptic` | Vibrationsfeedback | HA `haptic` |
| `notifications/request-permission` | nativen Permission-Dialog (Android 13+ `POST_NOTIFICATIONS`) zeigen | HA notifications-permission |
| `push/register` | Push-Token-Registrierung anstoßen (s. §4) | HA FCM-Registration |
| `voice/show` | Assist/Voice-Chat öffnen (Push-to-Talk) | HA `assist/show` |
| `share` | Text/URL über Android-Share-Sheet teilen | — (neu) |
| `open-external` | URL im externen Browser/CustomTab öffnen (z. B. Keycloak-Account, externe Links) | HA external-URL handling |
| `download` | Datei-Download (blob/http) (s. §2.4) | HA download split |
| `navigate` (Native→SPA) | Deep-Link-Navigation in SPA-Route | HA `NavigateTo` |

**Aktionen, die in den `user_events_channel` zurückspielen** (`aipril/*`-Custom-Messages, analog HAs custom external-bus-Events): `aipril/tool-approval` (approve/deny), `aipril/agent-answer` (Antwort auf `ask_user`), `aipril/draft-action` (approve/send). Diese werden **nicht** über die Bridge, sondern direkt von der SPA via bestehende WS/HTTP-APIs ausgelöst — die App muss nur die **Deep-Links** liefern, damit ein Notification-Tap die SPA in den richtigen Zustand bringt (s. §4.4).

### 2.3 SPA-seitige Ergänzungen (klein, additiv)

Die Quasar-SPA bekommt ein dünnes Bridge-Modul (`src/native/bridge.ts`), das prüft, ob `window.aiprilNative` existiert:
- **Auth-Handoff:** Wenn `aiprilNative` vorhanden ist, **überspringt die SPA den oidc-client-Redirect-Login** und ruft stattdessen `aiprilNative.getExternalAuth()` → speichert den Token im oidc-Store / setzt den Bearer für HTTP+WS. (Dies ist HAs `getExternalAuth`-Vertrag, übertragen auf oidc-client.) Bei Ablauf ruft die SPA erneut `getExternalAuth(force_refresh)`.
- **Capability-gating:** `config/get` steuert, ob native Mic-/Wake-Word-Buttons sichtbar sind (statt Browser-`getUserMedia`).
- **Notifications/Permissions/Haptics/Share/Theme:** dünne Wrapper, die in der reinen Browser-Variante No-Ops/Web-APIs bleiben (Progressive Enhancement).
- **Safe-Area:** SPA liest `safeArea`-Insets aus `config/get` und setzt CSS-Variablen (Notch/Statusbar).

> Diese SPA-Additions sind bewusst minimal und rein additiv — die SPA läuft weiterhin unverändert im normalen Browser/PWA (`window.aiprilNative === undefined`).

### 2.4 Datei-Upload / Download / Kamera

Übernommen aus HAs `WebViewActivity`-File-Handling:
- **Upload:** `onShowFileChooser` → `ActivityResultContracts` (Datei/Kamera). Mikrofon/Kamera-Permissions über `onPermissionRequest`.
- **Download-Split (1:1 HA):** `blob:` → in Data-URI konvertieren → lokal speichern; `http(s):` → Androids `DownloadManager.Request` **mit injiziertem `Authorization: Bearer`-Header** (Token aus dem Auth-Layer).

---

## 3. Onboarding + Auth (Keycloak/OIDC)

HA nutzt OAuth authorization_code mit WebView-Redirect-Intercept (`ConnectionViewModel.kt`, `HAWebViewClient.kt` fängt `homeassistant://auth-callback`). aipril übernimmt **das Muster**, ersetzt aber den Identity-Provider durch **Keycloak** und nutzt **AppAuth** (robuster als handgebaute Redirect-Interception).

### 3.1 Flow

1. **Kein Server-Picker** (anders als HAs `ServerDiscoveryViewModel`/NSD): aipril hat genau einen Server (`AIPRIL_BASE_URL`). Optional ein einzelnes „Server-URL"-Feld für Self-Hosting, default vorbelegt.
2. **OIDC Auth-Code-Flow + PKCE** via AppAuth gegen `id.luebke.dev` (Keycloak): Discovery via `.well-known/openid-configuration`, Redirect-URI `dev.luebke.aipril://oauth/callback` (Custom Tab, nicht eingebettete WebView — Store-/Security-Best-Practice). Entspricht funktional HAs `/auth/authorize` + Redirect-Intercept, nur mit Keycloak-Endpunkten.
3. **Token-Exchange** am Keycloak-Token-Endpoint (`grant_type=authorization_code`) — Pendant zu HAs `AuthenticationService.getToken()`.
4. **Provisioning:** Nach Login ruft die App (oder die SPA nach Handoff) `GET /me` → aipril lazy-provisioniert den User (bestehendes Verhalten). Org-Auswahl bleibt in der SPA (`X-Aipril-Org`).

### 3.2 Token-Storage & Refresh

- **Storage:** `access_token`, `refresh_token`, `expiry`, `id_token` in **EncryptedSharedPreferences** (Jetpack Security, Keystore-gebackt). HA legt Tokens in Room ab, das nur per Filesystem-Verschlüsselung geschützt ist — wir wählen die explizit verschlüsselte Variante.
- **Refresh:** `AuthRepository.ensureValidSession()` (Pendant zu HAs `ensureValidSession`): vor Ablauf via `grant_type=refresh_token` gegen Keycloak erneuern. Bei Refresh-Fail → Re-Login-Flow.
- **Handoff in WebView:** Beim `getExternalAuth`-Call der SPA liefert die App `{access_token, expires_in}` (Refresh bei Bedarf) — exakt HAs `retrieveExternalAuthentication(force_refresh)`-Vertrag.

### 3.3 Logout

`revokeExternalAuth` → Keycloak `end_session_endpoint` (Custom Tab) + lokale Tokens löschen + WebView-Cookies/Storage leeren.

---

## 4. Push (Dual-Path: FCM + FOSS-WS)

Wir übernehmen HAs **Dual-Path** wörtlich (`FirebaseCloudMessagingService.kt` für FCM, `WebsocketManager.kt` als FOSS-Fallback), gemappt auf aiprils bestehenden `user_events_channel`.

### 4.1 Path A — FCM (`full`-Flavor, Play-Store)

- `FirebaseMessagingService.onNewToken()` → registriert das Token bei aipril (s. §9 Endpoint), persistiert lokal (`PREF_PUSH_TOKEN`). Re-Registration bei Fehler — HAs Resilienz-Muster (404/410 → `registerDevice()` neu).
- Eingehende FCM-Data-Messages → flaches Key-Value-Schema (§4.3) → `NotificationRenderer.handle(dataMap)`.

### 4.2 Path B — FOSS WS-Fallback (`minimal`-Flavor, kein GMS)

- Statt FCM: ein **Foreground-/WorkManager-gehaltener WebSocket** auf aiprils `/api/v1/ws` (Bearer via `Sec-WebSocket-Protocol`-Subprotocol — **identisch** zu aiprils Web-Client und zu HAs WS-Auth). 
- aipril pusht ohnehin schon per-User-Events über `user_events_channel` an alle Fenster (Chat-Title-Fanout, Agent-Fragen, Tool-Approval-Cards, Background-Run-Resumptions, Drafts). Der FOSS-Client **abonniert denselben Kanal** und rendert die Events als native Notifications.
- **Konfigurierbarer Schedule** wie HA (`websocketSetting`: „immer", „bei Bildschirm an", „zuhause im WLAN", „nie"). FOSS-Default = always-on; full-Default = WS aus (FCM bevorzugt). Direkt aus HA übernommen.
- **Ack:** Falls aipril für mobile Zustellung ein Ack braucht (Vermeidung von Doppelzustellung über mehrere Geräte), spiegeln wir HAs `ackNotification(confirmId)`-Muster mit einem `delivery_id` im Event.

### 4.3 Notification-Payload-Schema (HA-kompatibel, aipril-spezifisch)

Wir standardisieren auf HAs flaches Schema (ein Renderer für beide Pfade):

```json
{
  "title": "Agent fragt nach",
  "message": "Datei löschen bestätigen?",
  "tag": "run:<uuid7>",
  "group": "agent-questions",
  "channel": "agent_questions",
  "importance": "high",
  "deeplink": "aipril://chat/<chat_id>?run=<run_id>",
  "event_type": "agent_question",
  "actions": [
    {"action": "approve", "title": "Erlauben"},
    {"action": "deny", "title": "Ablehnen", "destructive": true},
    {"action": "reply", "title": "Antworten", "behavior": "textinput"}
  ]
}
```

### 4.4 Mapping aiprils Events → Notifications

| aipril `user_events_channel`-Event | Notification | Actions | Deep-Link |
|---|---|---|---|
| Chat-Antwort fertig / Chat-Title | Info | „Öffnen" | `aipril://chat/<id>` |
| `agent_question` (`ask_user`) | High | Optionen als Buttons + ggf. `textinput` | `aipril://chat/<id>?run=<rid>&q=<qid>` |
| `tool_approval` (security-mode) | High | „Erlauben"/„Ablehnen" | `aipril://chat/<id>?approve=<call_id>` |
| `draft_ready` (Comms/HITL) | High | „Ansehen"/„Senden" | `aipril://drafts/<draft_id>` |
| `automation_fired` / Background-Run resumed | Default | „Öffnen" | `aipril://chat/<id>` |

**Action-Callback (HAs `NotificationActionReceiver`-Muster):** Tap auf „Erlauben"/„Ablehnen"/Reply → `NotificationActionReceiver.onReceive()` → POST an aipril (s. §9 `POST /api/v1/mobile/actions`), das die wartende Temporal-Workflow-Resumption auslöst — analog HAs `fireEvent("mobile_app_notification_action", …)`. Für `textinput`/`reply` hängen wir wie HA ein `RemoteInput` an. Tap auf den Body → Deep-Link öffnet die App auf der richtigen SPA-Route (§2.2 `navigate`).

---

## 5. Voice & Wake-Word

aipril hat bereits STT (Whisper/faster-whisper) + streaming TTS (Piper) über die `speaches`-Container und OpenAI-kompatible Audio-Models. Im **WebView-Modell läuft Voice grundsätzlich weiter in der SPA** (`getUserMedia` + bestehende `voice.ts`-Player). Die App liefert nur das, was der Browser nicht gut kann:

### 5.1 Push-to-Talk (MVP-tauglich, P4)

- Nativer Mic-Button / Notification-Action / App-Shortcut → `voice/show` öffnet die SPA-Voice-Route. Mikrofon-Permission wird nativ erteilt (`onPermissionRequest`), Capture + STT/TTS laufen in der SPA über die bestehenden Endpunkte. Minimaler nativer Aufwand, voller Reuse von aiprils Voice-Stack.

### 5.2 On-Device Wake-Word (optional, später, `:wakeword`-Modul)

Direkt an HAs `microwakeword/` orientiert:
- TFLite-Micro-Modell(e) (~60–100 KB, z. B. deutsches Keyword), 16 kHz Mono-PCM, JNI-Wrapper analog `MicroWakeWord.kt` (`processAudio` → bool).
- `WakeWordListener` (analog `WakeWordListener.kt`): AudioRecord-Lifecycle, **2-Sekunden-Cooldown** gegen Re-Trigger (HAs `POST_DETECTION_COOLDOWN_CHUNKS`).
- Foreground-Service (analog `AssistVoiceInteractionService.kt`): lauscht im Hintergrund, broadcastet bei Detektion → öffnet die Voice-Route (`voice/show`).
- **Dedup auch serverseitig** (HAs `duplicate_wake_up`-Muster): aipril verwirft Re-Trigger innerhalb eines Cooldowns pro User.

> Wake-Word ist bewusst Post-MVP und optional/opt-in (Akku, Privacy, Store-Review für Always-Listening).

---

## 6. Phone-als-Entity (optional, opt-in)

Aus HAs `SensorManager.kt`/`SensorWorker.kt`/`BatterySensorManager.kt` adaptiert, gemappt auf aiprils **bestehendes Entity-System** (Integrations + `EntityWriter.upsert`, Automation-Triggers):

- **Sensor-Abstraktion** (analog HAs `SensorManager`-Interface): `requiredPermissions()`, `requestSensorUpdate()`, `getAvailableSensors()`. MVP-Sensoren: `battery_level`, `battery_state`, `charging`, `network_type`, `wifi_connection`, `screen_state`, optional `location`.
- **Hybrid-Collection** wie HA: BroadcastReceiver (z. B. `ACTION_BATTERY_CHANGED`, `WIFI_STATE_CHANGED`) **+** WorkManager-Periodik (15 min, `NetworkType.CONNECTED`).
- **Push in aipril:** statt HAs `/api/integration_device/update_sensor_states` → ein **mobile Entity-Ingest-Endpoint** (s. §9), der serverseitig auf `EntityWriter.upsert(EntityRecord)` mit `domain="device"` mappt. Reiche Attribute (Spannung/Health/BSSID/Signal/lat-lon-accuracy) in `Entity.attributes` (JSONB) — wie im Dossier skizziert.
- **Dedup/Permission-Gating** wie HA: `lastSentState`/`lastSentIcon`, `enabled`-Flag pro Sensor, `checkPermission()` gated. Opt-in pro Sensor im Settings-Tab.
- **Automations:** greifen über bestehende Trigger (`event = entity.state_changed`, `domain=device`, numerische Conditions, z. B. Akku < 20 %).

---

## 7. Extra-Surfaces (später)

Aus HAs Surfaces (`widgets/`, `qs/`, `wear/`, `AssistShortcutActivity.kt`) priorisiert:
- **Share-to-aipril** (Android Share-Target): Text/URL/Bild aus anderen Apps → öffnet aipril mit vorbefülltem Composer (`aipril://share?...`). Höchster Nutzen, geringster Aufwand → erste Extra-Surface.
- **App-Shortcuts / Quick-Settings-Tile:** „Neuer Chat", „Voice starten" (analog HAs `AssistShortcutActivity` + Tile-Services).
- **Home-Screen-Widgets:** „Main-Chat öffnen", „Letzte Drafts" (analog HAs Button/Template-Widgets).
- **Wear OS / iOS:** eigene spätere Tracks; Wear analog HAs `:wear`-Modul (Voice-first), iOS als `WKWebView` mit identischem Bridge-Vertrag.

---

## 8. Phasenplan (jede Phase eigenständig auslieferbar)

### P1 — WebView-Shell + OIDC + Basis-Push **(MVP)**
**Inhalt:** `:app`-WebView-Host (Compose), Custom `WebViewClient` (Fehlertypen, Host-Filter), `:common` mit AppAuth-OIDC gegen Keycloak + EncryptedSharedPreferences, Bridge V1 (`aiprilNative`) mit `config/get`, `getExternalAuth`, `revokeExternalAuth`, `theme-update`, `haptic`, `open-external`, `share`. SPA-Bridge-Modul (`bridge.ts`) mit Auth-Handoff + Capability-Gating. Push: **nur FOSS-WS-Pfad** zuerst (kein FCM-Setup nötig) → schnellster Pfad zu echten Notifications über `user_events_channel`. Deep-Link-Routing (`aipril://…`).
**Verifikation:** Login per Keycloak im Custom Tab; SPA lädt ohne zweiten Login (Handoff greift); WS-Push erzeugt native Notification bei Chat-Antwort; Deep-Link öffnet korrekte Chat-Route; Logout leert Tokens+Cookies. Manuell auf Gerät + Emulator (Android 13/14).

### P2 — FCM-Flavor + Actionable Notifications
**Inhalt:** `full`-Flavor mit Firebase (`FirebaseMessagingService`), Push-Token-Registry-Endpoint (§9), `NotificationRenderer` für das flache Schema, Action-Buttons + `RemoteInput`/Reply, `NotificationActionReceiver` → `POST /api/v1/mobile/actions`. Mapping aller `user_events_channel`-Eventtypen (§4.4). `minimal`-Flavor behält WS-Pfad.
**Verifikation:** Tool-Approval-Push mit „Erlauben/Ablehnen" → Tap resumed den Temporal-Workflow; Agent-Frage mit Reply-Textinput; Doppelzustellung (FCM + WS) wird über `delivery_id`/Ack vermieden; full vs minimal getrennt gebaut (Flavor-Convention-Plugin).

### P3 — Datei/Kamera/Download + Hardening
**Inhalt:** `onShowFileChooser` (Datei/Kamera), Download-Split (blob→Data-URI, http→`DownloadManager` mit Auth-Header), Safe-Area-Insets, Theme/Statusbar-Sync, Fehlerseiten/Retry, Bridge V2 (`addWebMessageListener`, Origin-Filter) als Härtung gegen `addJavascriptInterface`-Risiken.
**Verifikation:** Datei-Upload im Chat; authentifizierter Download; Notch-Layout korrekt; Bridge funktioniert unter V1+V2.

### P4 — Voice (Push-to-Talk)
**Inhalt:** nativer Mic-Permission-Flow, `voice/show`-Bridge-Command, App-Shortcut + QS-Tile „Voice". STT/TTS bleiben in der SPA (`speaches`).
**Verifikation:** Push-to-Talk öffnet Voice-Route, Mikrofon-Permission, deutsche STT-Transkription + streaming TTS-Wiedergabe im WebView.

### P5 — Phone-als-Entity (opt-in)
**Inhalt:** `:common`-SensorManager-Abstraktion, Battery/Network/Screen-Sensoren, BroadcastReceiver + WorkManager-Periodik, mobiler Entity-Ingest-Endpoint → `EntityWriter.upsert`, Settings-Tab zum Aktivieren pro Sensor.
**Verifikation:** Akkustand erscheint als `device`-Entity in aipril; Automation „Akku < 20 %" feuert; deaktivierter Sensor sendet nicht.

### P6 — Wake-Word + Extra-Surfaces
**Inhalt:** `:wakeword`-Modul (TFLite-Micro JNI, Cooldown), Foreground-Listener; Share-to-aipril, Widgets, Quick-Tiles.
**Verifikation:** Wake-Word öffnet Voice; Re-Trigger-Cooldown greift; Share aus Fremd-App landet im Composer.

### P7 (Track) — iOS + Wear
Eigene Shell(s) gegen denselben Bridge-Vertrag und dieselben aipril-Endpunkte.

---

## 9. Backend-Änderungen an aipril

Bewusst minimal-invasiv — wir bauen auf `user_events_channel`, Control-WS und Temporal auf.

1. **Push-Token-Registry** (neu)
   - Tabelle `mobile_devices` (RLS-tenant-scoped, Owner = `user_id`): `id (uuid7)`, `user_id`, `org_id`, `device_id` (client-generiert), `platform` (`android`/`ios`), `flavor` (`full`/`minimal`), `push_provider` (`fcm`/`apns`/`ws`), `push_token` (nullable für WS-Only), `app_version`, `created_at`, `last_seen_at`, `enabled`. Unique `(user_id, device_id)`.
   - `POST /api/v1/mobile/devices` (register/upsert, HAs `/api/mobile_app/registrations`-Pendant), `DELETE /api/v1/mobile/devices/{device_id}` (Logout/Unregister), `PATCH` für Token-Refresh. Re-Registration-Resilienz wie HA.

2. **FCM-Sender** (neu, serverseitig)
   - Ein `MobilePushService`, der bei jedem Event auf `user_events_channel` prüft, ob der User aktive **FCM**-Geräte hat, und das flache Payload-Schema (§4.3) an FCM (HTTP v1, Service-Account) sendet. WS-Geräte erhalten dasselbe Payload über den **bestehenden** WS-Push (keine Änderung am WS-Protokoll außer optionalem `delivery_id`/Ack).
   - Konfiguration via `PERSONAL_AGENT__PUSH__FCM__*` (Service-Account-File aus `/run/secrets`, Konvention des Projekts). FOSS-Deployments ohne FCM-Credentials fallen automatisch auf den WS-Only-Pfad zurück.

3. **Notification-Payload-Mapper** (neu, dünn)
   - Eine zentrale Funktion, die bestehende `user_events_channel`-Eventtypen (chat-reply/title, `agent_question`, `tool_approval`, `draft_ready`, `automation_fired`, background-resume) → flaches Notification-Schema inkl. `deeplink` + `actions` (§4.4) übersetzt. Genutzt von FCM-Sender **und** vom WS-Push (ein Schema für beide Pfade).

4. **Mobile-Action-Callback** (neu)
   - `POST /api/v1/mobile/actions` `{event_type:"mobile_action", action, action_data, run_id?, call_id?, draft_id?, reply_text?}` — Pendant zu HAs `mobile_app_notification_action`. Routet auf die **bestehenden** Resumption-Pfade (Tool-Approval, `ask_user`-Answer, Draft-Send), die heute schon die Temporal-Workflows fortsetzen. Idempotent über `call_id`/`run_id`.

5. **Mobile Entity-Ingest** (P5, neu)
   - `POST /api/v1/mobile/entities` (Batch der geänderten Sensoren) → `EntityWriter.upsert` mit `domain="device"`, per-User. Dedup/Disabled-Handling serverseitig.

6. **Deep-Link-Vertrag** (Doku, evtl. minimale Route-Aliase)
   - `aipril://chat/{id}?run=&q=&approve=`, `aipril://drafts/{id}`, `aipril://voice`, `aipril://share`. Die SPA muss diese Query-Parameter beim Laden auswerten (kleine Router-Erweiterung) — die App übersetzt den `aipril://`-Intent in die passende SPA-URL/`navigate`-Bridge-Message.

7. **OIDC-Client-Registrierung** in Keycloak
   - Public-Client (PKCE) mit Redirect-URI `dev.luebke.aipril://oauth/callback` + zugehöriger Logout-Redirect. Realm-as-code-Ergänzung (bestehender Mechanismus).

8. **CORS/CSP/Origin**: WebView lädt dieselbe Origin wie der Browser — keine CORS-Änderung. Falls Bridge V2 Origin-Filter nutzt, SPA-Origin whitelisten.

---

## 10. Risiken & Entscheidungen

1. **WebView-Session vs. native API:** **Entscheidung — WebView-first** (HAs Prinzip). Die SPA bleibt die Wahrheit für UI/State; Native ergänzt nur Capabilities. Risiko: WebView-Inkonsistenzen (ältere System-WebViews). Mitigation: Host-gefilterte Fehlerbehandlung wie `HAWebViewClient.kt`, Min-SDK so wählen, dass moderne WebView verfügbar ist; `domStorage` für oidc-client zwingend aktiv.
2. **`addJavascriptInterface` (V1) Sicherheit:** Risiko der JS-Exposition. Mitigation: nur auf der eigenen, TLS-gesicherten Origin aktiv; **V2-Migration** (`addWebMessageListener` + Origin-Filter) in P3 — exakt HAs Begründung für den V2-Bus.
3. **FCM vs. FOSS:** **Beide** über Flavors (HAs full/minimal). Risiko: Doppelzustellung → `delivery_id`/Ack (HAs `ackNotification`-Muster). FOSS-WS im Hintergrund kostet Akku/erfordert Foreground-Service-Notification (Android-Policy) — als „immer/bei WLAN/nie"-Setting konfigurierbar wie HA.
4. **Auth: eingebettete WebView vs. Custom Tab:** **Custom Tab/AppAuth** statt HAs eingebetteter Login-WebView — Store- und Security-Best-Practice (kein Credential-Sniffing, System-Cookie-Reuse). Trade-off: weniger UI-Kontrolle, aber robuster gegen Keycloak-Theme/Flows.
5. **Token-Sicherheit:** EncryptedSharedPreferences (Keystore) statt HAs filesystem-encryptem Room. Risiko: Refresh-Token-Lifetime/Rotation in Keycloak korrekt konfigurieren; bei Diebstahl Logout via `end_session`.
6. **Multi-Server bewusst out-of-scope:** anders als HA (`ServerManager`/serverId) hat aipril einen Server, mehrere Orgs. Spart erheblichen Komplexitätsaufwand. Risiko: Self-Hosting-User wollen mehrere Instanzen → später nachrüstbar (Repository-per-Server-Muster von HA ist die Blaupause).
7. **Wake-Word/Always-Listening:** Privacy + Akku + Play-Store-Review (Foreground-Mic). Daher **opt-in, Post-MVP**, on-device (kein Cloud-Audio im Idle), Cooldown wie HA.
8. **Store-Policies:** Play verlangt klare Begründung für Mic/Location/Foreground-Service + Datenschutzerklärung. `minimal`-Flavor für F-Droid muss GMS-frei bleiben (keine Firebase-Artefakte) — über Flavor-Convention-Plugin erzwingen (HAs Trennung `FullApplicationModule` vs. `MinimalApplicationModule`).
9. **iOS-Parität:** Bridge-Verträge und Endpunkte sind plattformneutral gehalten, damit die iOS-`WKWebView`-Shell ohne Backend-Änderungen andocken kann. Risiko: APNs statt FCM → `push_provider="apns"` ist im Registry-Schema bereits vorgesehen.
10. **SPA-Kopplung:** Die App hängt am Bridge-Vertrag der SPA. Mitigation: Versionierung über `config/get` (`appVersion`/`bridgeVersion`), additive, abwärtskompatible SPA-Wrapper (No-Op im reinen Browser), damit Web-PWA und App aus demselben SPA-Build laufen.

---

**Relevante HA-Referenzdateien** (Blaupausen, die dieser Plan adaptiert): `app/.../webview/WebViewActivity.kt`, `WebViewContentScreen.kt`, `util/HAWebViewClient.kt`, `util/TLSWebViewClient.kt`, `frontend/js/FrontendJsBridge.kt`, `webview/externalbus/ExternalBusMessage.kt`, `frontend/session/ServerSessionManager.kt`, `onboarding/connection/ConnectionViewModel.kt`, `common/.../authentication/impl/AuthenticationService.kt`, `notifications/FirebaseCloudMessagingService.kt` (full), `notifications/MessagingManager.kt`, `notifications/NotificationActionReceiver.kt`, `websocket/WebsocketManager.kt`, `app/src/minimal/.../MinimalApplicationModule.kt`, `common/.../sensors/SensorManager.kt` + `SensorWorker.kt`, `microwakeword/.../MicroWakeWord.kt`, `assist/wakeword/WakeWordListener.kt`, `build-logic/convention/.../AndroidFullMinimalFlavorConventionPlugin.kt`.