# TUI ↔ Web feature parity

Comparison of the Rust terminal client (`clients/tui/`) against the Quasar/Vue web app
(`apps/web/`), plus a prioritised roadmap to close the gaps. Snapshot: 2026-06-15.

> **Update 2026-06-15 (commit b1c1bc2):** P1 partially shipped — TUI now has a security-mode
> picker (F7 / `/security`) and the `/main`, `/rename`, `/summarize`, `/proofread` commands.
> `/edit` was dropped (awkward in a TUI); the context/budget chip is deferred (needs
> model-context-window plumbing the TUI doesn't track yet).

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
| Attachments (max 6) | ✅ | ✅ |
| Input history (↑/↓) | ⚠️ | ✅ |

## Model & run controls
| Feature | Web | TUI |
|---|---|---|
| Model picker (grouped / searchable) | ✅ | ✅ (F2) |
| Reasoning effort (off/low/med/high) | ✅ | ✅ (`/think`) |
| Built-in tools on/off | ✅ | ✅ (Ctrl+T) |
| Security mode (autonomous/approve_each/judge) | ✅ | ✅ (F7 / `/security`) |
| Collaboration mode (plan/execute/pair) | ✅ | ❌ |
| Data classification (confidential) | ✅ | ❌ |
| Memory-access policy (scoped) | ✅ | ❌ |
| Per-run integrations / tool selection | ✅ | ❌ (built-ins only, global) |

## Slash commands
- Web: `/new /rename /btw /goal /main /summarize /proofread` + coding (`/terminal /review /explain /fix /tests /init`)
- TUI: `/new /btw /retry /model /think /tools /attach /agents /inbox /logout /help`
- Custom commands (from `GET /commands`): ✅ both
- Missing in TUI: `/goal`, coding prompts (`/main /rename /summarize /proofread` now present)

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
Skills, Tasks, Dashboards, Automations. TUI surfaces only Chat + Sessions + Inbox + Agents.

## Cross-cutting
| Feature | Web | TUI |
|---|---|---|
| Auth: Keycloak OIDC | ✅ (Auth-Code+PKCE) | ✅ (device grant) |
| Realtime: SSE stream + control WS | ✅ | ✅ |
| Adopt accent colour (`ui.accent`) | ✅ (source) | ✅ (reads it) |
| Settings UI (profile/appearance/behavior/devices/MCP tokens/usage/budget) | ✅ | ❌ (CLI flags / config only) |
| Voice (STT / TTS) | ✅ | ❌ |
| Context / budget gauges | ✅ | ❌ |
| Org switching | ✅ | ❌ (decoded, not surfaced) |

## Summary
The TUI has a solid chat foundation at genuine parity: streaming, model/reasoning,
follow-ups, `/btw`, sub-agents, **HITL (approvals + question cards)**, inbox basics, coding
shell with diffs; shares auth/realtime/accent. The gaps are run-governance, voice, the coding
editor, message lifecycle (edit/rewind/fork), inbox extras, the standalone pages, `/goal`, and
a settings UI.

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
4. **Context / budget chip** — DEFERRED: needs the model context window + cumulative history
   tokens, which the TUI doesn't track (the `chat_run` WS frame carries no context tokens).
   Plumb `context_tokens`/`threshold_tokens` onto the run/WS event first, then add the chip.

### P2 — moderate (governance + tools)
5. **Per-run integrations / tool selection** — let the user toggle integrations/devices for a
   run (`integration_entries`/`devices` in the run body). Needs a picker popup like the model one.
6. **Memory-access + collaboration + classification pickers** — same pattern as security mode;
   group them under one "run settings" popup to avoid F-key sprawl.
7. **`/goal` autonomous-goal mode** — start a goal loop in a session chat (`chat.startGoal`
   equivalent endpoint); render goal turns. Higher value for unattended terminal use.

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
13. **Workspace snapshot/revert**, Dashboards, Knowledge/Contacts/Calendar/Automations — port
    only if a concrete terminal use-case emerges.

Suggested first slice: **P1 (1–4)** — small, all backend-ready, and they remove the most
friction for a terminal-first user.
</content>
