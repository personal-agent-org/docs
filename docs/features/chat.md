# Chatting

Chat is the heart of Personal Agent. This page covers the conversation itself — the
reading pane, the composer, and what you can do with each message. The per-chat
**controls** (model, security, memory, modes) have their own page:
[Chat controls & modes](chat-controls.md).

## The reading pane

Your conversation reads top-to-bottom: your messages and the assistant's answers,
each turn rendered as clean Markdown — including **Mermaid diagrams**, drawn inline with
a small toolbar to view the source, download the SVG or maximize them. Older history
loads as you scroll up.

Under each answer you'll find a compact **footer** with (depending on your
preferences):

- **Tokens** — input ↑ and output ↓, plus a ⚡ cache indicator (hits and writes).
- **Cost** — what this single answer cost.
- **Model** — which model produced it.
- **Timing** — send/answer time and throughput (tokens/sec).

You choose which of these show under **Settings → Appearance → Message details**.

### Reasoning, tool calls and plans

An answer is more than text. Inline, in the order they happened, you may see:

- **Reasoning** (*Gedankengang*) — a collapsible block showing the model's thinking,
  on models that support it.
- **Tool-call cards** — each tool the agent used, with friendly names ("Read file",
  "Searched the web", "Drafted reply", …). Expand one to see its **arguments** and
  **result**. File edits render as diffs; a `create_plan` shows a checklist;
  `todowrite` shows a live task list. Long runs collapse bursts into a single
  "Ran *N* actions" header you can expand.

### The context gauge

A thin bar at the top edge of the composer shows how full the model's **context
window** is. Click it for a breakdown — system prompt, skills, project rules, memory,
history summary and tools. When a conversation gets long, older messages are
automatically **compacted** into a summary so the chat keeps going; the gauge turns
amber as you approach that threshold and notes when compaction has happened.

## The composer

Type your message in the box at the bottom and press **Enter** to send (you can flip
this to *Cmd/Ctrl+Enter* under **Settings → Appearance → Input**). While the agent is
working, the send button becomes a **stop** button, and a new message you type is
**queued** — sent automatically once the current answer finishes.

From the composer you can:

- **Attach** (*Anhängen*) images or documents (PDF, text, Markdown, CSV) — vision
  models read images directly.
- **Speak** — tap the microphone to dictate; your speech is transcribed into the box.
  See [Voice](#voice) below.
- **Run a slash command** — type `/` to open the command palette. See
  [slash commands](chat-controls.md#slash-commands).
- Open the per-chat **controls** — model, security, mode, memory and more, covered in
  [Chat controls & modes](chat-controls.md).

### Suggested follow-ups

After an answer, the assistant may offer a few **follow-up suggestions** as clickable
chips. Tap one to send it, or just keep typing — they disappear as soon as you reply.

## What you can do with a message

Hover over any message (or tap it on mobile) for its actions:

| Action | German | What it does |
| --- | --- | --- |
| **Copy** | *Kopieren* | Copy the answer's text to the clipboard |
| **Regenerate** | *Neu generieren* | Re-run the last answer (e.g. after switching model) |
| **Edit** | *Bearbeiten* | Edit one of your messages and re-run from there |
| **Rewind to here** | *Hierhin zurückspulen* | Delete this message and everything after it (in coding chats, the workspace is rewound too) |
| **Branch from here** | *Ab hier abzweigen* | Fork a new, independent chat from this point |
| **Revert** | *Rückgängig* | Undo the file changes a coding answer made, and trim history back to before it |

!!! tip "Rewind vs. branch vs. revert"
    **Rewind** rewrites the current chat (and is destructive); **Branch** keeps the
    original intact and continues a copy; **Revert** is the coding-specific "undo this
    answer's edits". Each asks for confirmation before doing anything irreversible.

You can also **export** (*Exportieren*) the whole conversation to Markdown from the
chat's header menu.

## When the agent needs you

Some turns pause for your input — these appear as cards right in the conversation:

- **A question** (*Rückfrage*) — the agent asks you to choose between options (single-
  or multi-select, sometimes with a recommended choice and a free-text field). Answer
  it and the same turn continues.
- **An approval** (*Freigabe erforderlich*) — when a chat requires approval for tool
  calls, each call waits for **Approve**, **Reject**, or **Always allow** (which
  whitelists that command on that device). See [security modes](chat-controls.md#security-mode).
- **A draft reply** (*Antwort-Entwurf*) — for incoming messages, the agent proposes a
  reply you can edit and then **Approve & send**. More in [Inbox & contacts](inbox.md).

## Voice

If your admin has configured speech models, chat becomes hands-free:

- **Speak** — the microphone button records you and transcribes speech to text
  (*Spracheingabe*).
- **Read aloud** (*Vorlesen*) — play any answer as speech.
- **Read responses aloud** (*Antworten vorlesen*) — toggle auto-read so every answer is
  spoken as it streams in.

## Sharing a chat

From the chat header menu, **Share** (*Teilen*) creates a **read-only, password-protected
public link** to the conversation. Set an **expiry** (never, or a number of days), and
**revoke** it anytime. Whoever has the link **and** the password can read the chat at
`/s/…`; the shared view is read-only and **updates live**. Send the password separately —
and note the **whole transcript, including tool calls, becomes readable**, so don't share
a chat that contains secrets like API keys or passwords.

## The main chat

Your **main chat** (*Haupt-Chat*) is special: it's pinned at the top of the sidebar,
can never be archived or deleted, and is where **proactive** messages land — due-date
nudges, briefings, and anything the assistant reaches out about on its own. When it
has something for you, the sidebar shows a gentle "*{agent} reached out*" badge. The
main chat always runs in standard mode.

## Sessions & folders

Every other conversation is a **session**. The sidebar shows recents; the full list
lives on the **Sessions** (*Sitzungen*) page, which is searchable. You can rename,
archive or delete any session.

**Folders** (*Ordner*) group related chats and carry **folder-specific instructions**
that apply to every chat inside them (e.g. *"Always answer with sources and in
German."*). A folder can be **private** or **shared with your group**; deleting a
folder keeps its chats (they're just detached).
