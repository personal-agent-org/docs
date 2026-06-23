# Command policy

The **Command policy** page (admin console) lets you define a global list of rules
that govern how the agent's shell/command-execution tools are handled: each command
can be allowed, denied, or held for human approval.

Your rules are **layered in front of** the built-in catalog of catastrophic and
known-dangerous commands. The catalog already denies things like fork bombs,
`rm -rf /`, `mkfs`/`wipefs`, `dd of=/dev/…`, and `curl | sh`, and asks for approval on
`git push --force`, `sudo`, `terraform apply`/`destroy`, `kubectl delete`, and the like.
Your rules let you tighten (or, deliberately, fast-track) that for your own environment.

## What a rule does

A rule inspects an execution tool call and returns one verdict:

| Decision | Meaning |
| --- | --- |
| `allow` | Auto-allow the command, skipping the model judge in `judge` mode. (In `approve_each` mode the call is still queued for approval; in `autonomous` mode an `allow` is a no-op.) |
| `require_approval` | Pause for explicit human approval before running, in `judge` and `approve_each` modes. (In `autonomous` mode there is no approval UI, so this passes through; only `deny` is enforced.) |
| `deny` | Refuse the command outright, in every security mode. |

!!! warning "Your rules win first - they can loosen, too"
    Because your rules are evaluated **before** the built-in catalog (first match wins),
    a rule can override a built-in default in either direction. An `allow` rule placed
    over a command the catalog would have denied **does** disarm that built-in for the
    matching command, so author `allow` rules narrowly. The one thing your rules cannot
    do is weaken `approve_each` mode: there every exec call is queued for approval
    regardless of an `allow` rule.

## Rule fields

Each rule matches by **program** (a program name plus optional argument constraints)
**or** by **pattern** (a regex over the whole command). A rule must set at least one
of `program` or `pattern`; if both are filled, the pattern is used and the program
fields are ignored. The `reason` is surfaced in the block message (`[blocked by command
policy] <reason>`) and in logs.

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
    the three valid values, or with an un-compilable regex, is dropped at run time;
    it never widens or breaks the engine. The page persists exactly what you enter, so
    double-check a rule that doesn't seem to take effect.

## How rules are evaluated

1. **Your rules run first, in list order: first match wins.** This is why a rule can
   override a built-in (in either direction): the engine consults your list before the
   catalog. Wrapper programs (`sudo`, `doas`, `env`, `nice`, `time`, `nohup`, `xargs`,
   `timeout`, …) are peeled before matching, so a `Program` rule for `terraform` still
   matches `sudo terraform`.
2. If no admin rule matches, the **built-in catalog** is consulted: composition-level
   catastrophes first (fork bomb, `curl | sh`, a recursive `rm` targeting `/`), then a
   per-segment classification where the **worst** verdict across `;`/`&&`/`||`/`|`/`&`
   segments wins (so `ls && rm -rf /` is denied on the `rm` segment).
3. If nothing matches at all, command policy has **no opinion** and the normal flow
   takes over: the model judge in `judge` mode, the standing approval prompt in
   `approve_each`, or nothing in `autonomous` (where only a `deny` verdict is enforced).

Because order matters, rules are evaluated top-to-bottom in list order: add your
most specific, higher-priority rules first.

## Enforced on both run paths

The same rule list is read from the database at run start and applied to **inline** runs
and to **durable** Temporal runs (which run through the same toolset assembler and guard).
A command with a `deny` verdict is blocked identically on either path, including in
`autonomous` and sub-agent runs where no human is watching: in those runs there is no
approval UI, so a `require_approval` rule cannot pause and only `deny` is enforced.

## Managing rules

- **Add rule** - appends a new row at the bottom (defaults to `deny`, `ID` `custom`);
  fill in its fields. Since the list is evaluated top-to-bottom, row position is its
  precedence; a newly added rule has the lowest priority.
- **Edit** - change any field inline; list-valued fields (`Args prefix`,
  `Contains args`, `Tools`) are entered as comma-separated text.
- **Delete** - remove a rule with the trash icon.
- **Save rules** - persist the full list verbatim. **Discard changes** reloads the
  saved list and drops your unsaved edits.

Changes take effect on the next run after saving.
