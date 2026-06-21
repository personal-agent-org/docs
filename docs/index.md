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

    Per-chat model, mode and security pickers (or `auto`, with a governance-aware
    fallback chain). Sub-agents, a `/goal` loop, slash commands, voice in/out,
    checkpoint/rewind and best-of-N attempts.

    [:octicons-arrow-right-24: Chat & agents](features/chat.md)

-   :material-view-split-vertical:{ .lg .middle } __Surfaces__

    ---

    A chat is a configurable layout of regions — the thread plus editor, terminal
    or dashboard-card panels — not a fixed mode. *standard* and *coding* are just
    builtin surfaces; define your own, and the same model powers chat-less dashboards.

    [:octicons-arrow-right-24: Surfaces](design/surfaces.md)

-   :material-graph:{ .lg .middle } __World-state memory__

    ---

    A bitemporal, causal entity-state graph — not a flat note store. Live integration
    entities and long-term memory are one graph: two time axes, provenance, and a
    read / propose / write split.

    [:octicons-arrow-right-24: Memory & entities](features/memory.md)

-   :material-puzzle:{ .lg .middle } __Integrations__

    ---

    Drop a `manifest.yaml` + config flow under `integrations/` and it contributes its
    tools — plus agents, surfaces, dashboard cards, entities and message providers.
    Capability providers, and MCP & OpenAPI in both directions.

    [:octicons-arrow-right-24: Integrations](features/integrations.md)

-   :material-inbox-multiple:{ .lg .middle } __Unified inbox__

    ---

    Email, Signal, Matrix, Zulip and WhatsApp triaged into one cockpit, with
    human-approved draft replies and cross-channel contact threads.

    [:octicons-arrow-right-24: Unified inbox](features/inbox.md)

-   :material-notebook:{ .lg .middle } __Your data & agenda__

    ---

    First-class Notes, Files, Calendar and Contacts pages, plus an agenda merging
    commitments and events — with hourly proactive nudges in your main chat.

    [:octicons-arrow-right-24: Notes, files & agenda](features/notes-files.md)

-   :material-sitemap:{ .lg .middle } __Workflows__

    ---

    Sandboxed scripts run durably on Temporal. A workflow with triggers *is* an
    automation — schedules plus event and entity-state conditions.

    [:octicons-arrow-right-24: Workflows](features/workflows.md)

-   :material-view-dashboard:{ .lg .middle } __Dashboards__

    ---

    Card dashboards — the chat-less Surfaces — over your entities: cards, sections,
    conditions, scenes and a logbook.

    [:octicons-arrow-right-24: Dashboards](features/dashboards.md)

-   :material-devices:{ .lg .middle } __Devices__

    ---

    A cross-platform Rust device agent (Linux/macOS/Windows) hosting jailed workspaces
    (e.g. for coding), a real browser device (Chrome extension or on-demand cloud),
    your phone, and fire-and-review cloud coding tasks (sandbox → diff → PR).

    [:octicons-arrow-right-24: Devices](features/devices.md)

-   :material-toolbox:{ .lg .middle } __Skills__

    ---

    User-authored capability packages with progressive disclosure, and a marketplace
    of curated catalogs.

    [:octicons-arrow-right-24: Skills](features/skills.md)

-   :material-shield-lock:{ .lg .middle } __Security & governance__

    ---

    Per-chat security modes, untrusted-content gating, BYOK envelope encryption, RLS
    tenancy, monthly budget caps, and fail-closed ABAC data-classification — no path
    to an uncleared provider.

    [:octicons-arrow-right-24: Security & governance](features/security.md)

-   :material-cellphone-link:{ .lg .middle } __Clients__

    ---

    A web SPA + PWA, Android and desktop shells, a Chrome extension, and a native Rust
    terminal client (TUI) — all over the same HTTP/SSE API.

    [:octicons-arrow-right-24: Apps & clients](features/devices.md#native-apps)

</div>

## How it fits together { .pa-section-title }

A chat turn runs either **inline** (a FastAPI background task) or **durable** (a
Temporal workflow); both emit identical **AG-UI** events onto a per-run Redis Stream
that the API relays to clients over SSE. A single fail-closed data-classification gate
runs at every model-resolution entry, so there is no path to an uncleared provider.

[Read the user guide](features/index.md) ·
[Architecture overview](architecture/index.md) ·
[Frozen contracts](architecture/frozen-contracts.md) ·
[Get started](getting-started/index.md) ·
[Self-hosting guide](self-hosting.md)
