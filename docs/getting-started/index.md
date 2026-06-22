# Installation

Personal Agent is a containerised platform. There are **three ways** to run it —
pick the one that matches your goal:

<div class="grid cards" markdown>

-   :material-laptop:{ .lg .middle } __Local (development)__

    ---

    Run the API, worker and web dev server from source, against dev infra
    (Postgres, Redis, Temporal, Keycloak). Hot reload, the full test suite.

    [:octicons-arrow-right-24: Run locally](run-locally.md)

-   :material-docker:{ .lg .middle } __Docker / Podman__

    ---

    The whole stack as containers on a single host — the usual way to self-host
    your own instance on a box or VPS.

    [:octicons-arrow-right-24: Docker / Podman](docker.md)

-   :material-kubernetes:{ .lg .middle } __Kubernetes__

    ---

    Scaled-out, HA deployment via the Helm umbrella chart (HPA, KEDA, Gateway
    API, CloudNativePG, cert-manager).

    [:octicons-arrow-right-24: Kubernetes (Helm)](kubernetes.md)

</div>

## What you'll need

Whichever path you pick, a real instance needs:

- **DNS + TLS** for your app and Keycloak hostnames, behind a reverse proxy that doesn't buffer SSE
  and allows WebSocket upgrades. The Docker path bundles the data services (Postgres, Redis,
  Temporal, Keycloak) — see [Docker / Podman](docker.md); Kubernetes wires them as subcharts.
- An **OIDC provider**. Keycloak is bundled and its realm is imported for you, but any provider
  works — see [OIDC provider configuration](oidc.md).
- An **LLM provider key** (or a local model endpoint), added later in the admin UI — not an env var.

Every environment variable is catalogued in the [Configuration reference](configuration.md), and the
optional native clients in [Client apps](client-apps.md).

!!! tip "Use `just`"
    The repo ships a [`just`](https://github.com/casey/just) task runner. Run
    `just` (or `just --list`) to see every recipe — `just setup`, `just up`,
    `just migrate`, `just api`, `just worker`, `just web`, `just check`.
