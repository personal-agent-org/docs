# Der autonome Completion-Loop — Personal Agent vs. Hermes, Codex CLI, OpenHands, SWE-agent

> Fokussierter Mechanik-Vergleich einer einzigen Frage: **Woher weiß ein
> unbeaufsichtigter Agent, dass er fertig ist — und was hält ihn auf, wenn er es
> nie wird?** Verglichen werden Terminationssignal, Verifikation, Loop-Driver,
> Schranken und ihre **Einheit**, Stall-Detection, Failure-Handoff und
> Kontextführung über Schritte hinweg.
>
> Quellen: geklonte Repos `NousResearch/hermes-agent` (`hermes_cli/goals.py`,
> `agent/conversation_loop.py`, `agent/verification_evidence.py`,
> `agent/tool_guardrails.py`, `hermes_cli/kanban_db.py`), `openai/codex`
> (`codex-rs/core/src/session/turn.rs`, `codex-rs/ext/goal/`,
> `codex-rs/hooks/src/events/stop.rs`), `All-Hands-AI/OpenHands` @ `4470813`
> (`src/types/agent-server/core/`, `src/hooks/mutation/`,
> `src/api/agent-server-adapter.ts`), `SWE-agent/SWE-agent`
> (`sweagent/agent/agents.py`, `sweagent/agent/models.py`,
> `sweagent/agent/reviewer.py`) — und PA (`agent/goal_toolset.py`,
> `worker/goal_workflow.py`, `worker/goal_activities.py`,
> `realtime/producers/inline.py`, `agent/kanban_context.py`,
> `agent/interaction_toolset.py`, `frontend/src/stores/chat.ts`).
>
> **Scope-Vorbehalt OpenHands:** der geklonte HEAD ist nicht mehr der
> Python-Agent, sondern `@openhands/agent-canvas` (React/TS, 4 `.py`-Dateien,
> keine davon ein Agent — `docs/architecture.md:8-24`). Der beobachtbare
> *Kontrakt* (jedes Event, jeder Status, jeder Default) ist dort vollständig; die
> *Mechanik* (Controller, Stuck-Detector-Muster) lebt in
> `OpenHands/software-agent-sdk`. Wo der Mechanismus fehlt, steht das hier als
> Lücke und nicht als Behauptung.

Legende: ✓ = vorhanden / first-class · ◑ = teilweise / nur per Opt-in / nicht
first-class · ✗ = nicht vorhanden · — = nicht zutreffend.

---

## 1. TL;DR — die sieben Lehren

1. **Die EINHEIT einer Schranke ist wichtiger als ihr Wert.** PAs
   `GOAL_MAX_ITERATIONS = 12` (`worker/goal_activities.py:24`) zählt **Turns**.
   Der beobachtete Runaway spielte sich *innerhalb eines Turns* ab — 19
   Tool-Calls, 3 Verifier-Calls auf dem stärksten Modell, ein Sub-Agent und eine
   Websuche, während der Zähler auf 1 stand
   (`tests/api/test_goal_toolset.py:139-171`). Eine Schranke, die die falsche
   Achse zählt, ist schlimmer als keine, weil sie sich wie Sicherheit liest.
   Hermes' `IterationBudget` (`agent/iteration_budget.py:32`) zählt API-Calls,
   sein `GoalState.turns_used` (`hermes_cli/goals.py:1741`) zählt Judge-Turns —
   beide Achsen sind dort **getrennt gedeckelt**.
2. **Evidenz gehört aus dem Speicher neu gelesen, nicht aus dem Kontext
   geglaubt.** Hermes' `agent/verification_evidence.py:629` liest exit codes aus
   einer SQLite-Ledger, die der Terminal-Tool als Seiteneffekt schreibt
   (`tools/terminal_tool.py:3245`) — inklusive der Regel
   `if state["last_edit_at"] > evidence["created_at"]: status = "stale"` (:688).
   Codex reicht dem Stop-Hook den `transcript_path` statt des Transkripts
   (`codex-rs/hooks/src/events/stop.rs:113`). SWE-agent rechnet den Diff im
   Moment des Submits frisch aus dem Repo (`tools/submit/bin/submit:10`). PA
   liest bei `complete_goal` bewusst die **live** `ctx.messages`
   (`agent/goal_toolset.py:338`) — richtig für den Bug, den es behebt, aber es
   verliert alles, was die Kompaktierung wegsummiert hat (§9).
3. **Der billige deterministische Check gehört VOR den LLM-Judge.** Hermes
   formuliert das explizit: „Quality gates run BEFORE the LLM judge: a failing
   gate is deterministic evidence the goal is not done, so the judge call is
   skipped entirely" (`hermes_cli/goals.py:1745`). PA hat die Reihenfolge, aber
   nicht die Determinismus-Eigenschaft: die billige Stufe ist selbst ein
   LLM-Probe (`worker/goal_activities.py:52-99`).
