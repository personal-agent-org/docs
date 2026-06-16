# Unified Workflows (shipped design)

Status: **DONE / shipped** (2026-06-16). The two programmatic-tool-calling scripts
(`run_tools_script` / `run_agents_script`) and the entire **Automations** subsystem were
merged into ONE first-class **Workflow** concept, then collapsed to a SINGLE form. The
separate Automations subsystem no longer exists: **a Workflow with triggers IS what used to
be an "Automation."** Modeled on Claude Code's own Workflow tool (meta
`{name, description, when_to_use}` + a script body + save-by-name + discovery).

**Skills stay a SEPARATE system** — they are not absorbed into workflows. A Skill is an
authored prose PLAYBOOK the LLM reads (progressive disclosure via `use_skill`); a Workflow
is an EXECUTABLE script. The two keep their own tables, tools and UI.

## The unified model

A **Workflow** is a named, owner-scoped, **sandboxed Monty Python script** — programmatic
tool-calling with loops, fan-out and sub-agents (`delegate` / `delegate_many`), running the
full guard-wrapped toolset. **There is NO `kind`.** The old script-vs-agents split, the
"static steps" IR (tool/llm/extract) and the "agent prompt" action mode are GONE —
everything is a script.

```
Workflow {
  id, owner_sub, org_id,
  name (slug), description, when_to_use,   # self-describing discovery (Skill-style)
  script,                                  # the sandboxed Monty Python body
  enabled, source, usage_meta,
  integrations: [config_entry_id],         # optional: integration tools the script may use
  devices: [device_id | "phone:<id>"],     # optional: connected device-agent tools
  triggers: [ {kind: schedule|interval|webhook|manual|event|poll, config} ],
  condition?: HA-style (entity_state | entity_attribute | time | trigger)
}
```

- **Script body** — a sandboxed Monty Python script. Spawning a sub-agent
  (`delegate` / `delegate_many` with an `agent=` selector) is *just another function* in the
  sandbox, alongside the data tools and the full chat toolset. Inner tool calls run through
  the chat's **guard-wrapped** toolset, so every call honors the per-run security mode
  (`approve_each` / `judge`) + governance + the untrusted-content gate.
- **Triggers** — a Workflow may carry triggers: schedule / interval / webhook / manual /
  event / poll, plus an optional HA-style **condition** (entity_state / entity_attribute /
  time / trigger). A triggered Workflow is the old "Automation."
- **Integrations + devices** — a Workflow may scope which integration config-entries and
  connected device-agents (plus the companion phone as `phone:<id>`) it may use, on top of
  the ambient web + first-party tools.

## How a Workflow runs

- **Inline** — the agent runs a Workflow in-chat via the `run_workflow` tool (by `script=`
  or by saved `name=`). The agent authors/manages workflows via `save_workflow` /
  `list_workflows` / `delete_workflow` / `run_workflow`. Enabled workflows' `when_to_use` is
  injected into a discovery preamble (mirrors the skills pattern; skills are not reused).
- **Durable (triggered)** — a trigger fires a Workflow in the background via a Temporal
  **Schedule** → `WorkflowScheduleWorkflow` → `prepare_workflow_run` → a child
  `ChatAgentWorkflow` → the `run_script_workflow` activity. The activity runs the script
  **headless** with the full guard-wrapped toolset + sub-agents + `send_message_to_user`
  (the run's only channel to the user; its own output chat is hidden, so a detached
  background run can still reach the user).

A headless/detached background run is `headless` → the guard **fail-denies** approval
instead of hanging on a HITL card.

## Why script-only

Collapsing to a single script form removes the dead branches (the `WorkflowStep` IR, the
agent-prompt mode) and the script-vs-agents tool split. What's available to a script is
decided by the run's capabilities + permissions, not by which of several tools the model
picked. A script is strictly more expressive than the old static step-lists, so nothing is
lost; everything authored as a workflow is one authoring + one execution path.

## Code map

- **Trigger engine** — `services/api/src/personal_agent/workflows/` (executor, triggers,
  conditions, schedule_sync, event_dispatcher, tool_emitter, events). The Automations
  subpackage is gone; this is its successor.
- **Contracts** — `personal_agent_contracts/workflow_trigger.py` (`WorkflowFireSpec`,
  `WORKFLOW_SCHEDULE_WORKFLOW`); `RunSpec.script` + `RunSpec.workflow_id`.
- **DB** — one `workflows` table (+ a `workflow_secrets` webhook sidecar). The migration
  preserved existing automation ids + schedules.
- **REST** — one `/workflows` surface: CRUD + enable/disable/confirm/run/runs/rotate-token,
  plus the public `/webhooks/workflows/{id}`.
- **Frontend** — a "Workflows" drawer page (the list), a dedicated `/workflows/new` and
  `/workflows/:id/edit` form page (not a dialog). The Hooks tab lives on the Workflows list
  page.

## Invariants preserved

- Contract #1/#2 — usage recorded per `ModelResponse`, idempotent on
  `(run_id, request_index)`; sub-agents keep their own `run_id` + `parent_run_id` + usage.
- Contract #6 — toolsets snapshotted into the `RunSpec` at run start; the workflow never
  queries live DB state during a run/replay.
- Contract #13 — when an untrusted source is in a run, the assembler drops high-privilege
  first-party / device tools; the durable worker mirrors this per-request.
- Contract #14 — `enforce_classification` runs at every model-resolution entry, including
  the triggered durable path.
- **Schedule survival** — Temporal Schedules are id-stable (`autorun:{id}`); a boot
  reconcile pass re-syncs schedules against the `workflows` table.
