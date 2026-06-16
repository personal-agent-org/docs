# Vereinheitlichung: Scope-Modell + Entity-Modell

> Status: Design (Vorschlag). Lead-Architekt-Entwurf. Verifiziert gegen den realen
> Code-Stand am 2026-06-16. Alle Datei:Zeile-Referenzen sind echt.

## Problemstellung — der heutige Doppel-Bruch

Heute existieren **zwei** Entity-Systeme mit **gegensätzlichen** Scope-Modellen, die an
genau den Nahtstellen auseinanderdriften, an denen Daten geteilt werden sollen:

| | (A) Integration-`Entity` | (B) World-Memory `WorldEntity`+`Fact` |
|---|---|---|
| Tabellen | `entities`, `entity_state_history`, `entity_chunks` | `world_entities`, `facts`, `world_events`, `entity_aliases`, `memory_projections`, `curator_state` |
| Natur | Live-State, deterministisch von Integrationen synchronisiert | Bitemporaler Wissensgraph (kuratiert + Feeder) |
| Scope-Spalten | `owner_sub` **und** `org_id` (beide nullable) — `entity.py:54-59` | `owner_sub` (NOT NULL) **und** `org_id` (nullable) — `world_memory.py:145-148` |
| RLS-GUC | `personal_agent.current_org` — **fail-OPEN** (`d0e1f2a3b4c5_entities_rag.py:30-34`) | `personal_agent.current_owner` — **fail-CLOSED** (`world_memory_01.py:34`) |
| Default-Sichtbarkeit | Org-weit sichtbar (GUC unset → alles sichtbar) | Nur eigener User (GUC unset → 0 Zeilen) |
| App-Filter | manuelles `owner_sub == me OR org_id IS NOT NULL` (`entity_repo.py:26-28`) | reine RLS, kein App-Filter |
| Teilen | nur Org-weit (oder global) — **keine Group** | gar nicht teilbar |

Die zwei GUCs werden **beide** pro Request gesetzt — `set_tenant_context` +
`set_owner_context` in `get_scoped_db` (`auth/deps.py:69-71`). Das Group-System
(`group.py:25-52`, OIDC-zugewiesene Mitgliedschaft) widert heute nur **applikationsseitig**
auf: z.B. `folder_repo.get_accessible()` baut von Hand ein `owner_sub == me OR group_id IN
my_groups` (`folder_repo.py:68-70`). Group steht in **keinem** RLS-Prädikat.

**Der vom Nutzer vereinbarte Schlüssel-Enabler:** Teilen passiert, indem man eine
Integration auf **Team-Scope = das bestehende Group-System** einrichtet. Damit wird aus
„org-shared fail-open vs. owner-private fail-closed" **ein** Prinzipal-Scope:
`scope = user:<sub> | group:<id>`, fail-closed, für **beide** Systeme.

---

## 1. Das vereinheitlichte Scope-Modell

### 1.1 Ein Prinzipal als Scope — `scope_ref`

Jede zugriffskontrollierte Zeile bekommt **eine** Spalte `scope_ref TEXT NOT NULL`, die
genau **einen** Prinzipal benennt:

```
scope_ref = "user:<sub>"      # privat für einen Nutzer
          | "group:<uuid>"    # geteilt mit einer Group (Team)
```

Das ersetzt das Paar `(owner_sub, org_id)` als **Access-Control-Achse**. Eine Entity / ein
Fact gehört zu **genau einem** `scope_ref` — Schreibzugriff ist eindeutig. (`org_id` bleibt
als **Tenant-Grenze** erhalten, siehe §1.4 — es ist orthogonal.)

> Begründung „genau ein scope_ref": deckt sich mit dem heutigen Datenmodell —
> `IntegrationConfig.scope` ist schon heute ein einzelner Enum-Wert (`integrations.py:79`,
> `SCOPE_USER|SCOPE_ORG|SCOPE_GLOBAL`), und der Feeder schreibt heute schon nur **einen**
> `owner_sub` pro Node (`entities/service.py:266-268`, Owner-only-Gate). Wir generalisieren
> diesen einen Wert, statt zwei Achsen zu mischen.

