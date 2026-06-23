# Memory

The assistant builds up a durable, private picture of your world as you chat — that you
prefer terse answers, who a person is, that "the K8s migration" is a project, what you
asked it to do. This page covers that learned **memory**: how facts are recalled, how the
assistant proposes new ones for you to confirm, and how to inspect, time-travel, correct
and erase what it knows.

Memory and live integration data share **one graph** of entities and facts, surfaced on
the **Memory** page (in the account menu). This page is about the *governance and
time-travel* side. For browsing that graph, creating your own entities (helpers), and
organizing areas, floors and devices, see [Entities](entities.md).

!!! note "Memory is private"
    Everything the assistant learns is **strictly yours**, isolated at the database level
    (per-owner row-level security). Nothing leaks across users. Group-shared knowledge is
    the one exception, and only for members of that group.

## What the assistant remembers

Each thing the assistant knows is an **entity** (a person, project, place, preference, …)
with **facts** attached (`preference = terse`, `location = Kitchen`, `state = on`). A fact
whose object is another entity is a **relationship**.

Every fact carries provenance you can see throughout the UI:

| Provenance | Shown as | Meaning |
| --- | --- | --- |
| Source | 👤 / 🤖 / 🔌 | Who asserted it: you, the assistant, or an integration |
| Date | `06-07` | When the fact started holding (its valid-from) |
| Confidence | `●●●●○` | How sure the assistant is (0–5 dots) |
| Status | `superseded`, `invalidated`, … | Lifecycle — only shown when not the active value |

### How facts reach memory

You rarely add memory by hand. The pipeline keeps the chat agent **read-only** and routes
all writing through a deliberate review step:

1. **During a conversation the agent only reads.** It never writes or edits memory mid-run.
2. **After a run a background curator reviews what happened** and *proposes* memory
   updates. The curator only proposes — it never writes the database directly.
3. **A deterministic committer writes** the accepted proposals, handling deduplication,
   superseding and conflict detection.

