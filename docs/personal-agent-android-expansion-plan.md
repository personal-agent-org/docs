# Umsetzungsplan: Android-App-Ausbau (nach HA-Code-Abgleich, 2026-06)

> **Umsetzungsstand (2026-06-10): AP0–AP14 implementiert** (alle drei Releases),
> mit folgenden bewussten Abweichungen/Resten:
>
> - **Verifikation:** Backend (`uv run pytest` — 643 passed, nur die 5
>   vorbestehenden Temporal-e2e-Fails ohne laufenden Temporal-Server) und Frontend
>   (`pnpm build` + `lint` grün) sind in der Sandbox verifiziert. **Der
>   Android-Build NICHT** — `maven.google.com`/`dl.google.com` sind hier netzseitig
>   gesperrt, es gibt kein Android-SDK. Alle Kotlin-Dateien sind ktlint-parse-geprüft;
>   erster `./gradlew assembleDebug` (oder Docker-Build) lokal ist der nötige nächste
>   Schritt und kann Kleinigkeiten aufdecken (insb. die ungeprüften
>   Versionsnummern von `firebase-messaging` / `work-runtime-ktx` /
>   `health.connect:connect-client` in `libs.versions.toml`).
> - **AP9:** GMS-Geofencing (instant Zone-Enter-Events) bewusst weggelassen —
>   Zonenauflösung läuft GMS-frei (LocationManager) im 15-min-Takt + on-demand
>   (`request_location`); reicht für „kommt heim"-Automations, Latenz dokumentiert.
>   Zonen-Editor ist Formular (Name/Lat/Lon/Radius), keine Karte.
> - **AP10:** dynamische „letzte Chats"-Shortcuts verschoben (statisch: Neuer
>   Chat/Voice/Inbox + 2 QS-Tiles sind da).
> - **Bonus-Fixes unterwegs:** Notification-Deep-Link `/chat/:id`→`/chats/:id`
>   (Route existierte nicht) und die Phone-Entity-Projektion verlor `battery_level`/
>   `is_charging` (Spec-Keys `battery`/`charging` — Aliasse ergänzt).

> **Bezug:** Dies ist der konkrete Arbeitspaket-Plan zur Weiterentwicklung von
> `personal-agent-android/`. Er ersetzt die Phasen P2–P7 aus
> `docs/personal-agent-android-app-plan.md` (die Architektur-Blaupause dort bleibt gültig)
> durch verifizierte, einzeln auslieferbare Arbeitspakete. Grundlage ist ein
> Quellcode-Abgleich mit der Home-Assistant-Android-App (Shallow-Clone von
> `github.com/home-assistant/android`, Juni 2026) **und** eine Verifikation der
> personal-agent-Backend-Verträge (alle unten referenzierten Endpoints/Schemas sind im
> Code geprüft, nicht angenommen).

---

## 0. Ist-Stand & Kernerkenntnisse

**Schon gebaut** (über P1 hinaus): WebView-Shell + AppAuth/OIDC, Bridge V1 (11 Commands),
FOSS-Push über Foreground-WS (`PushWebSocketService`), Notification-Rendering für
`push_notification` / `agent_question` / `tool_approval` / `chat_title` / `draft_pending`,
Sensor-Snapshot alle 15 min → `PUT /api/v1/me/phone/state` (mit Entity-Projektion
`domain="phone"`), `PhoneCommandExecutor` (speak/notify/dnd/ringer/flashlight/media/
launch_app/request_location) + serverseitiges `phone_toolset`.

**Kernerkenntnisse aus dem HA-Abgleich:**

1. **Actionable Notifications sind das größte Loch und fast gratis:** Die
   Resumption-Endpoints existieren alle schon (`POST /chats/{id}/questions/{qid}/answer`,
   `POST /approvals/{id}/approve|reject`, `POST /drafts/{id}/approve|reject`). Der im
   alten Plan vorgesehene neue Endpoint `POST /api/v1/mobile/actions` ist **unnötig** —
   ein `NotificationActionReceiver` ruft die bestehenden Endpoints direkt auf.
2. **Datei-Upload fehlt komplett** (`onShowFileChooser` nicht implementiert) — Anhänge
   gehen in der App derzeit gar nicht. Funktional ein Loch in der Kern-UX.
