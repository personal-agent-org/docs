# TUI ↔ Web feature parity

Comparison of the Rust terminal client (`personal-agent-org/pa`) against the Quasar/Vue web app
(`personal-agent-org/frontend`), plus a prioritised roadmap to close the gaps. Snapshot: 2026-06-15.

> **Update 2026-06-15 (commit b1c1bc2):** P1 partially shipped - TUI now has a security-mode
> picker (F7 / `/security`) and the `/main`, `/rename`, `/summarize`, `/proofread` commands.
> `/edit` was dropped (awkward in a TUI); the context/budget chip is deferred (needs
> model-context-window plumbing the TUI doesn't track yet).

> **Update 2026-06-23:** most of P1-P2 has since shipped (verified against
> `personal-agent-org/pa`). The TUI now has: the **context/budget telemetry strip** (model
> + context fill % + cumulative tokens + cost + run timer, from `GET /chats/{id}/context`);
> the **integrations picker** (F8 / `/integrations`, per-chat `disabled_tools` deny-list);
> the **memory-access picker** (F9 / `/memory`, `run_config.memory_access`); **`/steer`**
> mid-run course-correction; full **↑/↓ input history**; and **markdown rendering** of message
> bodies (`tui-markdown`). The tables below are kept as the 2026-06-15 record; deltas are noted
> inline. Still open: `/goal`, collaboration/classification pickers, inbox extras, the
> standalone pages, a settings view, voice, and org switching (still `--org`-at-login only).

Legend: ✅ present · ⚠️ partial · ❌ missing

## Chat core
| Feature | Web | TUI |
|---|---|---|
| Send + streaming (text / thinking / tool calls / usage) | ✅ | ✅ |
| Load history, switch / create / rename chats | ✅ | ✅ |
| Pinned main chat (auto-open) | ✅ | ✅ (Ctrl+M / F6) |
| Mid-run follow-up queue | ✅ | ✅ |
| Cancel run | ✅ | ✅ (Ctrl+X) |
| Regenerate last turn | ✅ | ✅ (`/retry`) |
| `/btw` side question (ephemeral) | ✅ | ✅ |
| Edit a user message | ✅ | ❌ |
| Rewind / fork (branch from a message) | ✅ | ❌ |
| Attachments (max 6) | ✅ | ✅ (Ctrl+O) |
| Input history (↑/↓) | ✅ | ✅ |
| Mid-run steer (`/steer`, inject at tool boundary) | ✅ | ✅ |
| Markdown rendering of bodies | ✅ | ✅ |

## Model & run controls
| Feature | Web | TUI |
|---|---|---|
| Model picker (grouped / searchable) | ✅ | ✅ (F2) |
| Reasoning effort (off/low/med/high) | ✅ | ✅ (`/think`) |
| Built-in tools on/off | ✅ | ✅ (Ctrl+T) |
| Security mode (autonomous/approve_each/judge) | ✅ | ✅ (F7 / `/security`) |
| Collaboration mode (plan/execute/pair) | ✅ | ❌ |
| Data classification (confidential) | ✅ | ❌ |
| Memory-access policy (full/none/scoped) | ✅ | ✅ (F9 / `/memory`) |
| Per-run integrations / tool selection | ✅ | ✅ (F8 / `/integrations`, `disabled_tools` deny-list) |

## Slash commands
- Web: `/new /rename /btw /goal /main /summarize /proofread` + coding (`/terminal /review /explain /fix /tests /init`)
- TUI: `/btw /retry /steer /model /think /tools /integrations /memory /security /attach /agents /new /main /rename /summarize /proofread /inbox /logout /help` (`/int` aliases `/integrations`)
- Custom commands (from `GET /commands`, mode-filtered): ✅ both
- Missing in TUI: `/goal`, coding prompts (`/review /explain /fix /tests /init`)

## Coding mode
| Feature | Web | TUI |
|---|---|---|
| Shell in workspace | ✅ (terminal panel) | ✅ (`!cmd` via PTY WS) |
| Monaco editor + file tree | ✅ | ❌ |
| Workspace snapshot / revert | ✅ | ❌ |
| Diff rendering for file tools | ✅ (cards) | ✅ (unified diff in stream) |

## Agents & HITL
| Feature | Web | TUI |
|---|---|---|
| Sub-agent panel (live status / usage) | ✅ | ✅ (F5) |
| Sub-agent transcript | ✅ | ✅ |
| Tool approval (allow / remember / reject) | ✅ | ✅ |
| `ask_user` / agent-question cards (multi, custom) | ✅ | ✅ |
| Background-resume auto-attach | ✅ | ✅ |

## Inbox
| Feature | Web | TUI |
|---|---|---|
| List + detail + reply + suggest | ✅ | ✅ (F3) |
| Status filter, resolve / dismiss | ✅ | ✅ |
| Star / snooze / bulk / reply-all / forward | ✅ | ❌ |
| Live refresh | ✅ | ✅ |

## Other pages (web) — all ❌ in TUI
Notes, Files, Knowledge/Entities, Contacts, Calendar, Agenda/Commitments, Logbook, Scenes,
Skills, Tasks, Dashboards, Workflows. TUI surfaces only Chat + Sessions + Inbox + Agents.

## Cross-cutting
| Feature | Web | TUI |
|---|---|---|
| Auth: Keycloak OIDC | ✅ (Auth-Code+PKCE) | ✅ (device grant) |
| Realtime: SSE stream + control WS | ✅ | ✅ |
| Adopt accent colour (`ui.accent`) | ✅ (source) | ✅ (reads it) |
| Settings UI (profile/appearance/behavior/devices/MCP tokens/usage/budget) | ✅ | ❌ (CLI flags / config only) |
| Voice (STT / TTS) | ✅ | ❌ |
| Context / budget gauges | ✅ | ✅ (status-bar strip, `GET /chats/{id}/context`) |
| Org switching | ✅ | ⚠️ (pinned via `--org` at login; no in-app switch) |

## Summary
The TUI has a solid chat foundation at genuine parity: streaming, model/reasoning,
follow-ups + `/steer`, `/btw`, sub-agents, **HITL (approvals + question cards)**, inbox basics,
coding shell with diffs, the **integrations + memory-access pickers**, security mode, the
context/budget telemetry strip, and markdown rendering; shares auth/realtime/accent. The
remaining gaps are voice, the coding editor, message lifecycle (edit/rewind/fork), inbox
extras, the standalone pages, `/goal`, collaboration/classification pickers, and a settings UI.

---

# Roadmap (prioritised)

Ordered by value-to-effort for a terminal user. Each item notes the backend it already has
(most are pure TUI work — the API exists).

### P1 — cheap, high-impact (run controls + lifecycle)
1. ~~**Security mode picker**~~ — DONE (b1c1bc2): F7 / `/security`, passed as `security_mode`,
   shown as a 🔒 composer chip.
2. ~~**Edit a user message**~~ — DROPPED: awkward in a TUI (no in-place message editing UX);
   `/retry` covers regeneration.
3. ~~**Missing global slash commands**~~ — DONE (b1c1bc2): `/main [msg]`, `/rename <t>`,
   `/summarize`, `/proofread`.
4. ~~**Context / budget chip**~~ - DONE (2026-06-23): a status-bar telemetry strip shows the
   model + context fill % (colour-banded vs the model window, `⟲` when compacted) + cumulative
   session tokens + cost + the active run's elapsed timer, seeded from `GET /chats/{id}/context`
   and refreshed after each run.

### P2 — moderate (governance + tools)
5. ~~**Per-run integrations / tool selection**~~ - DONE (2026-06-23): F8 / `/integrations`
   opens the per-chat tool catalogue (`GET /chats/{id}/integrations-catalog`); `Space` toggles
   a tool or a whole group, persisted as the chat's `disabled_tools` deny-list (`PATCH /chats/{id}`).
6. **Memory-access + collaboration + classification pickers** - PARTIAL: the memory-access
   picker shipped (F9 / `/memory`, `run_config.memory_access`); collaboration mode and data
   classification are still missing.
7. **`/goal` autonomous-goal mode** - start a goal loop in a session chat (`chat.startGoal`
   equivalent endpoint); render goal turns. Higher value for unattended terminal use. Still open.

### P3 — larger surfaces
8. **Inbox extras** — star/snooze/bulk/reply-all/forward (endpoints exist from the upstream
   inbox work). Incremental key bindings on the existing inbox view.
9. **Notes page** — list/create/edit notes (`/notes` API). Small, self-contained, useful in a
   terminal.
10. **Settings view** — at least appearance (accent/language) + MCP token mint, read/write via
    `/me/preferences` and `/me/api-tokens`.

### P4 — heavy / maybe out of scope for a TUI
11. **Coding editor** — a Monaco-equivalent in a terminal is a big lift; `!cmd` + diffs may be
    enough. Consider a read-only file viewer + `$EDITOR` handoff instead of a full editor.
12. **Voice (STT/TTS)** — needs audio capture/playback; low priority for a terminal client.
13. **Workspace snapshot/revert**, Dashboards, Knowledge/Contacts/Calendar/Workflows — port
    only if a concrete terminal use-case emerges.

P1 (1-4) is done; the per-run integrations picker (P2.5) and memory-access picker (part of
P2.6) have also shipped. The next high-value slice is **`/goal`** (P2.7) for unattended
terminal use, then the remaining run-settings pickers (collaboration/classification) and
inbox extras (P3.8).
</content>
