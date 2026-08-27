# Authoring surfaces & cards

A **Surface** is a single, Lovelace-inspired declarative layout that powers two things that
used to be separate: a **chat mode** and a **dashboard**. A chat mode is just a Surface that
contains a `chat` view; a pure dashboard is the same shape *without* a `chat` view. This page is
the developer reference for the data model, the config blob, how integrations contribute
surfaces, and the card model underneath it all.

The core design rule is worth stating up front, because it shapes everything else:

!!! warning "No code branches on a surface id"
    Nothing in the code may key off a specific slug (`"coding"`, `"standard"`, …). The built-in
    surfaces are seeded rows, identical *in kind* to a user-defined one — `builtin=true` only marks
    them as code-owned/seed-managed and grants **no** special code path. Every behavior derives from
    a surface's *declared* config: which views it has, the `chat` view's `agent` overlay, and the
    declared `capabilities`. If you find yourself writing `if surface.slug == …`, push it into a
    declared property instead.

## The Surface model

A Surface mirrors the HA two-layer split: a lightweight **metadata** layer plus a heavy
**config** blob. The columns (backend repo `src/personal_agent/db/models/surface.py`) are:

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | `String(128)` | Display name shown when picking a mode / listing dashboards. |
| `slug` | `String(64)` | Stable handle (`<scope>+<owner>+slug` unique; global slugs unique via a partial index). |
| `icon` | `String(64)?` | Material icon name. |
| `description` | `Text` | Shown to the user; default `""`. |
| `kind` | `String(16)` | `"mode"` or `"dashboard"` — **derived** from the config, stored for cheap filtering. |
| `config` | `JSONB` | The Lovelace-style layout blob (`{views, arrangement}` or `{strategy}`). The heavy layer. |
| `show_in_nav` | `bool` | Listed as a drawer/dashboard entry (HA `show_in_sidebar`); mostly for dashboards. |
| `require_admin` | `bool` | Admin-only visibility. |
| `builtin` | `bool` | Seeded, code-owned (re-synced on boot). Read-only name/config for non-admins. No special code path. |
| `source_domain` | `String(128)?` | Set when projected from an integration's `surfaces()` (the integration domain). Read-only; lifecycle follows the config entry. |
| `scope` | `String(16)` | `"global"` (admin-managed, everyone) or `"user"` (self-service, owner-only). |
| `owner_sub` | FK `users.sub` | Non-null for user surfaces; null for globals. |
| `org_id` | FK `organizations.id` | Tenant scoping (RLS via `tenant_isolation`). |
| `enabled` | `bool` | Soft-disable without deleting. |

Scoping mirrors `DelegatableAgent` exactly. `kind` is never set by hand — it is computed by
`surface_kind(config)`, which returns `KIND_MODE` iff any view has `type == "chat"`, otherwise
`KIND_DASHBOARD`.

```python
from personal_agent.db.models.surface import surface_kind, KIND_MODE, KIND_DASHBOARD

surface_kind({"views": [{"type": "chat"}]})           # "mode"
surface_kind({"views": [{"type": "sections"}]})        # "dashboard"
```

`SurfaceRepo` (backend repo `src/personal_agent/db/repositories/surface_repo.py`) is the access layer. Note one deliberate
difference from delegatable agents: `list_visible` **includes** builtins — a builtin surface like
`coding` is a normal selectable option, not a hidden default. `get_by_slug` resolves a slug for a
principal with the user's own surface winning over a global of the same slug.

### HTTP API

Two routers expose surfaces, both under the `/api/v1` prefix (backend repo
`src/personal_agent/api/routers/surfaces.py` for the user surface, `admin_surfaces.py` for the
global one):

