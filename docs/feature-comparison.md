# Feature Comparison — Personal Agent vs. OpenClaw, Hermes Agent, Home Assistant

A side-by-side of what each system has. This compares **Personal Agent** (this repo — a
multi-tenant LLM chat + agent SaaS) against three reference systems we researched for the
roadmap:

- **OpenClaw** — single-operator personal-agent framework (built on Pi/earendil).
- **Hermes Agent** — NousResearch's autonomous agent runtime.
- **Home Assistant** — the home-automation platform whose integration/entity/automation
  architecture we model our plugin + entity + automation subsystems on.

Legend: ✓ = has it · ◑ = partial / via add-on / not first-class · ✗ = no · ? = unknown.
The comparison is necessarily approximate — the three references move fast and some
capabilities live in add-ons or external companions rather than the core.

---

## Conversation & Agent Core

| Feature | Personal Agent | OpenClaw | Hermes Agent | Home Assistant |
|---|:---:|:---:|:---:|:---:|
| LLM chat agent | ✓ | ✓ | ✓ | ◑ (Conversation agent) |
| Streaming responses | ✓ | ✓ | ✓ | ◑ |
| Multi-provider models (OpenAI-compat) | ✓ | ✓ | ✓ | ✓ |
| Per-model pricing / cost attribution | ✓ | ◑ | ◑ | ✗ |
| Budget caps (user/org/global) | ✓ | ✗ | ◑ | ✗ |
| Fallback provider chains / routing | ◑ | ◑ | ✓ | ◑ |
| In-flight context compression | ✓ | ◑ | ◑ | ✗ |
| Regenerate / edit-and-rerun | ✓ | ◑ | ? | ✗ |
| Mid-run follow-up (queue while running) | ✓ | ◑ | ? | ✗ |
| Rewind / shadow-git undo of agent edits | ✓ | ✗ | ◑ | ✗ |
| Conversation rewind (truncate + restore) | ✓ | ? | ? | ✗ |

## Tools, Code Execution & Sandboxing

| Feature | Personal Agent | OpenClaw | Hermes Agent | Home Assistant |
|---|:---:|:---:|:---:|:---:|
| Tool calling | ✓ | ✓ | ✓ | ✓ (LLM API / intents) |
| In-process sandboxed code exec | ✓ (Monty) | ◑ | ✓ (PTC via UDS) | ✗ |
| Device/host command execution | ✓ (jailed) | ✓ (SSH/OpenShell) | ✓ (6 backends) | ◑ (shell_command) |
| On-demand cloud sandbox containers | ✓ | ◑ (Docker) | ✓ (Modal/Daytona) | ✗ |
| Command approval / security modes | ✓ (autonomous/approve/judge) | ◑ (allowlists) | ✓ (approval modes) | ✗ |
| LLM "judge" guard over tool calls | ✓ | ✗ | ◑ | ✗ |
| MCP client | ◑ | ◑ | ✓ | ✓ |
| MCP server | ✗ | ? | ✓ | ✓ |

## Coding Workspace

| Feature | Personal Agent | OpenClaw | Hermes Agent | Home Assistant |
|---|:---:|:---:|:---:|:---:|
| Per-chat coding mode | ✓ | ◑ | ◑ | ✗ |
| Editor (Monaco) + PTY terminal | ✓ | ◑ (OpenShell) | ◑ | ✗ |
| Fuzzy/patch edits + apply_patch | ✓ | ✓ | ✓ | ✗ |
| LSP diagnostics + navigation | ✓ | ✗ | ◑ | ✗ |
| Formatters on save | ✓ | ◑ | ◑ | ✗ |
| Todo / task tracking in run | ✓ | ✓ | ✓ | ✗ |
| AGENTS.md / project instructions inject | ✓ | ✓ (SKILL.md) | ✓ (USER.md) | ✗ |
| GitHub integration (PRs/issues/webhooks) | ✓ | ◑ | ◑ | ✗ |

## Memory & Knowledge

| Feature | Personal Agent | OpenClaw | Hermes Agent | Home Assistant |
|---|:---:|:---:|:---:|:---:|
| Long-term memory (vector recall) | ✓ (pgvector) | ✓ (LanceDB/Honcho) | ✓ (9 providers) | ✗ |
| Auto-prefetch relevant memories | ✓ | ◑ | ◑ | ✗ |
| Editable memory file (MEMORY.md style) | ◑ | ✓ | ✓ | ✗ |
| Document RAG | ✓ | ◑ | ◑ | ◑ (via custom) |
| Entity RAG / structured entities | ✓ | ✗ | ✗ | ✓ (registries) |
| User modeling (learned profile) | ✓ | ◑ (USER.md) | ◑ (USER.md) | ✗ |

## Skills & Extensibility

| Feature | Personal Agent | OpenClaw | Hermes Agent | Home Assistant |
|---|:---:|:---:|:---:|:---:|
| Agent skills (capability packages) | ✓ | ✓ (SKILL.md) | ✓ | ✗ |
| Skill marketplace / hub | ✓ (curated Git catalogs) | ✓ (ClawHub) | ✓ (agentskills.io) | ◑ (HACS) |
| Self-authored / self-improving skills | ✓ | ✓ | ✓ | ✗ |
| Plugin/integration framework | ✓ (HA-style folder) | ◑ | ◑ | ✓ |
| Config-flow setup UI + manifests | ✓ | ✗ | ✗ | ✓ |
| Hooks (pre/post events) | ✓ | ✓ | ✓ | ◑ (automations) |

## Sub-agents & Orchestration

