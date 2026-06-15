# Unified Workflows (design + roadmap)

Status: **proposed** (2026-06-15). Consolidates three fragmented mechanisms — the two
programmatic-tool-calling scripts, the Skills playbooks, and the Automation static
step-lists — into ONE first-class **Workflow** concept, and ultimately absorbs the whole
Automation system as "a workflow with a trigger". Modeled on Claude Code's own Workflow
tool (meta `{name, description, whenToUse}` + a script body + save-by-name + discovery).

## Target model

A **Workflow** is a named, owner-scoped definition of "something that runs":

```
Workflow {
  id, owner_sub, org_id,
  name (slug), description, when_to_use,     # self-describing discovery (Skill-style)
  kind: "script" | "steps" | "agent",        # how it executes
  body,                                       # script text | step IR (tool/llm/extract) | prompt
  enabled, allowed_tools?, source, usage_meta,
  triggers: [ {kind: manual|chat|schedule|event|slash, config} ]   # Phase 4
}
```

- **kind=script** — a sandboxed Monty Python script (today's `run_tools_script` +
  `run_agents_script`, unified). **There is NO tools-vs-agents split**: spawning a
  sub-agent (`explore`/`delegate`/`run_agent`/…) is *just another tool* injected into the
  sandbox, alongside the data tools and — once the permission seam is closed — the full
  chat toolset. What's available is decided by the run's capabilities + permissions, not by
  which of two tools the model picked. Inner tool calls run through the chat's
  **guard-wrapped** toolset, so every call honors the per-run security mode
  (`approve_each`/`judge`) + governance (decision: *full toolset through the guard*).
- **kind=steps** — the deterministic `WorkflowStep` IR (tool/llm/extract,
  `{{trigger}}`/`{{steps.x}}` templating), reusing `run_static_workflow`.
- **kind=agent** — a plain agent-prompt run (today's automation `action.kind=agent`).

**An Automation becomes a Workflow + a trigger binding.** The Automation subsystem
(Temporal Schedules, the event dispatcher) stops being a separate concept and becomes the
**trigger layer** that fires a Workflow. `RunSpec` already carries `workflow` (steps) and
rides the same durable `ChatAgentWorkflow` + persist/record/notify tail — the unification
extends, not replaces, that path.

## How today's pieces map

| Today | Becomes |
|---|---|
| `run_tools_script` (Monty, read-only) | ad-hoc **kind=script** run, no sub-agents |
| `run_agents_script` (Monty + sub-agents) | ad-hoc **kind=script** run, sub-agents capability on |
| `save_skill` / `use_skill` / Skills preamble | saved Workflow + `when_to_use` discovery preamble |
| Automation `action.kind=workflow` (steps) | saved **kind=steps** Workflow |
| Automation `action.kind=agent` (prompt) | saved **kind=agent** Workflow |
| Automation trigger + schedule | a Workflow **trigger binding** |

## Permission seam (the load-bearing change)

Today a Monty script dispatches inner tools through its OWN unwrapped read-only toolset —
the security guard (`approve_each`/`judge`) is applied only at the *script tool boundary*,
never per inner call. Safe today only because the inner surface is a hardcoded read-only
allowlist (`CODE_RPC_TOOLS`) and the script tool is high-privilege (untrusted-gated).

Decision: a unified workflow may call the **full** chat toolset, so inner calls MUST
re-enter `wrap_with_guard` — each inner call gated like a direct call, with mid-script HITL
(deferred-approval) semantics, and the sub-agent fail-deny branch preserved for headless
workers. This is the highest-risk phase and is sequenced after the safe unification.

## Phased delivery (each phase independently shippable)

1. **Unify the scripts.** `run_tools_script` + `run_agents_script` → ONE `run_workflow` tool
   backed by ONE Monty executor whose injected externals = the data tools + the sub-agent
   spawners (when available) — i.e. sub-agent spawning is just a tool, not a second tool/path.
   Extract the shared Monty core; behavior preserved (sub-agents available at depth 1).
2. **Permission upgrade.** Route the script's inner tool calls through the chat's
   guard-wrapped toolset; full toolset; per-call `approve_each`/`judge` + governance;
   mid-script HITL.
3. **Persistence + discovery.** A dedicated `workflows` table (+ repo, migration, web
   page). The agent gets the management surface: `run_workflow(script=… | name=…)`,
   `save_workflow(name, description, when_to_use, script)`, `list_workflows()`,
   `delete_workflow(name)`. Enabled workflows' `when_to_use` is injected into the agent
   preamble for discovery (mirror `build_skills_preamble`); `enabled` toggle on the page.
4. **Converge steps + agent kinds.** Fold the `WorkflowStep` IR and the agent-prompt mode
   into the same table (`kind`). The agent can author all three kinds.
5. **Absorb Automations.** Automations become trigger bindings on a Workflow (schedule via
   Temporal Schedules, event via the dispatcher, plus chat/slash/manual). Migrate existing
   `automations` rows → `workflows` + trigger bindings (reversible migration; the live
   automation subsystem stays working throughout — strangler-fig, not big-bang).

## Risks / invariants to preserve

- Automations are **live** (all phases done+deployed). Phase 5 is a strangler migration with
  a reversible path; never a flag-day rewrite.
- `_WORKFLOW_ACT` retry-disabled + `FunctionModel(_no_model)` (no-LLM, no-auto-retry for
  side-effecting steps) must survive.
- Contract #6 (snapshot at run start), #1/#2 (per-ModelResponse usage), #13 (untrusted gate),
  #14 (classification) all hold; sub-agents keep own run_id + parent_run_id + usage.
- Backend strings English (fix the German strings in `workflow_runner.py` while there).