| Method + path | Scope | Notes |
| --- | --- | --- |
| `GET /surfaces` | user + globals | A user's own surfaces plus the visible globals (`list_for_user`). |
| `GET /surfaces/{id}` | user + globals | A global or the caller's own; otherwise `404`. |
| `POST /surfaces` | user | Creates a `scope="user"` surface (slug from the name; duplicate name → `409`). |
| `PATCH /surfaces/{id}` | user | Owner-only (`403` otherwise); editing the name re-slugs. |
| `DELETE /surfaces/{id}` | user | Owner-only. |
| `GET·POST·PATCH·DELETE /admin/surfaces[/{id}]` | global | `Role.ADMIN`-gated; manages `scope="global"` rows only. |

`kind` is always recomputed from the posted `config` via `surface_kind` on create/update - the
client never sends it. The request body (`SurfaceCreate` / `SurfaceUpdate`,
`src/personal_agent/api/schemas/surface.py`) carries `name`, `description`, `icon`, `config`,
`show_in_nav`, `require_admin`, `enabled`; `SurfaceOut` adds the derived `id`, `slug`, `kind`,
`builtin`, `scope`, `owner_sub`, and timestamps.

## The config blob

`config` is a Lovelace dashboard config, extended with an `arrangement` for the side-by-side
desktop layout and the new stateful view types. The frontend shape lives in the frontend repo at
`src/stores/surfaces.ts`:

```jsonc
{
  "views": [
    { "type": "chat",      "icon": "chat",      "title": "Chat", "agent": { /* overlay */ } },
    { "type": "workspace", "icon": "code",      "title": "Workspace" },
    { "type": "cards",     "icon": "dashboard", "title": "Cards",
      "sections": [ { "type": "grid", "cards": [ /* HA cards */ ] } ] }
  ],
  "arrangement": {
    "layout": "split",                                  // "split" | "single"
    "items": [
      { "view": 0, "weight": 55 },                      // index into views[], weight, optional group
      { "view": 1, "weight": 45 }
    ]
  }
}
```

