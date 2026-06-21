# What an integration can provide

An integration is one folder under the integrations dir with a `manifest.yaml`
and a Python integration object — the module-level `INTEGRATION` (an instance of a
`PersonalAgentIntegration` subclass). It is the Home-Assistant `async_setup_entry`
analog: backend integrations run **in-process at full trust**, and contribute to a
*config entry* (an `IntegrationConfig` row created through the integration's config
flow).

Everything an integration delivers is declared on the integration object
(`services/api/src/personal_agent/integrations/integration.py`), backed by the
contracts in `capabilities.py` and `entities.py`. This page is one section per
capability: the real method/descriptor, what it provides, and how the platform
consumes it.

!!! note
    Every contribution method has a default that does nothing (returns `[]`,
    `{}`, or `None`). An integration is only "an X provider" if it overrides the
    relevant hook. Existing integrations that override neither are unaffected.

## Setup context

Every per-entry hook receives a `SetupContext` — everything needed to build a
contribution for one config entry:

| Field | Meaning |
| --- | --- |
| `entry_id` | the `IntegrationConfig` row id |
| `domain` | the manifest `domain` |
| `scope` | the entry's scope (`user` / org / global) |
| `owner_sub`, `org_id` | the entry's principal |
| `data` | the entry's non-secret config (`dict`) |
| `secrets` | **decrypted** secret-field values — in-memory only |
| `version` | the entry's `config_schema_version` |

