# Integrations

The admin **Integrations** page is where you govern *which* integration domains
exist on the platform and *how* they may be used — independent of any individual
user's setup. It opens the same integration manager as user Settings, but in
`global` scope with governance controls turned on.

!!! note
    This page is about **governance**. Setting up a concrete integration
    *instance* (entering credentials, picking calendars, etc.) is done by users —
    or by you — under **Settings → Integrations**. The two surfaces share the same
    component, but only this admin page exposes the per-domain policy controls.

## What you see

Every installed integration domain is listed (the full catalog, not just the
configured ones). Each row shows:

- the integration `name`, its `integration_type`, and version,
- the **required trust tier** as a badge (see below),
- how many global instances are configured, and
- a warning when the domain is blocked (`disabled by admin` or
  `not allowed for this scope`).

Expanding a row reveals the **Governance (admin)** section plus the integration's
configured global instances.

## Governance controls

These settings live on the integration domain itself (the `integrations` table
overlay) and apply platform-wide. The manifest sync never overwrites them, so
your choices stick across upgrades. Changes are written through
`PATCH /admin/integrations/{domain}` and recorded in the audit log.

| Control | Effect |
| --- | --- |
| **Enabled toggle** | Globally enable or disable the domain. Disabling it blocks every scope — users can no longer configure or use it. |
| **Allowed scopes** | Which scopes may configure the integration: `user`, `group`, `org`, `global`. Removing `user` forbids users from setting it up for themselves; the integration is then only available where an admin/global instance exists. |

A domain is treated as **blocked** when it is disabled, or when the current scope
is not in its allowed scopes — blocked domains cannot have new instances added.

### Required trust tier

The **required trust tier** is **read-only** here: it is declared by the
integration's manifest (`required_tier`), not set by the admin. It is the minimum
model trust tier needed to use the integration's tools, and it feeds the
fail-closed governance gate (`provider_tier >= required_tier`) that decides
whether a resolved model is cleared to assemble this integration's tools. Tiers
are ordinal (`unregulated` 0 &lt; `regulated` 1 &lt; `internal` 2) and shown by
name:

| Tier | Label |
| --- | --- |
| `unregulated` | Unregulated |
| `regulated` | Regulated |
| `internal` | Internal |

## Managing global instances

Because the page runs in `global` scope, any instance you configure here is a
**global integration** — available to all users. Within a domain you can:

- **Add** / **Add another** instance (opens the integration's config flow; some
  integrations are single-instance and say so once one exists),
- enable or disable an individual instance,
- **Reconfigure** or **Remove** an instance,
- toggle **inbox triage** for comms accounts (messages still sync when off, but
  are not triaged into the inbox),
- see per-instance connection **health** (a warning icon appears for degraded or
  unreachable connections).

## Admin vs. user setup

| | Admin → Integrations | Settings → Integrations |
| --- | --- | --- |
| Scope | `global` | `user` (optionally `group`) |
| Governance controls | Yes — enable, allowed scopes | No |
| Trust tier | Shown (manifest-declared) | Shown |
| Instances created | Available to all users | Just for that user / group |

Use this page to decide what integrations the platform offers and on what terms;
leave individual credential setup to users in their own Settings.
