# Notes & Files

Two simple, everyday places to keep things: free-form **Notes** and a searchable
**Files** library. Both are also reachable by the assistant — it can write a note for
you, or search your documents to answer a question.

## Notes

The **Notes** page (*Notizen*, in the sidebar) is a two-pane notebook: your notes on the
left, the editor on the right.

- **New** (*Neu*) creates a note; give it a title and a body. The body supports
  **Markdown** — including **Mermaid diagrams** — with a live **Preview** tab.
- Notes **save automatically** as you type ("Saving…" → "Saved").
- **Pin** (*Anheften*) keeps important notes at the top.
- **Search** filters by title and content.

Your assistant can create and update notes too — ask it to "jot this down" or "draft a
note summarizing…", and it appears here. Deleting a note is permanent.

## Files

The **Files** page (*Dateien*, in the sidebar) is "all your files in one place" — both
documents you upload and files on your [connected devices](devices.md).

### Uploaded documents

- **Upload** (*Hochladen*) a document and it's **indexed** for semantic search (RAG), so
  the assistant can find and cite it in answers. While indexing, it shows "indexing…";
  once done, you'll see how many **chunks** it was split into.
- Mark a document **Confidential** (*Vertraulich*) to restrict it to
  [confidential](chat-controls.md#data-classification) chats and local-only models.
- **Re-index** (*Neu indizieren*) re-processes a file if you need to.

### Files on your devices

Switch the source from **Uploaded** (*Hochgeladen*) to one of your connected devices and
type a name to **locate** files on that machine. This is a name search — it finds where
things are; it doesn't copy their contents into the index.

!!! tip "Search across everything"
    The **All** (*Alle*) source searches your uploaded documents and every connected
    device at once.
