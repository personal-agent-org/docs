# Personal Agent vs. Hermes Agent — Detaillierter Feature-Vergleich

Ein gründlicher 1:1-Vergleich zwischen **Personal Agent** (dieses Repo) und
**Hermes Agent** von Nous Research (`github.com/NousResearch/hermes-agent`,
"The agent that grows with you"). Grundlage ist eine direkte Quellcode-Analyse
beider Repositories (Hermes @ `main`, Stand Juni 2026, v0.17.x).

> Beide Systeme sind selbst-hostbare, tool-nutzende KI-Agenten — aber mit
> grundverschiedener Philosophie. **Personal Agent** ist eine *multi-tenant,
> governance-zentrierte SaaS-Plattform* mit durable Execution. **Hermes Agent**
> ist ein *single-operator, self-improving Autonomous Agent* mit extrem breiter
> Plattform-/Provider-Reichweite und einem eingebauten Lern-Loop.

Legende: ✓ = vorhanden / first-class · ◑ = teilweise / via Add-on / nicht
first-class · ✗ = nicht vorhanden · — = nicht zutreffend.

---

## 1. TL;DR — Die Kernunterschiede

| Dimension | Personal Agent | Hermes Agent |
|---|---|---|
| **Grundphilosophie** | Multi-Tenant SaaS-Plattform, Governance-first | Single-Operator Autonomous Agent, "grows with you" |
| **Killer-Feature** | Durable Runs (Temporal) + Fail-closed Data-Governance | Self-Improving Learning Loop (Skills aus Erfahrung) |
| **Ausführungsmodell** | Inline ODER durable (Temporal), ein AG-UI-Envelope | Synchroner In-Process-Loop (`run_agent.py`) |
| **State-Persistenz** | PostgreSQL + pgvector + Redis | SQLite (WAL + FTS5), Dateien in `~/.hermes` |
| **Mandantenfähigkeit** | Echte Multi-Tenancy (RLS, Org-Validation) | Single-Operator, per-User-Session-Isolation im Gateway |
| **Reichweite Messaging** | 5 Kanäle (Email, Signal, WhatsApp, Matrix, Zulip) | **16+ Plattformen** (Telegram, Discord, Slack, Teams, …) |
| **Modell-Provider** | pydantic-ai-Provider (~15 im Katalog), trust-tier-gegated | **29+ Provider-Plugins**, OpenRouter 200+ Modelle |
| **Memory-Modell** | Bitemporaler Entity-State-Graph (World-Memory) | 8 pluggable Memory-Provider + FTS5-Session-Suche |
| **Erweiterbarkeit** | HA-Style Integrations (Manifest + Config Flow) | Plugin- + Skill- + MCP-System |
| **Frontend** | Quasar/Vue 3 SPA (i18n, EN-Quelle + DE) | React-Dashboard + Ink-TUI + Electron-Desktop |
| **Lizenz / Modell** | Self-hosted Plattform-Produkt | MIT, Open Source, Community (agentskills.io) |
| **Reife (Code)** | Production-ready Kern, exp. Clients | v0.17, ~1.600 Testdateien, sehr aktiv |

**In einem Satz:** Personal Agent gewinnt bei *Sicherheit, Governance, Durability
und Mandantenfähigkeit*; Hermes Agent gewinnt bei *Lernfähigkeit, Plattform-/
Provider-Breite und Out-of-the-box-Reichweite*.

---

## 2. Architektur & Ausführungsmodell

| Feature | Personal Agent | Hermes Agent |
|---|:---:|:---:|
| Agent-Runtime | pydantic-ai 1.x | OpenAI-SDK-basierter eigener Loop |
| Durable / krash-sichere Runs | ✓ (Temporal Workflows) | ✗ (synchroner In-Process-Loop) |
| Zwei Run-Pfade (inline + durable) | ✓ | ✗ (nur in-process) |
| Replay / Resume nach Crash | ✓ (Temporal History + CAN) | ◑ (Session-Resume aus SQLite) |
| Einheitlicher Streaming-Envelope | ✓ (AG-UI über Redis Streams) | ◑ (plattform-/transport-spezifisch) |
| Continue-As-New für lange Runs | ✓ | — |
| Interrupt / Ctrl+C-Handling | ◑ | ✓ (first-class im Loop) |
| Budget-Tracking (Iteration + Token) | ✓ (USD-Caps) | ✓ (Iteration + Token-Budget) |
| Context-Kompression in-flight | ✓ | ✓ (bei 85% Threshold) |
| Prompt-Caching-Strategie | ◑ | ✓ (cache-stabil pro Conversation, load-bearing) |

