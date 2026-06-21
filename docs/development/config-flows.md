# Config flows

A **config flow** is an integration's setup wizard — the schema-driven, multi-step
form a user fills in to add an instance of an integration (an OpenProject URL + API
key, an email account, a Signal link QR, …). It is the Home Assistant config-flow
analog: each step returns a result that either shows a form, creates a config entry,
or aborts. The frontend renders any integration's form **generically** from a list of
field descriptors, so an integration author writes Python + translations and never
touches the SPA.

This page covers the base classes, the field descriptor types, validation and step
handling, single- vs multi-step flows, reconfigure, and i18n.

## Where the pieces live

| File | Role |
| --- | --- |
| `integrations/config_flow.py` | `ConfigFlow` base class, `FlowResult`, `FlowContext`, `FlowResultType`, the `async_show_form` / `async_create_entry` / `async_abort` helpers |
| `integrations/simple_flow.py` | `SimpleConfigFlow` — boilerplate-free single-step base (most integrations use this) |
| `integrations/manifest.py` | `FieldDescriptor`, `SelectOption`, the `FieldType` literal, the manifest schema (`config_flow`, `single_instance`, …) |
| `integrations/flow_manager.py` | `FlowManager` — orchestrates start/advance, encrypts secrets, writes the config entry, localizes labels |
| `integrations/flow_store.py` | Redis-backed flow state (multi-replica safe) |
| `integrations/translations.py` | Server-side i18n resolution of label/error keys |

The above paths are under `services/api/src/personal_agent/integrations/`. The
integration folders themselves (`config_flow.py`, `manifest.yaml`,
`translations/<lang>.json`) live at the repo root under `integrations/<domain>/`.

!!! note "Manifest opt-in"
    A flow only runs if the integration's `manifest.yaml` sets `config_flow: true`.
    An integration with `config_flow: false` (or unset) is a zero-step flow: enabling
    it immediately creates an empty config entry. `single_instance: true` (the default)
    makes `start()` abort with `already_configured` if an entry already exists for that
    scope.

## The `ConfigFlow` base class

A flow is a subclass of `ConfigFlow` that declares one or more **step methods** named
`async_step_<step_id>`. `async_step_user` is the mandatory entry point.

```python
class ConfigFlow(ABC):
    domain: str = ""
    VERSION: int = 1

    def __init__(self, context: FlowContext) -> None:
        self.context = context
        self._collected: dict[str, Any] = {}  # plaintext input accumulated across steps

    @abstractmethod
    async def async_step_user(self, user_input: dict[str, Any] | None) -> FlowResult: ...

    # helpers
    def async_show_form(self, *, step_id, data_schema, errors=None,
                        description_placeholders=None) -> FlowResult: ...
    def async_create_entry(self, *, title, data) -> FlowResult: ...
    def async_abort(self, *, reason) -> FlowResult: ...
```

A step method receives `user_input`:

- `None` on the **first** entry into a step — return `async_show_form(...)` to render
  the empty form.
- a `dict` of submitted values on a **subsequent** call — validate it, then either
  re-show the form (with errors), advance to another step, or create the entry.

