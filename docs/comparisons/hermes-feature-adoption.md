# Hermes-Features für Personal Agent — strategische Übernahme-Analyse

Bewertung, welche Fähigkeiten von **Hermes Agent** (NousResearch) wir in **Personal
Agent** übernehmen sollten — gegliedert nach **Adopt / Adapt / Skip**. Grundlage:
Quellcode-Analyse beider Repos plus ein gezielter IST-Zustands-Audit von Personal
Agent (Juni 2026).

**Wichtigste Erkenntnis vorweg:** Die Self-Improving-Basics, die Hermes berühmt
machen, **existieren in Personal Agent bereits** — Agent-Skill-Authoring
(`agent/skill_authoring_toolset.py`), Skill-Aging (`agent/skill_curator.py`) und
ein Curator, der **Skills *und* Memory aus Erfahrung vorschlägt**
(`curator/skill_proposals.py`, Propose→Approve→Commit). Der Hebel liegt also im
**Ausbau des Vorhandenen**, nicht im Nachbau. Ebenso sind Execution-Backends
(Monty/Docker/Podman/K8s/SSH/AWS/Hetzner) und ein breiter Provider-Katalog
(`agent/registry.py`, inkl. OpenRouter first-class, plus admin-definierbare
OpenAI-kompatible Provider) bereits abgedeckt.

**Strategischer Fokus** (vom Auftraggeber gesetzt): Lernfähigkeit/Self-Improving,
Developer-Ökosystem, Execution & Tooling — sowie mehr Messaging-Reichweite *unter
Beibehaltung des eigenen Konzepts* (PA: Agent **liest** eingehende Nachrichten;
Hermes: man **chattet mit** dem Agent über die Plattform).

---

## Übersicht — Empfehlungsmatrix

| # | Feature (Hermes) | PA heute | Empfehlung | Nutzen | Aufwand |
|---|---|---|---|:---:|:---:|
| 1 | Self-Improving Skill-Loop (autonom, konfigurierbar) | Basics vorhanden | **Adopt (Ausbau)** | ★★★ | M |
| 2 | Skill-Usage-Signale → Lebenszyklus & Verbesserung | Aging nach last_used | **Adopt** | ★★☆ | S |
| 3 | ACP-Adapter (IDE-Integration VS Code/Zed) | fehlt | **Adapt** | ★★☆ | M |
| 4 | Mehr Messaging-Kanäle (inbound-lesend) | 5 Kanäle | **Adapt** | ★★★ | M je Kanal |
| 5 | Konversationeller Agent-Endpoint (Hermes-Modell) | fehlt | **Skip (bewusst)** | — | — |
| 6 | i18n-Ausweitung (16 Sprachen) | 2 Sprachen | **Adapt (Quick-Win)** | ★★☆ | S–M |
| 7 | Klassische Chat-CLI | TUI vorhanden | **Skip** | ★☆☆ | S |
| 8 | Weitere Execution-Backends (Modal/Daytona) | SSH/K8s/Docker da | **Skip** | ★☆☆ | M |
| 9 | Weitere Modell-Provider (Nous Portal etc.) | OpenRouter 200+ da | **Skip (on-demand)** | ★☆☆ | S |
| 10 | Pluggable Memory-Provider (Honcho/Mem0…) | eigener Graph | **Skip (bewusst)** | ★☆☆ | L |
| 11 | Batch-Runner / Trajektorien | fehlt | **Skip (Nische)** | ★☆☆ | M |
| 12 | Mixture-of-Agents (MoA) | Sub-Agents da | **Skip** | ★☆☆ | M |

Legende Nutzen: ★★★ hoch · ★★☆ mittel · ★☆☆ gering. Aufwand: S/M/L.

---

## TIER 1 — ADOPT (klare Empfehlung, baut auf Vorhandenem auf)

### 1. Self-Improving Skill-Loop — konfigurierbar autonom

**Hermes:** Der Agent schreibt nach komplexen Tasks (≈5+ Tool-Calls) selbst Skills,
**verbessert sie bei Wiederverwendung** (LLM-guided patches) und der Curator
archiviert ungenutzte automatisch.

