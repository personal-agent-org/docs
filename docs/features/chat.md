# Chatting

Chat is the heart of Personal Agent. This page covers the conversation itself — the
reading pane, the composer, and what you can do with each message. The per-chat
**controls** (model, security, memory, modes) have their own page:
[Chat controls & modes](chat-controls.md).

## The reading pane

Your conversation reads top-to-bottom: your messages and the assistant's answers, each
turn rendered as clean Markdown — including **Mermaid diagrams**, drawn inline with a small
toolbar to view the source, download the SVG or maximize them. Older history loads as you
scroll up.

Under each answer you'll find a compact **footer** with (depending on your preferences):

- **Cost** - input ↑ and output ↓ tokens, a ⚡ cache indicator (read + write), this single
  answer's cost, and throughput in tokens per second, all under one toggle.
- **Model name** - which model produced it.
- **Timestamp** - when the message was sent.

You choose which of these appear under **Settings → Appearance → Message details** (the three
toggles are *Show timestamp*, *Show model name* and *Show cost*), so the chat can be as clean
or as instrumented as you like.

### Reasoning, tool calls and plans

An answer is more than text. Inline, in the order they happened, you may see:

- **Reasoning** — a collapsible block showing the model's thinking, on models that support
  it. It's collapsed by default so it never gets in the way.
- **Tool-call cards** — one per tool the agent used, with friendly names ("Read file",
  "Searched the web", "Drafted reply", …). Each card's icon is **colour-coded by status** —
  running, succeeded or failed — so you can scan a long turn at a glance. Expand a card to
  see its **arguments** and **result**. File edits render as **diffs**; a plan renders as a
  prominent plan card; a to-do list renders with live status icons. When the agent fires
  many tools in a row, they collapse into a single "Ran *N* actions" header you can expand.

### The context gauge

A thin bar at the top edge of the composer shows how full the model's **context window**
is, measured against the auto-compaction threshold. Click it for a breakdown - messages,
system prompt, skills, project rules, memory, history summary, system tools and MCP tools,
plus the free space left - with a detail list of memory files, MCP tools and the biggest
system tools. When a conversation gets long, older messages are automatically **compacted**
into a summary so the chat keeps going; the gauge turns **amber** past 80% and **red** once
it is full or compaction has happened, and the breakdown notes how many tokens were folded
into the summary. (Compaction is applied on both the inline and the durable run paths, and
an overflow self-heals even when no window is known.)

Alongside the live window, the breakdown shows the **session token total** - everything this
chat has spent across all its turns, with the running cost - split by **kind** (input,
output, cache write, cache read) and with the **share attributed to sub-agents** broken out
(count, their tokens, their cost and the average cost per agent), so you can see how much of
the total a delegated worker accounted for.

## The composer

Type your message in the box at the bottom and press **Enter** to send (you can switch
this to *Cmd/Ctrl+Enter* under **Settings → Appearance → Composer**, so plain Enter inserts a
newline; *Shift+Enter* always inserts a newline). While the agent is working, the send button
becomes a **stop** button, and a new
message you type is **queued** — sent automatically once the current answer finishes, and
shown muted in the thread until then.

From the composer you can:

- **Attach** images or documents (PDF, text, Markdown, CSV). Vision models read images
  directly, so you can paste a screenshot and ask about it.
- **Speak** — tap the microphone to dictate; your speech is transcribed into the box. See
  [Voice](#voice) below.
- **Run a slash command** — type `/` to open the command palette. See
  [slash commands](chat-controls.md#slash-commands).
- Open the per-chat **controls** — model, security, mode, memory and more, covered in
  [Chat controls & modes](chat-controls.md).

### Suggested follow-ups

After an answer, the assistant may offer a few **follow-up suggestions** as clickable
chips. Tap one to send it, or just keep typing — they disappear as soon as you reply.

## What you can do with a message

Hover over any message (or tap it on mobile) for its actions:

| Action | What it does |
| --- | --- |
| **Copy** | Copy the answer's text to the clipboard |
| **Regenerate** | Re-run the last answer — e.g. after switching model — discarding the old one |
| **Edit** | Edit one of your messages and re-run the conversation from there |
| **Rewind to here** | Delete this message and everything after it (in coding chats, the workspace is rewound too) |
| **Branch from here** | Fork a new, independent chat from this point, leaving the original untouched |
| **Revert** | Undo the file changes a coding answer made, and trim history back to before it |

!!! tip "Rewind vs. branch vs. revert"
    **Rewind** rewrites the current chat and is destructive; **Branch** keeps the original
    intact and continues a copy; **Revert** is the coding-specific "undo this answer's
    edits". Each asks for confirmation before doing anything irreversible.

You can also **export** the whole conversation to Markdown from the chat's header menu.

## When the agent needs you

Some turns pause for your input — these appear as cards right in the conversation, and
clear themselves once you respond:

- **A question** — the agent asks you to choose between options (single- or multi-select,
  sometimes with a recommended choice and a free-text field). Answer it and the same turn
  continues from where it paused.
- **An approval** — when a chat requires approval for tool calls, each call waits for
  **Approve**, **Reject**, or **Always allow** (which whitelists that command on that
  device so you're not asked again). See
  [security modes](chat-controls.md#security-mode).
- **A draft reply** — for incoming messages, the agent proposes a reply you can edit and
  then **Approve & send**. More in [Inbox & contacts](inbox.md).

## When something goes wrong

Runs are resilient. A transient provider hiccup (rate-limit, a 5xx, a dropped connection) is
**retried automatically**, and the [fallback chain](chat-controls.md#provider-diverse-fallback-chains)
can cascade to another model rather than failing the turn. If an answer does end in an error,
any text the model had **already streamed is kept** — it isn't thrown away — and an explicit
**Retry** button appears so you can re-run the turn without retyping. Work that was already
done can resume rather than starting from scratch.

## Sharing a chat

From the chat header menu, **Share** creates a **read-only, password-protected public
link** to the conversation. Set an **expiry** (never, or 7, 30 or 90 days) and **revoke**
it anytime. Whoever has the link **and** the password can read the chat at a public `/s/…`
address; the shared view is read-only and **updates live** as the chat continues. Send the
password separately — and note that the **whole transcript, including tool calls, becomes
readable**, so don't share a chat that contains secrets like API keys or passwords.

## Voice

If your admin has configured speech models, chat becomes hands-free:

- **Speak** — the microphone button records you and transcribes speech to text.
- **Read aloud** — play any answer as speech.
- **Read responses aloud** — toggle auto-read so every answer is spoken as it streams in.

## The main chat

Your **main chat** is special: it's pinned at the top of the sidebar, can never be archived
or deleted, and is where **proactive** messages land — due-date nudges, briefings, and
anything the assistant reaches out about on its own. When it has something for you, the
sidebar shows a gentle "reached out" badge. The main chat always runs in standard mode.

## Sessions and folders

Every other conversation is a **session**. The sidebar shows recents; the full, searchable
list lives on the **Sessions** page. You can rename, archive or delete any session.

**Folders** group related chats and carry **folder-specific instructions** that apply to
every chat inside them (for example, *"Always answer with sources and in German."*). A
folder can be **private** or **shared with your group**; deleting a folder keeps its chats,
which are simply detached.
