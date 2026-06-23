# Follow-up: device tools in DURABLE (Temporal) runs (a.k.a. "P5")

!!! success "Status: SHIPPED, but NOT the way this doc planned it."
    This gap was closed as a side effect of the durable-execution **consolidation** (the
    `ChatAgentWorkflow` now runs ONE coarse `run_chat_turn` activity that reuses the inline
    `AgentService.execute_inline_run` executor in the worker process). The fine-grained
    `TemporalAgent` path and `worker/integration_toolsets.py` were deleted, so the
    snapshot-based plan below ("How to build it") is obsolete and is kept only as a record.
    What actually closed it: the worker's `AgentService` is constructed with a worker
    `DeviceGateway` (`worker/resources.py::device_gateway`), and `execute_inline_run` runs the
    SAME `ToolsetAssembler` that reads `chat.run_config["devices"]` and builds
    `build_device_toolset(...)` per online device. A durable run with a device selected now
    gets the device tools, dispatched cross-pod over Redis. See the section below for the live
    wiring.

Device agents (the per-user Linux machines that announce coding tools) are fully wired for
**inline** chat runs - registry, WS connectivity, the device toolset, the approval/policy
gate, and the global tool guard all work and are deployed. This document originally recorded
the one remaining gap (durable runs) and how to close it; that gap is now closed.

## What works today (inline)

A run started interactively executes **inline** (an asyncio task in the FastAPI process,
streamed over SSE). There, `ToolsetAssembler.assemble()` reads `chat.run_config["devices"]`,
fetches the owned + **online** devices, and appends a `build_device_toolset(...)` per device
(`src/personal_agent/agent/device_toolset.py`). Each tool call goes through
`agent/device_policy.gate_device_call` (autonomous / allow-rule / judge / human approval) and
dispatches over the in-process `DeviceGateway` (`realtime/device_gateway.py`).

## The original gap (historical)

When this was written, a **durable** run rebuilt its toolsets from a frozen `ToolsetSnapshot`
on the `RunSpec` via per-toolset `DynamicToolset`s in `worker/integration_toolsets.py`, and
device tools were never put into that snapshot - so a durable run with a device selected
silently had no device tools. This only happened when a user sent a chat run **"in the
background"** with a device selected (triggered workflows/triage never set `run_config.devices`
and must not, since they run over untrusted content), so it was an unsupported edge case, not
a regression.

That whole snapshot-rebuild machinery is gone. The durable consolidation replaced it with a
single coarse `run_chat_turn` activity that runs the inline `execute_inline_run` executor in
the worker, which assembles toolsets (devices included) live in-activity. Frozen Contract #6
(no live DB during a *workflow* replay) is preserved because the assemble happens inside an
activity, not the workflow, and a chat turn is one non-resumable activity.

## How it was going to be built (SUPERSEDED, kept as a record)

!!! note "This plan was never implemented."
    It targeted the fine-grained `TemporalAgent` worker path and
    `worker/integration_toolsets.py`, both since deleted. The gap was closed differently (see
    the status note up top and "How it actually works" below). Steps 4 and 5 still describe
    machinery that now exists in spirit: the worker DOES hold its own `DeviceGateway` and the
    cross-pod dispatch + approval gate work from any process.

1. **Snapshot** — `runspec.py`: add `DeviceSnapshot(BaseModel, frozen)` with
   `device_id: str` + `announced_tools: dict` (frozen JSON schemas, Contract #6) and
   `ToolsetSnapshot.devices: tuple[DeviceSnapshot, ...] = ()`. Fill it in
   `src/personal_agent/api/routers/runs.py::_integration_snapshot` (mirror the integration snapshot):
   for each owned **online** device in `cfg["devices"]`, freeze its `announced_tools`.

2. **Deps** - `src/personal_agent/agent/deps.py`: add `device_ids: list[str] = []` to
   `PersonalAgentDeps` (set on the durable path alongside `integration_entry_ids`).

3. **Worker toolset** - `src/personal_agent/worker/integration_toolsets.py`: add
   `device_dynamic_toolset()` (mirror `integration_dynamic_toolset`) whose in-activity `_build`
   rebuilds `build_device_toolset(...)` from the **snapshot** (NOT a live DB query — use the
   frozen `announced_tools`; construct a lightweight device-like object carrying id + name +
   policy_mode + announced_tools, fetched once in-activity by id is acceptable since the
   activity may do I/O, but prefer the snapshot for the tool schemas). Register it in
   `src/personal_agent/worker/agents.py` alongside the other dynamic toolsets.

4. **Worker gateway + gate** - the worker holds **no** device WS connections (those live on the
   API pods), so the worker needs its own `DeviceGateway(redis, pubsub_redis, pod_id)` instance
   (wire it in the worker's resource bootstrap). `dispatch` will always take the **cross-pod**
   path (`_dispatch_remote`): publish on `personal_agent:device:<id>:rpc`, the API pod holding the WS
   forwards it, the reply comes back on the per-request reply channel. The approval gate
   (`gate_device_call` / `request_tool_approval`) already works from any process — it polls the
   `device_approvals` row (shared DB) and pushes the `tool_approval` frame over Redis user-events,
   so it works unchanged inside a Temporal activity (mind activity heartbeats for the up-to-10-min
   approval wait — heartbeat or raise the activity's `start_to_close_timeout`).

5. **Global guard in durable** — `GuardToolset` (`agent/tool_guard.py`) is a `WrapperToolset`;
   wrap the worker's combined toolset the same way the inline assembler does when `GuardConfig`
   is enabled (resolve guard enablement once at snapshot time → carry a flag in `PersonalAgentDeps`, or
   re-read in-activity).

## How it actually works (live)

- **One executor.** `worker/workflows.py::ChatAgentWorkflow` schedules `activities.run_chat_turn`,
  which calls `AgentService.execute_inline_run` in the worker process - the same code the inline
  (FastAPI) path runs. So durable chat inherits device tools (plus vision sidecar, context
  self-heal, transient backoff, resumable partials, follow-ups) for free.
- **Worker gateway.** The worker's `AgentService` (`worker/goal_activities.py::_agent_service`)
  is built with `device_gateway=resources.device_gateway()`. That `DeviceGateway`
  (`worker/resources.py`) is constructed with a `pod_id` of `worker-<hostname>`, so it is never
  `is_local` for a device and always takes the cross-pod path.
- **Cross-pod dispatch.** `DeviceGateway._dispatch_remote` publishes on
  `personal_agent:device:<device_id>:rpc` (`contracts/keys.py::device_rpc_channel`); the API pod
  holding the device WS forwards the call and the reply comes back on
  `personal_agent:device:rpc-reply:<req_id>` (`device_rpc_reply_channel`).
- **Approval gate, unchanged.** `agent/device_policy.gate_device_call` /
  `request_tool_approval` (autonomous / allow-rule / judge / human-approval) poll the
  `device_approvals` row in the shared DB and push the approval over Redis
  (`device_approval_channel`), so they work the same inside the activity. The global
  `GuardToolset` (`agent/tool_guard.py`) is wrapped on by the shared `assemble()` itself
  (`wrap_with_guard`), so it covers durable runs without any worker-specific code.

!!! note "Stale code comment"
    `assembler/assembler.py` still carries an "INLINE only - the durable/Temporal path doesn't
    snapshot devices yet" comment near the device branch. That comment is out of date: the same
    `assemble()` runs in the worker. The behaviour is correct; only the comment lags.
