# Skills

**Skills** (*Skills*, in the account menu) are reusable capabilities you can teach your
assistant — a repeatable procedure ("write the weekly report"), written once and reused
whenever it fits. They use the open **`SKILL.md`** format, so skills from Claude, Codex
or OpenCode work here too.

## How skills work

A skill is **name + description + full instructions**. The clever part is **progressive
disclosure**: the assistant only ever sees the name and one-line description until a task
actually matches — then it loads the full instructions. So you can have many skills
installed without cluttering every conversation.

## Your skills

The **My skills** (*Meine Skills*) tab lists what you've got. Create one with **New**
(*Neu*) and fill in:

- **Name** and a one-line **Description** — when should the assistant reach for this?
  (always visible to it);
- optionally a more precise **when to use** rule;
- the full **Instructions** in Markdown — the actual procedure, loaded only on use;
- **Run isolated** (*context: fork*) — run the skill in its own sub-agent so its work
  doesn't fill up the main conversation.

You can **Import** a `SKILL.md` (or skill ZIP) and **Export** any skill. Idle skills are
aged automatically (active → stale → archived) and reactivate when used again.

## The marketplace

The **Marketplace** (*Marktplatz*) tab installs skills from curated catalogs (e.g.
`anthropics/skills`) with one click. An installed skill lands **inactive** first — review
its instructions and the tools it's allowed to use, then activate it under **My skills**.
You'll also see when an **update** is available.

!!! note "Where the catalogs come from"
    The catalogs offered in the marketplace are curated by your admin under
    **Admin → Skill catalog**. If the marketplace is empty, no catalog sources have been
    configured yet.
