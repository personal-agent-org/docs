# Surfaces — dynamically-definable chat modes & dashboards (design)

Status: **DRAFT / concept** (2026-06-20). Co-designed; decisions in §10 are still open.

## Goal

Today a chat's `mode` is a hardcoded `String(64)` enum: `"standard" | "coding" | <ChatMode-uuid>`.
`"coding"` is wired by hand (workspace device, jailed FS, `CODING_BEHAVIOR` instructions, AGENTS.md
injection, git shadow, model boost, sub-agent gating, Monaco+terminal panels). A dynamic `ChatMode`
row exists but can do **only** one thing: show a dashboard of cards in a side panel.

We want chat modes to be **dynamically definable like sub-agents** (`DelegatableAgent`): the default
is a plain chat, but any mode can add **sections** — an editor, a terminal, Home-Assistant-style
cards — and declare what it needs (e.g. a workspace). A chat session becomes a **mix of an LLM chat
and other sections**. Crucially, the **same definition must power a pure dashboard with no chat at
all**. And what are side-by-side sections on a large screen must become **bottom tabs** on a small
screen (as coding mode already does: `chat | editor | terminal | agents`).

We **orient strongly on Home Assistant Lovelace** (cloned at `/root/references/ha-core` +
`/root/references/ha-frontend`, refreshed 2026-06-20). Lovelace is a battle-tested, config-driven,
pluggable layout system — we adopt its model almost wholesale.

## The one idea: a **Surface**

> A **Surface** is a Lovelace-style, dynamically-definable layout. A **chat mode** is a Surface that
> contains a `chat` view; a **pure dashboard** is the same Surface *without* a `chat` view.

### Hard rule: no code branches on a mode/surface id

**Nothing in the code may key off the string `"coding"` (or any specific surface id).** "Coding" is a
**seeded Surface row, identical in kind to a user-defined one** — `builtin=true` only marks it as
shipped/seed-managed, it grants **no special code path**. Every behavior that is hardcoded today
(workspace, jailed FS, git shadow, AGENTS.md project rules, the coding instructions, the model boost,
sub-agent gating) must derive **only** from a Surface's *declared* properties:

- which **views** it has (`editor`/`terminal` ⇒ `needs_workspace`),
- its `chat.agent` **overlay** (`instructions`, `tool_config`, `model_tags`),
- its `agent.capabilities` keys (what enables jailing / git-shadow / project-rules / sub-agent gating).

Consequence: a user can build their own coding-like Surface; the shipped one is just the default seed.
If we ever find ourselves writing `if surface.slug == …`, the design has leaked — push it into a
declared property instead.

This unifies three things that are separate today into **one** concept:

| today | becomes |
|---|---|
| hardcoded `"standard"` mode | a seeded **builtin Surface** = one `chat` view |
| hardcoded `"coding"` mode | a seeded **builtin Surface** = `chat` + `editor` + `terminal` views, `needs_workspace` |
| dynamic `ChatMode` (cards side-panel) | a user **Surface** = `chat` + `cards` view |
| a standalone `Dashboard` | a **Surface with no `chat` view** |

### Region = View (the HA mapping)

Lovelace already models a dashboard as **`Dashboard → Views → Sections → Cards`** and renders the
views as a **tab bar**. Our "sections/regions" map **exactly onto Lovelace Views**:

- **Large screen** → the Surface's views are laid out **side-by-side** (a splitter/grid), ordered +
  weighted. (Chat is just one view.)
- **Small screen** → the **same** view list becomes **bottom tabs** (one per view). This generalizes
  today's hardcoded `CODING_VIEWS` / `CARDS_VIEWS` / `STANDARD_VIEWS` into one derived list.

So a Surface's `views[]` is the single source that drives both layouts. No per-mode special cases.

### New view/card types (the only real additions to the Lovelace model)

