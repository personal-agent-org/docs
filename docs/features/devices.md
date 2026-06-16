# Devices & apps

Connect a **computer**, a **browser** or your **phone** and your assistant can act in the
real world — edit files, drive a web page, read your phone's status. You manage them all
under **Settings → Devices**. Any device that's online becomes available in a chat's device
picker.

## Connect a computer

A connected computer runs a small, secure **device agent** that gives the assistant a
**jailed filesystem and terminal** — the foundation of [coding mode](coding.md). It runs on
Linux, macOS and Windows.

1. **Settings → Devices → Connect** and give the device a name.
2. Run the **one-liner** it shows you on that machine. It downloads the agent, signs in
   through your normal browser login (no token to copy and paste), and starts it. The agent
   connects **outbound**, so it works behind NAT without opening any ports.
3. The device appears in the list as **online**, along with the tools it offers.

Prefer to do it by hand? **Download the binary** for your operating system instead of the
one-liner. You can **rotate** a device's credentials or **remove** it at any time.

!!! note "Device safety is per chat"
    A device no longer carries its own rules — what the agent may do on it is governed by the
    chat's [security mode](chat-controls.md#security-mode) (Autonomous / Approve each /
    Judge). You can grant **permanent allowances** for specific commands so they run without
    asking, while everything else still respects the chat's mode.

## Connect a browser

A **browser** device lets the assistant navigate, click, type and screenshot real web
pages. Two flavours:

- the **browser extension** (Chrome/Edge) — acts in *your* logged-in session (see
  [below](#the-browser-extension)); or
- an on-demand **cloud browser** — **Settings → Devices → Start cloud browser** spins up a
  headless Chromium in the cloud with nothing to install.

Either way, vision models can read the page straight from screenshots.

## Connect your phone

Install the **Android app** ([below](#native-apps)) and sign in, and your phone appears as a
device. With your opt-in, the assistant can read its **status** and **control** it, and the
phone can report **sensors** for context. You tune all of this under **Settings →
Companion**:

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

- **Android** — download the APK, allow installing it, then open and sign in.
- **Desktop (Linux)** — a desktop app, offered as an AppImage (portable), a `.deb`, or a
  single binary.
- **Browser extension (Chrome/Edge)** — see below.
- **Terminal client** — a terminal chat client that speaks the same API; sign in with the
  device flow and chat from your shell.

### The browser extension

Download the extension archive, then load it unpacked: unzip it, open the browser's
extensions page, enable **Developer mode**, click **Load unpacked**, and select the folder.
Open the popup and **Connect (sign in)** — it authenticates through your normal login and a
**Browser** device appears under **Settings → Devices**. Select it in a chat to give the
assistant the browser tools.

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