### 1.2 Was auf die Connection gesetzt wird — die *Menge* lesbarer Scopes

Heute setzt der Request **zwei** GUCs (`auth/deps.py:69-71`). Künftig setzt er **eine**
GUC, die die **Menge aller lesbaren Scopes** des Prinzipals enthält — mein User + alle
meine Groups:

```sql
-- statt set_tenant_context + set_owner_context:
SELECT set_config('personal_agent.current_scopes',
                  'user:<sub>,group:<g1>,group:<g2>,...', true);
SELECT set_config('personal_agent.current_org', '<org-uuid>', true);  -- bleibt (§1.4)
```

`current_scopes` ist eine **Komma-separierte Liste** (kein JSON — billiger zu parsen in der
RLS-USING-Klausel, vgl. die heutige `nullif(current_setting(...),'')`-Mechanik in
`world_memory_01.py:34`). Sie wird in `set_scope_context()` gesetzt — der direkte Nachfolger
von `set_tenant_context`/`set_owner_context` (`tenancy_guc.py:21-43`). Die Group-Liste kommt
aus genau dem Hot-Path, der heute schon existiert: `GroupRepo.member_group_ids(sub)`
(`group_repo.py:117-122`, RLS-frei, ein indexierter Lookup über `group_memberships.user_sub`)
— heute via `get_my_group_ids` (`auth/deps.py:78-87`) ohnehin pro Request verfügbar.

**Wichtig — Schreib-GUC getrennt von Lese-GUC:** Für `WITH CHECK` (INSERT/UPDATE) braucht es
**eine** schreibbare Identität, nicht die Lese-Menge. Wir setzen daher zusätzlich
`personal_agent.write_scope` = genau **ein** `scope_ref` (Default `user:<sub>`; bei
group-scoped Schreibern, z.B. der Sync einer group-Integration, das `group:<id>`). RLS
`WITH CHECK` matcht gegen `write_scope`, RLS `USING` (Lesen) gegen `current_scopes`. Das
verhindert „ich lese 5 Groups, also darf ich auch in alle 5 schreiben".

### 1.3 Die neuen RLS-Policies — fail-closed default-deny

Ein **einziges** Policy-Muster ersetzt sowohl das fail-open Org-Prädikat
(`d0e1f2a3b4c5_entities_rag.py:30-34`) als auch das fail-closed Owner-Prädikat
(`world_memory_01.py:34`):

```sql
-- Lesen: scope_ref muss in der Menge meiner lesbaren Scopes liegen.
-- fail-CLOSED: GUC unset/leer → string_to_array('', ',') = {} → kein Match → 0 Zeilen.
_READ = "scope_ref = ANY(string_to_array(
            nullif(current_setting('personal_agent.current_scopes', true), ''), ','))"

-- Schreiben: nur in meinen einen Schreib-Scope.
_WRITE = "scope_ref = nullif(current_setting('personal_agent.write_scope', true), '')"

CREATE POLICY scope_isolation ON <table>
  USING (_READ) WITH CHECK (_WRITE);
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
ALTER TABLE <table> FORCE ROW LEVEL SECURITY;
```

Eigenschaften, bewusst gewählt:

