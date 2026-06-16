# Inbox & contacts

Connect your messaging channels and Personal Agent becomes a single place to stay on top of
everything coming in — triaged, summarized, and with replies drafted for you to approve.

## The Inbox

The **Inbox** (in the sidebar) gathers messages from every channel you've connected —
**email, Signal, WhatsApp, Matrix, Zulip**. As each message arrives, the agent **triages**
it: works out what it is, summarizes it, and — when a reply is wanted — drafts one. The
sidebar badge shows how many items are still open.

### Working the inbox

- **Filter** by status — **Open**, **Answered**, **Seen**, **All**, **Starred**,
  **Snoozed** — and by **channel**, plus a search box across everything.
- Each message carries a **status**: **New**, **Needs reply**, **Answered** or **Seen**.
- **Star** anything to come back to it, or **Snooze** it to reappear later — in 3 hours,
  this evening, tomorrow morning or next week.
- Mark items **Seen** or **Done**, or select several at once for bulk actions.

### Drafts you approve

This is the heart of it: you don't write routine replies, you **approve** them. For a
message that needs an answer, the agent shows a **draft reply** with the recipient and the
proposed text. You can:

- **Approve & send** as-is,
- **Edit** the text first, or
- **Reject** it.

You can also ask for a **suggestion** on demand (it can cover several open messages at
once), **forward** a message, or **reply to all**. Nothing is ever sent without your
go-ahead.

### Keeping the noise out

Two profile settings shape what reaches you (under **Settings → Profile**):

- **Priorities** — what matters to you (investors, key customers, family…), which helps the
  agent judge how important a message is.
- **Inbox rules** and exact **drop patterns** — what should **never** appear (newsletters,
  automated notifications…). Drop patterns are checked *before* the AI triage runs, so
  matching messages are dismissed cheaply and silently, while the free-text rules guide the
  triage itself.

You can turn triage on or off per account with the **Inbox triage** toggle on the
integration (**Settings → Integrations**) — messages still sync, they just won't be
triaged.

## Contacts

Behind every message is a person. The **Contacts** page (in the sidebar) is a
**person-centric, cross-channel** view: one contact, all their addresses and handles
(email, Signal, …), and their full conversation **history** in one place. It's built on the
single `contact` kind in [memory](memory.md), so the same person you email, message and
meet is one record — not one per channel.

Contacts are created **automatically** from incoming messages — you rarely add one by hand.
For each contact you can:

- edit their **name** and **notes**, and structured **details** (birthday, phone, company,
  role, website, address);
- add or remove **contact methods** (channel + identifier) and **addresses**;
- **merge** two contacts that are really the same person;
- **view in memory** to jump to everything the assistant [knows](memory.md) about them.

Deleting a contact keeps the underlying messages.
