# Workflows & automations

A **workflow** is a reusable plan the assistant can run by name - and, if you give it
**triggers**, it runs **automatically**. *A workflow with triggers is what other tools call
an "automation."* They live on the **Workflows** page (in the account menu); the badge there
shows how many are pending your confirmation.

## The Workflows page

The page has two tabs: **Workflows** and **Hooks**. Each workflow shows its name,
description, and - for triggered ones - a trigger/condition summary and last-run time. For
ones you own you can:

- **Run now** - fire it immediately;
- **Resume last run** - continue the previous run, reusing its completed sub-agents so an
  expensive fan-out isn't paid twice;
- **toggle** it on or off (for triggered workflows);
- **Confirm** - accept one the assistant proposed (these arrive in a *pending* state);
- **Publish** it to the marketplace (or unpublish) so others on your instance can adopt it;
- **Edit**, **Delete**, or **Open chat** to where its results were posted.

A triggered workflow carries a **state** badge: *active*, *pending* (awaiting your confirm),
*disabled*, or *error* (it turns red after several consecutive failed runs; a successful run
clears it). A workflow can be **created by you** or **suggested by the agent** (badged
accordingly), and folder-shared ones show a *shared* badge. Expand one to read its "when to
use" note, its script, and (for triggered ones) its recent runs.

Workflows you've **adopted** from the marketplace appear here too, read-only with a *from
marketplace* badge: you can only run them (in your own context) or remove the reference, and
you can give them your own schedule, independent of the author's.

## Creating a workflow

**New workflow** opens a dedicated form.

### What it does

- **Name** and an optional **Description**.
- **When to use** - a hint that helps the assistant decide when to run it on its own.
- **Script** - the workflow's logic, written as a sandboxed Python plan that orchestrates
  tools (with loops, fan-out and sub-agents via `delegate`). The agent can author these for
  you, so you don't have to write Python yourself. A triggered workflow runs headless with
  the full toolset and reports back with `send_message_to_user(...)`.
- **Max run time** (optional) - a per-workflow time budget in minutes for a triggered or
  durable run; left blank it uses the default.

### What it can touch

- **Integrations** - extra [integration](integrations.md) tools the script may use, on top
  of the ambient web and built-in tools. Leave it empty for ambient tools only.
- **Devices** - connected device agents (or your phone) whose tools it may use; they must
  be online when it runs.

### Triggers - what makes it run

Add one or more **triggers** (any one fires it). Without triggers it's just a reusable
definition you (or the agent) run by name.

| Trigger | Fires… |
| --- | --- |
| **Schedule** | on a 5-field cron expression (e.g. `0 9 * * 1-5`) |
| **Interval** | every *N* minutes (minimum 15) |
| **Webhook** | when its URL is called (POST) |
| **Manual** | only when you or the agent runs it |
| **Event** | on a system event - a run finished or failed, an entity created/updated/deleted, or a tool used. Entity events can be filtered by domain, entity type, and (for inbound messages) a sender glob; `agent.tool_used` takes a tool-name glob |
| **Poll** | every *N* minutes (minimum 15), but only fires when the result of its condition has *changed* since the last check. A poll with no condition fires every tick |

For a **webhook** trigger, saving the workflow shows a one-time **token + URL** - copy it
then, as it isn't shown again. The URL is `…/webhooks/workflows/{id}`, called with the token
as a `Bearer` header or `?token=`. You can **rotate** it later if it leaks.

### Conditions - gating when it runs

Add optional **conditions** that must hold for the run to proceed, combined with
**All (AND)** or **Any (OR)**:

- **Entity state** / **Entity attribute** - compare an [entity](entities.md#per-entity-detail-state-history-cause-effect)
  value with an operator (equals, not equals, greater/less than, at least/at most,
  contains);
- **Time window** - between two times, on selected weekdays (evaluated in your timezone);
- **Trigger data** - match a value at a path in the trigger's payload.

A workflow that runs every morning but only *if* you're home, or whenever a sensor crosses
a threshold *and* it's a weekday, is just a trigger plus a condition or two.

### Organizing

Place a workflow in a **folder**, optionally **share** it with your group (read-only;
execution stays owner-only), and choose whether it's **enabled** right away.

## Hooks

**Hooks** (a tab on the Workflows page) are small rules that fire around tool calls and chat
messages - guardrails and automations for how the agent behaves. Tool hooks are enforced
regardless of the chat's security mode:

- **Before a tool call** - **block** a matching call (for example, protect a read-only repo
  from file writes), or run a **decision** command that allows or denies it (exit 0 allows,
  non-zero denies with the command's output as the reason).
- **After a tool call** - run a command on your workspace device (for example, `ruff format
  .` after every edit); its output is appended to the tool result.
- **Before your message** - inject context (for example, `git status`) or block the message
  entirely as a guardrail (no model call).
- **After the answer** - run a fire-and-forget command on the device.

Each hook has a **tool pattern** (a glob over the tool name) or, for message hooks, a
**message pattern** (a glob over your message text), an **event**, a **scope** (any chat or
just the main chat, for message hooks), and either a **block message** or a **command** to
run on the connected (jailed) workspace device. In a decision or post-tool command,
`{tool}` and `{args}` are substituted. Block hooks must use a *before* (pre) event, and a
command hook needs a command.
