---
title: User guide
---

# Using Personal Agent

This is the **user guide** — a tour of the app the way you actually use it, screen
by screen. Every section maps to something you can see and click in the web UI (and
the Android, desktop and browser-extension shells that wrap it).

!!! note "The UI is German-first"
    Personal Agent ships **German-first** with full English i18n. This guide is in
    English and shows the German label in parentheses on first mention — e.g. the
    **Inbox** (*Posteingang*) — so you can find it whichever language you run.

## First login: the setup wizard

The very first time you sign in, a full-screen **setup wizard** (*Einrichtung*)
walks you through the basics. None of it is mandatory — you can change everything
later under **Settings** — and it takes under a minute:

1. **Welcome** — a one-screen hello.
2. **What you can do** — a short tour of chat, coding, the inbox, integrations,
   workflows and the "power" features (skills, memory, voice).
3. **Your profile** — your name, timezone and (optional) address, so answers are
   time- and location-aware.
4. **Your agent** — give the assistant a **name**, a **personality** ("soul") and an
   avatar. Leave it blank for the default "Personal Agent" persona.
5. **Inbox** — optionally connect a message channel (email, Signal, WhatsApp, Matrix,
   Zulip). You can skip and add channels anytime later.
6. **Done** — you land in your main chat, ready to go.

## How the app is laid out

Once you're in, the screen has three parts: a **left sidebar** (navigation), the
**main area** (whatever page you're on — usually a chat), and, in some chats, a
**right panel** (the coding workspace, dashboard cards, or the agents drawer).

### The sidebar (navigation drawer)

The sidebar is your home base. From the top:

| Item | German | What it is |
| --- | --- | --- |
| **New session** | *Neue Sitzung* | Start a fresh chat |
| **Main chat** | *Haupt-Chat* | Your pinned, never-deleted home chat (proactive briefings land here) |
| **Inbox** | *Posteingang* | Triaged messages from your channels — badge shows open count |
| **Agenda** | *Anstehend* | Commitments & things to be reminded about — badge shows open count |
| **Notes** | *Notizen* | Your free-form notes |
| **Files** | *Dateien* | Uploaded documents + device file search |
| **Calendar** | *Kalender* | All connected calendars in one view |
| **Contacts** | *Kontakte* | People, across every channel |
| **Dashboards** | *Dashboards* | Each dashboard appears as its own entry |
| **Sessions** | *Sitzungen* | The full list of chats (the sidebar only shows recents) |
| **Folders** | *Ordner* | Grouped chats with shared instructions |

Below that: **Recent activity** (*Letzte Aktivitäten*) — your most recent chats.

!!! tip "Hide what you don't use"
    Under **Settings → Appearance → Navigation** you can choose exactly which entries
    appear in the sidebar and which page you land on after sign-in.

### The account menu

Click your avatar at the bottom of the sidebar for everything else:

- **Manage dashboards** (*Dashboards verwalten*) — create, rename and delete dashboards
- **Skills** (*Skills*) — reusable agent capabilities
- **Workflows** (*Workflows*) — reusable plans & automations (badge shows pending count)
- **Cloud Tasks** (*Cloud-Tasks*) — autonomous coding tasks
- **Knowledge / Memory** (*Gedächtnis*) — what the assistant knows about your world
- **Logbook** (*Logbuch*) — recent entity state changes
- **Scenes** (*Szenen*) — saved entity-state snapshots
- **Settings** (*Einstellungen*)
- **Admin** (*Admin*) — only if you have the admin role
- **Sign out** (*Abmelden*)

### On a phone

On small screens the chat collapses to a single column with a **bottom navigation
bar**. In a coding chat the tabs are **Chat / Editor / Terminal / Agents**; in a
custom-mode chat they're **Chat / Cards / Agents**; otherwise just **Chat / Agents**.
The tabs carry live badges — unread answers, uncommitted-changes, finished commands —
and pulse while the agent or a command is running.

## Where to go next

<div class="grid cards" markdown>

-   :material-chat-processing:{ .lg .middle } __[Chatting](chat.md)__

    ---

    The reading pane, the composer, message actions, voice and everything you do in a
    conversation.

-   :material-tune:{ .lg .middle } __[Chat controls & modes](chat-controls.md)__

    ---

    The per-chat pickers (model, reasoning, mode, security, memory, classification),
    chat modes and slash commands.

-   :material-account-supervisor:{ .lg .middle } __[Agents & autonomy](agents.md)__

    ---

    Sub-agents, the agents drawer, the `/goal` loop and background tasks.

-   :material-code-braces:{ .lg .middle } __[Coding & Cloud Tasks](coding.md)__

    ---

    Coding mode, the editor + terminal workspace, the cloud sandbox and autonomous PRs.

-   :material-graph:{ .lg .middle } __[Memory](memory.md)__

    ---

    The Knowledge page: what the assistant knows, how to inspect and correct it.

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

-   :material-view-dashboard:{ .lg .middle } __[Dashboards, entities & scenes](dashboards.md)__

    ---

    Lovelace-style dashboards, your entities, scenes and the logbook.

-   :material-school:{ .lg .middle } __[Skills](skills.md)__

    ---

    Reusable capability packages and the skills marketplace.

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

</div>