3. `sensors` ist freies JSONB (`PhoneState.sensors`) — neue Sensor-Keys brauchen **keine
   Migration**, die Entity-Projektion übernimmt sie automatisch.
4. `POST /push/tokens` kennt `push_type: fcm|ws` bereits — für FCM fehlt nur der
   **serverseitige Sender**, nicht die Registry.
5. **Areas/Floors sind keine Geo-Zonen** (kein lat/lon) — Geofencing braucht ein neues,
   kleines Zonen-Konzept (AP9).
6. **Bug:** `voice/show` navigiert zu `/voice`, aber die SPA hat keine `/voice`-Route.
7. Play-Pflicht: targetSdk ≥ 35 für App-Updates (seit Aug 2025) — wir stehen auf 34.

**Leitplanken (unverändert):** WebView-first, die SPA bleibt die UI; nativ nur
OS-Capabilities. Bestehende Backend-Verträge wiederverwenden statt neue Endpoints.
`minimal`-Flavor bleibt GMS-frei. Phone-Aktuatorik bleibt high-privilege und unter
Untrusted-Content gefiltert (Frozen Contract #13).

---

## 1. Arbeitspakete

Aufwand: **S** ≈ ≤1 Tag, **M** ≈ 2–4 Tage, **L** ≈ 1–2 Wochen. Jedes AP ist eigenständig
auslieferbar; Reihenfolge innerhalb eines Releases ist Empfehlung, keine harte Abhängigkeit
(echte Abhängigkeiten sind genannt).

### Release 1 — „Antworten ohne App-Öffnen" (Kern-UX)

#### AP0 — Modernisierung der Toolchain *(S)*

- **Scope:** `personal-agent-android/gradle/libs.versions.toml`, `app/build.gradle.kts`.
- compileSdk 34→36, targetSdk 34→35 (Play-Pflicht), AGP/Kotlin/Compose-BOM-Bumps
  (HA-Referenz: compileSdk 37 / target 36 / Kotlin 2.4). minSdk bleibt 26.
- Foreground-Service-Typ und Permissions gegen targetSdk-35-Verhaltensänderungen testen
  (FGS-Start aus BOOT/Push, Notification-Permission-Flows).
- **Verifikation:** Docker-Build (`assembleDebug`) grün; App startet auf Android 14/15;
  WS-Push + Login unverändert.

#### AP1 — Actionable Notifications *(M)* — **höchster Nutzen**

- **Scope (nur App, kein Backend):** neu `push/NotificationActionReceiver.kt`; Änderungen
  in `push/NotificationRenderer.kt`, `AndroidManifest.xml`.
- **HA-Blaupause:** `app/.../notifications/MessagingManager.kt` (Action-Aufbau),
  `NotificationActionReceiver.kt` (Klick/Reply-Handling, `RemoteInput`).
- Mapping (Frames kommen heute schon über den WS):
  - `agent_question` (`chat_id`, `run_id`, `question_id`, `options`, `allow_custom`):
    bis zu 2 Optionen als Buttons + bei `allow_custom` ein „Antworten"-`RemoteInput`
    (Android zeigt max. 3 Actions). Antwort → `POST
    /api/v1/chats/{chat_id}/questions/{question_id}/answer` `{"answer": "<text>"}`.
    **Sonderfall:** Multi-Frage-Frames (`questions != null`) bekommen keine Buttons
    (Antwort-Format `answers: list[list[str]]` ist im Notification-UI nicht abbildbar)
    — nur Tap-to-open.
  - `tool_approval` (`approval_id`): „Erlauben"/„Ablehnen" →
    `POST /api/v1/approvals/{approval_id}/approve|reject` mit Body `{}`.
  - `draft_pending` (`draft_id`): „Senden"/„Verwerfen" →
    `POST /api/v1/drafts/{draft_id}/approve|reject`.
- Receiver-Mechanik: `BroadcastReceiver.goAsync()` + OkHttp, Token via
  `AuthRepository.freshAccessToken()` (Refresh bei 401, ein Retry). Erfolg → Notification
  durch Bestätigung ersetzen („✓ Beantwortet") bzw. canceln. Fehler → Notification mit
  Fehlerhinweis ersetzen, Tap öffnet die App auf der Deep-Link-Route. Serverseitige
  Idempotenz existiert (settled Question/Approval/Draft antwortet konfliktfrei).
- **Verifikation:** Tool-Approval per Button resumed den wartenden Run (Temporal läuft
  weiter); `ask_user` mit Optionen per Button und per Reply-Text beantwortbar; Doppeltipp
  erzeugt keinen Fehler; offline-Tipp zeigt Fehler-Notification.

#### AP2 — Share-Target: Teilen an den Agenten *(S, Text/URL; Bilder nach AP3)*

- **Scope:** `AndroidManifest.xml` (`ACTION_SEND`/`SEND_MULTIPLE`, `text/*`),
  `MainActivity.kt` (`onNewIntent` → Bridge-Event), SPA: `frontend/src/boot/native.ts`
  + Composer-Prefill in `frontend/src/pages/ChatPage.vue`.
- Fluss: Share-Intent → App vorn → natives→SPA-Event `share` `{text, url}` über den
  bestehenden `ExternalBus` → SPA navigiert auf `/` und befüllt den Composer (neues
  `onNativeEvent('share', …)`; Composer-Prefill-Pfad existiert noch nicht und ist der
  einzige SPA-Anteil). Kein Auto-Send — der User schickt selbst ab.
- HA hat kein echtes Share-Target — das ist unser assistentenspezifischer Vorteil.
- **Verifikation:** URL aus dem Browser teilen → Composer vorbefüllt; mehrere Texte
  (`SEND_MULTIPLE`) werden konkateniert; Share bei ausgeloggter App → erst Login, dann
  Prefill (Route/Event puffern wie beim Deep-Link-`pendingRoute`).

#### AP3 — Datei-Upload, Kamera, Download *(M)*

- **Scope:** `ui/PersonalAgentWebChromeClient.kt` (`onShowFileChooser` +
  Kamera-Capture-Intent), `MainActivity.kt` (ActivityResult-Verkabelung), neuer
  `DownloadListener` auf der WebView, Bridge-Command `download` (blob-Pfad),
  SPA: kleiner Wrapper in `nativeBridge.ts` (blob→dataURI senden).
- **HA-Blaupause:** File-Handling in `WebViewActivity.kt`, `handleBlob`-External-Bus-Command.
- Download-Split (1:1 HA): `blob:`-URLs kann die WebView nicht laden → SPA konvertiert zu
  dataURI und schickt sie über die Bridge, nativ speichern via MediaStore (API 29+);
  `http(s):` → `DownloadManager.Request` **mit `Authorization: Bearer`-Header**.
  Kamera: `onPermissionRequest` um `RESOURCE_VIDEO_CAPTURE` erweitern + CAMERA-Permission
  (Manifest, runtime).
- **Verifikation:** Bild aus Galerie + Kamera-Foto im Chat hochladen; vom Agenten
  erzeugte Datei (Workspace) authentifiziert herunterladen, landet in `Downloads/`;
  Berechtigungs-Deny bricht sauber ab.

#### AP4 — WS-Verbindungsmodi (Akku) *(M)*

- **Scope:** `push/PushWebSocketService.kt`, neues `core/AppSettings.kt`
  (SharedPreferences), Bridge-Commands `app-settings/get|set` in `bridge/NativeBridge.kt`,
  SPA: „App"-Abschnitt in `frontend/src/pages/SettingsPage.vue` (nur sichtbar bei
  `isNative()`).
- **HA-Blaupause:** `websocket/WebsocketManager.kt` mit Modi
  NEVER / SCREEN_ON / ALWAYS / HOME_WIFI (`command_persistent_connection`).
- Modi bei uns: `always` (Default, heutiges Verhalten) / `screen_on` / `unmetered` (WLAN)
  / `never`. Service registriert `ACTION_SCREEN_ON/OFF`-Receiver + NetworkCallback und
  öffnet/schließt nur den Socket (der Service selbst bleibt, solange Modus ≠ `never`).
  Wichtig: Wird der Socket gegated, entfallen auch `phone_command`s und Sensor-Reports —
  in den Settings klar benennen; mit AP8 (FCM) wird `never`/`screen_on` praxistauglich.
- **Verifikation:** Modus `screen_on`: Socket trennt bei Display aus, verbindet bei an;
  `never` stoppt den Foreground-Service; Einstellung überlebt App-Neustart.

#### AP5 — Voice-Route-Fix *(S)*

- **Scope:** SPA `frontend/src/router/routes.ts` + `ChatPage.vue`; optional
  `bridge/NativeBridge.kt`.
- `voice/show` zielt auf `/voice` — die Route existiert nicht. Fix: ChatPage versteht
  `/?mic=1` (öffnet sofort die bestehende Push-to-Talk-Aufnahme aus `services/voice.ts`);
  die Bridge mappt `voice/show` → `navigate /?mic=1`. Damit sind QS-Tile/Shortcut/
  Assistant-Rolle (AP11/AP13) vorbereitet.
- **Verifikation:** `voice/show` aus der SPA-Konsole öffnet die Aufnahme; deutscher
  STT-Roundtrip funktioniert im WebView.

### Release 2 — „Hände & Sinne" (Agent-Mehrwert)

#### AP6 — Phone-Commands v2 *(M)*

- **Scope:** App `push/PhoneCommandExecutor.kt`; Backend `agent/phone_toolset.py`
  (`_CONTROL_ACTIONS` + neue Tools), kein Schema-/Migrationsbedarf.
- Neue Actions (HA-Katalog als Vorlage, `MessagingManager.kt`):
  - `volume` (`media|ring|alarm` + 0–100, `AudioManager.setStreamVolume`)
  - `screen_on` (kurzer `ACQUIRE_CAUSES_WAKEUP`-WakeLock)
  - `clear_notification` (Tag) und `tts_stop`
  - assistententypisch, hat HA nicht: `set_alarm` / `set_timer`
    (`AlarmClock.ACTION_SET_ALARM|SET_TIMER` mit EXTRA_HOUR/MINUTES/LENGTH/MESSAGE,
    `SKIP_UI=true`) und `navigate_to` (`google.navigation:q=…`, Fallback `geo:`-Intent)
  - `broadcast_intent` **bewusst NICHT** — zu mächtig fürs Agent-Threat-Model
    (beliebige Intents = Quasi-Root auf App-Ebene).
- Backend: `phone_control`-Docstring erweitern + dedizierte Tools `phone_set_alarm(time,
  label)` und `phone_navigate(destination)` (bessere Tool-Ergonomie fürs LLM als
  generisches action/value). Bleiben high-privilege → Contract-#13-Filterung greift wie
  bisher.
- **Verifikation:** „Stell einen Wecker auf 7:00" end-to-end (Agent-Tool → WS →
  Systemwecker erscheint); Lautstärke/Screen-on/clear_notification je einmal; unbekannte
  Action degradiert still (heutiges Verhalten).

