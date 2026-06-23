# Agents & autonomy

Your assistant can spin up **sub-agents** to work on parts of a task in parallel, and can
pursue a **goal** across many turns on its own. None of it is a black box - you watch every
sub-agent work in real time and can open any of them.

## The agents drawer

Every chat has an **Agents & background tasks** panel - docked on the right on desktop, a
bottom-nav tab on mobile. It lists every sub-agent the main agent has spawned in this chat,
with:

- a **status** icon - running, done or failed;
- the agent's **kind** (Research agent, Delegated agent, or a named custom agent) and the
  task it was given;
- its **token** counts (↑ in / ↓ out), **cost**, **tool count** and **duration**;
- a **BG** badge for background tasks.

A header strip summarizes how many agents are running and the running totals for the chat.
Click any agent to open its **run page**.

## Agent run pages

A sub-agent or background task has its **own page** - a chat-like transcript you can follow
live, at its own URL (`/chats/<chat>/agent/<run>`). You see the task it was handed and its
full work (reasoning, tool calls, result), with a status chip at the top. Because each run is
its own page, you can bookmark it or leave it running and check back later without keeping the
parent chat open.

## Kinds of agent

- **Explore** - a read-only research worker (knowledge base, documents, your workspace
  files read-only, and optionally the web). Use it to gather and summarize without any risk
  of changing anything.
- **Generic** - a worker with the same tools as the chat, for offloading a self-contained
  chunk of work; it can act (edit files, run commands, call tools).
- **Named custom agents** - specialist personas you (or your admin) define, each with its
  own instructions and tool profile. The main agent delegates to them by name when a task
  matches.

The main agent reaches all of these through a single `delegate_to(agent, tasks)` tool, where
`tasks` is a list it can fan out in parallel. It also has a `best_of_n` tool that makes
several diverse read-only attempts at one hard question and a judge picks the single best.

You manage your own specialists under **Settings → Agents → Your agents**: give each a name,
a "when to use" hint, a persona, an optional required surface, an optional default model, and
which capability groups it needs (Web / Devices / Documents / Memory / Coding / Workspace).
Admins manage **global** agents available to everyone (see
[global agents](../administration/agents.md)).

!!! info "Workers stay in their lane"
    A worker runs strictly autonomously - it never asks you questions, and an approval-gated
    call is simply refused rather than waiting. It also inherits your chat's governance, so
    it can never reach a provider your chat isn't cleared for, and a worker's tools and
    document access are gated by the model that actually runs it. Spawns can request a model
    by capability tag (e.g. fast, reasoning, coding); an uncleared provider is never picked,
    and an unmatched tag falls back to the chat's model. Each `delegate_to` call fans out to
    at most eight parallel tasks, and your monthly [budget](settings.md#usage-budget) is the
    real ceiling on total spend.

    Sub-agents are also **strictly one level deep**: a worker can never spawn another worker.
    The hierarchy is always *your chat → its sub-agents*, so a delegation can't fan out into
    a runaway tree.

A sub-agent's tokens and cost are tracked on its own run, and roll up into the chat's
**session token total** - where the [context gauge](chat.md#the-context-gauge) breaks out
the share attributed to sub-agents, so a delegated worker's spend is never hidden.

## The goal loop

Type `/goal <objective>` (in any session chat, not the main chat) to hand the assistant an
objective it should pursue **across multiple turns on its own**. A banner appears above the
composer showing the active goal with a live spinner and **pause**, **resume**, **edit** and
**stop** controls. The agent keeps working - planning, acting, checking progress - until it
decides the goal is complete (a strict, independent verifier has to agree) or you stop it.
It's the right tool for "keep going until it's done" work rather than a single question.

The loop runs server-side as a durable workflow, so it keeps going with no open window
needed. The goal **survives a page reload** - reopen the chat and the banner is right where
you left it. Cancelling the active run **auto-pauses** the goal rather than silently
abandoning it (resume picks it back up with a fresh budget), and the loop is bounded by an
iteration cap so a stuck step can't retry forever.

## Background and durable runs

Long-running work doesn't tie up your chat. A `delegate_to` call with `background=true` runs
the sub-agents detached: the assistant answers you right away, and the findings are delivered
automatically as a follow-up turn when they finish - you don't wait or poll. Triggered
[workflows](workflows.md) run in the background too and report by sending you a message. The
goal loop and triggered workflows are **durable** runs that survive restarts and pick up
where they left off, so you can close the tab and the work continues.
