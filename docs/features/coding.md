# Coding & Cloud Tasks

Switch a chat to **coding mode** and it becomes a real development workspace: the assistant
edits files, runs commands and reads diagnostics on a connected machine — while you watch
in an editor and terminal right beside the conversation.

## Coding mode

Pick **Coding** from the chat-mode switcher (or when starting a new chat). The layout gains
a workspace on the right (desktop) or **Editor** / **Terminal** tabs in the bottom nav
(mobile):

- a **Monaco editor** — the same editor that powers VS Code — with a file tree, syntax
  highlighting, and code intelligence (LSP navigation, diagnostics and formatters);
- a real **terminal** showing the commands the agent runs, live;
- **save** straight from the editor, with a badge when there are uncommitted changes.

The agent's file edits show up in the conversation as **diffs**, and you can **revert** an
answer's changes (and rewind the chat to before it) from the message actions — see
[Chatting](chat.md#what-you-can-do-with-a-message). Read tools run in parallel for speed,
while writes to the workspace are serialized so they can't race each other.

### Picking where to work

The first time you send a message in a coding chat, the workspace asks **where to work**:

- **My device** — a [connected computer](devices.md) running the device agent; or
- **Cloud sandbox** — a disposable, zero-setup environment in the cloud.

…and **which project**: an **existing** folder, a **new** one, or a clone **from Git** (a
repo URL plus a branch). Your first message is queued and runs as soon as the workspace is
ready. Chats branched off the main chat start "clarify-first" — the agent plans and asks
questions before building, rather than inventing requirements.

### Built-in coding commands

In a coding chat the slash palette adds `/review`, `/explain`, `/fix`, `/tests`,
`/terminal` and `/init` (generate an `AGENTS.md`). See
[slash commands](chat-controls.md#slash-commands). An `AGENTS.md` in the repo — and your
own [custom commands](chat-controls.md#your-own-commands) — guide how the agent works in
that project.

!!! tip "Hooks for your repo"
    Want the agent to auto-format after every edit, or to refuse writes to a read-only
    repo? That's what [hooks](workflows.md#hooks) are for — rules that run a command on the
    workspace device (or block a tool) around tool calls.

## The cloud sandbox

No machine to connect? Start a **cloud sandbox** and code entirely in the browser. It spins
up on demand, the editor and terminal work exactly the same, and it's disposable — ideal
for a quick experiment or when you're away from your own device. You can also spawn a
**cloud browser** for web-automation tasks (see [Devices & apps](devices.md)).

## Cloud Tasks

For work you'd rather not babysit, **Cloud Tasks** (in the account menu) runs an
**autonomous coding task** end-to-end on its own cloud sandbox and hands you a reviewable
result.

1. **Start a task** — give it a **title**, a **prompt** ("what should the agent do?"), a
   **repository** and a **base branch**.
2. It runs in the background; the status moves through **Starting → Running → Ready to
   review** (or **Failed**).
3. When it's ready, open it to read the agent's **summary** and **view the diff**.
4. **Apply** pushes the work to a `pa/task-…` branch and opens a pull request — or
   **Discard** throws it away.

Nothing touches your repository until you click **Apply**, so you're always reviewing
before anything ships. Run several at once and review them as they finish.
