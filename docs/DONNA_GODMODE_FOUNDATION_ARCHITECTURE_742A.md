# DONNA Godmode Foundation Architecture
**Sprint:** 742A — Architecture Audit V1  
**Date:** 2026-05-24  
**Status:** Audit only — no code, no migrations

---

## 1. Godmode Definition

**DONNA Godmode** is the state in which DONNA can act as a full operating intelligence across every domain of AcademyOS — reading live data, drafting proposed actions, explaining downstream impact, routing to the correct approval surface, and maintaining a complete audit trail — all while a human director remains the final authority on every state change.

### The Godmode Contract
```
DONNA reads → DONNA understands → DONNA proposes → Director approves → System executes → Audit records
```

No mutation reaches the database without:
1. A proposed_action row in `pending_review`
2. An explicit director approval gesture
3. An audit_log write on execution
4. A rollback path documented in the draft

### What Godmode Is NOT
- DONNA does not auto-execute approved actions
- DONNA does not move player levels without director approval
- DONNA does not send communications to parents/players
- DONNA does not bypass the review queue for any mutation
- DONNA does not generate data from imagination (hallucination guardrail)
- DONNA does not expose internal coach notes to parents or players

---

## 2. Domain Capability Map

### Current capability per domain (as of Sprint 741)

| Domain | View | Explain | Draft | Approve-Route | Execute Path | Audit |
|---|---|---|---|---|---|---|
| Curriculum | ✅ Structural gaps live | ✅ Full 12-level + content types | ✅ Proposal text | ✅ → /director/curriculum/builder | ❌ No apply action | ❌ |
| Class Templates | ✅ Draft shape | ✅ Block types + cues | ✅ DONNA draft | ✅ → /director/class-templates | ❌ No DB save from DONNA | ❌ |
| Fitness Templates | ✅ Draft shape | ✅ Block types + cues | ✅ DONNA draft | ✅ → /director/fitness/templates | ❌ No DB save from DONNA | ❌ |
| Sessions | ✅ Today count | ✅ Session adjustments | ✅ Mod draft shape | ⚠️ Partial → /director/sessions | ❌ `modify_session` not apply-wired | ⚠️ |
| Players | ✅ Attention items | ✅ Profile summary | ❌ No DONNA draft UI | ⚠️ Routes to /director/players | ❌ Level move not wired | ❌ |
| Coaches | ✅ Count + wrap-up gap | ✅ Coach health | ❌ No draft UI | ⚠️ Routes to /director/sessions | ❌ | ❌ |
| Parent Communication | ❌ No live data | ⚠️ Static only | ❌ No DONNA draft | ⚠️ Routes to /director/review | ❌ | ❌ |
| Player Missions | ❌ | ⚠️ Static definitions | ❌ | ❌ | ❌ | ❌ |
| Badges | ❌ | ⚠️ Static definitions | ❌ | ❌ | ❌ | ❌ |
| Assessments | ❌ Live data not in ctx | ⚠️ Type definitions only | ❌ | ⚠️ Routes to /director/review | ❌ | ❌ |
| Review Center | ✅ Count live | ✅ Queue explanation | ❌ | ✅ → /director/review | ✅ approve/reject wired | ✅ |
| Academy Health | ✅ Risk signals | ✅ Attention + KPI | ❌ | ✅ → /director/review | ✅ | ✅ |
| Data Quality | ⚠️ Structural gaps only | ⚠️ Gaps text | ❌ | ⚠️ | ❌ | ❌ |
| Billing / Court Mgmt | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (future) |

**Legend:** ✅ done · ⚠️ partial · ❌ missing

---

## 3. Live Data Readiness Map

### Tables DONNA can query today (RLS-safe, typed)

