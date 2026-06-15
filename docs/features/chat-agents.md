# Chat & agents

Personal Agent pairs a **reading-first chat UI** with a durable agent runtime.
Every turn runs against any pydantic-ai provider, with per-chat control over the
model, the mode and the tool-call security posture.

## Per-chat pickers

- **Model, mode and security mode** are switchable per chat or per request,
  across every pydantic-ai provider.
- Pick a model explicitly, or choose **`auto`** — which ranks enabled models by
  capability tags (`frontier` / `coding` / `reasoning` / `fast` / `vision` /
  `cheap`) within the chat's governance limits.
- A **model-error classifier** decides what's retryable, and a **fallback chain**
  cascades to the next governance-compatible model on failure. The chain prefers
  **provider-diverse** fallbacks, so one rate-limited account can't fail the whole
  chain.
- A pinned **main chat** per user (never archived or deleted) is home for
  proactive briefings and triage.

## Conversation control

- **Regenerate / edit** any message, with **mid-run follow-ups** queued into the
  same turn.
- **Agent questions** (`ask_user`) pause a run for a structured choice, then
  resume the same turn.
- A **slash-command palette** (`/new`, `/summarize`, `/review`, `/explain`, …),
  **checkpoint / rewind** (conversation and, in coding mode, code via shadow-git),
  **best-of-N** parallel attempts, and lifecycle **hooks**.

## Chat modes

Each chat runs in a **mode** that shapes its tools, workspace UI and prompt.

- **Standard** is the default assistant.
- **Coding mode** turns a chat into a workspace over a connected device's jailed
  filesystem — see [Devices & coding](devices.md).

## Sub-agents

Built-in `explore` (read-only) and `delegate` (tool-inheriting) sub-agents, plus a
registry of **named custom agents** (user-created or admin-global personas with a
tool overlay) the main agent delegates to via `delegate_to_agent`.

- Fan them out in parallel or in the background; each gets its own run id, usage
  accounting and live transcript in the agents drawer.
- Spawns can pick the **worker's model by admin-defined tags**
  (`model_tags=["fast"]`) — governance always inherits from the chat, so a worker
  can never reach an uncleared provider.
- Workers run strictly autonomously: no user interaction, a deferring tool
  degrades to a refusal, and approval-gated calls deny with a reason.

The **`/goal` loop** pursues an objective across turns until `complete_goal`,
gated by a strict **verifier agent**.

## Programmatic tool calling & orchestration

Three ways to run code instead of many separate tool calls — only **stdout** comes
back, keeping intermediate results out of context:

- **`run_tools_script`** — a sandboxed **Pydantic Monty** Python script
  (deny-by-default: no imports/IO/network) that orchestrates the user's read-only
  tools with real logic, no device needed.
- **`run_agents_script`** — **code-driven multi-agent orchestration**: the model
  writes a deterministic Python *plan* (phases, loops, fan-out/fan-in,
  verification rounds) and the plan spawns **sub-agents as workers**
  (`explore`/`delegate`/named agents, with parallel `*_many` variants and per-spawn
  `model_tags`). Intermediate results live in script variables — outside the
  context window; failed workers degrade to `[failed]` values instead of killing
  the plan; the **monthly budget is the real spawn ceiling**.

!!! info "Usage accounting"
    Usage is recorded per `ModelResponse`, never per run, with idempotency keyed
    on `UNIQUE(run_id, request_index)`. Every message footer shows per-answer
    tokens/cost and the real send/answer time. See
    [Frozen contracts](../architecture/frozen-contracts.md).
