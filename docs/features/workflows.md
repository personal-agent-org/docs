# Workflows, entities & dashboards

Integrations expose **entities** and users upload **documents**; both are indexed
in pgvector for semantic search.

## Entities

Entities carry the full Home-Assistant-style registry — state history, device
registry, classes/units, visibility controls, areas/floors, labels and a logbook.

Entities are also **controllable**: a first-party **action contract** routes a
dashboard card, a workflow and the agent (`control_entity`) through one
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

## Workflows

A **Workflow** is the single unified concept: a named, owner-scoped **sandboxed Monty
Python script** — programmatic tool-calling with loops, fan-out and sub-agents
(`delegate` / `delegate_many`), running the full guard-wrapped toolset on top of the
ambient web + first-party tools. It may optionally scope which integrations and connected
device-agents (plus the companion phone as `phone:<id>`) its tools come from. The agent
authors and runs workflows via `save_workflow` / `list_workflows` / `delete_workflow` /
`run_workflow`.

A Workflow optionally carries **triggers** (schedule / interval / webhook / manual /
event / poll) plus an HA-style **condition** (entity_state / entity_attribute / time /
trigger). **A Workflow with triggers is what used to be an "Automation."** When a trigger
fires, the script runs durably in the background on a Temporal Schedule (→
`WorkflowScheduleWorkflow` → a child `ChatAgentWorkflow` → the `run_script_workflow`
activity), headless, with `send_message_to_user` as its only channel back to you.

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
