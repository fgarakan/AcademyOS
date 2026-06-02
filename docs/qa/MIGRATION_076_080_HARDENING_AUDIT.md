# Migration 076–080 Idempotency Hardening Audit

**Date:** 2026-06-02
**Scope:** migrations 076–080 (player_mission_assignments, friction_reports, player_development_blueprints, assessment_events, donna_placement_recommendations)

---

## Summary

| Migration | Triggers patched | Policies patched | Indexes | Views | Functions |
|---|---|---|---|---|---|
| 076 | 1 | 8 | already safe | none | none |
| 077 | 1 | 4 | already safe | none | none |
| 078 | 1 | 5 | already safe | none | none |
| 079 | 1 | 5 | already safe | none | none |
| 080 | 1 (prior patch) | 3 (prior patch) | already safe | none | none |

---

## 076 — player_mission_assignments

### Trigger (1 patched)
| Object | Before | After |
|---|---|---|
| `tr_player_mission_assignments_updated_at` | `CREATE TRIGGER` | `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER` |

### Policies (8 patched)
| Policy | Before | After |
|---|---|---|
| "Directors see all mission assignments" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Coaches see active missions" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Players see own active missions" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Directors insert mission assignments" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Coaches insert mission drafts" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Directors update mission assignments" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Coaches update own drafts and complete active" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Directors delete mission assignments" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |

### Indexes (4 — already safe)
All used `CREATE INDEX IF NOT EXISTS`. No change needed.

---

## 077 — friction_reports

### Trigger (1 patched)
| Object | Before | After |
|---|---|---|
| `tr_friction_reports_updated_at` | `CREATE TRIGGER` | `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER` |

### Policies (4 patched)
| Policy | Before | After |
|---|---|---|
| "Staff insert own friction reports" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Directors see all friction reports" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Users see own friction reports" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Directors manage friction reports" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |

### Indexes (4 — already safe)
All used `CREATE INDEX IF NOT EXISTS`. No change needed.

---

## 078 — player_development_blueprints

### Trigger (1 patched)
| Object | Before | After |
|---|---|---|
| `tr_player_development_blueprints_updated_at` | `CREATE TRIGGER` | `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER` |

### Policies (5 patched)
| Policy | Before | After |
|---|---|---|
| "Directors see all blueprints" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Coaches see active blueprints" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Players see own active blueprint" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Directors create blueprints" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Directors update blueprints" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |

### Indexes (3 — already safe)
All used `CREATE INDEX IF NOT EXISTS`. No change needed.

---

## 079 — assessment_events

### Trigger (1 patched)
| Object | Before | After |
|---|---|---|
| `tr_assessment_events_updated_at` | `CREATE TRIGGER` | `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER` |

### Policies (5 patched)
| Policy | Before | After |
|---|---|---|
| "Directors see all assessment events" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Coaches see own assessment events" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Directors create assessment events" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Directors update assessment events" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| "Coaches update own assessment events" | `CREATE POLICY` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |

### Indexes (3 — already safe)
All used `CREATE INDEX IF NOT EXISTS`. No change needed.

---

## 080 — donna_placement_recommendations

Patched in two prior commits (trigger: `9696607`, policies: `b3c7290`).

### Trigger (1 — already patched)
| Object | Status |
|---|---|
| `tr_donna_placement_recommendations_updated_at` | `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER` ✅ |

### Policies (3 — already patched)
| Policy | Status |
|---|---|
| "Directors see all DONNA placement recommendations" | `DROP POLICY IF EXISTS` + `CREATE POLICY` ✅ |
| "Directors create DONNA placement recommendations" | `DROP POLICY IF EXISTS` + `CREATE POLICY` ✅ |
| "Directors update DONNA placement recommendations" | `DROP POLICY IF EXISTS` + `CREATE POLICY` ✅ |

### Indexes (3 — already safe)
All used `CREATE INDEX IF NOT EXISTS`. No change needed.

---

## Objects not present in 076–080

| Object type | Present | Notes |
|---|---|---|
| `CREATE VIEW` | No | None in any of these migrations |
| `CREATE FUNCTION` | No | None in any of these migrations |
| `CREATE UNIQUE INDEX` | No | No unique indexes in these migrations |

---

## Remaining risks

- `CREATE TABLE IF NOT EXISTS` — all 5 migrations already use this. Safe to rerun. ✅
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` — idempotent in Postgres (enabling already-enabled RLS is a no-op). ✅
- `COMMENT ON TABLE / COLUMN` — idempotent in Postgres (overwrites previous comment). ✅
- **Table constraints** (`CHECK`, `REFERENCES`, `DEFAULT`) — these are inline in `CREATE TABLE IF NOT EXISTS` and will not be re-applied on rerun because the table already exists. Safe. ✅
- **No destructive operations** — no data is deleted or modified by any of these migrations on rerun.
