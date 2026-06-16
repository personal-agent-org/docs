# Chat controls & modes

Every chat — and every individual request — can be tuned. The controls live in the
chat's header menu and the composer bar. Most have a **Default** option that uses your
preferences from **Settings → Behavior**; change one here and it sticks for this chat.

## The per-chat pickers

### Model

Pick any model your admin has enabled, grouped by provider, with a search box for long
lists. Or choose **`auto`** — the assistant ranks the enabled models by capability
(frontier / coding / reasoning / fast / vision / cheap) and picks the best fit within
this chat's governance limits. If a model errors or is rate-limited, a **fallback
chain** quietly cascades to the next compatible model (preferring a different provider),
so a single bad account can't sink the turn.

### Reasoning

On models that support it, toggle extended **reasoning** (*Reasoning*) on or off and set
the effort: **Off**, **Low**, **Medium** or **High**. More effort means more "thinking"
before the answer (and more tokens).

### Mode (collaboration style)

How much the agent plans vs. just acts:

| Mode | German | Behaviour |
| --- | --- | --- |
| **Default** | *Standard* | Balanced — plans or acts as the task needs |
| **Plan** | *Planen* | Plans and confirms the approach with you before acting |
| **Execute** | *Ausführen* | Acts directly, minimal back-and-forth |
| **Pair** | *Pair* | Small steps, thinks aloud, checks in often |

!!! note
    This "mode" (collaboration style) is separate from the **chat mode**
    (standard / coding / custom) covered [below](#chat-modes).

### Security mode

Controls how tool calls are gated in this chat:

| Mode | German | Behaviour |
| --- | --- | --- |
| **Autonomous** | *Autonom* | Tools run without asking |
| **Approve each** | *Freigabe nötig* | Every tool call waits for your approval |
| **Judge (LLM)** | *Prüfung (LLM)* | A safety model reviews each call before it runs |

Approvals appear inline in the chat; **Always allow** whitelists a specific command on
a specific device so you're not asked again. Your default is set under
**Settings → Profile**.

### Memory access

What the assistant may read from its long-term [memory](memory.md) in this chat:

| Access | German | Meaning |
| --- | --- | --- |
| **Full** | *Voll* | Full access to everything remembered |
| **None** | *Keiner* | No access — a private chat that isn't learned from |
| **Restricted** | *Eingeschränkt* | Only the **areas** and **sources** you tick |

Restricted memory lets you pick **areas** (People & contacts, Work & projects, Places
& devices, Notes & topics) and **sources** (Preferences & rules, Things you said, Agent
inferences, Integration observations). An empty area or source means the agent sees
nothing there.

### Data classification

Choose **Standard** (any configured model may be used) or **Confidential**
(*Vertraulich* — only local models, so the data stays on-prem). Confidential is
fail-closed: there is no path to a provider that isn't cleared for it. Your org may set
a minimum that you can only make *stricter*.

### Tools, integrations & devices

The composer's **Integrations** (*Integrationen*) picker controls which tools the agent
may use this turn — built-in tools, web tools, your configured
[integrations](integrations.md), and any online [devices](devices.md). A separate
preview ("Available in this chat") lists exactly what's active, including anything
**hidden by governance**.

## Chat modes

Each chat runs in a **chat mode** that shapes its tools, workspace and side panel.

- **Standard** (*Standard*) — the normal assistant.
- **Coding** (*Coding*) — turns the chat into a workspace over a device's files, with an
  editor and terminal. See [Coding & Cloud Tasks](coding.md).
- **Custom modes** — your own modes, each with a name, an icon and an attached
  **dashboard** whose cards show in the chat's side panel. Create, edit and delete them
  from the mode switcher in the chat header.

When you start a fresh chat, a card grid lets you pick the mode up front. (The main
chat is always standard.)

## Slash commands

Type `/` at the start of the composer to open the **command palette**. Commands are
either *actions* (they do something) or *prompts* (they send templated text). The
palette is mode-aware — coding commands only show in coding chats.

| Command | What it does |
| --- | --- |
| `/new` | Start a new chat |
| `/rename <title>` | Rename the current chat |
| `/btw <question>` | A quick research **side question** — answered without entering the history |
| `/goal <objective>` | Pursue a goal autonomously across turns (see [Agents](agents.md)) |
| `/main [message]` | Jump to the main chat — or, with a message, send it there without leaving |
| `/summarize` | Summarize this conversation |
| `/proofread <text>` | Fix spelling and grammar |

In **coding** chats you also get:

| Command | What it does |
| --- | --- |
| `/terminal` | Show/hide the terminal panel |
| `/review` | Review the current workspace changes (`git diff`) |
| `/explain <file>` | Read and explain a file |
| `/fix <problem>` | Find and fix something in the workspace |
| `/tests` | Run the tests and report back |
| `/init` | Generate an `AGENTS.md` for the repo |

### Your own commands

Add **custom commands** under **Settings → Commands**. Give it a name, a template, and
optionally a description and a mode. Use `$ARGUMENTS` or `{args}` in the template for
the text after the command — e.g. *"Read `$ARGUMENTS` and explain it."* Then type
`/yourcommand …` in any chat.