Clear, low-risk facts (things you plainly stated, or an integration plainly observed) are
**committed automatically**. Anything inferred, privileged, or drawn from untrusted
content is held back as a **proposal to confirm** (see [below](#proposals-keep-or-discard)).

## Recall and automatic prefetch

The assistant has two ways to read memory.

**Automatic prefetch (push).** Before each turn, relevant memory is gathered and injected
into the model's context as a compact `## Known World State` reference block: your
preferences and policies, the entities mentioned in your message, their current facts and
nearest relationships, and a few salient recent events. This runs deterministically on the
hot path — no model call — and is a *reference, not an instruction*: a live statement you
make always wins over a remembered fact.

**On-demand lookup (pull).** When the assistant needs something not already in context, it
uses read-only tools to query the graph directly — semantic `recall`, entity lookup,
current facts, relationship traversal, and the time-travel queries below. These tools never
return unconfirmed proposals to the agent, and they respect the chat's
[memory access](#per-chat-memory-access).

!!! note
    Memory must never break a run. If anything in the memory path fails, the run simply
    proceeds without it.

## Proposals: Keep or Discard

Proposals the curator wants you to confirm appear at the top of the **Memory** page
under **Proposals to confirm**. Each row shows the proposed fact, its source, type and
confidence, with two actions:

| Action | Effect |
| --- | --- |
| **Keep** (✓) | Commits the proposal as an active fact |
| **Discard** (✗) | Rejects it — and remembers the rejection so it isn't re-proposed |

The same proposals also surface conversationally in your **main chat**, where you can just
say *"yes, remember that"* or *"no"*. Until confirmed, a pending proposal is invisible to
the chat agent — it is never read into a run.

!!! note "Anti-nag"
    Discarding a proposal records a quiet suppression, so the curator stops re-proposing
    the same assertion. Keeping a fact you previously discarded clears that suppression.

### Merge suggestions and conflicts

When the curator notices two entities that might be the same thing — for example, a person
recorded under two spellings — it raises a **merge suggestion** in the main chat (*"Are
these the same?"*) rather than guessing. Confirm to merge, decline to keep them separate.

When a new fact contradicts something you said earlier, the committer **supersedes** the
old value and the curator tells you in the main chat (*"I updated something you'd said
differently before"*), so a silent change never goes unnoticed.

## Time-travel

Memory tracks two senses of time for every fact, so it can answer both *"what was true on
Monday?"* and *"what did you **know** on Monday?"* — and explain late knowledge or
corrections.

On an entity's detail page, the **Time-travel (as of)** control lets you pick a point in
time and show exactly that:

| Mode | Question it answers |
| --- | --- |
| Valid-time (default) | What was **true** about this entity at that moment |
| **What the agent knew** (toggle) | What the assistant **knew** at that moment |

The two differ whenever knowledge arrived late or was later corrected. The assistant can
run the same queries itself during a chat (*"what did you know about this last week?"*).

Each fact also has a **History** view listing every value the attribute has held, with the
window each value was valid (`valid_from → valid_to`) and its status — the quickest way to
see how a value evolved.

## Superseding, forgetting and archiving

Knowledge changes, so memory is built to be corrected without losing its past.

- **Editing supersedes, it doesn't overwrite.** A new value ends the old one's validity and
  marks it `superseded`; the old row stays, so history and time-travel remain intact.
- **Forget** a fact (the trash action on a fact) ends its validity and marks it
  `invalidated`. The row is kept — "forgotten" means it no longer holds, not that it's
  erased — so the past is still auditable.
- **Merge and split.** Two entities can be merged into one (the merged node is kept, never
  hard-deleted), and a conflated entity can be **split** into two, moving the chosen facts
  to the new one.
- **Archiving.** When an integration stops reporting an entity, its graph node is
  *archived, not deleted* — any facts you attached to it survive, and it can return if the
  integration does.

## The audit trail

Because nothing is overwritten, every change is traceable:

- **Cause & effect** on an entity shows what led to a change — the run, message or sync
  that caused it, and what it resulted in.
- The assistant can walk this both ways: *why* an attribute has its current value (the
  asserting source, the recorded reason and evidence, and the triggering event) and *what*
  a given run or event went on to trigger.
- Every fact keeps the **evidence** behind it (a quote or reference) and the **reason** it
  was asserted, visible when you expand the fact.

## Per-chat memory access

Each chat decides how much memory it may read, with the **Memory** control in the composer.
Your default lives under **Settings → Profile**; a per-chat choice overrides it.

| Access | What the chat may read | Is it learned from? |
| --- | --- | --- |
| **Full** (default) | Everything remembered | Yes |
| **None** | Nothing — a private chat | No — the curator skips it entirely |
| **Restricted** | Only the areas **and** sources you tick | Yes |

A **None** chat is a clean room: no `## Known World State` is pushed, the read tools are
removed, and the curator never mines it — nothing in nor out.

**Restricted** filters along two independent axes, and a fact must pass *both* to be visible:

| Areas (by topic) | Sources (by origin) |
| --- | --- |
| People & contacts | Preferences & rules |
| Work & projects | Things you said |
| Places & devices | Agent inferences |
| Notes & topics | Integration observations |

!!! warning "Empty axis = nothing"
    Leaving an area or source list empty is fail-closed — the chat sees **nothing** in that
    axis. The picker warns you so it isn't accidental. (This is handy on purpose: a chat
    that may draw only on your stated preferences and nothing inferred.)

This gate is enforced at the source, so sub-agents and scripted tools spawned from the chat
honour the same policy. See also [Chat controls](chat-controls.md#memory-access).

!!! note "Going deeper"
    The full design of the world-state memory graph — its two time axes, provenance, and
    the read / propose / write pipeline — is in [Universal memory](../universal-memory.md).
    For browsing entities, helpers and areas, see [Entities](entities.md).
