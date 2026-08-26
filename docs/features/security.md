# Security & privacy

Personal Agent is built so you stay in control of what the assistant does and where your
data goes. This page is the user-facing view; the engineering guarantees behind it are in
[Frozen contracts](../architecture/frozen-contracts.md).

## Local-first deployment and an explicit trust boundary

Personal Agent treats the instance you choose as the system of record for chats, memory, workflows
and credentials. You can run the full core stack on infrastructure you operate and connect local or
on-prem model, speech and integration endpoints. Browser, desktop, terminal, mobile and voice
clients connect back to that instance instead of turning a vendor cloud into a second chat store.

External models and integrations remain available when you deliberately enable them. They are
explicit egress paths, not a prerequisite: provider trust tiers and the effective data requirement
decide what may leave the deployment boundary. An **Internal** chat is limited to the internal /
on-prem tier; when no eligible provider exists, the request stops rather than silently falling back
to an external model.

Here, *local first* describes deployment ownership and the primary data boundary, not an offline-only
client architecture. Clients need a connection to the selected instance, and choosing a hosted
deployment means choosing its operator as part of that boundary.

## You gate what tools do

Every chat runs in a **security mode** you choose per chat (with a default under
**Settings → Profile**):

| Mode | What it means for you |
| --- | --- |
| **Autonomous** | The agent runs tools without asking - fastest, most hands-off |
| **Approve each** | You approve (or reject) every tool call, inline in the chat |
| **Judge (LLM)** | A safety model reviews each call before it runs |

When approval is needed, **Always allow** adds a standing allow-rule scoped to that chat,
so the same command runs without asking again. A catastrophic-command deny floor (the admin
[command policy](#governance-set-by-your-admin-or-organization)) still applies in *every*
mode, including Autonomous, so a `deny` rule is never bypassed.

## Your data stays yours

- **Memory is private to you**, with database-level isolation. Each chat further chooses its
  memory access - **Full** (default), **Scoped** (limited to chosen domains/sources), or
  **None**, a clean-room chat that reads no memory and learns nothing. See
  [Memory & entities](memory.md) and [Chat controls](chat-controls.md#memory-access).
- **Sensitive data stays on cleared models.** Mark a chat **Internal** (or a document
  **Confidential**) and it is restricted to internal-tier (on-prem) models, so the data never
  leaves your infrastructure. This is **fail-closed**: there is no path to a provider that
  isn't cleared for the data's classification - and it holds for normal chats, automatic model
  selection, fallbacks, sub-agents and background workflows alike. Confidential documents are
  also withheld from retrieval (RAG) in any chat whose model isn't cleared for them.
- **Your keys are encrypted.** Provider keys and integration secrets are envelope-encrypted,
  decrypted only in-process for your runs, and never shown back to you, written into logs, or
  included in durable run history.

## Protection from untrusted content

When a run includes an **untrusted** toolset (a user-registered MCP server or external API,
whose output is a prompt-injection vector), high-privilege tools are automatically **dropped**
from that whole run, so a malicious page can't trick the agent into, say, sending a message,
fetching an arbitrary URL, writing memory, deleting things, or fanning out to sub-agents. The
gate engages as soon as one untrusted server is in the toolchain. You don't have to do
anything; it's on by default.

## Extra guardrails on tools

Beyond the security mode, a couple of always-on checks make tool calls safer:

- **Argument validation on high-stakes tools** - some tools validate the model's arguments
  *before* any device or database action happens, so a bad call is bounced back for the
  model to self-correct rather than executed. For example, a device setpoint must be a
  finite number, and a memory-graph traversal is capped at depth 1-3 so it can't fan out
  across the whole graph.
- **Read vs. write is explicit** - every first-party tool declares whether it only *reads*
  or also *writes*. This classification feeds the gating above (read-only sub-agents, the
  untrusted-content drop, approval prompts) so a read-only context can never quietly perform
  a write.

## Governance (set by your admin or organization)

Some limits are set above you, and you can only make them **stricter**, never looser:

- **Trust tiers** - every provider has a clearance tier (*unregulated* < *regulated* <
  *internal*), and every chat, document, integration and org floor declares the minimum tier
  it requires. A capability or model is only offered when the provider's tier satisfies it.
  This one ordinal axis is the whole data-governance gate.
- **Org trust-tier floor** - your organization can require a minimum tier every chat inherits
  (a chat can be stricter, never weaker).
- **Command policy** and **budgets** - admins can `allow`/`require_approval`/`deny` specific
  commands (first match wins, applied in every security mode) and cap monthly spend per user,
  org, or globally (exceeding the cap returns a 429).

Governance changes are audit-logged, and when a capability is withheld the agent is told
why - so it can explain it to you rather than failing silently. See the
[Admin console](../administration/index.md) for how these are configured.
