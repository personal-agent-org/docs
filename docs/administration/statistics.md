# Statistics

The **Statistics** page (admin console nav label "Statistics") shows platform-wide
usage aggregated across **all users and tenants**. It is the operator's view of how
much the install is being used, what it costs, and which tools and models dominate —
distinct from a single user's own usage view, which is scoped to the requesting
user only.

All figures are read from the billing-grade `usage_records` table (tokens and cost)
and the `runs` table (run counts, success/failure), so they match what the cost and
budget subsystems charge against.

## Time range

A single control in the top-right selects the window: **1 day, 7, 30 (default), 90,
or 365 days**. Changing it reloads every chart and tile.

!!! note "Hourly buckets at 1 day"
    Selecting **1 day** switches all time-series charts from daily buckets to **24
    hourly buckets** (axis labels become `21:00` instead of `MM-DD`).

## KPI tiles

A row of summary tiles covers the selected window:

| Tile | Meaning |
| --- | --- |
| `Tokens` | Total input + output tokens (abbreviated, e.g. `1.2M`) |
| `Cost` | Total spend in USD |
| `Runs` | Distinct runs; sub-label shows the run **success rate** (`% OK`) |
| `Active users` | Distinct users with activity in the window |
| `Avg cost/run` | Cost divided by runs |
| `Cache hits` | Cache-read tokens; sub-label shows the **cache hit rate** |
| `Failed` | Failed runs (`runs.status == failed`) |
| `Avg tokens/run` | Total tokens / runs |
| `Tool calls` | Total tool calls; sub-label `Ø n/Run` |
| `Tool failures` | Failed tool calls; sub-label shows the failure percentage |
| `Chats` | Platform total chats (**not** windowed); sub-label `Ø n/user` |

!!! note
    `Chats` and its per-user average are all-time platform totals ("how big is the
    install"), unlike the other tiles which respect the time range.

## Charts

- **Active users & runs per day** — a combined chart: successful vs. failed `Runs`
  as stacked bars, with `Active users` overlaid as a line on a second axis.
- **Tokens / cost per day (by model)** — stacked bar charts broken down per model;
  the heaviest models are stacked and the remainder folds into an `Other` series.
- **Tokens by model** — a doughnut of each model's share of total tokens over the
  range.
- **Cache per day** — cache-read (`Cache hits`) vs. cache-write tokens per bucket,
  with the overall hit rate in the header. Shows a hint when no prompt caching
  occurred in the range.
- **Tool calls per day** and **Top tools** — tool-call volume over time and the most-
  used tools, with failure counts (shared with the per-user view via the
  `tool_stats` service).

## Per-user breakdown

Below the platform charts, a **Per user** section ranks the **top 10 users by
tokens** (labelled by email, or a shortened subject if no email is known) as
horizontal bar charts:

- `Tokens per user` (split into input / output)
- `Cost per user` (USD)
- `Avg tokens per run by user`
- `Chats per user`
- `Tool calls per user`

## How it differs from a user's own usage

The per-user **Usage** page shows only the signed-in user's own tokens, cost, runs,
budget and tool stats (server-side scoped to their subject via `/usage/*`). The admin
**Statistics** page aggregates the **whole platform** across all tenants, adds active-
user counts and per-user rankings, and is reachable only from the admin console.
