# Contacts

Behind every message is a person. The **Contacts** page (in the sidebar) is a
**person-centric, cross-channel** view: one contact, all their addresses and handles, their
structured details, and their full conversation **history** in one place — no matter which
channel a message came in on.

Contacts are built on the single `contact` kind in [memory](memory.md). The same person you
email, message on Signal and chat with on Matrix is **one** record, not one per channel.
Most contacts are created **automatically** as messages arrive — see
[Inbox & contacts](inbox.md) for how messages flow in and get triaged.

## The contacts list

Open **Contacts** from the sidebar to see everyone you correspond with, most recently active
first. Each row shows:

- the person's **name** (with an avatar built from their initials),
- small **channel icons** for the channels they reach you on, and
- a **badge** with the number of still-open messages from them, if any.

The list is **read-only and automatic**: contacts appear here once they have at least one
contact method on file, which normally happens the first time a message from them is triaged.
Click a row to open the contact.

!!! note
    There is no "new contact" button. People are created from incoming messages. You *can*
    fully edit a contact once it exists — including adding contact methods for channels they
    haven't written from yet.

## The contact card

A contact's detail view is laid out as an address-book card:

- an **identity header** — avatar, name, the channels they use, the message count and when
  you last heard from them;
- **Details** — the structured fields below;
- **Notes** — free text you keep about the person;
- **Contact methods** — every channel handle linked to them;
- **What the assistant knows** — facts the agent has learned (read-only);
- **Addresses** — one or more postal addresses;
- **History** — the cross-channel conversation timeline.

Click **Edit** in the top bar to change the name, notes, details, addresses and contact
methods, then **Save** (or **Cancel** to discard). Editing also reveals the **Delete
contact** button at the bottom.

### Structured details

The **Details** card holds the contact's structured fields. In view mode only the fields you
have filled in are shown; in edit mode you get an input for each.

| Field | Notes |
| --- | --- |
| `Birthday` | Date picker; shown formatted to your locale. |
| `Company` | Free text. |
| `Role` | Free text (e.g. job title). |
| `Website` | Free text; rendered as a clickable link (`https://` is added if you omit it). |

!!! note
    **Phone** and **postal address** are *not* detail fields. A phone number is a **contact
    method** (a `phone` channel handle — see below), and addresses live in their own
    multi-value **Addresses** card.

### Notes

The **Notes** card is free-form text about the person — context, preferences, anything you
want to keep. Clearing the box and saving removes the note.

### Addresses

A contact can have **several postal addresses**. In edit mode each address is a text box you
can remove with the ✕ button, and **Add address** appends a new one. Empty entries are
dropped when you save.

## Contact methods (across channels)

The **Contact methods** card lists every channel handle linked to the person — their email
address, phone number, Signal/WhatsApp/Matrix/Zulip handle, and so on. Each row shows the
channel icon, the identifier, and the channel name.

These are what tie messages from different channels to the same person. The supported
channels are:

| Channel | Used for |
| --- | --- |
| `Email` | Email address |
| `Phone` | Phone number |
| `Signal` | Signal account |
| `WhatsApp` | WhatsApp account |
| `Matrix` | Matrix ID |
| `Zulip` | Zulip sender |

### Adding and removing methods

In edit mode:

- **Add** a method by picking a channel, typing the address or handle, and pressing **Add**
  (or Enter).
- **Remove** a method with the ✕ next to it.

Adding a contact method is how you tell the agent "this handle is also this person" —
linking, say, a newly-discovered phone number or Signal account to someone you already email.
From then on, messages arriving on that handle are attributed to this contact and join their
history.

!!! note
    Contacts are matched to incoming senders automatically by an exact handle match first,
    then by a shared email address across channels, and only as a last resort by an exact
    name (and never for generic names like "support" or "info"). Adding a method by hand is
    the reliable way to unify channels the automatic matching wouldn't connect on its own.

## Merging duplicate contacts

If the same person ends up as two separate contacts — for example because they wrote from two
addresses before you linked them — you can fold one into the other.

1. Open the contact you want to **keep**.
2. Click **Merge** in the top bar.
3. Pick the **other** contact to merge into this one.

The merge moves the other contact's **contact methods** and its entire **message history**
onto the contact you kept, and merges the underlying [memory](memory.md) records too — so all
the learned facts come along. The better human name and the more recent activity are
preserved. The merged-away contact disappears from the list.

!!! warning
    Merge is directional: the contact you open is the **target** that survives; the one you
    pick is folded into it and removed. There is no separate "unmerge" button, so pick the
    keeper first.

## Conversation history

The **History** card is the contact's **unified timeline across every channel**. Each entry
shows the channel icon, the subject or sender, the date, and the message's inbox **status**
(New, Reply pending, Answered, Seen), with the summary underneath when one is available.

This is the same triaged message data you see in the [Inbox](inbox.md) — here it's filtered
to a single person and merged across all their channels, so an email thread and a Signal
chat with the same person sit side by side in one list.

## Link to the person's memory

A contact **is** the person's [memory](memory.md) entity — there is no separate copy. The
contact you see and its `kind=contact` graph node are the **same record**, so anything the
agent learns about the person attaches directly to the contact.

Two things follow from this:

- **What the assistant knows** — when the agent has learned facts about the person beyond the
  address-book details (what they prefer, what they work on, who they work for, skills,
  memberships…), they appear in a read-only card on the contact. The structured details
  (company, role, website, birthday) are *not* repeated here; they live in the **Details**
  card instead.
- **View in memory** — the button in the top bar jumps straight to this person's entity on
  the Knowledge page, where you can see their full graph, history over time, and corrections.
  See [Memory & entities](memory.md) for what that page offers.

## Deleting a contact

In edit mode, **Delete contact** removes the contact (and confirms first). The person's
**messages are kept** — they simply lose the link to the deleted contact. The contact's
contact methods and learned facts are removed along with the record.
