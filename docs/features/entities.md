# Entities & helpers

Everything the assistant knows about your world — people, places, devices, lights,
sensors, projects, your own switches and counters — lives as **entities** on the
**Knowledge** page (in the account menu). This page is the practical, hands-on guide to
working with those entities: creating your own **helpers**, organising entities into
**areas**, **floors** and **devices**, telling live integration data apart from learned
memory, and inspecting an entity's history and cause/effect trace.

For how the assistant *learns* facts, the propose/confirm pipeline, and time-travel over
memory, see [Memory](memory.md) — this page does not repeat that.

!!! note "One page, one concept"
    Entities and memory are the same layer on the same screen. The old `/entities` and
    `/memory` links both redirect to `/knowledge`. This page focuses on the entity side;
    [Memory](memory.md) focuses on the learning side.

## Live entities vs. memory nodes

The Knowledge list mixes two things that look alike but come from different places:

| | Live integration entity | Memory node |
| --- | --- | --- |
| Where it comes from | Synced from an [integration](integrations.md) | Learned by the assistant over time |
| Has a current **state** | Yes (e.g. a light that is `on`) | No |
| Has a **kind** (person, task, place…) | Only if its type declares one | Yes |
| Carries **facts / relationships** | Only when linked to a node | Yes |
| Opens | An attributes dialog | The full entity detail page |

The two are not separate registries. When an integration entity's type declares a memory
**kind**, the sync engine keeps a **graph node for it inside the same memory graph**. That
node carries any facts you attach, while the integration keeps feeding its live state — so
a single "Living-room lamp" is both a thing you can switch and a node facts can hang off.

On the list you can tell them apart by their badges:

- **Live** (outline, grey) — a live-only integration entity with no linked graph node. It
  opens the attributes dialog.
- **Live** with an integration name (outline, teal) — a graph node that an integration
  feeds with live state. It opens the full detail page.
- No badge — a purely-learned memory node.

## What the Knowledge page shows

The page is one list (or graph) of everything the assistant knows. The toolbar lets you:

- **Search** by name.
- Filter by **Kind** (person, task, place, light, …) — a memory-graph concept.
- Filter by **Integration** (the source domain).
- Filter by **nature** — **Physical** (a lamp, a person, a room) or **Virtual** (a
  project, a preference). Nature is a property of the kind, so this filter applies to
  graph nodes only.
- Switch between **list view** and **graph view**. The graph draws nodes and their
  relationships and updates as new facts arrive; it shows up to a few hundred nodes, so
  filter or search to focus it.

!!! note
    The kind and nature filters are graph concepts, so applying either hides live-only
    integration entities (which have no kind). Clear them to see the full mixed list.

The `⋮` overflow menu holds the management actions: **New helper**, **Areas**,
**Devices**, and **Sync now**.

## Helpers — entities you create

You don't only get entities from integrations — you can create your own, called
**helpers**. A helper is a small entity whose state lives inside Personal Agent itself, so
the assistant, your [dashboards](dashboards.md) and your [workflows](workflows.md) can read
and control it. Open `⋮ → New helper` and pick a kind:

| Kind | What it is | Actions |
| --- | --- | --- |
| **Toggle** | An on/off switch | turn on / turn off / toggle |
| **Number** | A bounded value (rendered as a slider) | set value |
| **Button** | A press button (counts presses) | press |
| **Select** | A dropdown of options you define | select option |
| **Text** | A free-text value | set text |
| **Counter** | A +/- counter | increment / decrement / reset |
| **Date / Time** | A date and/or time value | set |

The dialog adapts to the kind:

- **Name** — required for every helper.
- **Initial value** — optional. For a toggle, values like `on`, `true`, `1` or `yes`
  start it on. For a select, it defaults to the first option.
- **Number / Counter** show **Min**, **Max** and **Step** fields (Number also has a
  **Unit**). Values are clamped to the min/max range.