**Personal Agent** trennt sauber zwischen *inline* (FastAPI-Background-Task) und
*durable* (Temporal `ChatAgentWorkflow`) — beide emittieren **identische**
AG-UI-Events auf einen per-Run Redis-Stream (Replay via Last-Event-Id). Das ist
der zentrale Architektur-USP: ein Agent-Run überlebt API-Neustarts.

**Hermes Agent** fährt einen bewusst **synchronen** Loop (`run_agent.py`, ~5.500
LOC) ohne async im Kern — das vereinfacht Unterbrechung und Rollback, opfert aber
Crash-Durability. Dafür ist das Prompt-Caching ein zentrales Design-Constraint:
der System-Prompt ist byte-stabil über die Session, Toolsets werden nie
mid-conversation getauscht.

---

## 3. Konversation & Agent-Core

| Feature | Personal Agent | Hermes Agent |
|---|:---:|:---:|
| LLM-Chat-Agent | ✓ | ✓ |
| Streaming-Antworten | ✓ | ✓ |
| Reasoning-Modi (Off/Low/Med/High) | ✓ | ✓ (reasoning content) |
| Vision / Bildverständnis | ✓ | ✓ (`vision_tool.py`) |
| Checkpoint / Rewind | ✓ | ✓ (`/retry`, `/undo`, Session-Branching) |
| Best-of-N / mehrere Attempts | ✓ | ◑ (Branching) |
| Goal-Loop (iterative Verfolgung) | ✓ (`/goal`) | ◑ (autonom via Loop + Cron) |
| Slash-Commands | ✓ (13 built-in + eigene) | ✓ (zentrales `COMMAND_REGISTRY`) |
| Sub-Agenten / Delegation | ✓ (`delegate_to`/`best_of_n`/`run_workflow`) | ✓ (`delegate_task`, leaf/orchestrator) |
| Parallele Sub-Agent-Batches | ✓ (`delegate_to`-Liste, `delegate_many` im Workflow) | ✓ (max_concurrent_children) |
| Spawn-Tiefe begrenzbar | ✓ | ✓ (max_spawn_depth) |
| Mehrere Chat-Modi | ✓ (Standard/Coding/Custom) | ◑ (TUI/CLI/Dashboard, kein Coding-Modus mit LSP) |

Beide haben ein reichhaltiges Agent-Core mit Sub-Agenten. Unterschied:
Personal Agent gibt jedem Sub-Agent eine **eigene `run_id` + DB-Row +
unabhängiges Usage-Tracking** (gated durch das eigene Provider-Modell), während
Hermes auf synchrone Parent-wartet-auf-Child-Delegation mit isoliertem
Context/Terminal pro Sub-Agent setzt.

---

## 4. Memory & Wissen

| Feature | Personal Agent | Hermes Agent |
|---|:---:|:---:|
| Persistentes User-Memory | ✓ (World-Memory) | ✓ (Memory-Provider) |
| Memory-Modell | Bitemporaler, kausaler Entity-Graph | Pluggable Provider + Session-Store |
| Pluggable Memory-Backends | ✗ (ein integriertes Modell) | ✓ (8: Honcho, Mem0, Supermemory, …) |
| Dialektisches User-Modeling | ◑ (Curator lernt Fakten) | ✓ (Honcho-Dialektik) |
| Live-Integration-Entities im Graph | ✓ (Lichter, Sensoren, Tasks …) | ✗ |
| Bitemporale Zeitachsen / Time-Travel | ✓ | ✗ |
| Provenance / Read-Propose-Write-Split | ✓ | ◑ |
| Cross-Session-Volltextsuche | ◑ (RAG/pgvector) | ✓ (SQLite FTS5 + LLM-Summary) |
| Knowledge-Page / Graphview-UI | ✓ | ✗ |
| Memory-Zugriffskontrolle pro Chat | ✓ (full/none/scoped) | ◑ (skip_memory in Cron) |