#### AP7 — Sensor-Ausbau ohne neue Permissions *(S)*

- **Scope:** App `push/SensorCollector.kt`; Backend: nichts (JSONB + bestehende
  Entity-Projektion).
- Neue Keys: `next_alarm` (ISO-Zeit via `AlarmManager.getNextAlarmClock()` — perfekt für
  die Agenda/Proactive-Schiene), `volume_media`/`volume_ring`, `storage_free_gb`,
  `airplane_mode`, `headset_connected`. (HA-Pendants: NextAlarm/Audio/Storage-Manager.)
- Zusätzlich Push-Trigger statt nur 15-min-Takt: `ACTION_BATTERY_LOW`,
  `ACTION_POWER_CONNECTED/DISCONNECTED`, `RINGER_MODE_CHANGED` → sofortiger Report
  (Receiver im laufenden Service, kein Manifest-Receiver nötig).
- **Verifikation:** `read_phone_status` zeigt die neuen Keys; Automation-Trigger auf
  `battery_level < 20` feuert binnen Sekunden nach `ACTION_BATTERY_LOW`.

#### AP8 — FCM-`full`-Flavor + Server-Push *(L)* — einzige große Backend-Arbeit

- **Scope App:** Product-Flavors `full`/`minimal` (Dimension `distribution`) in
  `app/build.gradle.kts`; `src/full/` mit `firebase-messaging` +
  `PersonalAgentFcmService` (onNewToken → `POST /api/v1/push/tokens`
  `{token, platform:"android", push_type:"fcm"}`; onMessageReceived →
  bestehender `NotificationRenderer`, gleiches flaches Frame-Schema als data-Message);
  `google-services.json` NICHT einchecken (CI-Secret). `minimal` bleibt exakt heutig.
