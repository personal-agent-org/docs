# Using Personal Agent

Personal Agent is a broad platform. These pages break the product surface into
focused, user-facing capabilities — each one drawn from what ships in the box.

<div class="grid cards" markdown>

-   :material-chat-processing:{ .lg .middle } __[Chat & agents](chat-agents.md)__

    ---

    Per-chat pickers, `auto` model selection, sub-agents, programmatic tool
    calling, the `/goal` loop, slash commands and checkpoints.

-   :material-graph:{ .lg .middle } __[Memory graph](memory.md)__

    ---

    The bitemporal, causal world-state graph: entities, facts, two time axes,
    the read/propose/write split and forgetting-as-invalidation.

-   :material-laptop:{ .lg .middle } __[Devices & coding](devices.md)__

    ---

    The Rust device agent, the browser device, coding mode and the on-demand
    cloud sandbox.

-   :material-puzzle:{ .lg .middle } __[Integrations](integrations.md)__

    ---

    The folder tier, config flows, governance, capability providers and MCP in
    both directions.

-   :material-robot-industrial:{ .lg .middle } __[Automations & dashboards](automations.md)__

    ---

    HA-style automations, Lovelace-style dashboards, entities, scenes and
    proactive background work.

-   :material-shield-lock:{ .lg .middle } __[Security & governance](security.md)__

    ---

    Per-chat security modes, untrusted-content gating, BYOK, tenancy/RLS and ABAC
    data-classification governance.

</div>

## Skills, context & budgets

A few cross-cutting capabilities sit across every chat:

- **Skills** — user-authored packages with **progressive disclosure** and
  runtime-enforced allowed-tools; a background **skill-curator** ages idle skills
  (active → stale → archived, reactivating on use). Skills install from an
  agentskills.io-style marketplace of admin-curated Git catalogs.
- **In-flight compression** — tail + summary compaction keeps long runs inside
  the model's window.
- **Budget caps** — monthly USD caps (user > org > global) return `429` when
  exceeded; the cap also stops sub-agent spawning **mid-turn**.
- **Statistics** — an admin dashboard (per-day/per-model tokens, cost and cache
  hits, active users & runs, tool-call analytics) built from shared chart
  components that also power the user's own usage page.

## Voice, groups & apps

- **Voice** — speech-to-text and streaming text-to-speech via admin-configured
  OpenAI-compatible audio models.
- **Groups** — admin-configured teams with OIDC-assigned membership and shared
  folders/automations.
- **Apps** — an Android WebView shell (OIDC, push, sensor reporting) and a Tauri
  desktop app; downloads live in Settings. A **first-login setup wizard** walks
  new users through initial configuration.
