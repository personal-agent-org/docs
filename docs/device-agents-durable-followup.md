# Follow-up: device tools in DURABLE (Temporal) runs (a.k.a. "P5")

**Status: NOT built (deliberately deferred).** Device agents (the per-user Linux machines
that announce coding tools) are fully wired for **inline** chat runs — registry, WS
connectivity, the device toolset, the approval/policy gate, and the global tool guard all
work and are deployed. This document records the one remaining gap and exactly how to close
it, so it can be picked up later.

## What works today (inline)

A run started interactively executes **inline** (an asyncio task in the FastAPI process,
streamed over SSE). There, `ToolsetAssembler.assemble()` reads `chat.run_config["devices"]`,
fetches the owned + **online** devices, and appends a `build_device_toolset(...)` per device
(`backend/src/aipril/agent/device_toolset.py`). Each tool call goes through
`agent/device_policy.gate_device_call` (autonomous / allow-rule / judge / human approval) and
dispatches over the in-process `DeviceGateway` (`realtime/device_gateway.py`).

## What's missing (durable)

A **durable** run executes as a Temporal workflow in `worker/`. Per Frozen Contract #6, the
durable path does NOT query live DB state mid-run — toolsets are **snapshotted** into
`RunSpec.toolsets` (`packages/aipril-contracts/.../runspec.py` `ToolsetSnapshot`) at start and
the worker rebuilds them from the snapshot via `DynamicToolset`s
(`worker/src/aipril_worker/plugin_toolsets.py`, registered in `agents.py`).

**Device tools are not in that snapshot**, so a durable run with a device selected silently has
no device tools. This only happens when a user sends a chat run **"in the background"** with a
device selected — automations/triage never set `run_config.devices` (and must not: they run over
untrusted content), so there is no functional regression, just an unsupported edge case.

## How to build it

1. **Snapshot** — `runspec.py`: add `DeviceSnapshot(BaseModel, frozen)` with
   `device_id: str` + `announced_tools: dict` (frozen JSON schemas, Contract #6) and
   `ToolsetSnapshot.devices: tuple[DeviceSnapshot, ...] = ()`. Fill it in
   `backend/src/aipril/api/routers/runs.py::_plugin_snapshot` (mirror the plugin snapshot):
   for each owned **online** device in `cfg["devices"]`, freeze its `announced_tools`.

2. **Deps** — `backend/src/aipril/agent/deps.py`: add `device_ids: list[str] = []` to
   `AiprilDeps` (set on the durable path alongside `plugin_entry_ids`).

3. **Worker toolset** — `worker/src/aipril_worker/plugin_toolsets.py`: add
   `device_dynamic_toolset()` (mirror `plugin_dynamic_toolset`) whose in-activity `_build`
   rebuilds `build_device_toolset(...)` from the **snapshot** (NOT a live DB query — use the
   frozen `announced_tools`; construct a lightweight device-like object carrying id + name +
   policy_mode + announced_tools, fetched once in-activity by id is acceptable since the
   activity may do I/O, but prefer the snapshot for the tool schemas). Register it in
   `worker/src/aipril_worker/agents.py` alongside the other dynamic toolsets.

4. **Worker gateway + gate** — the worker holds **no** device WS connections (those live on the
   API pods), so the worker needs its own `DeviceGateway(redis, pubsub_redis, pod_id)` instance
   (wire it in the worker's resource bootstrap). `dispatch` will always take the **cross-pod**
   path (`_dispatch_remote`): publish on `aipril:device:<id>:rpc`, the API pod holding the WS
   forwards it, the reply comes back on the per-request reply channel. The approval gate
   (`gate_device_call` / `request_tool_approval`) already works from any process — it polls the
   `device_approvals` row (shared DB) and pushes the `tool_approval` frame over Redis user-events,
   so it works unchanged inside a Temporal activity (mind activity heartbeats for the up-to-10-min
   approval wait — heartbeat or raise the activity's `start_to_close_timeout`).

5. **Global guard in durable** — `GuardToolset` (`agent/tool_guard.py`) is a `WrapperToolset`;
   wrap the worker's combined toolset the same way the inline assembler does when `GuardConfig`
   is enabled (resolve guard enablement once at snapshot time → carry a flag in `AiprilDeps`, or
   re-read in-activity).

## Verification when built

`test_device_durable` (conformance): a durable run with a device selected gets the device tools
(inline ≡ durable), a `run_command` call routes cross-pod to the agent and returns, and the
approval gate works inside the activity. Plus the existing inline device tests stay green.
