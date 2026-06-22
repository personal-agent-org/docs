# Frontend refactoring — remaining work

Status of the `apps/web` (Vue 3 / Quasar / TS) clean-up that followed the bad-practices /
dead-code / duplication audit. This doc captures **what is left**, the recommended approach,
and — importantly — the findings that were **verified as non-issues** so they are not
re-investigated later.

## Approach (what made the done work safe)

God-component decomposition is done as **behaviour-preserving extraction** into composables /
child components, each verified by the existing gate:

```
pnpm --dir apps/web lint        # eslint (type-aware)
pnpm --dir apps/web exec vue-tsc --noEmit -p tsconfig.json   # incl. template bindings
pnpm --dir apps/web exec vitest run
```

`vue-tsc` type-checks template bindings, so a missing composable return surfaces as a compile
error — that is the safety net for the extractions below. **State-/timing-coupled cores cannot
be fully verified this way and need a manual smoke-test with the app running.**

## Done so far

- Quick wins: removed 3 dead components; `apiErrorDetail` util (25 call sites); `structuredClone`
  (JSON-hack removed, 17 sites); **dashboard card config typing `Record<string, unknown>` → 0/44**;
  `MicButton` unmount cleanup; `DeviceTerminal` i18n; `useMermaid` observer dispose; `datetime` util.
- `SettingsPage.vue` 2496 → ~1719 LOC: extracted `SettingsAppDownloads`, `SettingsCommands`,
  `SettingsCompanion`, `SettingsUsage` (under `src/components/settings/`).
- `DashboardPage.vue` 1010 → ~972: `useUndoableState` (+ unit tests), `useDashboardStrategy`.
- `MainLayout.vue` 1229 → ~1055: `useChatRunSettings` (header model/reasoning/mode/classification/
  security/collab/memory controls).
- `ChatPage.vue` 1480 → ~1439: `useWorkingPhrase` (rotating spinner phrase + its 5s timer).

## Remaining work — prioritized

### 1. God-components still over budget

| File | LOC | Suggested cut | Verification |
| --- | --- | --- | --- |
| `stores/chat.ts` | ~2539 | Split cohesive subsystems into composables: goal-loop autonomy, workspace-setup state machine, voice I/O, older-message pagination. | **App smoke-test** — highest stakes (streaming/runs, SSE/WS). |
| `pages/SettingsPage.vue` | ~1719 | Remaining 4 tabs: `profile`, `agent`, `appearance`, `behavior`. | **App smoke-test** — they share one `onMounted` that hydrates all four forms from one `auth.loadMe()`, plus a `behaviorReady` flag that arms behaviour auto-save watchers only after hydration. A mis-armed watcher would silently POST during hydration. |
| `pages/ChatPage.vue` | ~1439 | **`useChatMobileNav`** (~100 LOC: `mobileView`, nav views, unread badges, `navPulse`, seen counters + their watchers) → next safe step, no app needed. Then `useMessageEditing` (~60 LOC: inline message + queue edit) and `useChatScroll` (scroll-to-bottom / load-older). | tsc/lint/tests for the nav + editing cuts; the watchers in the nav block have side effects (reset seen counters) so move them with care. |
| `pages/DashboardPage.vue` | ~972 | The remaining body is the editor core (dialog state + card/view/section/badge CRUD) all hanging off the shared `config` ref + `mutate()`. Extracting it wholesale yields a 25+ member composable — **not a clean separation**; only worth it with an app smoke-test, otherwise leave as-is. | App smoke-test if attempted. |
| `layouts/MainLayout.vue` | ~1055 | Lower priority. The rest is the layout shell (nav drawer, folders, recent chats, export). The ~20 `go*` route helpers could be data-driven, but it is cosmetic. | tsc/lint. |

### 2. Deferred real items

- **`GenericPicker`** — `IntegrationsPicker`, `MemoryAccessPicker`, `WorkspaceDevicePicker` and the
  other menu pickers share ~70% structure (q-btn → q-menu → filter → q-list → toggle/select). A
  shared base component would remove the duplication, but each picker has subtle filtering/selection
  differences → **needs an app smoke-test**, treat as its own ticket.

### 3. Verified NON-issues — do not re-chase

These were flagged by the audit pass but verified to be already-correct; changing them would
regress behaviour:

- **Store error handling (`integrations`, `marketplace`)** — the stores intentionally do not toast;
  every caller already wraps mutations in `try/catch` + `Notify` (e.g. `IntegrationsManager.toggle`,
  `MarketplacePage`). Adding store-level `Notify` would double-toast. Architecture is deliberate:
  *store = loading/optimistic state, component = user-facing error.*
- **`reasoningOptions` "duplication"** — the two remaining copies (`MainLayout`/`useChatRunSettings`
  vs `SettingsPage`) are **semantically different types** (`ThinkingValue` with `null`/`false` vs the
  settings-default string `'off'`). The real duplicate (`ModelPicker.vue`) was deleted.
- **Date formatting** — `formatTime` (`utils/datetime.ts`) is adopted; the remaining `toLocale*`
  call sites use genuinely different formats, not duplicates.
- **`v-html` / markdown** — all bindings go through `renderMarkdown` (DOMPurify, `html:false`, KaTeX
  `trust:false`, DoS guards) or hljs-escaped output. No XSS surface.
- **i18n parity** — `de-DE` and `en-US` verified equal (2102 leaf keys each, 0 missing either way).
- **`useAsyncResource`** — not worth adding: with `Notify` it would double-toast (see above); as a
  loading-only wrapper it saves ~3 lines per store across ~6 stores that can't be smoke-tested.

## Notes

- All hard-coded backend/UI-framework strings stay English; user-facing copy goes through i18n.
- Keep extractions behaviour-preserving and run the gate above before each commit.