A **pure dashboard** is the same shape with no `chat` view (often a single `cards` view and
`arrangement.layout: "single"`). A **strategy-driven** surface replaces `views` with a
`strategy` block (see [Strategies](#strategies-generated-layouts)).

### Region / view types

`views[]` is the single source that drives both layouts. The renderer maps each view's `type` to
a component via the **surface-view registry**
(frontend repo `src/components/surfaces/surface-view-registry.ts`), mirroring HA's `create-element`
factory:

| `type` | Renderer | Notes |
| --- | --- | --- |
| `chat` | (chat panel, inside a chat context) | The LLM conversation. At most one per surface; its presence makes the surface a *mode*. Carries the `agent` overlay. |
| `cards` / `sections` / `grid` / `masonry` | `CardsSurfaceView` | A region of HA cards. Renders standalone (no chat needed). These are the `STANDALONE_VIEW_TYPES`. |
| `editor` / `terminal` / `workspace` | `WorkspaceSurfaceView` | Monaco / PTY / the combined `WorkspacePanel`. Real panel inside a chat (`chatContext`); a placeholder otherwise. |
| anything else | `PlaceholderSurfaceView` | Fallback for unknown types and for `chat`/`editor`/`terminal` rendered standalone. |

!!! note "Domain widgets are cards, not view types"
    Anything domain-specific (a TradingView chart, a vendor widget) is a **card** inside a `cards`
    region, contributed through the card/integration system — never a bespoke hardcoded view type.
    The registry intentionally holds only the core region types.

The three workspace view types (`editor`, `terminal`, `workspace`) are special: they imply a
per-chat workspace. The backend resolver treats `{"editor", "terminal", "workspace"}` as
`_WORKSPACE_VIEW_TYPES`.

### Arrangement → desktop split / mobile tabs

`SurfaceLayout.vue` turns the config into one ordered list of regions that drives **both**
layouts:

- **Desktop**: regions render side-by-side as weighted flex panes (`flex: <weight> 1 0`), with
  vertical separators between them.
- **Mobile** (`$q.screen.lt.md`): the same list becomes **bottom tabs**, one per region, in
  `arrangement` order.

If `arrangement.items` is present it sets order + weights (each item's `view` is an index into
`config.views`); otherwise the layout falls back to `views[]` in order with equal weight. There
is no per-mode special-casing — coding's `chat | workspace` split and a dashboard's single
`cards` view go through the exact same code.

### The chat view's `agent` overlay

When a surface has a `chat` view, that view's `agent` block carries the per-mode agent behavior —
the dynamic replacement for the hardcoded coding branches. The backend reads it through
`src/personal_agent/agent/surface_resolver.py`:

```jsonc
"agent": {
  "instructions": "…",          // surface_instructions()
  "model_tags": ["coding"],      // surface_model_tags() — biases auto-model
  "capabilities": ["coding", "workspace"]  // surface_capabilities()
}
```

| Helper | Returns |
| --- | --- |
| `surface_chat_agent(surface)` | The `chat` view's `agent` dict, or `{}`. |
| `surface_instructions(surface)` | `agent.instructions` as a string. |
| `surface_model_tags(surface)` | `agent.model_tags` as a list of strings. |
| `surface_capabilities(surface)` | `agent.capabilities` as a set; **`workspace` is added automatically** if any `editor`/`terminal`/`workspace` view is present. |
| `surface_needs_workspace(surface)` | `True` iff a workspace view exists or the `workspace` capability is declared. |

Every helper accepts **either** a `Surface` (reads `.config`) **or** a plain config dict, so a
caller can transparently pass a per-chat override.

### Resolving a chat's surface (+ per-chat override)

`resolve_chat_surface(session, chat)` maps `chat.mode` to a `Surface`:

- `None` / `"standard"` → the standard builtin (by slug)
- `"coding"` → the coding builtin (by slug)
- a UUID string → a Surface by id
- anything else → a Surface by slug (the user's own wins over a global)

`effective_surface_config(chat, surface)` picks the config to actually use: a per-chat
`chat.run_config["surface_config_override"]` (a full config the user extended *live* in that chat,
with non-empty `views`) wins; otherwise the shared surface's config. This lets one chat extend its
own layout without mutating the shared Surface or affecting other chats.

## Built-in surfaces (seed)

`standard` and `coding` ship as global, `builtin=True` surfaces seeded as **data**
(backend repo `src/personal_agent/db/seed/surface_seed.py`). They are **code-owned**: their `config`/`name`/`icon` are re-synced
from the code on every boot (`seed_builtin_surfaces`), while `id`/`slug`/`enabled`/`scope` are
left alone. An admin who wants a tweaked coding mode should **clone** it into a user/global
surface rather than edit the builtin — the re-sync would overwrite an edit.

The coding builtin is the canonical example of "behavior as data": its `chat` view's `agent`
overlay carries `CODING_BEHAVIOR` instructions, `model_tags: ["coding"]`, and
`capabilities: ["coding", "workspace"]`, and it has a `workspace` view. Everything that used to
be `if mode == "coding"` derives from those declarations.

## Integration-contributed surfaces

An integration contributes surfaces the same way it contributes delegatable agents: it overrides
`surfaces()` to return a map of stable keys → `SurfaceDescriptor`
(backend repo `src/personal_agent/integrations/integration.py`):

```python
@dataclass(frozen=True)
class SurfaceDescriptor:
    name: str
    config: dict[str, Any]      # the Lovelace-style {views, arrangement} blob
    icon: str | None = None
    description: str = ""
    show_in_nav: bool = False
```

On config-entry setup, `_project_surfaces` (backend repo `src/personal_agent/integrations/contrib.py`) projects each descriptor
into the `surfaces` table:

- the slug becomes `<domain>-<key>` (via `surface_slugify`);
- `scope` follows the entry (a user-scoped entry → user surfaces, a global/org entry → globals);
- `kind` is derived from the config (`surface_kind`);
- the row is stamped with `source_domain = <domain>` and `builtin = False`.

Projected rows are **read-only** (re-projected on reconfigure) and their lifecycle follows the
config entry: created on setup, removed when the last entry of the domain goes. A slug collision
with a row owned by a *different* domain is logged and skipped.

### Example: the TradingView surface

`integrations/tradingview/__init__.py` (backend repo) is the reference second example (after coding). It
contributes a surface that is **chat beside a live chart**, with the chart rendered through the
generic `iframe` card inside a `cards` region — *not* a bespoke view type:

```python
def surfaces(self) -> dict[str, SurfaceDescriptor]:
    return {
        "trading": SurfaceDescriptor(
            name="Trading",
            icon="candlestick_chart",
            description="Chat beside a live TradingView chart.",
            config={
                "views": [
                    {"type": "chat", "icon": "chat", "title": "Chat",
                     "agent": {"instructions": _TRADING_BEHAVIOR, "capabilities": ["trading"]}},
                    {"type": "cards", "icon": "candlestick_chart", "title": "Chart",
                     "cards": [{"type": "iframe", "url": _TV_EMBED, "height": 760, "w": 12, "h": 20}]},
                ],
                "arrangement": {"layout": "split",
                                "items": [{"view": 0, "weight": 55}, {"view": 1, "weight": 45}]},
            },
        )
    }
```

The integration also contributes a delegatable agent gated to the surface via
`requires_surface="tradingview-trading"` (matched against the *projected* slug).

## The card model

A `cards` region holds Home Assistant Lovelace cards — a faithful port unchanged by surfaces. The
config shapes are in the frontend repo at `src/lib/dashboard/types.ts`; the type → component map, picker
metadata, config schemas and stub configs are in
`src/components/dashboard/card-registry.ts`.

### Adding a card type

Register the card in **all four** maps in `card-registry.ts`:

| Map | Purpose |
| --- | --- |
| `cardRegistry` | `type` → the (async) Vue component. |
| `CARD_META` | Picker `{ label, icon, description }`. |
| `cardSchemas` | The config-form fields (`CardField[]`: `text`/`textarea`/`number`/`entity`/`json`/`area`/`device`/`scene`/`action`/`features`). |
| `stubConfig(type)` | The default config + grid size for a freshly-added card. |

For the sections layout, also give the card sensible defaults in `CARD_GRID_DEFAULTS` (a 12-column
grid, 56px rows); `gridOptionsFor(card)` merges those defaults with the card's explicit
`grid_options`.

The card families currently registered include data widgets (`markdown`, `heading`, `entity`,
`entities`, `glance`, `sensor`, `gauge`, `history`, `calendar`, `clock`, `weather-forecast`,
`map`, picture cards…), interactive entity controls (`tile`, `toggle`, `number`, `select`,
`text`, `counter`, `datetime`, `light`, `thermostat`, `alarm-panel`, `media-control`…), registry
cards (`area`, `device`), and container/conditional cards (`vertical-stack`, `horizontal-stack`,
`grid`, `conditional`).

### Conditions (visibility)

Every `DashboardCard`, `BadgeConfig` and `SectionConfig` may carry a `visibility: Condition[]`.
The engine is the frontend repo `src/lib/dashboard/conditions.ts`, a port of HA's condition validator. The
top level is an **AND** (all must hold). Supported conditions:

| `condition` | Fields | Holds when |
| --- | --- | --- |
| `state` | `entity`, `attribute?`, `state` / `state_not` | The entity (or attribute) state is in / not in the listed value(s). |
| `numeric_state` | `entity`, `attribute?`, `above?`, `below?` | The numeric state is within the bounds. |
| `screen` | `media_query` | `window.matchMedia(query).matches`. |
| `time` | `after?`, `before?`, `weekdays?` | Current time is in range (handles crossing midnight) and weekday matches. |
| `and` / `or` / `not` | `conditions[]` | Boolean composition of nested conditions. |

A legacy shorthand (`{entity, state, state_not}` without a `condition:` key) is also accepted. Use
`checkConditionsMet(conditions, env)` to evaluate against a `ConditionEnv` (which supplies the
entity lookup); `extractConditionEntityIds` / `extractConditionMediaQueries` tell you what to
subscribe to for live updates. `CardWrapper.vue` wires conditions to rendering: in view mode a
card whose conditions are unmet is hidden; in edit mode it is shown dimmed with an "hidden by
condition" chip.

### Tap / hold actions

Interactive cards (e.g. `tile`, `button`, badges) take `ActionConfig` slots — typically
`tap_action`, `hold_action`, `double_tap_action`, `icon_tap_action`. The shape
(`lib/dashboard/types.ts`):

| `action` | Extra fields | Effect |
| --- | --- | --- |
| `more-info` | `entity?` | Open the entity detail dialog. |
| `toggle` | — | Toggle the bound entity. |
| `navigate` | `navigation_path` | Navigate within the app. |
| `url` | `url_path` | Open an external URL. |
| `perform-action` | `perform_action`, `data?`, `entity?` | Call a named entity action with a payload. |
| `assist` | — | Open the main chat (our equivalent of HA's voice assistant). |
| `none` | — | No-op. |

Any action may carry `confirmation` (a `boolean` or `{ text? }`) to require a confirm step.

## Strategies (generated layouts)

A dashboard, view, or section can be **generated** instead of static via a `strategy` block
(`config.strategy = { type, … }`). The frontend repo `src/lib/dashboard/strategies.ts` ports HA's
`original-states` and `areas` generators against Personal Agent entities/areas:

- `original-states` — one `sections` view, one section per entity domain.
- `areas` — a "Bereiche" overview view plus one subview per area.

`generateStrategyViews(strategy, ctx)` runs against a `StrategyContext` (`{ entities, areas }`) —
the analog of HA's `hass`. `materializeStrategy(config, ctx)` "takes control" by freezing the
generated views into the stored config so the user can hand-edit it; `isStrategyConfig(config)`
reports whether a config is strategy-driven.

## Edit mode

The surface editor reuses the dashboard editor. `SurfaceLayout.vue` accepts an `editing` flag and
a `SurfaceEditController` (`edit`) that owns structural region ops (`addRegion`, `removeRegion`,
`moveRegion`, `setWeight`). Card-level edit ops (`editCard`, `duplicateCard`, `moveCardDialog`,
`copyCard`, `cutCard`, `removeCard`) come from the dashboard edit API surfaced through
`CardWrapper.vue`. The host (page) owns undo/redo and save — the layout only emits structural
changes.

## Quick reference

| Concern | Where |
| --- | --- |
| Surface model | backend repo `src/personal_agent/db/models/surface.py` |
| Surface repo | backend repo `src/personal_agent/db/repositories/surface_repo.py` |
| HTTP API | backend repo `src/personal_agent/api/routers/surfaces.py`, `admin_surfaces.py` (DTOs `api/schemas/surface.py`) |
| Surface resolver + overlay helpers | backend repo `src/personal_agent/agent/surface_resolver.py` |
| Builtin seed | backend repo `src/personal_agent/db/seed/surface_seed.py` |
| Integration contribution | backend repo `src/personal_agent/integrations/integration.py` (`SurfaceDescriptor`, `surfaces()`), `src/personal_agent/integrations/contrib.py` (`_project_surfaces`) |
| Layout / regions | frontend repo `src/components/surfaces/SurfaceLayout.vue`, `surface-view-registry.ts` |
| Frontend types | frontend repo `src/stores/surfaces.ts`, `src/lib/dashboard/types.ts` |
| Card registry | frontend repo `src/components/dashboard/card-registry.ts` |
| Conditions / strategies | frontend repo `src/lib/dashboard/conditions.ts`, `strategies.ts` |
