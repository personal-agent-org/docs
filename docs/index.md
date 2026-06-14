---
hide:
  - navigation
  - toc
---

# Personal Agent

<p class="hero-tagline">
A multi-tenant, self-hostable <strong>LLM chat + agent platform</strong>.
It pairs a reading-first chat UI with a durable agent runtime: per-user
agents that use tools, browse your own data, drive a connected machine or
browser, run integrations, react to events, and act proactively on your behalf.
</p>

[Get started :material-rocket-launch:](getting-started/index.md){ .md-button .md-button--primary }
[Explore the features :material-feature-search:](features/index.md){ .md-button }
[View on GitHub :fontawesome-brands-github:](https://github.com/luebke-dev/personal-assistant){ .md-button }

---

## Built on a modern, durable stack

Personal Agent is built on **FastAPI + pydantic-ai**, a **Quasar / Vue 3**
frontend, **Keycloak/OIDC** auth, **Postgres + pgvector** and **Redis** for
storage and streaming, and **Temporal** for durable runs. The UI is
German-first (English i18n) and ships in containers.

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

---

## Why Personal Agent?

- **Two run paths, one envelope.** A chat turn runs either **inline** (a FastAPI
  background task) or **durable** (a Temporal workflow) — both emit identical
  AG-UI events onto a per-run Redis Stream.
- **No path to an uncleared provider.** A single fail-closed data-classification
  gate runs at every model-resolution entry — inline, durable, automations and
  comms triage.
- **Self-hostable on your own domain.** One built image serves every deployment;
  point it at your domain with a handful of environment variables.
- **Everything is observable.** Built-in OpenTelemetry domain metrics plus
  Prometheus alert rules ship in the box.

[Read the architecture overview :octicons-arrow-right-24:](architecture/index.md){ .md-button }
