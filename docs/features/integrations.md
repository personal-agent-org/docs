# Integrations

**Integrations** connect Personal Agent to the outside world — your email, calendars,
chat channels, project trackers, web search, weather, smart-home gear and more. You
manage your own under **Settings → Integrations** (*Integrationen*).

## Setting one up

Each integration is added through a typed **config flow** rendered right in Settings —
fill in the fields it asks for and you're done. Keys and secrets are **encrypted** and
never shown again, and you can **reconfigure** an entry in place without restarting
anything. Some integrations support **multiple instances** (e.g. two email accounts);
others are single-instance.

You'll see each one's health (connected / disconnected / unreachable), and for message
channels a per-account **Inbox triage** toggle (see [Inbox](inbox.md)).

## What integrations bring

Depending on the integration, you get any of:

- **Tools** the agent can call (search the web, create a GitHub issue, add a calendar
  event, …);
- **Entities** with live state and history, which power [dashboards](dashboards.md) and
  feed [memory](memory.md);
- **Inbound messages** that flow into your [Inbox](inbox.md);
- **Skills and specialist agents** that install and remove with the integration.

### Capability providers

Some capabilities are **generic** — the agent just calls "search the web" and the
highest-priority provider you've configured fulfils it. So whether you use Tavily, Brave
or DuckDuckGo for search, the assistant calls one stable tool; swap the provider and
nothing else changes.

## A few of the built-in integrations

| Integration | What it brings |
| --- | --- |
| **Email** | Inbox triage with draft replies you approve — the canonical message channel |
| **Signal / WhatsApp / Matrix / Zulip** | More inbox channels |
| **GitHub** | PRs/issues as searchable entities + create/review/comment tools + a webhook you can trigger workflows from |
| **Web search** | Tavily / Brave / DuckDuckGo, interchangeable |
| **Calendar / projects** | CalDAV, OpenProject, TED |
| **Sensors & home** | Phone sensors, Shelly, HTTP fetch, Met.no weather |

New integrations can be dropped in by your operator without changing the core app, so the
list on your instance may be longer.

## MCP servers & external APIs

Beyond the built-in integrations, you can plug in your own tools under
**Settings → MCP servers** (*MCP-Server & APIs*):

- **MCP servers** — register a Model Context Protocol server by URL. It can use a static
  auth header or **OAuth** (click **Connect**; tokens are stored encrypted and refreshed
  automatically). Self-registered servers are treated as **untrusted** — their output
  can't trigger high-privilege tools.
- **OpenAPI** — point at an OpenAPI spec and the API's operations become tools directly,
  no MCP server needed. You can restrict it to read-only (GET) or to specific operations.

These are selectable per chat like any other tools.

!!! info "Governance"
    Admins can enable/disable each integration platform-wide, restrict which scopes may
    configure it, and require provider **governance tags** — so, for example, an
    integration only runs on providers cleared for it. See
    [Security & privacy](security.md).