| Table | Academy-scoped? | Used in context? | Gap |
|---|---|---|---|
| `sessions` | ✅ academy_id | ✅ todaySessions | Only count today — no level/group breakdown |
| `proposed_actions` | ✅ academy_id | ✅ pendingReviews, templateDrafts | Module breakdown partial |
| `players` | ✅ academy_id | ✅ playerCount, attentionItems | No skill/level breakdown in context |
| `academy_memberships` | ✅ academy_id | ✅ coachCount | Active coaching load not in context |
| `session_attendance` | ✅ via session | ✅ absences → attentionItems | No aggregate trend |
| `coach_observations` | ✅ academy_id | ✅ concerns → attentionItems | No tag/domain breakdown |
| `curriculum_levels` | ❌ global | ✅ via gap loader | No per-academy customization surface |
| `curriculum_gates` | ❌ global | ✅ via gap loader | No active-gate-per-player status |
| `curriculum_drills` | ✅ academy_id nullable | ✅ via gap loader | No session delivery tracking |
| `player_curriculum_states` | ✅ academy_id | ✅ Sprint 742B — wired | Count, advancement_eligible count, 30-record summary |
| `assessments` | ✅ academy_id | ✅ Sprint 742B — wired | Count, recent count (30d), 30-record summary |
| `groups` | ✅ academy_id | ✅ Sprint 742B — wired | Active group count, 30-record summary with level/track |
| `templates` | ✅ academy_id | ✅ Sprint 742B — wired | Active template count, 30-record summary with curriculum keys |
| `player_gate_status` | ✅ academy_id | ❌ blocked by migration 059/060 | Gate evidence counts unknown |

### What's missing from `DirectorDonnaContext` that Godmode needs

```typescript
// Proposed additions to DirectorDonnaContext for Godmode
interface AcademyOperatingContext {
  // Level distribution (from player_curriculum_states)
  playerCountByLevel: Record<string, number>         // e.g. { 'orange_2': 5, 'yellow_1': 3 }
  
  // Assessment backlog (from assessments)
  overdueAssessments: number
  upcomingAssessments: number
  
  // Level movement queue
  advancementEligiblePlayers: number                // player_curriculum_states.advancement_eligible
  
  // Group health
  groupsWithLowAttendance: number
  groupsWithMissingTemplates: number
  
  // Template coverage
  levelsWithNoClassTemplate: number
  levelsWithNoFitnessTemplate: number
  
  // Gate evidence (blocked by migrations 041-044, 059-060)
  playersAtGateThreshold: number
  playersBlockedByGate: number
}
```

---

## 4. Approval Authority Matrix

### Who can approve what

| Action Type | Proposer | Approver | Auto-execute? | Notes |
|---|---|---|---|---|
| Session wrap-up draft | Coach | Director | No | proposed_actions pipeline |
| Attendance exception | Coach | Director | No | proposed_actions pipeline |
| Player observation | Coach/Director | Director | No | proposed_actions pipeline |
| Curriculum draft proposal | Director/DONNA | Director | No | Routes to Curriculum Builder UI |
| Class template creation | Director/DONNA | Director | No | Save Template button |
| Fitness template creation | Director/DONNA | Director | No | Save Template button |
| Level movement | Coach flag / DONNA alert | Director | No | `finalize_player_placement()` only |
| Parent update | Director/DONNA | Director | No | Separate send action required |
| Session creation | Director | Director | No | `create_session` action type |
| Assessment scheduling | Director | Director | No | `create_placement_assessment` |
| Badge award | System / Director | Director | No | Not yet wired |
| Mission assignment | System | Director | No | Not yet wired |
| Group roster change | Director | Director | No | `move_player_group` |
| Player status change | Director | Director | No | `flag_player` |
| Academy curriculum override | Director | Director | No | `academy_curriculum_overrides` |

### Approval-level map (from action registry)

| Class | Count | Approval required | Examples |
|---|---|---|---|
| `answer_only` | 15 | None | Explain KPI, explain level, summarize player |
| `draft_only` | 12 | Director review | Wrap-up, observation, session mod |
| `review_required` | 6 | Director review + approve | Level movement alert, parent update |
| `director_approval_required` | 2 | Director explicit approval | Level activation, curriculum publish |
| `unsafe` | 1 | Blocked always | Direct DB mutation |
| `platform_owner_required` | 1 | Platform owner gate | Billing/licensing mutations |

