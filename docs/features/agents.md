# Agents & autonomy

Your assistant can spin up **sub-agents** to work on parts of a task in parallel, and
can pursue a **goal** across many turns on its own. You watch all of it happen live.

## The agents drawer

Every chat has an **Agents** panel (*Agenten & Hintergrund-Tasks*) — docked on the
right on desktop, a bottom-nav tab on mobile. It lists every sub-agent the main agent
has spawned in this chat, with:

- a **status** icon — running, completed or failed;
- the agent's **kind** (research / delegated / a named custom agent) and the task it
  was given;
- its **model**, **token** counts (↑ in / ↓ out), **cost**, **tool count** and
  **duration**;
- a **BG** badge for background tasks.

A header strip summarizes how many agents are running and the running totals for the
chat. Click any agent to open its **run page**.

## Agent run pages

A sub-agent or background task has its **own page** — a chat-like transcript you can
follow live, at its own URL. You see the task it was handed and its full work
(reasoning, tool calls, result), with a status chip at the top. Because each run is its
own page, you can bookmark it, share the link, or leave it running in the background and
check back later.

## Kinds of agent

- **Explore** (*Recherche-Agent*) — a read-only research worker (knowledge base,
  documents, optionally the web).
- **Generic / delegate** (*Delegierter Agent*) — a worker with the same tools as the
  chat, for offloading a chunk of work.
- **Named custom agents** — specialist personas you (or your admin) define, each with
  its own instructions and tool profile. The main agent delegates to them by name.

You manage your own specialists under **Settings → Agent → Custom agents**
(*Eigene Agenten*): give each a name, an emoji, a "when to use" hint, a persona, an
optional required chat mode, and which tool groups it needs (Web / Devices / Documents /
Memory). Admins manage **global** agents available to everyone.

!!! info "Workers stay in their lane"
    A worker runs autonomously — no questions back to you — and inherits your chat's
    governance, so it can never reach a provider your chat isn't cleared for. Spawns can
    request a faster or cheaper model by tag; your monthly [budget](settings.md#usage-budget)
    is the real ceiling on how many run.

## The goal loop

Type `/goal <objective>` (in any session chat) to hand the assistant an objective it
should pursue **across multiple turns on its own**. A banner appears above the composer
showing the active goal with a live spinner and a **Stop goal** (*Ziel stoppen*) button.
The agent keeps working — planning, acting, checking progress — until it decides the
goal is complete (a strict verifier has to agree) or you stop it.

## Background & durable runs

Long-running work doesn't tie up your chat. Sub-agents and triggered
[workflows](workflows.md) run in the background and report progress into the agents
drawer or, for workflows, by sending you a message. These **durable** runs survive
restarts and pick up where they left off — you don't have to keep the tab open.
