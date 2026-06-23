# Notes & Files

Two simple, everyday places to keep things: free-form **Notes** and a searchable **Files**
library. Both are also reachable by the assistant — it can write a note for you, or search
your documents to answer a question.

## Notes

The **Notes** page (in the sidebar) is a two-pane notebook: your notes on the left, the
editor on the right.

- **New** creates a note; give it a title and a body. The body is **Markdown** (including
  **Mermaid diagrams**) edited in a Monaco editor, with a formatting toolbar. The view
  toggle switches between **edit**, **split**, and **preview** (split falls back to single
  pane on phones).
- Notes **save automatically** as you type ("Saving…" → "Saved"), so you never lose work.
- **Tags** organize notes: add or remove them on the open note, and click a tag chip in the
  list to filter by it.
- **Pin** keeps important notes at the top of the list.
- **Search** filters by title and content.
- **Share** a note with other users or groups at **read** or **write** access; a writable
  note edits live (real-time collaboration) when more than one person has it open.
- The note's "more" menu also exports it as **Markdown** or prints it (to **PDF** via your
  browser's print dialog).

Your assistant can create and update notes too — ask it to "jot this down" or "draft a note
summarizing this thread", and it appears here. Notes you own can be deleted; deletion is
permanent. A note shared with you at write access can be edited but not deleted.

## Files

The **Files** page (in the sidebar) is "all your files in one place" — both documents you
upload and files on your [connected devices](devices.md).

### Uploaded documents

- **Upload** a PDF or text file (plain text, Markdown, CSV, JSON; up to 12 MB, 100 documents
  per user). Its text is extracted and **indexed** for semantic search (RAG), so the
  assistant can find and cite it in answers via its `search_documents` tool. While indexing,
  it shows "indexing…"; once done, you'll see how many **chunks** it was split into. If no
  embedding model is configured the upload is stored as pending, ready to index later.
- Mark a document **Confidential** to restrict it to models cleared for the internal
  ([data classification](chat-controls.md#data-classification)) trust tier, so the passages
  never reach a provider that isn't cleared for that data. Toggling confidential re-stamps
  the document's chunks immediately; no re-indexing is needed.
- **Re-index** re-processes a file - useful if you replaced its contents or after an
  embedding model was configured (it appears on documents still pending).

### Files on your devices

Switch the source from **Uploaded** to one of your connected devices (those that expose a
home index) and type a name to **locate** files on that machine. This is a *name* search of
the device's read-only home directory - it finds where things are; it doesn't copy their
contents into the index. In a regular (non-coding) chat the assistant can then read those
files for you with its `search_files` / `read_file` tools; for editing and running code, use
a [coding](coding.md) chat instead.

!!! tip "Search across everything"
    The **All** source searches your uploaded documents and every connected device at once,
    so you don't have to remember where a file lives.