!!! warning
    `ctx.secrets` holds decrypted credentials. It lives in memory only and must
    never be logged or serialized into Temporal inputs (BYOK Contract #5).

## 1. Tools / toolsets

```python
async def async_setup_entry(self, ctx: SetupContext) -> list[Any]:
    return [build_toolset(ctx)]
```

`async_setup_entry` returns a list of pydantic-ai toolsets (typically a
`FunctionToolset`). This is the agent-facing surface: each `@ts.tool_plain`
function becomes a callable tool. OpenProject is the worked example — it returns one
`FunctionToolset` built from the entry's `base_url` + decrypted `api_key`, with tools
like `openproject_list_projects`, `openproject_my_work_packages`, and
`openproject_create_work_package`.

**How it is consumed:** `ToolsetAssembler._assemble_integrations` walks the chat's
applicable config entries (`IntegrationConfigRepo.list_applicable`, precedence
**user > org > global**), calls `async_setup_entry(ctx)` per entry, and extends the
run's toolset list with the result. One failing integration is logged and skipped —
it never fails the whole run. The contributed tool names are attributed back to the
integration for the composer's integration picker.

Companion lifecycle hooks:

| Hook | When |
| --- | --- |
| `async_unload_entry(ctx)` | release resources tied to an entry (default no-op) |
| `async_migrate_entry(ctx, from_version)` | migrate stored config across `config_schema_version` |

!!! note
    An integration can contribute **no tools** and still be useful — Tavily,
    Signal, and TradingView all return `[]` from `async_setup_entry` and deliver
    value through other capabilities below.

## 2. Entity types + state sync

An integration becomes an **entity provider** by declaring entity types and
producing entities (the Home-Assistant *entity* analog).

### Declaring entity types

```python
def entity_types(self) -> dict[str, EntityStateTypeDescriptor]:
    return {"work_package": _WORK_PACKAGE}
```

Each value is an `EntityStateTypeDescriptor`:

| Field | Provides |
| --- | --- |
| `key`, `name` | the type id and human label |
| `attributes` | a tuple of `FieldDescriptor` describing the entity's fields |
| `rag` | `True` → entities are embedded for semantic search |
| `to_text` | `Callable[[EntityStateRecord], str]` rendering the text to embed (omit → default attribute serializer) |
| `category` | HA category hint `"config"` / `"diagnostic"` → internal entities (hidden from the agent's default view) |
| `visible_default` | `False` → created hidden |
| `device_class` | HA semantics, e.g. `"temperature"`, `"task"` |
| `state_class` | `"measurement"` / `"total"` / `"total_increasing"` |
| `unit` | unit of measurement, e.g. `"°C"`, `"%"` |
| `actions` | a tuple of `EntityStateActionDescriptor` (see §3) |
| `world_kind` | a graph `EntityKind` key (e.g. `"project"`, `"task"`) → links a `world_entities` node so facts/memories attach to the same thing (identity layer); `None` = live-state only |
| `message` | `True` → entities of this type are **inbound comms messages** (see §4) |

OpenProject declares `project` (`world_kind="project"`, not RAG) and `work_package`
(`world_kind="task"`, `rag=True`); Signal declares `signal_message` with `rag=True`,
a custom `to_text`, and `message=True`.

### Producing entities — pull

```python
async def async_sync_entities(self, ctx: SetupContext) -> EntityStateSyncResult:
    ...
    return EntityStateSyncResult(records=..., full=True, entity_types=("project", "work_package"))
```

Return an `EntityStateSyncResult` of `EntityStateRecord`s. A record carries
`entity_type`, `external_id` (the integration's stable id), `name`, optional `state`,
`attributes`, an optional `parent_type` + `parent_external_id` (resolved to a parent
FK by the sync engine), and an optional `device` (`DeviceInfo`, grouping entities
under a get-or-created `EntityStateDevice`).

`EntityStateSyncResult.full` controls delete semantics: `full=True` (default) means
the records are the **complete** current set for `entity_types`, so stored entities
of those types not present are deleted; `full=False` is upsert-only. OpenProject
returns `full=True`; Signal returns `full=False` (a drain-style read that should
never delete).

**How it is consumed:** `entities/sync_runner.py` calls `async_sync_entities` on a
schedule (and on demand), diffs the result via `EntityStateService`, upserts,
emits `entity.created` / `entity.updated` / `entity.deleted` events, and indexes RAG
for `rag=True` types. `EntityStateRecord.content_hash()` drives change detection.

### Producing entities — push, and seed-once

| Hook | Purpose |
| --- | --- |
| `EntityStateWriter` (injected) | the PUSH path — integration code (a tool / webhook) upserts or removes a single entity ad-hoc, through the same upsert→event→RAG pipeline (`entities/writer.py`) |
| `async_initial_entities(ctx)` | entities to create **once** when an entry is first configured — for entity state this system owns (user-created helpers) that must not be pull-synced (a pull would reset live state) |

## 3. Entity actions

A type that declares `actions` becomes *interactive* (the HA `service` analog).

```python
EntityStateActionDescriptor(
    name="set_value",
    label="Set value",
    fields=(FieldDescriptor(name="value", label="Value", type="number"),),
)
```

A non-empty `actions` tuple lets a dashboard card render a control (toggle / slider /
button) and lets the frontend `POST /entities/{id}/action`. `fields` describes the
action's args (an empty tuple = a no-arg action).

```python
async def async_call_action(
    self, ctx, *, entity_type, external_id, action, args, current
) -> EntityStateActionResult:
    ...
    return EntityStateActionResult(records=(updated,), message="Done.")
```

**How it is consumed:** `entities/actions.py` dispatches the call to the owning
integration — **only for actions the type declared in `actions`** — passing
`current` (the entity's present state/attributes). The returned
`EntityStateActionResult.records` are fed through the normal upsert→event→history
pipeline, so a state change emits `entity.updated`. `message` is an optional
human-readable note.

## 4. Inbound comms (messaging) + the unified inbox

An entity type flagged `message=True` marks its entities as **inbound comms
messages**: they feed the unified inbox and are triaged on creation (importance,
contact-linking, HITL draft reply).

**How it is consumed:** `comms/triage_setup.py:comms_entity_types(registry)` derives
the triage trigger set by scanning every integration's `entity_types()` for a
`message=True` descriptor — there is no hardcoded per-domain list, so a new messaging
integration auto-participates.

A comms integration backs message ingestion / sending / real-time listening with
three duck-typed providers from `capabilities.py`:

| Hook | Protocol | Method | Consumed by |
| --- | --- | --- | --- |
| `message_reader_provider(ctx)` | `MessageReaderProvider` | `list_messages(folder, limit) -> list[IncomingMessage]` | message ingestion → `*_message` entities |
| `message_sender_provider(ctx)` | `MessageSenderProvider` | `send(to, subject, body, in_reply_to, cc, attachments) -> dict` | **only** the draft-approval endpoint (`comms/sender.py`) — never a free agent tool |
| `message_listener_provider(ctx)` | `MessageListenerProvider` | `listen(controls) -> None` | the `CommsListenerManager` (`comms/listener_manager.py`) |

`IncomingMessage` is channel-neutral (`external_id`, `sender`, `sender_address`,
`recipients`, `subject`, `body`, `thread_id`, `received_at`, `folder`, `from_me`).
`MessageSenderProvider.send` is human-in-the-loop by contract: it is reached only via
the explicit approval endpoint.

A `MessageListenerProvider` runs its own loop until `controls.should_run()` is
`False`, calling `controls.trigger()` (debounced re-pull) when it *detects* activity
(IMAP IDLE, long-poll) or `controls.sync_now()` each cycle for poll-drain channels.
Signal is the poll-drain example: `SignalListener.listen` just calls
`controls.sync_now()` on a short timer because each `/v1/receive` consumes the queue.

!!! note
    Signal is a comms-only account: `async_setup_entry` returns `[]` (no agent
    tools), and the whole capability is the `signal_message` entity type plus the
    three providers above.

## 5. Capability providers (web search / fetch / weather / compute)

A *capability* is a generic agent feature whose backend is supplied by whatever
integration the user configured. The generic first-party tool stays the same;
integrations register a provider for it. Providers are **duck-typed** runtime
`Protocol`s — an integration returns an instance from the matching hook.

```python
def web_search_provider(self, ctx: SetupContext) -> WebSearchProvider | None:
    key = ctx.secrets.get("api_key")
    return TavilySearchProvider(key) if key else None
```

| Hook | Protocol | Method |
| --- | --- | --- |
| `web_search_provider(ctx)` | `WebSearchProvider` | `search(query, max_results) -> list[WebSearchResult]` |
| `web_fetch_provider(ctx)` | `WebFetchProvider` | `fetch(url) -> str` (a page's readable text) |
| `weather_provider(ctx)` | `WeatherProvider` | `weather(latitude, longitude, hours) -> dict` |
| `compute_provider(ctx)` | `ComputeProvider` | `available()`, `spawn(spec) -> ComputeHandle`, `stop(handle)`, `is_alive(handle)` |

Each provider exposes a `name` (search/fetch/weather) or `id` (compute) identifier.
A capability provider has **no directly-selectable tools of its own** — its manifest
lists the capability under `provides` (e.g. `web_search`, `web_fetch`), the UI hides
it, and the generic capability tool is offered instead.

**First-configured-wins.** `ToolsetAssembler._resolve_capability_providers` walks the
user's **full enabled** integration set (precedence user > org > global, then
integration name) and `_collect_providers` keeps the **first** provider offered for
each of search / fetch / weather — it only assigns each slot if still `None`, and
stops once all three are filled. The resolved `WebProviders` then back the
`web_toolset` / `weather_toolset` for the run.

!!! note
    Web/search/fetch/weather are **ambient**: they are resolved from ALL enabled
    integrations, independent of the per-chat integration *toolset* selection.
    `web_fetch` is local-first — a built-in in-process reader fills the slot when no
    integration provides one. The `integrations_enabled` hard off-switch and the
    governance tier gate (§9) still apply.

Compute precedence is the same shape: `SandboxService` picks the first applicable
integration offering a `compute_provider` (`agent/sandbox/service.py`), else the
admin-default built-in (`settings.sandbox.provider`, default `docker`). A
`ComputeProvider` starts a compute unit running the device-agent with the four `PA_*`
env vars; `ComputeSpec` describes what to start and `ComputeHandle` what was started
(its `provider` id + native `handle`). Tavily is the worked search example; Hetzner /
AWS are the compute examples.

## 6. Surfaces (UI cards / views)

```python
def surfaces(self) -> dict[str, SurfaceDescriptor]:
    return {"trading": SurfaceDescriptor(name="Trading", icon="candlestick_chart",
                                         description="...", config=_trading_surface_config())}
```

A `SurfaceDescriptor` is a Surface (chat mode / dashboard):

| Field | Provides |
| --- | --- |
| `name` | the surface's display name |
| `config` | the Lovelace-style layout (`{"views": [...], "arrangement": {...}}`) |
| `icon` | optional icon |
| `description` | optional description |
| `show_in_nav` | whether it appears in navigation |

`kind` is **derived** from `config` (a chat view ⇒ a chat mode). Views are typed —
e.g. `chat`, or a `cards` view holding generic cards (`iframe`, `entities`, …).

**How it is consumed:** on config-entry setup, `contrib._project_surfaces` UPSERTs
each surface into the `surfaces` table (keyed by slug `<domain>-<key>`), stamped with
`source_domain` and **read-only** (re-projected on reconfigure). A user-scoped entry
yields user surfaces; an org/global entry yields global ones. Lifecycle follows the
config entry — removed when the last entry of the domain in that scope is deleted.

TradingView is the worked example: a `trading` surface that splits a `chat` view
beside a `cards` view holding one generic `iframe` card pointing at the TradingView
embed — a contributed surface, **not** a bespoke view type.

!!! note
    Predefined dashboard **card templates** are a separate, manifest-level
    contribution: `frontend.cards` in `manifest.yaml` (a list of `{key, name, icon,
    description?, card: {type, ...}}`), surfaced in the dashboard card picker. Both
    OpenProject (an `entities` card) and TradingView (an `iframe` card) declare one.

## 7. Agents (delegatable sub-agent personas)

```python
def agents(self) -> dict[str, AgentDescriptor]:
    return {"analyst": AgentDescriptor(name="Markets Analyst", description="...",
                                       instructions=..., requires_surface="tradingview-trading")}
```

An `AgentDescriptor` is a delegatable agent persona:

| Field | Provides |
| --- | --- |
| `name`, `description`, `instructions` | the persona |
| `tool_config` | optional overlay onto the parent run config (empty = inherit all tools) |
| `required_tools` | capability keys that gate when the agent is offered |
| `requires_surface` | a surface slug the agent is restricted to (`None` = any) |

**How it is consumed:** on config-entry setup, `contrib._project_agents` UPSERTs each
into the `delegatable_agents` table (slug `<domain>-<key>`, `source_domain` set),
**read-only** in the UI except `enabled`. A user entry yields `user`-scoped agents; an
org/global entry yields `global` ones. Lifecycle follows the config entry. TradingView
contributes a `Markets Analyst` agent gated to its trading surface.

## 8. Custom events + world-memory predicates

```python
def event_types(self) -> dict[str, EventTypeDescriptor]:
    return {"openproject.wp_overdue": EventTypeDescriptor(
        event_type="openproject.wp_overdue", name="Work package overdue",
        payload_schema=(...,))}
```

An `EventTypeDescriptor` registers a custom platform event:

| Field | Provides |
| --- | --- |
| `event_type` | the bus event name (recommend domain-prefixing) |
| `name` | human label |
| `payload_schema` | a tuple of `FieldDescriptor` describing the payload fields |
| `description` | optional |

**How it is consumed:** declared types are reconciled by the catalog sync
(`integrations/sync.py`) and emitted via the injected `EventEmitter` onto the same
`personal_agent:events` bus, so a Workflow's triggers fire on them exactly like
built-in events.

An integration can also declare **world-memory predicates** for the entity graph:

```python
def relation_types(self) -> dict[str, RelationTypeDescriptor]:
    return {"github:reviewed_by": RelationTypeDescriptor(key="github:reviewed_by", name="...")}
```

`RelationTypeDescriptor` keys **must** be namespaced (`domain:predicate`); core
predicates are unprefixed and not integration-registrable. Inference flags
(`is_transitive` / `is_symmetric`) from an untrusted integration are clamped off by
the sync, and capability/policy predicates can never be integration-registered.

## 9. Health + webhooks

```python
async def async_health(self, ctx: SetupContext) -> HealthResult | None:
    ...
```

`async_health` reports an entry's live-connection health. `HealthResult.status` is
one of `ok` / `degraded` / `error` (class constants `HealthResult.OK` etc.) with a
short English `detail`. **How it is consumed:** the scheduled sync calls it, persists
the result on the config entry (shown in the integrations UI), and **skips the pull
when the connection is down**. Most integrations have no live connection and return
`None`; one with a backing service/bridge (e.g. WhatsApp) returns a result so a
disconnected account surfaces.

```python
async def async_handle_webhook(self, ctx, payload: dict) -> EntityStateSyncResult | None:
    ...
```

`async_handle_webhook` handles an inbound PUSH webhook (the HA webhook analog).
External systems POST to `/webhooks/integration/{entry_id}?token=…` (token =
`integration_webhook_token`); the dispatcher (`entities/webhook.py`) calls this with
the request body. Return an `EntityStateSyncResult` to upsert through the normal
pipeline (events, RAG, live pushes), or `None` to acknowledge without writing. A
robust pattern is to ignore the payload details and re-poll the source.

## 10. The trust model

Two independent axes, both authored in `manifest.yaml`.

### `trust_tier` — trusted vs untrusted (Contract #13)

```yaml
trust_tier: untrusted   # default: trusted
```

`trust_tier` is `"trusted"` (default) or `"untrusted"`. First-party folder
integrations are trusted. An integration that proxies an **external** service whose
output is attacker-influenced (an external MCP server, an arbitrary OpenAPI API)
declares `untrusted`.

**How it is consumed:** when an untrusted integration's toolset is part of a run, the
assembler records its toolset object id; `apply_untrusted_gate`
(`assembler/policy.py`) then wraps every *trusted* toolset in a pydantic-ai
`filtered` view that drops the `HIGH_PRIVILEGE_TOOLS` set (`send_email`, `web_fetch`,
`delegate_to`, `control_entity`, device `dev_*` tools, …) from the model's view. The
gate is presence-based and conservative: it engages for the whole run as soon as one
untrusted server is in the toolchain. The durable worker mirrors this per request.

### `required_tier` — governance (the ordinal data axis, Contract #14)

```yaml
required_tier: internal   # name: unregulated | regulated | internal  (default: unregulated)
```

`required_tier` is the **minimum model-provider trust tier** a run's model must have
for this integration's tools to be assembled. Author it by NAME — `unregulated` (0),
`regulated` (1), `internal` (2) — a typo raises loudly at manifest discovery. It
defaults to `unregulated` (0): an integration carries no tier-gated data unless it
says so. OpenProject declares `internal`, so its data only reaches an internal-tier
(on-prem) model.

**How it is consumed:** a model's PROVIDER has a tier; the gate is
`provider_tier >= required_tier` (`tier_ok` in `agent/governance.py`).
`_assemble_integrations` computes the effective requirement
(`effective_required_tier`, allowing an admin override on the entry) and **skips the
whole integration — tools and capability providers alike — when the run model's
provider tier is below it**. This is THE single governance axis (it replaced the old
`required_provider_tags` tag gate) and the same fail-closed gate runs at every model
resolution entry (inline, durable, workflows, comms).

| Tier | Name | Meaning |
| --- | --- | --- |
| 0 | `unregulated` | any external provider (default, fail-closed) |
| 1 | `regulated` | compliant external (DPA/EU/no-train) |
| 2 | `internal` | own / on-prem — cleared for the most-sensitive data |

## Manifest reference

The non-capability `manifest.yaml` keys that shape discovery and the UI:

| Key | Meaning |
| --- | --- |
| `domain` | the integration id (`^[a-z][a-z0-9_]*$`) |
| `name`, `version` | display name + version string |
| `integration_type` | `tool` / `service` / `knowledge` |
| `config_flow` | whether it has a config-flow wizard |
| `single_instance` | whether more than one config entry is allowed |
| `iot_class` | trust/locality descriptor (only `local_in_process` is fully supported) |
| `requirements` | extra Python requirements |
| `provides` | generic capabilities backed (`web_search`, `web_fetch`, …) |
| `frontend.cards` | predefined dashboard card templates (§6) |
| `quality_scale` | `internal` / `experimental` / `beta` / `stable` (maturity signal) |
| `documentation`, `issue_tracker`, `codeowners` | metadata |

A config flow (`config_flow.py`, a `ConfigFlow` subclass with `async_step_*`
methods) drives the setup wizard; each step's form fields are `FieldDescriptor`s the
generic frontend renderer shows. `password` / `secret` field values are
envelope-encrypted and surface to setup hooks via `ctx.secrets`.
