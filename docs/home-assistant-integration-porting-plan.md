# Porting Home Assistant integrations to Personal Agent — plan & gap analysis

> Research against a fresh shallow clone of `home-assistant/core` (1 484 integrations,
> `homeassistant/components/*`), mapped onto our existing integration tier
> (`integrations/<domain>/` + `src/personal_agent/integrations/` in the backend repo).
> This is the *porting* counterpart to `docs/home-assistant-adoption.md` (which deepens our
> entity/flow/dashboard subsystems). This doc answers: **can we port all HA integrations, what
> does it take, and which framework pieces are still missing.**

---

## 0. TL;DR

- HA core ships **1 484 integrations**; **~884 have a config flow**, pulling in **1 127 distinct
  PyPI requirements**. They are *not* a uniform set — they split sharply by transport.
- Our integration tier is already an **HA-shaped base**: folder discovery + `manifest.yaml` +
  `ConfigFlow` + `PersonalAgentIntegration` (≈ `async_setup_entry`) + an entity system with
  `device_class`/`state_class`/`unit`/`category`/`actions`/device grouping + pull/push/webhook
  sync + capability providers. The *shape* matches; the *breadth* and *transports* do not.
- **"Port all" is the wrong target.** ~½ of HA assumes **local radio/serial hardware on the
  same host as the runtime** (Zigbee, Z‑Wave, Bluetooth, Matter/Thread, KNX, USB, serial). We
  run multi‑tenant in k8s/cloud — there is no LAN, no radio, no per‑tenant USB stick. Those need
  a **local bridge** (the Rust device-agent) before they make any sense.
- The **high‑value, directly‑portable slice is the cloud‑API integrations** (`cloud_polling` /
  `cloud_push`, ~500): REST/OAuth services with no local hardware (weather, calendars, transit,
  energy, media, package tracking, smart‑home *clouds*). These map cleanly onto our existing
  model with **no new framework** — only the gaps in §4 (OAuth2, richer entity domains, discovery
  for the LAN tier).
- Recommended path: **(1)** close the small framework gaps that unblock the cloud tier (OAuth2
  application‑credentials flow, a handful of richer entity domains, a codegen harness), **(2)**
  bulk‑port the cloud tier via a manifest‑driven generator, **(3)** add a **device‑agent LAN
  bridge** to unlock local‑IP devices, **(4)** treat radio/serial hubs and voice as separate
  programs, not ports.

---

## 1. What "all HA integrations" actually is

| Dimension | Distribution (from the clone) |
|---|---|
| Total integrations | **1 484** |
| `config_flow: true` | 884 (UI‑setupable) · 908 have a `config_flow.py` |
| **`integration_type`** | device 284 · hub 271 · service 258 · virtual 121 · system 84 · entity 46 · helper 28 · hardware 6 |
| **`iot_class`** | local_polling 423 · cloud_polling 392 · local_push 249 · cloud_push 112 · calculated 31 · assumed_state 20 |
| Use `DataUpdateCoordinator` | ~1 605 modules |
| Use OAuth2 / `application_credentials` | ~264 |
| Declare a webhook | ~39 |
| Declare `services.yaml` | 339 |
| **Discovery hooks** | zeroconf 114 · dhcp 110 · bluetooth 59 · ssdp 44 · usb 25 · homekit 21 · mqtt 19 |
| Distinct PyPI requirements | **1 127** |

The single most important axis for us is **`iot_class` locality**:

- **`cloud_*` (≈504)** — talks to a vendor cloud over HTTPS. **Runs fine from our cloud.**
- **`local_*` (≈672)** — talks to a device on the **same LAN as the HA host**. Needs LAN reach.
- **`calculated`/`assumed_state`/system/helper/virtual** — derive state or are pure framework.

---

## 2. Concept mapping — HA → Personal Agent (what already lines up)

