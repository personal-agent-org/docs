# Workflows & automations

A **workflow** is a reusable plan the assistant can run by name — and, if you give it
**triggers**, it runs **automatically**. *A workflow with triggers is what other tools call
an "automation."* They live on the **Workflows** page (in the account menu); the badge
shows how many are pending your confirmation.

## The Workflows page

Each workflow shows its name, description, trigger summary and last-run time. For ones you
own you can:

- **Run now** — fire it immediately;
- **toggle** it on or off (for triggered workflows);
- **Confirm** — accept one the assistant proposed (these arrive in a *pending* state);
- **Edit**, **Delete**, or **Open chat** to where its results were posted.

A workflow can be **created by you** or **suggested by the agent** (badged accordingly), and
shared workflows show a *shared* badge. Expand one to read its "when to use" note and its
script.

## Creating a workflow

**New workflow** opens a dedicated form.

### What it does

- **Name** and an optional **Description**.
- **When to use** — a hint that helps the assistant decide when to run it on its own.
- **Script** — the workflow's logic, written as a sandboxed Python plan that orchestrates
  tools (with loops, fan-out and sub-agents). The agent can author these for you, so you
  don't have to write Python yourself. A triggered workflow runs headless with the full
  toolset and reports back by sending you a message.

### What it can touch

- **Integrations** — extra [integration](integrations.md) tools the script may use, on top
  of the web and built-in tools.
- **Devices** — connected device agents (or your phone) whose tools it may use; they must
  be online when it runs.

### Triggers — what makes it run

Add one or more **triggers** (any one fires it). Without triggers it's just a reusable
definition you (or the agent) run by name.

| Trigger | Fires… |
| --- | --- |
| **Schedule** | on a cron schedule |
| **Interval** | every *N* minutes (minimum 15) |
| **Webhook** | when a URL is called |
| **Manual** | only when you or the agent runs it |
| **Event** | on a system event — a run finished or failed, an entity created/updated/deleted, or a tool used |
| **Poll** | by polling on an interval |

For a **webhook** trigger, saving the workflow shows a one-time **token + URL** — copy it
then, as it isn't shown again. You can **rotate** it later if it leaks.

### Conditions — gating when it runs

Add optional **conditions** that must hold for the run to proceed, combined with
**All (AND)** or **Any (OR)**:

- **Entity state** / **Entity attribute** — compare an [entity](entities.md#per-entity-detail-state-history-cause-effect)
  value with an operator (equals, not equals, greater/less than, at least/at most,
  contains);
- **Time window** — between two times, on selected weekdays;
- **Trigger data** — match a value in the trigger's payload.

A workflow that runs every morning but only *if* you're home, or whenever a sensor crosses
a threshold *and* it's a weekday, is just a trigger plus a condition or two.

### Organizing

Place a workflow in a **project** folder, optionally **share** it with your group, and
choose whether it's **enabled** right away.

## Hooks

**Hooks** (a tab on the Workflows page) are small rules that fire around tool calls and chat
messages — guardrails and automations for how the agent behaves:

- **Before a tool call** — **block** a matching call (for example, protect a read-only repo
  from file writes), or run a **decision** command that allows or denies it.
- **After a tool call** — run a command on your workspace device (for example, `ruff format
  .` after every edit).
- **Before your message** — inject context (for example, `git status`) or block the message
  entirely as a guardrail.
- **After the answer** — run a fire-and-forget command on the device.

Each hook has a **tool pattern** (or message pattern) to match, a **scope** (all chats or
just the main chat), and either a **block message** or a **command** to run on the connected
(jailed) device.
