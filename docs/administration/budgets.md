# Budgets

The **Budgets** page (admin console → *Budgets*) sets **monthly USD spend caps**
on LLM cost. A cap limits how much a user may spend on model usage in the current
calendar month; once it is reached, new runs are rejected. Caps are optional: with
none configured, usage is unlimited.

## Scope hierarchy

A cap is set at one of three scopes. The effective cap for a user is resolved by
**precedence, not sum**: the most specific configured scope wins.

| Scope | Applies to | `subject` |
| --- | --- | --- |
| `user` | One user (highest precedence) | The user's Keycloak `sub` |
| `org` | All users in an organisation | The org id |
| `global` | Default for everyone | none |

A `user` cap overrides an `org` cap, which overrides the `global` default. If a user
has no `user` cap, their org's cap applies; failing that, the global default; failing
that, they are unlimited.

!!! note "Per-user accounting"
    A cap is enforced **per user**, against that user's own spend this month. An
    `org` or `global` cap is therefore a per-user limit applied to everyone in that
    scope - it is not a shared pool divided across users.

## Setting a cap

The form at the bottom of the page creates or updates a cap (an existing cap at the
same scope/subject is overwritten):

| Field | Notes |
| --- | --- |
| `scope` | `Global (default)`, `Organisation`, or `User`. |
| `subject` | Shown only for `org`/`user`. Labelled `User sub (Keycloak id)` or `Org id`. Required unless scope is `global`. |
| `monthly_usd` | The cap in USD per month (`USD / month`). Minimum `0`, step `0.01`. |

Press **Set** to save. The button is disabled until the amount is `≥ 0` and (for
`org`/`user`) a subject is entered.

## Listing, editing, and clearing

Existing caps are listed above the form, each showing its scope, subject (if any),
and the monthly amount. To **edit** a cap, set a new value at the same scope and
subject - it replaces the old one. To **clear** a cap, use the delete (trash) icon
on its row; that scope/subject then falls back to the next level of the hierarchy.

The page is backed by three admin endpoints: `GET /admin/budgets` (list),
`PUT /admin/budgets` (set/overwrite, keyed on `scope`+`subject`), and
`DELETE /admin/budgets?scope=…&subject=…` (clear).

## What happens when a cap is exceeded

Before a run launches, the user's effective cap is resolved (user → org → global)
and compared against their spend so far this month. If spend has reached the cap,
the run is **blocked**. The check is skipped entirely when no cap applies to the
user. How the block surfaces depends on what kind of run it is:

- **Chat turns** (inline and durable) fail with **HTTP 429** (a
  `QuotaExceededError`, message *"monthly budget of $X reached"*).
- **Triggered workflow fires** are silently **skipped** (logged as
  `workflow_skipped_budget`), so an autonomous schedule cannot quietly spend past
  a cap a human chat turn would be denied at.
- A multi-agent **`run_agents_script`** fan-out refuses to spawn its agents once
  the cap is reached.

!!! note "The cap is a floor check, not a reservation"
    Enforcement compares spend so far against the cap; it does not pre-reserve a
    run's projected cost. A single run can therefore push spend slightly past the
    cap, after which the next run is blocked.

## Relation to usage tracking

Budgets are enforced against the same cost data shown on the **Usage** page: a
user's "spend this month" is the sum of recorded run cost since the start of the
current calendar month (UTC). Per-run cost comes from the usage records produced on
every run path, so a cap stays in step with what usage reporting shows. The cap is a
**hard gate on new runs**, not a soft warning.
