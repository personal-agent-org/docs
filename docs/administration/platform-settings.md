# Platform settings

The **Platform settings** page in the admin console (`Admin → Platform settings`) is a
small key→JSON store that holds **platform-wide defaults**. These values layer **over**
the defaults baked into the code (and any ENV overrides): an absent or cleared setting
always falls back to the built-in default, so the platform behaves exactly as it does
out of the box until an admin overrides something here.

Every setting on this page is **server-enforced** — the toggle is not just a UI hint; the
backend reads the effective value at run time and acts on it.

!!! note "Effective values, not raw overrides"
    The page shows the *effective* configuration (built-in defaults merged with any admin
    overrides). Saving with a field left at its built-in default clears the override rather
    than pinning the current default in place.

## Default security mode

This control sets the default **tool-call security mode** for runs that don't carry their
own per-chat or per-user pick.

| Option | Value | Behaviour |
| --- | --- | --- |
| Built-in default | *(cleared)* | No platform override — the code default applies. |
| Autonomous (no approval) | `autonomous` | Tool calls run without approval. |
| Approve each tool call | `approve_each` | Every tool call waits for the user to approve it. |
| Judge (model-reviewed) | `judge` | A guard model reviews each tool call. |

The effective mode for a run is resolved in this order:

1. the run's **per-chat / per-user** security pick, if any;
2. this **platform default**;
3. the **built-in default** (`judge` when a guard model is configured, otherwise
   `autonomous`).

!!! note "Per-chat and per-user picks still win"
    This is only a *default*. A user's per-chat or per-user security choice always takes
    precedence over the platform default. If `judge` is selected but no guard model is
    configured, runs fall back to `approve_each`.

The platform default applies on every chat run. Inline and durable chat share one
executor, so a durable chat run resolves the same effective mode and is wrapped by the
same guard (`judge` / `approve_each` parity included). Triggered workflow scripts run
headless: writes stay gated by the effective security mode, but any tool call that would
need interactive approval fail-denies instead of hanging the background run. When no mode
is in force, the catastrophic-command deny-floor still blocks destructive shell commands.

## Feature flags

Feature flags turn platform capabilities on or off for **everyone**. They default to **on**
(current behaviour); an admin can disable one platform-wide. Unknown keys are ignored.

| Flag | Key | What it toggles |
| --- | --- | --- |
| Proactive review | `proactive` | Hourly briefings written into the main chat about due items. |
| Voice | `voice` | Microphone (speech-to-text) and read-aloud (text-to-speech). |

Each flag is enforced at the feature's own gate: `proactive` gates the hourly proactive
scheduler, and `voice` gates the voice endpoints (and is surfaced to clients so the UI
hides voice controls when it is off).

## Entity history retention

Numeric entity state is recorded as raw history, periodically **rolled up** into long-term
per-period statistics, and then the now-rolled-up raw rows are **trimmed** to a bounded
window. This setting is the **single source of truth** for that window.

| Setting | Key | Default | Effect |
| --- | --- | --- | --- |
| Entity history retention (days) | `entity_history_retention_days` | `30` | How far back raw entity state history is kept before being pruned. |

Both paths read the same value: the roll-up's trim (it only ever deletes raw rows already
captured in a statistics period) and the backstop prune. The backstop never deletes data
newer than the window. Statistics graphs on the [entity detail page](../features/entities.md#per-entity-detail-state-history-cause-effect)
keep working past the window because they read the rolled-up statistics, not the raw rows.

## Extension point

Platform settings is the GUI home for global knobs. It is designed to grow: new
admin-managed defaults are added by extending the typed accessors in
`core/platform_settings.py` (which own the setting keys and their fallback defaults) and
surfacing them on this page — keeping callers decoupled from how the values are stored.
