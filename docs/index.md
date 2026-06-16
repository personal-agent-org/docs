---
title: Personal Agent — your own LLM chat + agent platform
template: home.html
hide:
  - navigation
  - toc
---

## Explore { .pa-section-title }

<div class="grid cards" markdown>

-   :material-chat-processing:{ .lg .middle } __Chat & agents__

    ---

    Per-chat model, mode and security pickers. Pick a model or `auto`. Sub-agents,
    a `/goal` loop, slash commands, checkpoints and best-of-N attempts.

    [:octicons-arrow-right-24: Chat & agents](features/chat.md)

-   :material-graph:{ .lg .middle } __World-state memory__

    ---

    A bitemporal, causal entity-state graph — not a flat note store. Two time
    axes, provenance, a read/propose/write split and forgetting-as-invalidation.

    [:octicons-arrow-right-24: Memory graph](features/memory.md)

-   :material-laptop:{ .lg .middle } __Devices & coding__

    ---

    A jailed Rust device agent (Linux/macOS/Windows) and a real browser device.
    Coding mode = Monaco editor + PTY terminal + LSP + shadow-git undo.

    [:octicons-arrow-right-24: Devices & coding](features/coding.md)

-   :material-puzzle:{ .lg .middle } __Integrations__

    ---

    A Home-Assistant-style folder tier: drop in a `manifest.yaml` + config flow
    and it shows up configured and callable. Capability providers and MCP, both ways.

    [:octicons-arrow-right-24: Integrations](features/integrations.md)

-   :material-robot-industrial:{ .lg .middle } __Workflows & dashboards__

    ---

    Workflows (sandboxed scripts; a workflow with triggers is an automation, run
    durably on Temporal), Lovelace-style dashboards, entities with full state
    history, and proactive background work.

    [:octicons-arrow-right-24: Workflows & dashboards](features/workflows.md)

-   :material-shield-lock:{ .lg .middle } __Security & governance__

    ---

    Per-chat security modes, untrusted-content gating, BYOK envelope encryption,
    RLS tenancy and fail-closed ABAC data-classification governance.

    [:octicons-arrow-right-24: Security & governance](features/security.md)

</div>

## How it fits together { .pa-section-title }

A chat turn runs either **inline** (a FastAPI background task) or **durable** (a
Temporal workflow); both emit identical AG-UI events onto a per-run Redis Stream.
A single fail-closed data-classification gate runs at every model-resolution entry,
so there is no path to an uncleared provider. The stack is FastAPI + pydantic-ai,
a Quasar / Vue 3 frontend, Keycloak/OIDC, Postgres + pgvector and Redis.

[Read the user guide](features/index.md) ·
[Read the architecture overview](architecture/index.md) ·
[Get started](getting-started/index.md) ·
[Self-hosting guide](self-hosting.md)
