# Settings & personalization

Everything about how the assistant looks, behaves and works for you lives under
**Settings** (in the account menu). Tabs are grouped into **Personal**, **Capabilities** and
**System**, and there's a search box across all of them so you can jump straight to an
option.

## Personal

### Profile

Who you are, so answers fit your time, place and priorities:

- **Your name**, **Timezone** and **Home address**.
- **Priorities** - what matters to you, used to judge what's important in your
  [Inbox](inbox.md).
- **Inbox rules** and exact **drop patterns** - what should never reach your inbox.
- Your **default security mode** and **default memory access** for new chats.

### Agent

Make the assistant *yours*:

- **Name** and **Soul** (a Markdown description of its personality - "friendly, concise, dry
  humor"). This replaces the default persona everywhere.
- **Your agents** - your specialist [sub-agents](agents.md), each with a persona, a "when to
  use" hint, required capabilities (Web / Devices / Documents / Memory / Coding / Workspace),
  an optional surface binding and an optional default model. You can publish one to the
  marketplace or adopt published ones.

### Appearance

Applies instantly on this device and is also saved to your account:

- **Theme** (System / Dark / Dim / Light), **accent color** (presets or a custom picker),
  **reading font** (serif or sans), **font scale** (S / M / L) and **density** (comfortable /
  compact).
- **Language** (System / Deutsch / English).
- **Message details** - show or hide the timestamp, model name and cost under each answer.
- **Input** - Enter sends, or Enter inserts a newline and Cmd/Ctrl+Enter sends.
- **Accessibility** - reduce motion, high contrast.
- **Navigation** - which entries appear in the sidebar, and your **start page** after
  sign-in (the main chat or any visible entry).

### Behavior

How the assistant works for you:

- **New-chat defaults** - the model, reasoning effort, mode (standard / coding) and data
  classification (standard / internal) that new chats start with.
- **Response style** - answer length (concise / balanced / detailed) and answer language
  (match the message, or a fixed language).
- **Proactive assistant** - how often it reaches out on its own (Off / Once a day / Every 6
  hours / Hourly) plus its own **quiet hours**.
- **Notifications** - the push master switch, which events notify you (proactive nudges, tool
  approval requests, questions from the assistant), and **quiet hours**. In-app cards always
  appear; push goes to your phone.

## Capabilities

- **Integrations** - connect external services, plus your own MCP tool servers and OpenAPI
  APIs (see [Integrations](integrations.md) and
  [MCP servers & external APIs](integrations.md#mcp-servers-external-apis)).
- **Devices** - connect a computer, browser or phone (see [Devices & apps](devices.md)).
- **Commands** - your own [slash commands](chat-controls.md#your-own-commands).

## System

- **App** - download the [native apps](devices.md#native-apps) (Linux desktop, Android,
  browser extension, terminal UI) and set up
  [MCP access](devices.md#use-this-assistant-from-other-tools-mcp) for other tools: the MCP
  server URL (OAuth) plus personal access tokens for headless clients.
- **Companion** - the native app's own settings, shown only inside the app: connection
  (background WebSocket) mode, location sharing, Health Connect metrics, location zones, and
  per-device sensors - see [Devices](devices.md#connect-your-phone).

### Usage & budget

The **Usage** tab shows your **token use and cost** over a chosen range (7 / 30 / 90 / 365
days): totals for tokens, cost, runs, cache hits and tool calls, charts over time, and a
per-day breakdown by model.

If a **monthly budget** applies to you, a bar shows how much of it you've spent. Budgets
cascade **user > org > global** (the most specific limit wins); when you hit the cap, new
runs are declined until next month, and the cap also stops sub-agents from spawning mid-task.
Admins set budgets under **Admin > Budgets** (see [Admin console](../administration/budgets.md)).