---

## 5. Universal Action Draft Architecture

### Current draft flow

```
Director prompt
     ↓
DonnaVoiceReadyShell.handleSend()
     ↓
[13-step dispatch chain]
     ↓
DonnaSafeReadAnswer (text + href + confidence)
     ↓ (displayed to director)
"Take me to Curriculum Builder" nav offer
     ↓ (director says "yes")
router.push('/director/curriculum/builder')
     ↓ (director manually saves in UI)
proposed_actions INSERT (pending_review)
     ↓
director reviews in /director/review
     ↓
approved → execute_approved_action() RPC
```

### Gap: DONNA cannot INSERT proposed_actions directly from chat

DONNA produces draft text and routes the director to a UI where a server action does the actual INSERT. The missing layer is a **DONNA Draft Submission Action** that:

1. Validates the draft (required fields, risk level, target_module)
2. Calls a server action to INSERT into `proposed_actions` with `status='pending_review'`
3. Writes to `audit_logs` with `action='donna.draft_submitted'`
4. Returns a confirmation with a link to /director/review

### Proposed `DonnaProposedActionSubmitter` (new server action)

```typescript
// Pattern for Godmode draft submission (does not exist yet)
interface DonnaProposedActionSubmit {
  academyId: string
  actionType: ActionType                     // from DB enum
  actionLabel: string
  targetModule: string
  targetObjectId: string | null
  proposedPayload: Record<string, unknown>   // JSON blob
  riskLevel: 'low' | 'medium' | 'high'
  riskNotes: string[]
  proposedById: string                       // director profile_id
  voiceCommandId: string                     // required by schema — use 'donna_chat'
  expiresAt: string                          // default: 7 days from now
}
```

**Constraint:** `proposed_actions.voice_command_id` is NOT NULL in the schema. This means any DONNA-submitted draft must provide a voice_command_id. The recommended approach: use a sentinel value `'donna_chat'` or require a `voice_commands` entry. This is the single biggest schema constraint for Godmode draft submission.

---

## 6. AcademyOperatingContext Proposal

### Problem

`DirectorDonnaContext` currently covers operational signals (pending reviews, missing wrap-ups, attention items, curriculum structural gaps). It is missing the **operating view** — what is the academy's overall curriculum and player state at this moment?

### Proposed `loadAcademyOperatingContext()` extension

```typescript
// New query section in directorDonnaContext.ts (no migration required for these)
// All tables already typed and accessible

async function loadOperatingContext(db: DB, academyId: string) {
  // 1. Player level distribution
  const { data: levelStates } = await db
    .from('player_curriculum_states')
    .select('current_level_id')
    .eq('academy_id', academyId)
  
  const levelDistribution = buildLevelDistribution(levelStates)
  // → { 'orange_2': 5, 'yellow_1': 3, ... }

  // 2. Advancement-eligible players
  const { count: advancementEligible } = await db
    .from('player_curriculum_states')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('advancement_eligible', true)

  // 3. Assessment backlog
  const { count: overdueAssessments } = await db
    .from('assessments')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('status', 'reassessment_due')
  
  // 4. Groups (no migration needed)
  const { data: groups } = await db
    .from('groups')
    .select('id, name')
    .eq('academy_id', academyId)
    .eq('is_active', true)

  return { levelDistribution, advancementEligible, overdueAssessments, groupCount: groups?.length ?? 0 }
}
```

**No migrations required for this.** `player_curriculum_states`, `assessments`, and `groups` all exist with `academy_id` scoping.

---

## 7. Evidence Graph Proposal

### Current state
- `curriculum_gates` — global gate definitions per level (from_level_id, criterion, threshold)
- `player_gate_status` — per-player gate evidence tracking (exists, partially applied — migrations 059/060 pending)
- `requirement_evidence_links` — blocked (requires migrations 041-044)
- `player_requirement_progress` — blocked (requires migrations 041-044)

### Evidence graph shape (post-migration)

