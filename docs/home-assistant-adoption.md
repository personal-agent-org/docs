# Home Assistant adoption — improvement proposals

Research against cloned references `home-assistant/core` + `home-assistant/frontend`, mapped
onto our existing subsystems. Three areas: **Lovelace dashboards/cards**, the **entity system**,
the **integration/config-flow system**. Everything below *extends* an existing subsystem (no
parallel islands) and is phased.

---

## 1. Lovelace-style dashboards & cards (new surface)

We're chat-first and have **no dashboard surface** today. HA's Lovelace is a clean model to add
one: `Dashboard → Views → Cards`, each card a JSON object `{type, ...config, grid_options}`; a
card registry maps `type` → component; views use masonry/sections/panel layouts; a visual editor
(card picker + per-card form + drag-grid) builds the config.

**Adoption (Vue/Quasar, not Lit):**
- **Data:** `Dashboard` model (`owner_sub`, `org_id`, `title`, `url_path`, `config` JSONB, RLS —
  mirrors Automations/Notes) + `GET/POST/PATCH/DELETE /dashboards` + a `dashboards` Pinia store.
- **Card registry:** `type → defineAsyncComponent`. Start with ~12 cards that map to OUR domain:
  `entity`, `entities`, `markdown`, `button`, `heading`, `gauge`, `grid`, `stack`, `conditional`
  + first-party **`chat`**, **`automation`**, **`commitment/agenda`** cards (reuse existing pages/stores).
- **Editor:** card picker + schema-driven config form (Quasar inputs) + `vue-grid-layout` drag grid.
- **Reuse:** entities store/API, AutomationsPage, AgendaPage, the RLS/org scoping.

Phasing: (1) data layer + viewer, (2) the 12 cards, (3) editor UX. Strategies/badges/card-features
deferred. **Value:** a non-chat surface to see & act on entities/automations/commitments while
staying agent-first.

---

## 2. Entity system — deepen toward HA parity

We already have an HA-style entity system (`db/models/entity.py`, `entities/service.py`, entity
events → Redis stream, RAG, automation triggers). HA goes deeper. Gaps worth closing, each
additive on the existing `Entity` model + sync path:

| # | Proposal | HA analog | Why |
|---|---|---|---|
| 1 | **State timestamps + history table** (`state_changed_at`/`state_updated_at`/`availability` + append-only `entity_state_history`) | Recorder | time-series charts, "stayed X for Y" automation conditions, trends |
| 2 | **Device & Area (+Floor) registries** + `device_id`/`area_id` FKs on Entity | device/area/floor registries | "all lights in the kitchen", location-aware automations |
| 3 | **Entity category + visibility** (`category` config/diagnostic, `hidden`, `disabled`) | EntityCategory | hide internal state from the agent/automations |
| 4 | **Units & structured attributes** (`AttributeDescriptor` with type/unit/precision, `state_class`) | device_class/unit_of_measurement | unit-aware rendering + conversion, validation |
| 5 | **Labels** (user tags) + filter in `search_entities` | label registry | user-defined grouping |
| 6 | **Registry event bus** (`*_registry.updated`) | registry events | automations that react to grouping changes |

Quick wins (low effort, high leverage): **#1 state timestamps + `old_state` in `entity.*` events**
(unlocks change-based triggers) and a **`device_class` hint on `EntityTypeDescriptor`** (semantic
search). Recommended order: 1 → 2 → 3, with 4/5/6 as follow-ups.

---

## 3. Integration / config-flow system — richer flows

Our integration framework (`integrations/<domain>/` folder discovery + manifest + config_flow + capability
providers + entity sync + encrypted secrets) is a solid HA-shaped base. HA is richer in flows and
field types. Additive extensions:

| Priority | Proposal | Detail |
|---|---|---|
| **P0** | **Typed form selectors** | extend `FieldDescriptor` beyond text/secret/number/select/note → `entity`/`device`/`area`/`duration`/`date`/`time`/`color`, with a `filter` (by domain/device_class) + `multiple`. Backward-compatible (unknown → text). |
| **P1** | **Options / reconfigure / reauth flows** | optional `async_step_options/reconfigure/reauth` on `ConfigFlow` + a `scope` on the flow manager → edit an existing integration, re-auth on token expiry, without delete+recreate |
| **P2** | **Config-entry lifecycle + reload** | a `state` on `PluginConfig` (loaded/setup_error/setup_retry/…) + `POST /plugin_configs/{id}/reload` (unload→setup) + retry-with-backoff |
| **P3** | **Quality scale / health** | optional `quality_scale` + `issue_tracker` in the manifest, surfaced in the admin integrations view |
| **P4** | **Soft-dependency ordering** | honor `after_dependencies` in the existing topo-sort (reorder, don't block) |
| Defer | Discovery (zeroconf/SSDP/…) | only if a concrete local-device integration needs auto-detect |

Recommended: **P0 (selectors)** then **P1 (flow variants)** — these unlock the most user-facing value
(e.g. a config field that picks one of the user's entities, and editing a connected integration).

---

> Compiled 2026-06 from `home-assistant/core` + `home-assistant/frontend`. Each item maps to an
> existing model/service/flow in this repo; see the per-area gap tables for exact file targets.
