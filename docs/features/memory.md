# Memory & entities

**Memory and entities are the same thing.** Personal Agent keeps a single layer of
knowledge about your world, and it surfaces on one screen — the **Knowledge** page (in
the account menu). There is no separate "memory" page and "entities" page: the old
`/memory` and `/entities` links both redirect to `/knowledge`, because they were never
two things to begin with.

This page explains that one layer: what it is, how the assistant learns it, how to
inspect and correct it, and how live integration data fits into the very same graph.

## One layer, two kinds of knowledge

Everything the assistant knows is stored as a graph of **entities** linked by **facts**.
That graph holds two kinds of knowledge that most products keep apart — and here they are
unified:

1. **Durable memory** — things the assistant has *learned*: that you prefer terse
   answers, that "the K8s migration" is a project, who a person is. These are entities
   and facts the assistant builds up over time as you chat.
2. **Live entities** — things with a *current state*, synced from your
   [integrations](integrations.md): a light that is on, a sensor reading, a calendar, a
   GitHub pull request, a project in OpenProject.

They are not two registries. An integration entity can declare a memory **kind**, and the
sync engine then keeps a **graph node for that entity inside the same memory graph**. So a
single "Living-room lamp" is *both* a live-state thing you can switch *and* a memory node
that facts can attach to ("installed by Alice", "part of the evening scene"). On the
Knowledge page it shows a **Live** badge with its current state, sitting in the same list
as purely-learned entities like a person or a preference.

!!! tip "Why this matters"
    Because they share one graph, the assistant can reason across both at once — *"turn
    off the lamp Alice installed"* joins a learned fact (who installed it) with live state
    (which lamp, is it on). Ask it about a project and it can pull both what you've told it
    and the live issues synced from your tracker.

## What the Knowledge page shows

The Knowledge page is **one list of everything the assistant knows about your world** —
people, places, preferences, tasks, projects, devices, lights, sensors and more. Each row
is an entity. Entities fed by an integration carry a **Live** badge and their current
state; purely-learned entities don't.

You can:

- **Search** the graph and filter by **kind** (person, task, place, light, …) and by
  **integration**.
- Filter by **nature** — every kind is tagged **physical** (a lamp, a person, a room) or
  **virtual** (a project, a preference, a note topic).
- Switch between a **list view** and a **graph view**. The graph draws entities as nodes
  and their relationships as edges, and updates live as new facts are committed. It shows
  up to a few hundred nodes — filter or search to focus it.
- Open any entity for its detail page (covered below).

`contact` is the single kind used for people, so a person you email, message and meet is
one entity — not one per channel. See [Contacts](inbox.md#contacts) for the person-centric
view built on top of it.

## Entities in detail

Open an entity to see and manage everything about it:

- **Facts** — every statement where this entity is the subject (`preference = terse`,
  `location = Kitchen`, `state = on`). A fact whose object is another entity is a
  **relationship** and shows under its own heading.
- **Live state & attributes** — for integration-linked entities, the current value and
  the raw attributes the integration reports.
- **History** — how the entity's facts and state have changed over time.
- **Cause and effect** — a trace of *what* led to a change: the run, message or sync that
  caused it, and what it resulted in.
- **Time travel** (see [below](#time-travel)).
- **Forget** — remove the entity from active memory.

### Creating your own entities (helpers)

You don't only get entities from integrations — you can create your own, called
**helpers**, right on the Knowledge page. A helper is a small virtual entity the assistant
(and your [dashboards](dashboards.md) and [workflows](workflows.md)) can read and control:

| Helper | What it is |
| --- | --- |
| **Toggle** | An on/off switch |
| **Number** | A value with a min/max/step (rendered as a slider) |
| **Button / counter** | A press button or a +/- counter |
| **Select** | A dropdown of options you define |
| **Text** | A free-text value |
| **Date / time** | A date and/or time value |

Helpers with the same device group are shown together under one device.

### Areas, floors and devices

Entities can be organized like a real building: assign each to an **area** (a room),
group areas onto **floors**, and roll physical entities up under **devices**. Areas and
floors are managed from the Knowledge page and drive area/device cards and per-room
dashboards.

### Sync and search indexing

Integration entities refresh automatically; **Sync now** pulls the latest state on
demand. Many entities are also **indexed for semantic search (RAG)** — marked with a RAG
badge — so the assistant can find a project, document or issue by meaning, not just by
name.

## How the assistant learns

You rarely add memory by hand (though you can ask the assistant to *remember* a specific
thing). The pipeline keeps writers deliberate and the chat agent read-only:

1. **The chat agent only reads** memory during a conversation.
2. After a run, a background **curator** reviews what happened and **proposes** memory
   updates — it never writes directly.
3. Clear, low-risk facts (things you stated or the assistant plainly observed) are
   **committed automatically**. Anything inferred, privileged or drawn from untrusted
   content is held as a **suggestion to confirm**.

Pending suggestions appear at the top of the Knowledge page, where you **Keep** or
**Reject** each one. Conflicts and merge suggestions also surface conversationally in your
main chat.

## Time travel

Memory tracks two senses of time for every fact, so it can answer both *"what was true on
Monday?"* and *"what did you **know** on Monday?"* — and explain late knowledge or
corrections. The **time-travel** control on an entity lets you pick a past moment and see
exactly what the assistant knew then. It's the quickest way to understand how a conclusion
was reached or to audit a change.

## Correcting and forgetting

Knowledge changes, so memory is built to be corrected without losing its past:

- Editing a fact **supersedes** the old one rather than erasing it, so history and
  time-travel stay intact.
- **Forget** removes an entity from active memory.
- When an integration stops reporting an entity, its node is **archived, not deleted** —
  so any facts you attached to it survive, and it can come back if the integration does.

## Privacy and per-chat access

Memory is **strictly private to you**, isolated at the database level. On top of that,
each chat decides how much memory it may read with the **Memory** control — **Full**,
**None**, or **Restricted** to chosen areas and sources. A **None** chat is a clean
room: nothing is read and nothing is learned from it. See
[Chat controls](chat-controls.md#memory-access).

## The simple remembered-facts list

For a plain, flat view of the facts the assistant has stored about you — the ones it
picked up with its *remember* tool — open **Settings → Memory**. It lists every entry,
marks whether it came **from you** or **from the assistant**, and lets you delete any of
them. It's a lightweight companion to the full Knowledge page above.

!!! note "Going deeper"
    The complete design of the world-state memory graph — its two time axes, provenance,
    and the read / propose / write pipeline — is documented in
    [Universal memory](../universal-memory.md).