Das ist ein **fundamentaler Architekturunterschied**. Personal Agent modelliert
Wissen als *einen* bitemporalen Entity-State-Graph, der Live-Integration-Daten
(Smart-Home-Zustände, Kalender-Tasks) und gelernte Langzeitfakten vereint —
inkl. Time-Travel und Provenance. Hermes setzt auf *austauschbare* Memory-Provider
(Honcho für dialektisches User-Modeling ist der Default-Star) plus eine
SQLite-FTS5-Volltextsuche über alle vergangenen Sessions.

---

## 5. Das Alleinstellungsmerkmal jeder Seite

### Hermes: Self-Improving Learning Loop

| Feature | Personal Agent | Hermes Agent |
|---|:---:|:---:|
| Autonome Skill-Erstellung aus Erfahrung | ◑ (`save_skill`-Tool, Agent-initiiert) | ✓ (nach komplexen Tasks) |
| Skills verbessern sich bei Nutzung | ◑ (`save_skill` überschreibt/refined) | ✓ (LLM-guided patches) |
| Skill-Lifecycle-Curator | ✓ (active→stale→archived nach Idle) | ✓ (use/view/patch-count, auto-archive) |
| Skill-Marketplace / Hub | ✓ (curated catalogs) | ✓ (agentskills.io, publish/install) |
| SKILL.md-Standardformat | ✓ (Claude-kompatibel) | ✓ (eigenes Frontmatter-Schema) |

Hermes' namensgebendes Feature: Der Agent **schreibt nach komplexen Aufgaben
selbst Skills** (strukturierte Markdown-Playbooks), verbessert sie bei
wiederholter Nutzung und archiviert ungenutzte automatisch. Personal Agent hat
mittlerweile ein **eigenes (Hermes-inspiriertes) Self-Improving-Skills**-System:
ein `save_skill`-Tool, mit dem der Agent nach einer gelösten Aufgabe eine
wiederverwendbare Prozedur als Skill ablegt oder eine bestehende refined (sofort
in der Skills-Ansicht und im nächsten Run-Preamble sichtbar), plus einen
Hintergrund-Skill-Curator, der agent-authored Skills per Idle-Zeit durch
`active → stale → archived` altern lässt (reaktiviert bei Nutzung, gepinnte
ausgenommen). Unterschied zu Hermes: bei Personal Agent **entscheidet der Agent
aktiv** über `save_skill`, statt dass nach jedem komplexen Task automatisch
geschrieben/gepatcht wird.

### Personal Agent: Durability + Fail-closed Governance

| Feature | Personal Agent | Hermes Agent |
|---|:---:|:---:|
| Echte Multi-Tenancy (Org-Isolation) | ✓ | ✗ |
| Postgres RLS als Defense-in-Depth | ✓ | ✗ |
| Fail-closed Data-Classification-Gate | ✓ | ✗ |
| Durable Agent-Runs (Temporal) | ✓ | ✗ |
| Untrusted-Content-Tool-Gating | ✓ (automatisch) | ◑ (Approval-Prompts) |
| Provider-Trust-Tier-Gating (0/1/2) | ✓ | ✗ |
| BYOK Envelope-Encryption | ✓ | ◑ (`.env`-Secrets) |

Personal Agents namensgebendes Feature ist **vertrauenswürdige, mandantenfähige
Ausführung**: ein einziges fail-closed `enforce_classification`-Gate stellt
sicher, dass klassifizierte Daten nie einen ungecleared Provider erreichen — und
das an *jedem* Modell-Resolution-Entry (inline, durable, Workflows, Comms).

---

## 6. Tool-System & Code-Ausführung

