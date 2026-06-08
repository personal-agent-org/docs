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
- [x] **B2 (P1)** Reconfigure-Flow: bestehende Integration in-place bearbeiten
  (`FlowContext.entry_id` + `update_entry` + `POST /plugin-configs/{id}/reconfigure` + Frontend
  „Neu konfigurieren"-Button). Reauth/Options = derselbe Mechanismus (Plugin kann
  `async_step_reauth` definieren, FlowManager dispatcht per hasattr)
- [x] **B3 (P2)** Reload ohne Restart: `POST /plugin-configs/{id}/reload` — clear error state +
  re-sync der Entities (Events feuern). (Vollständige Retry/Backoff-Lifecycle-States = Follow-up;
  in unserer stateless-pro-Run-Architektur ist Reload = Re-Sync.)
- [x] **B4 (P3)** Quality-Scale (`quality_scale` + `issue_tracker`) im Manifest, in der
  /integrations-API ausgegeben
- [x] **B5 (P4)** Soft-Dependency-Ordering: `after_dependencies` im Loader-Topo-Sort (lädt
  danach, blockt/dropt aber nie)

## C. Entity-System vertiefen (HA-Adoption)
- [x] **C1** State-Timestamps (`state_changed_at`/`state_updated_at`/`availability`) +
  `old_state` in `entity.updated`-Events + old_state/new_state-Transition-Trigger-Filter
  (Migration entity_state_01)
- [x] **C2** State-History-Tabelle (`entity_state_history`, append-only, RLS) — eine Zeile pro
  State-Wertänderung; GET /entities/{id}/history (Migration entity_history_01)
- [x] **C3** Area/Floor-Registries (RLS) + `entities.area_id` FK + /areas + /floors CRUD-API +
  PATCH /entities setzt area_id (Migration area_floor_01); macht den B1-area-Selektor funktional.
  Device-Registry (Entity-Gruppierung) + Sync-Auflösung + Area-Management-UI = Follow-up
- [x] **C4** Entity-Category + Visibility (`category` config/diagnostic, `hidden`, `disabled`);
  diagnostic-Typen werden versteckt erstellt, disabled → keine Automations-Events; PATCH
  /entities/{id} + EntityOut-Flags (Migration entity_visibility_01)
- [x] **C5** Type-Semantik: `device_class`/`state_class`/`unit`/`category` auf EntityTypeDescriptor
  + EntityType-Catalog + Sync + entity-types-API (Migration entity_type_semantics_01)
  `state_class`, `device_class`)
- [x] **C6** Labels: `labels`-Tabelle (RLS) + `entities.labels` JSONB; /labels CRUD-API +
  PATCH /entities setzt Labels (Migration label_01). Such-/Trigger-Filter = Follow-up
- [x] **C7** Registry-Events: User-Änderungen via PATCH /entities (area_id/labels/visibility)
  feuern `entity.updated` mit `changed`-Feld → Automationen reagieren auf Re-Organisation

## D. Lovelace-Dashboards & Cards (neue Oberfläche)
- [ ] **D1** Datenmodell: `Dashboard` (config JSONB, RLS) + API + Pinia-Store
- [ ] **D2** Card-Registry + ~12 Cards (entity/entities/markdown/button/heading/gauge/grid/
  stack/conditional + chat/automation/agenda)
- [ ] **D3** Editor-UX: Card-Picker + schema-getriebenes Config-Formular + Grid-Layout
- [ ] **D4** View-Layouts (masonry/sections/panel) + Routing/Nav

---

Reihenfolge (Wert × Unabhängigkeit): A1 → A2 → B1 → C1 → C5 → D1–D4 → B2/B3 → C3 → C4/C6 →
B4/B5 → C2/C7. Wird bei Bedarf angepasst.
