# Notes & Files

Two simple, everyday places to keep things: free-form **Notes** and a searchable **Files**
library. Both are also reachable by the assistant — it can write a note for you, or search
your documents to answer a question.

## Notes

The **Notes** page (in the sidebar) is a two-pane notebook: your notes on the left, the
editor on the right.

- **New** creates a note; give it a title and a body. The body supports **Markdown** —
  including **Mermaid diagrams** — with a live **Preview** tab.
- Notes **save automatically** as you type ("Saving…" → "Saved"), so you never lose work.
- **Pin** keeps important notes at the top of the list.
- **Search** filters by title and content.

Your assistant can create and update notes too — ask it to "jot this down" or "draft a note
summarizing this thread", and it appears here. Deleting a note is permanent.

## Files

The **Files** page (in the sidebar) is "all your files in one place" — both documents you
upload and files on your [connected devices](devices.md).

### Uploaded documents

- **Upload** a document and it's **indexed** for semantic search (RAG), so the assistant
  can find and cite it in answers. While indexing, it shows "indexing…"; once done, you'll
  see how many **chunks** it was split into.
- Mark a document **Confidential** to restrict it to
  [confidential](chat-controls.md#data-classification) chats and local-only models, so
  sensitive files never reach an external provider.
- **Re-index** re-processes a file — useful if you replaced its contents or changed its
  classification.

### Files on your devices

Switch the source from **Uploaded** to one of your connected devices and type a name to
**locate** files on that machine. This is a *name* search — it finds where things are; it
doesn't copy their contents into the index. From there you can ask the assistant to open or
work with a file in a [coding](coding.md) chat.

!!! tip "Search across everything"
    The **All** source searches your uploaded documents and every connected device at once,
    so you don't have to remember where a file lives.
