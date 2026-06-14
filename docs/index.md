---
title: Personal Agent — your own LLM chat + agent platform
template: home.html
hide:
  - navigation
  - toc
---

## Everything in one platform { .pa-section-title }

<div class="grid cards" markdown>

-   :material-chat-processing:{ .lg .middle } __Chat & agents__

    ---

    Per-chat model, mode and security pickers. Pick a model or `auto`. Sub-agents,
    a `/goal` loop, slash commands, checkpoints and best-of-N attempts.

    [:octicons-arrow-right-24: Chat & agents](features/chat-agents.md)

-   :material-graph:{ .lg .middle } __World-state memory__

    ---

    A bitemporal, causal entity-state graph — not a flat note store. Two time
    axes, provenance, a read/propose/write split and forgetting-as-invalidation.

    [:octicons-arrow-right-24: Memory graph](features/memory.md)

-   :material-laptop:{ .lg .middle } __Devices & coding__

    ---

    A jailed Rust device agent (Linux/macOS/Windows) and a real browser device.
    Coding mode = Monaco editor + PTY terminal + LSP + shadow-git undo.

    [:octicons-arrow-right-24: Devices & coding](features/devices.md)

-   :material-puzzle:{ .lg .middle } __Integrations__

    ---

    A Home-Assistant-style folder tier: drop in a `manifest.yaml` + config flow
    and it shows up configured and callable. Capability providers and MCP, both ways.

    [:octicons-arrow-right-24: Integrations](features/integrations.md)

-   :material-robot-industrial:{ .lg .middle } __Automations & dashboards__

    ---

    HA-style automations on durable Temporal runs, Lovelace-style dashboards,
    entities with full state history, and proactive background work.

    [:octicons-arrow-right-24: Automations & dashboards](features/automations.md)

-   :material-shield-lock:{ .lg .middle } __Security & governance__

    ---

    Per-chat security modes, untrusted-content gating, BYOK envelope encryption,
    RLS tenancy and fail-closed ABAC data-classification governance.

    [:octicons-arrow-right-24: Security & governance](features/security.md)

</div>

## Why Personal Agent? { .pa-section-title }

<div class="grid pa-why" markdown>

-   :material-swap-horizontal-bold:{ .lg } __Two run paths, one envelope__

    A chat turn runs **inline** (a FastAPI background task) or **durable** (a
    Temporal workflow) — both emit identical AG-UI events onto a per-run Redis Stream.

-   :material-lock-check:{ .lg } __No path to an uncleared provider__

    A single fail-closed data-classification gate runs at every model-resolution
    entry — inline, durable, automations and comms triage.

-   :material-server-network:{ .lg } __Self-host on your own domain__

    One built image serves every deployment; point it at your domain with a
    handful of environment variables.

-   :material-chart-line:{ .lg } __Observable by design__

    Built-in OpenTelemetry domain metrics plus Prometheus alert rules ship in
    the box.

</div>

<div class="pa-cta" markdown>

### Ready to dive in?

Bring up the full stack locally in minutes, or deploy your own instance.

[Get started :material-rocket-launch:](getting-started/index.md){ .md-button .md-button--primary }
[Read the architecture :octicons-arrow-right-24:](architecture/index.md){ .md-button }

</div>
