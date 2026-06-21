# Security & privacy

Personal Agent is built so you stay in control of what the assistant does and where your
data goes. This page is the user-facing view; the engineering guarantees behind it are in
[Frozen contracts](../architecture/frozen-contracts.md).

## You gate what tools do

Every chat runs in a **security mode** you choose per chat (with a default under
**Settings → Profile**):

| Mode | What it means for you |
| --- | --- |
| **Autonomous** | The agent runs tools without asking — fastest, most hands-off |
| **Approve each** | You approve (or reject) every tool call, inline in the chat |
| **Judge (LLM)** | A safety model reviews each call before it runs |

When approval is needed, **Always allow** lets you whitelist a specific command on a
specific [device](devices.md) so you're not asked again for it.

## Your data stays yours

- **Memory is private to you**, with database-level isolation. Each chat further chooses how
  much memory it can read — including **None**, a clean-room chat that learns nothing. See
  [Memory & entities](memory.md) and [Chat controls](chat-controls.md#memory-access).
- **Confidential** chats and documents are restricted to **local-only** models, so sensitive
  data never leaves your infrastructure. This is **fail-closed**: there is no path to a
  provider that isn't cleared for the data's classification — and it holds for normal chats,
  automatic model selection, fallbacks, sub-agents and background workflows alike.
- **Your keys are encrypted.** Provider keys and integration secrets are envelope-encrypted,
  decrypted only in-process for your runs, and never shown back to you, written into logs, or
  included in durable run history.

## Protection from untrusted content

When a run pulls in **untrusted content** — a web page, an external MCP server, an incoming
message — high-privilege tools are automatically **dropped** from that run, so a malicious
page can't trick the agent into, say, deleting files or sending money. You don't have to do
anything; it's on by default.

## Governance (set by your admin or organization)

Some limits are set above you, and you can only make them **stricter**, never looser:

- **Data classification floor** — your organization can require a minimum classification for
  every chat.
- **Provider governance tags** — providers are tagged for what they're cleared for (for
  example, *local*, *eu*, *no-train*); tools and integrations require tags, and a capability
  is only offered when the provider clears them.
- **Command policy** and **budgets** — admins can forbid certain commands outright and cap
  monthly spend.

Governance changes are audit-logged, and when a capability is withheld the agent is told
why — so it can explain it to you rather than failing silently. See the
[Admin console](../administration/index.md) for how these are configured.
