# Automations, entities & dashboards

Integrations expose **entities** and users upload **documents**; both are indexed
in pgvector for semantic search.

## Entities

Entities carry the full Home-Assistant-style registry — state history, device
registry, classes/units, visibility controls, areas/floors, labels and a logbook.

Entities are also **controllable**: a first-party **action contract** routes a
dashboard card, an automation step and the agent (`control_entity`) through one
pipeline, with changes pushed live over the control WebSocket. **Scenes** capture
and re-apply entity states.

## Lovelace-style dashboards

Multi-view tabs, a drag-and-resize grid, badges and a wide card set:

- **Read-outs** — entity / gauge / history / logbook / markdown / picture / iframe /
  agenda
- **Controls** — tile / toggle / number / select / counter / scene
- **Registry** — area / device cards
- **Layout** — stack (vertical / horizontal / grid) and conditional cards

All schema-configured and persisted per user.

## Automations

Automations are HA-style:

- **Temporal schedules** kick off durable agent runs.
- **Event triggers** react to changes.
- A static, **LLM-free action mode** runs deterministic tool-call steps.

## Web tools

In-process **`web_fetch`** reads any page **locally** (HTML → clean Markdown, plus
images and PDFs) behind an **SSRF guard**. A vendor (Tavily / Brave) is used only
for **`web_search`**.

## Proactive & background work

- **Commitment capture** records obligations into an agenda; an **hourly proactive
  review** nudges you about what's due, in the main chat and via push.
- The memory **Curator** runs per-chat, inline after each run (a per-`chat_id`
  Temporal workflow).
- Global **Temporal schedules** keep things tidy: a 15-min entity-sync that also
  prunes state-history and ages skills, the hourly proactive review, and the
  `world/` memory-maintenance jobs (embedding + retention + curator catch-up).

!!! info "Observable by design"
    Background work ships with built-in **OpenTelemetry domain metrics** (Curator
    proposals / commits / pending, context-build latency) plus **Prometheus alert
    rules** under `deploy/observability/`.
