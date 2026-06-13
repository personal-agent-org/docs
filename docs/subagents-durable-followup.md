# Sub-agents in DURABLE runs — design + TODO (follow-up)

**Status:** the sub-agent capability (`explore` + `delegate`) is fully implemented
and tested for **inline** runs (the interactive path users actually drive in a
chat). Durable (Temporal) runs do **not** expose the sub-agent tools yet — the
worker's `chat_agent` simply doesn't include the sub-agent toolset, so durable runs
are *safe* (no half-working path), exactly like durable-MCP and durable-devices.

This documents how to add durable sub-agents when needed.

## Why not "one child workflow per sub-agent"

The scope decision was "Temporal child workflows". On investigation that is **not
reachable** from where it would need to live: in pydantic-ai's Temporal
integration, **tool functions execute inside Temporal _activities_**
(`TemporalFunctionToolset.call_tool` → `workflow.execute_activity(...)`), and
`workflow.execute_child_workflow(...)` is only valid in *workflow* code. A tool
therefore cannot start a child workflow.

Two ways forward:

1. **In-activity fan-out (recommended first step).** The `explore`/`delegate` tool
   runs the sub-agents as parallel `Agent.run()` calls *inside the tool activity*
   — the exact same `agent/subagent.py` runner the inline path uses. Durable in the
   sense that the parent run is a durable workflow; the sub-agents are ordinary
   nested LLM runs within a retriable activity.
2. **Deferred-tool / workflow-level orchestration (true child workflows).** Surface
   "the model wants to delegate" back to the workflow via a deferred-tool result,
   then have `ChatAgentWorkflow.run` start child `ChatAgentWorkflow`s
   (`workflow.execute_child_workflow(ChatAgentWorkflow.run, subspec, ...)`), each
   with its own Continue-As-New / retry. This is a larger re-architecture of the
   tool-execution boundary.

## In-activity fan-out — concrete plan

The runner (`agent/subagent.py`) is transport-agnostic; only the **context
builder** differs. Add a worker-side `subagent_dynamic_toolset()` mirroring
`integration_dynamic_toolset()` in `worker/src/personal_agent_worker/integration_toolsets.py`:

```python
async def _build_subagent(ctx):
    deps = ctx.deps
    # High-privilege (Contract #13): never in automation/comms/untrusted runs,
    # and never inside a sub-agent (depth = 1).
    if not deps.tools_enabled or deps.automation_id or deps.is_subagent:
        return None
    model = agents.resolve_model(deps.model)   # reuse the worker's REGISTERED models
    if model is None:
        return None                            # deploy skew → no sub-agents, not a crash
    def make_ctx():
        return SubagentContext(
            session_factory=resources.session_factory(),
            build_child_toolsets=_explore_preset,   # RAG + web from worker resources
            model=model, model_label=deps.model, execution_mode="durable",
        )
    return subagent_toolset(make_ctx, include_delegate=False)  # explore first
```

Required supporting changes:

- **`PersonalAgentDeps.model: str`** — carry the run's model string so the worker can look
  up the registered Model instance. Set it in both the inline service and the
  durable workflow's `deps` (it's a public model id, not a credential — Contract #5
  still holds). 【TODO marker added in `agent/deps.py`】
- **`agents.resolve_model(name)`** — expose the worker's already-built `models`
  dict (the same instances `chat_agent` uses) so the sub-agent reuses them with no
  in-activity re-decryption. 【TODO marker added in `worker/.../agents.py`】
- **Register** `subagent_dynamic_toolset()` in the `base` agent's `toolsets=` in
  `build_temporal_agent()`. 【TODO marker added in `worker/.../agents.py`】
- **Explore preset in the worker**: `entity_search_toolset` + `document_search_toolset`
  (resources.session_factory + crypto) + `web_toolset` (resolve providers from the
  frozen integration entries, reusing the `_build` provider logic).

### Critical: tool-activity retry policy (no double-billing)

The sub-agent tool is **side-effecting** — it creates `Run` rows and spends tokens.
Temporal activities retry by default (`maximum_attempts=3`), and each retry would
re-run the sub-agents with fresh `run_id`s → **duplicate runs + duplicate cost**.
The static-workflow path already guards against this with `maximum_attempts=1`.

So the sub-agent tool activity MUST be configured **no-retry** (and with a generous
`start_to_close_timeout` + periodic `activity.heartbeat()` for long fan-outs). In
pydantic-ai this is `tool_activity_config={"explore": ActivityConfig(...), ...}`
passed to `TemporalAgent(...)`. Without this, durable sub-agents are unsafe.

### Durable `delegate` (inherited tools)

`delegate` must give the sub-agent "the same tools as the parent". In the worker
that means rebuilding the run's dynamic toolsets (integrations + web + automation +
comms; **not** devices/MCP until those durable paths land) inside
`build_child_toolsets("delegate")` from the frozen snapshot/`deps`, with
`is_subagent=True` so it can't recurse. This is the heavier half — do it after
in-activity `explore` is proven.

## Verification (when implemented)

- Worker test on the time-skipping server: durable run whose model calls `explore`
  with 2 tasks → 2 child `Run` rows (parent_run_id set) + 2× usage records; assert
  the tool activity is no-retry (a forced activity failure must NOT double-create
  child runs).
- Conformance: a tool-free durable run (`tools_enabled=False`) still emits the
  identical AG-UI sequence (the dynamic toolset returns `None`, so nothing changes).