| Feature | Personal Agent | Hermes Agent |
|---|:---:|:---:|
| First-Party-Tool-Bibliothek | ✓ | ✓ (50+ Core-Tools) |
| Terminal / PTY-Ausführung | ✓ (Coding-Modus, jailed) | ✓ (`terminal_tool.py`) |
| Mehrere Execution-Backends | ◑ (Device-Agent, Cloud-Sandbox) | ✓ (local/docker/SSH/Singularity/Modal/Daytona) |
| Cloud-Sandbox on-demand | ✓ (Playwright) | ✓ (Modal/Daytona, near-zero idle) |
| Browser-Automatisierung | ✓ (Extension + Playwright) | ✓ (Browserbase/agent-browser/Camofox) |
| Code-Execution (Python/Shell/Node) | ✓ | ✓ (`code_execution_tool.py`) |
| Bild-Generierung | ◑ | ✓ (FAL, Nous Portal Gateway) |
| Vision / OCR | ✓ | ✓ |
| Mixture-of-Agents (MoA) | ✗ | ✓ (`moa_tool.py`) |
| Home-Assistant-Steuerung | ✓ (eigenes Integrationsmodell) | ◑ (`homeassistant_tool.py`) |
| Tool-Approval / Confirmations | ✓ (Security-Modi) | ✓ (`approval.py`, sudo-piping) |

Hermes hat die **breitere out-of-the-box Tool- und Backend-Palette** (sechs
Terminal-Backends inkl. serverless Modal/Daytona, drei Browser-Engines, MoA).
Personal Agent setzt auf ein **stärker abgesichertes** Modell: Device-Agent mit
jailed FS + PTY, Cloud-Sandbox, und Tool-Gating nach Provider-Tags +
Untrusted-Content-Policy.

---

## 7. Integrationen, Messaging & Reichweite

| Kanal / Integration | Personal Agent | Hermes Agent |
|---|:---:|:---:|
| **Messaging-Plattformen gesamt** | **5** | **16+** |
| Telegram | ✗ | ✓ |
| Discord | ✗ | ✓ |
| Slack | ✗ | ✓ |
| WhatsApp | ✓ | ✓ |
| Signal | ✓ | ✓ |
| Email (IMAP/SMTP) | ✓ | ✓ |
| Matrix / Element | ✓ | ✓ |
| Microsoft Teams | ✗ | ✓ |
| Feishu / Lark / DingTalk | ✗ | ✓ |
| WeChat (Official + Work) | ✗ | ✓ |
| Google Chat | ✗ | ✓ |
| Mattermost | ✗ | ✓ |
| Zulip | ✓ | ✗ |
| SMS / QQ / Yuanbao / BlueBubbles | ✗ | ✓ |
| OpenAI-kompatibler API-Server | ◑ (eigene API) | ✓ |
| Voice (STT/TTS) | ✓ (Admin-Modelle) | ✓ (Whisper, Edge/ElevenLabs/MiniMax) |
| Unified Inbox / Triage | ✓ (Cross-Channel-Threads) | ◑ (Session pro Chat) |
| Human-approved Draft-Replies | ✓ | ◑ |
| Calendar (CalDAV) | ✓ | ◑ (Skill) |
| Projektmgmt (OpenProject) | ✓ | ◑ (Skill) |
| GitHub / GitLab | ✓ | ✓ (Skill/MCP) |
| Web-Suche | ✓ (Tavily/Brave/DuckDuckGo) | ✓ (Exa/Firecrawl/Parallel) |
| Wetter | ✓ (Met.no) | ◑ (Skill) |
| Smart-Home (Shelly etc.) | ✓ | ◑ (HA-Tool) |

Hier liegt **Hermes klar vorn bei der reinen Reichweite**: ein zentrales Gateway
bedient 16+ Messaging-Plattformen simultan mit einheitlichem Session-Management.
Personal Agent setzt dagegen auf ein **tieferes Integrationsmodell**
(Home-Assistant-Style Manifest + Config Flow, capability-declared Entities), das
eingehende Nachrichten in eine **Unified Inbox mit Cross-Channel-Contact-Threads
und Triage** führt — qualitativ tiefer, aber bei weniger Kanälen.

---

## 8. Modell-Unterstützung & Routing

