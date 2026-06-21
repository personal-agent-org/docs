# Groups

**Groups** are admin-configured teams. A group is a named set of members who share
access to resources: folders, and through them the chats and workflows inside those
folders, plus group-scoped integration configuration and world-memory. Members are
assigned either automatically from the identity provider (via a Keycloak group path
carried in the login token) or pinned manually by an admin.

The page lives in the admin console under **Groups**. It lists every group as an
expandable row showing the group name, its Keycloak path badge (if set), the member
count, and edit/delete actions.

## Creating, editing, and deleting a group

Use **Add** to open the *New group* dialog, or the pencil icon on a row to **Edit**.
A group has three fields:

| Field | Maps to | Notes |
| --- | --- | --- |
| `name` | display name | Required. |
| `description` | free text | Optional; shown under the group name. |
| `external_ref` | Keycloak group path | Optional. Drives OIDC auto-assignment (see below). Labelled *Keycloak group path* in the UI. |

The delete (trash) icon removes the group after a confirmation. Deleting a group does
not delete its shared resources — **folders revert to private** when their group is
removed.

## Members and roles

Expand a group row to manage its members. Each member shows their email (or subject
id), a **source** badge, a role selector, and a remove (✕) button. To add a member,
pick a user from the searchable dropdown, choose a role, and click **Add**.

A member's **source** is one of:

- **OIDC** — synced from the login token's group claim. Managed automatically; do not
  hand-edit (the next login reconciles it).
- **manual** — pinned by an admin. Never removed by the OIDC sync, even if the user
  loses the matching token path.

Roles are:

| Role | Access |
| --- | --- |
| `owner` | Full read/write on shared resources. |
| `editor` | Read/write. Default for newly added and OIDC-synced members. |
| `viewer` | Read-only. |

!!! note
    The role dropdown here is the only place a member can be set to read-only
    `viewer`. The OIDC login sync only ever assigns the default `editor` — unless the
    identity provider explicitly signals the viewer tier (see below).

## OIDC auto-assignment

Set a group's `external_ref` to a Keycloak group path (for example `/engineering`).
On login, any user whose token carries that path in its groups claim is **automatically
added** to the group with source **OIDC**, as an `editor`.

This reconciles on every login: a user who no longer carries the path loses their OIDC
membership, while admin-pinned **manual** members are left untouched. A child path with
the `/viewers` suffix (for example `/engineering/viewers`) grants the group as a
read-only `viewer` instead; if a user matches both the parent path and the viewers
child, least privilege wins.

!!! note
    The identity provider is the source of truth for OIDC members' roles — change a
    user's Keycloak groups, and their role updates on next login. To override that
    permanently, add them as a **manual** member.

## What groups share

Resources can be scoped to a group so that all members get shared access according to
their role:

- **Folders** — and through them the **chats** and **workflows** they contain.
- **Integration configuration** scoped to the group.
- Group-scoped **world-memory** proposals and entries.

`owner` and `editor` members may write to group-scoped resources; `viewer` members
have read-only access.
