# User management

The **User management** page (admin console → `User management`) is a read-only
roster of everyone who has signed in to this Personal Agent deployment. It gives
admins a cross-tenant overview of the platform's user base — who exists, their
email and display name, and when they first joined.

The page is visible only to principals holding the `admin` role. Every endpoint
it calls (`GET /admin/users`) is gated on that role at the router level, and the
admin view deliberately reads **across all organizations** rather than a single
tenant.

## What the table shows

The page loads up to the 500 most recently joined users (newest first) into one
sortable, paginated table (25 rows per page).

| Column | Field | Notes |
| --- | --- | --- |
| `Email` | `email` | Shown with a two-letter avatar derived from the email (or `sub`). Falls back to `—` if absent. |
| `Name` | `display_name` | The user's display name, or `—` if not set. |
| `Subject` | `sub` | The stable Keycloak subject id — the identity key for every user-scoped record. |
| `Joined` | `created_at` | The date (YYYY-MM-DD) the user row was first provisioned. Sortable. |

`Email` and `Joined` are sortable; the avatar initials are computed locally from
the email or subject.

## How users get created

There is **no "create user" or "invite" action on this page** — Personal Agent
has no separate registration flow. Identity is owned by Keycloak (OIDC). A
`users` row is **lazily provisioned on first valid token**: the first time
someone presents a valid Keycloak access token, the API upserts a row keyed by
the token's `sub`, recording their `email`. On every subsequent login the email
is refreshed from the token, so the roster stays current automatically.

This means a user appears on this page only after they have actually signed in at
least once — not when they are created in Keycloak.

## Roles and access

Roles are **not stored or edited in Personal Agent** — they come from the
Keycloak token. The API recognizes three application roles, mapped from
Keycloak realm/client roles:

| Role | Meaning |
| --- | --- |
| `user` | Every authenticated principal (always granted). |
| `admin` | Platform admin — may reach the admin console and the `/admin/*` endpoints. |
| `org-admin` | Organization-level admin. |

The roster intentionally does **not** display a role column or any role/enable
/disable/delete controls.

!!! note "User lifecycle lives in Keycloak"
    To grant or revoke the `admin` role, disable an account, reset credentials,
    or remove a user, do it in **Keycloak** (the identity provider), not here.
    Personal Agent reflects identity and roles from the token on the next login;
    it does not mutate them. This page is observational only.

!!! warning "Granting admin is powerful"
    Anyone with the `admin` role can read across **all** organizations from the
    admin console (the page bypasses per-tenant row-level isolation by design).
    Treat the `admin` role in Keycloak accordingly.

## Related

- Per-user token and cost usage is in the admin console's usage/overview pages
  (`GET /admin/usage`), keyed by the same `sub`.
- Organization-level governance (minimum model trust tier) is configured on the
  Groups/organization pages, not here.
