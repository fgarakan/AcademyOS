# Assessment Engine Readiness Audit — Sprint 752

**Sprint:** 752
**Date:** 2026-05-17

---

## Purpose

Assess whether the assessment and gate evidence system is ready for pilot use.

---

## Assessment System Audit

### What exists

| Component | Status | Location |
|---|---|---|
| `curriculum_gates` table | Live (schema) | Database |
| `player_gate_status` table | Partially applied (Sprint 104) | `player_gate_status` exists; repair migrations pending |
| Gate evidence server action | ✅ Built | `recordGateEvidenceAction` |
| Gate evidence UI | ✅ Built | Skill Path tab → Gates section |
| Director gate confirmation | Deferred | Sprint 107 — explicit confirm action not yet built |
| Evidence threshold evaluation | Deferred | Gate threshold is free-text; auto-evaluation not built |

### Gate evidence flow (as-built)

1. Coach observes player meeting a gate requirement
2. Coach records observation via "Record Gate Evidence" in player profile
3. `recordGateEvidenceAction` writes to `player_gate_status` and `audit_logs`
4. Gate evidence count increments
5. Director sees updated evidence count in Skill Path tab
6. Director manually confirms gate passage (in progress — confirmation UI not yet built)
7. Director assigns next level via level picker (separate action)

### Data quality at pilot start

- `player_gate_status` table created but repair migrations (041–044, 060) not yet applied to live DB
- Until applied, gate evidence submissions return a DB error at runtime
- Evidence count shows 0 for all players until repair migrations applied
- Fix: Apply migrations 041, 042, 043, 044, 060 to live Supabase in order (see KNOWN_LIMITATIONS.md)

---

## Assessment Readiness by Phase

| Phase | Readiness | Blocking issue |
|---|---|---|
| Director views gate requirements | ✅ Ready | None — curriculum gates loaded from schema |
| Coach records gate evidence | ⚠️ Blocked | Repair migrations not applied |
| Director sees evidence count | ⚠️ Blocked | Repair migrations not applied |
| Director confirms gate passage | ❌ Not built | Sprint 107+ work |
| Automatic threshold evaluation | ❌ Not built | Free-text threshold parsing deferred |

---

## Recommendation

**Before pilot:** Apply repair migrations 041–044 and 060 to live Supabase.
- Cost: 10 minutes of SQL Editor work
- Risk: Low — idempotent scripts, no data loss
- Impact: Unlocks gate evidence recording for coaches and directors

**After pilot starts:** Build Sprint 107 director gate confirmation UI so directors can explicitly confirm gate passage.

---

## Verdict

**Assessment engine: PARTIALLY READY.**

Gate requirement viewing is working. Gate evidence recording is built but blocked by pending DB repair migrations. Gate confirmation is a future sprint. Director can manually track advancement via notes and level picker until the full assessment system is wired.

This is an acceptable pilot start state — the director can still use the system effectively for player development without automated gate confirmation.
