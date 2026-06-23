# Integrations

**Integrations** connect Personal Agent to the outside world: your email, calendars, chat
channels, project trackers, web search, weather, smart-home gear and more. You manage your
own under **Settings → Integrations**.

## Setting one up

Each integration is added through a typed **config flow** rendered right in Settings - fill
in the fields it asks for (with the right pickers for entities, dates, colors and so on) and
you're done. Keys and secrets are **envelope-encrypted at rest** and never returned, and you
can **reconfigure** an entry in place without restarting anything. Some integrations need a
provider login instead of a pasted key: those show a **Connect** button that opens the
provider's sign-in, after which tokens are stored encrypted and refreshed automatically. Some
integrations support **multiple instances** (for example, two email accounts); others are
single-instance.

You can also **reload** an entry (clear its error state and re-sync) after an upstream blip,
enable or disable an instance, and remove it. You'll see each one's health at a glance -
healthy shows nothing, otherwise a warning (**Connection lost**) or an error (**Not
reachable**) with a tooltip. For message channels there's a per-account **Inbox triage**
toggle (see [Inbox](inbox.md)); turning it off still syncs the messages, it just skips
triage.

## What integrations bring

Depending on the integration, you get any of:

- **Tools** the agent can call - search the web, create a GitHub issue, add a calendar
  event, fetch a page.
- **Entities** with live state and history, which become part of [memory](memory.md) and
  power [dashboards](dashboards.md).
- **Inbound messages** that flow into your [Inbox](inbox.md).
- **Skills and specialist agents** that install and remove together with the integration.
- **Cards and surfaces** an integration contributes (for example, the weather card or the
  TradingView chart).

### Capability providers

Some capabilities are **generic** - the agent just asks to "search the web" and the
highest-priority provider you've configured fulfils it. So whether you use Tavily, Brave or
DuckDuckGo for web search (or Met.no for weather), the assistant calls one stable tool; swap
the provider and nothing else changes. These ambient providers are drawn from all your
enabled integrations, independent of which integration toolsets a given chat has selected.

## A few of the built-in integrations

| Integration | What it brings |
| --- | --- |
| **Email** | Inbox triage with draft replies you approve - the canonical message channel |
| **Signal / WhatsApp / Matrix / Zulip** | More inbox channels |
| **GitHub / GitLab** | Pull/merge requests and issues, plus create/review/comment tools; GitHub also syncs PRs and issues for chosen repos as searchable entities via a webhook you can trigger workflows from |
| **Web search** | Tavily / Brave / DuckDuckGo, interchangeable |
| **Calendar / projects** | CalDAV, OpenProject, TED (EU tenders) |
| **Sensors & home** | Phone sensors, Shelly, HTTP fetch, Met.no weather |
| **Other** | TradingView charts, text tools |

New integrations can be dropped in by your operator without changing the core app, so the
list on your instance may be longer than this.

## MCP servers & external APIs

Beyond the bundled integrations, you can plug in your own tools. Both are added the same way
as any integration, under **Settings → Integrations**:

- **MCP server** - register a Model Context Protocol server by URL, with an optional static
  auth header (sent as `Authorization`). Supports multiple instances.
- **OpenAPI API** - point at an OpenAPI spec URL and the API's operations become tools
  directly, no MCP server needed. Options: a tool-name **prefix**, **read-only (GET)**,
  an **operation allowlist** (specific `operationId`s), a **base-URL override**, and an
  optional auth header.

Self-registered MCP servers and OpenAPI APIs are treated as **untrusted**: their tool output
can't drive high-privilege first-party or device tools in the same run, so a rogue server
can't escalate. Both are selectable per chat like any other tools.

!!! note "Lots of tools? They're discovered on demand"
    When a chat carries enough integration and MCP toolsets, the agent doesn't load every
    tool description up front. Past a threshold it switches to **progressive disclosure**: it
    gets a `search_tools` capability (the provider's native tool search where available) and
    pulls in the full definitions of the specific tools it needs for the task. This keeps the
    prompt lean (and cheaper) without hiding any capability, so you can connect as many
    integrations as you like.

!!! info "Governance"
    You can set an integration up just for yourself or **share it with a group** you're an
    editor or owner of. Admins can additionally enable or disable each integration
    platform-wide, restrict which scopes (user / group / org / global) may configure it, and
    set up integrations at org or global scope. Each integration also declares a **required
    model trust tier**, so it only runs on providers cleared for its data. See
    [Security & privacy](security.md) and the [Admin console](../administration/integrations.md).