4. **Prosa ist keine Schranke.** Codex' `continuation.md:43-49` verlangt, dass
   derselbe Blocker über **drei aufeinanderfolgende Goal-Turns** auftreten muss,
   bevor `blocked` gesetzt wird — und nirgends im Code existiert ein
   Goal-Turn-Zähler, gegen den man das prüfen könnte
   (`codex-rs/ext/goal/src/spec.rs:77-79` sind die einzigen Fundstellen von
   „consecutive"). Die Guardian-Circuit-Breaker im *gleichen* Repo setzt seine
   3-Strikes-Regel dagegen in Code durch
   (`codex-rs/core/src/guardian/mod.rs:106-137`) — das Haus kann es, hat es für
   Task-Konvergenz nur nicht getan.
5. **Stall-Detection ist die am häufigsten fehlende Zutat.** Von fünf Systemen
   hat genau eines echte Detektoren (Hermes: `agent/tool_guardrails.py:276`
   Result-Hash-Wiederholung + `hermes_cli/goals.py:1498`
   Workspace-Fingerprint), eines hat sie als Always-on-Feature ohne auffindbare
   Logik (OpenHands `stuck_detection: true`,
   `src/api/agent-server-adapter.ts:1114`), und drei — Codex, SWE-agent, **PA** —
   haben gar nichts.
6. **Zwei geschachtelte Loops brauchen zwei Terminationssignale UND zwei
   Cancel-Pfade.** OpenHands' `stopGoal` bricht die äußere Schleife ab, lässt den
   laufenden Turn aber „deliberately" weiterlaufen
   (`src/hooks/mutation/conversation-mutation-utils.ts:95-99`) — jeder Caller
   muss zusätzlich pausieren. PA hat die gleiche Formklasse als echten Defekt:
   das `ask_user`-Tool existiert und ist in Goal-Turns aktiv
   (`agent/interaction_toolset.py:23`, `assembler/assembler.py:216-219`), aber
   der Goal-Loop schaut nie hin und plant sofort den nächsten Turn (§8.3).
7. **Das Endzustands-Vokabular muss bis zum Nutzer durchkommen.** OpenHands
   trennt sauber `complete` / `capped` / `interrupted`
   (`src/types/agent-server/core/events/conversation-state-event.ts:87`) und
   rendert die Judge-Notiz `missing` beim Abbruch ausgeklappt
   (`src/components/features/chat/goal-status-content.tsx:29-44`). PA **hat** das
   Vokabular serverseitig (`done`/`capped`/`failed`/`budget`/`paused`/`cleared`,
   `worker/goal_workflow.py:48-66`) und wirft es im Frontend weg: das Banner
   überlebt nur `active` und `paused` (`frontend/src/stores/chat.ts:986-1000`).

---

## 2. Die fünf Systeme auf einen Blick

| Dimension | Personal Agent | Hermes Agent | Codex CLI | OpenHands | SWE-agent |
|---|---|---|---|---|---|
| Terminationssignal (innen) | kein — „keine Tool-Calls" endet nur den Turn | strukturell (`conversation_loop.py:7398`) | strukturell (`turn.rs:389`) | Tool `FinishAction` (`base/action.ts:13`) | stdout-Sentinel (`tools.py:372`) |
| Terminationssignal (außen) | Tool `complete_goal` + Verifier (`goal_toolset.py:290`) | LLM-Judge-Verdikt (`goals.py:1822`) | Tool `update_goal` (`spec.rs:60`) | Judge-Verdikt (`conversation-state-event.ts:67`) | — (ein Lauf, kein äußerer Loop) |
| Verifikation deterministisch | ✗ | ✓ (Evidence-Ledger + Shell-Gates) | ◑ (nur user-supplied Stop-Hook) | ◑ (nur user-supplied Stop-Hook) | ◑ (Self-Review-Gate, kein Test) |
| Loop-Driver | ✓ durable (Temporal) | ✗ in-process (+ durable Kanban) | ✗ in-process, event-driven | ◑ server-side, nicht durable | ✗ in-process `while` |
| Zähl-Schranke auf der äußeren Schleife | Turns (12) | Judge-Turns (20) | ✗ **keine** | Audit-Runden (`/goal --max N`) | ✗ (Attempts im RetryAgent) |
| Geld-Schranke | ◑ Monat/User, per Turn gesampelt | ✗ | ✗ | ✓ `max_budget_per_task` | ✓ **primär** ($3/Instance) |
| Stall-Detection | ✗ | ✓ (3 Mechanismen) | ✗ | ◑ (an, Logik extern) | ✗ |
| Failure-Handoff strukturiert | ◑ serverseitig ja, UI nein | ✓ | ✓ | ✓ | ◑ (Exit-Status-Enum + Diff) |
| Kontext über Schritte | volle History, komprimiert | volle History, komprimiert | volle History, komprimiert | volle History, condensed | volle History, kein Summary |

**In einem Satz:** PA hat als einziges System einen *durable* Loop und als
einziges einen *fail-closed* Verifier — und als einziges keine einzige Schranke
auf der Achse, auf der es tatsächlich weggelaufen ist.

---

## 3. Terminationssignal — wie endet ein Lauf?

| Aspekt | PA | Hermes | Codex | OpenHands | SWE-agent |
|---|:---:|:---:|:---:|:---:|:---:|
| „Keine Tool-Calls mehr" beendet den Lauf | ✗ | ✓ (Turn) | ✓ (Turn) | ✗ | ✗ |
| Explizites Completion-Tool | ✓ | ◑ (nur Kanban-Layer) | ✓ | ✓ | ✓ |
| Tool-Call ist ein **Antrag**, kein Abschluss | ✓ | ✓ (Kanban prüft Artefakte) | ✗ | ◑ (nur wenn Critic an) | ✓ (Stage-Gate) |
| Zweiter, modell-unabhängiger Terminationspfad | ✓ (`_auto_readiness_check`) | ◑ (Gates) | ✗ | ✗ | ✗ |
| Sentinel-String statt Tool-Identität | ✗ | ✗ | ✗ | ✗ | ✓ |
| Stop-Gates können den Abschluss vetoen | ✗ | ✓ (3 Gates) | ✓ (Stop-Hook) | ✓ (Stop-Hook) | ✓ (Review-Stage) |

**PA.** `complete_goal(summary)` ist das einzige agent-seitige Signal — und
ausdrücklich ein *Antrag*: „The goal is NOT automatically considered complete. An
independent VERIFIER evaluates your work" (`agent/goal_toolset.py:294-297`). Erst
`flip_goal_done` setzt `run_config.goal.status = "done"` (`:146-160`, gerufen bei
`:371-373`). Wichtig zur zeitlichen Einordnung: der Flip passiert **mitten im
laufenden Turn** in einer eigenen Session; **derselbe** `run_goal_turn`-Aufruf
liest den Status danach neu (`worker/goal_activities.py:216-219`), berechnet
`cont = False` (`:242`) und feuert den Nudge (`:243-245`) — es wird kein
zusätzlicher Turn verbraucht. Strukturell endet „keine Tool-Calls" bei PA nur den
Turn; der Workflow plant sofort den nächsten (`worker/goal_workflow.py:42-56`).

Der zweite Pfad ist PA-spezifisch und in keinem der Vergleichssysteme zu finden:
`_auto_readiness_check` läuft nach *jedem* Turn, in dem der Agent **nicht**
abgeschlossen hat, prüft mit einem billigen Probe über die persistierte Evidenz
und flippt bei Bestätigung durch den strikten Verifier trotzdem auf `done`
(`worker/goal_activities.py:238-241`, `:52-117`). Das fängt ein Ziel ab, das
verifizierbar erreicht, aber nie deklariert wurde.

**SWE-agent** ist der Gegenpol und die Warnung: die Terminierung ist ein
**Substring-Match auf Tool-stdout**. `ToolHandler.check_for_submission_cmd` scannt
jede Observation nach `<<SWE_AGENT_SUBMISSION>>` (`sweagent/tools/tools.py:372-376`);
der Tool-Name wird nie geprüft. Jedes Kommando, dessen Ausgabe diesen String
enthält, beendet den Lauf — und umgekehrt endet er *nicht*, wenn
`/root/model.patch` nicht lesbar ist (`sweagent/agent/agents.py:886-890`).

**Codex** trennt sauber: der innere Loop braucht gar kein Finish-Tool
(„If the model sends only an assistant message, we record it … and consider the
turn complete", `codex-rs/core/src/session/turn.rs:138-151`), der äußere ist ein
`update_goal{status}`-Tool (`codex-rs/ext/goal/src/spec.rs:60-93`) — dessen
Handler jedoch **null** prüft und nur eine SQLite-Zeile schreibt
(`codex-rs/ext/goal/src/tool.rs:221-280`).

**Hermes** stapelt drei Loops mit drei Signalen: strukturell innen
(`agent/conversation_loop.py:7398-7403`), LLM-Judge im `/goal`-Loop
(`hermes_cli/goals.py:1822-1832`), und im durablen Kanban-Layer ein echtes
Completion-Tool, das eine Text-Antwort als `protocol_violation` behandelt und
bis zu zweimal synthetisch nachfasst (`agent/kanban_stop.py:69-101`).

---

## 4. Verifikation — wird „ich bin fertig" geglaubt?

| Aspekt | PA | Hermes | Codex | OpenHands | SWE-agent |
|---|:---:|:---:|:---:|:---:|:---:|
| Selbstauskunft wird ungeprüft geglaubt | ✗ | ◑ (ohne Contract ja) | ✓ | ✓ (Critic default aus) | ◑ (Stage-Gate, kein Inhalt) |
| Separater LLM-Verifier | ✓ | ✓ | ✗ | ◑ (opt-in) | ◑ (nur RetryAgent) |
| Verifier auf **anderem** Modell | ◑ (nur Auto-Pfad, bedingt) | ✓ (`auxiliary.goal_judge`) | — | ◑ | ◑ |
| Evidenz aus dem **Speicher** re-gelesen | ◑ (nur Auto-Pfad) | ✓ (SQLite-Ledger) | ✓ (Stop-Hook `transcript_path`) | ◑ (`event_ids`) | ✓ (`git diff --cached`) |
| Evidenz = gerenderte Tool-Traces statt Prosa | ✓ | ✓ | ✗ | ✗ | ✓ (Diff) |
| Reasoning/Thinking bewusst ausgeschlossen | ✓ | — | ✗ | ✗ | — |
| Stale-Regel (Edit invalidiert grünen Lauf) | ✗ | ✓ | ✗ | ✗ | ✗ |
| Tests/Lint/Assertions laufen wirklich | ✗ | ✓ (`/goal gate add`) | ◑ (nur eigener Stop-Hook) | ◑ (nur eigener Stop-Hook) | ✗ |
| Strukturierter Verdict-Typ | ✗ (Substring) | ◑ (JSON + Parse-Counter) | — | ✓ (`GoalVerdict`) | ✗ (letzte Zahl der letzten Zeile) |
| Kritik fließt als Arbeitsauftrag zurück | ✓ | ✓ | — | ✓ (`missing`) | ✗ (Attempts sind i.i.d.) |

### 4.1 PA: gut geerdet, schwach unabhängig

Die Evidenz-Aufbereitung ist PAs stärkster Baustein. `_msg_evidence`
(`agent/goal_toolset.py:59-82`) rendert Prosa **plus** echte
`[called tool(args)]`- und `[result tool: …]`-Zeilen und schließt die
Thinking-Parts explizit aus („self-justification, not evidence"); der
Verifier-Prompt hämmert „judge from the tool actions/results, not the agent's
prose claims" (`:244-251`). Das Budget ist newest-first über 40.000 Zeichen und
wird danach re-chronologisiert (`:118-143`), damit bei Truncation die *jüngste*
echte Arbeit überlebt. Die Log-Zeile `tool_lines=work.count("[called ")`
(`:353-359`) ist die billige Kanarie, die den Blindheits-Bug überhaupt sichtbar
gemacht hat.

Drei Schwächen bleiben:

- **Die „unabhängige" Prüfung läuft auf demselben Modell.** `complete_goal`
  bekommt `parent_model` durchgereicht (`assembler/assembler.py:431`) — anderer
  Kontext und andere Instruktionen, aber nicht anderes Urteil. Der Auto-Pfad
  löst zwar `Purpose.STRICT_VERIFIER` auf, fällt aber auf das Probe-Modell
  zurück, wenn nichts konfiguriert ist:
  `verifier_model = strong.model if (strong and strong.model is not None) else cheap.model`
  (`worker/goal_activities.py:104`). Dann ist die zweistufige Prüfung **ein
  Modell, zweimal gefragt** — schwächer als `complete_goal`s Variante.
- **Verdikt-Parsing per Substring** auf der ersten Zeile
  (`agent/goal_toolset.py:268`). Bemerkenswert: die *gröbere* Kopie im Codebase
  macht es richtig — `run_worker` nutzt ein pydantic-`_Verdict` mit
  `achieved: bool` + `next_step: str` und `output_type=_Verdict`
  (`agent/kanban_context.py:101-104`).
- **Kein einziger deterministischer Check.** Keine Tests, kein Diff-Review, keine
  Assertion, kein Schema. Zwei LLM-Meinungen sind die ganze Prüfung.

Die Fail-Richtungen sind dagegen sauber durchdacht und asymmetrisch: kein
Verifier-Modell → fail **open** (`agent/goal_toolset.py:241`), Verifier-Fehler →
fail **closed** („keep working", `:265-267`), Probe-Fehler → fail **closed**, damit
ein Flake nie ein Ziel beenden kann (`:219-223`). Jede Richtung ist im Kommentar
begründet und per Test festgenagelt (`tests/api/test_goal_toolset.py:52`). Hermes
entscheidet hier anders herum — „A broken judge must not wedge progress; the turn
budget is the backstop" (`hermes_cli/goals.py:18-19`), jeder Transportfehler gibt
`("continue", …, True)` zurück (`:1112`) — und braucht deshalb zwei zusätzliche
Zähler gegen den festgefahrenen Judge (`:71, :76`).

### 4.2 Hermes: der Evidence-Ledger ist die beste Idee im Feld

`agent/verification_stop.py` ist ausdrücklich „policy-only: it never runs checks
itself". Es liest `verification_status(session_id, cwd)` aus einer persistenten
SQLite-DB unter `~/.hermes/verification_evidence.db`
(`agent/verification_evidence.py:59-60`, Tabellen `:112-138`), die als
**Seiteneffekt der Tool-Ausführung** befüllt wird: jedes Shell-Kommando ruft
`record_terminal_result(command, cwd, session_id, exit_code, output)`
(`tools/terminal_tool.py:3245-3253`), jeder File-Edit ruft `mark_workspace_edited`
(`tools/file_tools.py:1986`). Die Invalidierungsregel macht den Ledger
vertrauenswürdig: `if state["last_edit_at"] > evidence["created_at"]: status = "stale"`
(`:688-691`) — „ich habe die Tests schon laufen lassen" ist nach dem nächsten Edit
wertlos. Doku-Pfade (`.md`, `LICENSE`) werden gefiltert, damit ein README-Edit nie
auslöst (`verification_stop.py:24-72`). Kosten auf dem Happy Path: **null
zusätzliche LLM-Calls**.

Der LLM-Judge daneben ist bewusst amnesisch und entsprechend schwach: er sieht
Zieltext (≤2000 Zeichen), die *letzte* Assistant-Nachricht auf
`_JUDGE_RESPONSE_SNIPPET_CHARS = 4000` gekürzt (`hermes_cli/goals.py:63`), die
Live-Prozessliste und die Uhrzeit — nie das Transkript, nie den Diff, nie den
Ledger (`:1070-1094`). Ohne Completion-Contract akzeptiert der Prompt schlicht
„The response explicitly confirms the goal was completed" (`:156`); *mit*
Contract verlangt er „a command result, file contents excerpt, test/benchmark
output — not a claim like 'done' or 'all tests pass' without evidence" (`:238-251`).

### 4.3 Codex und OpenHands: die Prüfung ist optional oder Prosa

Codex' gesamte Verifikation ist der Text in
`codex-rs/ext/goal/templates/goals/continuation.md:30-42` — ein wirklich guter
12-Zeilen-„Completion audit" („Treat uncertain or indirect evidence as not
achieved"), den kein Codepfad prüft. Der einzige echte Hebel ist der
Stop-Hook, der `StopOutcome{should_block, block_reason, continuation_fragments}`
zurückgeben und den Abschluss vetoen darf
(`codex-rs/hooks/src/events/stop.rs:63-69`, Wiedereintritt bei
`codex-rs/core/src/session/turn.rs:470-501`) — Hooks sind Stable und default-on
(`codex-rs/features/src/lib.rs:1055-1059`), aber **es wird keiner mitgeliefert**.

OpenHands hat den reichsten *Kontrakt* und die schwächsten *Defaults*:
`critic_enabled` = false, `critic_mode` = `finish_and_message`,
`critic_threshold` = 0.6, `enable_iterative_refinement` = false
(`src/mocks/settings-handlers.ts:174-300`, `src/services/settings.ts:46-48`). Ist
der Critic an, reitet sein `CriticResult{score, message, metadata}` auf dem
Action-Event selbst mit („Optional critic evaluation of this action and preceding
history", `src/types/agent-server/core/events/action-event.ts:63-66`) und rendert
direkt unter der Finish-Nachricht
(`.../finish-event-message.tsx:29-31`). Er sagt aber eine
*Nutzerzufriedenheits-Wahrscheinlichkeit* voraus, er führt keine Tests aus — seine
Feature-Taxonomie ist verhaltensbasiert („insufficient testing, loop behavior",
`src/types/agent-server/core/base/critic.ts:13-25`).

### 4.4 SWE-agent: die billigste gute Idee im ganzen Feld

Das `review_on_submit_m`-Bundle ersetzt `submit`: der **erste** Aufruf berechnet
den Diff frisch (`git add -A && git diff --cached`), rendert eine Checkliste mit
`{{diff}}` und `{{problem_statement}}`, erhöht einen Registry-Zähler und beendet
**ohne** Sentinel (`tools/review_on_submit_m/bin/submit:23-42`). Der Lauf geht
also weiter, und das Modell bekommt seinen eigenen Diff als ganz normale
Observation zurück, dazu „re-run your reproduction script, delete it,
`git checkout --` any test files you touched, then submit again"
(`config/default.yaml:47-63`). Erst der zweite `submit` terminiert. Kosten: ein
Tool-Roundtrip, null zusätzliche Infrastruktur, deterministisch (ein Zähler, kein
Urteil) — und die Evidenz ist **aus der Welt neu berechnet**, nicht aus dem
Kontext erinnert.

---

## 5. Wer treibt die Schleife — und was passiert beim Prozesstod?

| Aspekt | PA | Hermes | Codex | OpenHands | SWE-agent |
|---|:---:|:---:|:---:|:---:|:---:|
| Loop-Konstrukt | durable `while` im Workflow | selbstfütternde Queue | Idle-Event (Rekursion) | server-side Loop | `while` in-process |
| Überlebt Prozesstod | ✓ | ✗ (Goal) / ✓ (Kanban) | ✗ | ✗ | ✗ |
| Automatischer Neustart nach Crash | ✓ | ◑ (nur Kanban-Dispatcher) | ✗ | ✗ | ◑ (Instanz-Neustart ab Schritt 0) |
| Turn-Level-Idempotenz | ✗ | — | — | — | — |
| History-Wachstum begrenzt | ✓ (Continue-as-new alle 4) | ✓ (Kompaktierung) | ✓ (Auto-Compaction) | ✓ (Condenser) | ✗ |

**PA ist hier konkurrenzlos.** `GoalWorkflow.run` ist ein Temporal-Workflow mit
einer Activity pro Turn (`worker/goal_workflow.py:37-67`); der Start verweigert
sich ohne Temporal („autonomous goals need the durable backend",
`api/routers/chats.py:799-833`), Workflow-ID ist `goal-{chat_id}` mit
`TERMINATE_IF_RUNNING` (`temporal/client.py:54-71`). Stirbt der Worker, spielt
Temporal den Workflow woanders wieder ein; die laufende Activity wird bis zu
viermal retried (`goal_workflow.py:20-28`).

Zwei Einschränkungen, die man kennen muss:

- **Der Turn ist nicht idempotent.** Ein Retry startet das Modell neu gegen die
  persistierte History und kann Seiteneffekte wiederholen. Darunter liegt noch
  eine zweite, in der ursprünglichen Analyse fehlende Retry-Ebene:
  `MAX_TURN_RETRIES = 2` über `AUTO_RETRY_CATEGORIES = {rate_limit, server_error,
  network_transient}` (`agent/retry_backoff.py:24-28`), angewandt im Inline-Producer
  (`realtime/producers/inline.py:394-405`) — also bis zu **drei Modell-Versuche
  innerhalb eines Activity-Versuchs**, unter Temporals vier Activity-Versuchen.
  Dazu ein eigener `_context_overflow_retry`, der die History trimmt und einmal
  neu versucht (`inline.py:146-176`).
- **Der Startup-Reaper greift dem Worker ins Lenkrad.** Goal-Turns werden mit
  `execution_mode='inline'` angelegt (`agent/service.py:181`), obwohl sie im
  Worker laufen. `reap_orphaned_inline_runs` filtert genau darauf
  (`db/repositories/run_repo.py:116-119`) mit der Begründung „inline runs execute
  in the API process, so a restart orphans them" — für Goal-Turns falsch. Der
  periodische Watchdog ist harmlos, weil `AgentService._run_heartbeat`
  `updated_at` vom Worker aus auffrischt (`agent/service.py:356-357`); der
  **Startup-Sweep** aber läuft mit `older_than=None` und markiert unbedingt jeden
  laufenden Inline-Run als failed (`main.py:216-218`) — inklusive einer Meldung
  „Der Lauf wurde durch einen Neustart unterbrochen" an den Nutzer. Der Worker
  setzt den Run später selbst auf completed; bleibt ein falscher Fehlerhinweis
  plus Buchhaltungs-Race.

**Hermes' `/goal`-Loop hat gar kein Loop-Konstrukt** — er ist eine selbstfütternde
Queue: `evaluate_after_turn` gibt `{"should_continue": True, "continuation_prompt": …}`
zurück, und der Driver schiebt den Prompt als ganz normale User-Nachricht nach
(`cli.py:10855-10861`; im Gateway als synthetisches `MessageEvent` über
`_enqueue_fifo`, „so any real user message that arrives simultaneously … takes
priority naturally", `gateway/run.py:19265-19285`). Der `GoalState` ist zwar
durabel (`hermes_cli/goals.py:707-717`), der Continuation-Prompt lebte aber nur in
einer In-Memory-Queue — ein Crash hinterlässt ein `active`-Ziel, das erst wieder
läuft, wenn ein Mensch die Session öffnet. Nur der Kanban-Layer heilt sich selbst:
`dispatch_once` reklamiert TTL-abgelaufene Claims, Claims ohne Heartbeat und Tasks
mit totem Worker-PID, bevor es neu vergibt (`hermes_cli/kanban_db.py:8386-8400`,
alle 60 s getriggert von `gateway/kanban_watchers.py:970`).

**Codex** ist die eleganteste Nicht-Lösung: kein Loop, sondern Rekursion über den
Event-Bus. Der Turn-Teardown emittiert Thread-Idle
(`codex-rs/core/src/tasks/mod.rs:825-832`), die Goal-Extension reagiert darauf
(`codex-rs/ext/goal/src/extension.rs:155-166`) und startet über den *einen*
bewachten Eingang `try_start_turn_if_idle` (`codex-rs/core/src/session/inject.rs:47`)
einen neuen Turn — der ablehnt, wenn gerade gearbeitet wird, Plan-Modus aktiv ist
oder ein User-Turn ansteht. **Das ist genau die Wächter-Stelle, die PA fehlt** (§8.3).

---

## 6. Schranken und ihre EINHEIT — die schärfste Achse

Der zentrale Befund dieses Vergleichs. Nicht *ob* gedeckelt wird, sondern **was
gezählt wird**.

| System | Schranke | **Einheit** | Default | Greift wo |
|---|---|---|---|---|
| **PA** | `GOAL_MAX_ITERATIONS` | **Turns** (ganze Agent-Läufe) | 12 | `goal_workflow.py:43` + `goal_activities.py:242` |
| **PA** | `_MAX_VERIFY_PER_RUN` | **Verifier-Calls** pro Turn | 2 | `goal_toolset.py:33, :305-317` |
| **PA** | `INLINE_REQUEST_LIMIT` | **Modell-Requests** pro Turn | 400 | `inline.py:38` |
| **PA** | `MAX_TURN_RETRIES` | **Modell-Versuche** pro Activity-Versuch | 2 | `retry_backoff.py:28` |
| **PA** | Temporal `maximum_attempts` | **Activity-Versuche** pro Turn | 4 | `goal_workflow.py:24` |
| **PA** | `BudgetRepo` | **USD**, Monat, pro User, alle Aktivität | konfigurierbar | `goal_activities.py:154-162` |
| **PA** | `start_to_close_timeout` | **Sekunden** pro Activity-Versuch | 900 | `goal_workflow.py:23` |
| **PA** | Stream-/Tool-Idle | **Sekunden** ohne Event | 180 / 3900 | `inline.py:45, :51` |
| **PA** | `APPROVAL_TIMEOUT` | **Sekunden** Wartezeit pro genehmigungspflichtigem Call | 600 | `device_policy.py:31, :78` |
| Hermes | `IterationBudget` | **API-Calls** (refundbar für `execute_code`) | 90 / 500 / 45–50 | `iteration_budget.py:32-49` |
| Hermes | `GoalState.turns_used` | **Judge-bewertete Turns** | 20 | `goals.py:50, :1894` |
| Hermes | Guardrail-Zähler | **Tool-Calls** (sha256 über Name+Args) | warn@2 / block@5 | `tool_guardrails.py:72-82` |
| Hermes | `loop_caps` | **Tool-Calls pro Turn**, harte Sperre | 50 web_search / 50 delegate | `tool_guardrails.py:135-136` |
| Hermes | `consecutive_failures` | **Worker-Attempts** (Prozess-Spawns) | 2 | `kanban_db.py:6738-6742` |
| Hermes | `max_runtime_seconds` | **Wall-Clock** pro Worker-Prozess | konfigurierbar | `kanban_db.py:7196-7296` |
| Codex | `ThreadGoal.token_budget` | **Tokens** (`input − cached + output`) | **`None`** | `accounting.rs:332-338`, `goals.rs:499` |
| Codex | Guardian-Breaker | **Ablehnungen** (3 in Folge / 10 von 50) | an | `guardian/mod.rs:48-54` |
| OpenHands | `max_iterations` | **Agent-Steps** | 500 | `agent-server-adapter.ts:1110-1113` |
| OpenHands | `GoalStatus.max_iterations` | **Audit-Runden** | per `/goal --max N` | `use-goal-interceptor.ts:11` |
| OpenHands | `max_budget_per_task` | **USD** pro Conversation | konfigurierbar | `conversation-state-event.ts:25-49` |
| OpenHands | `max_refinement_iterations` | **Retry-Versuche** nach Critic | 3 | `settings-handlers.ts:262-282` |
| SWE-agent | `per_instance_cost_limit` | **USD** pro Instanz | 3.00 | `models.py:73-76` |
| SWE-agent | `per_instance_call_limit` | **API-Calls** | **0 = aus** | `models.py:78` |
| SWE-agent | `total_execution_timeout` | **Sekunden im Container** (ohne LLM-Zeit) | 1800 | `tools/tools.py:145-148` |
| SWE-agent | `max_requeries` | **Parse-Fehler in Folge** | 3 | `agents.py:158-161` |

### 6.1 Was daraus folgt

**Niemand außer Hermes deckelt Tool-Calls pro Turn.** `loop_caps` (50 web_search,
50 delegate_task, `agent/tool_guardrails.py:447`) ist die einzige Schranke im
ganzen Feld, die *innerhalb eines Turns* auf der Tool-Achse hart blockt — und
Hermes' Kommentar schreibt die Idee explizit Claude Codes Runaway-Loop-Caps zu
(`:129-149`).

**PA hat die Zutaten, aber an der falschen Stelle.** Echte Tool-Call-Caps
existieren im Codebase: `MAX_TOOL_CALLS = 40` (`agent/code_execution/monty.py:36`)
und `MAX_TOOL_CALLS = 200` (`agent/code_execution/agents_script.py:98`) — beide
begrenzen aber die *sandboxed Script-Executor*, nicht einen Agent-Turn. Das Muster
war verfügbar und wurde auf genau die Achse nicht angewandt, die weggelaufen ist.

**Eine Korrektur zur eigenen Codebase-Erzählung:** Der Kommentar in
`worker/goal_activities.py:213-214` behauptet, der Iterations-Cap habe bis zum
Persistieren von `g["iterations"]` „nichts begrenzt (Zähler stand auf 0)". Das ist
falsch. Der Zähler des Workflows ist **workflow-lokal** und wurde immer erhöht:
`GoalWorkflow.run(self, params, iteration=0)`, `iteration += 1` bei
`worker/goal_workflow.py:53`, weitergereicht über `continue_as_new(args=[params, iteration])`
bei `:58`, getestet bei `:43`; die Activity bekommt ihn aus `params`
(`goal_activities.py:125`) und leitet dieselbe Schranke bei `:242` erneut ab.
`run_config.goal["iterations"]` wird **nirgends** in die Schleife zurückgelesen —
der Key wird nur geschrieben (`goal_activities.py:224`, `chats.py:816`, `:874`,
`agent/tasks/service.py:162`) und vom Frontend-Banner gelesen. Der DB-Write ist
Telemetrie, kein Bound. Damit fällt eine der drei erzählten Einheiten-Lücken weg;
die beiden echten bleiben: **der Turn-Zähler sieht nicht in den Turn hinein**, und
**das Geld-Gate wird nur an der Turn-Grenze gesampelt**.

**Zum Verifier-Cap, präzise:** `verify_calls[rkey] += 1` steht **vor** jeder
frühen Rückkehr (`agent/goal_toolset.py:305-307` — vor dem `chat_id`-Parse bei
`:319-321` und vor dem „no active goal"-Check bei `:330-333`). Ein Turn, der zwei
dieser harmlosen Fehler trifft, ist danach für seinen *ersten* echten
Verifikationsversuch gesperrt. Das Dict ist per `run_id` gekeyt und wird nie
geleert; per-Turn ist es nur, weil `goal_toolset()` pro Assembly neu gebaut wird
(`assembler/assembler.py:428-431`) — der Test fixiert die per-`run_id`-Semantik
(`tests/api/test_goal_toolset.py:174-178`), nicht die Lebensdauer.

**Zum Geld-Gate, präzise:** Der Goal-Loop war der **letzte** unbeaufsichtigte
Pfad, der das Monats-Gate bekam, nicht der einzige ohne. Dasselbe
`BudgetRepo.resolve_limit`/`spend_this_month`-Paar sitzt auch in
`workflows/executor.py:232` und `agent/code_execution/agents_script.py:196`, neben
dem interaktiven Gate in `api/routers/runs.py:308-313`. Ein Tages-Gate gibt es
nicht: `BudgetRepo.spend_today` existiert, wird aber nur von `admin.py:164` und
`usage.py:66` zur Anzeige gelesen.

**Die unmodellierte Wall-Clock-Schranke:** Läuft ein Goal-Turn im
Security-Modus `judge`/`approve_each` (`assembler/assembler.py:715-723`), pollt
`request_tool_approval` bis zu `APPROVAL_TIMEOUT = 600.0` Sekunden auf eine
menschliche Entscheidung (`agent/device_policy.py:31, :78`), bevor es
„No approval (timed out)" zurückgibt. Bei einem unbeaufsichtigten Lauf schaut
niemand hin: **ein** genehmigungspflichtiger Call frisst 600 s des
900-s-Activity-Budgets, **zwei** sprengen es und lösen einen Temporal-Retry aus,
der wieder wartet. Das ist dieselbe Fehlerklasse wie §8.3 — der Loop nimmt an, ein
Mensch sei anwesend — nur dass sie hier reale Zeit kostet.

---

## 7. Stall-Detection — merkt jemand, dass sich nichts bewegt?

| Mechanismus | PA | Hermes | Codex | OpenHands | SWE-agent |
|---|:---:|:---:|:---:|:---:|:---:|
| Wiederholte identische Tool-Calls erkannt | ✗ | ✓ | ✗ | ? (extern) | ✗ |
| Identisches Tool-**Ergebnis** N-mal erkannt | ✗ | ✓ | ✗ | ? | ✗ |
| „Workspace unverändert" erkannt | ✗ | ✓ | ✗ | ? | ✗ |
| Semantische / Embedding-Ähnlichkeit | ✗ | ✗ | ✗ | ◑ (Critic-Feature) | ✗ |
| Turn-übergreifendes Kreisen erkannt | ✗ | ✗ | ✗ | ? | ✗ |
| Dedizierter Terminalzustand dafür | ✗ | ✗ | ✗ | ✓ (`stuck`) | ✗ |
| Park-/Wait-Barriere gegen Busy-Work | ✗ | ✓ | ✗ | ✗ | ✗ |

**Hermes ist das einzige System mit echter Erkennung**, und der `_no_progress`-Teil
ist das schärfste Signal des ganzen Felds: eine Map von `ToolCallSignature`
(sha256 aus Tool-Name + kanonisierten Args) auf **(sha256 des RESULTATS,
Wiederholungszahl)** (`agent/tool_guardrails.py:276-507, :225-236`). Ein
Read-only-Tool, das N-mal byte-identisch antwortet, *ist* ein Agent, der sich
dreht — die Meldung sagt es wörtlich: „this read-only call returned the same
result N times" (`:337`), „this looks like a loop; inspect the error and change
strategy instead of retrying it unchanged" (`:392`). Zweitens der
Workspace-Fingerprint: vor dem Re-Run eines zuvor gescheiterten Quality-Gates
hasht Hermes `git rev-parse HEAD` + `git status --porcelain`; ist der Fingerprint
unverändert, wird das Gate **nicht** neu gefahren — der gespeicherte Fehlschlag
wird abgespielt und `attempts` zählt trotzdem hoch, annotiert mit „(workspace
unchanged since last failure — not re-run)" (`hermes_cli/goals.py:1498-1518`).
Das übersetzt „der Agent hat nichts geändert" in Fortschritt auf dem
Retry-Zähler statt in eine Gratis-Runde. Drittens das `wait`-Verdikt mit
`wait_on_pid`/`wait_for_seconds` (`:160-176, :1720-1739`) — es parkt den Loop, ohne
einen Turn zu verbrennen, mit der Prompt-Regel „Do NOT pick WAIT just because work
remains — only when re-poking now would be pure busy-work."

Wichtige Ehrlichkeit zur Grenze: alle Guardrail-Zähler sind **Exact-Hash** und
werden per `reset_for_turn` an der Turn-Grenze geleert
(`agent/tool_guardrails.py:280`) — ein Agent, der *über* Goal-Turns hinweg
oszilliert (edit → test → revert → edit), wird nur vom Turn-Budget und der
Fingerprint-Regel gefangen. Und der Default ist beratend:
`hard_stop_enabled: bool = False` (`:73`), out of the box wird dem Agent also
*gesagt*, dass er kreist, und er darf weiterkreisen.

**PA hat nichts davon.** Die Suche über `agent/`, `worker/` und `realtime/` fördert
nur Nachbarschaftsphänomene zutage: die Byte-identische Tool-Result-Dedup in der
Kompression (`agent/compression.py:36`, `dedup_tool_returns` `:225-273`) loggt
`tool_returns_deduped` und schlägt **keinen** Alarm; `kanban_heartbeat.py` ist ein
Liveness-Puls, kein Fortschrittsmaß; die beiden Watchdogs erkennen einen toten
Producer (`main.py:224-245`) bzw. Stille (`inline.py:45`), nicht Wiederholung.
`_auto_readiness_check` erkennt *Fertigkeit*, nicht *Kreisen*
(`worker/goal_activities.py:52-117`). Ein Agent, der zwölf Turns lang denselben
fehlschlagenden Befehl absetzt, wird ausschließlich von `GOAL_MAX_ITERATIONS` oder
dem Monatsbudget gestoppt — bemerkt wird er nie. Der Verifier-Cap
(`agent/goal_toolset.py:33`) ist das einzige Stück Code im Repo, das auf „hat
aufgehört zu konvergieren" reagiert, und er sieht genau eine Achse innerhalb genau
eines Turns.

**Codex und SWE-agent haben es ebenfalls nicht**, und beide auf lehrreiche Weise.
Codex delegiert es vollständig an das Modell (Blocked-Audit-Prosa, §1.4); die
einzige automatische Unterbrechung ist ein nicht-retrybarer Turn-Fehler, der das
Ziel gezielt blockt, „to prevent automatic continuation from looping and consuming
tokens" (`codex-rs/ext/goal/src/extension.rs:311-315`). SWE-agent hat zwei Zähler,
die wie Stall-Detection *aussehen* und keine sind: `_n_consecutive_timeouts` zählt
Kommando-Timeouts (`sweagent/agent/agents.py:969-975`), und
`ScoreRetryLoop._n_consec_exit_cost` wird inkrementiert und zurückgesetzt, aber
**nie gelesen** (`sweagent/agent/reviewer.py:612-614`) — toter Code, ebenso wie die
offensichtlich dafür gedachten Hooks `on_model_query`/`on_attempt_started`
(`:103-122`, null Aufrufstellen).

**OpenHands** ist der interessante Zwischenfall: `stuck_detection: true` ist in
*jeden* Start-Request hart einkodiert, nicht konfigurierbar
(`src/api/agent-server-adapter.ts:1000, :1114`), und es gibt einen eigenen
Terminalzustand `ExecutionStatus.STUCK` (`base/common.ts:74`), den der Client wie
einen Fehler behandelt (`src/utils/status.ts:25-29`, „Map STUCK to ERROR for now",
`src/hooks/use-agent-state.ts:30-31`). Welche Muster erkannt werden, ist in diesem
Repo **nicht auffindbar** — die Logik liegt im SDK. Der einzige Hinweis im
Repo-Vokabular ist das Critic-Feature `loop behavior` neben `insufficient testing`
(`src/types/agent-server/core/base/critic.ts:13-25`).

---

## 8. Failure-Handoff — was bekommt der Mensch, wenn es nicht geklappt hat?

| Aspekt | PA | Hermes | Codex | OpenHands | SWE-agent |
|---|:---:|:---:|:---:|:---:|:---:|
| Unterscheidbare Endzustände serverseitig | ✓ (6) | ✓ | ✓ (6) | ✓ (4) | ✓ (Exit-Status-Enum) |
| Endzustände beim Nutzer unterscheidbar | ✗ | ✓ | ✓ | ✓ | ◑ |
| Maschinenlesbares „was ist offen" | ✗ | ◑ (Reason-String) | ✗ | ✓ (`missing`) | ✗ |
| Modell schreibt eine Abschluss-Zusammenfassung | ◑ (nur Prompt-Hoffnung) | ✓ (erzwungen) | ✓ (Steering) | ✓ | ✗ |
| Teilergebnis wird gerettet | — | ✓ | ✓ | ✓ | ✓ (Autosubmit) |
| Weiterarbeiten möglich | ✓ (Resume) | ✓ (`/goal resume`) | ✓ | ✓ (Resume-Button) | ✗ |
| Eskalation an den Menschen *vor* dem Aufgeben | ◑ (existiert, wird ignoriert) | ✗ | ✗ | ✗ | ✗ |

### 8.1 PA: das Vokabular ist da, es kommt nur nicht an

`end_goal` flippt den Status und feuert einen Chat-Nudge — mehr nicht
(`worker/goal_activities.py:249-273`). Serverseitig ist die Unterscheidung
sauber: `capped` (12 Turns erreicht), `failed` (Turn dauerhaft gescheitert oder
nicht-retrybarer Fehler, klassifiziert über `classify_model_error`, damit ein
Context-Overflow nicht viermal pro Turn gegen die Wand fährt, `:194-207`),
`budget`, `paused`, `cleared`, `done` — und der Workflow routet **jeden**
Nicht-Abschluss durch `end_goal`, damit kein eingefrorenes „active"-Banner
zurückbleibt (`worker/goal_workflow.py:48-51, :62-66`).

Das Frontend wirft die Unterscheidung weg: das Banner wird nur für `active` und
`paused` gerendert und für alles andere schlicht fallengelassen
(`frontend/src/stores/chat.ts:986-1000, :1011-1021`; `ChatPage.vue:362-408`).
„Verifiziert fertig", „Turns aufgebraucht", „Geld aufgebraucht" und
„unrecoverable gecrasht" sehen für den Nutzer identisch aus: Banner weg,
Ungelesen-Marke da. Ein `summary` wird nur auf dem Erfolgspfad geschrieben
(`agent/goal_toolset.py:154-155`), im Auto-Pfad als Platzhalter
„Automatically verified as achieved." (`worker/goal_activities.py:116`); auf den
Fehlerpfaden gar nichts.

Was der Nutzer tatsächlich bekommt, ist die Prosa, die der Agent zufällig in
seiner letzten Nachricht hinterlassen hat. Die Instruktionen bitten darum
(„if you get stuck or need a decision from the user, say so clearly and do NOT
call complete_goal", `agent/run_instructions.py:176-177`) und der
Verifier-Cap-Text auch („state plainly what is still open and why",
`agent/goal_toolset.py:310-315`) — beides Prompt-Hoffnung, keine Garantie. Genau
der Fehler aus Lehre 4, nur auf der Ausgabeseite.

### 8.2 Was die anderen besser machen

**OpenHands** liefert die beste Struktur: der Judge gibt kein Boolean zurück,
sondern `GoalVerdict{score, complete, missing}`
(`src/types/.../conversation-state-event.ts:67-77`), und `missing` („Concise
description of what remains") tut dreifachen Dienst — es treibt die nächste Runde
als eingespeiste User-Nachricht, es rendert als Live-Fortschrittsbanner, und wenn
die Runden-Schranke reißt, **ist es der Fehlerbericht**, ausgeklappt per
`initiallyExpanded={!active}` (`goal-status-content.tsx:29-44, :65-68, :130-166`).
Dazu die Vokabel-Disziplin: `capped` ist explizit weder `complete` noch
`interrupted` (`:22-27`). Und der Input bleibt bewusst aktiv: „we intentionally do
NOT disable the input when the conversation is in an ERROR/STUCK execution
state" (`custom-chat-input.tsx:52-55`).

**Hermes** pausiert statt zu sterben, mit maschinenlesbarem Grund und einer
Zeile für den Menschen: „⏸ Goal paused — 20/20 turns used. Use /goal resume to
keep going" (`hermes_cli/goals.py:1894-1908`); bei kaputtem Judge druckt es die
exakte `config.yaml`-Stanza zum Reparieren (`:1839-1892`). Auf der inneren Ebene
erzwingt `handle_max_iterations` **eine** zusätzliche, tool-lose API-Runde mit
„provide a final response summarizing what you've found and accomplished so far"
(`agent/chat_completion_helpers.py:2292-2325`) — der Nutzer bekommt eine
Teilfortschritts-Zusammenfassung statt Stille. Im Kanban-Layer landet ein
Budget-Abbruch als sticky `blocked` „(NOT a silent exit)" (`goals.py:2009-2011`),
und zwar bewusst über `_record_task_failure(outcome="timed_out")` statt
`kanban_block`, damit es dem Circuit-Breaker des Dispatchers zählt
(`agent/turn_finalizer.py:144-191`).

**SWE-agent** rettet als einziges immer ein Artefakt: jeder Fehlerpfad läuft durch
`attempt_autosubmission_after_error`, das selbst `git add -A && git diff --cached`
ausführt (`sweagent/agent/agents.py:823-868`), und der Exit-Status trägt den Grund
(`submitted (exit_cost)`, `exit_context`, `exit_format`, …, `:1154-1218`).
Natürliche Sprache gibt es dafür nie — der Bericht ist ein Enum plus ein Diff.

### 8.3 Der PA-Defekt, den es sonst nirgends gibt: `ask_user` wird überrollt

Das Eskalations-Primitiv **existiert** und ist in Goal-Turns aktiv:
`ASK_USER_TOOL = "ask_user"` (`agent/interaction_toolset.py:23`), das Tool wirft
`CallDeferred` (`:90`), `agent/service.py:780-803` fängt die Deferral,
`DeferredRunCoordinator.register_questions` (`agent/deferred.py:100-146`) legt
eine Question-Row an und pusht eine Karte, und die Antwort setzt **denselben
logischen Turn** fort (`service.py:1477`, `deferred.py:160`). Es ist vom
Security-Guard ausgenommen (`agent/tool_guard.py:15-17`), es gibt einen stehenden
Nudge (`agent/run_instructions.py:68-70`, injiziert bei `service.py:1288-1291`),
und `assembler/assembler.py:216-219` hängt `interaction_toolset()` an **jeden**
Nicht-Subagent-Run — ein Goal-Turn ist keiner.

Der Goal-Loop ignoriert das vollständig:

1. `execute_inline_run` ruft `run_repo.mark_completed(run)` bei
   `agent/service.py:659` — **vor** dem Deferral-Zweig bei `:780`. Ein deferrter
   Turn sieht damit aus wie ein normal beendeter.
2. `run_goal_turn` inspiziert nie den Deferral-Zustand; es liest ausschließlich
   `run_config.goal.status` neu (`worker/goal_activities.py:216-219`), sieht
   `active` und liefert `continue: True` (`:242`).
3. Nichts irgendwo gattet einen neuen Turn auf eine unbeantwortete Frage:
   `AgentQuestionRepo.pending_for_chat` wird ausschließlich von
   `api/routers/questions.py:51` gerufen.
4. Der nächste Turn lädt die History mit `sanitize=True` (`service.py:360`).

Netto: **Der Agent stellt dem Nutzer eine blockierende Frage, die Schleife marschiert
daran vorbei, und die Karte bleibt verwaist stehen.** Codex hat für exakt diese
Klasse den Wächter `try_start_turn_if_idle`, der einen Extension-getriebenen Turn
ablehnt, wenn ein User-Turn aussteht (`codex-rs/core/src/session/inject.rs:47`).
OpenHands hat die spiegelbildliche Variante als bekannten Stolperstein — „any
inbound message cancels the goal loop", weshalb dort ein explizites
`if (goalStatus?.active) return;` nötig wurde
(`src/services/child-conversation-launch.ts:483-488`).

---

## 9. Kontext über Schritte hinweg

| Aspekt | PA | Hermes | Codex | OpenHands | SWE-agent |
|---|:---:|:---:|:---:|:---:|:---:|
| Schritt N+1 sieht die History von 1..N | ✓ | ✓ | ✓ | ✓ | ✓ |
| Frischer Kontext pro Schritt | ✗ | ✗ | ✗ | ✗ | ✓ (RetryAgent: total) |
| Kompaktierung / Summarization | ✓ | ✓ | ✓ | ✓ | ✗ (nur mechanisch) |
| Fortsetzung = normale User-Nachricht | ✓ | ✓ | ✓ | ✓ | — |
| Fortsetzung im Transkript markiert | ✓ (Zero-Width-Marker) | ✗ | ◑ (interner Item-Typ) | ✗ (Prefix-Matching!) | — |
| Durabler Scratchpad außerhalb der History | ✗ | ◑ (`todo`, re-injiziert) | ✗ | ✓ (`TaskTracker` + `PLAN.md`) | ✗ |
| Verifier sieht dieselbe History wie der Agent | ✗ | ✗ (bewusst) | — | ◑ | ✗ |

**PA** lädt jeden Turn die volle History frisch aus der Messages-Tabelle und
komprimiert modellabhängig (`agent/service.py:360-385`; Schwelle 80 % des echten
Context-Windows, `agent/model_limits.py:13-14`). Die Kompaktierung ist
goal-bewusst — das Summary-Template führt mit „## Active task (MOST IMPORTANT
field: the last unfinished user intent)" (`agent/compression.py:45-51`) — und der
Tail ist paar-sicher (nie ein Tool-Call/Return getrennt, `:152-180`). Das Modell
wird nach Turn 0 gepinnt, damit der Loop nicht mitten im Ziel auf ein schwaches
lokales Modell umrollt (`worker/goal_activities.py:145-147`).

**Die scharfe Kante:** Kompaktierung und Verifikation sind sich uneinig darüber,
*was History ist*. Das Summary wandert in die **Instructions**, nicht in den
Message-Graph (`agent/service.py:1313-1317`), während `evidence_from_messages` nur
`parts` abläuft (`agent/goal_toolset.py:100-114, :66-82`). Nach der ersten
Kompaktierung eines langen Ziels verliert der `complete_goal`-Verifier also
lautlos die gesamte wegsummierte Arbeit und muss allein aus dem Tail urteilen. Der
DB-lesende Auto-Pfad hat dieses Loch nicht (er liest rohe Rows), ist dafür bei 120
Nachrichten gedeckelt (`:118-143`). **Zwei Pfade, zwei Evidenzfenster, zwei
Fehlermodi — sie können am selben Ziel unterschiedlich urteilen.**

Zur Präzision an einer Stelle, die die Bug-Erzählung trägt:
`persist_new_messages` bei `agent/service.py:657` ist der Erfolgspfad; Teilstände
werden auf Fehlerpfaden früher geschrieben (`:601-604` bei Cancellation, `:627` bei
Exception). „Messages landen erst am Run-Ende" gilt für den Bug, den es erklärt,
ist aber nicht der einzige Write.

Zum Vergleich: **Hermes** macht die Amnesie explizit zum Design — der Judge
bekommt pro Call frischen Minimalkontext, der Verification-Checker ignoriert den
Live-Kontext komplett und liest SQLite (`agent/verification_evidence.py:629-698`),
und ephemere Nudges werden vor der Persistenz als `_verification_stop_synthetic`
etc. wieder herausgefiltert (`agent/conversation_loop.py:7190-7225`). **OpenHands**
schreibt die Kompaktierung als eigenes Event mit `forgotten_event_ids` und
`summary_offset` statt als stilles Rewrite
(`.../condensation-event.ts:5-25`) und hat als einziges einen echten durablen
Scratchpad (`TaskTrackerAction`, `PlanningFileEditorAction` auf `PLAN.md`,
`base/action.ts:127-136, :218-247`) — PAs `todowrite` überlebt nur als Tool-Call
in der History (`agent/todo_toolset.py:1-7`), die Kompaktierung kann also den Plan
fressen. **SWE-agent** ist das Extrem in beide Richtungen: der Default-History-
Processor ist die Identitätsfunktion (`sweagent/agent/history_processors.py:74-82`),
und zwischen Retry-Attempts wird `env.hard_reset()` gefahren mit einem brandneuen
Agent (`sweagent/agent/agents.py:303-326`) — Attempt N+1 sieht **nichts** von
Attempt N, weder Patch noch Trajektorie noch Reviewer-Kritik. Das ist i.i.d.
Resampling mit Selektor, keine iterative Verbesserung.

---

## 10. Adopt / Adapt / Skip

### ADOPT

| # | Maßnahme | Warum (eine Zeile) | Aufwand |
|---|---|---|:---:|
| **A1** | **Tool-Call-Zähler pro Turn** im Goal-Loop, hart, analog `loop_caps` (`hermes/agent/tool_guardrails.py:447`) — plus Token-Zähler pro Ziel | Die Achse, auf der der Runaway stattfand (19 Calls bei Zählerstand 1, `tests/api/test_goal_toolset.py:139-171`), ist die einzige völlig ungezählte; das Muster existiert im Repo bereits für Script-Executors (`code_execution/monty.py:36`) | **S** |
| **A2** | **`ask_user` gattet den nächsten Turn**: `run_goal_turn` prüft `AgentQuestionRepo.pending_for_chat` (heute nur `api/routers/questions.py:51`) und pausiert das Ziel statt weiterzulaufen | Das Eskalations-Primitiv ist gebaut und in Goal-Turns aktiv (`interaction_toolset.py:23`, `assembler.py:216-219`), wird aber überrollt, weil `mark_completed` (`service.py:659`) vor dem Deferral-Zweig (`:780`) läuft — Codex' `try_start_turn_if_idle` ist genau dieser Wächter | **S** |
| **A3** | **Strukturierter Verdict-Typ** statt Substring-Match: `_Verdict{achieved: bool, next_step: str}` aus `agent/kanban_context.py:101-104` in `goal_toolset.verify_goal` ziehen | Die gröbere Kopie im eigenen Repo macht es bereits robuster als das Original (`goal_toolset.py:268` parst die erste Zeile per `in`), und `next_step` ist zugleich der Rohstoff für A4 | **S** |
| **A4** | **Strukturierter Failure-Handoff**: `summary` + `open_items` auf **allen** Endzuständen schreiben (heute nur Erfolgspfad, `goal_toolset.py:154-155`) und das Frontend-Banner für `done`/`capped`/`failed`/`budget` rendern statt zu droppen (`frontend/src/stores/chat.ts:986-1000`) | Serverseitig existieren sechs unterscheidbare Endzustände (`goal_workflow.py:48-66`) und der Nutzer sieht viermal dasselbe Nichts; OpenHands' `{score, complete, missing}` zeigt, dass eine Struktur Fortsetzung, Fortschrittsanzeige und Fehlerbericht zugleich bedient | **S–M** |
| **A5** | **Verifier-Cap zählt erst ab dem echten Versuch** — Inkrement hinter die Frühausstiege bei `goal_toolset.py:319-321` und `:330-333` schieben | Heute sperren zwei harmlose Parse-/Kein-Ziel-Fehler den Turn für seinen *ersten* echten Verifikationsversuch aus | **S** |

### ADAPT

| # | Maßnahme | Warum (eine Zeile) | Aufwand |
|---|---|---|:---:|
| **B1** | **Ein Evidenzfenster statt zwei**: `_auto_readiness_check` und `complete_goal` müssen dieselbe Quelle lesen; das Kompaktierungs-Summary aus den Instructions (`service.py:1313-1317`) zusätzlich in die Evidenz einspeisen | Die beiden Pfade können am selben Ziel unterschiedlich urteilen, und der Live-Pfad verliert nach der ersten Kompaktierung lautlos die gesamte wegsummierte Arbeit (`goal_toolset.py:100-114`) | **M** |
| **B2** | **Hermes' Evidence-Ledger-Idee, PA-gerecht**: statt Shell-exit-codes ein persistiertes Prüf-Artefakt pro Ziel (Tool-Ergebnis-Hashes + Zeitstempel) mit der **Stale-Regel** — jede spätere schreibende Aktion invalidiert ein grünes Urteil (`hermes/agent/verification_evidence.py:688`) | „Ich hab's geprüft" darf über eine nachfolgende Änderung hinweg nicht wiederverwendbar sein; PA hat die Traces bereits, nur nicht die Zeit-Invalidierung | **M–L** |
| **B3** | **Stall-Detection minimal**: Hash der Tool-Result-Payloads pro Turn (Hermes' `_no_progress`, `tool_guardrails.py:276-507`) plus ein turn-übergreifender „nichts hat sich geändert"-Fingerprint (Hermes' `workspace_fingerprint`, `goals.py:1498`), der den Turn-Zähler trotzdem vorrücken lässt | PA erkennt Kreisen **gar nicht** (`compression.py:36` dedupliziert bereits identische Tool-Returns, ohne Alarm zu schlagen) — die Dedup-Stelle ist der billigste Ort, das Signal abzugreifen | **M** |
| **B4** | **Erzwungene Konfrontation vor dem Abschluss** nach SWE-agents Zwei-Stufen-Submit (`tools/review_on_submit_m/bin/submit:33-46`): der erste `complete_goal` liefert dem Agenten seine *neu aus dem Speicher gelesene* Evidenz plus Checkliste zurück, ohne zu terminieren | Ein Tool-Roundtrip, null zusätzliche LLM-Infrastruktur, deterministisch — und die Evidenz stammt aus der Welt statt aus der Erinnerung; passt exakt auf PAs bestehende `_MAX_VERIFY_PER_RUN`-Mechanik | **M** |
| **B5** | **Wall-Clock pro Ziel** + Kopplung an `APPROVAL_TIMEOUT`: Goal-Turns dürfen nicht 600 s pro genehmigungspflichtigem Call auf einen abwesenden Menschen warten (`device_policy.py:31, :78` gegen `start_to_close_timeout=900`, `goal_workflow.py:23`) | Zwei genehmigungspflichtige Calls sprengen das Activity-Budget und lösen einen Retry aus, der wieder wartet — im unbeaufsichtigten Modus muss der Timeout kurz sein oder der Call direkt als „braucht Freigabe" eskalieren (→ A2) | **S** |
| **B6** | **Ein Verifier-Konzept statt drei**: `agent/kanban_context.py:70-129` (`run_worker`, in-process, Prosa-Evidenz, fail-**open** bei Judge-Fehler `:124`, Default 4 Turns mit Clamp 8 bei `:106`) auf den geprüften Goal-Pfad zusammenführen; das „Verify:"-Card-Konzept (`kanban_toolset.py:712`) bleibt als *menschliche* Review-Stufe daneben bestehen | Dieselbe Frage wird im selben Codebase dreifach und widersprüchlich beantwortet — nur eine der Kopien hat die Fixes bekommen, und ausgerechnet die ungefixte hat den besseren Verdict-Typ (A3) | **M** |

### SKIP — bewusst nicht

| Maßnahme | Warum nicht |
|---|---|
| **Fail-open-Judge à la Hermes** (`goals.py:18-19`, jeder Transportfehler → `continue`) | PA failt bei Verifier-Fehlern bewusst **closed** (`goal_toolset.py:265-267`), begründet im Kommentar und per Test fixiert — ein Rate-Limit darf niemals Arbeit als erledigt markieren. Hermes braucht wegen der Gegenentscheidung zwei zusätzliche Anti-Wedge-Zähler (`:71, :76`); PA braucht sie nicht. |
| **Codex' unbegrenzter Default-Goal-Loop** (`spec.rs:36-40`: „Omit [token_budget] unless explicitly requested") | Kein Iterations-Cap, kein Timeout, keine Wiederholungserkennung, nur ein nicht-retrybarer Fehler als Notbremse — genau das Gegenteil dessen, was PA aus dem eigenen Runaway gelernt hat. |
| **Termination per stdout-Sentinel** (SWE-agent, `tools/tools.py:372-376`) | Jedes Kommando, dessen Ausgabe den String enthält, beendet den Lauf. PAs Tool-plus-Verifier ist strikt besser; nicht zurückrüsten. |
| **Kontextfreie Retry-Attempts** (SWE-agents `RetryAgent`, `agents.py:303-326`: `hard_reset` + neuer Agent, Attempt N+1 sieht nichts von N) | PAs Ziele sind lange, zustandsbehaftete Vorhaben, keine i.i.d. Benchmark-Instanzen — die durchgehende History ist hier die richtige Wahl. |
| **Probabilistischer Zufriedenheits-Critic als Gate** (OpenHands, `critic.ts:43-49`) | Er sagt P(Nutzer zufrieden) voraus, nicht ob die Arbeit getan ist; PAs Tool-Trace-Verifier ist geerdeter. Das *Feature-Vokabular* („loop behavior") ist als Anregung für B3 interessant, das Gate nicht. |
| **Judge-Ensemble / n-Sample-Scoring** (SWE-agent, `reviewer.py:400-414`: 5 Calls, Mittelwert, letzte Zahl der letzten Zeile) | Multipliziert Kosten auf der teuersten Achse und kollidiert mit PAs Per-Response-Usage-Modell; das Geld ist in B2 (deterministische Evidenz) besser angelegt als in mehr Meinungen. |
| **Geld als *einzige* Schranke** (SWE-agent, `models.py:73-76`) | Ein kreisender Agent wird dort mehrere hundert Schritte später von der Kreditkarte gestoppt — und der Lauf gilt danach als `submitted (exit_cost)`. PA braucht zählbasierte Schranken *zusätzlich* zum Monatsbudget, nicht statt seiner. |

---

## 11. Empfohlene Reihenfolge

1. **A2 + A5** (S) — zwei kleine, klar begrenzte Korrekturen an bereits gebauten
   Mechanismen; A2 schließt einen echten Defekt.
2. **A1** (S) — die fehlende Einheit; ohne sie bleibt jede weitere Schranke
   Kosmetik.
3. **A3 → A4** (S / S–M) — der strukturierte Verdict liefert `next_step` als
   Rohstoff für den Failure-Handoff; zusammen bauen.
4. **B1** (M) — ein Evidenzfenster, bevor B2/B4 darauf aufsetzen.
5. **B3 + B5** (M / S) — Kreis-Erkennung und die unmodellierte Wartezeit.
6. **B4 → B2** (M / M–L) — erst die billige erzwungene Konfrontation, dann der
   persistente Ledger mit Stale-Regel.
7. **B6** (M) — Konsolidierung, sobald der Goal-Pfad stabil ist.

> Offene Produktfrage vor A1: Zählt der Tool-Call-Cap pro **Turn** (wie Hermes'
> `loop_caps`) oder kumulativ pro **Ziel**? Pro Turn ist replay-sicher und
> deterministisch für Temporal; pro Ziel bräuchte einen persistierten Zähler und
> würde damit dieselbe Telemetrie-vs-Bound-Verwechslung riskieren, die
> `g["iterations"]` bereits einmal produziert hat (§6.1).

---

*Erstellt durch direkte Quellcode-Analyse von vier geklonten Repos und einem
IST-Audit des Personal-Agent-Goal-Pfads. Die OpenHands-Seite beschreibt den
beobachtbaren Kontrakt aus `@openhands/agent-canvas` @ `4470813`; die Mechanik
liegt dort in `OpenHands/software-agent-sdk` und ist als solche gekennzeichnet.
Wo ein System einen Mechanismus nicht hat, steht ✗ und nicht ◑ — eine ehrliche
Lücke ist nützlicher als ein gedehntes Teilweise. Empfehlungen respektieren die
Frozen Contracts (insb. #6 RunSpec-Snapshot, #13 Untrusted-Gating, #14
fail-closed Klassifikation, #1/#2 Usage-Modell).*