```
Player
  └── player_curriculum_states (current level)
        └── curriculum_gates (gates for current level)
              └── player_gate_status (evidence count, status per gate)
                    └── audit_logs (each evidence submission)
```

### What DONNA can say with evidence graph

**With migrations 041-044 + 059/060 applied:**
- "Player X has submitted 3/5 required gate evidence items for Orange 2 gate G-12"
- "5 players are within 1 evidence item of clearing their current gate"
- "Orange 2 Gate G-12 has 8 players in evidence phase — this is your highest-traffic gate"

**Without migrations (current state):**
- "Player gate evidence data requires database migrations 041-044 and 059-060 to be applied"

---

## 8. Impact Preview Architecture

### Current state (Sprint 738)
`curriculumImpactDonnaAnswer.ts` provides static stage-based estimates:
- "Adding a gate to Orange 2 affects ~10 players"
- Estimates are disclosed as estimates, not live counts

### Live impact preview path

The gap is `DirectorDonnaContext` does not include `playerCountByLevel`. With `loadOperatingContext()` wired:

```typescript
// In curriculumImpactDonnaAnswer.ts, replace static estimates with:
function buildLiveImpactEstimate(
  changeType: ChangeType,
  targetLevel: string,
  playerCountByLevel: Record<string, number>,
): string {
  const affected = playerCountByLevel[targetLevel] ?? 0
  // → "This change affects 5 players currently at Orange 2"
}
```

**No migration required.** Only `loadOperatingContext()` wiring needed.

### Impact preview for other domains

| Domain | What changes | Live data source | Migration needed? |
|---|---|---|---|
| Curriculum level | Players at level | `player_curriculum_states` | No |
| Gate modification | Players in evidence phase | `player_gate_status` | Yes (059/060) |
| Template modification | Sessions using this template | `sessions.template_id` | No |
| Session cancellation | Players with attendance recorded | `session_attendance` | No |
| Level movement | Player advancement history | `player_curriculum_history` | No |
| Parent update | Guardian records linked | `player_guardians` | No |

---

## 9. Audit Log / Rollback Architecture

### Current audit infrastructure

**`audit_logs` table (live):**
```
academy_id · action · actor_id · actor_role · source_type · target_type · target_id · target_label · payload
```

**`donnaAuditTrail.ts` (Sprint 1028):**
- `buildDraftSubmitAuditEntry()` — payload builder for draft submissions
- `buildDraftDecisionAuditEntry()` — approved/rejected decisions
- `buildApprovalSubmitAuditEntry()` — approval request submitted
- `buildApprovalDecisionAuditEntry()` — approval granted/rejected
- `buildActionBlockedAuditEntry()` — blocked action logging

**Current gap:** These are payload *builders* only. No server action exists to actually write them to `audit_logs`. The write happens in separate server actions (e.g., `recordGateEvidenceAction`), not in the DONNA chat layer.

### Rollback architecture

**Current state:** No rollback mechanism exists.

**Proposed rollback contract for Godmode:**

Every `executed` proposed_action should store a `rollback_payload` in `proposed_payload.rollback`. The rollback is:
1. A new `proposed_action` with `action_type = 'modify_*'` and the original values
2. Director must approve the rollback draft just like any other mutation
3. `audit_logs` records `action = 'donna.rollback_submitted'`

**Tables supporting rollback (no migration needed):**
- `academy_curriculum_overrides.rollback_of_override_id` — already has a self-referential FK
- `proposed_actions` — can reference the original action in `proposed_payload`
- `audit_logs` — records the chain

**Tables where rollback is complex or impossible:**
- `session_attendance` — attendance records are historical; retroactive changes affect reports
- `player_curriculum_history` — history rows should not be deleted
- `audit_logs` — never delete audit entries

---

## 10. Data Quality Guardian Architecture

### Current signals
- `curriculumStructuralGapLoader.ts` — structural gaps (levels with no gates, no drills)
- `curriculumBottleneckLoader.ts` — blocked_by_schema for player-progress gaps
- `attentionItems` in `DirectorDonnaContext` — player-level quality signals

### Proposed data quality guardian domains

