# DONNA Signal Wiring Report V1

**Mega Sprint 2021–2050 — June 2026**
**Source of truth: docs/audits/DONNA_REALITY_AUDIT_V1.md**

This document inventories every hardcoded, placeholder, or muted signal in the Operating Partner data pipeline and maps each to its real source.

---

## Legend

| Status | Meaning |
|---|---|
| WIRED | Now connected to real data |
| HONEST_ABSENCE | Correctly marked as unavailable — data does not exist |
| DEFERRED | Data exists but requires new infrastructure (future sprint) |

---

## Curriculum Signals

| Signal | Old value | New value | Source | Status |
|---|---|---|---|---|
| `curriculum.emptyLevelCount` | `0` (hardcoded) | Count of levels with 0 gates and 0 linked templates | `curriculum_levels` + `curriculum_gates` + `templates` | WIRED |
| `curriculum.weakLevelCount` | `0` (hardcoded) | Count of levels with 1–2 gates total | `curriculum_levels` + `curriculum_gates` | WIRED |
| `curriculum.missingGateCount` | `0` (hardcoded) | Count of levels with 0 gates defined | `curriculum_levels` + `curriculum_gates` | WIRED |
| `curriculum.playerBackedBottleneckCount` | `0` (hardcoded) | Count of pending curriculum_gap suggestions | `academy_suggestions` (already computed as `curriculumGapCount`) | WIRED |
| `curriculum.hasCurriculumData` | Based on `playersWithLevel + classTemplateCount` | True when curriculum_levels exist and level queries succeed | `curriculum_levels` query result | WIRED |
| `curriculum.hasGateData` | `false` (hardcoded) | True when gate query succeeds | `curriculum_gates` query result | WIRED |
| `curriculum.hasPlayerEvidenceData` | `false` (hardcoded) | False — evidence tracking not implemented | N/A — no evidence records table in use | HONEST_ABSENCE |
| `curriculum.missingAssessmentCount` | `0` (hardcoded) | 0 — assessment criteria not tracked at level | No assessment_criteria table in use | HONEST_ABSENCE |

---

## Coach Signals

| Signal | Old value | New value | Source | Status |
|---|---|---|---|---|
| `coaches.totalCoachCount` | `0` (hardcoded) | Count of active coach/head_coach memberships | `academy_memberships` (role IN ['coach', 'head_coach'], is_active=true) | WIRED |
| `coaches.missingWrapUpCoachCount` | `0` (hardcoded) | Distinct coach_ids from sessions without voice notes | `sessions.coach_id` cross-referenced with `voice_notes` | WIRED |
| `coaches.stagnantPlayerByCoachCount` | `0` (hardcoded) | Distinct coaches with ≥2 stalled players | `player_curriculum_states` stalled list × `v_player_summary.coach_id` | WIRED |
| `coaches.inconsistentExecutionCount` | `0` (hardcoded) | 0 — execution quality not tracked | No execution deviation tracking | HONEST_ABSENCE |
| `coaches.hasExecutionData` | `false` (hardcoded) | False — execution quality has no data source | N/A | HONEST_ABSENCE |
| `coaches.dataAvailable` | Based on completedSessionIds count | Based on totalCoachCount > 0 (more reliable) | `academy_memberships` | WIRED |

---

## Player Signals

| Signal | Old value | New value | Source | Status |
|---|---|---|---|---|
| `players.attendanceRiskCount` | `attentionCount` (status proxy) | `0` — attendance tracking not implemented | No attendance rate table | HONEST_ABSENCE |
| `players.hasAttendanceData` | `false` (already correct) | `false` | N/A | HONEST_ABSENCE |
| `players.readinessBlockerCount` | `0` (hardcoded) | `0` — evidence records not tracked | No evidence records table | HONEST_ABSENCE |
| `players.stallCount` | Players enrolled ≥180 days + not advancement_eligible | Same — correct proxy | `player_curriculum_states.enrolled_at` | VERIFIED_CORRECT |
| `players.advancementEligibleCount` | From `player_curriculum_states.advancement_eligible` | Same — correct | `player_curriculum_states` | VERIFIED_CORRECT |
| `players.assessmentDueCount` | From `getReassessmentPipeline` | Same — correct | `reassessment_pipeline` or derived | VERIFIED_CORRECT |
| `players.playersWithoutLevel` | `activePlayers - playersWithLevel` | Same — correct | Derived | VERIFIED_CORRECT |
| `players.playersWithoutCoach` | `unassignedPlayerCount` from players.is_null(primary_coach_id) | Same — correct | `players` table | VERIFIED_CORRECT |

