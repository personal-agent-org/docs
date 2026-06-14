# Devices & coding

Chats bind to **devices**; each declares a **kind** on connect, which shapes the
toolset.

## The `linux` device agent

A per-user **Rust** binary (per-OS one-liner install) running cross-platform
(Linux/macOS/Windows via `portable-pty`), with binaries built natively per OS:

- The **Linux** build links statically via the musl target.
- The **macOS/Windows** builds link system libraries.

It authenticates over the Keycloak device flow and serves a **jailed filesystem +
PTY**, powering coding mode and `execute_code`.

## The `browser` device

Drives a real browser via the same WS protocol, as either:

- a **Chrome MV3 extension** (acts in your logged-in session), or
- an on-demand **Playwright + Chromium** cloud sandbox.

Both speak the same `browser_*` protocol —
`navigate`/`click`/`type`/`press`/`scroll`/`get_page`/`screenshot`/`eval_js`/`wait_for`
+ tab switching; the in-session extension also exposes `back`/`forward`/`reload`/`find`.

!!! tip "Vision models see the page directly"
    Screenshots return as images, so vision models can read the page directly.

## Coding mode

Coding mode turns a chat into a **workspace** over a connected device's jailed
filesystem:

- **Monaco editor** + a real **PTY terminal**
- **LSP** navigation / diagnostics, formatters
- fuzzy-edit + `apply_patch`
- **shadow-git undo**
- `AGENTS.md` / custom commands

A coding chat without a workspace **asks where to work first** — own device or an
on-demand **cloud sandbox**, new vs. existing project — and the agent binds the
choice itself (`list_workspace_options` / `select_workspace`). Chats spun off from
the main chat start in a **clarify-first kickoff** (plan + questions, no invented
requirements, no building before scope is confirmed).

On **small screens**, coding shows one view at a time (Chat / Editor / Terminal /
Agents) with a bottom nav: unread-answer counts, the uncommitted-git-changes badge
on the editor, finished-command counts on the terminal, and pulsing icons while
the agent or a command is running.

## On-demand cloud sandbox

The same on-demand pattern offers a disposable **cloud coding sandbox** for
zero-setup coding mode.

## Safe parallelism

Read tools run concurrently while device writes and `execute_code` are
**serialized** to avoid races on the shared jail. See
[Security & governance](security.md).
