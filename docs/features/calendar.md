# Calendar & agenda

Two related places for "what's coming up": your **Calendar** (real events from connected
calendars) and your **Agenda** (tasks, appointments and reminders the assistant tracks for
you).

## Calendar

The **Calendar** page (in the sidebar) merges all your connected **CalDAV** calendars into
one **Month** grid. Page through months with the arrows, or jump back with **Today**.

- Each connected calendar is a color-coded **layer**: a row of chips at the top lets you
  toggle individual calendars on and off. All layers are shown by default.
- Click an event to open it on its **own page** with full details.
- **New event** creates one on any **writable** calendar: title, an **all-day** toggle,
  start and end (date, plus time when not all-day), which calendar, location and
  description. (When several CalDAV accounts are connected, the calendar picker qualifies
  same-named calendars with the account.)
- All-day events are marked accordingly, and each calendar keeps its own color.

Events sync read-only every 15 minutes over a window of yesterday to +45 days; a freshly
created event is ingested immediately so it shows up without waiting for the next sync.

No calendar yet? Connect one under **Settings → Integrations** (CalDAV). See
[Integrations](integrations.md).

## Agenda

The **Agenda** page (in the sidebar) is where the assistant's **proactive** side shows up.
It brings your **tasks** and your **upcoming appointments** together in one list, alongside
the commitments and deadlines it has promised to remind you about.

- When you tell the assistant you'll do something ("I'll get back to Marco about the K8s
  update"), it can **record a commitment** - and it appears here as a task.
- Add your own tasks with a quick line in the input, optionally with a due date.
- Mark items **Done** or **Dismiss** them.
- **Hand to agent** opens a new chat with the task as its first message and lets the
  assistant work on it.

Calendar events from the next days appear here too, day-grouped alongside the tasks;
overdue and undated tasks bubble up to an **Open** group at the top.

### Proactive reminders

On a schedule you control, the assistant **reviews what's due** and nudges you in your
[main chat](chat.md#the-main-chat) (and, if enabled, via push notification) so things
don't slip even if you never open the Agenda. Tune how often under **Settings → Behavior**,
in the **Proactive assistant** section: **Off**, **Once a day**, **Every 6 hours**, or
**Hourly** (the default). Set **quiet hours** (local time) and the review is skipped
entirely during that window, so it doesn't reach you at night.
