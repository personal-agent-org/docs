# Systemprompt- & Toollisten-Aufbau — Hermes vs. Personal Agent

> Fokussierter Architektur-Vergleich: **Wie** bauen beide Systeme den
> Systemprompt und die an das Modell übergebene Toolliste zusammen — und
> **was** sollten wir bei Personal Agent (PA) übernehmen.
>
> Ergänzt die breiten Feature-Vergleiche in
> [`personal-agent-vs-hermes-agent.md`](./personal-agent-vs-hermes-agent.md)
> und [`hermes-feature-adoption.md`](./hermes-feature-adoption.md) um die
> konkreten Bau-Mechaniken. Quellen: geklonter Stand `NousResearch/hermes-agent`
> (`agent/system_prompt.py`, `agent/prompt_builder.py`, `toolsets.py`,
> `model_tools.py`, `tools/registry.py`, `tools/tool_search.py`) und PA
> (`agent/service.py`, `agent/instructions.py`, `agent/run_instructions.py`,
> `assembler/assembler.py`, `assembler/policy.py`).

---

## 1. TL;DR — die drei Lehren

1. **Cache-bewusste Tier-Trennung des Prompts.** Hermes teilt den Systemprompt
   bewusst in `stable → context → volatile`, damit der stabile Präfix
   provider-seitig gecacht werden kann. PA mischt heute **stabile Identität und
   volatile Welt-/Memory-Daten in einen einzigen `instructions`-String** und
   baut ihn pro Turn neu — Prompt-Caching ist damit unmöglich. **Das ist der
   wichtigste übernehmbare Punkt** (Token-Kosten + Latenz, gerade bei langem
   System-Layering und durable Replays).
2. **Progressive Tool-Disclosure (Tool Search).** Hermes ersetzt große
   MCP-/Plugin-Toollisten ab ~10 % Kontextfenster durch drei Bridge-Tools
   (`tool_search`/`tool_describe`/`tool_call`). PA hat **keine** Schema-Deferral:
   alle Tools sind immer im Array. Bei vielen MCP-Servern frisst das Kontext.
3. **Modellfamilien-bedingte Tool-Use-Guidance.** Hermes injiziert
   GPT/Codex/Gemini-spezifische „du MUSST Tools nutzen"-Blöcke nur für die
   schwächeren Tool-Caller. PA hat eine einheitliche Guidance — übernehmenswert,
   da PA „auto"-Modellwahl quer über Provider fährt.

Beim Rest ist PA **gleichwertig oder reicher** (Governance-Gates,
Untrusted-Content-Policy, World-Memory-Push, Surfaces, durable RunSpec-Snapshot).

---

## 2. Systemprompt-Aufbau

### 2.1 Hermes — drei geordnete Tiers (`agent/system_prompt.py`)

`build_system_prompt_parts()` → `build_system_prompt()` joint drei Listen mit
`\n\n`, in fester Reihenfolge **`stable → context → volatile`**:

| Tier | Inhalt (Reihenfolge) | Caching |
|------|----------------------|---------|
| **stable** | 1. Identität (`SOUL.md` oder `DEFAULT_AGENT_IDENTITY`) · 2. Help-Guidance · 3. Task-Completion-Guidance · 4. Parallel-Tool-Call-Guidance · 5. tool-abhängige Verhaltensblöcke (memory/session_search/skills/kanban — nur wenn das Tool im Run ist) · 6. Steer-Channel-Note · 7. computer_use · 8. Nous-Subscription · 9. **Tool-Use-Enforcement (modellfamilien-bedingt)** · 10. **Skills-Index** · 11. Environment-Hints · 12. Coding-Context · 13. Platform-Hints | **gecacht** — über die ganze Session byte-stabil, wird mid-session nie neu gerendert |
| **context** | caller-`system_message` + **ein** Projekt-Kontextfile (Priorität: `.hermes.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`) | stabil pro Session |
| **volatile** | `MEMORY.md`-Snapshot · `USER.md`-Profil-Snapshot · externer Memory-Provider-Block · Zeit/Session/Model/Provider-Zeile (**nur Datum**, nicht Minute → Cache bleibt den Tag warm) | **nicht** gecacht, Rebuild nur nach Kompression |

Schlüsselideen:

