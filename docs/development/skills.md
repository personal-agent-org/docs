# Authoring skills

A **skill** is a reusable, on-demand capability package for the agent — a name, a one-line
description, and a longer Markdown playbook the agent loads only when a task matches. Personal
Agent uses the open, portable **`SKILL.md`** format (agentskills.io), so skills authored for
Claude, Codex, OpenCode or OpenClaw import unchanged, and skills authored here export back out.

This page is for developers: the on-disk format, how progressive disclosure works at runtime,
how to bundle skills inside an integration, and how a skill reaches users through the admin
catalog. For the end-user-facing side (the **Skills** view, import/export, the marketplace),
see the [Skills feature page](../features/skills.md).

## The skill folder and `SKILL.md`

In the portable format a skill is a **folder** containing a `SKILL.md` (YAML frontmatter + a
Markdown body), optionally bundling text files under `references/`, `scripts/` and `assets/`:

```text
wochenbericht/
├── SKILL.md           # frontmatter + the playbook body
├── references/        # optional supporting docs (loaded on demand)
│   └── template.md
└── scripts/           # optional helper scripts (loaded on demand)
    └── collect.py
```

The folder name is the skill's stable handle (`name`). Personal Agent's import path accepts
either a bare `SKILL.md` file or a `.zip` of the whole folder; the parser lives in
`agent/skill_md.py` (`parse_skill_md`, `parse_skill_zip`).

### YAML frontmatter

The frontmatter is fenced by `---`. A file with no frontmatter is tolerated and treated as an
all-body skill. These are the keys Personal Agent reads, each mapped to its own column on the
`skills` table:

| Frontmatter key | Type | Maps to | Meaning |
| --- | --- | --- | --- |
| `name` | string | `name` | The stable handle the agent passes to `use_skill(name)`. Slugified to `[a-z0-9-]`, max 64 chars. Equals the skill folder name. |
| `description` | string | `description` | One line — **always** in the agent's context, so it knows the skill exists. Capped at 1024 chars. Make it a clear trigger. |
| `when_to_use` | string | `when_to_use` | Optional, richer activation hint. Also surfaced in the preamble. Hyphenated `when-to-use` is accepted too. |
| `allowed-tools` | space-separated string (or list) | `allowed_tools` | Optional tool allowlist enforced while the skill runs (see [Allowed tools](#allowed-tools-enforcement)). `allowed_tools` is accepted as an alias; commas are tolerated as separators. |
| `context: fork` | string | `context_fork` | When set to `fork`, the skill runs in an **isolated sub-agent** instead of inline (see [`context: fork`](#context-fork-isolated-execution)). `context_fork: true` is accepted too. |
| `metadata` | map | `meta` | Optional `{author, version, …}` sub-map, round-tripped verbatim on export. |
| `license`, `compatibility` | scalar | `meta` (top-level on export) | Spec-level top-level metadata, round-tripped. |

Any other unknown top-level scalar is collected into `meta` and preserved on export, so a
round-trip through Personal Agent never loses fields it doesn't model.

!!! note "`description` vs the playbook"
    `description` is the cheap, always-visible line; the body after the frontmatter is the
    expensive playbook loaded only on demand. Keep `description` short and trigger-shaped, and
    put the actual procedure in the body.

### A minimal `SKILL.md`

```markdown
---
name: wochenbericht
description: Write the weekly status report from this week's commits and notes.
when_to_use: When the user asks for the weekly report or "Wochenbericht".
allowed-tools: read_file web_search
metadata:
  author: Sebastian
  version: "1.0"
---

# Weekly report

1. Collect this week's merged commits and any notes tagged `weekly`.
2. Group the work into Shipped / In progress / Blocked.
3. Write 5–8 bullet points, lead with impact, link the PRs.
4. End with one line on next week's focus.

Keep it under 200 words. If `references/template.md` is bundled, read it with
`read_skill_file` and follow its structure.
```

### Bundled resources

A skill can ship sibling files (e.g. under `references/`, `scripts/`, `assets/`) that become
text **resources** — a list of `{path, content}` stored on the skill. The agent loads one on
demand with `read_skill_file(name, path)`, where `path` is relative to the skill folder (e.g.
`references/template.md`). Each captured file is text only — up to 256 KB per file; binary and
non-UTF-8 files are skipped.

!!! note "What gets captured"
    For a skill **bundled inside an integration** (`<domain>/skills/<name>/`), the loader
    captures *every* file under the skill folder recursively (except `SKILL.md` and oversized/
    binary files). For a skill **imported as a ZIP**, only files under `references/`, `scripts/`
    and `assets/` are kept. Either way, organise extra files under those three directories.

## Progressive disclosure at runtime

This is the core mechanism, and it has two halves.

**The preamble (always visible).** At run start, `agent/skills.py:build_skills_preamble`
injects only each enabled skill's `name`, `description` and `when_to_use` into the agent's
instructions — one cheap line per skill. The model therefore knows which skills *exist* without
spending context on any of their playbooks. This runs on both the inline path (`AgentService`)
and the durable path (`build_durable_instructions`), and only on tool-enabled runs (because
`use_skill` is a tool). The same preamble carries a short self-improvement nudge pointing the
agent at `save_skill(...)` so a learned procedure becomes a reusable skill.

**The `use_skill` tool (on demand).** When the current task matches a listed skill, the agent
calls `use_skill("<name>")`. The toolset (`agent/skill_toolset.py`) looks the skill up
owner-scoped, marks it used (so the background curator keeps it active), and returns a
structured `SkillInstructions`:

| Field | Meaning |
| --- | --- |
| `name`, `description` | Echoed back. |
| `instructions` | The full playbook body the agent now follows. |
| `context_fork` | Whether the skill is meant to run isolated. |
| `allowed_tools` | The enforced tool allowlist active while the skill runs. |
| `resources` | The paths of bundled files, each loadable via `read_skill_file(name, path)`. |

The agent then follows `instructions`, loading any referenced resource file with
`read_skill_file`. The two skill-machinery tools (`use_skill`, `read_skill_file`) always work
regardless of an active allowlist, so the agent can always load instructions and switch skills.

### `context: fork` (isolated execution)

A skill with `context: fork` is meant to run in its own sub-agent so its work doesn't pollute
the main conversation. When the run has sub-agents wired **and** is trusted (not gated by the
untrusted-content policy), `use_skill` spawns a real `delegate` sub-agent that carries out the
whole skill and returns only a compact result; the skill's `allowed_tools` ride on the
sub-agent's deps, so the parent run is never restricted afterwards. On the durable path, in
untrusted runs, or inside a sub-agent, it falls back to returning a directive that tells the
agent to delegate the work itself.

### Allowed tools enforcement

If a skill declares `allowed-tools`, that allowlist is enforced for the rest of the turn (or for
the isolated sub-agent, in the fork case) by `SkillAllowlistToolset`
(`agent/skill_allowlist.py`), which wraps every toolset — so enforcement holds even in
`autonomous` security mode. Tool-name matching is forgiving: names are normalised (lowercased,
any `(args)` suffix dropped) and common cross-agent aliases are mapped onto Personal Agent's tool
names, so an imported skill that lists Claude-Code-style tools still binds:

| Skill names (and similar) | Personal Agent tool |
| --- | --- |
| `Bash`, `Shell`, `Terminal` | `run_command` |
| `Read`, `View`, `Cat` | `read_file` |
| `Write`, `Create` | `write_file` |
| `Edit`, `str_replace` | `edit_file` |
| `Glob`, `LS`, `List` | `list_dir` |
| `WebSearch` | `web_search` |
| `WebFetch` | `web_fetch` |

A skill with no recognisable allowlist is not restricted; the next `use_skill` replaces the
active allowlist (and an empty one clears it).

## Bundling skills inside an integration

An integration can ship skills the same way it ships agents and surfaces. Drop SKILL.md folders
under a `skills/` directory in the integration:

```text
integrations/openproject/
├── manifest.yaml
├── config_flow.py
├── integration.py
└── skills/
    └── sprint-report/
        └── SKILL.md
```

At load time, `integrations/loader.py:_load_bundled_skills` parses every
`<domain>/skills/<name>/SKILL.md` onto the `LoadedIntegration.skills` tuple (each skill's sibling
files become resources, just like a zipped package; the skill's `name` defaults to the folder
name). A broken skill is logged and skipped — it never blocks the integration from loading.

The skills are **projected into the `skills` table when a config entry for that integration is
set up** (`integrations/contrib.py:_project_skills`), with scope inherited from the entry:

| Config entry scope | Resulting skill scope |
| --- | --- |
| User entry | `owner_sub` = the entry owner (personal skill) |
| Org or global entry | `owner_sub IS NULL` (visible to everyone in scope) |

Projected skills carry `source="integration"` and `source_id="<domain>:<name>"`, and their
`source_version` tracks the integration manifest version (so re-setup updates them in place). If
the name collides with an existing authored or imported skill, **user content wins** and the
projection is skipped.

!!! note "No per-domain hardcoding"
    Bundled skills are discovered from the integration folder, not from any central list — the
    same as `entity_types()`, `agents()` and `surfaces()`. Just add the `skills/` folder.

## How skills reach users

There are three provenances for a skill, tracked in the `source` column:

- **`authored`** — created by the user (or by the agent via `save_skill`) in the Skills view.
- **`imported`** — uploaded as a `SKILL.md` file or skill `.zip` (`POST /skills/import`).
- **`integration`** — projected from an integration's `skills/` folder (above).
- **`catalog`** — installed from the admin-curated marketplace.

### The admin catalog → the marketplace

The marketplace is not a third-party API: portable skills are distributed as folders in Git
repos (today GitHub, e.g. `anthropics/skills`). The admin curates a small allowlist of repos
under **Admin → Skill catalog**, each stored as a `SkillCatalogSource`
(`db/models/skill_catalog.py`):

| Field | Meaning |
| --- | --- |
| `label` | Human label shown in the marketplace. |
| `repo_url` | The GitHub repo URL. **Only `github.com` is accepted** — every outbound URL is built by us against `api.github.com` / `raw.githubusercontent.com`, so there is no SSRF surface. |
| `ref` | Optional branch / tag / sha; empty uses the repo's default branch. |
| `enabled` | Whether the source is offered. |

Admin endpoints: `GET/POST /admin/skill-catalog`, `PUT /admin/skill-catalog/{id}`,
`DELETE /admin/skill-catalog/{id}`.

Users then browse and install across the enabled sources:

1. **Browse** — `GET /skills/catalog` fetches each enabled repo server-side via the GitHub
   Trees API, enumerates every folder containing a `SKILL.md`
   (`agent/skills_catalog/github.py:GitHubSkillCatalog.list_skills`), and reads each one's
   frontmatter for the listing. Each item is marked `installed` and `update_available` (by
   comparing the upstream SKILL.md blob sha against the installed `source_version`). One
   unreachable source is reported in `errors` and does not fail the whole browse.
2. **Install** — `POST /skills/catalog/install` fetches the whole skill folder (SKILL.md +
   `references/`/`scripts/`/`assets/`), parses it, and saves it **disabled**
   (`source="catalog"`, with a stable `source_id` = `<owner>/<repo>@<ref>:<folder>` and the
   blob sha as `source_version`). It lands inactive on purpose so the user reviews the
   instructions and `allowed-tools` before enabling it under **My skills**.

!!! warning "Installed skills are disabled until reviewed"
    A catalog install never auto-enables. The skill (and the tools it's allowed to use) must be
    reviewed and activated by the user before the agent will see or run it.

## Import / export round-trip

Any skill can move in and out of the portable format:

- **Import** — `POST /skills/import` accepts a `SKILL.md` file or a skill `.zip`. An existing
  skill of the same name is overwritten.
- **Export** — `GET /skills/{id}/export` returns a `SKILL.md` (text), or a `.zip` of the skill
  folder when the skill bundles resources.

`to_skill_md` / `build_skill_zip` (in `agent/skill_md.py`) serialize back to a
standards-compliant file: `allowed_tools` is emitted as the spec's space-separated
`allowed-tools` string, `context_fork` as `context: fork`, and `meta` is split back into
top-level `license`/`compatibility` plus a `metadata` map — so a skill imported from another
agent exports cleanly for it again.