| Feature | Personal Agent | Hermes Agent |
|---|:---:|:---:|
| Anzahl Provider | ~15 im Katalog (pydantic-ai) | **29+ Plugins** |
| OpenRouter (200+ Modelle) | ◑ (eigener Provider-Slot, `OpenRouterModel`) | ✓ (first-class) |
| Nous Portal | ✗ | ✓ (300+ Modelle, Tool-Gateway) |
| OpenAI / Anthropic / Google | ✓ | ✓ |
| AWS Bedrock | ✓ | ✓ |
| NVIDIA NIM / NovitaAI / MiniMax / Kimi / GLM | ◑ | ✓ |
| Lokale Modelle (Ollama etc.) | ✓ | ✓ |
| Auto-Modell-Auswahl | ✓ (tag-ranked) | ◑ (`hermes model` interaktiv) |
| Fallback-Ketten | ✓ (provider-divers) | ✓ (credential pool + fallback) |
| Aux-Modell pro Task (Curator/Vision/…) | ✓ | ✓ (`auxiliary_client.py`) |
| Kosten-/Pricing-Tracking | ✓ (genai-prices + Audit-Table) | ◑ |
| Budget-Caps (User/Org/Global) | ✓ | ◑ |
| Trust-Tier-Gating der Provider | ✓ (ordinal 0/1/2) | ✗ |

**Hermes gewinnt bei Provider-Breite** (29+ Plugins, lazy-loaded, inkl. vieler
chinesischer und Coding-Provider). **Personal Agent gewinnt bei Kosten-Governance**
(versioniertes `model_pricing` für Audit, USD-Budget-Caps auf drei Ebenen, und
einer ordinalen Provider-Trust-Tier-Achse, 0=unregulated < 1=regulated <
2=internal, die Tools, Integrationen und Daten-Klassifikation gatet; die alten
Residency-Tags wurden durch diese Tier-Achse ersetzt).

---

## 9. Automatisierung & Proaktivität

| Feature | Personal Agent | Hermes Agent |
|---|:---:|:---:|
| Geplante Jobs / Cron | ✓ (Workflow-Trigger) | ✓ (`cron/`, croniter) |
| Schedule-Formate | ✓ (cron/interval/event) | ✓ (duration/„every"/cron/ISO) |
| Workflows (ausführbare Skripte) | ✓ (sandboxed Monty-Python) | ◑ (Cron-Scripts + Skills) |
| Trigger-Typen | ✓ (Schedule/Interval/Webhook/Event/Poll/Manual) | ◑ (Cron + Plattform-Events) |
| Conditions (Entity-State/Time-Window) | ✓ | ✗ |
| Headless Background-Runs | ✓ (Temporal Schedule) | ✓ (Cron-Sessions) |
| Hooks (Before/After Tool/Message) | ✓ (Guardrails) | ◑ (Plugin-Lifecycle-Hooks) |
| Proaktive Agenda / Push | ✓ (Agenda-Page + Curator) | ◑ (Cron-Delivery an Plattform) |
| Batch-/Dataset-Runner | ◑ | ✓ (`batch_runner.py`, Trajectories) |

Personal Agent hat das **mächtigere deklarative Automatisierungs-Subsystem**
(Workflows = Skripte mit Triggers *und* Conditions, plus Hooks als Guardrails).
Hermes' Cron ist robust (Hard-Interrupt, Catchup/Grace-Windows,
Context-Chaining), aber ohne deklarative Conditions. Hermes hat dafür einen
**Batch-Runner** zur Trainingsdaten-Generierung (Trajectories) — etwas, das
Personal Agent nicht hat.

---

## 10. Erweiterbarkeit & Ökosystem

| Feature | Personal Agent | Hermes Agent |
|---|:---:|:---:|
| MCP-Client (Server konsumieren) | ✓ (encrypted Auth-Header; OAuth-MCP = Follow-up) | ✓ (auto-discovery) |
| Als MCP-Server agieren | ✓ (`/api/mcp`) | ✓ (`mcp_serve.py`) |
| OpenAPI-Spec → Tools | ✓ | ◑ |
| Plugin-System | ◑ (Integrations) | ✓ (umfangreich: memory/model/browser/…) |
| HA-Style Integrationen (Manifest+Flow) | ✓ | ✗ |
| Skill-Hub / Community-Katalog | ✓ | ✓ (agentskills.io) |
| ACP (IDE-Integration VS Code/Zed) | ✗ | ✓ (`acp_adapter/`) |
| Drittanbieter-Plugin-Repos | ◑ | ✓ (pip entry points, `~/.hermes/plugins`) |