| Domain | Current coverage | Gap signals available now | Blocked until |
|---|---|---|---|
| Curriculum structure | ✅ Live (Sprint 741) | Levels with no gates, no drills | — |
| Curriculum content | ⚠️ Partial | Items with no parent_safe_description | Migration 061 |
| Player records | ⚠️ Count only | Players with no curriculum state | No migration needed |
| Assessment coverage | ❌ | Players overdue for reassessment | No migration needed |
| Attendance quality | ⚠️ Attendance exceptions count | Groups with <80% attendance | No migration needed |
| Coach coverage | ✅ Wrap-up gap | Sessions without a coach assigned | No migration needed |
| Template coverage | ❌ | Levels with no class template | Migration 045 |
| Gate evidence quality | ❌ | Gates with 0 active evidence | Migrations 041-044, 059-060 |
| Parent communication | ❌ | Players with no parent update in 30 days | No migration needed |
| Voice command quality | ⚠️ | Voice intents with no matching action | No migration needed |

### `DonnaDataQualityReport` type (proposed)

```typescript
interface DonnaDataQualityReport {
  curriculumStructure: string[]      // from curriculumStructuralGapLoader ✅
  playerRecords: string[]            // needs query: players with no curriculum_state
  assessmentCoverage: string[]       // needs query: assessments.status = 'reassessment_due'
  attendanceCoverage: string[]       // needs query: low attendance groups
  templateCoverage: string[]         // blocked by migration 045
  gateEvidenceCoverage: string[]     // blocked by migrations 041-044, 059-060
  parentCommunication: string[]      // needs query: no parent updates in 30 days
  overallHealthScore: number         // 0-100, derived from above
}
```

---

## 11. Role Permission Model

### Current roles and DONNA scope

| Role | Context loaded | Can draft | Can approve | Sees | Never sees |
|---|---|---|---|---|---|
| `academy_director` | `DirectorDonnaContext` | ✅ All draft classes | ✅ Own academy | All internal data | Other academies |
| `head_coach` | (not yet separate) | ✅ Wrap-up, observation | ❌ | Own sessions + players | Director financials |
| `coach` | `CoachDonnaContext` | ✅ Wrap-up, observation | ❌ | Own sessions + players | Director data, other coaches' notes |
| `player` | ❌ Not yet built | ❌ | ❌ | Own missions, badges, visible gates | Coach notes, other players |
| `parent` | ❌ Not yet built | ❌ | ❌ | Own child's approved summaries | Coach notes, assessments |
| `platform_owner` | (future) | ✅ Platform-level | ✅ Cross-academy | All academy summaries | Individual player details |

### DONNA role guard enforcement chain

```
DonnaVoiceReadyShell.handleSend()
  → checkQuestionBoundary()          (donnaBoundaryResponses.ts)
  → plainRole check on each dispatch
  → donnaRoleBoundaries.ts           (isTaskAllowedForRole)
  → voiceRoleGuardrails.ts           (VOICE_ROLE_GUARDRAILS)
  → observationVisibilityGuardrails.ts
  → parentSafeResponseRules.ts
  → donnaTrustBoundaryValidator.ts
```

### Missing role contexts for Godmode

| Context needed | File | Status |
|---|---|---|
| `PlayerDonnaContext` | Not built | Needs query: player's own curriculum state, missions, badges |
| `ParentDonnaContext` | Not built | Needs query: linked player's approved summaries only |
| `HeadCoachDonnaContext` | Not built | Extends CoachDonnaContext with group management scope |
| `PlatformOwnerContext` | Not built | Cross-academy aggregate view |

---

## 12. Migration Dependency Map

### Migrations written but NOT applied to live DB (blocking Godmode domains)

