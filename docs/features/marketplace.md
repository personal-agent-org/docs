# Marketplace

The **Marketplace** is where users on your instance share what they've built. Publish one of
your own **agents**, **skills** or **workflows** and anyone on the instance can **adopt** it;
adopt someone else's and it becomes part of your toolkit - without ever copying it.

!!! note "Two different marketplaces"
    This page is the **instance marketplace** - agents, skills and workflows your *colleagues*
    have published, shared peer-to-peer. The separate **Skills** marketplace installs skills
    from admin-curated GitHub catalogs; that one is covered on the [Skills](skills.md) page.

## Adopt as a live reference, not a copy

Adopting an item does **not** make a copy. The published item stays owned by its author, and
your adoption is a **live reference** to it:

- **The author keeps it current.** When they improve a published agent or fix a workflow, your
  adoption picks up the change automatically - there's no stale copy to re-import.
- **You can't edit it.** An adopted item is read-only to you. If you want your own variant,
  build your own.
- **It runs in *your* context.** This is the important guarantee. A referenced item executes
  with **your** data classification, **your** integrations, **your** model and governance - never
  the publisher's. The author's credentials, integration accounts and devices are never used or
  even shared.

Because of that, publishing is safe: only **safe metadata** ever crosses between users. An
agent's persona/instructions, a skill's body, a workflow's script internals, integration
account ids, devices and secrets are **never** exposed to anyone browsing or adopting.

## Browsing and adopting

Open **Marketplace** from the main navigation. Filter by **All / Agents / Skills / Workflows**,
and each card shows the item's name, type, a short description and **who published it**.

- **Details** opens a richer (but still safe) preview to help you decide: the description, a
  *when to use* hint, and for an **agent** its required capabilities, default model and any
  surface requirement.
- **Adopt** wires the item into your account. An agent becomes delegatable, a skill becomes
  available to your assistant, a workflow becomes runnable by you.
- **Remove** un-adopts it - the reference is deleted and the item is no longer available to your
  agent. (Your own published items show a **Yours** badge instead and can't be adopted.)

## Publishing your own

Publishing is open and instant - you publish your **own** items, no review queue:

- **Agents** - toggle **Publish** on your agent in **Settings** (the delegatable-agents section).
- **Workflows** - hit the **Publish** (globe) action on your workflow row on the **Workflows** page.
- **Skills** - toggle **Publish** on the skill from the **Skills** page.

You can only publish items you own (a user-scope agent, your own skill or workflow); built-in,
global or already-adopted items can't be published.

Unpublishing an item immediately **clears every adoption** of it (and, for a workflow, tears
down any schedules adopters had set on it - see below), so nothing keeps running off an item you
pulled back.

## Adopted workflows: your own triggers

An adopted [workflow](workflows.md) starts out **manual-run** only. But you can attach **your
own** triggers, schedule and condition gate to it, so it runs automatically *for you* - and when
it fires it uses **your** integrations, model and governance, and writes into **your** output
chat. The publisher's row, schedules and credentials are never touched. Un-adopting (or the
author unpublishing) removes your schedules cleanly, with no orphan left ticking.

## Admin: unlisting

An admin can **unlist** any published item as a kill-switch (an admin-only action). An unlisted
item disappears from the Marketplace and from new adoptions, and is dropped from adopters' live
runtime - an unlisted workflow won't fire even if an adopter's schedule still ticks (the worker
re-checks the adoption against the live, listed set before each run and skips it). Unlisting is
**reversible**: re-listing resumes everything with no re-wiring, and adopters' own schedules are
left in place throughout.
