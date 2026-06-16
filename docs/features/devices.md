# Devices & apps

Connect a **computer**, a **browser** or your **phone** and your assistant can act in the
real world — edit files, drive a web page, read your phone's status. You manage them all
under **Settings → Devices** (*Geräte*). Online devices become available in the chat's
device picker.

## Connect a computer

A connected computer runs a small, secure **device agent** that gives the assistant a
**jailed filesystem and terminal** — the foundation of [coding mode](coding.md). It runs
on Linux, macOS and Windows.

1. **Settings → Devices → Connect** (*Computer verbinden*) and give the device a name.
2. Run the **one-liner** it shows you on that machine. It downloads the agent, signs in
   through your normal **Keycloak** browser login (no token to copy), and starts it. The
   agent connects **outbound**, so it works behind NAT.
3. The device appears in the list as **online**, with the tools it offers.

Prefer to do it by hand? **Download the binary** for your OS instead of the one-liner.
You can **rotate** a device's credentials or **remove** it anytime.

!!! note "Device safety is per chat"
    A device no longer carries its own rules — what the agent may do on it is governed by
    the chat's [security mode](chat-controls.md#security-mode) (Autonomous / Approve each /
    Judge). You can grant **permanent allowances** (*Dauerhafte Freigaben*) for specific
    commands so they run without asking.

## Connect a browser

A **browser** device lets the assistant navigate, click, type and screenshot real web
pages. Two flavours:

- the **browser extension** (Chrome/Edge) — acts in *your* logged-in session (see
  [below](#the-browser-extension)); or
- an on-demand **cloud browser** — **Settings → Devices → Start cloud browser**
  (*Cloud-Browser starten*) spins up a headless Chromium in the cloud with no install.

Either way, vision models can read the page from screenshots directly.

## Connect your phone

Install the **Android app** ([below](#native-apps)) and sign in, and your phone appears
as a device. With your opt-in, the assistant can read its **status** and **control** it,
and the phone can report **sensors** for context. You tune all of this under
**Settings → Companion** (*Companion-App*):

- **Push connection** (*Push-Verbindung*) — when the app holds its realtime connection
  (Always / Only when screen on / Wi-Fi only / Never) to balance battery.
- **Location** (*Standort*) — off by default; opt in to report just a **zone name**
  (e.g. "Home") or **exact** coordinates. Define **zones** (place + radius) that
  [workflows](workflows.md) can react to.
- **Sensors** — choose which sensors the phone shares.
- **Health** (*Gesundheit*, via Health Connect) — opt in per metric (steps, sleep,
  resting heart rate, weight); daily aggregates let the agent answer "how did I sleep?".

## Native apps

Personal Agent runs in the browser, but native shells add real push notifications,
Keycloak login and microphone access. Find downloads under **Settings → App**.

- **Android** — download the APK, allow installing it, open and sign in.
- **Desktop (Linux)** — a Tauri app, offered as an AppImage (portable), a `.deb`, or a
  single binary.
- **Browser extension (Chrome/Edge)** — see below.
- **Terminal client (TUI)** — a terminal chat client that speaks the same API; sign in
  with the Keycloak device flow and chat from your shell.

### The browser extension

Download the extension `.zip`, then load it unpacked: unzip it, open `chrome://extensions`,
enable **Developer mode**, click **Load unpacked**, and select the folder. Open the
popup and **Connect (sign in)** — it authenticates through your Keycloak login and a
**Browser** device appears under **Settings → Devices**. Select it in a chat to give the
assistant the browser tools.

## Use this assistant from other tools (MCP)

Personal Agent can also expose **itself** as an [MCP](integrations.md#mcp-servers-external-apis)
server, so other tools (Claude Code, Cursor, any MCP client) can use your assistant's
knowledge — entity/document search, memory, notes, commitments, chats — and message you.
Under **Settings → App**:

- **OAuth (recommended)** — OAuth-capable clients just need the **MCP server URL**; they
  sign you in through the normal login.
- **Headless / CLI** — many CLI clients can also sign in with an OAuth **device code**
  using only that URL. Only if your tool can't do OAuth at all, **create an access
  token** (shown once) and use it as a Bearer token.
