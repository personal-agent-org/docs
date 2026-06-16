# The admin console

If you have the **admin** role, an **Admin** entry appears in the account menu, opening a
separate console with its own navigation. This is where an instance is configured for
everyone on it.

## Overview

A dashboard of **usage statistics** — tokens, cost, runs (and failed runs), active users,
cache hit rate and tool-call analytics — with charts per day, per model and per user. The
same chart components power each user's own [Usage](settings.md#usage-budget) tab.

## Providers

The center of model configuration:

- **Add a provider** by API key; its models are discovered automatically, and you **enable**
  the ones users may pick.
- Tag models (`frontier`, `coding`, `reasoning`, `fast`, `vision`, `cheap`) to drive `auto`
  model selection, and set **governance tags** (`local`, `eu`, …) that gate what each
  provider is cleared for.
- Add **custom providers** — self-hosted, OpenAI-compatible or keyless local endpoints.
- Configure the **guard model** (reviews tool calls), the **curator model** (proposes
  [memory](memory.md) updates), **voice models** (speech-to-text and text-to-speech),
  **model pricing** overrides, the **organization governance** floor, and view the
  **governance audit log**.

## Users & groups

- **Users** — manage the people on the instance.
- **Groups** — teams with shared folders and workflows. Membership can be assigned manually
  or mapped automatically from an identity-provider group path.

## Agents

**Global agents** — admin-managed [specialist agents](agents.md) available to every user,
each with a persona, a "when to use" hint, an optional required chat mode and required tool
groups.

## Integrations

Govern every [integration](integrations.md) independently of what its manifest declares:
enable or disable it platform-wide, restrict **which scopes** may configure it (removing
*user* forbids personal entries), and **add required governance tags** on top of the
manifest's — admins can tighten, never loosen.

## Skill catalog

Curate the [skills marketplace](skills.md#the-marketplace): add Git repositories in the open
`SKILL.md` format (for example, `anthropics/skills`) as catalog sources that users browse and
install from with one click.

## Budgets & command policy

- **Budgets** — set monthly USD caps that cascade **user → org → global**; over the cap, new
  runs are declined.
- **Command policy** — admin rules that run **before** the built-in command catalog (first
  match wins, in every security mode) to **allow**, **require approval for**, or **deny**
  specific programs or command patterns.

!!! info "More for operators"
    Installing and running an instance is covered in the
    [Self-hosting guide](../self-hosting.md); the runtime guarantees are in
    [Architecture](../architecture/index.md) and
    [Frozen contracts](../architecture/frozen-contracts.md).
