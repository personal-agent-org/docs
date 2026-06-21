# Inbox

The **Inbox** brings messages from every channel you've connected into one place. As each
message arrives, the agent **triages** it — works out what it is, who it's from, summarizes
it in a sentence, and (when an answer is wanted) drafts a reply for you to approve. Nothing
is ever sent without your go-ahead.

!!! note "Looking for contacts?"
    Managing the people behind your messages now lives on its own page — see
    [Contacts](contacts.md).

## Channels

The Inbox is fed by any messaging integration you've connected. Out of the box that covers:

| Channel | Notes |
| --- | --- |
| **Email** | IMAP/SMTP — threads are grouped by the `References` header |
| **Zulip** | A stream-topic, or a 1:1 / group direct message |
| **Matrix** | A room |
| **Signal** | Linked device |
| **WhatsApp** | Linked phone |

A message channel participates automatically — any integration that declares a message-type
entity feeds the Inbox and triage, with no per-channel configuration here. Connect or change
channels anytime under **Settings → Integrations**.

A conversation is a *thread or room*, not a single message: it shows the full exchange —
every incoming message with its sender, your own messages, the agent's sent replies, and any
pending draft.

## Statuses

Each conversation carries a lifecycle **status** that survives re-syncing (it lives in the
inbox, independent of the underlying message):

| Status | Meaning |
| --- | --- |
| **New** | Important, awaiting your attention — no draft staged yet |
| **Reply pending** | A draft reply is staged, awaiting your approval |
| **Answered** | Replied (a draft was sent) or marked **Done** by you |
| **Seen** | Unimportant — tidied away, hidden from the open list by default |

The flow:

```text
New ──(draft staged)──▶ Reply pending ──(approve & send / mark Done)──▶ Answered
New ──(unimportant)───▶ Seen
```