| Migration | Tables/Columns | What it unlocks for DONNA |
|---|---|---|
| `041_requirement_domains.sql` | `requirement_evidence_links`, `curriculum_track_requirements`, `player_requirement_progress`, `curriculum_requirement_domains` | Player-progress gap analysis, gate evidence tracking |
| `042_requirement_domain_seed.sql` | Seed `curriculum_requirement_domains` | Requires 041 first |
| `043_orange_ball_starter_requirements.sql` | Seed `curriculum_track_requirements` | Requires 041 first |
| `044_player_requirement_progress_bootstrap.sql` | Bootstrap `player_requirement_progress` | Requires 041-043 first |
| `045_curriculum_level_id_on_templates.sql` | `templates.curriculum_level_id` | Template-to-level gap, "which template covers Orange 2?" |
| `056_session_block_exercises_rls.sql` | RLS policies on `session_block_exercises` | Exercise queries in session detail |
| `058_template_block_exercises_rls.sql` | RLS policies on `template_block_exercises` | Exercise population in template builder |
| `059_player_gate_status.sql` + `060_gate_status_repair.sql` | `player_gate_status`, `gate_id` on `requirement_evidence_links` | Gate evidence counts per player per gate |
| `061_curriculum_content_taxonomy.sql` | 6 new columns on `curriculum_content_items` | Content type classification, parent-safe gap analysis |
| `062_class_template_content_junction.sql` | `curriculum_class_template_blocks` | Class template ↔ curriculum drill/content linking |
| `063-068_*.sql` | Various content seeds + RLS fixes | Content library population, template schema |

### Apply order for minimum Godmode capability

**Phase A — Player-progress gaps (requires DB admin):**
1. `041` → `042` → `043` → `044` → `060` (in order)
2. Regenerate `database.types.ts`
3. Build `loadPlayerProgressGaps(db, academyId)`

**Phase B — Template intelligence (requires DB admin):**
1. `045` → regenerate types
2. Wire template-to-level query in `DirectorDonnaContext`

**Phase C — Content taxonomy (requires DB admin):**
1. `061` → regenerate types  
2. Wire `parent_safe_description` gap check

**Phase D — Gate evidence (requires Phase A first):**
1. `059`/`060` already partially applied
2. After 041-044: wire `player_gate_status` queries

---

## 13. What Can Be Built Now (No Migrations Required)

### Tier 1 — Immediately buildable

| Sprint | Feature | Files | Impact |
|---|---|---|---|
| 742B | `loadAcademyOperatingContext()` — player level distribution | `directorDonnaContext.ts` | DONNA knows how many players are at each level |
| 742C | `loadAcademyOperatingContext()` — advancement-eligible players | `directorDonnaContext.ts` | DONNA can say "5 players are ready to advance" |
| 742D | `loadAcademyOperatingContext()` — assessment backlog | `directorDonnaContext.ts` | DONNA can surface assessment queue |
| 743 | Live impact preview in `curriculumImpactDonnaAnswer.ts` | `curriculumImpactDonnaAnswer.ts` | Replaces static estimates with real player counts |
| 744 | DONNA player-level awareness answer engine | new `playerLevelDonnaAnswer.ts` | "Which levels have the most players?" |
| 745 | Data quality guardian V1 | new `dataQualityGuardian.ts` | Checks players with no curriculum state, groups with low attendance |
| 746 | `DonnaProposedActionSubmitter` server action | new `donnaProposedActionAction.ts` | DONNA can submit drafts directly to proposed_actions |
| 747 | Wrap-up → proposed_actions pipeline via DONNA chat | `DonnaVoiceReadyShell.tsx` | Coach DONNA creates wrap-up drafts from chat |
| 748 | `donnaAuditTrail.ts` → actual DB writer | new server action | Audit log writes from DONNA dispatch |

### Tier 2 — Buildable with minor scaffolding

| Sprint | Feature | Dependency |
|---|---|---|
| 750 | Parent update draft from DONNA chat | `parent_updates` table already exists |
| 751 | Session creation draft from DONNA chat | `create_session` action type in enum |
| 752 | Assessment scheduling draft | `assessments` table + `create_placement_assessment` enum |
| 753 | Level movement proposal from DONNA | `finalize_player_placement()` RPC exists |

---

## 14. What Must Wait (Migration Gated)

