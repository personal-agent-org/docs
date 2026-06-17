# Notes → collaborative documents (HedgeDoc-class)

> Status: Design + plan of record. 2026-06-17. Reference clone: `/root/references/hedgedoc`.

## Goal

Turn the single-user `title + Markdown` Notizen into a collaborative document editor: shareable
between **users and groups**, **real-time co-editing**, a real markdown editor, organization
(tags/folders/frontmatter/slides), import/export, and revision history. Driven by a HedgeDoc gap
analysis; we adopt the document features, NOT HedgeDoc's multi-tenant-platform parts (its own
auth/LDAP, public explore page, 5 media backends, anonymous editing).

## Baseline today

`Note(owner_sub, org_id, title, content, pinned)` — owner-scoped RLS CRUD (`/notes` list/create/
patch/delete + substring search), agent tools (create/list/update/delete), a master-detail
`NotesPage.vue` (raw textarea ↔ rendered view), renderer = markdown-it + highlight.js + mermaid +
DOMPurify. No editor, sharing, collab, tags, folders, export, or revisions.

## Architecture decisions

1. **Editor = Monaco (REUSE the existing `MonacoEditor.vue`)**, NOT a new editor. We already ship
   `monaco-editor` + `@guolao/vue-monaco-editor` for coding-mode + dashboard config editors, with a
   shared theme (`monacoHex`). Reusing it avoids a SECOND editor in the bundle and keeps one editor
   stack. It is the foundation for the toolbar, live split-preview, AND the realtime binding.
   (Rejected CodeMirror 6 — HedgeDoc's choice + marginally nicer for prose — because a second
   editor dependency isn't worth it; `y-monaco` gives the same Yjs collab.) New deps are only the
   renderer/collab libs: `katex` + `@vscode/markdown-it-katex`, `markdown-it-task-lists`,
   `markdown-it-footnote`, `markdown-it-table-of-contents`, `markdown-it-anchor` (done); and later
   `yjs`, `y-monaco`, `y-protocols` (Phase 4).
2. **Renderer upgrades go in the SHARED `useMarkdown`** (KaTeX, task lists, footnotes, TOC, anchors)
   so the chat renderer benefits too. Keep the strict DOMPurify gate.
3. **Real-time collab = Yjs (CRDT)**. Frontend: `y-codemirror.next` binds the CM6 doc to a Yjs
   doc via **`y-monaco`**; `y-protocols/awareness` carries cursors/presence. Transport: a FastAPI WebSocket
   `/ws/notes/{note_id}` (reuse the `terminal_ws` token-via-subprotocol auth). Server: **`pycrdt`**
   (maintained Python Yjs binding) holds the room's Y.Doc, applies updates, and MATERIALIZES the
   markdown text → `notes.content` (so search / RAG / the agent always see live content — the
   reason to run a real CRDT server, not a blind relay). **Cross-pod** fan-out via Redis pub/sub
   per note room (Contract #4 pattern; unlike the single-pod terminal relay). Persistence:
   `notes.ydoc BYTEA` (the CRDT state) + materialized `content`, debounced-saved + on last
   disconnect; each checkpoint also writes a revision.
4. **Sharing = a `note_permissions` table keyed on the unified `scope_ref`** (`user:<sub>` |
   `group:<id>`), level `read|write`; owner always full. This rides the scope-entity-unification:
   a note is visible if `owner` OR a permission row's `scope_ref ∈ current_scopes`. Public
   read-only links reuse the existing **[[chat-sharing]]** infra (password + token + `/s/...`).
   Group sharing uses the existing **group system**.
5. **Out of scope** (HedgeDoc-platform, not us): anonymous editing, LDAP/OIDC (we have Keycloak),
   the public explore page, imgur/azure/webdav media backends, more diagram types (per user).

## Phases (each independently shippable + deployable)

- **Phase 1 — Editor + renderer (Tier 1).** Monaco (markdown mode, word-wrap) replaces the
  textarea via the shared `MonacoEditor.vue`; formatting toolbar;
  live synced split-preview; `useMarkdown` gains KaTeX + task lists + footnotes + TOC + anchors;
  export Markdown + print-to-PDF. No backend change. Lowest risk; ships the biggest day-1 UX win.
- **Phase 2 — Organization (Tier 2).** `tags` (column + filter + agent auto-tag), YAML frontmatter
  (title/tags/type parsed from the body), folders (reuse `Folder`), slide mode (reveal.js when
  `type: slide`). Image paste/upload → a `note_media` store + `POST /notes/media` (filesystem/S3
  via the existing compute/storage seam).
- **Phase 3 — Sharing (users + groups).** `note_permissions` model + RLS extension (owner OR
  permitted scope); share UI (pick users/groups + level); public links via chat-sharing; API +
  agent tools honour permissions. Memory-access / governance unaffected (notes carry no tags).
- **Phase 4 — Real-time collaboration.** Yjs + `y-monaco` binding; `/ws/notes/{id}` room;
  `pycrdt` server materializing content; Redis cross-pod fan-out; awareness cursors/presence;
  `notes.ydoc` persistence. Depends on Phase 1 (Monaco editor) + Phase 3 (who may edit).
- **Phase 5 — Revision history.** `note_revisions(note_id, content, author_sub, created_at)`;
  snapshot on save / collab checkpoint; diff + restore UI.

Order rationale: editor (foundation) → organization (additive) → sharing (permission model) →
collab (needs editor + permissions) → revisions (needs the save pipeline). [[notes-system]]
[[chat-sharing]] [[scope-entity-unification]] [[group-system]] [[mermaid-charts]]
