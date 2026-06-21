# Build an integration

An **integration** is one folder under the integrations directory that contributes
agent tools (and optionally entities, capability providers, sub-agents, surfaces, and
skills) from a *config entry*. The model is deliberately Home-Assistant-shaped: a
`manifest.yaml`, a config-flow wizard, and an integration object with an
`async_setup_entry` lifecycle.

This page walks through the folder structure, the manifest fields, the integration
class and its lifecycle, how the registry discovers and loads integrations, scope and
single- vs multi-instance, and a minimal end-to-end example.

For depth on each half, see [config-flows.md](config-flows.md) (the multi-step config
wizard, field types, validation, reconfigure) and
[integration-capabilities.md](integration-capabilities.md) (entities, capability
providers, agents, surfaces, events).

!!! warning "Backend integrations run full-trust, in-process"
    Discovered integration code is imported and run **in-process in the API and
    worker**. It can read the database and the BYOK master key — a malicious
    integration is a full compromise of every tenant. There is no sandbox for backend
    integration code. The **bundled** in-repo dir is always scanned; external drop-in
    dirs are scanned only when the operator explicitly opts in (see
    [Discovery & loading](#discovery-loading)). Every load is logged at WARNING
    (`integration_loaded_full_trust`).

## Folder structure

One folder per integration, named exactly after its `domain`:

```
integrations/<domain>/
  manifest.yaml          # domain, name, version, config_flow, requirements, …
  __init__.py            # exposes a module-level INTEGRATION instance
  config_flow.py         # ConfigFlow subclass — only if config_flow: true
  tools.py               # builds the pydantic-ai toolset(s)            (as needed)
  providers.py           # capability-provider backends                (as needed)
  entities.py            # entity sync logic                           (as needed)
  translations/<lang>.json   # config-flow labels/errors (server-side i18n)
```

Only `manifest.yaml` and `__init__.py` are required. The other modules exist by
convention — the loader imports `__init__.py` as a synthetic package, so intra-package
relative imports (`from .tools import build_toolset`) resolve. Split your code however
you like; the conventional split is `tools.py` / `providers.py` / `entities.py`.

!!! note "The folder name must equal the `domain`"
    The loader rejects an integration whose `manifest.yaml` `domain` does not match its
    directory name (`integration_domain_mismatch`).

## `manifest.yaml` fields

The manifest is validated against `IntegrationManifest`, which sets `extra="forbid"` —
a typo'd key fails loudly at discovery rather than silently dropping config.

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `domain` | `str` (`^[a-z][a-z0-9_]*$`) | — | Stable id; must equal the folder name. |
| `name` | `str` | — | Human-readable name shown in the UI. |
| `version` | `str` | `"0.0.0"` | Integration version. |
| `integration_type` | `tool` \| `service` \| `knowledge` | `tool` | Broad category. |
| `config_flow` | `bool` | `false` | Whether the integration has a config-flow wizard. |
| `single_instance` | `bool` | `true` | `false` allows multiple config entries (e.g. two accounts). |
| `trust_tier` | `trusted` \| `untrusted` | `trusted` | `untrusted` routes the integration's tools through the Contract #13 high-privilege gate (use for proxies of attacker-influenced external output, e.g. external MCP / arbitrary OpenAPI). |
| `iot_class` | see below | `local_in_process` | Trust/locality descriptor. |
| `requirements` | `tuple[str, …]` | `()` | PyPI deps — **surfaced, never auto-installed**. Bake them into the image/venv. |
| `required_tier` | tier name / int | `0` (`unregulated`) | Minimum model-provider tier for this integration's tools to be assembled (gate = `provider_tier >= required_tier`). Author by name: `unregulated` / `regulated` / `internal`. |
| `provides` | `tuple[str, …]` | `()` | Generic capabilities this integration backs (e.g. `web_search`, `web_fetch`). A pure capability provider has no directly-selectable tools — the UI hides it and offers the generic tool. |
| `dependencies` | `tuple[str, …]` | `()` | Hard deps: loaded first; an unmet dep drops the integration. |
| `after_dependencies` | `tuple[str, …]` | `()` | Soft ordering: load after these if present, never block on them. |
| `config_schema_version` | `int` | `1` | Bumped when stored entry config changes shape (see `async_migrate_entry`). |
| `codeowners` | `tuple[str, …]` | `()` | Maintainers. |
| `documentation` | `str \| None` | `None` | Docs URL. |
| `quality_scale` | `internal` \| `experimental` \| `beta` \| `stable` | `experimental` | Maturity signal in the admin view. |
| `issue_tracker` | `str \| None` | `None` | URL for reporting problems. |
| `frontend` | object | `{}` | Frontend contributions (`renderers`, `panels`, `slash_commands`, `cards`). |

`iot_class` is one of `local_in_process`, `local_polling`, `local_push`,
`cloud_polling`, `cloud_push`.

!!! warning "`required_tier` is the single data-governance axis"
    A typo'd `required_tier` raises at discovery rather than silently un-gating. An
    integration carries no tier-gated data unless it *says* so — declare up for
    sensitive data (e.g. OpenProject sets `required_tier: internal` so its work-package
    data only reaches an internal-tier model).

A minimal manifest:

```yaml
domain: text_tools
name: Text Tools
version: "0.1.0"
integration_type: tool
config_flow: false
single_instance: true
iot_class: local_in_process
codeowners:
  - "@you"
documentation: https://example.com/docs
```

## The integration class

`__init__.py` must expose a module-level `INTEGRATION` that is an instance of a
`PersonalAgentIntegration` subclass. The loader injects `manifest` and (when
`config_flow: true`) `config_flow_cls` onto it; you override the lifecycle methods you
need.

```python
from __future__ import annotations

from typing import Any

from personal_agent.integrations.integration import PersonalAgentIntegration, SetupContext

from .tools import build_toolset


class TextToolsIntegration(PersonalAgentIntegration):
    async def async_setup_entry(self, ctx: SetupContext) -> list[Any]:
        return [build_toolset()]


INTEGRATION = TextToolsIntegration()
```

When `config_flow: true`, point the class at its flow either by class attribute or by
exposing a module-level `CONFIG_FLOW` (the loader picks up either):

```python
class TavilyIntegration(PersonalAgentIntegration):
    config_flow_cls = TavilyConfigFlow
```

### `async_setup_entry(ctx)` — the lifecycle hook

`async_setup_entry` is called once per *config entry* (one configured instance) and
returns the pydantic-ai toolsets that entry contributes — typically a single
`FunctionToolset`. Return `[]` if the integration contributes no direct tools (a pure
capability provider or a comms account does this).

Everything the hook needs arrives on the `SetupContext`:

| Field | Type | Meaning |
| --- | --- | --- |
| `entry_id` | `str` | The config entry's id. |
| `domain` | `str` | The integration domain. |
| `scope` | `str` | `user` / `org` / `global` / `group`. |
| `owner_sub` | `str \| None` | The owning user (user-scoped entries). |
| `org_id` | `str \| None` | The org (org/group-scoped entries). |
| `data` | `dict[str, Any]` | Non-secret entry config (e.g. `base_url`). |
| `secrets` | `dict[str, str]` | **Decrypted** secret-field values. In-memory only. |
| `version` | `int` | The entry's `config_schema_version`. |

!!! warning "Never log or serialize `ctx.secrets`"
    `secrets` holds decrypted values (API keys, tokens). It lives in memory only and
    must never be logged or serialized into Temporal inputs (BYOK Contract #5).

A toolset built from a `SetupContext` reads non-secret config from `ctx.data` and
secrets from `ctx.secrets`:

```python
import httpx
from pydantic_ai.toolsets import FunctionToolset
from personal_agent.integrations.integration import SetupContext


def build_toolset(ctx: SetupContext) -> FunctionToolset:
    base = str(ctx.data.get("base_url") or "").rstrip("/")
    auth = httpx.BasicAuth("apikey", ctx.secrets.get("api_key") or "")
    ts = FunctionToolset()

    @ts.tool_plain
    async def my_tool(query: str) -> list[str]:
        """A docstring the model sees — describe what the tool does and returns."""
        async with httpx.AsyncClient(timeout=25.0, auth=auth) as client:
            resp = await client.get(f"{base}/api/search", params={"q": query})
            resp.raise_for_status()
            return [item["title"] for item in resp.json()["items"]]

    return ts
```

!!! note "Return typed, compact results"
    Tools should return typed Pydantic models (or an action-result envelope) and cap
    list sizes so output stays small — never truncate a serialized string. See the
    `openproject` tools for the established pattern.

### Other lifecycle hooks

All have sensible no-op/empty defaults — override only what you use:

| Method | Purpose |
| --- | --- |
| `async_unload_entry(ctx)` | Release resources tied to an entry (default no-op). |
| `async_migrate_entry(ctx, from_version)` | Migrate stored entry config across `config_schema_version`. |
| `entity_types()` / `async_sync_entities(ctx)` | Become an entity provider (pull). |
| `async_initial_entities(ctx)` | Seed self-owned entities once on first setup. |
| `async_call_action(ctx, …)` | Handle a controllable entity action. |
| `async_handle_webhook(ctx, payload)` | Handle an inbound push webhook for an entry. |
| `async_health(ctx)` | Report live-connection health (default `None` = no connection concept). |
| `event_types()` / `relation_types()` | Declare custom events / world-memory predicates. |
| `agents()` / `surfaces()` | Contribute delegatable sub-agents / chat-mode-or-dashboard surfaces. |
| `web_search_provider` / `web_fetch_provider` / `weather_provider` | Back a generic web capability. |
| `message_reader_provider` / `message_sender_provider` / `message_listener_provider` | Back comms ingestion / sending / real-time listening. |
| `compute_provider(ctx)` | Back the on-demand cloud sandbox. |

The entity, capability-provider, agent, and surface hooks are covered in
[integration-capabilities.md](integration-capabilities.md).

## The config flow

If `config_flow: false`, the integration is set up without user input (like
`text_tools`). Otherwise add a `config_flow.py` with a `ConfigFlow` subclass.

Most flows are a single form with optional connection-test validation, so subclass
`SimpleConfigFlow` and declare only what differs:

```python
from personal_agent.integrations.manifest import FieldDescriptor
from personal_agent.integrations.simple_flow import SimpleConfigFlow

SCHEMA = [
    FieldDescriptor(
        name="api_key",
        label="field.api_key.label",   # an i18n key resolved from translations/<lang>.json
        type="secret",                 # write-only, envelope-encrypted
        required=True,
        description="field.api_key.description",
    ),
]


class MyConfigFlow(SimpleConfigFlow):
    domain = "myservice"
    SCHEMA = SCHEMA
    TITLE_FIELD = "api_key"   # which field becomes the entry title

    async def validate(self, data):
        # Return a localized error KEY ("auth_failed") or None on success.
        # Raising is fine — the exception is logged but NEVER shown to the user.
        return None
```

Each `FieldDescriptor` is a JSON-serializable form-field description the frontend
renders generically. `type` is one of `text`, `password`, `secret`, `number`, `bool`,
`select`, `note`, or a typed selector (`entity`, `device`, `area`, `duration`, `date`,
`time`, `datetime`, `color`). `password`/`secret` values are envelope-encrypted
(`password` is shown masked, `secret` is write-only). `note` is a read-only display
field that can carry an `image` (e.g. a QR for device linking).

Multi-step flows (e.g. enter a number, then scan a QR, then confirm) subclass
`ConfigFlow` directly and implement `async_step_user` plus further `async_step_<id>`
methods, returning `async_show_form` / `async_create_entry` / `async_abort`. Accumulated
input from prior steps arrives as `self._collected`. The `signal` integration is the
canonical multi-step example. Full details are in [config-flows.md](config-flows.md).

## Discovery & loading

The registry (`IntegrationRegistry`) is built once in the API/worker lifespan from
`loader.discover(settings)` and stashed on `app.state.integrations`. Discovery:

1. Resolves the dirs to scan: the bundled in-repo dir (`bundled_dir`, default
   `integrations`, resolved relative to the repo root) is always scanned. External
   drop-in dirs (`external_dirs`) are scanned **only** when `allow_external` is true.
2. For each child folder, parses `manifest.yaml` against `IntegrationManifest`,
   verifies `domain == folder name`, imports `__init__.py` as a synthetic package, and
   resolves the module-level `INTEGRATION` (must be a `PersonalAgentIntegration`
   instance), injecting `manifest` and `config_flow_cls`.
3. Checks `requirements` are importable (a missing one is **warned, never installed**),
   then logs the load at WARNING.
4. Topologically orders by hard `dependencies` (an unmet dep drops the integration) and
   soft `after_dependencies`.

A bad manifest or a failed import is logged and skipped — boot never crashes. At
startup the discovered set is also synced into the `integrations` table (`sync.py`):
rows are upserted by `domain` and marked `loaded`; a domain that disappears is marked
`not_found` (never deleted, so config entries survive a temporary disappearance).
Admin-owned columns (`enabled`, `allowed_scopes`) are never overwritten by the sync.

The relevant settings (env prefix `PERSONAL_AGENT__INTEGRATIONS__`):

| Setting | Default | Meaning |
| --- | --- | --- |
| `enabled` | `true` | Disable the whole integration tier. |
| `bundled_dir` | `integrations` | In-repo bundled dir (relative to repo root). |
| `external_dirs` | `[]` | Operator-supplied absolute drop-in dirs. |
| `allow_external` | `false` | Must be explicitly true to scan `external_dirs` (full-trust RCE surface). |
| `flow_ttl_seconds` | `600` | TTL of in-progress config-flow state in Redis. |

## Single- vs multi-instance, and scope

**Instances.** `single_instance: true` (the default) means one config entry per
scope/owner. Set `single_instance: false` to allow several — e.g. two `email` or two
`signal` accounts. Each entry gets its own `async_setup_entry(ctx)` call with its own
`ctx.data` / `ctx.secrets`, so write your `build_toolset(ctx)` to be per-entry.

**Scope.** A config entry is owned by a *scope*: `user`, `org`, `global`, or `group`.
`ctx.scope`, `ctx.owner_sub`, and `ctx.org_id` reflect it. Scope decides who can use
the entry's tools and how its contributions are projected:

- A **user** entry → user-scoped tools, and contributions (skills / agents / surfaces)
  owned by that user.
- **org / global** entries → owner-less contributions visible to the whole scope
  (org entries keep their `org_id`).

Which scopes may configure an integration is an admin-governed property
(`allowed_scopes` on the integration row), not a manifest field.

## End-to-end example

A minimal `service`-type integration with a config flow and a single tool. Folder
`integrations/myservice/`:

`manifest.yaml`:

```yaml
domain: myservice
name: My Service
version: "0.1.0"
integration_type: service
config_flow: true
single_instance: true
iot_class: cloud_polling
codeowners:
  - "@you"
documentation: https://example.com/myservice
```

`config_flow.py`:

```python
from __future__ import annotations

from personal_agent.integrations.manifest import FieldDescriptor
from personal_agent.integrations.simple_flow import SimpleConfigFlow

SCHEMA = [
    FieldDescriptor(
        name="base_url",
        label="field.base_url.label",
        type="text",
        required=True,
        placeholder="field.base_url.placeholder",
    ),
    FieldDescriptor(
        name="api_key",
        label="field.api_key.label",
        type="secret",
        required=True,
    ),
]


class MyServiceConfigFlow(SimpleConfigFlow):
    domain = "myservice"
    SCHEMA = SCHEMA
    TITLE_FIELD = "base_url"
```

`tools.py`:

```python
from __future__ import annotations

import httpx
from pydantic import BaseModel
from pydantic_ai.toolsets import FunctionToolset

from personal_agent.integrations.integration import SetupContext


class Hit(BaseModel):
    """One search hit: ``title`` and ``url``."""

    title: str
    url: str


def build_toolset(ctx: SetupContext) -> FunctionToolset:
    base = str(ctx.data.get("base_url") or "").rstrip("/")
    key = ctx.secrets.get("api_key") or ""
    ts = FunctionToolset()

    @ts.tool_plain
    async def myservice_search(query: str) -> list[Hit]:
        """Search My Service. Returns a list of Hit (title, url)."""
        async with httpx.AsyncClient(
            timeout=20.0, headers={"Authorization": f"Bearer {key}"}
        ) as client:
            resp = await client.get(f"{base}/api/search", params={"q": query})
            resp.raise_for_status()
            items = resp.json().get("results") or []
        return [Hit(title=i.get("title") or "", url=i.get("url") or "") for i in items]

    return ts
```

`__init__.py`:

```python
from __future__ import annotations

from typing import Any

from personal_agent.integrations.integration import PersonalAgentIntegration, SetupContext

from .config_flow import MyServiceConfigFlow
from .tools import build_toolset


class MyServiceIntegration(PersonalAgentIntegration):
    config_flow_cls = MyServiceConfigFlow

    async def async_setup_entry(self, ctx: SetupContext) -> list[Any]:
        return [build_toolset(ctx)]


INTEGRATION = MyServiceIntegration()
```

Drop the folder under the bundled integrations dir, add a `translations/<lang>.json`
for the field labels, restart the API and worker, and the integration is discovered,
synced into the `integrations` table, and configurable from the UI.

## Where to go next

- [config-flows.md](config-flows.md) — multi-step wizards, field/selector types,
  field- and connection-level validation, reconfigure.
- [integration-capabilities.md](integration-capabilities.md) — entities (pull/push,
  RAG, actions, events), capability providers (web / comms / compute), and contributing
  agents and surfaces.
