# Settings & personalization

Everything about how the assistant looks, behaves and works for you lives under
**Settings** (*Einstellungen*, in the account menu). Tabs are grouped into **Personal**,
**Capabilities** and **System**, and there's a search box across all of them.

## Personal

### Profile

Who you are, so answers fit your time, place and priorities:

- **Name**, **Timezone**, **Home address**.
- **Priorities** (*Prioritäten*) — what matters to you, used to judge what's important in
  your [Inbox](inbox.md).
- **Inbox rules** and exact **drop patterns** — what should never reach your inbox.
- Your **default security mode** and **default memory access** for new chats.

### Agent

Make the assistant *yours*:

- **Name**, **Soul** (a Markdown description of its personality — "friendly, concise, dry
  humor"), and an **avatar** emoji. This replaces the default persona.
- **Custom agents** (*Eigene Agenten*) — your specialist [sub-agents](agents.md).

### Appearance

How the UI looks **on this device** (synced to your account):

- **Theme** (System / Dark / Dim / Light), **accent color**, **reading font**
  (serif/sans), **font scale** and **density**.
- **Language** (System / Deutsch / English).
- **Message details** — show/hide timestamp, model name and cost under each answer.
- **Input** — Enter sends, or Enter = newline and Cmd/Ctrl+Enter sends.
- **Accessibility** — reduce motion, high contrast.
- **Navigation** — which entries appear in the sidebar, and your **start page** after
  sign-in.

### Behavior

How the assistant works for you:

- **Chat defaults** — the model, reasoning effort, mode and data classification new chats
  start with.
- **Response style** — length (concise / balanced / detailed) and reply language.
- **Proactive** — how often it reaches out on its own (Off / Daily / Every 6 h /
  Hourly).
- **Notifications** — the push master switch, which events notify you (nudges, tool
  approvals, agent questions), and **quiet hours**. In-app cards always appear; push goes
  to your phone.

## Capabilities

- **API keys (BYOK)** — bring your own provider keys; stored encrypted and only ever
  decrypted in-process for your runs.
- **MCP servers** — your own tool servers and OpenAPI APIs (see
  [Integrations](integrations.md#mcp-servers-external-apis)).
- **Devices** — connect a computer, browser or phone (see [Devices & apps](devices.md)).
- **Commands** — your own [slash commands](chat-controls.md#your-own-commands).
- **Integrations** — connect external services (see [Integrations](integrations.md)).
- **Memory** — the flat list of [remembered facts](memory.md#the-simple-remembered-facts-list).

## System

- **App** — download the [native apps](devices.md#native-apps) and set up
  [MCP access](devices.md#use-this-assistant-from-other-tools-mcp).
- **Companion** — the native app's own settings (push, location, sensors, health) — see
  [Devices](devices.md#connect-your-phone).

### Usage & budget

The **Usage** tab (*Nutzung*) shows your **token use and cost** over a chosen range (7 /
30 / 90 / 365 days): totals for tokens, cost, runs, cache hits and tool calls, charts
over time, and a per-day breakdown.

If a **monthly budget** applies to you, a bar shows how much of it you've spent. Budgets
cascade **user → org → global**; when you hit the cap, new runs are declined until next
month — and the cap also stops sub-agents from spawning mid-task. Admins set budgets
under **Admin → Budgets**.