**PA heute:** Sehr nah dran. Vorhanden sind:
- `agent/skill_authoring_toolset.py` — Agent kann via `save_skill(...)` Skills anlegen/ändern.
- `curator/skill_proposals.py` — Curator schlägt nach Runs reusable Verfahren als
  `state="proposed"`, `enabled=False` Skills vor (analog zu Memory-Proposals).
- `agent/skill_curator.py` — Lebenszyklus active → stale (30d) → archived (90d).
- `curator/validator.py` + `committer.py` — Propose→Approve→Commit (Single-Writer).

**Lücken vs. Hermes:**
1. **Konfigurierbare Autonomie fehlt.** Heute landen Vorschläge immer als
   disabled/proposed. Es gibt keinen Schalter „auto-enable, wenn Governance + Policy
   erfüllt".
2. **Skill-*Verbesserung* fehlt.** PA erstellt Skills, patcht aber bestehende Skills
   nicht aus Nutzungssignalen/Fehlern (Hermes' „self-improve during use").
3. **UI-Sichtbarkeit der Proposals** ist schwächer als bei Pending Facts.

**Empfehlung — Adopt als Ausbau, in drei Stufen:**
- **(a) Autonomie-Policy** auf dem bestehenden Proposal-Pfad: pro Org/User ein
  Level **`propose_only` (Default, entschieden)** → `auto_enable_trusted` →
  `auto_enable` (beide opt-in). Bei `propose_only` landet jedes gelernte Skill als
  `enabled=False`/`proposed` in der Review-Queue und wird erst nach Freigabe genutzt.
  `auto_enable_trusted` aktiviert ein Skill automatisch **nur**, wenn es keine
  high-privilege/untrusted-gated Tools referenziert und die Provider-Governance passt;
  sensible Skills bleiben Review-pflichtig. Wichtig: In *allen* Levels greift zur
  Laufzeit weiterhin das normale Tool-Gating (Contracts #13/#14) — die Autonomie
  betrifft nur den *Review-Schritt*, nie die Sicherheitsgrenzen. So bleibt der
  **fail-closed**-Charakter erhalten und die Autonomie ist eine *Konfiguration*, kein
  Architekturbruch.
- **(b) Skill-Self-Improvement:** Curator-Pass, der bei wiederholter Nutzung +
  beobachteten Fehlschlägen eines Skills einen Patch-Vorschlag erzeugt (gleicher
  Propose→Approve→Commit-Pfad). Nutzungssignale aus #2 unten.
- **(c) Proposals als erstklassige Review-Queue** in der Skills-Seite (wie Pending
  Facts), inkl. Diff-Ansicht für Patches.

**Architektur-Fit / Risiken:** Hoch — nutzt den bestehenden Curator als einzige
Schreibinstanz. Wichtig: Skills werden in den `RunSpec` gesnapshottet (Contract #6),
also wirken neue/auto-enabled Skills erst beim nächsten Run, nie mid-run. Auto-Enable
muss durch dieselbe Tag-/Untrusted-Gate-Policy wie reguläre Tools (Contracts #13/#14).
**Aufwand: M.**

### 2. Reichere Skill-Usage-Signale → Lebenszyklus & Verbesserung

**Hermes:** `.usage.json`-Sidecar mit `use_count`, `view_count`, `patch_count`,
`last_activity_at` — speist Auto-Archivierung und Self-Improvement.

**PA heute:** Aging nur nach `last_used_at` (`skill_curator.py`).

**Empfehlung — Adopt:** Zähler `use_count` / `success_count` / `failure_count` /
`patch_count` am Skill-Repo ergänzen. Diese Signale (i) verbessern das Aging
(häufig+erfolgreich → pinnen/bevorzugen; oft+fehlerhaft → Patch-Vorschlag aus #1b),
(ii) liefern Telemetrie für die Skills-UI. Kleiner, in sich geschlossener Change.
**Architektur-Fit:** Hoch (ein Repo + Migration). **Aufwand: S.**

---

## TIER 2 — ADAPT (übernehmen, aber an PA-Konzept anpassen)

### 3. ACP-Adapter — IDE-Integration (VS Code / Zed / JetBrains)

**Hermes:** `acp_adapter/` spricht Anthropics Agent Client Protocol → der Agent ist
direkt in IDEs nutzbar.

**PA heute:** TUI-Client (Rust) und Web, aber **kein ACP**, keine IDE-Anbindung.

**Empfehlung — Adapt:** ACP ist im Kern ein **Transport über die bestehende
Run-API** (wie schon TUI/SSE/WS). Ein schlanker ACP-Server, der ACP-Sessions auf
PA-Runs mappt (RunSpec bauen, AG-UI-Events → ACP-Updates übersetzen), bringt für den
Dev-Ökosystem-Fokus viel Sichtbarkeit. Auth über den bestehenden Device-Flow.
**Architektur-Fit:** Gut — neuer Client/Adapter, kein Eingriff in den Run-Kern.
**Risiko:** Mapping von ACP-Permission-Prompts auf PA-Security-Modi sauber halten.
**Aufwand: M.**

### 4. Mehr Messaging-Kanäle — als inbound-lesende Integrationen

**Hermes:** 16+ Plattformen (Telegram, Discord, Slack, Teams, Feishu, WeChat, …).

**PA heute:** 5 inbound-lesende Comms-Kanäle (email, matrix, signal, zulip, whatsapp -
jeweils `message=True` mit `message_reader/listener_provider`), inbound-lesend via
Listener + Triage; Telegram/Slack/Discord fehlen. (Die Phone-Integration liefert nur
Sensor-Entities/`phone` als Kontaktmethode, ist kein Nachrichten-Kanal.)

**Empfehlung — Adapt (PA-Konzept beibehalten):** Neue Kanäle als reguläre
Integrationen nach bestehendem Muster (`integrations/<domain>/` mit Manifest +
Config-Flow + `message_reader/listener_provider`). Der Agent **liest** dort weiter
Nachrichten in Inbox/Triage — kein Konzeptbruch. Da die abgeleiteten Sets aus den
Capability-Deklarationen berechnet werden (`comms/triage_setup.py`,
`listener_manager.py`), fügt sich jeder neue Kanal automatisch in Inbox + Triage ein.

Priorisierung nach Reichweite/Aufwand:
- **Telegram** (Bot-API, sauberes Long-Poll/Webhook) — bester Erst-Kandidat.
- **Slack** (Events API/Socket Mode) — hoher Business-Wert.
- **Discord** — Community-Wert.

**Architektur-Fit:** Hoch (kanonischer Integrations-Pfad). **Aufwand: M je Kanal.**

### 5. Konversationeller Agent-Endpoint (Hermes-Modell) — **Skip (bewusste Entscheidung)**

> **Entschieden:** Direkte Kommunikation *mit* dem Agent läuft bei Personal Agent
> **ausschließlich über die eigenen Apps** (Web-SPA, Rust-TUI, Android, Desktop).
> Das Hermes-Modell — „mit dem Agent über eine Fremd-Plattform chatten" — wird
> **bewusst nicht** übernommen.

Damit bleibt die klare Trennung erhalten: Drittplattformen (E-Mail, Signal,
WhatsApp, Matrix, Zulip, künftig Telegram/Slack/Discord) sind **rein inbound-lesend**
(#4) — der Agent liest und triagiert dort eingehende Nachrichten, aber die
konversationelle Oberfläche bleibt den eigenen Clients vorbehalten. Das vermeidet die
sonst nötige Komplexität (Plattform-Identity ↔ PA-User-Mapping, Approval-UX und
Security-Modi über einen fremden Chat-Kanal) und hält das Produktkonzept scharf.

### 6. i18n-Ausweitung (Richtung 16 Sprachen)

**Hermes:** 16 Sprachen (`locales/*.yaml`).

**PA heute:** Frontend + TUI je nur de-DE/en-US; das System ist aber i18n-fähig
(Frontend `src/i18n/`, TUI `src/i18n.rs`).

**Empfehlung — Adapt (Quick-Win):** Da die Infrastruktur steht, ist das überwiegend
Übersetzungsarbeit. 3–5 strategische Sprachen ergänzen (z. B. fr/es/it/pt). Hinweis:
Backend-Strings bleiben laut Konvention **Englisch** — Nutzersprache kommt aus Modell
+ Frontend-i18n; das passt zum bestehenden Design. **Aufwand: S–M (skaliert mit
Sprachzahl).**

---

## TIER 3 — SKIP (bewusst nicht / nur on-demand)

### 7. Klassische Chat-CLI — **Skip**
Der Rust-TUI-Client deckt den Terminal-Use-Case bereits ab (Login, Slash-Commands,
Inbox, Sub-Agents). Eine zweite reine REPL bringt wenig Mehrwert. Falls
Skript-/Pipe-Nutzung gewünscht ist, lieber ein dünner `--print/--json`-Modus am
TUI-Client als ein neues Tool.

### 8. Weitere Execution-Backends (Modal/Daytona) — **Skip**
PA hat bereits Monty-Sandbox, Docker/Podman, Kubernetes-Pods, Remote-VM via SSH sowie
AWS/Hetzner-Compute. Modal/Daytona (serverless, near-zero-idle) wären nettes
Add-on, aber der marginale Nutzen ist gering, weil K8s/Remote-VM dieselben Szenarien
abdecken. Bei konkretem Bedarf als weiterer `sandbox/providers/*`-Adapter nachrüstbar.

### 9. Weitere Modell-Provider (Nous Portal etc.) — **Skip / on-demand**
OpenRouter ist first-class (200+ Modelle) und das Provider-System ist
config-/`ProviderSpec`-getrieben — neue OpenAI-kompatible Provider sind trivial
ergänzbar. Nous Portal o. ä. nur bei echtem Bedarf; kein strategischer Hebel.

### 10. Pluggable Memory-Provider (Honcho/Mem0/…) — **Skip (bewusst)**
PAs bitemporaler Entity-State-Graph (Live-Integration-Entities + gelernte Fakten,
Provenance, Time-Travel) ist eine **bewusste Stärke**, kein Defizit. Eine
austauschbare Provider-Abstraktion würde dieses Differenzierungsmerkmal verwässern.
Einzelne *Ideen* (z. B. Honchos dialektisches User-Modeling) kann der Curator als
Lern-Heuristik übernehmen — ohne die Speicherschicht zu pluggen.

### 11. Batch-Runner / Trajektorien-Generierung — **Skip (Nische)**
Hermes nutzt das primär zur **Trainingsdaten-Erzeugung**. Für ein Produkt mit
durable Runs + Usage-Tracking ist das kein Endnutzer-Feature. Falls wir
Offline-Evals wollen, lieber ein kleines internes Eval-Harness (es gibt bereits
`requires_llm`-Evals) als einen vollwertigen Batch-Runner.

### 12. Mixture-of-Agents (MoA) — **Skip**
Das Sub-Agent-System (explore/delegate/script, je eigener Run + Usage) deckt
Multi-Modell-Bedarf bereits ab. MoA (mehrere Modelle aggregieren pro Turn)
multipliziert Kosten/Latenz für meist marginalen Qualitätsgewinn und kollidiert mit
dem Per-`ModelResponse`-Usage-/Cost-Modell (Contracts #1/#2).

---

## Empfohlene Reihenfolge (wenn wir starten)

1. **#2 Skill-Usage-Signale** (S) — Fundament für #1, schnell erledigt.
2. **#1 Self-Improving Skill-Loop, konfigurierbar** (M) — der strategische Kern.
3. **#6 i18n-Ausweitung** (S–M) — paralleler Quick-Win.
4. **#3 ACP-Adapter** (M) — Dev-Ökosystem-Sichtbarkeit.
5. **#4 Telegram/Slack/Discord inbound** (M je Kanal) — Reichweite im PA-Modell.

(#5 konversationeller Endpoint entfällt bewusst — siehe Tier-2-Abschnitt.)

---

## Getroffene Entscheidungen

- **Konversationeller Agent-Endpoint (#5): bewusst verworfen.** Direkte
  Kommunikation mit dem Agent läuft ausschließlich über die eigenen Apps
  (Web/TUI/Android/Desktop). Drittplattformen bleiben rein inbound-lesend (#4).
- **Autonomie-Default (#1a): `propose_only`.** Gelernte Skills landen in der
  Review-Queue und werden erst nach Freigabe genutzt; `auto_enable_trusted` und
  `auto_enable` bleiben opt-in pro Org/User. Laufzeit-Tool-Gating greift in allen
  Levels.

---

*Erstellt nach Quellcode-Analyse beider Repos und einem IST-Zustands-Audit von
Personal Agent. Empfehlungen respektieren die Frozen Contracts (insb. #6 RunSpec-
Snapshot, #13 Untrusted-Gating, #14 fail-closed Klassifikation, #1/#2 Usage-Modell).*
