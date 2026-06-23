# Notes → collaborative documents (HedgeDoc-class)

> Status: Design + plan of record. 2026-06-17. Reference clone: `/root/references/hedgedoc`.
>
> Update 2026-06-23: Phases 1, 3, and 4 SHIPPED; Phase 2 PARTIALLY shipped (tags only);
> Phase 5 (revisions) NOT yet shipped. See the per-phase status notes below.

## Goal

Turn the single-user `title + Markdown` Notizen into a collaborative document editor: shareable
between **users and groups**, **real-time co-editing**, a real markdown editor, organization
(tags/folders/frontmatter/slides), import/export, and revision history. Driven by a HedgeDoc gap
analysis; we adopt the document features, NOT HedgeDoc's multi-tenant-platform parts (its own
auth/LDAP, public explore page, 5 media backends, anonymous editing).

## Baseline (pre-work, 2026-06-17)

The starting point this plan built on: `Note(owner_sub, org_id, title, content, pinned)` -
owner-scoped RLS CRUD (`/notes` list/create/patch/delete + substring search), agent tools
(create/list/update/delete), a master-detail `NotesPage.vue` (raw textarea / rendered view),
renderer = markdown-it + highlight.js + mermaid + DOMPurify. No editor, sharing, collab, tags,
folders, export, or revisions. (Most of these have since landed - see the phase status above.)

## Architecture decisions

1. **Editor = Monaco (REUSE the existing `MonacoEditor.vue`)**, NOT a new editor. We already ship
   `monaco-editor` + `@guolao/vue-monaco-editor` for coding-mode + dashboard config editors, with a
   shared theme (`monacoHex`). Reusing it avoids a SECOND editor in the bundle and keeps one editor
   stack. It is the foundation for the toolbar, live split-preview, AND the realtime binding.
   (Rejected CodeMirror 6 - HedgeDoc's choice + marginally nicer for prose - because a second
   editor dependency isn't worth it; `y-monaco` gives the same Yjs collab.) New deps are only the
   renderer/collab libs: `katex` + `@vscode/markdown-it-katex`, `markdown-it-task-lists`,
   `markdown-it-footnote`, `markdown-it-table-of-contents`, `markdown-it-anchor`; and `yjs`,
   `y-monaco`, `y-protocols` (all shipped).
2. **Renderer upgrades go in the SHARED `useMarkdown`** (KaTeX, task lists, footnotes, TOC, anchors)
   so the chat renderer benefits too. Keep the strict DOMPurify gate.
3. **Real-time collab = Yjs (CRDT)**. Frontend: **`y-monaco`** (`MonacoBinding`) binds the Monaco
   model to a Yjs doc; `y-protocols/awareness` carries cursors/presence. Transport: a FastAPI WebSocket
   `/ws/notes/{note_id}` (reuse the `terminal_ws` token-via-subprotocol auth). Server: **`pycrdt`**
   (maintained Python Yjs binding) holds the room's Y.Doc, applies updates, and MATERIALIZES the
   markdown text → `notes.content` (so search / RAG / the agent always see live content - the
   reason to run a real CRDT server, not a blind relay). **Cross-pod** fan-out via Redis pub/sub
   per note room (Contract #4 pattern; unlike the single-pod terminal relay). Persistence:
   `notes.ydoc BYTEA` (the CRDT state) + materialized `content`, debounced-saved + on last
   disconnect.
   !!! note "Shipped (Phase 4)"
       Built as designed: `realtime/notes_collab.py` (`NoteRoom`/`NoteCollabHub`, pycrdt `Doc` with a
       `content` `Text`), `api/routers/notes_ws.py` (`/ws/notes/{note_id}`, bearer-subprotocol auth,
       read-only collaborators may send awareness but their doc edits are dropped server-side),
       frontend `composables/useNoteCollab.ts` (`y-monaco` + `y-protocols/awareness`). The wire is a
       hand-rolled 4-tag binary y-sync protocol (`SYNC_STEP1`/`SYNC_STEP2`/`UPDATE`/`AWARENESS`), NOT
       the `y-websocket` provider. Redis cross-pod fan-out tags each message with a per-process pod id
       to skip its own echoes; persistence debounce is 2s plus a final flush on last leave. The
       per-checkpoint revision write was deferred to Phase 5 (not implemented). Migration `notes_ydoc_01`.
4. **Sharing = a `note_permissions` table keyed on the unified `scope_ref`** (`user:<sub>` |
   `group:<id>`), level `read|write`; owner always full. This rides the scope-entity-unification:
   a note is visible if `owner` OR a permission row's `grantee_scope_ref ∈ current_scopes`
   (resolved in `NoteRepo`, not RLS). Group sharing uses the existing **group system**. Public
   read-only links (planned to reuse the **[[chat-sharing]]** password+token+`/s/...` infra) are
   NOT yet built - notes do not appear in the share routers.
5. **Out of scope** (HedgeDoc-platform, not us): anonymous editing, LDAP/OIDC (we have Keycloak),
   the public explore page, imgur/azure/webdav media backends, more diagram types (per user).

## Phases (each independently shippable + deployable)

- **Phase 1 - Editor + renderer (Tier 1).** ✅ SHIPPED. Monaco (markdown mode, word-wrap) replaces
  the textarea via the shared `MonacoEditor.vue`; formatting toolbar (`toolbarButtons` driving
  `editor.executeEdits`); live synced split-preview; `useMarkdown` gains KaTeX + task lists +
  footnotes + TOC + anchors; export Markdown + print-to-PDF (`exportMarkdown` / `printNote`). No
  backend change. Lowest risk; ships the biggest day-1 UX win.
- **Phase 2 - Organization (Tier 2).** PARTIAL. ✅ `tags` shipped: `notes.tags JSONB` (GIN index
  `ix_notes_tags`, migration `notes_tags_01`), `?tag=` filter on `GET /notes` + filter chips +
  per-note add/remove + agent-supplied tags via the note tools (`normalize_tags`: lowercase/dedupe,
  cap 30). NOT shipped: YAML frontmatter parsing, folders (`Folder`), slide mode (reveal.js),
  image paste/upload (`note_media` store, `POST /notes/media`).
- **Phase 3 - Sharing (users + groups).** ✅ SHIPPED (except public links). `note_permissions` model
  (`grantee_scope_ref` = `user:<sub>` | `group:<id>`, `level` read|write; migration
  `note_permissions_01`) + access resolution in `NoteRepo` (`accessible` / `get_readable` /
  `get_writable`, owner > write > read, owner-only delete); share UI = `NoteShareDialog.vue` +
  `GET`/`PUT /notes/{id}/shares` + `GET /users/search` (tenant-scoped picker). API + agent tools
  honour permissions. Memory-access / governance unaffected (notes carry no tags). NOT shipped:
  public read-only links via chat-sharing (notes are not in `public_shares`/`shares`).
- **Phase 4 - Real-time collaboration.** ✅ SHIPPED. See the architecture-decision #3 note above for
  the as-built detail.
- **Phase 5 - Revision history.** NOT yet shipped. Planned: `note_revisions(note_id, content,
  author_sub, created_at)`; snapshot on save / collab checkpoint; diff + restore UI. No
  `note_revisions` table or UI exists today.

Order rationale: editor (foundation) → organization (additive) → sharing (permission model) →
collab (needs editor + permissions) → revisions (needs the save pipeline). [[notes-system]]
[[chat-sharing]] [[scope-entity-unification]] [[group-system]] [[mermaid-charts]]
