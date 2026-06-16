# Workflows & automations

A **workflow** is a reusable plan the assistant can run by name — and, if you give it
**triggers**, it runs **automatically**. *A workflow with triggers is what other tools
call an "automation."* They live on the **Workflows** page (*Workflows*, in the account
menu); the badge shows how many are pending your confirmation.

## The Workflows page

Each workflow shows its name, description, trigger summary and last-run time. For ones
you own you can:

- **Run now** (*Jetzt ausführen*) — fire it immediately;
- **toggle** it on/off (for triggered workflows);
- **Confirm** (*Bestätigen*) — accept one the assistant proposed (these arrive in a
  *pending* state);
- **Edit**, **Delete**, or **Open chat** to where its results were posted.

A workflow can be **created by you** or **suggested by the agent** (badged *from agent*),
and shared workflows show a *shared* badge.

## Creating a workflow

**New workflow** (*Neuer Workflow*) opens a dedicated form:

### What it does

- **Name** and an optional **Description**.
- **When to use** (*Wann zu nutzen*) — a hint that helps the assistant decide when to run
  it on its own.
- **Script** (*Skript*) — the workflow's logic, written as a sandboxed Python plan that
  orchestrates tools (with loops, fan-out and sub-agents). The agent can author these for
  you; you don't have to write Python. A triggered workflow runs headless with the full
  toolset and reports back with `send_message_to_user(...)`.

### What it can touch

- **Integrations** (*Integrationen*) — extra [integration](integrations.md) tools the
  script may use, on top of web and built-in tools.
- **Devices** (*Geräte*) — connected device agents (or your phone) whose tools it may
  use; they must be online when it runs.

### Triggers — what makes it run

Add one or more **triggers** (any one fires it). Without triggers it's just a reusable
definition you (or the agent) run by name.

| Trigger | German | Fires… |
| --- | --- | --- |
| **Schedule** | *Zeitplan (Cron)* | on a cron schedule |
| **Interval** | *Intervall* | every *N* minutes (min. 15) |
| **Webhook** | *Webhook* | when a URL is called |
| **Manual** | *Manuell* | only when you or the agent runs it |
| **Event** | *Ereignis* | on a system event (run finished/failed, an entity created/updated/deleted, a tool used) |
| **Poll** | *Abfrage* | by polling on an interval |

For a **webhook** trigger, saving the workflow shows a one-time **token + URL**
(*Webhook-Token*) — copy it then, as it isn't shown again. You can **rotate** it later.

### Conditions — gating when it runs

Add optional **conditions** that must hold for the run to proceed, combined with
**All (AND)** or **Any (OR)**:

- **Entity state** / **Entity attribute** — compare an [entity](dashboards.md#entities)
  value with an operator (equals, not equals, greater/less than, at least/at most,
  contains);
- **Time window** — between two times, on selected weekdays;
- **Trigger data** — match a value in the trigger's payload.

### Organizing

Place a workflow in a **project** folder, optionally **share** it with your group, and
choose whether it's **enabled** right away.

## Hooks

**Hooks** (*Hooks*, a tab on the Workflows page) are small rules that fire around tool
calls and chat messages — guardrails and automations for how the agent behaves:

- **Before a tool call** (`pre_tool_use`) — **block** a matching call (e.g. protect a
  read-only repo from `write_file`), or run a **decision** command that allows or denies
  it.
- **After a tool call** (`post_tool_use`) — run a command on your workspace device (e.g.
  `ruff format .` after every edit).
- **Before your message** (`pre_message`) — inject context (e.g. `git status`) or block
  the message entirely as a guardrail.
- **After the answer** (`post_message`) — run a fire-and-forget command on the device.

Each hook has a **tool pattern** (or message pattern) to match, a **scope** (all chats or
just the main chat), and either a **block message** or a **command** to run on the
connected (jailed) device.