- **fail-closed by default** (Decision #19 generalisiert): GUC unset → `string_to_array('',
  ',')` ist das leere Array → `= ANY({})` ist immer FALSE → **0 Zeilen**. Das ist exakt die
  heutige World-Memory-Semantik (`world_memory_01.py:31-34`), jetzt für **alle** Tabellen.
- **FORCE ROW LEVEL SECURITY** bleibt (wie `world_memory_01.py:50` und
  `d0e1f2a3b4c5_entities_rag.py:39`) — blockt den Table-Owner-Bypass.
- **Group = Teilen**: liegt `group:<g>` in `current_scopes`, sind alle Zeilen mit
  `scope_ref='group:<g>'` lesbar — DB-seitig, kein App-`or_()` mehr nötig (der
  `entity_repo.py:26-28`-Handfilter **entfällt**, ebenso die `folder_repo`-Widening-Logik
  für die migrierten Tabellen).

**Blast-Radius des Übergangs fail-open → fail-closed:** Die Integration-`entities` waren
fail-open. Interne Flows ohne Auth (Worker-Sync, Reconciler) sahen bei unsetztem GUC
**alles**. Nach der Umstellung sehen sie bei unsetztem GUC **nichts**. Jeder solche Pfad
**muss** künftig `set_scope_context`/`write_scope` explizit setzen — exakt wie es die
World-Memory-Worker heute schon tun (`world_memory_toolset.py:185-191`,
`entities/service.py:289-290`). Das ist die Hauptarbeit der Migration (§3) und das
Hauptrisiko (§4).

### 1.4 Contract #11 bleibt: Org als äußere Tenant-Grenze

`org_id` + `current_org`-GUC + das `tenant_isolation`-Prädikat bleiben **unverändert** als
**äußere** Grenze. Validierung `X-Personal-Agent-Org` vs. Token-Org-Claim
(`get_current_principal` → `resolve_active_org`, `auth/deps.py:42-44`) bleibt. Begründung:

- Group/User-Scope ist die **innere** Sichtbarkeit *innerhalb* eines Tenants. Eine Group ist
  per Definition org-scoped (`group.py:32-34`), also ist `group:<id>` immer Teil **eines**
  Org. Org bleibt die harte Mandantengrenze (Defense-in-Depth).
- Zwei orthogonale Policies auf derselben Tabelle sind in PG additiv (AND-verknüpft bei
  PERMISSIVE-Policies derselben Aktion → genauer: mehrere PERMISSIVE-Policies sind OR; wir
  wollen AND). **Entscheidung:** Wir packen beide Prädikate in **eine** Policy:

```sql
CREATE POLICY scope_isolation ON <table>
  USING (
    (nullif(current_setting('personal_agent.current_org', true),'') IS NULL
      OR org_id IS NULL
      OR org_id = nullif(current_setting('personal_agent.current_org', true),'')::uuid)
    AND  -- innerer Scope, fail-closed:
    scope_ref = ANY(string_to_array(
      nullif(current_setting('personal_agent.current_scopes', true),''), ','))
  )
  WITH CHECK (
    (org_id IS NULL OR org_id = nullif(current_setting('personal_agent.current_org', true),'')::uuid)
    AND scope_ref = nullif(current_setting('personal_agent.write_scope', true),'')
  );
```

So bleibt der fail-open-Charakter **nur** für die Org-Achse (interne org-agnostische Flows
wie heute), während der innere Scope **fail-closed** ist. Eine Zeile ist sichtbar gdw. *(Org
passt oder org-agnostisch)* **und** *(mein User/meine Group)*.

### 1.5 Integrationen pro Scope einrichten

`IntegrationConfig.scope` (`integrations.py:79`) wird von `user|org|global` auf das
Prinzipal-Modell umgestellt: ein neues Feld `scope_ref TEXT` (`user:<sub>` | `group:<id>`).
`org`/`global`-Entries bleiben als Sonderfall erhalten (siehe Offene Entscheidung 1). Die
`allowed_scopes`-Governance (`integrations.py:55-59`, admin entscheidet welche Scopes ein
Integration konfigurieren darf) wird um `"group"` erweitert.

Der Sync propagiert `scope_ref` deterministisch auf jede produzierte Zeile. Heute kopiert
`EntityService.upsert_batch` den `owner_sub`/`org_id` des Entries auf jede Entity
(`entities/service.py`, EntryRef-Pattern). Künftig kopiert er **`entry.scope_ref`** auf
`entity.scope_ref` und setzt `write_scope = entry.scope_ref` für die Sync-Transaktion. Der
World-Feeder (`entities/service.py:266-268`) ändert sein Gate von „owner_sub vorhanden?" auf
„scope_ref vorhanden?" und propagiert `entry.scope_ref` auf den `WorldEntity`-Node — eine
group-Integration füttert dann automatisch **group-shared** Graph-Nodes + Facts.

---

## 2. Das vereinheitlichte Entity-Modell

### 2.1 Zielbild: WorldEntity wird die Identitätsschicht, `entities` wird Backing-State

Heute hat `WorldEntity` bereits **alles**, was die Identitätsschicht braucht, inkl. der
Feeder-Brücke: `source_entry_id`, `external_id`, `content_hash`, `last_synced_at`,
`backing_ref` (`world_memory.py:159-167`). Die Integration-`Entity` ist im Kern nur **Live-
State** (`state`, `attributes`, `availability`, `state_changed_at`, …, `entity.py:39-90`).

**Entscheidung:** `world_entities` wird die **eine** Identitätsschicht (Node = Identität +
`scope_ref` + Lifecycle). `entities` wird zur **optionalen Backing-State-Projektion**, die
über `backing_ref` / `source_entry_id+external_id` an einen Node hängt. Wir **mergen nicht
physisch** in eine Tabelle, sondern etablieren die klare Schichtung:

```
WorldEntity (Identität, scope_ref, kind, canonical_name, status, Lifecycle)
   │
   ├─ 1:0..1  Entity            (Live-State: state/attributes/availability — nullable!)
   ├─ 1:n     Fact              (bitemporal Wissen, überlebt die Integration)
   ├─ 1:n     EntityAlias       (zeit-valide Identität)
   └─ 1:n     observed_state-Fact (§2.4 — bitemporale History des Live-State)