Lovelace views/cards are all data widgets. We add three **stateful panel** types, registered through
the **same `create-element` factory + registry** HA uses (`hui-${type}-${suffix}`, always-loaded vs
lazy, `custom:` prefix for plugins):

- **`chat`** — the LLM conversation. Carries the **agent overlay** (see §4). At most one per Surface;
  its presence is what makes the Surface a "mode" vs a "dashboard".
- **`editor`** — Monaco + file tree over a workspace (reuses `WorkspacePanel` + `fs_*` RPC).
- **`terminal`** — xterm/PTY over a workspace (reuses `DeviceTerminal` + `TerminalHub`).

`cards` views (sections of HA cards) stay **100% the existing system** — `CardRenderer`,
`card-registry.ts`, the 60 card types, the 5 view layouts (`sections`/`masonry`/`panel`/`sidebar`),
the 12-col grid + `grid_options`, conditions, actions, `useLiveEntity`. Untouched.

## 1. Data model (HA two-layer + DelegatableAgent scoping)

HA splits a lightweight **dashboards metadata collection** (`url_path`, `title`, `icon`,
`require_admin`, `show_in_sidebar`, `mode`) from the heavy **config blob** (`{views}` or `{strategy}`).
We mirror that, and add `DelegatableAgent`-style scoping (`scope` global/user, `owner_sub`, `org_id`
RLS, `enabled`, `builtin`, auto-`slug`):

```python
class Surface(UUIDPKMixin, TimestampMixin, Base):           # metadata layer
    name, slug, icon, description
    scope, owner_sub, org_id, enabled, builtin              # exactly like DelegatableAgent
    kind: str            # "mode" | "dashboard"  (derived: has a chat view? → mode)
    show_in_nav: bool    # appears as a dashboard/drawer entry (HA show_in_sidebar)
    require_admin: bool
    config: JSONB        # the Lovelace-style blob (the heavy layer) — see §2
```

- **`ChatMode` is replaced by `Surface`** (migrate each → a Surface with `[chat, cards]`).
- **`Dashboard` is replaced by `Surface`** with `kind="dashboard"` (its `config` already *is* a
  Lovelace `{views}` blob — drop-in). Standalone dashboard pages render a chatless Surface.
- **`chats.mode`** becomes a `surface_id` (FK) — or keeps the string but resolves to a Surface slug.
  `"standard"`/`"coding"` are seeded builtin Surfaces.

## 2. Config schema (Lovelace-compatible)

The `config` blob is a Lovelace dashboard config, extended with an **arrangement** for the
side-by-side desktop layout and our new view types:

```jsonc
{
  "title": "Coding",
  "arrangement": {                 // desktop side-by-side; mobile → bottom tabs (order = tab order)
    "layout": "split",             // "split" | "single" | "sidebar"
    "items": [
      { "view": 0, "weight": 55 }, // chat
      { "view": 1, "weight": 45, "group": "right" }  // editor+terminal share the right group (tabs)
    ]
  },
  "views": [
    { "type": "chat",     "icon": "chat",     "title": "Chat",
      "agent": { /* §4 */ } },
    { "type": "editor",   "icon": "code",     "title": "Editor",   "workspace": "default" },
    { "type": "terminal", "icon": "terminal", "title": "Terminal", "workspace": "default" },
    { "type": "sections", "icon": "dashboard","title": "Cards",
      "sections": [ { "type": "grid", "cards": [ /* existing HA cards */ ] } ] }
  ]
}
```

- A **pure dashboard** = the same shape with **no `chat` view** (often a single `sections` view,
  `arrangement.layout="single"`).
- `views[]` is reused verbatim from Lovelace for `sections|masonry|panel|sidebar`; `chat|editor|
  terminal` are new `type`s dispatched by the same factory.
