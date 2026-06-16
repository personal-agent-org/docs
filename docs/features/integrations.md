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
| **GitHub** | PRs/issues as RAG-indexed entities + create/review/comment tools + a workflow-triggerable webhook |
| **Web search** | Tavily / Brave / DuckDuckGo as interchangeable `web_search` providers (Tavily also provides `web_fetch`) |
| **Inbox channels** | Signal, Matrix, Zulip, WhatsApp |
| **Calendar / projects** | CalDAV, OpenProject, TED |
| **Sensors & devices** | Phone sensors, Shelly, HTTP fetch, Met.no weather |

## MCP — both directions

- **As a client** — stdio built-ins plus user/org Streamable-HTTP servers
  (static-Bearer or OAuth + PKCE, tokens envelope-encrypted and auto-refreshed),
  selectable per chat. MCP servers freeze into the **RunSpec** at run start, so
  they work unchanged in **durable runs and triggered workflows** — with token refresh
  happening inside the activity and the same **untrusted-content gating** dropping
  high-privilege tools when an untrusted MCP source is in the run.
- **As a server** — Personal Agent exposes itself at **`/api/mcp`** (Streamable HTTP)
  with a curated, read-mostly tool surface for external clients. Two auth paths:
  - **Keycloak OAuth 2.1 (primary).** OAuth-capable clients (Claude, …) just get the
    URL: a 401 returns an RFC 9728 `WWW-Authenticate: Bearer resource_metadata=…`
    challenge pointing at `/api/mcp/.well-known/oauth-protected-resource`, which
    advertises the Keycloak realm as the authorization server. The client runs the
    standard Auth-Code+PKCE (or device-grant) flow against the pre-registered
    `personal-agent-mcp` realm client (audience `personal-agent-api`), and the access
    token is validated by the **same `TokenVerifier`** as the rest of the API — no
    second credential to manage. Sign-in, MFA, revocation and lifetimes are Keycloak's.
    Headless/CLI clients are covered too: the `personal-agent-mcp` client enables the
    **OAuth 2.0 Device Authorization Grant** (RFC 8628), so a terminal tool signs in by
    showing a code the user confirms in a browser — add `offline_access` for a long-lived
    refresh token. The resulting access token validates the same way (no special path).
  - **Personal Access Tokens (last-resort fallback).** Only for tools that can't do OAuth
    at all — mint a `pa_pat_…` token in Settings (only the hash is stored).
