# Integrations

Integrations are a **folder tier**, not a hard-coded list. Each integration is a
self-contained folder under `integrations/<domain>/`.

## Anatomy of an integration

Each folder declares:

- a **`manifest.yaml`** (domain, name, what it provides, required provider tags);
- a typed **config flow** (entity/device/area/date/duration/color selectors)
  rendered automatically in Settings, with secrets stored BYOK-encrypted, and
  **reconfigure / reload in place** without a restart;
- optional **entities** (RAG-indexed, with state history + events) and **tools**;
  integrations can also **contribute skills and delegatable agents**, installed /
  removed with their config entries (scope-inherited, user content always wins);
- **folder-based discovery** — bundled in-tree integrations under `integrations/`
  plus operator-approved external **drop-in** dirs, no core changes needed.

!!! example "The point is the *system*"
    Drop in a folder with a manifest + config flow and it shows up configured and
    callable — no core changes needed.

## Integration governance (admin-owned)

Admins govern every integration from its own admin page, independent of what the
manifest says:

- **Enable/disable** platform-wide.
- Restrict **which scopes may configure it** (removing `user` forbids personal
  entries — existing ones are skipped at run assembly, restored when re-allowed).
- **Add required provider tags** on top of the manifest's (effective = manifest ∪
  admin — admins can tighten, never loosen; fail-closed).

The manifest sync never overwrites these settings, and changes are audit-logged.

## Two patterns on top

- **Capability providers** — an integration advertises a generic capability like
  `web_search` / `web_fetch` and the highest-precedence configured provider
  fulfils it (user > org > global), so the agent calls one stable tool regardless
  of vendor.
- **Untrusted-content gating** — tools that ingest external content are tagged, and
  high-privilege tools are dropped from any run that also pulls untrusted content.

## Representative bundled integrations

| Integration | What it brings |
| --- | --- |
| **Email** | Triage with human-approved draft replies — the canonical inbox channel |
| **GitHub** | PRs/issues as RAG-indexed entities + create/review/comment tools + an automation-triggerable webhook |
| **Web search** | Tavily / Brave / DuckDuckGo as interchangeable `web_search` providers (Tavily also provides `web_fetch`) |
| **Inbox channels** | Signal, Matrix, Zulip, WhatsApp |
| **Calendar / projects** | CalDAV, OpenProject, TED |
| **Sensors & devices** | Phone sensors, Shelly, HTTP fetch, Met.no weather |

## MCP — both directions

- **As a client** — stdio built-ins plus user/org Streamable-HTTP servers
  (static-Bearer or OAuth + PKCE, tokens envelope-encrypted and auto-refreshed),
  selectable per chat. MCP servers freeze into the **RunSpec** at run start, so
  they work unchanged in **durable runs and automations** — with token refresh
  happening inside the activity and the same **untrusted-content gating** dropping
  high-privilege tools when an untrusted MCP source is in the run.
- **As a server** — Personal Agent exposes itself at **`/api/mcp`** with a curated,
  read-mostly tool surface for external clients, authenticated by **Personal Access
  Tokens** minted in Settings (only the hash is stored).
