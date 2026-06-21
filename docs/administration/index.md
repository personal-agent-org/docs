# Administration

The **admin console** is a separate, role-gated area of the app (its own drawer,
reachable only by users with the `admin` role). Use **Back to app** in the top bar
to return to the normal workspace.

This section documents every page in the admin drawer.

## Overview

The landing page is a small platform dashboard:

- **Stat cards** — total `users`, `chats`, `runs`, and accrued `cost` (USD).
- **Tokens per day** — a 14-day line chart of total token throughput.

It's read-only — a quick pulse of the instance. The pages below are where you
actually configure things.

## In this section

<div class="grid cards" markdown>

-   :material-account-group:{ .lg .middle } __User management__

    ---

    People on the instance, their roles and status.

    [:octicons-arrow-right-24: User management](users.md)

-   :material-robot:{ .lg .middle } __Agents__

    ---

    Global delegatable sub-agent types the main agent can hand work to.

    [:octicons-arrow-right-24: Agents](agents.md)

-   :material-server-network:{ .lg .middle } __Providers__

    ---

    LLM providers, their API keys, the models users may pick, and pricing.

    [:octicons-arrow-right-24: Providers](providers.md)

-   :material-account-multiple:{ .lg .middle } __Groups__

    ---

    Teams with OIDC-assigned membership and shared resources.

    [:octicons-arrow-right-24: Groups](groups.md)

-   :material-puzzle:{ .lg .middle } __Integrations__

    ---

    Which integration domains are available, and their governance.

    [:octicons-arrow-right-24: Integrations](integrations.md)

-   :material-storefront:{ .lg .middle } __Skill catalog__

    ---

    Curate the GitHub skills that appear in the users' marketplace.

    [:octicons-arrow-right-24: Skill catalog](skill-catalog.md)

-   :material-chart-line:{ .lg .middle } __Statistics__

    ---

    Platform-wide usage: active users, runs, tokens and cost over time.

    [:octicons-arrow-right-24: Statistics](statistics.md)

-   :material-cash:{ .lg .middle } __Budgets__

    ---

    Monthly USD spend caps at global, group and per-user scope.

    [:octicons-arrow-right-24: Budgets](budgets.md)

-   :material-gavel:{ .lg .middle } __Command policy__

    ---

    Allow / deny / require-approval rules for command execution.

    [:octicons-arrow-right-24: Command policy](command-policy.md)

-   :material-tune:{ .lg .middle } __Platform settings__

    ---

    Global defaults: the security mode and feature flags.

    [:octicons-arrow-right-24: Platform settings](platform-settings.md)

</div>
