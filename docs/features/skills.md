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
- An optional, more precise **When to use** rule for finer control.
- The full **Instructions** in Markdown — the actual procedure, loaded only when the skill
  is used.
- **Run isolated (context: fork)** - run the skill in its own sub-agent so its work doesn't
  fill up the main conversation; useful for long, multi-step procedures.
- The **Active** toggle decides whether the assistant can see and load the skill at all.

A skill name is a short kebab-case handle (for example `wochenbericht`); the assistant uses
it when it loads the skill. A skill can also bundle text files (a packaged `SKILL.md` keeps
its `references/` and `scripts/`), which the assistant pulls in on demand while running.

You can **Import** a `SKILL.md` (or a skill ZIP) and **Export** any skill to share it. Idle
skills you authored are aged automatically - active → stale → archived - and reactivate the
moment they're used again, so your list stays relevant without manual pruning.

The assistant can also write skills for you: when it works out a reusable approach (or you
correct one), it saves it as a new skill so it doesn't have to re-derive it next time.

## The marketplace

The **Marketplace** tab installs skills from curated catalogs (for example,
`anthropics/skills`) with one click. An installed skill lands **inactive** first — review
its instructions and the tools it's allowed to use, then activate it under **My skills**.
You'll also see when an **update** is available for an installed skill.

!!! note "Where the catalogs come from"
    The catalogs offered in the marketplace are curated by your admin under
    **Admin → Skill catalog** (see [Admin console](../administration/skill-catalog.md)). If the marketplace is empty,
    no catalog sources have been configured yet.

## Sharing a skill on this instance

Separately from the catalogs, you can share your own skill with other users on the same
instance. Open it under **My skills** and flip **Publish**: it then shows up in the instance
[Marketplace](marketplace.md), where others can **Adopt** it. An adopted skill is a live
reference - it runs in the adopter's own context (their data, integrations and model rules),
you stay the author and keep editing it, and they cannot change it. Publishing carries only
the skill's text and bundled files, never your data or secrets. Adopted skills appear
read-only in the adopter's list and can be removed at any time.