- **Identität** = austauschbar via `~/.hermes/SOUL.md`; Fallback ist die
  hartkodierte `DEFAULT_AGENT_IDENTITY`. Bei Subagent-Delegation
  (`skip_context_files`) wird SOUL übersprungen.
- **Modellfamilien-Conditional** (`system_prompt.py`): `"gemini"/"gemma"` →
  `GOOGLE_MODEL_OPERATIONAL_GUIDANCE`; `"gpt"/"codex"/"grok"` →
  `OPENAI_MODEL_EXECUTION_GUIDANCE`. Der Enforcement-Block selbst wird per Gate
  `agent._tool_use_enforcement` (`auto`/bool/Liste) gesteuert; `auto` matcht
  `TOOL_USE_ENFORCEMENT_MODELS = (gpt, codex, gemini, gemma, grok, glm, qwen,
  deepseek)`.
- **Platform-Hints** = `PLATFORM_HINTS`-Dict (cli/telegram/whatsapp/discord/…),
  pro Plattform aus `config.yaml` per `append`/`replace` override-bar; defensiv
  fail-safe.
- **Skills-Index** = kompakter `<available_skills>`-Block (Kategorie → Name +
  Kurzbeschreibung), zweistufig gecacht (LRU + Disk-Snapshot), gefiltert nach
  Plattform/Tools, mit „Skills (mandatory): erst scannen, dann `skill_view`".
- **Memory** kommt als **Snapshot** in den volatile Tier; mid-session-Writes
  ändern nur die Disk, nicht den bereits gebauten Prompt (bis Rebuild).

### 2.2 Personal Agent — ein Layer-Seam, ~20 Schichten (`agent/service.py:_layer_instructions`)

PA baut **pro Run dynamisch** die Instructions. `_layer_instructions`
(`service.py:1045`) liefert heute ein **`(stable, volatile)`-Tupel** (Tier-Split,
siehe §6/§7); historisch war es ein einziger `instructions`-String. Reihenfolge
(verkürzt):

1. Basis-Template — `derive_instructions(system_prompt, override)`
   (`agent/factory.py:54`)