Messages that match a [drop rule](#keeping-the-noise-out) never get a status at all — they
are filed away and never shown.

## Working the inbox

The list on the left is your triage cockpit. You can:

- **Search** across summaries, snippets, subjects and senders.
- **Filter by status** — **All**, **Open**, **Answered** — plus separate toggles for
  **Starred** and **Snoozed**.
- **Filter by channel** — email, Zulip, Matrix, Signal, WhatsApp, or all.

Each row shows the channel icon, the sender, the agent's one-line summary, a status badge,
and a star if you've starred it. A blue dot marks an unread conversation.

### Starring

**Star** any conversation to flag it as a priority (the star button in the thread header, or
the bulk action). Starred items get their own filter so you can come back to them.

### Snoozing

**Snooze** a conversation to drop it out of the open list until later — it resurfaces on its
own once the time passes (no background job; it's computed when you next load the inbox).
The presets are:

| Option | Resurfaces |
| --- | --- |
| **In 3 hours** | 3 hours from now |
| **This evening** | 18:00 today (or tomorrow if it's already past) |
| **Tomorrow morning** | 09:00 the next day |
| **Next week** | 09:00 in seven days |

**Unsnooze** brings it straight back.

### Resolving without replying

For a message that needs no answer you have two tidy-up actions in the thread header:

- **Done** — resolve the conversation (you've read it, nothing to send) → **Answered**.
- **Mark seen** — file it away as unimportant → **Seen**, hidden from the open list.

### Forwarding

**Forward** sends the conversation's message on to another recipient (address or handle)
via the same account, with an optional note. This doesn't change the conversation itself.

### Bulk actions

Switch on **Select** mode (the checklist button) to pick several conversations at once, then
apply one action to all of them: **Done**, **Mark seen**, **Star**, or **Snooze**.

## Replying

When a conversation can be replied to, a composer appears at the bottom — styled like the
chat composer. The agent's triage **draft** is shown as the placeholder:

- Press **Enter** (or the send button) on an empty field to send the suggested draft as-is.
- Press **Tab** to pull the suggestion into the field and edit it first.
- Type your own text to replace it entirely.

Your own typed reply is sent **immediately** — it's a human action, with no approval gate
(unlike the agent's drafts, below). For email you can toggle **Reply all** to CC the
original recipients, and you can **attach files**.

!!! note "Drafts survive a page reload"
    A reply you've started typing is saved locally per conversation, so switching
    conversations or reloading the page won't lose it. It's cleared once the message is sent.

### On-demand suggestions

The ✨ button asks the agent for a fresh suggestion covering the **whole** unanswered batch
(every incoming message since you last caught up), dropped into the composer for you to
review and edit. Nothing is persisted and nothing is sent — it's just a starting point.

**Dismiss** (the ✕ in the composer bar) marks the unanswered batch as read without
replying, which stops the auto-suggestion for it; the conversation stays open. A newer
message later will start a fresh suggestion.

## Draft replies (human-in-the-loop)

This is the heart of the assistant: for routine replies you **approve** rather than write.
When triage decides a message warrants an answer, the agent stages a **draft** — it never
sends on its own. A draft card shows the recipient, an optional subject, a short summary,
and the proposed text. You can:

| Action | What it does |
| --- | --- |
| **Approve & send** | Sends the draft as-is through the linked account, then marks the source message **Answered** |
| **Edit** | Change the body, subject or recipient before sending |
| **Discard** (reject) | Throws the draft away; the source message goes back to **New** |

A draft is in one of these states:

| State | Meaning |
| --- | --- |
| `pending` | Staged, awaiting your approval |
| `sent` | Approved and delivered |
| `rejected` | You discarded it |
| `failed` | Sending failed — the error is shown and the draft stays recoverable |

!!! warning "Only you can send"
    The agent has no send tool. Approving a draft is the **only** path that delivers a
    proposed reply, and it sends through the same account the message arrived on. If that
    account isn't linked, or no longer supports sending, approval fails with a clear error
    instead of sending silently.

## Keeping the noise out

Three settings shape what reaches you, under **Settings → Profile**:

| Setting | Effect |
| --- | --- |
| **Priorities** | What matters to you (investors, board, key customers, family…). Free text used by triage to judge how important a message is. |
| **Inbox rules** | Free-text guidance on what should *not* appear (e.g. "drop advertising, newsletters and automated notifications"). The agent applies your judgement during triage. |
| **Drop patterns (exact)** | One pattern per line, matched **before** the AI runs — matching messages are discarded cheaply, without a triage run. |

### Drop patterns

Drop patterns are deterministic and run *before* triage, so obvious junk never costs a
model call and never appears in the inbox. Each non-empty line is a **case-insensitive
substring** match. An optional field prefix scopes it; with no prefix it matches against the
sender, subject and body combined:

```text
from:newsletter@
subject:[SPAM]
body:unsubscribe
weekly digest
```

| Prefix | Matches against |
| --- | --- |
| `from:` (or `sender:`) | The sender address/name |
| `subject:` | The subject |
| `body:` | The message body |
| *(none)* | Sender + subject + body combined |

A dropped message is filed away so a later re-sync never re-triages it. Patterns are
deliberately plain substrings (no regex) — nuanced judgement stays with the **Inbox rules**
that guide the AI.

### Per-account triage toggle

Each connected messaging account has an **Inbox triage** toggle on the integration (under
**Settings → Integrations**). Turn it off and messages from that account **still sync** —
they just aren't triaged into the inbox.

## How triage works

Triage is a built-in part of the assistant, not something you set up. For each new message
the agent runs through a fixed procedure: check it against your drop rules; attribute the
sender to a [contact](contacts.md) (linking the same person across channels); read the
prior thread if it's part of an exchange; judge importance against your priorities and
summarize it; draft a reply if one makes sense; and record a commitment if the message
carries a deadline or a reply you owe.

!!! note
    Triaged messages are reflected in the inbox in near real time. A 15-minute background
    sync is the backstop, so nothing is missed even if a live update is delayed.