Beide haben starke MCP-Unterstützung in beide Richtungen. **Hermes' Plugin-System
ist breiter** (Memory-Provider, Modell-Provider, Browser, Image-Gen, Context-
Engines als Plugins) und bietet **ACP für IDE-Integration**. **Personal Agents
Integrations-Modell ist strukturierter** (Home-Assistant-Style mit Config Flow,
capability-declared Entities, die direkt in Memory-Graph + Triage einfließen).

---

## 11. Sicherheit & Governance

| Feature | Personal Agent | Hermes Agent |
|---|:---:|:---:|
| Multi-Tenancy mit Org-Isolation | ✓ | ✗ |
| Postgres RLS | ✓ | ✗ |
| OIDC / Keycloak SSO | ✓ | ◑ (Plattform-OAuth) |
| Per-User-Allowlists | ✓ | ✓ (Gateway, deny-by-default) |
| Data-Classification (fail-closed) | ✓ | ✗ |
| Untrusted-Content-Tool-Gating | ✓ (automatisch) | ◑ (Approval) |
| BYOK Envelope-Encryption | ✓ | ◑ |
| Security-Modi (Autonomous/Approve/Judge) | ✓ | ◑ (Approval-Prompts) |
| LLM-Judge für Tool-Calls | ✓ (Guard-Modell) | ✗ |
| Supply-Chain-Hardening (Pinning) | ◑ | ✓ (== Pins, git-SHAs, CI-Gate) |
| Sandbox-Boundaries | ✓ (jailed FS/PTY) | ✓ (Backend = Boundary) |

**Personal Agent ist hier klar das governance-zentrierte System** — echtes
Multi-Tenancy, RLS, fail-closed Klassifikation, drei Security-Modi inkl.
LLM-Judge, automatisches Untrusted-Content-Gating. **Hermes** glänzt bei
**Supply-Chain-Härtung** (exakte Versions-Pins, git-Commit-SHAs, CI lehnt
ungedeckelte Deps ab — Reaktion auf Worm-/Compromise-Vorfälle 2026) und bei
deny-by-default Gateway-Allowlists.

---

## 12. Plattformen & Clients

| Client | Personal Agent | Hermes Agent |
|---|:---:|:---:|
| Web-SPA | ✓ (Quasar/Vue 3, PWA) | ✓ (React/Vite) |
| Terminal-UI (TUI) | ✓ (Rust/ratatui) | ✓ (Ink/React + tui_gateway) |
| Klassische CLI | ◑ | ✓ (prompt_toolkit) |
| Desktop-App | ◑ (Tauri/WebKitGTK, eigenes Repo, experimentell) | ✓ (Tauri, eigenes Repo `personal-agent-org/desktop`) |
| Android-App | ◑ (experimentell, Companion) | ◑ (via Termux) |
| Browser-Extension | ✓ (Chrome MV3, Device) | ◑ (Browser-Automation, nicht als Client) |
| Device-Agent (Rust, jailed) | ✓ | ✗ |
| Eingebettetes Terminal im Web | ◑ (Coding-Modus) | ✓ (xterm.js + PTY-Bridge) |
| Sprachen / i18n | i18n, EN-Quelle + DE (Weblate) | **16 Sprachen** |

Hermes deckt **mehr Client-Formfaktoren von Haus aus produktiv ab** (CLI, TUI,
Web, Desktop, Termux) und lokalisiert in 16 Sprachen. Personal Agent hat dafür
den **Rust-Device-Agent** (jailed FS + PTY auf dem eigenen Rechner) und eine
**Phone-Companion-App** mit Sensoren/Health/Location als echte Integration —
Fähigkeiten, die Hermes so nicht bietet.

---

## 13. Tech-Stack im Direktvergleich

