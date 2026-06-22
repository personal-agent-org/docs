# Agents & autonomy

Your assistant can spin up **sub-agents** to work on parts of a task in parallel, and can
pursue a **goal** across many turns on its own. None of it is a black box — you watch every
sub-agent work in real time and can open any of them.

## The agents drawer

Every chat has an **Agents** panel — docked on the right on desktop, a bottom-nav tab on
mobile. It lists every sub-agent the main agent has spawned in this chat, with:

- a **status** icon — running, completed or failed;
- the agent's **kind** (research, delegated, or a named custom agent) and the task it was
  given;
- its **model**, **token** counts (↑ in / ↓ out), **cost**, **tool count** and
  **duration**;
- a **BG** badge for background tasks.

A header strip summarizes how many agents are running and the running totals for the chat.
Click any agent to open its **run page**.

## Agent run pages

A sub-agent or background task has its **own page** — a chat-like transcript you can follow
live, at its own URL. You see the task it was handed and its full work (reasoning, tool
calls, result), with a status chip at the top. Because each run is its own page, you can
bookmark it, share the link, or leave it running and check back later without keeping the
parent chat open.

## Kinds of agent

- **Explore** — a read-only research worker (knowledge base, documents, optionally the
  web). Use it to gather and summarize without any risk of changing anything.
- **Generic / delegate** — a worker with the same tools as the chat, for offloading a
  self-contained chunk of work.
- **Named custom agents** — specialist personas you (or your admin) define, each with its
  own instructions and tool profile. The main agent delegates to them by name when a task
  matches.

You manage your own specialists under **Settings → Agent → Custom agents**: give each a
name, an emoji, a "when to use" hint, a persona, an optional required chat mode, and which
tool groups it needs (Web / Devices / Documents / Memory). Admins manage **global** agents
available to everyone (see [global agents](../administration/agents.md)).

!!! info "Workers stay in their lane"
    A worker runs strictly autonomously — it never asks you questions, and an
    approval-gated call is simply refused rather than waiting. It also inherits your chat's
    governance, so it can never reach a provider your chat isn't cleared for. Spawns can
    request a faster or cheaper model by capability tag, and your monthly
    [budget](settings.md#usage-budget) is the real ceiling on how many run at once.

    Sub-agents are also **strictly one level deep**: a worker can never spawn another worker.
    The hierarchy is always *your chat → its sub-agents*, so a delegation can't fan out into
    a runaway tree.

A sub-agent's tokens and cost are tracked on its own run, and roll up into the chat's
**session token total** — where the [context gauge](chat.md#the-context-gauge) breaks out
the share attributed to sub-agents, so a delegated worker's spend is never hidden.

## The goal loop

Type `/goal <objective>` (in any session chat) to hand the assistant an objective it should
pursue **across multiple turns on its own**. A banner appears above the composer showing
the active goal with a live spinner and a **Stop goal** button. The agent keeps working —
planning, acting, checking progress — until it decides the goal is complete (a strict
verifier has to agree) or you stop it. It's the right tool for "keep going until it's done"
work rather than a single question.

The goal **survives a page reload** — reopen the chat and the banner (with its live
iteration count) is right where you left it. Cancelling the active run **auto-pauses** the
goal rather than silently abandoning it, and the loop is bounded so a stuck step can't retry
forever.

## Background and durable runs

Long-running work doesn't tie up your chat. Sub-agents and triggered
[workflows](workflows.md) run in the background and report progress into the agents drawer
or, for workflows, by sending you a message. These **durable** runs survive restarts and
pick up where they left off — so you can close the tab and the work continues.