- **Select** shows an **Options** box — one option per line (commas also work).
- **Device group (optional)** — see [Device groups](#device-groups) below.

!!! note "Helpers don't sync"
    A helper's state is owned by Personal Agent, not pulled from anywhere, so **Sync now**
    never resets it. Its state only changes through its actions (a dashboard control, a
    workflow, or the assistant).

After you create a helper it is seeded in the background, so it appears in the list a
moment later. To remove one, open it and choose **Delete helper**.

## Areas, floors and devices

Entities can be organised like a real building.

### Areas and floors

Open `⋮ → Areas`. **Floors** have a name and a numeric **level** (e.g. ground = `0`,
first = `1`). **Areas** are rooms; each area can optionally sit on a floor. Add and delete
both here.

To put an entity in an area, open it and pick an **Area** from the dropdown (live-only
entities have this in their attributes dialog). Areas and floors drive area/device cards
and per-room [dashboards](dashboards.md).

### Devices

Open `⋮ → Devices`. A **device** groups several entities that belong to one physical
thing (a multi-sensor reporting temperature *and* humidity, for example). The list shows
each device's manufacturer, model and entity count. You can:

- Assign a device to an **Area** (its entities follow).
- Delete a device.

Integrations create devices automatically; you can also create them implicitly with
helper **device groups**.

### Device groups

When creating a helper, the optional **Device group** field places it under a named
device. Helpers that share the same group name are grouped under **one** device — handy
for keeping, say, three "Kitchen" helpers together. The device appears in the Devices
list (created on first use) with all its grouped helpers.

## Per-entity detail: state, history, cause & effect

Open any graph-backed entity (no live-only badge, or one tagged with an integration name)
for its detail page. It shows:

- **Live state** — for integration-fed nodes, a banner with the current state, the source
  integration and entity type, and the last-synced time.
- **Facts** — every statement about the entity (`preference = terse`, `location =
  Kitchen`, `state = on`), each with its source, confidence and reason. Expand a fact to
  see its provenance and the evidence behind it. (How facts are learned and superseded is
  covered in [Memory](memory.md).)
- **Relationships** — facts whose object is another entity, in and out, with a small
  neighbourhood graph.
- **History** — on any fact, **History** opens its full timeline: each value with the
  window it was valid for and its status (active / superseded).
- **Cause & effect** — a timeline of the events linked to the entity's changes: what run,
  message or sync caused a change and its outcome. This is the quickest way to answer
  *"why did this change?"*.

!!! note
    Live-only integration entities (the grey **Live** badge) open a lighter attributes
    dialog instead — current state, raw attributes, and an area selector — because they
    have no facts or history of their own until a kind links them into the graph.

## Search indexing (RAG)

Many entities are **indexed for semantic search (RAG)** so the assistant can find a
project, document or issue by *meaning*, not just by exact name. Whether an entity is
indexed is decided by its type — indexed entities carry a **RAG** marker, and one that is
still being processed shows **RAG pending**. There is nothing to configure: indexing
happens automatically as entities sync, and an entity is removed from the search index if
its type stops being indexable. Helpers and other state-only entities are not indexed.

## Syncing, archiving and forgetting

- **Sync now** (`⋮ → Sync now`) pulls the latest state from your integrations on demand;
  with an integration filter active it syncs just that one. Integrations also refresh on
  their own schedule. Helpers are never reset by a sync.
- **Archive (automatic)** — when an integration stops reporting an entity, its graph node
  is **archived, not deleted**. Any facts you attached to it survive, and if the
  integration delivers it again the node is automatically reactivated.
- **Forget** — on the detail page, **Forget** on a fact invalidates that fact. Editing a
  fact supersedes the old one rather than erasing it, so history and time-travel stay
  intact. See [Memory](memory.md#superseding-forgetting-and-archiving).

!!! warning "Archive vs. forget"
    Archiving is something the *system* does when a source disappears — nothing is lost.
    Forgetting is something *you* do to a fact. Neither destroys history: archived nodes
    keep their facts and can return; forgotten facts are superseded, not wiped.
