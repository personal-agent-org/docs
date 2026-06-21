# Skill catalog

The **Skill catalog** page (admin console → *Skill catalog*) is where an admin
curates which GitHub repositories appear in the users' **Skills** marketplace.
Each catalog source is a repo in the open `SKILL.md` format; users browse it
under *Skills* and install capabilities with one click.

## What a skill is

A skill is a self-contained capability package: a `SKILL.md` file (a name,
description and the full playbook) optionally alongside `references/` and
`scripts/` folders. Personal Agent uses the open
[agentskills.io](https://agentskills.io) format, so any compatible repo works —
for example `https://github.com/anthropics/skills`.

In a catalog source, **every folder that contains a `SKILL.md` is offered as a
separate skill** in the marketplace.

## Curating sources

The page lists the current catalog sources in a table (`Label`, `Repo`,
`Branch/tag`, `Enabled`) and lets you **add**, **edit**, **enable/disable** and
**remove** them.

Use **Add source** (or the edit pencil on a row) to open the dialog. The fields:

| Field | Required | Notes |
| --- | --- | --- |
| `Label` | No | A friendly display name for the source. |
| `Repo` (`repo_url`) | Yes | A `github.com` repo URL, e.g. `https://github.com/owner/repo`. Only github.com is accepted. |
| `Branch/tag` (`ref`) | No | A specific branch or tag. Empty = the repo's default branch. |
| `Enabled` | — | Whether the source is exposed in the user marketplace. |

The repo URL shape is validated when you save, so a non-github.com URL is
rejected with *"Could not save the source (is it a github.com URL?)."*.

!!! note "Removing a source"
    Deleting a catalog source only removes it from the marketplace —
    **already-installed skills are kept** for the users who installed them.

## The user-facing marketplace

Users browse all **enabled** sources under *Skills*. For each discovered skill
the marketplace marks whether it is already **installed** and whether an
**upstream update** is available (compared by the `SKILL.md` version). Browsing
is read-only.

When a user installs a skill, the repo is **fetched and parsed server-side** and
the skill is saved **disabled** — so the user can review its instructions and
allowed tools before enabling it. Once enabled, the agent sees the skill's
description in its context and loads the full playbook on demand via the
`use_skill` tool.

!!! note "Catalog vs. manual import"
    The catalog is the curated path. Users can still import a single `SKILL.md`
    or a zipped skill folder directly under *Skills*; the catalog adds a
    one-click, admin-vetted marketplace on top of that.