| Home Assistant | Personal Agent | Status |
|---|---|---|
| `manifest.json` | `integrations/<domain>/manifest.yaml` (`IntegrationManifest`) | ✅ direct |
| `async_setup_entry(hass, entry)` | `PersonalAgentIntegration.async_setup_entry(ctx)` | ✅ direct |
| `ConfigEntry` (+ `entry.data`/`options`) | `IntegrationConfig` row + `SetupContext.data/secrets` | ✅ (options TBD, §4) |
| `config_flow.py` / `async_step_user` | `ConfigFlow.async_step_user` (+ multi‑step) | ✅ partial (no OAuth/discovery steps) |
| Entity platforms (`light`, `sensor`, …) | `EntityStateTypeDescriptor` (generic, `device_class`/`state_class`/`unit`) | ⚠️ generic, not per‑domain |
| `Entity` + `async_update` | `EntityStateRecord` + `async_sync_entities` (pull) | ✅ direct |
| `DataUpdateCoordinator` (poll cadence) | scheduled sync (`integrations/sync.py`) | ✅ equivalent |
| Push (`async_write_ha_state`) | `EntityStateWriter` / `async_handle_webhook` | ✅ direct |
| `services.yaml` + service handlers | `EntityStateActionDescriptor` + `async_call_action` | ✅ direct (entity‑scoped) |
| `DeviceInfo` / device registry | `DeviceInfo` + `EntityStateDevice` | ✅ direct |
| Area / floor registry | (planned in adoption doc §2) | ⚠️ partial |
| `EntityCategory` (config/diagnostic) | `EntityStateTypeDescriptor.category` + `visible_default` | ✅ direct |
| `webhook` component | `async_handle_webhook` + `/webhooks/integration/{entry_id}` | ✅ direct |
| `notify` platform | `MessageSenderProvider` (HITL draft‑approval) | ✅ (different safety model) |
| `weather` / `*_search` services | capability providers (`weather_provider`, `web_search_provider`) | ✅ direct |
| `device_tracker` / events | `event_types()` + entity events on the Redis bus | ✅ direct |
| `requirements` | `manifest.requirements` (**surfaced, not installed** — bake into image) | ⚠️ §4.7 |
| OAuth2 `application_credentials` | — | ❌ §4.1 |
| Discovery (zeroconf/SSDP/DHCP/BLE/USB) | — | ❌ §4.2 |
| Local radio stacks (Zigbee/Z‑Wave/Matter/Thread/MQTT broker) | — | ❌ §4.3 (needs bridge) |
| `recorder` / long‑term statistics | partial (entity history planned, adoption §2 #1) | ⚠️ |
| Voice (`stt`/`tts`/`wake_word`/`conversation`/`assist_pipeline`) | own model pipeline (chat‑first) | ↔️ different subsystem |

**Takeaway:** the per‑*entry* contract is essentially complete. The gaps are (a) **setup flows**
(OAuth, discovery), (b) **entity‑domain richness**, (c) **transport** for the local tier, and
(d) **dependency packaging**.

---

## 3. Portability tiers — how to bucket all 1 484

| Tier | What | ~Count | Portable? | Effort / blocker |
|---|---|---|---|---|
| **A. Cloud APIs** | `cloud_polling`/`cloud_push`, REST/OAuth vendor clouds (weather, calendars, transit, energy, media, parcels, finance, smart‑home *clouds* like Tuya/SmartThings/Hue‑remote) | **~500** | ✅ **Yes** | Low–med. Needs §4.1 OAuth + §4.4 entity domains. **Best ROI.** |
| **B. Local‑IP devices** | `local_*` over HTTP/WebSocket, **no special radio** (Shelly ✅, ESPHome, Hue bridge, Sonos, LIFX, many printers/NAS/routers) | **~450** | ⚠️ **With a LAN bridge** | Med. Needs §4.5 device‑agent LAN egress. Per‑tenant LAN reach. |
| **C. Radio/serial hubs** | Zigbee (ZHA/zigpy), Z‑Wave JS, Matter, Thread/OTBR, Bluetooth (bleak), KNX, MQTT broker, DSMR/serial, USB dongles | **~250** | ❌ **Not without local hardware** | High. Needs §4.3 + co‑located bridge + radio adapter. Separate program. |
| **D. System / helper / virtual** | `template`, `group`, `derivative`, `threshold`, `min_max`, `recorder`, `backup`, `cloud`, `hassio`, brand “virtual” shells | **~230** | ↔️ **Partial / N‑A** | Some map to our helpers/automations/world‑memory; many are HA‑internal (no port). |
| **E. Voice / assist** | `stt`, `tts`, `wake_word`, `conversation`, `assist_pipeline`, voice satellites | **~40** | ↔️ **Different subsystem** | Maps to our model pipeline, not the integration tier. Out of scope here. |

> The numbers overlap (a hub can be both cloud and local); treat them as planning buckets, not a
> partition. **Tier A is the program. Tier B is the stretch. Tiers C/E are separate initiatives.**

---

## 4. Framework / function gaps — what we still lack

Ordered by how much they unblock. Each is **additive** on the existing tier.

### 4.1 — OAuth2 / application‑credentials config flow  **(P0, blocks ~264 cloud integrations)**
HA has a first‑class `config_entry_oauth2_flow` + `application_credentials`: the flow redirects to
the provider, captures the code at a callback, exchanges + **refreshes** tokens, and stores them on
the entry. Our `ConfigFlow` only does in‑app forms (`FlowResultType` = FORM/CREATE_ENTRY/ABORT) —
**no external‑redirect step, no token store, no refresh**.
- **Add:** `FlowResultType.EXTERNAL_STEP` (+ `external_url`) and an `async_step_oauth`/callback
  route in the flow manager; an `OAuth2Session` helper (admin‑registered client id/secret per
  provider, à la `application_credentials`); automatic token refresh in `SetupContext` (decrypt →
  refresh → re‑encrypt), reusing the BYOK secret envelope. Mirror reauth (token‑expiry) onto the
  P1 reauth flow already proposed in the adoption doc.

### 4.2 — Discovery (zeroconf / SSDP / DHCP / Bluetooth / USB / HomeKit)  **(P2, UX for the LAN tier)**
~250 HA integrations declare discovery so a device is *found*, not hand‑entered. We have **none**;
every entry is manual host/credentials. Not a hard blocker for cloud (Tier A never discovers), but
the LAN tier (Tier B) leans on it heavily.
- **Add (only with the §4.5 bridge):** a discovery channel from the device‑agent (it *is* on the
  LAN) → posts mDNS/SSDP/DHCP hits back → a “discovered integration” inbox that pre‑fills a config
  flow. Pure‑cloud deployments simply never see discoveries. Defer until a concrete Tier‑B port
  needs it.

### 4.3 — Local radio/serial transport subsystems  **(P3, gates Tier C)**
Zigbee, Z‑Wave, Matter/Thread, Bluetooth/BLE, KNX, MQTT broker, serial/USB. These are **whole
stacks** (zigpy, zwave‑js‑server, python‑matter‑server, bleak, aiomqtt) that assume a radio adapter
on the host. A cloud multi‑tenant runtime cannot host them.
- **Only viable via** a co‑located **bridge** (§4.5) running the radio stack next to the hardware,
  exposing a normalized device API back to PA. This is a *product line*, not a port. Recommend
  **defer**; if pursued, start with **MQTT** (a broker the user already runs → cleanest bridge) and
  **Matter** (IP‑based, future‑proof) before Zigbee/Z‑Wave (per‑adapter drivers).

### 4.4 — Richer entity domains  **(P1, quality of Tier A/B ports)**
Our `EntityStateTypeDescriptor` is **generic** (`state` + `attributes` + `actions`). HA has ~40
**typed platforms** with domain semantics: `climate` (hvac_modes, target_temp, presets),
`media_player` (transport state, source list, volume), `cover` (position/tilt), `light` (color
modes/temp), `fan`, `lock`, `vacuum`, `alarm_control_panel`, `number`/`select`/`button`/`switch`,
`weather`, `calendar`, `todo`, `camera`/`image`, `update`, `device_tracker`, `event`,
`date`/`time`/`datetime`/`text`. We can *represent* all of these generically, but the agent and the
dashboard render them better with first‑class shapes.
- **Add:** a small set of **canonical entity‑domain descriptors** (a typed `state_schema` +
  standard action sets) for the high‑frequency domains — `climate`, `media_player`, `cover`,
  `light`, `lock`, `vacuum`, `weather`, `calendar`, `todo`, `camera`. Generic stays the fallback
  (backward‑compatible). This is the same shape as the adoption‑doc §2 “units & structured
  attributes” item — do them together.

### 4.5 — Device‑agent LAN bridge (the local tier’s enabler)  **(P2, gates Tier B+C)**
The Rust device-agent (repo `personal-agent-org/device-agent`) already connects back over the device WS. Extend it into a
**LAN integration runner**: a slim host that the user runs at home, which (a) reaches local devices,
(b) optionally hosts radio stacks (§4.3), (c) relays discovery (§4.2), and (d) runs the
local‑transport half of a ported integration while the **config flow, entities, governance, and
agent stay in the cloud**. This is what turns “cloud‑only product” into “can talk to your house”
without putting tenant hardware in our k8s.

### 4.6 — Long‑term statistics / recorder  **(P2)**
HA’s `recorder` + statistics back history graphs and “has been X for Y” conditions. We have entity
events + a planned `entity_state_history` (adoption §2 #1). Land that table + a stats roll‑up; many
`sensor`‑heavy ports are dull without history.

### 4.7 — Dependency packaging at scale  **(P1, operational)**
1 127 distinct PyPI requirements, and our loader **surfaces but never installs** them (full‑trust,
baked‑into‑image policy). Porting hundreds of integrations means hundreds of new transitive deps —
unworkable in one image.
- **Add:** an **opt‑in extras model** — group requirements into installable extras
  (`personal-agent[integrations-weather]`, …) and/or a per‑integration **sidecar/venv** so a tenant
  enabling 8 integrations doesn’t drag in 1 127 libs. Keep the trust model (§ integrations/README)
  intact: still vetted, still first‑party.

### 4.8 — Options / reauth / reconfigure / lifecycle  **(P1, already scoped)**
`async_step_options` / `reauth` / `reconfigure` + config‑entry `state` (loaded/setup_error/
setup_retry) + `reload`. Already the adoption‑doc §3 P1/P2 items — pull them forward; OAuth (§4.1)
*needs* reauth.

### 4.9 — Service/automation surface parity  **(P3)**
HA `services.yaml` (339 integrations) are global, schema’d actions; ours are **entity‑scoped**
(`async_call_action`). Most device control fits the entity‑action model; a few integration‑level
services (e.g. “send a notification”, “run a scene”) want an **integration‑level action** registry.
Small additive: an `integration_actions()` declaration → agent tools / automation steps.

---

## 5. Recommended plan (phased)

**Phase 0 — Harness & decision (1–2 wk).**
Build a **manifest‑driven codegen + triage tool** (`tools/ha_port/`): read a HA component’s
`manifest.json` + entity platforms, classify it into a Tier (§3), and emit a PA `integrations/<d>/`
skeleton (manifest.yaml + config_flow stub + entity‑type stubs mapped from HA platforms). Output a
ranked backlog (Tier A first, by popularity). *Deliverable: the backlog + 3 hand‑finished Tier‑A
ports as templates.*

**Phase 1 — Unblock the cloud tier (P0/P1 framework).**
Land **§4.1 OAuth2 flow**, **§4.4 richer entity domains** (the 10 canonical ones),
**§4.7 dependency extras**, **§4.8 options/reauth**. These are the only hard prerequisites for
Tier A. *Gate: one OAuth integration (e.g. a calendar or a smart‑home cloud) end‑to‑end.*

**Phase 2 — Bulk‑port Tier A (cloud APIs, ~500).**
Generator‑assisted, hand‑finished in priority order. Each port = manifest + config flow (often
OAuth) + a thin client + entity types + actions. Most need **no device‑agent**. Wire each through
the existing governance/classification/untrusted gates (Contracts #13/#14) — a cloud integration
that returns attacker‑influenced text declares `trust_tier: untrusted`.

**Phase 3 — LAN bridge + Tier B (local‑IP devices).**
Land **§4.5 device‑agent LAN runner** + **§4.2 discovery relay** + **§4.6 history**. Port the
local‑IP devices (ESPHome, Hue bridge, Sonos, printers, routers) running their transport half on
the bridge. *Gate: ESPHome or a Hue bridge controllable from chat via a home‑run bridge.*

**Phase 4 (optional, separate program) — Tier C radios + Tier E voice.**
Only if there’s product pull. Start MQTT/Matter. Voice is the model‑pipeline team, not this tier.

---

## 6. Per‑integration porting recipe (the repeatable unit)

```
integrations/<domain>/
  manifest.yaml      # from HA manifest.json: domain, name, iot_class, requirements,
                     #   config_flow, single_instance, codeowners, documentation;
                     #   set required_tier + trust_tier per our governance
  __init__.py        # class PersonalAgentIntegration:
                     #   async_setup_entry  ← HA async_setup_entry (build toolset/client)
                     #   entity_types()     ← HA entity platforms → EntityStateTypeDescriptor
                     #   async_sync_entities← HA coordinator.async_update (pull)
                     #   async_call_action  ← HA services / entity methods
                     #   *_provider()       ← if it backs a capability (weather/search/notify)
  config_flow.py     # HA async_step_user (+ OAuth step once §4.1 lands)
  client.py          # the vendor SDK/REST wrapper (HA uses the requirement lib directly)
  mapping.py         # HA state/attrs → EntityStateRecord
  translations/<l>.json
```

**Rules of thumb when porting:**
- **Pull over push first** — implement `async_sync_entities` (poll); add `async_handle_webhook`/
  listener only for `*_push` integrations that matter.
- **Map HA platforms to our `device_class`/`state_class`/`unit`** verbatim (we reuse HA’s
  vocabulary) so semantics carry over.
- **Don’t hardcode per‑domain lists** anywhere in core — derive from declarations (Contract: comms
  triage / listeners already do this).
- **Governance:** set `required_tier` by data sensitivity; `trust_tier: untrusted` for any
  external/attacker‑influenced text source so the assembler gates high‑privilege tools (Contract #13).
- **Keys** (OAuth tokens / API keys) live in the encrypted secret envelope, decrypted only inside
  `SetupContext.secrets`; never logged, never in Temporal inputs (Contract #5/#15).

---

## 7. Non‑goals / explicit cut lines

- **Not** porting HA’s frontend Lit cards, Lovelace strategies, or `hassio`/`supervisor`/`backup`/
  `cloud`/`onboarding` system integrations — they’re HA‑host internals.
- **Not** hosting radio stacks in the cloud runtime (security + multi‑tenancy + no hardware).
- **Not** replicating `recorder` as a TSDB — a bounded `entity_state_history` + stats roll‑up only.
- **Not** the voice assist pipeline in this tier — it belongs to the model pipeline.
- **“All 1 484” is explicitly re‑scoped** to “all that make sense for a cloud‑first agent”: Tier A
  in full, Tier B via the bridge, Tier C/E as separate, opt‑in programs.

---

## 8. Bottom line — what’s missing, in one list

1. **OAuth2 application‑credentials flow** (external‑redirect step + token store + refresh) — P0.
2. **Dependency packaging at scale** (extras / per‑integration venv) — P1.
3. **Richer entity domains** (10 canonical typed platforms) — P1.
4. **Options / reauth / reconfigure / config‑entry lifecycle** — P1.
5. **Device‑agent LAN bridge** (runs the local‑transport half at home) — P2, gates Tier B/C.
6. **Discovery relay** (zeroconf/SSDP/DHCP/BLE/USB via the bridge) — P2.
7. **Entity history + long‑term statistics** — P2.
8. **Integration‑level action registry** (HA `services.yaml` analog beyond entity actions) — P3.
9. **Local radio/serial subsystems** (Zigbee/Z‑Wave/Matter/Thread/MQTT/KNX) — P3, separate program.
10. **A manifest‑driven port generator** (`tools/ha_port/`) to make the bulk feasible — Phase 0.

Everything else (the per‑entry contract, entity sync, actions, devices, webhooks, capability
providers, governance, multi‑tenancy) **already exists** and matches HA’s shape.

> Compiled 2026‑06 from a shallow `home-assistant/core` clone (1 484 integrations). Pairs with
> `docs/home-assistant-adoption.md`; numbers are from the clone’s manifests at time of writing.
</content>
</invoke>
