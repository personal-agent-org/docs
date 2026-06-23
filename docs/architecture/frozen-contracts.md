# Frozen contracts

These are the seams where slices otherwise drift — the invariants the codebase
holds frozen. They are verified against pydantic-ai 1.104 and enforced across the
[backend services](https://github.com/personal-agent-org/backend).

!!! danger "Do not violate"
    Each of these is a contract other parts of the system rely on. Changing one
    means re-checking every place that depends on it.

## Usage & cost

1. **Usage is recorded per `ModelResponse`, never per run.** `RunUsage` /
   `RequestUsage` have **no** `model_name` (it's on `ModelResponse.model_name`).
   Iterate `result.all_messages()`, pairing each `ModelResponse.usage` with its
   `.model_name`.
2. **Usage idempotency = `UNIQUE(run_id, request_index)`**, where `request_index`
   is the deterministic Nth `ModelResponse` — **not** `provider_response_id`
   (nullable), **not** a Temporal event count. The counter survives
   Continue-As-New via the CAN input.
3. **Cost**: `genai-prices` is primary, with a versioned `model_pricing` table for
   audit (`pricing_id` pinned).

## Streaming & transport

4. **AG-UI is the only streaming envelope**, on the Redis bus **and** the SSE wire.
   Inline uses `AGUIAdapter`; the Temporal path hand-builds identical events via a
   shared converter. `run_stream*` / `iter` are **forbidden** inside a Temporal
   workflow.
5. **Redis STREAMS** for the token channel (replay via entry-id = Last-Event-Id);
   Pub/Sub only for control/presence. One key convention:
   `personal_agent_contracts.keys`.

## Durable runs

6. **BYOK + Temporal**: the durable path passes the model as a **string** +
   `provider_factory`; keys are decrypted **inside** the model activity. Never
   serialize keys into workflow history.
7. **Toolsets are snapshotted into the `RunSpec`** at run start; the workflow never
   queries live DB state during a run/replay. MCP `id=` and agent `name=` are
   stable.
8. **Agent `name = template.slug`** for inline + durable; model/toolsets/instructions
   are per-run.

## Data & schema

9. **Extensions** (vector/pgcrypto/citext) are created by CNPG `postInitSQL` as
   superuser — **never** in Alembic (the app role is unprivileged).

## Resilience & readiness

10. **Readiness gates only on hard deps** (DB, Redis). Temporal/JWKS are soft
    (`/health/deps`), so a Keycloak/Temporal blip can't take the API offline.

## Auth, tenancy & transport security

11. **SSE/WS auth**: the WS token travels via the `Sec-WebSocket-Protocol`
    subprotocol (echoed on accept), never the query string. SSE has a
    server-enforced max lifetime ≈ token expiry.
12. **Tenancy**: validate `X-Personal-Agent-Org` against the token org claim every
    request; Postgres RLS as defense-in-depth (`ScopedDbDep` sets
    `personal_agent.current_org`).

## Governance & safety

13. **Untrusted content gates tools**: when any untrusted MCP server is in a run,
    the assembler drops high-privilege first-party/device tools via
    `toolset.filtered()` (`assembler/policy.py`); the durable worker mirrors this
    per-request.
14. **Data-classification is fail-closed**: tagged data must never reach a provider
    not cleared for it. The **same** `auto_model.enforce_classification` gate runs
    at every model-resolution entry (inline, durable chat, triggered workflows, comms
    triage).
15. **No secrets in spans**: content capture defaults **off**; provider keys never
    appear in `ModelSettings` dumps, errors or Temporal inputs.