| Komponente | Personal Agent | Hermes Agent |
|---|---|---|
| Sprache (Backend) | Python 3.12 | Python 3.11–3.13 |
| Agent-Framework | pydantic-ai 1.x | OpenAI-SDK + eigener Loop |
| Web-Framework | FastAPI | FastAPI + Uvicorn |
| Datenbank | PostgreSQL + pgvector | SQLite (WAL + FTS5) |
| Message-Bus | Redis (Streams + Pub/Sub) | — (in-process / SQLite) |
| Durable Execution | Temporal | — |
| Auth | Keycloak / OIDC | Plattform-OAuth / Tokens |
| Frontend | Quasar / Vue 3 | React + Ink + Electron |
| Paketmanager | uv (Workspace) | uv |
| Deployment | Compose, K8s/Helm, CNPG, KEDA | Docker (s6), Nix flake, VPS, Modal/Daytona |
| Observability | Logfire / OpenTelemetry | Plugin (`plugins/observability`) |
| Versionierung | CalVer (YYYY.M.MICRO) | SemVer (0.17.x) |

Der Stack-Unterschied spiegelt die Philosophie: Personal Agent ist eine
**verteilte, server-zentrierte Plattform** (Postgres, Redis, Temporal, K8s),
Hermes ist ein **portabler Single-Process-Agent** (SQLite, läuft auf einem
$5-VPS oder serverless mit near-zero idle cost).

---

## 14. Reife & Status

| Aspekt | Personal Agent | Hermes Agent |
|---|---|---|
| Versionsstand | CalVer, Kern production-ready | v0.17.x, sehr aktiv |
| Testabdeckung | Unit + Integration + LLM-Evals | ~1.600 Testdateien, ~17k Tests, E2E |
| Experimentelle Teile | Android/Desktop/Extension (außerhalb CI) | wenige (Kern stabil) |
| Lizenz | Self-hosted Plattform | MIT (Open Source) |
| Community/Ökosystem | intern, roadmap-getrieben | groß (Discord, agentskills.io) |
| Deployment-Reife | Compose + Helm-Umbrella + CNPG/KEDA | Docker + Nix + Cloud-Backends |

---

## 15. Wann welches System?

**Wähle Personal Agent, wenn:**
- Du **mehrere Nutzer/Organisationen** mit echter Daten-Isolation bedienst.
- **Daten-Governance & Compliance** kritisch sind (klassifizierte Daten dürfen
  bestimmte Provider nie erreichen; ordinale Provider-Trust-Tiers
  unregulated/regulated/internal).
- Agent-Runs **Crashs überleben** müssen (lange, durable Aufgaben via Temporal).
- Du ein **tiefes, einheitliches Wissensmodell** willst (bitemporaler Entity-Graph,
  der Smart-Home-Zustand + Kalender + gelernte Fakten vereint).
- Du **Workflows mit Triggern und Conditions** plus Guardrail-Hooks brauchst.

**Wähle Hermes Agent, wenn:**
- Du einen **persönlichen Agenten für dich selbst** willst, der **mit dir lernt**
  (autonome Skill-Erstellung, dialektisches User-Modeling).
- Du **maximale Plattform-Reichweite** brauchst (Telegram/Discord/Slack/Teams/
  WeChat/… aus einem Gateway).
- Du **maximale Modell-Provider-Auswahl** willst (29+ Provider, OpenRouter 200+).
- Du **leichtgewichtig & portabel** deployen willst ($5-VPS, Termux, serverless).
- Du ein **offenes Ökosystem** mit Community-Skills/-Plugins (agentskills.io)
  und **IDE-Integration (ACP)** schätzt.

**Konvergenz / gegenseitige Inspiration:**
Beide teilen viel DNA - SKILL.md-Skills, self-improving Skills mit
Lifecycle-Curator, MCP in beide Richtungen, Sub-Agenten, Context-Kompression,
Multi-Provider-Routing, Cron/Scheduling. Personal Agent hat das (Hermes-inspirierte)
Skill-Self-Authoring inzwischen selbst; offen bleibt Hermes' **automatisches**
Schreiben/Patchen nach jedem Task sowie die **Messaging-Breite**. Hermes könnte
von Personal Agents **durable Execution**, **fail-closed Governance** und
**bitemporalem Memory-Graph** profitieren.

---

*Erstellt durch direkte Quellcode-Analyse beider Repositories. Die Hermes-Seite
basiert auf `NousResearch/hermes-agent` @ `main` (v0.17.x, Juni 2026); einige
Fähigkeiten leben dort in Plugins/Skills/optional-mcps statt im Kern. Der
Vergleich ist notwendigerweise eine Momentaufnahme — beide Projekte bewegen sich
schnell.*
