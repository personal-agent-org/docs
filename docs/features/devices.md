# Devices & apps

Connect a **computer**, a **browser** or your **phone** and your assistant can act in the
real world — edit files, drive a web page, read your phone's status. You manage them all
under **Settings → Devices**. Any device that's online becomes available in a chat's device
picker.

## Connect a computer

A connected computer runs the small, secure **Computer Service** that gives the assistant a
**jailed filesystem and terminal** — the foundation of [coding mode](coding.md). It runs on
Linux, macOS and Windows.

1. **Settings → Devices → Connect** and give the device a name.
2. Run the **one-liner** it shows you on that machine. It downloads Computer Service, verifies
   ownership through your normal browser login, exchanges that login for a dedicated service
   token, and starts it. The service
   connects **outbound**, so it works behind NAT without opening any ports.
3. The device appears in the list as **online**, along with the tools it offers.

Prefer to do it by hand? **Download the `pacs` binary** for your operating system instead of the
one-liner, then run `pacs enroll` (it signs you in via the device flow) followed by `pacs run`.
The saved `pcs_…` credential is device-bound and accepted only by the capability WebSocket and
explicit Computer Service endpoints. It cannot access chats, runs, settings, or the general user
API. No user access or refresh token is persisted. Re-enrollment rotates the credential; removing
the device revokes it.

`pacs` writes per-user configuration to
`~/.config/personal-agent/computer-service/config.toml`. On Unix it also reads
`/etc/personal-agent/computer-service/config.toml` when the per-user file is absent; the per-user
file always has priority. Desktop/TUI configuration remains per-user only under
`~/.config/personal-agent/desktop/`.

!!! note "Device safety is per chat"
    A device no longer carries its own rules — what Computer Service may do on it is governed by the
    chat's [security mode](chat-controls.md#security-mode) (Autonomous / Approve each /
    Judge). You can grant **permanent allowances** for specific commands so they run without
    asking, while everything else still respects the chat's mode.

## Connect a browser

A **browser** device lets the assistant navigate, click, type, scroll and screenshot real
web pages (`browser_*` tools). Two flavours:

- the **browser extension** (Chrome/Firefox) - acts in *your* logged-in session (see
  [below](#the-browser-extension)); or
- an on-demand **cloud browser** - a headless Chromium driven by Playwright, spun up in the
  cloud with nothing to install. It connects back as a managed `kind=browser` device and
  shows up in the chat device picker; it is reaped when idle. (Requires a configured cloud
  sandbox provider on the deployment.)

Either way, vision models can read the page straight from screenshots.

## Connect your phone

Install the **Android app** ([below](#native-apps)) and sign in, and your phone appears as a
device. With your opt-in, the assistant can read its **status** and **control** it, and the
phone can report **sensors** for context. You tune all of this under **Settings →
Companion** (a tab that only appears inside the app):

- **Push connection** — when the app holds its realtime connection (Always / Only when the
  screen is on / Wi-Fi only / Never) to balance battery against responsiveness.
- **Location** — off by default; opt in to report just a **zone name** (for example, "Home")
  or **exact** coordinates. Define **zones** (a place plus a radius) that
  [workflows](workflows.md) can react to.
- **Sensors** — choose exactly which sensors the phone shares.
- **Health** (via Health Connect) — opt in per metric (steps, sleep, resting heart rate,
  weight); daily aggregates let the agent answer questions like "how did I sleep?".

## Native apps

Personal Agent runs in any browser, but native shells add real push notifications, system
login and microphone access. Find downloads under **Settings → App**.

- **Android** - download the APK, allow installing it, then open and sign in.
- **Desktop (Linux)** - a Tauri desktop app, offered as a portable **AppImage** or a **`.deb`**
  package (x86_64).
- **Browser extension (Chrome/Firefox)** - see below.
- **Terminal client** - a terminal chat client that speaks the same API; sign in with the
  device flow and chat from your shell.

### The browser extension

The **browser extension** turns Chrome or Firefox into a `kind=browser` device that acts in
*your* logged-in session, so the assistant can read and drive pages you're already signed in to.
It lives in its own repository,
[`personal-agent-org/browser-extension`](https://github.com/personal-agent-org/browser-extension).

**Install.** On Chrome, install it from the **Chrome Web Store**. For Firefox, or to run it
unpacked, build it from source and load it (see the repository's README). Open the popup, enter
your **Server URL**, and **Connect (sign in)** — it authenticates through your normal login and a
**Browser** device appears under **Settings → Devices**. Select it in a chat to give the assistant
the browser tools (navigate, click, type, scroll, read the page, screenshot, and more).

**Debug mode (Chrome only).** A few tools attach the active tab to the Chrome DevTools Protocol to
reach things the plain page can't: an accessibility-tree snapshot, console messages, network
requests, full-page screenshots, and *trusted* input for sites that ignore synthetic events. Chrome
shows a yellow "started debugging this browser" banner while attached; click **Cancel** to end it.
Firefox has no equivalent, so those extras aren't offered there.

**Safety.** Because the extension drives your real session, the popup adds guardrails on top of the
chat's [security mode](security.md):

- **Per-tool exposure** - switch individual `browser_*` tools off (for example
  `browser_eval_js`); the device stops announcing them and refuses them if asked anyway. You
  review the set on first sign-in.
- **Origin guard** — the assistant can never drive the Personal Agent app's own origin or your login
  provider (that could expose your tokens); you can add more blocked hosts (e.g. your bank).
- **HTTPS only** for the server/issuer URLs, and a **secure disconnect** that deletes the device and
  revokes its tokens.

Self-hosting the extension (your own Keycloak client + redirect URI) is covered under
[OIDC provider configuration](../getting-started/oidc.md), and building it under [Client apps](../getting-started/client-apps.md).

## Use this assistant from other tools (MCP)

Personal Agent can also expose **itself** as an
[MCP](integrations.md#mcp-servers-external-apis) server, so other tools (Claude Code,
Cursor, any MCP client) can use your assistant's knowledge — entity and document search,
memory, notes, commitments, chats — and message you. Under **Settings → App**:

- **OAuth (recommended)** — OAuth-capable clients just need the **MCP server URL**; they
  sign you in through the normal login, with nothing else to set up.
- **Headless / CLI** — many CLI clients can also sign in with an OAuth **device code** using
  only that URL (you confirm a code in the browser). Only if your tool can't do OAuth at all,
  **create an access token** (shown once) and use it as a Bearer token.