| Feature | Requires | Migration |
|---|---|---|
| Player gate evidence counts in context | `player_gate_status` fully applied | 041-044, 059/060 |
| "N players blocked by gate X" | `requirement_evidence_links.gate_id` | 060 |
| Template-to-level coverage gap | `templates.curriculum_level_id` | 045 |
| Class template ↔ curriculum content link | `curriculum_class_template_blocks` | 062 |
| Parent-safe description gap scan | `curriculum_content_items.parent_safe_description` column active | 061 |
| Content seeding | Orange 1 foundation content | 063 |
| Mental/competitive content | Mental performance content | 065 |
| Template schema extension | Block type + level + group fields | 067 |

---

## 15. Exact Sprint Sequence to Godmode Certification

### Phase 1 — Context Expansion (742B–742E, no migrations)

| Sprint | What | Outcome |
|---|---|---|
| 742B | Wire `player_curriculum_states` → `playerCountByLevel` into DirectorDonnaContext | DONNA knows level distribution |
| 742C | Wire `assessments` → `overdueAssessments` + `advancementEligiblePlayers` | DONNA knows advancement backlog |
| 742D | Wire `groups` → `groupCount` + `groupsWithLowAttendance` | DONNA knows group health |
| 742E | Wire `templates` → `levelsWithNoTemplate` (pre-migration estimate via template count) | DONNA knows template coverage |

### Phase 2 — Live Impact & Quality (743–746, no migrations)

| Sprint | What | Outcome |
|---|---|---|
| 743 | Live impact preview using real `playerCountByLevel` | Impact estimates become real counts |
| 744 | Player-level awareness answer engine | DONNA answers "which level has most players?" |
| 745 | Data quality guardian V1 (no-migration checks) | DONNA surfaces data quality report |
| 746 | DONNA proposed_action submitter server action | DONNA can submit drafts directly |

### Phase 3 — Apply Migrations (DB admin required)

| Task | Migrations | What unlocks |
|---|---|---|
| Apply migration batch A | 041, 042, 043, 044, 060 | Player gate evidence tracking |
| Apply migration batch B | 045 | Template-to-level gaps |
| Apply migration batch C | 061, 062, 063, 065, 067, 068 | Content taxonomy, class template content |
| Regenerate types | `supabase gen types typescript` | All new columns typed |

### Phase 4 — Evidence Graph & Gate Intelligence (747–752, post-migration)

| Sprint | What | Outcome |
|---|---|---|
| 747 | `loadPlayerProgressGaps()` wired post-migration | DONNA knows gate evidence status |
| 748 | Gate evidence count in DirectorDonnaContext | "5 players near gate threshold" |
| 749 | Template-to-level gap post-migration | "Orange 2 has no class template" |
| 750 | Data quality guardian V2 (with gate data) | Full data quality report |

### Phase 5 — Action Submission Pipeline (751–756)

| Sprint | What | Outcome |
|---|---|---|
| 751 | DONNA audit log writer server action | Audit trail writes from chat |
| 752 | Parent update draft via DONNA chat | "Draft parent update for Player X" → proposed_actions |
| 753 | Session creation draft via DONNA chat | "Create a session for Group A tomorrow" → proposed_actions |
| 754 | Assessment scheduling via DONNA chat | "Schedule quarterly assessment for Group B" → proposed_actions |
| 755 | Level movement proposal via DONNA | "Propose to move Player X to Orange 3" → proposed_actions |
| 756 | Rollback draft architecture V1 | Every executed action has a reversal path |

### Phase 6 — Godmode Certification (757–760)

| Sprint | What | Outcome |
|---|---|---|
| 757 | Godmode regression test harness | 40+ scenario tests across all domains |
| 758 | Role permission audit — coach/parent/player DONNA | Role boundary verification |
| 759 | End-to-end flow: DONNA → draft → review → execute → audit | Full pipeline verified |
| 760 | Godmode certification sprint | Score, certify, publish |

---

## 16. Readiness Scorecard (as of Sprint 741)

### Dimension scores

