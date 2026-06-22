# Integrations

**Integrations** connect Personal Agent to the outside world — your email, calendars, chat
channels, project trackers, web search, weather, smart-home gear and more. You manage your
own under **Settings → Integrations**.

## Setting one up

Each integration is added through a typed **config flow** rendered right in Settings — fill
in the fields it asks for (with the right pickers for entities, dates, colors and so on) and
you're done. Keys and secrets are **encrypted** and never shown again, and you can
**reconfigure** an entry in place without restarting anything. Some integrations support
**multiple instances** (for example, two email accounts); others are single-instance.

You'll see each one's health (connected / disconnected / unreachable) at a glance, and for
message channels a per-account **Inbox triage** toggle (see [Inbox](inbox.md)).

## What integrations bring

Depending on the integration, you get any of:

- **Tools** the agent can call — search the web, create a GitHub issue, add a calendar
  event, fetch a page.
- **Entities** with live state and history, which become part of [memory](memory.md) and
  power [dashboards](dashboards.md).
- **Inbound messages** that flow into your [Inbox](inbox.md).
- **Skills and specialist agents** that install and remove together with the integration.

### Capability providers

Some capabilities are **generic** — the agent just asks to "search the web" and the
highest-priority provider you've configured fulfils it. So whether you use Tavily, Brave or
DuckDuckGo for search, the assistant calls one stable tool; swap the provider and nothing
else changes.

## A few of the built-in integrations

| Integration | What it brings |
| --- | --- |
| **Email** | Inbox triage with draft replies you approve — the canonical message channel |
| **Signal / WhatsApp / Matrix / Zulip** | More inbox channels |
| **GitHub** | Pull requests and issues as searchable entities, plus create/review/comment tools and a webhook you can trigger workflows from |
| **Web search** | Tavily / Brave / DuckDuckGo, interchangeable |
| **Calendar / projects** | CalDAV, OpenProject, TED |
| **Sensors & home** | Phone sensors, Shelly, HTTP fetch, Met.no weather |

New integrations can be dropped in by your operator without changing the core app, so the
list on your instance may be longer than this.

## MCP servers & external APIs

Beyond the built-in integrations, you can plug in your own tools under **Settings → MCP
servers**:

- **MCP servers** — register a Model Context Protocol server by URL. It can use a static
  auth header or **OAuth** (click **Connect**; tokens are stored encrypted and refreshed
  automatically). Self-registered servers are treated as **untrusted** — their output can't
  trigger high-privilege tools, so a rogue server can't escalate.
- **OpenAPI** — point at an OpenAPI spec and the API's operations become tools directly, no
  MCP server needed. You can restrict it to read-only (GET) or to specific operations.

Both are selectable per chat like any other tools.

!!! note "Lots of tools? They're discovered on demand"
    When a chat carries many integration and MCP tools, the agent doesn't load every tool
    description up front. Past a threshold it switches to **progressive disclosure**: it gets
    a search tool and pulls in the full definitions of the specific tools it needs for the
    task. This keeps the prompt lean (and cheaper) without hiding any capability — connect as
    many integrations as you like.

!!! info "Governance"
    Admins can enable or disable each integration platform-wide, restrict which scopes may
    configure it, and require provider **governance tags** — so, for example, an
    integration only runs on providers cleared for it. See
    [Security & privacy](security.md) and the [Admin console](../administration/integrations.md).
