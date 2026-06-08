# Umsetzungsplan — „setze das alles um"

Lebende Checkliste für den autonomen Umbau (Goal: *setze das alles um*). Jeder Block wird
einzeln committet; erledigte Punkte werden hier abgehakt.

## A. Robustheit & Betrieb
- [x] **A1** Bildanalyse: graceful degradation, wenn das Modell kein Vision kann (kein harter
  500-Fail — Bild verworfen + Text weiter beantwortet; Retry-without-images in inline.py)
- [x] **A2** web_fetch live: Backend-Image neu gebaut + backend/worker redeployed (trafilatura
  drin, web_fetch live verifiziert); A1 damit auch live

## B. Integration / Config-Flow-System (HA-Adoption)
- [x] **B1 (P0)** Typisierte Form-Selektoren: `FieldDescriptor` um `entity`/`device`/`area`/
  `duration`/`date`/`time`/`datetime`/`color` + `filter` + `multiple` erweitert; ConfigFlowForm.vue
  rendert sie (entity/device/area mit Async-Optionen, area degradiert bis C3)
- [ ] **B2 (P1)** Options-/Reconfigure-/Reauth-Flows (`async_step_options/reconfigure/reauth`
  + `scope` im FlowManager + API-Trigger)
- [ ] **B3 (P2)** Config-Entry-Lifecycle-States + Reload ohne Restart
  (`POST /plugin_configs/{id}/reload`, retry/backoff)
- [ ] **B4 (P3)** Quality-Scale / Integration-Health im Manifest + Admin-UI
- [ ] **B5 (P4)** Soft-Dependency-Ordering (`after_dependencies` im Topo-Sort)

## C. Entity-System vertiefen (HA-Adoption)
- [x] **C1** State-Timestamps (`state_changed_at`/`state_updated_at`/`availability`) +
  `old_state` in `entity.updated`-Events + old_state/new_state-Transition-Trigger-Filter
  (Migration entity_state_01)
- [ ] **C2** State-History-Tabelle (`entity_state_history`, append-only) + History-API
- [ ] **C3** Device/Area/Floor-Registries + `device_id`/`area_id` FKs + Sync-Auflösung +
  Trigger-/Search-Filter
- [ ] **C4** Entity-Category + Visibility (`category` config/diagnostic, `hidden`, `disabled`)
- [ ] **C5** Units & strukturierte Attribute (`AttributeDescriptor` type/unit/precision,
  `state_class`, `device_class`)
- [ ] **C6** Labels (User-Tags) + Such-/Trigger-Filter
- [ ] **C7** Registry-Event-Bus (`*_registry.updated`)

## D. Lovelace-Dashboards & Cards (neue Oberfläche)
- [ ] **D1** Datenmodell: `Dashboard` (config JSONB, RLS) + API + Pinia-Store
- [ ] **D2** Card-Registry + ~12 Cards (entity/entities/markdown/button/heading/gauge/grid/
  stack/conditional + chat/automation/agenda)
- [ ] **D3** Editor-UX: Card-Picker + schema-getriebenes Config-Formular + Grid-Layout
- [ ] **D4** View-Layouts (masonry/sections/panel) + Routing/Nav

---

Reihenfolge (Wert × Unabhängigkeit): A1 → A2 → B1 → C1 → C5 → D1–D4 → B2/B3 → C3 → C4/C6 →
B4/B5 → C2/C7. Wird bei Bedarf angepasst.
