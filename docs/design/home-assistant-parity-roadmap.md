# Home Assistant capability parity - north-star roadmap

Status: **proposed / north-star** (2026-06-19). A forward-looking plan, not a committed
schedule. Research against a cloned `home-assistant/core`, mapped onto our existing subsystems.

## Why this doc exists

The goal: *eventually be able to offer the full breadth and depth of Home Assistant's
functionality and integrations - with our own implementation, not HA's packages.*

This is distinct from [`home-assistant-adoption.md`](../home-assistant-adoption.md), which is
the **incremental polish** of subsystems we already have (state timestamps, areas/labels, typed
selectors, richer flows) - much of that is shipped. This doc is the **north star**: what it takes
to grow from "an LLM agent that reads a synced datastore" into "a system that can *do everything
HA does*," and in what order.

## The core tension (read this first)

HA and Personal Agent solve overlapping problems from opposite ends:

| | Home Assistant | Personal Agent (today) |
|---|---|---|
| Shape | Local-first **real-time control system** | Cloud/self-hosted **durable LLM agent** |
| Tenancy | Single-tenant | Multi-tenant (RLS, org scoping) |
| State | In-memory **state machine**, sub-second | Postgres snapshot via periodic pull + webhook push |
| Consumer | Dashboards, automations, voice | An LLM agent reading entities + tools |
| Latency | "turn the light on" in <1s | sync→DB→agent: seconds+ |

Our architecture is **deliberately HA-shaped** - the integration contract, the
entity/device/area model, the Workflow trigger engine, `EntityStateWriter` push, the Redis-Streams
bus and the Rust device-agent are the same building blocks HA has. We do **not** need to rebuild.
But our entity model today is *"sync into the DB so the agent can read it."* That cannot switch a
light in under a second. **That is the one genuinely structural gap.** Everything else is additive
on the existing integration contract.

### The strategic decision

Add a **real-time control plane *alongside* the existing agent/DB plane - do not replace it.**
The durable, governed, multi-tenant agent path stays exactly as is (Frozen Contracts intact). The
new control plane is a low-latency lane for live device state and direct actuation that *also*
feeds the same entity store (so the agent, history, automations and RAG all still see one truth).

---

## The five pillars

### Pillar 1 - Real-time control plane (the only structural gap)

Today: pull-sync + webhook push → DB → agent reads. `async_call_action` actuates synchronously
over HTTP+DB. For smart-home we additionally need a **live lane**:

- **Live-state cache (Redis)** beside the DB source of truth - sub-second state fan-out without
  persisting every tick. The DB + `entity_state_history` stay the durable record; the cache is
  the hot read path for dashboards/automations.
- **Low-latency push ingestion** for `iot_class: local_push` / `local_polling`. Our
  `MessageListenerProvider` + `CommsListenerManager` (survive-anything backoff supervisor) is
  *exactly* this pattern - generalize it from comms messages to **arbitrary entity state**: an
  `EntityListenerProvider` that streams state changes and writes them through `EntityStateWriter` +
  the live cache.
- **Low-latency action dispatch.** `async_call_action` exists but routes through HTTP+DB (and, for
  automations, Temporal). Add a direct in-process dispatch path for interactive control so
  "light on" never waits on a workflow. Durable/agent-initiated actions keep the existing path.

**Reuses:** `EntityStateWriter`, the Redis-Streams bus + AG-UI converter, the `availability` column,
`state_changed_at`/`state_updated_at`, the listener-manager supervisor pattern, the `iot_class`
manifest field (already declared per integration: `local_in_process`/`local_polling`/`local_push`/
`cloud_polling`/`cloud_push`, but today purely descriptive).
**New:** live-state cache keys + read path, `EntityListenerProvider` capability, a direct
actuation dispatcher, `iot_class`-*driven* scheduling (push vs poll vs cloud).

### Pillar 2 - Standard entity-class catalog (what makes breadth *usable*)