The flow object is **re-instantiated per HTTP step** — it holds no state between
steps. Accumulated input from earlier steps is injected by the `FlowManager` as
`self._collected` (see [State and the flow manager](#state-and-the-flow-manager)).

### `FlowContext`

`self.context` carries who/what the flow is for:

| Field | Meaning |
| --- | --- |
| `domain` | the integration domain |
| `scope` | `user` / `group` / `org` / `global` |
| `owner_sub` | the owning user's subject (when user-scoped) |
| `org_id` | the org id (when org/group-scoped) |
| `entry_id` | set **only** when reconfiguring an existing entry |
| `scope_ref` | the unified principal (`user:<sub>` / `group:<id>` / `org:<id>` / `global`) stamped on the created entry |

### `FlowResult`

Every step returns a `FlowResult` whose `type` is one of:

| `FlowResultType` | Built by | Effect |
| --- | --- | --- |
| `FORM` | `async_show_form(...)` | render `data_schema` for `step_id`, surface `errors`, `description_placeholders` |
| `CREATE_ENTRY` | `async_create_entry(...)` | persist a config entry with `title` + `data`, end the flow |
| `ABORT` | `async_abort(...)` | end the flow with a `reason` |

## Field descriptor types

A form schema is a `list[FieldDescriptor]`. The descriptor is the JSON-serializable
description of one field; the generic frontend renderer turns it into the right input.

```python
class FieldDescriptor(BaseModel):
    name: str
    label: str                       # i18n KEY (resolved server-side)
    type: FieldType = "text"
    required: bool = True
    default: Any | None = None
    options: tuple[SelectOption, ...] | None = None   # for select
    placeholder: str | None = None   # i18n KEY
    description: str | None = None   # i18n KEY
    multiline: bool = False
    image: str | None = None         # for type="note": a data-URL (e.g. a QR)
    filter: dict[str, Any] | None = None   # narrow a typed selector
    multiple: bool = False           # entity/device/area/select → multi-select (value is a list)
```

`label`, `placeholder` and `description` are **i18n keys**, not literal text — see
[Internationalisation](#internationalisation-of-labels).

### Field types (`FieldType`)

Basics:

| `type` | Renders / stores | Notes |
| --- | --- | --- |
| `text` | single-line text | set `multiline=True` for a textarea |
| `password` | masked text | envelope-encrypted secret; shown masked (last 4) on reconfigure |
| `secret` | write-only text | envelope-encrypted secret; never echoed back |
| `number` | numeric input | preserved as int/float |
| `bool` | toggle / checkbox | |
| `select` | dropdown | requires `options` (a tuple of `SelectOption(value, label)`) |
| `note` | **read-only** display | instructions + optional `image` (e.g. a device-linking QR) |

Typed selectors (the Home Assistant `selector` analog) bind a field to a richer
picker the generic renderer knows how to show:

| `type` | Picks |
| --- | --- |
| `entity` | one of the user's entities — narrow with `filter` (e.g. `{"domain": "openproject", "entity_type": "work_package"}`) |
| `device` | a connected device |
| `area` | an area/room |
| `duration` | a length of time (rendered as a duration input, stored as seconds) |
| `date` / `time` / `datetime` | the corresponding picker |
| `color` | a hex color |

`multiple=True` turns `entity` / `device` / `area` / `select` into a multi-select; the
field value is then a list.

!!! note "Secrets are anything `password` or `secret`"
    `FieldDescriptor.is_secret` is `True` for exactly those two types. The
    `FlowManager` records secret field names from every shown form and keeps their
    values **encrypted** in the Redis flow blob and, on completion, in
    `integration_config_secrets`. Non-secret values go into the entry's plaintext
    `config`.

## `SimpleConfigFlow` — the common case

Most integrations are a single form: show fields, strip/validate the required ones,
optionally run a connection test, create the entry. `SimpleConfigFlow` encodes that
once. A subclass only sets a `SCHEMA` (and a title field) and, optionally, overrides a
few hooks:

| Override | Purpose | Default |
| --- | --- | --- |
| `SCHEMA` | the `list[FieldDescriptor]` | `[]` |
| `TITLE_FIELD` | which field's value becomes the entry title | `""` (→ domain name) |
| `ENTRY_FIELDS` | which fields go into the entry `data` | all schema fields |
| `VALIDATE_TIMEOUT` | seconds before `validate()` is cancelled | `15.0` |
| `preprocess(user_input)` | normalise raw input | strips text fields; `rstrip('/')` on `url` / `site` / `*_url`; coerces `number` |
| `validate_fields(data) -> dict[str, str]` | sync field-level checks (returns `{field: error_key}`) | checks `required` fields for empty values |
| `async validate(data) -> str | None` | async connection test (returns an error key or `None`) | no-op (always OK) |
| `entry_title(data)` | computed title | the `TITLE_FIELD` value |
| `entry_data(data)` | the dict stored as entry data | the `ENTRY_FIELDS` |

`SimpleConfigFlow` already implements `async_step_user` **and**
`async_step_reconfigure` (both reuse the same handler), so a single-step integration
is reconfigurable for free.

!!! warning "Never leak credentials into form text"
    `validate()` runs inside `asyncio.wait_for(VALIDATE_TIMEOUT)`. A timeout or any
    uncaught exception is logged at ERROR and the user sees a generic
    `connection_failed` error — the raw exception (which may carry host/port/credential
    fragments) is **never** shown. Return an explicit error key for *clear* failures
    (e.g. `auth_failed` on a 401), and prefer **not** to block on ambiguous network
    errors so a valid credential behind a flaky endpoint isn't rejected.

### Worked example — `SimpleConfigFlow`

The OpenProject flow (`integrations/openproject/config_flow.py`): a base URL + a
secret API key, validated against the OpenProject API.

```python
from typing import Any, ClassVar

import httpx
from personal_agent.integrations.manifest import FieldDescriptor
from personal_agent.integrations.simple_flow import SimpleConfigFlow

SCHEMA = [
    FieldDescriptor(
        name="base_url",
        label="field.base_url.label",
        type="text",
        required=True,
        placeholder="field.base_url.placeholder",
        description="field.base_url.description",
    ),
    FieldDescriptor(
        name="api_key",
        label="field.api_key.label",
        type="secret",
        required=True,
        description="field.api_key.description",
    ),
]


class OpenProjectConfigFlow(SimpleConfigFlow):
    domain = "openproject"
    SCHEMA = SCHEMA
    TITLE_FIELD = "base_url"
    ENTRY_FIELDS: ClassVar[list[str]] = ["base_url", "api_key"]

    def validate_fields(self, data: dict[str, Any]) -> dict[str, str]:
        errors = super().validate_fields(data)  # required checks
        url = str(data.get("base_url") or "")
        if "base_url" not in errors and not url.startswith(("http://", "https://")):
            errors["base_url"] = "invalid_url"
        return errors

    async def validate(self, data: dict[str, Any]) -> str | None:
        """Error key on a clear auth failure; None on success OR a network error."""
        try:
            async with httpx.AsyncClient(
                timeout=10.0, auth=httpx.BasicAuth("apikey", data["api_key"])
            ) as client:
                resp = await client.get(
                    f"{data['base_url']}/api/v3/users/me",
                    headers={"Accept": "application/json"},
                )
            if resp.status_code in (401, 403):
                return "auth_failed"
            return None
        except Exception:
            return None  # don't block a possibly-valid key behind a flaky endpoint
```

A `select` field declares its choices as `SelectOption(value, label)` tuples (the
`label` is itself an i18n key), as the Helpers integration does:

```python
from personal_agent.integrations.manifest import FieldDescriptor, SelectOption

FieldDescriptor(
    name="kind",
    label="field.kind.label",
    type="select",
    default="toggle",
    options=(
        SelectOption(value="toggle", label="field.kind.toggle"),
        SelectOption(value="number", label="field.kind.number"),
        SelectOption(value="button", label="field.kind.button"),
    ),
    description="field.kind.description",
)
```

## Multi-step flows

When setup needs more than one screen — a credential step, then a device-linking step,
then a confirmation — subclass `ConfigFlow` directly and write multiple
`async_step_<id>` methods. Each `async_show_form(step_id=...)` names the step the
*next* submission will be dispatched to, and values from earlier steps are available on
`self._collected`.

### Worked example — multi-step (`ConfigFlow`)

The Signal flow (`integrations/signal/config_flow.py`): step 1 collects the number;
step 2 (`link`) shows a QR `note` field and polls until the device is linked.

```python
from typing import Any

from personal_agent.integrations.config_flow import ConfigFlow, FlowResult
from personal_agent.integrations.manifest import FieldDescriptor

from .client import linked_numbers, qrcode_link
from .providers import DEFAULT_BASE

USER_SCHEMA = [
    FieldDescriptor(
        name="number",
        label="field.number.label",
        type="text",
        placeholder="field.number.placeholder",
        description="field.number.description",
    ),
    FieldDescriptor(
        name="base_url",
        label="field.base_url.label",
        type="text",
        required=False,
        default=DEFAULT_BASE,
        description="field.base_url.description",
    ),
]


def _qr_form(self: ConfigFlow, qr: str | None, label: str, error: str | None) -> FlowResult:
    fields = [FieldDescriptor(name="qr", label=label, type="note", required=False, image=qr)]
    return self.async_show_form(
        step_id="link", data_schema=fields, errors={"base": error} if error else None
    )


class SignalConfigFlow(ConfigFlow):
    domain = "signal"

    async def async_step_user(self, user_input: dict[str, Any] | None) -> FlowResult:
        if user_input is None:
            return self.async_show_form(step_id="user", data_schema=USER_SCHEMA)

        number = str(user_input.get("number") or "").strip()
        base_url = str(user_input.get("base_url") or DEFAULT_BASE).strip().rstrip("/")
        if not number.startswith("+") or not number[1:].replace(" ", "").isdigit():
            return self.async_show_form(
                step_id="user", data_schema=USER_SCHEMA, errors={"number": "invalid_number"}
            )
        try:
            nums = await linked_numbers(base_url)
        except Exception:
            return self.async_show_form(
                step_id="user", data_schema=USER_SCHEMA, errors={"base": "unreachable"}
            )
        if number in nums:  # already linked → done
            return self.async_create_entry(
                title=number, data={"number": number, "base_url": base_url}
            )
        try:
            qr = await qrcode_link(base_url)
        except Exception:
            return self.async_show_form(
                step_id="user", data_schema=USER_SCHEMA, errors={"base": "unreachable"}
            )
        return _qr_form(self, qr, "link.instructions", None)  # advance to the "link" step

    async def async_step_link(self, user_input: dict[str, Any] | None) -> FlowResult:
        # Values from the "user" step are on self._collected.
        number = str(self._collected.get("number") or "").strip()
        base_url = str(self._collected.get("base_url") or DEFAULT_BASE).strip().rstrip("/")
        try:
            nums = await linked_numbers(base_url)
        except Exception:
            nums = []
        if number in nums:
            return self.async_create_entry(
                title=number, data={"number": number, "base_url": base_url}
            )
        try:
            qr = await qrcode_link(base_url)  # re-issue a fresh QR
        except Exception:
            qr = None
        return _qr_form(self, qr, "link.not_linked", "not_linked")
```

Things to note from this example:

- The form for the next step sets `step_id="link"`, so the next submission is
  dispatched to `async_step_link`.
- `type="note"` with `image=<data-url>` shows a read-only QR; it carries no value.
- Step 2 reads the number/base URL it never saw in its own `user_input` from
  `self._collected` — the manager rehydrated it.

### Validation and the flow-result contract

The cardinal rule: **validation never raises out as a 500**. A step maps bad input to
`errors[field]` (or `errors["base"]` for connection-level failures) and re-shows the
form (HTTP 200). The `errors` dict maps a field name (or `"base"`) to an **error key**,
which the manager localizes via `error.<key>` (see below).

`description_placeholders` lets a step inject runtime values into a step's localized
description text (e.g. an account name read back from the service).

## Single- vs multi-step, and reconfigure

- **Single-step**: subclass `SimpleConfigFlow`, declare `SCHEMA`. You get
  `async_step_user` and reconfigure for free.
- **Multi-step**: subclass `ConfigFlow`, write `async_step_user` plus more
  `async_step_<id>` methods, chaining via `async_show_form(step_id=...)`.

**Reconfigure** edits an existing entry in place rather than creating a new one. The
`FlowManager` starts a reconfigure when called with an `entry_id`:

1. The existing entry's non-secret `config` and **decrypted** secrets are pre-loaded
   into `self._collected`, so the first step can reuse or re-show them.
2. If the flow defines `async_step_reconfigure`, that runs as the first step; otherwise
   the normal `async_step_user` runs.
3. On `CREATE_ENTRY`, the manager **updates** the existing entry instead of inserting a
   new one (no `already_configured` abort, no duplicate). If the entry vanished
   mid-flow it aborts with `entry_not_found`.

`SimpleConfigFlow` provides `async_step_reconfigure` by delegating to the user step, so
re-running the same form (pre-filled) is the default behaviour. Add a dedicated
`async_step_reconfigure` only when the edit path should differ from initial setup.

!!! note "Clearing an optional secret on reconfigure"
    A secret field **omitted** from a submission is preserved (the pre-loaded value
    survives). Submitting it **empty** explicitly clears it. A non-empty value replaces
    it.

## State and the flow manager

`FlowManager` (`flow_manager.py`) orchestrates the whole wizard:

- **`start(...)`** — instantiates the flow, runs the first step, allocates a `flow_id`,
  and persists state. Handles the `single_instance` abort and the zero-step
  (no-config) integration case.
- **`advance(flow_id, user_input, ...)`** — rehydrates the flow (non-secret
  `collected` + decrypted prior secrets → `self._collected`), dispatches the current
  step, merges the new input into tracked state, and on `CREATE_ENTRY` writes (or
  updates) the entry and deletes the flow state.
- **`abort(flow_id)`** — drops the flow state.

State lives in **Redis** (`flow_store.py`, key `personal_agent:flow:{flow_id}`, ~10 min
TTL), not in process memory, because the API is multi-pod — step 2 may land on a
different replica than step 1. Secret values inside that blob are stored **encrypted**
(via `CryptoService`); they are decrypted only transiently to feed the flow or to write
the final entry.

The manager also tracks **secret field names** seen across forms, so it knows which of
the submitted values to encrypt. A step may compute derived **non-secret** config (a
value not entered via a form field, e.g. an account number read back from the service)
by stashing it on `self._collected`; the manager persists those too.

### HTTP surface

The flow is driven over HTTP by `api/routers/integrations.py`:

| Method + path | Action |
| --- | --- |
| `POST /config-flows` | start a new flow (`{domain, scope, …}`) |
| `POST /config-flows/{flow_id}` | advance with `{user_input}` |
| `DELETE /config-flows/{flow_id}` | abort |
| `POST /config-entries/{entry_id}/reconfigure` | start a reconfigure flow for an existing entry |

Each call returns the **serialized** `FlowResult`: `type`, `flow_id`, `step_id`,
`title`, `reason`, localized `errors`, the localized `data_schema`, and
`description_placeholders`. On `create_entry` the response also carries `entry_id`. The
serializer resolves every label/placeholder/description/option label and every error
code to a localized string before it reaches the client.

## Internationalisation of labels

Field labels and error messages are **i18n keys**, not literal strings. The integration
ships translations under `integrations/<domain>/translations/<lang>.json`. The engine
(`translations.py`) resolves a dotted key (e.g. `field.api_key.label`) against the
requested language, falling back to `en`, then to the raw key if nothing matches.

Conventions:

- A field's `label` / `placeholder` / `description` are keys like
  `field.<name>.label`, `field.<name>.placeholder`, `field.<name>.description`.
- A `SelectOption.label` is a key like `field.<name>.<value>`.
- An error key `X` returned in `errors` resolves to `error.X`.
- Free-form `note` step text uses any key you choose (e.g. `link.instructions`).

Example `translations/en.json` (OpenProject):

```json
{
  "title": "OpenProject",
  "field": {
    "base_url": {
      "label": "OpenProject URL",
      "placeholder": "https://openproject.example.com",
      "description": "Your OpenProject instance URL (without /api)."
    },
    "api_key": {
      "label": "API key",
      "description": "Your personal API key (Account settings → Access tokens → API). Stored encrypted."
    }
  },
  "error": {
    "invalid_url": "Enter a URL starting with http:// or https://",
    "required": "This field is required",
    "auth_failed": "Authentication failed — check the URL and API key."
  }
}
```

Add one `<lang>.json` per supported language (e.g. `en.json`, `de.json`). All hard-coded
**keys** in Python stay stable; only the JSON values are translated.

## Checklist for a new flow

1. `manifest.yaml`: set `config_flow: true` (and `single_instance` as appropriate).
2. `config_flow.py`: subclass `SimpleConfigFlow` (single step) or `ConfigFlow`
   (multi-step); set `domain` and the schema; map every failure to an error key.
3. `translations/en.json` (+ other langs): provide `field.*` labels and `error.*`
   messages for every key you reference.
4. Keep secrets as `type="secret"` / `type="password"` so they're encrypted; put
   non-secret values into the entry `config`.
