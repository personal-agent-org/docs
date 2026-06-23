---
title: User guide
---

# Using Personal Agent

This is the **user guide** — a tour of the app the way you actually use it, screen by
screen. Every section maps to something you can see and click in the web UI (and the
Android, desktop and browser-extension shells that wrap it).

## First login: the setup wizard

The very first time you sign in, a full-screen **setup wizard** walks you through the
basics. None of it is mandatory — you can change everything later under **Settings** — and
it takes under a minute:

1. **Welcome** — a one-screen hello.
2. **What you can do** — a short tour of chat, coding, the inbox, integrations, workflows
   and the "power" features (skills, memory, voice).
3. **Your profile** — your name, timezone and (optional) address, so answers are time- and
   location-aware.
4. **Your agent** - give the assistant a **name** and a **personality** ("soul"). Leave
   both blank for the default "Personal Agent" persona. (The agent avatar is set later
   under **Settings**.)
5. **Inbox** — optionally connect a message channel (email, Signal, WhatsApp, Matrix,
   Zulip). You can skip and add channels anytime later.
6. **Done** — you land in your main chat, ready to go.

## How the app is laid out

Once you're in, the screen has three parts: a **left sidebar** (navigation), the **main
area** (whatever page you're on — usually a chat), and, in some chats, a **right panel**
(the coding workspace, dashboard cards, or the agents drawer).

### The sidebar (navigation drawer)

The sidebar is your home base. From the top:

| Item | What it is |
| --- | --- |
| **New session** | Start a fresh chat |
| **Main chat** | Your pinned, never-deleted home chat (proactive briefings land here) |
| **Inbox** | Triaged messages from your channels — badge shows the open count |
| **Agenda** | Commitments and things to be reminded about — badge shows the open count |
| **Notes** | Your free-form notes |
| **Files** | Uploaded documents plus device file search |
| **Calendar** | All connected calendars in one view |
| **Contacts** | People, across every channel |
| **Dashboards** | Each dashboard appears as its own entry |
| **Sessions** | The full list of chats (the sidebar only shows recents) |
| **Folders** | Grouped chats with shared instructions |

Below that: **Recent activity** — your most recent chats.

!!! tip "Hide what you don't use"
    Under **Settings → Appearance → Navigation** you can choose exactly which entries
    appear in the sidebar and which page you land on after sign-in.

### The account menu

Click your avatar at the bottom of the sidebar for everything else:

- **Manage dashboards** — create, rename and delete dashboards
- **Manage surfaces** - the layouts (chat / editor / terminal / card regions) a chat can use
- **Skills** — reusable agent capabilities
- **Marketplace** - publish and adopt agents, skills and workflows shared by other users
- **Workflows** — reusable plans and automations (badge shows the pending count)
- **Cloud tasks** - autonomous coding tasks
- **Memory** - everything the assistant knows: remembered facts and live entities, in one place
- **Logbook** — recent entity state changes
- **Scenes** — saved entity-state snapshots
- **Settings**
- **Admin** — only if you have the admin role
- **Sign out**

### On a phone

On small screens the chat collapses to a single column with a **bottom navigation bar**.
A standard chat just has **Chat / Agents**. Any chat with a non-standard surface (coding,
cards, a custom layout) gets one extra **panel** tab between them, labelled after its first
region (e.g. the workspace icon for coding, "Cards" for a card layout); inside that panel,
a layout with more than one region switches between its regions with its own tabs. The tabs
carry live badges - unread answers, uncommitted changes, finished commands, running
sub-agents - and pulse while the agent or a command is running.

## Where to go next

<div class="grid cards" markdown>

-   :material-chat-processing:{ .lg .middle } __[Chatting](chat.md)__

    ---

    The reading pane, the composer, message actions, sharing and voice — everything you do
    in a conversation.

-   :material-tune:{ .lg .middle } __[Chat controls & modes](chat-controls.md)__

    ---

    The per-chat pickers (model, reasoning, mode, security, memory, classification), chat
    modes and slash commands.

-   :material-account-supervisor:{ .lg .middle } __[Agents & autonomy](agents.md)__

    ---

    Sub-agents, the agents drawer, the `/goal` loop and background tasks.

-   :material-code-braces:{ .lg .middle } __[Coding & Cloud Tasks](coding.md)__

    ---

    Coding mode, the editor + terminal workspace, the cloud sandbox and autonomous PRs.

-   :material-graph:{ .lg .middle } __[Memory & entities](memory.md)__

    ---

    The Memory page: remembered facts and live entities are one graph - browse, inspect
    and correct what the assistant knows.

-   :material-note-text:{ .lg .middle } __[Notes & Files](notes-files.md)__

    ---

    Free-form notes and your document library.

-   :material-inbox:{ .lg .middle } __[Inbox & contacts](inbox.md)__

    ---

    Message triage, draft replies you approve, and the people behind them.

-   :material-calendar:{ .lg .middle } __[Calendar & agenda](calendar.md)__

    ---

    Your merged calendar and the commitments the assistant reminds you about.

-   :material-robot-industrial:{ .lg .middle } __[Workflows & automations](workflows.md)__

    ---

    Reusable plans, triggers, conditions and hooks.

-   :material-view-dashboard:{ .lg .middle } __[Dashboards & scenes](dashboards.md)__

    ---

    Lovelace-style dashboards over your entities, scenes and the logbook.

-   :material-school:{ .lg .middle } __[Skills](skills.md)__

    ---

    Reusable capability packages and the skills marketplace.

-   :material-store:{ .lg .middle } __[Marketplace](marketplace.md)__

    ---

    Publish and adopt agents, skills and workflows shared by other users.

-   :material-puzzle:{ .lg .middle } __[Integrations](integrations.md)__

    ---

    Connect email, calendars, web search, GitHub, MCP servers and more.

-   :material-devices:{ .lg .middle } __[Devices & apps](devices.md)__

    ---

    Connect a computer, browser or phone, and get the native apps.

-   :material-cog:{ .lg .middle } __[Settings & personalization](settings.md)__

    ---

    Profile, agent persona, appearance, behavior, notifications and budgets.

-   :material-shield-lock:{ .lg .middle } __[Security & privacy](security.md)__

    ---

    Security modes, memory access, confidential chats and what stays private.

-   :material-shield-account:{ .lg .middle } __[Admin console](../administration/index.md)__

    ---

    For administrators: providers, users, governance, budgets and usage.

</div>
