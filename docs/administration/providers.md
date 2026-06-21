# Providers

The **Providers** page (admin console) is where you connect the LLM model
providers that power every chat, agent run and background task. Platform
providers are the **only** model source for users — there is no user-facing BYOK,
so a model is only selectable once an admin has configured its provider and
enabled the model here.

The core flow is simple: *set a key per provider — its available models are then
fetched from the provider API. Toggle which models users may pick.*

!!! note "Key storage must be enabled"
    Providers can only be configured when a master key is present. Without one,
    `Add provider` is disabled and a warning banner is shown — keys cannot be
    stored.

## Adding a provider

Click `Add provider` and pick one from the menu. The picker lists every
provider from the static catalog that isn't configured yet, plus a
**Custom provider (self-hosted)** option for a DB-defined endpoint.

The add dialog asks for:

| Field | Notes |
| --- | --- |
| `Display name` | Only for providers that require a base URL. |
| `Base URL` | For OpenAI-compatible / custom providers, e.g. `https://…/v1`. |
| `API key` | At least 8 characters. Stored encrypted; only the last 4 digits are shown afterwards. |

`Save & fetch models` stores the key and immediately queries the provider API
for its model list. A toast reports how many models were found (or warns if none
were — check the key/base URL).

### Custom & keyless providers

The **Custom provider** dialog defines a DB-driven provider without a code edit:
a `Provider ID` (lowercase letters, digits, `-`, `_`), a `Display name`, a
`Base URL`, an optional `Default max tokens`, and a `Keyless` toggle for local
servers that need no key (e.g. a self-hosted Whisper/TTS endpoint). Keyless
providers are reached directly at their base URL and are usable immediately.

## Managing a configured provider

Each configured provider expands to show its key, governance settings and model
list. The header summarizes how many models are active (e.g. `4/12 models
active`).

- `Replace key` — rotate the API key (also re-fetches models).
- `Refresh models` — re-query the provider's model list.
- `Remove` — delete the provider, its key and its model selection.

### Governance

Two provider-level governance controls apply to **all** the provider's models:

| Field | Effect |
| --- | --- |
| `Trust tier` | Data-governance clearance — `internal` (on-prem) reaches the most sensitive data, `regulated` is for compliant external providers, `unregulated` is any external provider. This is the fail-closed data-classification gate, not a routing hint. |
| `Routing tags` | Category tags (`frontier`, `coding`…) that drive Auto model selection. Not governance. |

## Choosing which models users may pick

Below governance, each discovered model has a toggle. **Only enabled models are
selectable by users.** When a model is enabled, three per-model settings appear:

| Control | Effect |
| --- | --- |
| Model tags | Per-model routing tags (`frontier`, `coding`…) layered on top of the provider tags, used by Auto selection. |
| `Quality` (0–20) | An admin within-tier ranking nudge for Auto — breaks a capability tie toward this model (e.g. a direct provider over a reselling proxy). It never crosses a trust tier or overrides the capability score. |
| Pricing (tag icon) | Opens the per-model pricing override dialog. The icon is highlighted when an override is set, grey when the genai-prices default applies. |

## Model pricing

Pricing overrides are edited inline from each model's tag icon (the standalone
pricing page is gone). The dialog sets prices **per 1,000,000 tokens** in the
chosen currency:

| Field | Notes |
| --- | --- |
| `Input` / `Output` | Prompt and completion price per Mtok. |
| `Cache hit` / `Cache write` | Prompt-cache read/write price per Mtok. |
| `Currency` | Defaults to `USD`. |

`Remove override` reverts the model to the catalog price.

!!! note "Overrides vs. the catalog"
    These prices override the built-in catalog (`genai-prices`). Anything not set
    here is priced via genai-prices automatically. An override with an empty
    provider applies model-wide; one pinned to a provider takes precedence over a
    provider-less row for the same model.

The page also hosts related admin settings that depend on the same provider
list — the safety **guard** model, the memory **curator** model, **voice**
(STT/TTS) models, **org governance** minimum trust tiers, and an append-only
**governance audit log** of provider/model tag changes.
