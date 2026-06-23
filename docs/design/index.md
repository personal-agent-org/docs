# Design notes

This section collects the longer-form design and planning documents that shaped
Personal Agent. They are working documents — research, comparisons and phased
plans — kept alongside the code so the *why* travels with the *what*.

<div class="grid cards" markdown>

-   :material-compare:{ .lg .middle } __[Feature comparison](../feature-comparison.md)__

    ---

    Personal Agent side-by-side with OpenClaw, Hermes Agent and Home Assistant.

-   :material-home-assistant:{ .lg .middle } __[Home Assistant adoption](../home-assistant-adoption.md)__

    ---

    How the Lovelace dashboard, entity and config-flow models map onto our
    subsystems.

-   :material-home-automation:{ .lg .middle } __[Home Assistant parity roadmap](home-assistant-parity-roadmap.md)__

    ---

    The north-star plan for full HA breadth/depth: a real-time control plane,
    standard entity-class catalog, discovery and the HA-bridge accelerator.

-   :material-graph-outline:{ .lg .middle } __[Universal memory](../universal-memory.md)__

    ---

    The full design of the bitemporal, causal world-state memory graph.

-   :material-shield-account:{ .lg .middle } __[Scope & entity unification](scope-entity-unification.md)__

    ---

    Unifying the principal scope model (user/group, fail-closed) and merging the
    integration-entity and world-memory entity systems.

-   :material-view-dashboard-variant:{ .lg .middle } __[Surfaces](surfaces.md)__

    ---

    Folding chat modes and dashboards into one Lovelace-style "Surface" concept
    (regions, view types, strategies).

-   :material-cog-transfer:{ .lg .middle } __[Unified workflows](workflows-unification.md)__

    ---

    How the programmatic-tool-calling scripts and the Automations subsystem were
    merged into one first-class Workflow.

-   :material-file-document-edit:{ .lg .middle } __[Collaborative notes](notes-collaboration.md)__

    ---

    Turning single-user notes into real-time, shareable collaborative documents.

-   :material-clipboard-list:{ .lg .middle } __[Implementation plan](../implementation-plan.md)__

    ---

    The phased build plan for the platform.

-   :material-account-multiple:{ .lg .middle } __[Sub-agents (durable)](../subagents-durable-followup.md)__

    ---

    Durable-run follow-up work for the sub-agent system.

-   :material-laptop:{ .lg .middle } __[Device agents (durable)](../device-agents-durable-followup.md)__

    ---

    Durable-run follow-up work for device agents.

-   :material-android:{ .lg .middle } __[Android app plan](../personal-agent-android-app-plan.md)__

    ---

    The Android WebView shell plan.

-   :material-cellphone-arrow-down:{ .lg .middle } __[Android expansion plan](../personal-agent-android-expansion-plan.md)__

    ---

    Native-feature expansion for the Android app.

</div>
