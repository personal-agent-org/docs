# Chat controls & modes

Every chat — and, where it makes sense, every individual turn — can be tuned. The controls
live in the chat header's menu (the model / reasoning / security / mode / memory pickers)
and the composer bar (integrations and, in coding chats, the workspace device). Each control
is **independent** of the others, and each **persists per chat**: change a control here and
it sticks for *this* conversation, so you can keep a fast, autonomous scratch chat and a
careful, approval-gated work chat side by side without one bleeding into the other.

Most controls have a **Default** option that falls back to your preferences in
**Settings → Behavior**; set one explicitly here and it overrides the default for this chat
only.

!!! note
    Message actions (regenerate, edit, …) and the `/` slash-command palette are documented
    separately. This page covers the per-chat **modes and controls**.

## Where the controls live

Open the chat header's overflow menu to reach the per-chat pickers. The model button doubles
as the entry point for **reasoning effort** (folded into the same menu to save space). The
composer bar carries the **Integrations** picker — and, in a coding chat, the workspace
**device** picker.

| Control | Values | Persists per chat | Applies per |
| --- | --- | --- | --- |
| Model | a specific `provider:model`, or `auto` | yes | chat (carried each turn) |
| Reasoning effort | Default / Off / Low / Medium / High | per turn | turn |
| Mode (collaboration) | Default / Plan / Execute / Pair | yes | chat |
| Security mode | Default / Autonomous / Approve each / Judge | yes | chat |
| Memory access | Default / Full / None / Restricted | yes | chat |
| Data classification | Standard / Confidential | yes | chat |

## Model

Pick any model your administrator has enabled, grouped by provider, with a search box for
long lists. Or choose **`auto`** — the platform ranks the enabled models by capability
(frontier / reasoning / coding / fast / vision / cheap) and picks the best fit *within this
chat's governance limits* on each turn. `auto` is re-evaluated per turn, so as you add
integrations (which can raise the required capability) or change the data classification, it
re-picks a compatible model.

### Auto-ranking

When the model is `auto`, the platform ranks the enabled, governance-compatible models and
takes the best one. If a chat's [data classification](#data-classification) requires a higher
trust tier, only models from a provider that meets that tier are eligible — `auto` then picks
the best *compatible* one. The model picker itself applies the same pre-filter: a classified
chat only lists models whose provider tier meets the requirement (plus `auto`, which re-picks
compatibly).

### Provider-diverse fallback chains

Whatever model resolves — explicit or `auto` — runs behind a **fallback chain**. If the
primary model errors (rate-limit, 5xx, provider outage), the run quietly cascades to the next
governance-compatible model instead of failing the turn.

The chain prefers **provider diversity**: it fills its fallback slots from providers *other*
than the primary's first, then backfills with same-provider models only if slots remain. Top
capability scores often cluster on a single provider account, which would make a monoculture
chain — when that one account hits a rate-limit, the primary and all its fallbacks fail
together. A different (even weaker) provider finishing the run beats a wholesale crash. Every
pass is still best-first, so diversity never reaches past a genuinely better option on a
not-yet-used provider.