2. Folder-Wissen — `folder_system_prompt(...)` (geteilt über Chats eines Ordners)
3. **User-Context** — `user_context_instruction(...)` (`agent/instructions.py:52`):
   `agent_name` + `agent_soul` (= PAs „SOUL"), User-Name, Timezone, Adresse,
   Priorities, `RESPOND_LANGUAGE` (Deutsch default), comms-rules
4. Response-Style (Länge/Sprache) — *inline-only*
5. Collab-Mode — `plan`/`execute`/`pair` (`_COLLAB_DIRECTIVES`)
6. **Skills-Preamble** — `build_skills_preamble()` (`agent/skills.py:26`):
   `- {name}: {description} — When to use: {when_to_use}` + Self-Improve-Nudge
7. **Workflows-Preamble** — gespeicherte Workflows als `run_workflow(name=…)`-Index
8. Delegation-Hint
9. **Surface-Instructions** — per-Surface-Overlay (`surface_resolver.py`),
   builtin `standard`/`coding` oder custom; Coding-Fallback `CODING_BEHAVIOR`
10. Workspace-Projektregeln — `AGENTS.md`/`CLAUDE.md` aus dem Workspace-Repo
    (*inline-only*, via device_gateway)
11.–16. Nudges: Handoff-Kickoff, Ask-User, Entity-Cards (`pa-card`),
    Mermaid, Math, Kompressions-Summary
17. **Known World State** — `_known_world_state(...)` (`agent/world_context.py`):
    Stage-1-„Push" — prompt-verlinkte Entities + aktive Facts + Tiefe-1-Relationen
    + Owner-`preference`/`policy` + max. 4 salient Events → kompakter
    `## Known World State`-Referenzblock. **Pro Turn neu berechnet.**
18. Tag-Gate-Note — welche Integrationen/MCP von der Governance geblockt wurden
19.–22. Per-Turn-Direktiven: Title-Instruction, Main-Chat-Coding-Redirect,
    Goal-Instruction, Side-Query etc.

### 2.3 Direktvergleich Systemprompt

| Aspekt | Hermes | Personal Agent |
|--------|--------|----------------|
| Struktur | 3 explizite Tiers, fixe Reihenfolge | 1 String, ~20 bedingte Layer |
| Identität/Persona | `SOUL.md` (Datei) / Default-Konstante | `agent_name`+`agent_soul` (User-Settings-Feld) |
| Projekt-Kontextfiles | `.hermes.md`/`AGENTS.md`/`CLAUDE.md`/`.cursorrules` (1 gewinnt) | `AGENTS.md`/`CLAUDE.md` aus Workspace (inline-only) |
| Memory-Injektion | **Snapshot** im volatile Tier | **Push**-Referenzblock, pro Turn neu (reicher: Graph statt Flatfile) |
| Plattform-Hints | `PLATFORM_HINTS` + `config.yaml`-Override | Surface-Overlay (DB/UUID), kein deklaratives Hint-Dict |
| Skills-Index | `<available_skills>`, 2-stufig gecacht | Preamble-Liste, pro Turn gebaut |
| Modellfamilien-Conditional | **ja** (GPT/Codex/Gemini) | **nein** (einheitlich) |
| **Prompt-Caching** | **bewusst designt** (stable Präfix) | **nicht vorhanden** (`cache_control`/`cache_point` = 0 Treffer); pro Turn neu, volatile mit stabil vermischt |
| Governance-Transparenz im Prompt | — | **ja** (Tag-Gate-Note) — reicher als Hermes |

---

## 3. Toollisten-Aufbau

### 3.1 Hermes — datengetriebene Toolsets + Registry + Tool Search

- **Toolsets als Daten** (`toolsets.py`): `TOOLSETS`-Dict mit `core` (eine
  logische Gruppe), `composite` (`includes` anderer Toolsets) und `platform`
  (`hermes-cli`, `hermes-telegram`, …). `resolve_toolset()` expandiert rekursiv
  (mit Zyklenschutz) zu konkreten Tool-Namen; `all`/`*` = alles außer opt-in
  (kanban) und capability-gated.
- **Registry** (`tools/registry.py`): jedes Tool-Modul ruft beim Import
  `registry.register(name, toolset, schema, handler, check_fn, requires_env, …)`.
  `discover_builtin_tools()` findet Module per AST-Scan automatisch — keine
  manuelle Liste. Schema = OpenAI-Function-Calling-Dict.
- **Runtime-Gating** = `check_fn` pro Tool (Bool, 30 s TTL-gecacht): Key
  vorhanden? Backend erreichbar (CDP)? Binary da? → schlägt es fehl, fällt das
  Tool ganz raus. Dynamisches Schema-Patching für `execute_code`/`browser_*` auf
  nur tatsächlich verfügbare Tools.
- **Tool Search** (`tools/tool_search.py`): ab `threshold_pct` (default 10 % des
  Kontextfensters) werden **deferrable** Tools (MCP + Nicht-Core-Plugins; nie
  `_HERMES_CORE_TOOLS`) aus dem Array entfernt und durch
  `tool_search`/`tool_describe`/`tool_call` ersetzt. BM25 über Name+Beschreibung,
  Katalog pro Turn frisch aus der Live-Registry, auf die Session-Toolsets
  beschränkt. `tool_call` entpackt die Bridge und dispatcht das echte Tool (Hooks
  laufen gegen den echten Namen).

### 3.2 Personal Agent — ein Assembler, pydantic-ai-Toolsets, Governance-Gates

- **Ein Orchestrator**: `ToolsetAssembler.assemble()` (`assembler/assembler.py`)
  sammelt: built-in First-Party-Toolsets (chat-admin, interaction/`ask_user`,
  todo, memory/`recall`, world-memory, commitments, notes, time, entity-action,
  scenes, workflows, phone, skills, comms-agent, entity-/document-RAG),
  Integrations-Toolsets (HA-Stil Config-Entries), Web-Tools (search + lokaler
  SSRF-geschützter fetch), Sub-Agents (`delegate_to`, `create_plan`,
  `run_workflow`), Geräte-Toolsets.
- **Tool-Definition**: `pydantic_ai.toolsets.FunctionToolset[PersonalAgentDeps]`
  mit `@ts.tool`-dekorierten async-Funktionen; Kontext via `ctx.deps`. Schema
  wird von pydantic-ai aus der Signatur/Docstring abgeleitet (kein manuelles
  JSON-Dict wie Hermes).
- **Gating** (`assembler/policy.py`), mehrschichtig — **reicher als Hermes**:
  - **Tier-Gate** (`apply_tier_gate`): ein First-Party-Tool ist nur verfügbar,
    wenn `provider_tier ≥ TOOL_REQUIRED_TIER[tool]`. Die Map ist heute **leer**
    (= Default-Tier 0, jedes Modell) - bewusst gehaltene Seam; Integrationen/MCP
    werden statt hier an ihrer Quelle per Manifest-`required_tier` getiert.
  - **Untrusted-Content-Gate** (`apply_untrusted_gate`, Frozen Contract #13):
    wenn untrusted MCP/OpenAPI im Run, werden aus jedem *trusted* Toolset die
    `HIGH_PRIVILEGE_TOOLS` (Memory-Write, send_email/send_message, web_fetch/
    web_search, shell/delete, die Fan-out-Tools delegate_to/best_of_n/create_plan/
    run_workflow, control_entity/activate_scene, save_skill/save_workflow,
    search_files/read_file, phone_*) plus alle Device-`dev_<id>_*`-Tools gefiltert;
    die untrusted Toolsets selbst bleiben unangetastet.
  - **Tool-Deny-List** aus dem Composer (`cfg["disabled_tools"]` →
    `toolset.filtered()`).
  - **Provider-Tag-Gate** nach Modellauflösung (BLOCK-Mode).
- **Snapshot** (Frozen Contract #6): Toolsets werden bei Run-Start in
  `RunSpec.toolsets` (`ToolsetSnapshot`: integrations, denied_tools, devices)
  eingefroren; der Workflow fragt nie Live-DB im Run/Replay.
- **Kein Schema-Deferral**: alle Tools immer im Array; PAs `deferred.py` ist
  pydantic-ais *deferred-tool resume* (`ask_user`-Karten), **nicht**
  Tool-Schema-Progressive-Disclosure.

### 3.3 Direktvergleich Tools

| Aspekt | Hermes | Personal Agent |
|--------|--------|----------------|
| Quelle der Toolliste | `TOOLSETS`-Dict + Auto-Discovery-Registry | `ToolsetAssembler.assemble()` (Code) |
| Tool-Schema | manuelles OpenAI-JSON-Dict | aus pydantic-Signatur abgeleitet |
| Plattform-Presets | `hermes-<platform>`-Toolsets (Daten) | Surface + Composer-Auswahl |
| Capability-Gating | `check_fn` (Key/Backend/Binary) | Integration-Capability-Provider + Tier/Tag-Gates |
| Sicherheits-Gating | dangerous-command-Approval (Terminal) | **Tier + Untrusted + Tag + Deny-List + Security-Mode** (deutlich reicher) |
| Durable Snapshot | — (CLI/Session-State) | **RunSpec/ToolsetSnapshot** (Contract #6) |
| **Schema-Deferral / Tool Search** | **ja** (MCP/Plugin, ab 10 %) | **nein** |

---

## 4. Was wir übernehmen müssen / sollten

### ADOPT — klare Empfehlung

**A1. Cache-bewusste Prompt-Tier-Trennung (höchster Hebel).**
Heute mischt `_layer_instructions` stabile Identität (User-Context, Skills-,
Workflow-Preamble, Surface, Nudges) mit volatilen Daten (Known World State,
Kompressions-Summary, Title-/Goal-/Side-Direktiven) in **einen** String, der pro
Turn neu gebaut und voll gesendet wird. Refactoren in geordnete Tiers:

- `stable` — Basis-Template, Folder, User-Context (Identität/Persona/Sprache),
  Skills-Index, Workflow-Index, Delegation/Surface, statische Nudges
  (Cards/Mermaid/Math/Ask-User).
- `volatile` — Known World State, Kompressions-Summary, Per-Turn-Direktiven
  (Title/Goal/Side), Tag-Gate-Note, Zeitzeile.

Dann auf der Anthropic-/kompatiblen Schiene **`cache_control`-Marker** an die
Tier-Grenze setzen (stabiler Präfix). Genau wie Hermes: Zeitstempel auf
**Datums-Granularität** halten, damit der Cache den Tag überlebt. Nutzen:
spürbar weniger Input-Tokens & Latenz bei den langen PA-Prompts; greift inline
**und** im durable Pfad (Marker sind ModelSettings-/Message-Sache, kollidieren
nicht mit BYOK Contract #5 oder „keine Secrets in Inputs" #15). **Voraussetzung:
World State NICHT mehr in den stabilen Teil mischen** — das ist heute der
Haupt-Cache-Buster.

**A2. Modellfamilien-bedingte Tool-Use-Guidance.**
Da PA `model=="auto"` quer über Provider auflöst, lohnt ein kleiner
Conditional-Block analog `TOOL_USE_ENFORCEMENT_MODELS`: für schwächere
Tool-Caller (GPT/Gemini/Qwen/DeepSeek/GLM/…) den „du MUSST Tools wirklich
ausführen, nicht beschreiben"-Block injizieren; für Claude/starke Caller weglassen.
Hängt sauber an der bestehenden `auto_model`/`resolver`-Stufe (Provider-Tags
liegen dort schon vor). Gehört in den `stable` Tier (modellabhängig, aber pro
Run stabil).

### ADAPT — übernehmen, an PA anpassen

**A3. Tool Search / Schema-Deferral für MCP & Integrationen.**
PA hat genau das Hermes-Problem latent: viele Integrationen + MCP-Server → große,
immer präsente Tool-Arrays. Eine `auto`-Deferral (Schwelle = % Kontextfenster)
analog `tools/tool_search.py`, die **First-Party-Core-Tools nie** defert (wie
`_HERMES_CORE_TOOLS`), sondern nur Integrations-/MCP-Tools hinter
`tool_search`/`tool_describe`/`tool_call` legt. Wichtig für PA-Konformität:
- **Verträglich mit Contract #6** — die `ToolsetSnapshot` bleibt vollständig;
  Deferral ist reine **Präsentation** an das Modell, kein Live-DB-Query.
- **Muss durch die Governance-Gates** — der Deferral-Katalog ist die *bereits
  gegatete* Slice (Tier/Untrusted/Tag/Deny), niemals der volle Registry-Satz,
  exakt wie Hermes seinen Katalog auf Session-Toolsets beschränkt.
- Echte Tool-Namen in den AG-UI-Events (Contract #3 bleibt gewahrt). *(Umgesetzt
  ohne Hermes' `tool_call`-Bridge: PA nutzt pydantic-ais `DeferredLoadingToolset`
  + `ToolSearch`, das die Tools unter ihren echten Namen via `search_tools`
  freischaltet - kein Wrapper-Tool zum Entpacken; siehe §6.)*

**A4. Deklarative Platform-/Surface-Hints.**
Hermes' `PLATFORM_HINTS` + `config.yaml`-`append`/`replace` ist ein leichter,
fail-safe Konfig-Surface. PA macht das heute über DB-Surfaces — funktional
gleichwertig, aber schwergewichtiger. Optional: ein kleines deklaratives
Default-Hint-Set pro Comms-Domain (Email/Signal/WhatsApp/Matrix/Zulip), das die
Surface-Overlays ergänzt, statt pro Domain im Code zu streuen (passt zur
„capability-declared, nicht hardcoded"-Regel der Integrationen).

### SKIP / bewusst nicht

- **SOUL.md-als-Datei**: PA ist multi-tenant + DB-zentriert; `agent_soul` als
  User-Setting ist das richtige Äquivalent — kein Dateimodell übernehmen.
- **Manuelle JSON-Tool-Schemas**: PAs pydantic-abgeleitete Schemas sind besser;
  nicht zurückrüsten.
- **dangerous-command-Approval (regex)**: PAs Security-Mode + Command-Policy +
  Untrusted-Gate sind bereits stärker.
- **Auto-Discovery-Registry per AST**: PAs expliziter `ToolsetAssembler` ist für
  multi-tenant Governance klarer; nicht ersetzen.

---

## 5. Empfohlene Reihenfolge

1. **A1 Tier-Split + Prompt-Caching** — World State aus dem stabilen Teil ziehen,
   `stable/volatile`-Grenze einführen, `cache_control` auf der kompatiblen
   Provider-Schiene. Größter Sofort-Nutzen, rein additiv.
2. **A2 Modellfamilien-Guidance** — kleiner Conditional an `auto_model`.
3. **A3 Tool Search** — sobald MCP-Last real wird; durch die bestehenden Gates +
   AG-UI-Unwrap. Architektonisch der größte Brocken.
4. **A4 deklarative Domain-Hints** — optional, niedrige Priorität.

> Vorher offene Produktfrage für A1/A3: Caching nur auf Claude/Anthropic-Schiene
> zuerst, oder direkt provider-übergreifend? Und: Tool-Search-Default `auto`
> (wie Hermes) vs. `off` bis MCP-Last messbar ist.

---

## 6. Umsetzungsstatus (alle vier umgesetzt)

Entscheidung: **alle vier**, Caching **provider-übergreifend**, Tool-Search-Default
**`auto`** (no-op unter Schwelle → sicher per Konstruktion). Unit-getestet; die
e2e-/`requires_services`-/`requires_llm`-Tests laufen nur mit lokaler DB/LLM.

| Item | Status | Kernänderung | Tests |
|------|--------|--------------|-------|
| **A1** Prompt-Caching | ✅ | `resolver.apply_prompt_cache_settings` in `with_provider_defaults` (geteilte Seam → resolve- UND platform-model-override-Pfad, also auto + explizit; greift inline und durable, da durable über `execute_inline_run` resolved). Anthropic: `anthropic_cache_instructions` + `anthropic_cache_tool_definitions`; OpenAI/Google/DeepSeek prefix-cachen automatisch. | `test_model_settings.py` |
| **A2** Tool-Use-Guidance | ✅ | `run_instructions.tool_use_enforcement(model_label)` — Block für schwächere Caller (GPT/Gemini/Qwen/…), no-op für Claude; im stabilen Cache-Präfix von `_layer_instructions` (getrieben vom RESOLVED Label → folgt Auto). | `test_tool_use_enforcement.py` |
| **A3** Tool Search | ✅ | `agent/tool_search.py` über pydantic-ais `DeferredLoadingToolset` + `ToolSearch`-Capability (kein hand-gebauter `tool_call`-Bridge wie Hermes → das Modell sieht die echten Tool-Namen via `search_tools`). Nur Integrations-/MCP-Toolsets (nicht Sub-Agents); aktiviert nur auf dem `tool_search_path`-Build (`assembler.tool_search_path`, gesetzt in `execute_inline_run` → gilt inline **und** durable, da der durable Chat dieselbe Methode fährt). Untrusted-ids auf die Wrapper remapped (#13). Echte Tool-Namen → AG-UI (#3) unberührt. | `test_tool_search.py` |
| **A4** Platform-Hints | ✅ | `agent/platform_hints.py` (Domain→Stil + append/replace-Override, fail-safe), in die Comms-Triage-Hülle (`triage_context`) eingehängt; no-op für eigene/unbekannte Domains. | `test_platform_hints.py`, `test_triage_context.py` |

### Follow-ups

| Follow-up | Status | Kernänderung |
|-----------|--------|--------------|
| **A1 / OpenRouter-Caching** | ✅ | `build_byok` baut den `openrouter`-Provider über pydantic-ais dediziertes `OpenRouterModel` (statt generisch `OpenAIChatModel`); `apply_prompt_cache_settings` setzt `openrouter_cache_instructions` + `openrouter_cache_tool_definitions` (an Anthropic/Gemini downstream weitergereicht, no-op sonst). |
| **A4 / Config-Override** | ✅ | `Settings.platform_hints` (JSON via `PERSONAL_AGENT__PLATFORM_HINTS`, Hermes-Parität); `render_from_raw` faltet die Overrides in `resolve_platform_hint`. |
| **A3 / durable Worker** | ⚠ Primitive vorhanden, NICHT verdrahtet | Die Bausteine existieren + sind unit-getestet: `tool_search.build_capabilities(local=True)` (deterministische `keywords`-Strategie für Temporal-Replay statt nativer Suche), `AutoDeferToolset` (zählt die Tools pro Run, replay-safe) und `Settings.durable_tool_search` (default **off**). ABER: der durable Chat läuft über **dieselbe** `execute_inline_run` (`worker/activities.py:run_chat_turn`), die `tool_search_path=True` hartkodiert und die **inline**-Capability (`build_capabilities` ohne `local`) baut; `durable_tool_search` + `AutoDeferToolset` + `local=True` werden derzeit von **keinem** Ausführungspfad konsumiert. |
| **A3 / Sub-Agents** | ✅ bewusst ausgelassen | Worker sind fokussiert + kurzlebig und laufen schon unter Tool-Constraints (`NoDeferToolset`); Deferral brächte nur Discovery-Round-Trips ohne Nutzen. |

### Abschluss-Runde

| Item | Status | Kernänderung |
|------|--------|--------------|
| **A1 / CachePoint** | ✅ | `agent/prompt_cache.with_cache_point` hängt einen `CachePoint` an den Inline-Prompt → Anthropic/Bedrock/OpenRouter cachen den **Konversations-History-Präfix** über Turns; OpenAI/Google/generisch filtern ihn weg (no-op). Round-trip-sicher über `ModelMessagesTypeAdapter`. In `execute_inline_run` (greift inline **und** durable). |
| **A1 / Static-Dynamic-Split** | ✅ | `_layer_instructions` liefert `(stable, volatile)`: stabiler Präfix als **statische** (gecachte) Instructions, volatiler Teil (World-State, Kompression, Title/Goal/Tag-Gate, Hook-Output) als **dynamischer** Funktions-Block → echtes **Cross-Turn-Caching**. Gerenderter Text byte-identisch (Test). In `execute_inline_run` (greift inline **und** durable). |
| **A3 / durable auto** | ⚠ gebaut, nicht aktiv | `AutoDeferToolset` zählt pro Run die Tools des dynamischen Integrations-Toolsets (deterministisch → replay-safe) und würde nur über der Schwelle defern. Die Klasse + ihre Tests existieren, aber kein durable Pfad instanziiert sie heute (siehe A3/durable-Worker oben). |

**Generischer OpenAI-kompatibler Anthropic-Proxy:** kein sauberer Weg — pydantic-ais
OpenAI-Adapter **filtert `CachePoint`** und sendet kein `cache_control`. Nur der dedizierte
`OpenRouterModel`/`AnthropicModel`/`BedrockModel` tragen Caching. Bewusst offen gelassen.

## 7. pydantic-ai-Feature-Audit (1.107) — was wir noch nutzen könnten

Audit der installierten pydantic-ai-Primitive vs. PA-Nutzung. **Gut genutzt:**
Instrumentation, Hooks, `ToolReturn`, `FallbackModel`, `UsageLimits`, der Filtered/Wrapper-
Gate-Stack (#13), Tool Search (mit Determinismus-Split), CachePoint + Cache-Settings.

**Empfohlen — alle drei jetzt umgesetzt:**
1. **Static-/Dynamic-Instructions (`InstructionPart`)** — ✅ `_layer_instructions` liefert
   `(stable, volatile)`; stabiler Teil statisch (gecacht), volatiler Teil als Funktions-Block
   (dynamisch, ungecacht). Cross-Turn-Caching, gerenderter Text byte-identisch.
2. **`args_validator=`** — ✅ `control_entity` (endlicher Setpoint, kein NaN/Inf) +
   `get_neighbors` (Tiefe 1–3) werfen `ModelRetry` **vor** dem Tool-Body / DB-/Geräte-I/O.
3. **Device-Identität im Schema** — ✅ jede `dev_<id>_*`-Tool-Beschreibung trägt jetzt den
   Geräte-**Namen** (`[Bastis MacBook] …`), damit das Modell weiß, auf welcher Maschine es
   handelt. Idiomatisch zur Build-Zeit (das Toolset wird ohnehin pro Run gebaut) statt via
   `PreparedToolset` — letzteres wäre hier redundante Indirektion.

**Zusätzlich (Hermes-Parität):** Das **aktuelle Datum/Uhrzeit** wird direkt in die (volatile)
Instructions injiziert (`current_time_instruction`) statt per Tool — `get_current_time` ist
aus dem interaktiven Chat raus (bleibt für Code-Execution-Skripte + Sub-Agents).

**Bewusst übersprungen (Begründung):** `load_capability`/Capabilities-on-demand (Kontext schon
via Tool-Search + Kompression gemanagt), native Tools/Embeddings (PAs eigene sind plattform-
getunt), strukturierter Output (Text-Streaming + AG-UI #3 funktioniert), `PrefixedToolset`/
`SetMetadata`/`ExternalToolset` (kosmetisch/Zukunft).