| Dimension | Score | What's there | What's missing |
|---|---|---|---|
| **Live data readiness** | **5/10** | Sessions, reviews, players count, attention items, structural curriculum gaps | Level distribution, assessment backlog, group health, template coverage, gate evidence |
| **Action draft readiness** | **4/10** | Draft payload builders for wrap-up, observation, session mod, curriculum proposal | No DONNA → proposed_actions server action; voice_command_id constraint; 4 apply paths missing |
| **Approval routing readiness** | **7/10** | State machine complete; approve/reject wired; expiry logic; review queue live | 4 action types lack apply path; no inline DONNA explanation on review item |
| **Evidence graph readiness** | **2/10** | `curriculum_gates` typed; `player_gate_status` exists | Migrations 041-044, 059/060 not applied; no per-player gate query in context |
| **Impact preview readiness** | **4/10** | Static estimates disclosed as estimates | No `playerCountByLevel` in context; gate data blocked by migrations |
| **Audit/rollback readiness** | **5/10** | `audit_logs` table live; audit payload builders complete; `donnaAuditTrail.ts` exists | No server action writes audit from DONNA chat; no rollback draft builder |
| **Role permission readiness** | **7/10** | Director + coach contexts built; boundary enforcement complete; parent/player safety enforced | No PlayerDonnaContext; no ParentDonnaContext; HeadCoach not separate from Coach |
| **Data quality readiness** | **3/10** | Structural curriculum gaps live | No player-record quality check; no assessment coverage check; gate evidence blocked |
| **UI workflow readiness** | **5/10** | DONNA chat on /director/donna; quick actions; nav offers; review queue functional | No inline DONNA on /director/players/[id]; no inline DONNA on review items; no coach DONNA panel |
| **Overall Godmode readiness** | **4.7/10** | Foundation architecture sound; approval model strong; builder assistant certified | Context gaps; action submission missing; migration debt; evidence graph blocked |

### Godmode readiness: **5/10 — Pilot-approaching, not yet operational**

The architecture is sound. The approval model is well-designed and enforced. The DONNA conversation engine is certified. The blocking constraints are clear and removable. Godmode is achievable in approximately 20 sprints of focused work, dependent on applying 7 database migrations.

---

## 17. Biggest Blockers (Priority Order)

1. **`voice_command_id` NOT NULL on `proposed_actions`** — DONNA cannot submit a proposed_action from chat without a voice_commands row to link to. Requires either a schema relaxation or a sentinel value convention (architectural decision).

2. **`player_curriculum_states` not in `DirectorDonnaContext`** — DONNA doesn't know how players are distributed across levels. Fixable in Sprint 742B with no migration.

3. **Migrations 041-044 not applied** — Blocks the full evidence graph: gate evidence counts, player progress against requirements, bottleneck identification.

4. **No `DonnaProposedActionSubmitter` server action** — DONNA can produce draft text but cannot INSERT into `proposed_actions` from the chat layer. Requires a new server action file.

5. **`execute_approved_action()` covers 11/15 action types** — 4 action types have no apply path after director approval. These are: `generate_parent_update`, `schedule_reassessment`, `create_placement_assessment`, and one other.

6. **No audit write from DONNA chat** — `donnaAuditTrail.ts` has payload builders but no server action that writes to `audit_logs`. DONNA actions are currently not auditable end-to-end.

---

## 18. Architecture Non-Negotiables (Never Cross)

These constraints exist in `docs/AI_BACKEND_RULES.md` and `docs/LOCKED_MODULES.md` and must be preserved in every Godmode sprint:

1. Voice and chat never directly mutate core data — all mutations go through `proposed_actions`
2. `finalize_player_placement()` is the only path to activate a player
3. `execute_approved_action()` is the only path to execute approved actions
4. All new tables require RLS and `academy_id`
5. All major mutations write to `audit_logs`
6. Parent/player data is never exposed to unauthorized roles
7. No migration applied without explicit sprint authorization
8. DONNA cannot bypass the review queue under any circumstance
9. All gap/recommendation answers disclose their data source and confidence level
10. Demo data is never presented as live data