- **`strategy`** (HA's generated-layout key) is allowed at dashboard AND view level (see §5).

## 3. Responsive: one list → desktop regions / mobile tabs

`arrangement.items` (referencing `views[]`) is the single source:

- **Desktop**: render the items as splitter panes (by `weight`), items in the same `group` stack as
  tabs within one pane (e.g. editor+terminal on the right).
- **Mobile** (`$q.screen.lt.md`): render the views as **bottom tabs** (icon+title), one per view,
  in `arrangement` order — exactly today's behavior, now derived not hardcoded.

A `SurfaceLayout` component owns this; the per-view renderers are `chat` / `editor`(`WorkspacePanel`)
/ `terminal`(`DeviceTerminal`) / `cards`(the existing `ViewRenderer`).

## 4. The agent overlay (the `chat` view's config) — mirrors DelegatableAgent

When a Surface has a `chat` view, that view's `agent` block carries the per-mode agent behavior —
the dynamic replacement for the hardcoded coding branches:

```jsonc
"agent": {
  "instructions": "…",        // overlay onto base instructions (coding mode seeds CODING_BEHAVIOR)
  "tool_config": { … },        // overlay onto run_config tool keys (like DelegatableAgent.tool_config)
  "model_tags": ["coding"],    // bias auto-model (replaces the hardcoded coding boost)
  "security_default": "judge", // optional per-mode default
  "memory_default": { … },     // optional per-mode default
  "capabilities": ["coding"]   // keys sub-agents gate against (see §6)
}
```

This is the exact `DelegatableAgent` shape (`instructions` + `tool_config` + model selection +
gating), just attached to a Surface's chat view instead of a delegatable agent.

## 5. Strategies (HA's killer feature — adopt it)

HA lets a dashboard/view/section be **generated** instead of static: `{ "strategy": { "type": … } }`.
A strategy is a client-side generator `generate(config, hass) → expanded config`, lazy-loaded by
type, with `custom:` plugins, and `shouldRegenerate(old, new)` to refresh on state change.

We adopt it directly. It unlocks **dynamic, generated Surfaces**:

- `original-states`-style: build a `cards` view from the user's entities automatically.
- **`agent` strategy**: ask the agent to *generate the dashboard layout* (the LLM emits the views/
  cards JSON) — a natural fit for this product.
- per-view strategies inside an otherwise static mode.

Our `generate()` runs against our entities/integration registry (the analog of `hass`). Build the
recursive `expandSurfaceStrategies(config)` exactly like `expandLovelaceConfigStrategies`.

## 6. Backend: definition-driven instead of `if mode == "coding"`

Every hardcoded coding branch is re-pointed at the Surface definition (same machinery, new trigger):

| today (hardcoded) | becomes |
|---|---|
| `mode=="coding"` → implicit workspace device, jailed FS | Surface has an `editor`/`terminal` view ⇒ `needs_workspace` |
| `CODING_BEHAVIOR` injected | `chat.agent.instructions` (coding Surface seeds it) |
| auto-model coding boost | `chat.agent.model_tags` |
| `DelegatableAgent.requires_mode=="coding"` | match against the Surface's `agent.capabilities` keys |
| `chat_workspace_id/path` gated on `"coding"` | gated on `needs_workspace` |
| HOME file search only in standard | gated on absence of a workspace |
| git shadow snapshot (run reversion) | implied by `needs_workspace` (any workspace surface gets it) |
| AGENTS.md / CLAUDE.md project-rules injection | implied by `needs_workspace` (or an explicit `project_rules` capability) |
| jail FS to the workspace folder | implied by `needs_workspace` |
| cloud-sandbox snapshot restore | implied by `needs_workspace` + a managed compute device |

The remaining "heavy coding machinery" (git shadow, project-rules, jailing, sandbox restore) is
**workspace** behavior, not "coding" behavior — so it keys off `needs_workspace` (a derived flag),
never off a surface id. If finer control is wanted, expose them as named `capabilities` the Surface
opts into; the seeded coding Surface simply declares them.

`needs_workspace` is **derived** (any `editor`/`terminal` view). Workspace stays **per-chat**
(`run_config.workspace_device_id/path`); the Surface only declares the *need*, which triggers the
existing `CodingWorkspaceSetup` flow (Ort local/cloud + Projekt existing/new/git).

## 7. Edit mode (reuse + align to HA)

Adopt HA's editor model, which our dashboard editor already approximates: a `editMode` flag, GUI vs
YAML/JSON card editors (`getConfigElement` / `getConfigForm` on each card type), immutable
config-util (`addCard`/`replaceCard`/`deleteCard`/`addView`…), undo via config snapshots, drag/resize
in the grid. The Surface editor is the dashboard editor + view-add for `chat`/`editor`/`terminal`.

## 8. Card / view contract (for pluggability)

Mirror HA's `LovelaceCard` contract so every view/card is uniform + pluggable:
`setConfig(config)`, `getCardSize()`, optional `getGridOptions()`, static `getStubConfig()` /
`getConfigElement()`. New view types implement a thin `SurfaceView` contract (`setConfig`, declares
`needs_workspace`, optional `mobileTab`). `custom:`-prefixed types resolve from a registry → enables
**plugin cards/views/strategies** later (HA's `resources` collection; defer to a later increment).

## 9. Incremental rollout (coding stays working throughout)

1. **`Surface` model + repo + router (user/admin)** per the DelegatableAgent pattern; store + Settings
   form (name/icon/scope + view list editor).
2. **`SurfaceLayout`** (desktop split + mobile tabs from `arrangement`) + the `chat`/`editor`/
   `terminal` view types in the `create-element` registry; `cards` view = existing `ViewRenderer`.
   Lay the **strategy plumbing** here too (`expandSurfaceStrategies` + a strategy registry), even
   though the first strategies (`agent`-generated layout) come right after — cheap to add while the
   structure is new.
3. **Seed `standard` + `coding` as builtin Surfaces**; `chats.mode` resolves a Surface. Delete the
   hardcoded `CHAT_MODES` registry + the 3 mobile-tab variants.
4. **Re-point backend branches** (`mode=="coding"` → `needs_workspace`/capabilities; agent overlay
   from the Surface).
5. **Migrate `ChatMode` → Surface**; replace `DashboardModePanel` with the `cards` view.
6. **Fold `Dashboard` → Surface** (`kind="dashboard"`); standalone dashboard pages render a chatless
   Surface. (The clean-break step.)
7. **Strategies** (§5) + **plugin resources** (§8) as follow-ups.

## 10. Decisions

**Locked (2026-06-20):**
1. ✅ **Region = View** (HA-native: views → desktop split / mobile tabs).
2. ✅ **chat/editor/terminal = new VIEW types** (full stateful panels; cards stay data widgets).
3. ✅ **Fold fully**: Dashboard + ChatMode + coding → ONE `Surface`. Standalone dashboards = chatless
   Surfaces. (Biggest step — sequenced last in rollout to keep things shippable.)
4. ✅ **Strategies plumbing now**, the agent-strategy (LLM builds the layout) as a fast follow.
5. ✅ **No id-branching**: `"coding"` is a seeded Surface row like any other; all behavior derives
   from declared views / agent overlay / capabilities. No `if surface.slug == …` anywhere.

**Defaults (proceed unless objected):**
6. **Scope** = user + global like `DelegatableAgent` (+ org/group).
7. **Storage** = extend the existing `dashboards` table into `surfaces` (+ migrate `ChatMode`).
8. **Workspace** stays per-chat (`run_config`); the Surface only declares `needs_workspace`.
9. **Sub-agent gating** switches `DelegatableAgent.requires_mode` (string) → match Surface
   `agent.capabilities` keys.

**Still open:**
10. **Custom plugin cards/views/strategies (HA `resources`)** — in scope eventually, or never
    (untrusted JS = security surface)? Deferred regardless.