| Feature | Personal Agent | OpenClaw | Hermes Agent | Home Assistant |
|---|:---:|:---:|:---:|:---:|
| Sub-agents / delegation | ✓ (explore/delegate) | ✓ | ✓ (delegate_task) | ✗ |
| Parallel fan-out | ✓ | ◑ | ◑ | ✗ |
| Best-of-N synthesis | ✓ | ✗ | ? | ✗ |
| Background / detached sub-agent runs | ✓ | ◑ | ◑ | ✗ |
| Per-sub-agent usage/cost tracking | ✓ | ✗ | ? | ✗ |

## Automations & Proactivity

| Feature | Personal Agent | OpenClaw | Hermes Agent | Home Assistant |
|---|:---:|:---:|:---:|:---:|
| Scheduled automations (cron/heartbeat) | ✓ (Temporal) | ✓ | ✓ | ✓ |
| Event-triggered automations | ✓ (entity events) | ✓ (hooks) | ◑ | ✓ (triggers) |
| Static (LLM-free) workflow actions | ✓ | ✗ | ✗ | ✓ (scripts/scenes) |
| Blueprints / reusable templates | ✗ | ✗ | ✗ | ✓ |
| Commitments / proactive nudges | ✓ | ✓ | ◑ | ◑ (to-do) |
| Autonomous goal loop | ✓ (/goal) | ◑ | ✓ | ✗ |
| Proactive review / agenda | ✓ | ◑ | ◑ | ✗ |

## Communication Channels

| Feature | Personal Agent | OpenClaw | Hermes Agent | Home Assistant |
|---|:---:|:---:|:---:|:---:|
| Email triage + HITL reply | ✓ | ◑ | ◑ | ✗ |
| Signal | ✓ | ✓ | ✓ | ◑ (add-on) |
| WhatsApp | ◑ (planned) | ✓ | ✓ | ◑ (add-on) |
| Telegram / Slack / Discord | ✗ | ✓ | ✓ | ◑ (add-on) |
| Multi-channel unified inbox | ✓ (Posteingang) | ✓ | ✓ (gateway) | ✗ |
| DM pairing / allowlists | ◑ | ✓ | ✓ | ✗ |

## Voice

| Feature | Personal Agent | OpenClaw | Hermes Agent | Home Assistant |
|---|:---:|:---:|:---:|:---:|
| STT (speech-to-text) | ✓ | ✓ | ◑ | ✓ (Assist) |
| TTS (read aloud, streaming) | ✓ | ✓ (Talk Mode) | ◑ | ✓ (Assist) |
| Wake word | ✗ | ◑ | ✗ | ✓ |
| Self-hosted voice models | ✓ (speaches) | ◑ (MLX) | ✗ | ✓ (Wyoming) |

## Multi-tenancy, Auth & Platform

| Feature | Personal Agent | OpenClaw | Hermes Agent | Home Assistant |
|---|:---:|:---:|:---:|:---:|
| Multi-tenant (orgs) | ✓ | ✗ | ◑ | ✗ |
| OIDC / SSO | ✓ (Keycloak) | ✗ | ◑ | ◑ (custom component) |
| Row-level tenant isolation (RLS) | ✓ | ✗ | ✗ | ✗ |
| Groups / teams + shared resources | ✓ | ✗ | ◑ | ◑ (per-entity perms) |
| Per-user admin-curated models | ✓ | ✗ | ◑ | n/a |
| Server-push events (all windows) | ✓ | ✗ | ? | ✓ |

## Clients & Surfaces

| Feature | Personal Agent | OpenClaw | Hermes Agent | Home Assistant |
|---|:---:|:---:|:---:|:---:|
| Web app (SPA) | ✓ (Quasar) | ◑ | ◑ | ✓ (Lovelace) |
| Desktop app | ✓ (Tauri) | ✗ | ✗ | ✗ |
| Android app | ✓ (WebView shell) | ✗ | ✗ | ✓ (companion) |
| Mobile push notifications | ✓ | ✗ | ✗ | ✓ |
| Slash-command palette | ✓ | ◑ | ◑ | ✗ |
| Persona / identity files (SOUL.md etc.) | ◑ | ✓ | ✓ | ✗ |

---

## Reading the table

**Where Personal Agent leads:** multi-tenant SaaS foundations the personal-agent frameworks
don't target — OIDC/Keycloak, row-level tenant isolation, orgs/groups, per-user curated
models, budgets, cost attribution — plus a deep coding workspace (LSP, formatters, shadow-git
rewind, todo) and the security-mode/judge guard over every tool call.

**Where the references lead:**
- **OpenClaw / Hermes** — richer channel breadth (Telegram/Slack/Discord out of the box),
  skill marketplaces (ClawHub / agentskills.io), persona files (SOUL.md/IDENTITY.md), and
  Hermes' heterogeneous execution backends (Modal/Daytona/Singularity) + MCP **server**.
- **Home Assistant** — the mature integration ecosystem: blueprints, the registry model
  (device/area/floor/label), wake-word voice, and a companion mobile app with native sensors.

**Near-term gaps worth closing:** MCP **server** mode, broader channels (Telegram/Slack/
Discord), and automation **blueprints** (reusable parameterized templates) — all of which fit
cleanly into existing subsystems (plugin framework, comms channels, automations) rather than
needing new islands. (A skill marketplace — install from admin-curated GitHub `SKILL.md`
catalogs, agentskills.io-compatible — is now built into the Skills view.)

> Compiled 2026-06 from public docs/source of each reference project. Cells reflect a
> best-effort reading at that time and may lag upstream changes.