```

Begründung gegen physischen Tabellen-Merge: `entities` trägt ~15 HA-spezifische
State-Spalten (`availability`, `category`, `hidden`, `disabled`, `area_id`, `device_id`,
`parent_id`, `state_changed_at`/`state_updated_at`, `entity.py:60-90`), die für graph-native
Nodes (Person, Präferenz, Ziel) bedeutungslos sind. Eine fusionierte Tabelle wäre zu ~50%
NULL. Die Schichtung hält die heiße ANN-/Graph-Abfrage schmal und respektiert, dass die
Integration-State-Projektion **wegfallen darf** (Lifecycle, §2.3).

### 2.2 Typ-/Kind-Registry-Konvergenz: `entity_types` → `entity_kinds`

Heute existieren zwei Registries:

- `EntityType` (`entity.py:93-116`): pro `(domain, entity_type)`, mit HA-Semantik
  (`device_class`, `state_class`, `unit`, `category`) **und** schon einem Brückenfeld
  `world_kind` (`entity.py:114-116`) — „auf welchen Graph-Kind mappt dieser Live-Typ".
- `EntityKind` (`world_memory.py:54-79`): die globale Graph-Vokabular-Registry, Core-seeded
  (`world_memory_01.py:77-100`).

**Entscheidung:** `entity_kinds` wird die **eine** Kind-Registry. Die HA-State-Semantik
(`device_class`/`state_class`/`unit`) wandert in einen optionalen `state_schema`-Block auf
`entity_kinds` (oder bleibt als per-`(domain,external)` Projektion erhalten — Offene
Entscheidung 4). Das `world_kind`-Mapping (`entity.py:116`) wird damit **identisch** zum
Node-`kind`: eine Integration deklariert direkt einen `entity_kinds.key`, kein indirektes
Mapping mehr. `EventType` (`entity.py:143-158`) und `WorldEventType` (`world_memory.py:113-132`)
konvergieren analog zu **einer** `world_event_types` (der Kommentar dort, `world_memory.py:116`,
nennt die Kollision bereits explizit).

### 2.3 Lifecycle: Integration weg → State null, Identität + Facts bleiben

Das Verhalten ist **heute schon korrekt** im Feeder implementiert und wird beibehalten:
Löscht eine Integration eine Entity, **archiviert** der Feeder den Node
(`node.status = "archived"`, `entities/service.py:328-329`), **löscht** ihn aber nie — Facts
hängen am Node und überleben (Doc-Kommentar `entities/service.py:261-262`). Im Zielbild:

- Integration löscht / wird entfernt → die `entities`-Backing-Zeile (Live-State) wird
  gelöscht oder auf `availability='unavailable'` gesetzt; `WorldEntity.status='archived'`,
  `backing_ref`/`source_entry_id` → NULL.
- Identität (`WorldEntity`) + alle `Fact`s + `EntityAlias`es bleiben unter ihrem `scope_ref`.
- Re-Delivery durch die Integration reaktiviert den Node (`status='active'`,
  `entities/service.py:316-317`).

### 2.4 `observed_state`-Facts: bitemporale History des Live-State

Heute lebt die State-History in `entity_state_history` (append-only, eigene Tabelle,
`entity.py:119-140`) — getrennt vom bitemporalen Fact-Modell. Das ist eine **zweite**
History-Mechanik neben `facts` (die `valid_from`/`valid_to`/`recorded_at`/`observed_at`
schon trägt, `world_memory.py:204-211`).

**Entscheidung:** Der deterministische Sync schreibt State-Änderungen als
`observed_state`-Facts in `facts` — ein **eigener Schreibpfad mit eigenem Idempotenz-Key**,
der den Curator (§4) bewusst **umgeht**:

- Prädikat `observed_state` (neuer Core-`relation_type`, analog `world_memory_01.py:104`),
  `object_kind='literal'`, `object_value = {state, attributes}`.
- `source = '<domain>'`, `source_trust_tier` aus der Integration, `valid_from = state_changed_at`,
  `observed_at = last_synced_at` (`entity.py:60-65` liefern die Zeitachsen 1:1).
- **Idempotenz**: nicht über `(run_id, op_index)` (das ist der Curator-Pfad,
  `world_memory_01.py:488-490`), sondern ein neuer partieller Unique-Index
  `UNIQUE(subject_entity_id, predicate, content_hash) WHERE predicate='observed_state'`
  — `content_hash` ist exakt der schon vorhandene Sync-Diff-Hash (`entity.py:45`). Ein
  unveränderter Sync schreibt **keinen** neuen Fact (deterministisch, kein Churn).
- Die bisherige `entity_state_history` kann damit entfallen (oder als reine Recorder-Tabelle
  für hochfrequente Sensoren bleiben — Offene Entscheidung 3, Anti-Flooding).

Damit ist `facts` die **eine** bitemporale History — für kuratiertes Wissen **und** für
deterministisch beobachteten Live-State, sauber getrennt über `source_trust_tier` + Prädikat.

### 2.5 RAG-Dedup: eine Indexfläche statt `entity_chunks` + `memory_projections`

Heute existieren **zwei** Vektorflächen:

- `entity_chunks` (`embeddings.py:93-112`): RAG-Chunks der Integration-Entities, eigene RLS
  (org-fail-open, `d0e1f2a3b4c5_entities_rag.py:162-166`), HNSW.
- `memory_projections` (`world_memory.py:339-363`): RAG-Derivate/Rollups des Graphen,
  owner-fail-closed RLS, eigener HNSW (`world_memory_01.py:569-572`).

Beide tragen `(owner_sub, org_id)`, beide haben einen HNSW-`halfvec_cosine_ops`-Index, beide
indizieren letztlich Entities. **Entscheidung:** Konvergenz auf **eine** Projektion
`memory_projections` mit `source_kind ∈ {entity, fact, event, projection, …}`
(`world_memory.py:352` hat `source_kind` bereits) + `scope_ref`. Die Integration-RAG wird zu
einer Projektion mit `source_kind='entity'`, `source_id=<world_entity_id>`,
`entity_ids=[node]` (`world_memory.py:353,356`). Ein Recall-Query, eine RLS-Policy, ein HNSW.
`entity_chunks` entfällt; der `EntityIndexer` schreibt in `memory_projections`.

### 2.6 Zieltabellen — Überblick

| Tabelle | Rolle | scope_ref | Schicksal |
|---|---|---|---|
| `world_entities` | **Identitätsschicht** (Node) | ✅ neu | bleibt, wird zentral |
| `entities` | Live-State-Projektion (optional, nullable) | ✅ neu | bleibt, an Node gehängt |
| `facts` | bitemporales Wissen **+ observed_state** | ✅ neu | bleibt, erweitert (§2.4) |
| `entity_aliases` | zeit-valide Identität | ✅ neu | bleibt |
| `memory_projections` | **eine** RAG-Fläche | ✅ neu | bleibt, absorbiert entity_chunks |
| `entity_chunks` | — | — | **entfällt** (→ memory_projections) |
| `entity_state_history` | — | (optional) | **entfällt** (→ observed_state-Facts) |
| `entity_kinds` | **eine** Kind-Registry | n/a (global) | bleibt, absorbiert entity_types |
| `entity_types` | — | n/a | **entfällt** (→ entity_kinds) |
| `world_event_types` | **eine** Event-Registry | n/a | bleibt, absorbiert event_types |
| `event_types` | — | n/a | **entfällt** (→ world_event_types) |
| `world_events`, `curator_state`, `memory_suppressions` | wie heute | ✅ neu | scope_ref ergänzt |

---

## 3. Migration & Phasen

Reihenfolge: **erst Scope-Generalisierung, dann Entity-Merge.** Der Scope-Umbau ist die
risikoreiche, alle Tabellen berührende Änderung; der Entity-Merge ist additiv obendrauf.

### Phase 0 — `scope_ref` additiv, dual-write (hot-deploybar)

1. Migration: `scope_ref TEXT NULL` auf alle 11 Scope-Tabellen (§2.6). Index
   `ix_<t>_scope_ref`. **Noch keine** RLS-Änderung.
2. Backfill in derselben Migration (UPDATE, reversibel):
   - Integration-`Entity`/`entity_chunks`: `owner_sub` gesetzt → `scope_ref='user:'||owner_sub`.
     `owner_sub IS NULL` (org/global Entries) → siehe Offene Entscheidung 1; Default-Vorschlag
     `scope_ref='org:'||org_id` mit einer org-Sonderpolicy.
   - World-Memory-Tabellen: `owner_sub` ist NOT NULL → `scope_ref='user:'||owner_sub` immer.
3. App: `set_scope_context()`/`write_scope` werden gesetzt **zusätzlich** zu den alten GUCs
   (`auth/deps.py:69-71` erweitern, nicht ersetzen). Writer schreiben `scope_ref` **und**
   `owner_sub`/`org_id` (dual-write). Reads laufen noch über die alten Policies.

→ Vollständig reversibel (Spalten droppen), kein Verhaltensbruch, hot-deploybar.

### Phase 1 — RLS auf `scope_ref` umstellen (der harte Schnitt)

1. `scope_ref NOT NULL` setzen (Backfill ist durch).
2. Pro Tabelle: alte Policy droppen (`tenant_isolation` bzw. `owner_isolation`), neue
   `scope_isolation` (§1.4) anlegen. **Eine** Migration, reversibel (alte Policies
   wiederherstellbar).
3. **Alle internen Schreib-/Lesepfade** auf `set_scope_context`+`write_scope` umstellen.
   Kritische Stellen, die heute `set_owner_context` rufen und mitgezogen werden müssen:
   `world_memory_toolset.py:188`, `entities/service.py:290`, der Curator
   (`curator/committer.py`, nutzt schon `op.scope_ref`-Pattern, `committer.py:467` — die
   Spalte heißt dort schon so!), die Worker-Sessions (curator/sync/reconciler).
4. App-Handfilter entfernen: `entity_repo._scope()` (`entity_repo.py:26-28`),
   `folder_repo`-Widening für migrierte Tabellen (`folder_repo.py:68-70,81-83`).

→ **Nicht** hot-deploybar im Sinne von „risikolos": fail-open→fail-closed-Schnitt. Vorher
ein Audit-Script (analog `tests/test_rls.py:30-68`), das mit unsetztem GUC 0 Zeilen prüft,
und mit gesetzten Scopes die erwartete Sichtbarkeit. Empfehlung: ein Deploy-Fenster + die
alten GUCs eine Release lang weiter setzen (toter Code, aber Roll-Back-Sicherheit).

### Phase 2 — Group-Integrationen aktivieren (Feature-Schalter)

`IntegrationConfig.scope_ref` akzeptiert `group:<id>`; `allowed_scopes` um `"group"`
erweitert; Config-Flow-UI lässt Group wählen (nur Groups, in denen der User Mitglied ist).
Sync propagiert `group:<id>` → Entities **und** Feeder-Nodes/Facts sind sofort team-shared.

### Phase 3 — Entity-Merge (additiv, pro Subsystem)

1. `entity_kinds` absorbiert `entity_types` (Datenmigration der HA-Semantik), `world_kind`-
   Indirektion entfernen.
2. `observed_state`-Fact-Pfad im Sync (§2.4); `entity_state_history` deprecaten.
3. `memory_projections` absorbiert `entity_chunks` (§2.5); Indexer umlenken.
4. `entities` wird offiziell Backing-Projektion von `world_entities` (FK/`backing_ref`
   konsolidieren).

Jeder Schritt einzeln deploybar; kein Schritt fasst die Scope-RLS erneut an.

### Daten-Migration org-shared → ?

Das ist die einzige **semantische** Entscheidung im Backfill (Offene Entscheidung 1).
Heutige org-shared Integration-Entities (`org_id` gesetzt, `owner_sub` NULL,
`d0e1f2a3b4c5_entities_rag.py:30-34` macht sie org-weit sichtbar) haben **kein**
User/Group-Äquivalent. Drei Optionen in §5.1.

---

## 4. Risiken & Frozen-Contract-Impact

- **Decision #19 (world-memory owner-private fail-closed):** bleibt — nur **generalisiert**.
  Das fail-closed-Default-deny-Verhalten (`world_memory_01.py:31-34`) wird zur Default-
  Semantik **aller** Scope-Tabellen. „owner-private" ist künftig `scope_ref='user:<sub>'`;
  Group-Sharing ist eine **bewusste, explizite** Lockerung (`scope_ref='group:<id>'`), nie
  implizit. Der Name „Decision #19" bleibt, jetzt multi-prinzipal.
- **Contract #11 (Org-Tenancy):** unangetastet. `current_org`-GUC + `org_id`-Prädikat bleiben
  die äußere Grenze (§1.4). `X-Personal-Agent-Org`-Validierung (`auth/deps.py:42-44`) bleibt.
- **Contracts #13/#14 (untrusted-content / Daten-Klassifikation, fail-closed):** orthogonal,
  unberührt. RLS regelt **nur** Zugriff (welche Zeilen); die Klassifikations-Gate
  (`enforce_classification`) und die untrusted-Tool-Drops bleiben **pro Endpoint/Run**. Die
  per-Zeile-Klassifikation (`source_trust_tier` auf `facts`/`world_events`,
  `world_memory.py:214,270`) bleibt eine **eigene** Spalte — geteilt-mit-Group ändert die
  Trust-Tier einer Zeile **nicht**. Wichtig: Group-Sharing darf eine untrusted-getaggte Zeile
  nicht zu einem Provider durchlassen, der dafür nicht freigegeben ist — das bleibt Sache der
  Klassifikations-Gate, nicht der RLS.
- **Curator-Governance — `observed_state` umgeht den Curator bewusst:** Der Curator
  *proposed* Wissen aus Konversation (Modell-getrieben, `world_memory.py:366-378`).
  `observed_state`-Facts sind **deterministisch** vom Sync — sie dürfen den Curator **nicht**
  durchlaufen (kein Vorschlag/Approval), sonst entsteht LLM-Last + Nag pro Sensor-Tick. Eigener
  Idempotenz-Key (§2.4, `content_hash` statt `run_id,op_index`) hält die zwei Schreibpfade
  sauber getrennt — das ist eine **gewollte** Governance-Umgehung, dokumentiert hier.
- **Churn / Flooding:** Live-State-Integrationen (Sensoren) können hochfrequent sein. Der
  `content_hash`-Idempotenz-Index (§2.4) unterdrückt unveränderte Ticks. Für echt
  hochfrequente Sensoren bleibt `entity_state_history` als Roh-Recorder erhaltenswert
  (Offene Entscheidung 3) — `facts` ist für **semantische** Zustände, nicht für 1-Hz-Telemetrie.
- **Blast-Radius fail-open → fail-closed:** das größte Risiko. Jeder heute auf
  org-fail-open-`entities` verlassende Pfad, der den Scope-GUC nicht setzt, sieht nach Phase 1
  **nichts**. Audit-Script vor dem Schnitt; alte GUCs eine Release lang weiter setzen
  (Roll-Back-Sicherheit); `tests/test_rls.py` um Scope-Fälle erweitern.
- **Performance:** `scope_ref = ANY(string_to_array(...))` ist ein Array-Membership-Check pro
  Zeile. Mit `ix_<t>_scope_ref` und typisch < ~50 Groups pro User unkritisch; bei sehr großen
  Group-Mengen ggf. ein `= ANY`-tauglicher Index-Plan prüfen (GIN auf scope_ref ist nicht
  nötig, da scope_ref skalar ist und die *Liste* aus dem GUC kommt).

---

## 5. Entscheidungen (Stand 2026-06-16)

### 5.1 org-shared / global → **ENTSCHIEDEN: `org:<id>` als dritter Prinzipal-Typ**
Drei Prinzipal-Typen: `scope_ref ∈ {user:<sub> | group:<id> | org:<id>}`. `org:<my-active-org>`
liegt immer mit in `current_scopes` (RLS-Sonderarm), Contract #11 (Org als äußere Grenze)
bleibt natürlich AND-verknüpft. Kleinster Bruch, kein Zwang, dass jeder User Mitglied einer
„Alle"-Group ist. (Verworfen: implizite Org-Group; org-shared abschaffen.)

### 5.2 Tabellen-Merge → **ENTSCHIEDEN (Empfehlung bestätigt): Schichtung DAUERHAFT**
Zwei Tabellen bleiben der Endzustand, KEIN späterer physischer Ein-Tabellen-Merge:
`world_entities` = Identitätsschicht (Knoten + `backing_ref` + Facts), `entities` = optionale
Live-State-Projektion daran. Begründung: `entities` ist zu ~50 % HA-spezifisch (`state`,
`availability`, `category`, `hidden/disabled`, `state_changed_at`, die `content_hash`-Diff-Sync-
Maschinerie) — gehört nicht in den Wissens-Knoten; andere Schreibmuster/Retention/Lifecycle. Die
Vereinheitlichung ist *konzeptionell* (ein „Ding" über Link + gemeinsame Lese-/UI-/Such-Fläche),
nicht physisch. „Eine Entity" für Nutzer/Agent/UI, zwei Tabellen darunter.

### 5.3 `entity_state_history` → **ENTSCHIEDEN (Empfehlung bestätigt): BEHALTEN**
Bleibt der schnelle Roh-Recorder für die heißen operativen Muster — Dauer-Conditions
(„war X für Y") + Charts — und entkoppelt Automations/Charts vom World-Graph (Feeder ist
opt-in/best-effort). `observed_state`-Facts sind eine *Projektion* für das Agenten-WISSEN
(As-Of-Recall „was wusste ich am Datum X", nur für graph-gefeedete Entities). Andere Granularität,
Retention und Konsumenten — keine echte Duplikation. Anti-Flooding: Facts nur bei semantischen
Zustandswechseln, nicht 1-Hz-Telemetrie.

### 5.4 Schreibrecht in eine Group → **ENTSCHIEDEN: rollenbasiert**
`group_memberships` bekommt ein `role`-Feld (z. B. `owner | editor | viewer`); nur
`editor`/`owner` dürfen mit `write_scope=group:<id>` schreiben, `viewer` liest nur. Das `role`-
Feld + die Rollenprüfung beim Setzen von `write_scope` sind Teil von Phase 2 (nicht erst später
additiv). Mitgliedschaft ist heute rollenlos (`group.py:42-52`) → additive Spalte + Default
`editor` für bestehende Mitglieder bei der Migration.
