# Gate Evidence Foundation

**Sprint:** 103
**Migration:** `supabase/migrations/059_player_gate_status.sql`
**Status:** Schema created. Server actions wired in Sprint 104. UI wired in Sprint 105.

---

## What this sprint built

Two schema changes that create the bridge between curriculum gate definitions and per-player evidence tracking:

1. **`player_gate_status` table** — one row per (player, gate), tracking how much evidence has been collected and whether the gate has been confirmed met.
2. **`requirement_evidence_links.gate_id` column** — nullable FK that allows existing evidence rows to be tagged with the curriculum gate they support.

---

## player_gate_status

### Purpose

`curriculum_gates` defines the criteria a player must meet to advance from one level to the next. Before this sprint, there was no way to track whether a specific player had met a specific gate — evidence went into `proposed_actions` as a stopgap.

`player_gate_status` gives each player a row per gate. Coaches record evidence against these rows. Directors confirm gates met. The readiness picture for advancement is then derived from how many gates are confirmed.

### Key fields

| Field | Purpose |
|---|---|
| `gate_id` | FK to `curriculum_gates` — the specific gate this row tracks |
| `gate_criterion_snapshot` | The criterion text copied from `curriculum_gates.criterion` at row creation time |
| `status` | Current gate state for this player |
| `evidence_count` | How many evidence pieces have been linked to this gate |
| `confirmed_by` / `confirmed_at` | Who confirmed this gate met and when |
| `waived_by` / `waived_at` / `waiver_reason` | If a director explicitly waived this gate |
| `is_player_visible` / `is_parent_visible` | Visibility flags — both default false in V1 |

### Status lifecycle

```
not_started
    ↓ (coach submits first evidence — Sprint 104)
observing
    ↓ (evidence_count reaches gate threshold — Sprint 104)
evidence_threshold_met
    ↓ (director/head confirms — Sprint 107)
confirmed
```

Director can also move any gate to `waived` (skip) or `blocked` (cannot progress) at any time.

**No automatic status transitions happen in the database.** All transitions are server-action controlled (Sprint 104+).

---

## gate_criterion_snapshot — why it exists

`curriculum_gates.criterion` is global platform data. It can be updated. Academies can also override it via `academy_curriculum_overrides`.

If a gate criterion changes after a player has collected evidence, we must not retroactively change what criterion that evidence was collected against. The `gate_criterion_snapshot` field freezes the criterion text at the time the `player_gate_status` row is created (either at bootstrap or when the player first moves to a level).

Historical gate status rows always reflect what was true when evidence was collected.

---

## requirement_evidence_links.gate_id

### Purpose

`requirement_evidence_links` already tracks per-requirement evidence (coach observations, assessments, attendance, etc.). The new `gate_id` column allows the same evidence row to also be tagged with the specific curriculum gate it supports.

### Current limitation (Sprint 104 decision point)

`requirement_evidence_links.requirement_id` is `NOT NULL` (migration 041). This means every evidence row must have a track requirement reference. For evidence that is gate-specific but has no matching track requirement, Sprint 104 must decide the storage path before rewriting `recordGateEvidenceAction`. Options documented in Sprint 104 planning.

In the meantime, `gate_id` is available on the table and will be populated when a gate-linked evidence row also has a matching `requirement_id`.

---

## Bootstrap

Migration 059 seeds `player_gate_status` rows (status = `not_started`) for all existing active players. The bootstrap logic:

- Reads `player_curriculum_states.current_level_id` for each player
- Finds all active `curriculum_gates` where `from_level_id = current_level_id`
- Inserts one `player_gate_status` row per (player, gate)
- `gate_criterion_snapshot` is captured from `curriculum_gates.criterion` at bootstrap time
- `ON CONFLICT (player_id, gate_id) DO NOTHING` — safe to re-run

If a player has no `player_curriculum_states` row, no bootstrap rows are created for them.

When a player advances to a new level (future Sprint 108+), the system must bootstrap new `player_gate_status` rows for the gates of the new level at that time.

---

## RLS

`player_gate_status` follows the same pattern as `player_requirement_progress` (migration 041):

- `"Staff see player gate status"` — SELECT for any staff member in the same academy
- `"Staff manage player gate status"` — ALL (select, insert, update, delete) for staff in the same academy

Directors and head coaches are a subset of `auth_is_staff()` and receive full access through the manage policy.

Player and parent access is deferred to Sprint 111+. Both `is_player_visible` and `is_parent_visible` default to `false`.

---

## Safety guarantees

- No automatic level movement — `player_gate_status` reaching `confirmed` only changes the evidence record; advancement still requires an explicit director action
- No parent or player exposure — `is_player_visible` and `is_parent_visible` are both `false` at bootstrap; neither the player portal nor the parent portal reads this table in V1
- No AI decision-making — gate status transitions are all human-initiated
- No global curriculum mutation — this migration adds player-scoped rows only; `curriculum_gates` is read, never written
- Academy isolation — all rows carry `academy_id` with RLS scoped to `auth_academy_id()`

---

## Type generation

After applying this migration to the live Supabase database, run:

```bash
supabase gen types typescript --project-id <project-id> > src/lib/supabase/database.types.ts
```

Or via the Supabase CLI if configured:

```bash
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

Do not edit `database.types.ts` manually.

---

## Next sprints

| Sprint | What it adds |
|---|---|
| **104** | Server actions: `recordGateEvidenceAction` rewritten to write to `player_gate_status` + resolve the `requirement_id NOT NULL` constraint for gate-only evidence |
| **105** | Player profile UI: gate list shows status, evidence count, evidence submission inline |
| **106** | `v_player_gate_readiness` view: gates confirmed / required / total per player |
| **107** | Director gate confirmation flow: confirm or waive per gate, audit log |
| **108** | Gate-informed level advancement RPC |
| **111** | Player-safe gate summary (is_player_visible flag) |
