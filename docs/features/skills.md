# Skills

**Skills** (in the account menu) are reusable capabilities you can teach your assistant — a
repeatable procedure ("write the weekly report", "prep a release") written once and reused
whenever it fits. They use the open **`SKILL.md`** format, so skills from Claude, Codex or
OpenCode work here too.

## How skills work

A skill is **name + description + full instructions**. The clever part is **progressive
disclosure**: the assistant only ever sees the name and one-line description until a task
actually matches — then it loads the full instructions. So you can have dozens of skills
installed without cluttering every conversation or burning context on procedures you're not
using right now.

## Your skills

The **My skills** tab lists what you've got. Create one with **New** and fill in:

- **Name** and a one-line **Description** — when should the assistant reach for this? (this
  line is always visible to it, so make it a clear trigger).
- An optional, more precise **when to use** rule for finer control.
- The full **Instructions** in Markdown — the actual procedure, loaded only when the skill
  is used.
- **Run isolated** — run the skill in its own sub-agent so its work doesn't fill up the main
  conversation; useful for long, multi-step procedures.

You can **Import** a `SKILL.md` (or a skill ZIP) and **Export** any skill to share it. Idle
skills are aged automatically — active → stale → archived — and reactivate the moment
they're used again, so your list stays relevant without manual pruning.

## The marketplace

The **Marketplace** tab installs skills from curated catalogs (for example,
`anthropics/skills`) with one click. An installed skill lands **inactive** first — review
its instructions and the tools it's allowed to use, then activate it under **My skills**.
You'll also see when an **update** is available for an installed skill.

!!! note "Where the catalogs come from"
    The catalogs offered in the marketplace are curated by your admin under
    **Admin → Skill catalog** (see [Admin console](admin.md)). If the marketplace is empty,
    no catalog sources have been configured yet.
