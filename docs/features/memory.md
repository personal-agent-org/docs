# Memory

Personal Agent remembers. Tell it something once — a preference, a fact about a project,
who someone is — and it recalls it in later chats. Everything it knows lives on the
**Knowledge** page (*Gedächtnis*, in the account menu), where you can browse, inspect
and correct it.

## What the Knowledge page shows

The page is **one list of everything the assistant knows about your world** — people,
projects, places, preferences, tasks and more. Each item is an **entity**; entities are
linked by **facts** (e.g. *owner = Alice*, *located in = Kitchen*). Items fed by an
[integration](integrations.md) also carry a **Live** badge with their current state, so
"what the assistant remembers" and "what's happening right now" sit side by side.

You can:

- **Search** and filter by **kind** (person, task, place, …), by **integration**, and by
  **nature** — physical vs. virtual.
- Switch between a **list** and a **graph** view. The graph draws entities as nodes and
  their relationships as links, and updates live as new facts are learned.
- Open any entity for its detail page: its **facts**, its **relationships**, its
  **history**, and a **cause-and-effect** trace of what led to a change.

## How the assistant learns

You never have to "save" anything manually — though you can ask it to *remember* a
specific thing. After a chat, a background **curator** reviews what happened and
**proposes** memory updates. Clear, low-risk facts are kept automatically; anything
sensitive or uncertain shows up as a **suggestion to confirm** (*Vorschläge zum
bestätigen*) at the top of the Knowledge page, where you **Keep** or **Reject** it.

This split keeps you in control: the chat agent only ever *reads* memory, a curator only
*proposes*, and writes are deliberate.

## Time travel

Memory has two senses of time, so you can ask both *"what was true on Monday?"* and
*"what did you **know** on Monday?"*. The **Time travel** control (*Zeitreise*) on an
entity lets you pick a past moment and see what the assistant knew then — useful for
understanding how it reached a conclusion, or auditing a correction.

## Correcting & forgetting

Knowledge changes, and so should memory:

- Editing a fact **supersedes** the old one rather than erasing it, so history and
  time-travel stay intact.
- **Forget** (*Vergessen*) removes an entity from active memory. Items synced from an
  integration are **archived rather than deleted** when the integration drops them, so
  anything you'd attached to them survives.
- Conflicts and merge suggestions surface conversationally in your main chat.

## Controlling what's used, per chat

Memory is **strictly private** to you. On top of that, each chat decides how much memory
it may read via the **Memory** picker — **Full**, **None**, or **Restricted** to chosen
areas and sources. A **None** chat is a clean-room: nothing is read and nothing is
learned. See [Chat controls](chat-controls.md#memory-access).

## The simple "remembered facts" list

For a plain, flat view of facts the assistant has stored about you — the ones it picked
up with the *remember* tool — open **Settings → Memory** (*Gedächtnis*). It lists every
entry, marks whether it came **from you** or **from the assistant**, and lets you delete
any of them.

!!! note "Going deeper"
    The full design of the world-state memory graph — its two time axes, provenance and
    the read/propose/write pipeline — is documented in
    [Universal memory](../universal-memory.md).