!!! warning
    Fallbacks are always **governance-compatible**: a fallback never routes
    [Confidential](#data-classification) data to a provider that isn't cleared for it. The
    chain is fail-closed.

## Reasoning effort

On models that support it, you can set how much the model "thinks" before answering. The
effort chips sit at the top of the model menu:

| Effort | Meaning |
| --- | --- |
| **Default** | Use the model's own default |
| **Off** | No extended reasoning |
| **Low** / **Medium** / **High** | Increasing amounts of thinking |

More effort means better results on hard problems, but slower answers and more tokens on easy
ones. When an explicit effort level is set, a small "thinking" badge appears on the model
button. Reasoning effort applies to the **turn** you send — it isn't stored on the chat the
way the other controls are, so it carries from your new-chat preferences and is the one
control you re-confirm as you go.

## Mode (collaboration style)

The collaboration mode shapes *how* the agent works with you — it's a behaviour mask layered
into the run, not a change to which tools are available.

| Mode | Behaviour |
| --- | --- |
| **Default** | Balanced — plans or acts as the task fits (no extra steering) |
| **Plan** | Thinks first and proposes a concrete approach before doing the work; avoids large or irreversible changes until the plan is clear |
| **Execute** | Biases strongly to action — carries the task end to end with minimal back-and-forth, asking only when genuinely blocked or before something destructive |
| **Pair** | Works like a pairing partner: small steps, thinks out loud briefly, and checks in at natural decision points |

!!! note
    This "mode" (collaboration style) is independent of both the **security mode** below and
    the **chat mode** (standard / coding / custom, covered on the
    [Coding](coding.md) page). Switching collaboration mode to **Default** clears the stored
    preset for the chat.

## Security mode

The security mode controls how *tool calls* are gated in this chat. It's the single source of
truth for tool gating — devices carry no policy of their own; their tools flow through the
same guard as everything else.

| Mode | Behaviour |
| --- | --- |
| **Default** | Use your default from **Settings → Behavior** (or the platform default) |
| **Autonomous** | Tools run without asking — fastest, most hands-off |
| **Approve each** | Every tool call waits for your explicit approval, inline in the chat |
| **Judge (LLM)** | A safety model classifies each call as allow / approve / deny before it runs |

In **Judge** mode the safety model can allow a call outright, deny it (the model gets a
refusal back), or escalate it to you for approval. In **Approve each**, the model step is
skipped and every call surfaces an approval card. Approval cards appear inline in the
conversation.

!!! warning
    A deterministic **command policy** runs *before* anything else and is a hard deny floor in
    **every** mode — even Autonomous. You cannot fat-finger-approve a catastrophic command
    (e.g. `rm -rf /`); a `deny`-verdict command is blocked outright. Your administrator can
    layer additional rules on top of the built-in policy (see [Security & privacy](security.md)).

### The Allow-all whitelist

On an approval card, **Always allow** records a standing allow-rule for that tool (and command
pattern) so the guard stops asking for matching calls — no re-nagging for the same
`git status` over and over. The rule is stored on the chat and is **session-scoped**: it
applies to *this* chat only and doesn't change any other conversation's security mode.

A few benign, side-effect-free chat-internal tools (such as renaming the chat or asking you a
question) are never gated, so they don't stack pointless approval cards.

## Memory access

This controls what the assistant may read from its long-term [memory](memory.md) in this chat.

| Access | Meaning |
| --- | --- |
| **Default** | Inherit your default from settings |
| **Full** | Full access to everything remembered |
| **None** | No access — a private chat that nothing is learned from |
| **Restricted** | Only the **areas** and **sources** you tick |

Restricted memory lets you pick **areas** — People & contacts, Work & projects, Places &
devices, Notes & topics — and **sources** — Preferences & rules, Things you said, Agent
inferences, Integration observations. An empty area or source is fail-closed: the agent sees
nothing there. The picker warns you when an axis is empty so it isn't accidental.

## Data classification

Choose the data sensitivity for the chat:

| Classification | Meaning |
| --- | --- |
| **Standard** | Any enabled model may be used |
| **Confidential** | Only models from a provider cleared for the higher trust tier |

Confidential is **fail-closed**: there is no path — primary model, `auto` pick, or fallback —
to a provider that isn't cleared for the data. Raising the classification also narrows the
model picker to compatible models only. Your organization may set a minimum you can make
*stricter* but never looser.

## How persistence works

The per-chat controls are saved on the chat the moment you change them (security, mode, and
memory access write immediately; the model is carried with each turn). When you reopen a chat,
its saved picks are restored. Starting from a **new-chat** draft, the picks you set up front
are folded into the created chat's configuration so they survive the second turn and reloads —
a draft set to *Autonomous*, for example, stays autonomous instead of reverting to your
default on the next message.

Because each control is independent and stored separately, mixing them is the point: a
*Confidential, Approve-each, Plan* chat for sensitive work, and a *Standard, Autonomous,
Execute* chat for quick scratch tasks, both live alongside each other with their own settings
intact.

## Slash commands

Type `/` at the start of the composer to open the command palette. Some commands run an
**action** immediately; others drop a ready-made **prompt** into the composer for you to send.

| Command | Does |
| --- | --- |
| `/new` | Start a new conversation. |
| `/rename <title>` | Rename the current chat. |
| `/btw <question>` | A quick research aside that is **not** added to the conversation (see [side questions](chat.md)). |
| `/goal <goal>` | The agent works toward the goal autonomously across multiple steps. |
| `/main <message?>` | Jump to the main chat — or, with a message, send it there without leaving. |
| `/summarize` | Summarize this conversation. |
| `/proofread` | Fix spelling and grammar. |

In a **coding** chat you also get workspace commands: `/terminal` (toggle the terminal panel),
`/review` (review current workspace changes), `/explain <path>`, `/fix <what>`, `/tests`, and
`/init`.

### Your own commands

Define reusable shortcuts under **Settings → Commands**: give the command a name, a template,
and an optional description. Use `$ARGUMENTS` in the template to inject whatever you type after
the command. Your custom commands appear in the same `/` palette alongside the built-ins.