- **Scope Backend:** FCM-Sender als Best-Effort-Hook im bestehenden Fanout-Trichter
  `realtime/bus/user_events.py::publish_user_event` (alle Frames laufen dort durch —
  auch die vom Temporal-Worker, der das Modul bereits importiert):
  nach dem Redis-`publish` zusätzlich `await fcm.maybe_send(user_sub, payload)`.
  - Whitelist push-würdiger Typen: `push_notification`, `agent_question`,
    `tool_approval`, `draft_pending` (+ optional `chat_title` als „Antwort fertig").
    Ein zentraler Mapper Frame→flaches Notification-Schema, **derselbe** den der
    WS-Renderer in der App spiegelt (ein Schema, zwei Transporte — HA-Prinzip).
  - FCM HTTP v1 mit Service-Account aus `/run/secrets`
    (`PERSONAL_AGENT__PUSH__FCM__CREDENTIALS_FILE` etc.); ohne Credentials → No-Op
    (FOSS-Deployments unverändert). Fehler `UNREGISTERED`/404/410 → Token löschen
    (HA-Resilienzmuster). Wie der Redis-Publish: Exceptions loggen, nie den Run brechen.
- **Doppelzustellung:** Wenn ein FCM-Token registriert ist, stellt die App den
  WS-Modus-Default auf `screen_on` (Vordergrund-Nutzen bleibt: phone_commands,
  Live-Sensorik) und rendert WS-Frames nur bei aktivem Socket; zweites Netz ist der
  stabile Notification-`tag` (gleicher Tag ersetzt statt dupliziert). Kein Ack-Protokoll
  nötig.
- **Verifikation:** Backend-Unit-Tests für Mapper + Token-Cleanup; manuell: App
  geschlossen (kein WS) → FCM-Notification kommt; Action-Buttons (AP1) funktionieren auf
  FCM-Pfad identisch; `minimal`-Build enthält keinerlei GMS-Artefakte
  (`./gradlew :app:dependencies --configuration minimalReleaseRuntimeClasspath | grep -i
  'firebase\|gms'` leer).
- **Abhängigkeit:** AP1 (Renderer/Receiver werden wiederverwendet).

#### AP9 — Location & Zonen (opt-in) *(L)*

- **Scope App:** `SensorCollector` + neuer `LocationCollector`; Permission-Flow
  FINE → BACKGROUND (zweistufig, mit In-App-Disclosure); `full`: FusedLocationProvider +
  `GeofencingClient`; `minimal`: `LocationManager` + eigene Distanzprüfung im
  15-min-Takt (GMS-frei!).
- **Scope Backend:** Zonen als Entities `domain="zone"` mit
  `attributes={latitude, longitude, radius_m}` über die bestehende Entities-API (kein
  neuer Endpoint, keine Migration); SPA: Zonen-Editor-Karte im Settings/Knowledge-Bereich.
  Phone-Snapshot bekommt `zone` (Name oder `not_home`) und — nur im Modus „exakt" —
  `location {lat, lon, accuracy}`.
- **Privacy-Default: `zone_only`.** Exakte Koordinaten sind explizites Opt-in pro Gerät
  (HAs „send as zone-only"-Muster). `request_location` (existiert als Command) liefert
  dann einen frischen Fix.
- Automations greifen ohne neue Trigger-Infrastruktur über `entity.state_changed` auf
  dem Phone-Entity (`zone`-Wechsel: „kommt heim" / „verlässt Arbeit").
- **HA-Blaupause:** `app/src/full/.../sensors/LocationSensorManager.kt`,
  `location/HighAccuracyLocationService.kt` (High-Accuracy-Mode übernehmen wir bewusst
  noch nicht).
- **Verifikation:** Zonenwechsel-Automation feuert (Geofence auf `full`, Poll-Pfad auf
  `minimal`); ohne Opt-in tauchen nirgends Koordinaten auf (Snapshot, Entities, Logs);
  Background-Location-Deny degradiert auf „nur bei geöffneter App".
- **Abhängigkeit:** sinnvoll nach AP8 (Geofence-Events sollen auch ohne offenen WS einen
  Report auslösen können — sonst nur Poll).

### Release 3 — „Surfaces"

#### AP10 — QS-Tiles + App-Shortcuts *(S)*

- **Scope:** zwei `TileService`s („Neuer Chat", „Voice") + `shortcuts.xml` (Neuer Chat,
  Voice, Inbox) + dynamische Shortcuts (letzte 3 Chats via `ShortcutManager`, gespeist
  aus den `chat_title`-Frames, die der WS ohnehin liefert).
- **HA-Blaupause:** `qs/`-Tiles (HA hat 40 — wir brauchen 2), `AssistShortcutActivity.kt`.
- Alles deep-linkt auf bestehende Routen (`/` bzw. `/?mic=1` aus AP5).
- **Verifikation:** Tile aus dem QS-Panel öffnet App auf richtiger Route, auch bei
  gesperrtem Gerät (nach Unlock); Shortcuts erscheinen bei Long-Press aufs Icon.

#### AP11 — Glance-Widget Inbox/Agenda *(M)*

- **Scope:** Jetpack-Glance-Widget (Liste: offene Inbox-Items / nächste Agenda-Einträge,
  Badge mit Zähler), `WorkManager`-Refresh (30 min + bei App-Resume), REST
  `GET /api/v1/inbox` bzw. `/agenda` mit Token aus `AuthRepository`, Tap → Deep-Link.
- **HA-Blaupause:** Todo-Glance-Widget (`widgets/`).
- **Verifikation:** Widget zeigt nach Login Daten, aktualisiert nach Refresh-Intervall,
  Tap öffnet die Inbox; ausgeloggter Zustand zeigt „Anmelden"-Hinweis statt Fehler.

#### AP12 — Health Connect (opt-in) *(M)*

- **Scope App:** `androidx.health.connect`-Client (GMS-frei → beide Flavors), Settings-
  Opt-in pro Metrik (Schritte, Schlaf, Ruhepuls, Gewicht als Start-Set), Tagesaggregate
  in den Phone-Snapshot (`health_steps_today`, `health_sleep_hours`, …) — kein neues
  Backend (JSONB + Entity-Projektion).
- **HA-Blaupause:** `sensors/HealthConnectSensorManager.kt` (HA liest 30+ Metriken; wir
  starten mit 4).
- Play-Konsequenz: Health-Daten ⇒ Data-Safety-Deklaration + ggf. Health-Apps-Policy —
  vor dem Store-Release prüfen; bis dahin nur in Sideload/F-Droid-Builds aktivierbar.
- **Verifikation:** Agent beantwortet „Wie habe ich geschlafen?" aus
  `read_phone_status`; deaktivierte Metrik wird nie gelesen (Permission bleibt
  ungewährt).

#### AP13 — System-Assistant-Rolle *(M)*

- **Scope:** `VoiceInteractionService` + `VoiceInteractionSessionService` (minimal),
  Manifest-Deklaration für die Assistant-Rolle; die Session öffnet keine eigene UI,
  sondern deep-linkt in `MainActivity` auf `/?mic=1` (AP5).
- **HA-Blaupause:** `assist/service/AssistVoiceInteractionService.kt`.
- Damit ersetzt Personal Agent per Long-Press-Power/Corner-Swipe den Google Assistant —
  der elegante Zwischenschritt, der das Wake-Word-Modul (Backlog) vorerst überflüssig
  macht.
- **Verifikation:** App als Standard-Assistent wählbar (Einstellungen → Standard-Apps);
  Long-Press-Power startet die Voice-Aufnahme.

#### AP14 — Bridge V2 Hardening *(S–M)*

- **Scope:** `MainActivity`/`NativeBridge` auf `WebViewCompat.addWebMessageListener`
  mit Origin-Allowlist (`BASE_URL`) umstellen, V1 (`addJavascriptInterface`) als
  Fallback für alte System-WebViews behalten; SPA `nativeBridge.ts` spricht beide
  (Feature-Detection).
- Begründung wie HAs V2-Bus: `addJavascriptInterface` exponiert die Bridge jedem
  Frame/Origin in der WebView.
- **Verifikation:** Bridge funktioniert unter V1+V2; ein in der WebView geladener
  Fremd-Origin (Test-Seite) erreicht die V2-Bridge nicht.

---

## 2. Reihenfolge & Meilensteine

| Release | APs | Ergebnis für den User |
|---|---|---|
| **R1** | AP0 → AP1 → AP2 → AP3 → AP4 → AP5 | Fragen/Approvals/Drafts direkt aus der Notification beantworten; Teilen an den Agenten; Anhänge & Downloads; Akku-Kontrolle; Voice-Einstieg repariert |
| **R2** | AP6 → AP7 → AP8 → AP9 | Agent kann Wecker stellen/navigieren/Lautstärke regeln; reagiert auf Akku/Alarm-Kontext sofort; zuverlässiger Push ohne Dauer-WS; „kommt heim"-Automations |
| **R3** | AP10 → AP11 → AP12 → AP13 → AP14 | Ein-Tipp-Einstiege (Tile/Shortcut/Widget), Gesundheitskontext, Personal Agent als System-Assistent, gehärtete Bridge |

Kritischer Pfad: **AP0 zuerst** (Play-targetSdk-Pflicht blockiert sonst jedes
Store-Update). AP1 ist unabhängig davon und kann parallel starten. AP8 ist das einzige
AP mit nennenswerter Backend-Arbeit — früh reviewen (Mapper-Whitelist = Privacy-Frage:
Notification-Inhalte verlassen die Infrastruktur Richtung Google).

## 3. Backlog (bewusst nicht eingeplant)

- **Wake-Word on-device** (`:wakeword`-Modul, TFLite-Micro/JNI wie HAs `microwakeword/`)
  — AP13 deckt den Hands-free-Einstieg billiger ab; erst bei echtem Bedarf.
- **Wear OS** (HA: eigenes Modul, ~107 Kotlin-Dateien — Chat-Tile/Complication wären der
  Start) und **iOS-Shell** (gleicher Bridge-Vertrag) — eigene Tracks.
- **NFC-Tag → Szene/Automation** (HAs `nfc/`), **Barcode-Scan als Bridge-Command**
  (ML Kit), **App-Lock/Biometrie** — nette Optionale mit klarer HA-Blaupause.
- **Out of scope endgültig:** Matter/Thread-Commissioning, Improv, Android Automotive —
  Smart-Home-spezifisch, ohne Personal-Agent-Pendant.

## 4. Risiken

1. **Play-Policies:** Background-Location (AP9) verlangt Review + prominente Disclosure;
   Health (AP12) Data-Safety/Health-Policy; FGS `dataSync` (heute schon) braucht im
   Store-Listing eine Begründung. Mitigation: Features opt-in, Disclosures in der App,
   AP9/AP12 nicht im ersten Store-Release.
2. **F-Droid-Reinheit:** `full`-Abhängigkeiten (Firebase, play-services-location,
   Geofencing) strikt flavor-gaten; CI-Check aus AP8-Verifikation dauerhaft behalten.
3. **Privacy:** AP8 schickt Notification-Inhalte durch FCM/Google. Mitigation: Whitelist
   klein halten; Option „nur stille Wake-Pushes" (data-only, Inhalt wird nach App-Wake
   lokal über den WS geladen) als Follow-up, wenn das stört.
4. **Akku/Vertrauen:** Dauer-WS bleibt für `minimal` der Preis der GMS-Freiheit — AP4
   macht ihn steuerbar, AP8 macht ihn für `full` optional.
5. **Bridge-Kopplung App↔SPA:** Neue Bridge-Commands (`app-settings/*`, `download`,
   `share`-Event) additiv und versioniert über `config/get.appVersion` halten; SPA bleibt
   im reinen Browser unverändert lauffähig (No-Ops).
6. **Mächtige Phone-Commands** (`screen_on`, `set_alarm`, …): bleiben serverseitig
   high-privilege (Contract #13, Untrusted-Content-Filter) und werden in den
   App-Settings einzeln abschaltbar gelistet (Deny-Liste lokal im Gerät — der User hat
   das letzte Wort, nicht der Server).

## 5. Verifikation (global, je AP zusätzlich oben)

- App: Docker-Build (`assembleDebug`, beide Flavors ab AP8) muss grün sein; manuelle
  Smoke-Tests auf Android 14/15 (Emulator + ein echtes Gerät).
- Backend: `uv run pytest -q` vom Repo-Root (AP8-Mapper/Token-Cleanup mit Unit-Tests).
- Frontend: `cd frontend && pnpm build && pnpm lint`.
- Jedes AP endet mit einem End-to-End-Beweis über den echten Stack (wie bisherige
  Projektpraxis: „verified" heißt gegen laufende Services, nicht nur Unit-grün).