HA's real magic is not 1000 integrations - it's that a `light` from Hue, IKEA and Shelly share
**one** state/attribute/action schema (brightness, color, hvac_mode, cover position…). That is why
UI, voice and automations work *generically* across vendors.

Today we have free-form `entity_type` + `device_class`/`state_class`/`unit` + per-type `actions`.
Add a **canonical catalog of standard entity classes** - `light`, `switch`, `binary_sensor`,
`sensor`, `climate`, `cover`, `lock`, `media_player`, `camera`, `fan`, `vacuum`, … - each with a
fixed state/attribute/action schema. An integration that maps its entity onto `light` gets generic
controls, voice and automations **for free**. This is the single biggest conceptual win and the
lever that makes breadth pay off.

**Reuses:** `EntityStateTypeDescriptor` (device_class/state_class/unit/actions already there),
`EntityStateActionDescriptor`, the catalog-sync in `integrations/sync.py`.
**New:** a registry of canonical classes + their schemas; validation that an integration's
declared type conforms; generic UI cards + voice intents + automation building-blocks keyed on the
class rather than the domain.

### Pillar 3 - Discovery + local connectivity (the device-agent as LAN bridge)

HA finds devices on the LAN (zeroconf/mDNS/Bluetooth/SSDP). We are cloud/self-hosted, so the
**Rust device-agent is our bridge into the LAN.** Plan: the device-agent runs discovery, reports
found devices to the backend, and that feeds **discovery-source config flows** (HA analog). The
manifest regains the discovery vectors we intentionally omitted (zeroconf/bluetooth/…), scoped to
"announced by a device-agent on the user's network."

**Reuses:** the `personal-agent-org/device-agent` repo + the device WS gateway, the config-flow manager (add a
discovery-initiated entry path), the manifest schema.
**New:** discovery vectors in the manifest, a device-agent discovery reporter, a discovery →
config-flow intake (dedupe by a stable unique id).

### Pillar 4 - Robustness / self-healing (table stakes at scale)

The four items from the prior analysis are *nice-to-have* at 10 integrations and **mandatory** at
200+. At parity scale they are a precondition, not polish:

1. **Reauth flow** (`ConfigEntryAuthFailed` analog → `async_step_reauth`) - credentials expire
   constantly (IMAP, OAuth, bridge sessions). Re-ask *only* the credentials, keep the rest, raise
   a user action + notification. Doubly valuable for us: the agent can read the open reauth and
   proactively offer to fix it. The reauth *flow* already exists (a `flow_kind="reauth"` entry-edit
   into the integration's `async_step_reauth`, exposed at `POST /config-entries/{entry_id}/reauth`);
   what is missing is the **automatic trigger** - detecting an auth failure and raising the reauth
   as an open issue + notification, rather than the user invoking it by hand.
2. **Setup-retry with backoff** (`ConfigEntryNotReady` analog) - a transient external blip at boot
   must not kill an entry permanently. Mirrors our "readiness gates only on hard deps" philosophy
   (Frozen Contract #9) at the integration level.
3. **Availability propagation on sync failure** - the `availability` column already exists; wire
   *N consecutive failures → entities `unavailable` + poll-interval backoff* (the useful half of
   HA's `DataUpdateCoordinator`). "unavailable" is more honest than "stale-but-available."
4. **Repairs / issue registry** - a structured, actionable, dismissible issue an integration
   raises ("API key invalid", "device unreachable") with an optional guided fix flow. For us these
   are not just UI badges but **context the agent reads and acts on**. Reauth (#1) is really the
   most important special case of a repair issue - design #1 and #4 together.

**Reuses:** `HealthResult`, the config-flow manager (already supports reconfigure / options /
reauth flow kinds + a `/config-entries/{entry_id}/reauth` endpoint), the entity `availability` +
`IntegrationConfig.health` columns, the notification system. `IntegrationConfig.state` already
carries `loaded`/`setup_error` (an OAuth refresh failure stamps `setup_error`); a `setup_retry`
state is what's still missing.
**New:** an `Issue`/`Repair` model + registry, automatic reauth triggering (today a failed refresh
only stamps `setup_error` and leaves the user to start the reauth flow by hand), a setup-retry state
machine on `IntegrationConfig` (add `setup_retry`) + reload endpoint.

### Pillar 5 - Breadth engine (parity is, ultimately, a volume problem)

Reaching the long tail is a throughput problem. Make every new integration a pipeline, not
handwork:

- **`just new-integration` scaffold** - generate the folder, manifest, config-flow, toolset and
  translation stubs.
- **`hassfest`-style manifest lint in CI** - today we validate only at load time
  (`extra="forbid"`); add a CI gate that validates every manifest + standard-class conformance.
- **A documented contribution path** - the integration author's guide, trust-tier rules, the
  capability/standard-class contracts.

**Reuses:** the loader's validation, the `just` task runner, `integrations/README.md`.
**New:** the scaffold recipe, the CI lint, the author guide.

---

## The pragmatic accelerator: a Home Assistant bridge

Before reimplementing 1000 integrations, a **single Home-Assistant-bridge integration** (against
HA's WebSocket API) inherits HA's *entire* ecosystem immediately - HA entities become our
entities, HA services become our actions. That is "not the same packages" - it is *one* package
that inherits all the others.

Use it as a **bridge, not a destination**: it delivers breadth on day one while Pillars 1–2 are
built and the highest-value integrations are reimplemented natively. The mature pattern is a
**dual strategy** - native depth where it counts, bridge for the long-tail breadth. The bridge
maps cleanly onto Pillar 2's standard classes (HA already speaks light/climate/cover/…), so the
work is reusable rather than throwaway.

---

## Sequencing

Phased so each phase is independently valuable and nothing becomes a parallel island:

- **Phase 0 - Bridge + classes (breadth, fast).** Standard entity-class catalog (Pillar 2, the
  reusable core) + the HA-bridge integration (immediate breadth). Validates the class catalog
  against a real, broad source.
- **Phase 1 - Real-time lane (depth).** The control plane (Pillar 1): live cache,
  `EntityListenerProvider`, direct actuation. Now native integrations can be *fast*, not just
  present.
- **Phase 2 - Robustness (scale).** Reauth + repairs + setup-retry + availability propagation
  (Pillar 4). Required before the integration count grows.
- **Phase 3 - Local reach (LAN).** Device-agent discovery + discovery config flows (Pillar 3).
- **Phase 4 - Breadth engine (sustain).** Scaffold + CI lint + author guide (Pillar 5), then
  reimplement the long tail natively, retiring bridge dependence where depth matters.

## Open decisions

- **How far into real-time do we go?** Full sub-second local control, or "near-real-time
  orchestration" (the agent commands a control layer, HA-bridge or native, that owns the hard
  real-time loop)? This bounds Pillar 1's scope.
- **Where does the live-state cache sit** relative to RLS/multi-tenancy? Per-org Redis keyspaces;
  how does the governance/classification gate (Frozen Contract #14) apply to live state?
- **Bridge entity identity** - namespacing HA entity ids into our `(entry, type, external_id)`
  without collisions, and whether bridged entities are tier-gated like native ones.
- **Standard-class governance** - do canonical classes carry a default `required_tier`, or is tier
  always per-integration?

## Non-goals (deliberately *not* HA)

- Entity-as-a-live-Python-object + an in-process global state machine - contradicts our
  DB/Temporal/multi-tenant model on purpose.
- `supported_features` bitmask - our explicit per-type `actions` model is clearer; keep it.
- Re-using HA's Python packages or YAML config format.
- The HA add-on/supervisor model - our compute-provider/sandbox story covers running external
  workloads.

---

> Compiled 2026-06-19 against a cloned `home-assistant/core`. Each pillar maps onto an existing
> model/service in this repo; see the per-pillar *Reuses/New* notes for the file targets. Companion
> to [`home-assistant-adoption.md`](../home-assistant-adoption.md) (incremental) - this doc is the
> breadth/depth north star.
