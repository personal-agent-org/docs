# Command policy

The **Command policy** page (admin console) lets you define a global list of rules
that govern how the agent's shell/command-execution tools are handled — each command
can be allowed, denied, or held for human approval.

Your rules are **layered in front of** the built-in catalog of catastrophic and
known-dangerous commands. The catalog already hard-denies things like fork bombs,
`rm -rf /`, `mkfs`, and `curl | sh` in every security mode; your rules let you tighten
(or, deliberately, fast-track) that for your own environment.

## What a rule does

A rule inspects an execution tool call and returns one verdict:

| Decision | Meaning |
| --- | --- |
| `allow` | Auto-allow the command (skips the model judge in `judge` mode). |
| `require_approval` | Always pause for explicit human approval before running. |
| `deny` | Refuse the command outright. |

!!! note "The engine only tightens — it never loosens"
    An `allow` rule does **not** weaken `approve_each` mode (which still asks for
    everything), and it cannot override a built-in hard `deny`. Command policy is
    defense-in-depth, not a way to disarm the guard.

## Rule fields

Each rule matches by **program** (a program name plus optional argument constraints)
**or** by **pattern** (a regex over the whole command). A rule must set at least one
of `program` or `pattern`.

| Field | Purpose |
| --- | --- |
| `ID` | A short identifier for the rule, shown in logs. Defaults to `custom`. |
| `Decision` | One of `allow` / `require_approval` / `deny` (see above). |
| `Reason` | Free-text explanation surfaced when the rule fires. |
| `Program` | Exact program name to match, e.g. `terraform`. Matched on the command's base name (so `sudo terraform` and `/usr/bin/terraform` still match). |
| `Pattern (regex)` | A case-insensitive regex matched against the full command line. Use this instead of `Program` for composition-level matches. |
| `Args prefix` | Comma-separated tokens that must appear, in order, as the first arguments (only with `Program`). |
| `Contains args` | Comma-separated tokens that must all be present anywhere in the arguments (only with `Program`). |
| `Tools` | Comma-separated execution tool names this rule is restricted to. Empty = all exec tools (`run_command`, `shell`, `exec`, `bash`, `sh`). |

!!! warning "Invalid rules are silently ignored"
    A rule with neither `Program` nor `Pattern`, or with a decision that isn't one of
    the three valid values, or with an un-compilable regex, is dropped at run time —
    it never widens or breaks the engine. The page persists exactly what you enter, so
    double-check a rule that doesn't seem to take effect.

## How rules are evaluated

1. **Your rules run first, in list order — first match wins.** This is why a rule can
   override a built-in: place a more specific or stricter rule above the catalog by
   adding it to the list.
2. If no admin rule matches, the **built-in catalog** is consulted (composition-level
   catastrophes first, then a per-segment classification where the worst verdict across
   `;`/`&&`/`||`/`|` segments wins).
3. If nothing matches at all, command policy has **no opinion** and the normal flow
   (the model judge or the configured approval mode) takes over.

Because order matters, rules are evaluated top-to-bottom in list order — add your
most specific, higher-priority rules first.

## Enforced on both run paths

The same rule list is applied to **inline** runs (assembled from the database at run
start) and to **durable** Temporal runs (snapshotted into the run spec and re-applied
per request by the worker's guard). A command denied by an admin rule is denied
identically on either path, including in `autonomous` and sub-agent runs where no human
is watching.

## Managing rules

- **Add rule** — appends a new row (defaults to `deny`); fill in its fields.
- **Edit** — change any field inline; list-valued fields are entered as
  comma-separated text.
- **Reorder** — adjust position to control first-match precedence.
- **Delete** — remove a rule with the trash icon.
- **Save rules** — persist the full list. **Discard changes** reloads the saved list.

Changes take effect on the next run after saving.