---

## Parent Signals

| Signal | Old value | New value | Source | Status |
|---|---|---|---|---|
| `parents.communicationGapCount` | `parentUpdatesPendingApproval` (pending proposed_actions) | Same — but semantic is correct: "parent communications awaiting director approval" | `proposed_actions` (target_module=parent_communication) | VERIFIED_CORRECT (semantic clarified) |
| `parents.updateOverdueCount` | `parentUpdatesPendingApproval` (same as gap — double) | Same — these measure the same thing; gap = overdue = pending approvals | `proposed_actions` | VERIFIED_CORRECT (acknowledged conflation) |
| `parents.retentionRiskCount` | `0` (hardcoded) | `0` — retention tracking not implemented | No engagement signal data | HONEST_ABSENCE |
| `parents.engagementRiskCount` | `0` (hardcoded) | `0` — engagement not tracked | No engagement data | HONEST_ABSENCE |
| `parents.hasRetentionData` | `false` (already correct) | `false` | N/A | HONEST_ABSENCE |
| `parents.hasEngagementData` | `false` (already correct) | `false` | N/A | HONEST_ABSENCE |

---

## Business Signals

| Signal | Old value | New value | Source | Status |
|---|---|---|---|---|
| `business.enrollmentTrendSignal` | `'stable'` (hardcoded) | Derived from player growth (new players in last 30d vs prior 30d) | `player_curriculum_states.enrolled_at` | WIRED |
| `business.capacityIssueCount` | `overCapacityGroupCount` | Same — correct | `v_group_summary` | VERIFIED_CORRECT |
| `business.churnRiskSignal` | `stalledPlayerCount > 3 ? 'medium' : 'low'` | Same — acceptable proxy | Derived | VERIFIED_CORRECT |

---

## System Signals

| Signal | Old value | New value | Source | Status |
|---|---|---|---|---|
| `system.pendingApprovalCount` | `totalPendingReviews` (all pending proposed_actions) | Same — correct | `proposed_actions` | VERIFIED_CORRECT |
| `system.oldestPendingAgeDays` | From oldest `proposed_actions.created_at` | Same — correct | `proposed_actions` | VERIFIED_CORRECT |
| `system.unreadAlertCount` | `0` (hardcoded) | `0` — no alert system implemented | N/A | HONEST_ABSENCE |

---

## Philosophy Signals

| Signal | Old value | New value | Source | Status |
|---|---|---|---|---|
| All philosophy inputs | `buildDefaultPhilosophyInputs` (all provisional, drift=false) | Same — keeping defaults | Academy DNA mapping is a separate sprint | DEFERRED |

---

## Net Signal Impact After Wiring

**Signals that can now fire (were always 0, now real):**
1. `curriculum-empty-levels` — fires when levels have no gates and no templates
2. `curriculum-weak-levels` — fires when levels have < 3 gates
3. `curriculum-missing-gates` — fires when levels have 0 gates defined
4. `curriculum-player-backed-bottleneck` — fires from academy_suggestions (curriculum_gap type)
5. `coaches-stagnant-players` — fires when ≥2 coaches have 2+ stalled players each
6. `coaches-missing-wrapups` count now includes coach-level diagnosis
7. `coaches-data-availability` — based on actual coach count, not session count

**Signals now honestly marked as absent:**
- `players-attendance-risk`: `hasAttendanceData: false` confirmed
- `players-readiness-blockers`: `readinessBlockerCount: 0` confirmed
- `coaches-execution-inconsistency`: `inconsistentExecutionCount: 0` confirmed
- `parents-retention-risk`: `retentionRiskCount: 0` confirmed
- All philosophy signals: `buildDefaultPhilosophyInputs` confirmed placeholder

**Estimated change in signal coverage:**
- Before: ~11 of 27 signals could fire
- After: ~16 of 27 signals can fire
- Remaining 11 signals: marked HONEST_ABSENCE (require infrastructure not yet built)
