# Sprint 833 — Player Priority End-to-End Audit V1

**Date:** 2026-05-26
**Audit type:** Read-only end-to-end loop audit
**No source files modified**

---

## Audit Goal

Trace the full player priority loop: how does AcademyOS detect which players need attention, how does evidence feed into a priority recommendation, how does a director approve that recommendation, and how does the approved priority surface to the player as a mission? Identify gaps before this loop is used in a director demo.

---

## Loop Map

```
Signal Detection
    ├── playerAttentionRiskLoader.ts  → concern obs (30 days) + absences (7 days)
    ├── playerProgressStallDetector.ts → enrolledAt < 90 days / 180 days
    ├── directorPlayersDonnaIntelligence.ts → DONNA roster-attention answers
    ├── Players page (server) → assessment overdue, missing curriculum, score delta < -5
    └── buildAttentionQueue() → pure TS: pendingApprovals, highAlerts, overCapacity, curriculumGaps

Director Reviews Signal
    └── /director/players (list) → advancement-ready banner, DonnaPlayersPresenceCTA
        ├── data-donna-focus-id: player-directory-summary ✅
        ├── data-donna-focus-id: players-missing-level ✅
        └── data-donna-focus-id: add-player-button ✅

Director Opens Player Profile
    └── /director/players/[playerId] → 6-tab page, 20+ queries
        ├── PlayerActionSummaryCard → deriveNextSteps() from live data
        ├── [overview tab]  → load stats, UTR, load risk
        ├── [skill-path tab] → level, gates, gate evidence, audit log
        ├── [notes tab] → CoachPlayerSnapshot, DevelopmentSummarySection
        │                  CoachObservationEvidenceSummary, PlayerActivePriorities
        │                  DraftSummaryUpdateButton, PriorityRecommendationDrafts
        │                  PriorityRecommendationDraftButton
        │                  Evidence Hub (6 components — director-only)
        └── NO data-donna-focus-id attributes on this page ⚠️

Evidence Review
    └── CoachObservationEvidenceSummary → total / internal / approved / session-linked counts
        ├── Top 3 observation types, top 5 tags
        ├── recapRatio: % from director-approved session recaps/wrap-ups
        └── Disclaimer: "does not change player level, priorities, or parent-facing communication"

Priority Recommendation Draft
    └── PriorityRecommendationDraftButton → createPriorityRecommendationDraftAction(playerId)
        ├── Auth: auth → academy_id → academy_memberships (director/head_coach only)
        ├── Fetch: 50 recent coach_observations (tags, obs_type, is_private, ai_entities)
        ├── generateRecommendation(): tag frequency → 44 keywords → 8 categories → title + description
        ├── Overlap check: warns if title tags match existing active priority
        ├── Creates voice_commands relay (required FK for proposed_actions.voice_command_id)
        └── Inserts proposed_actions { status: 'pending_review', risk_level: 'low' }
            payload.warnings: "Draft only. No priority was created or changed."

Development Summary Draft
    └── DraftSummaryUpdateButton → draftSummaryUpdateAction(playerId, academyId)
        ├── Fetches 10 recent is_private=true observations only
        ├── Strengths: positive/positive_highlight types, Work On: needs_attention types
        └── Creates voice_commands + proposed_actions { target_module: 'development_summary_draft_v1' }

Review Draft in Profile
    └── PriorityRecommendationDrafts → shows pending/approved status, category, top tags, overlap warning
        └── NO approve/apply CTA → director must navigate to global review queue ⚠️

Director Approves in Review Queue
    └── /director/review → proposed_actions pending_review
        └── execute_approved_action() → writes to player_priorities { is_active: true }

Active Priority Displayed
    └── PlayerActivePriorities → shows active priorities (read-only)
        ├── 8 category labels, priority levels (high=red, medium=orange, low=muted)
        ├── Caveat: "Priorities are shown for visibility only. Observations and evidence
        │   summaries do not automatically change priorities yet."
        └── Empty state: "Future sprints will allow director-approved priorities to be
            created from evidence."  (caveat is about auto-mutation, not approved records)

Player Portal Surface
    └── /player/page.tsx → activePriorities (title, description, category — scrubbed) → IDP view
    └── /player/missions → priorities as active/next/future missions with urgency labels
    └── /player/missions/[priorityId] → priority detail
    └── Player DONNA chips → static (not priority-aware) ⚠️
```

---

## 10-Dimension Score

### 1. Signal Source Completeness — 8/10

**What works:**
- Five distinct attention signal sources: concern observations (30-day), attendance absences (7-day), progress stall detector (90/180-day threshold), assessment overdue flag, missing curriculum level.
- `buildAttentionQueue()` also sources: pending approvals, expiring actions, at-risk players, curriculum gaps, over-capacity groups, no-session-coverage groups.
- Advancement-ready players surface as a separate lime-highlighted banner on the players page.
- `playerProgressStallDetector.ts` skips advancement-eligible players (correct — they're handled separately), sorts by severity then days stalled.

**Gap:**
- `playerAttentionRiskLoader.ts` only checks `observation_type = 'concern'`. Observations typed as `injury_concern` or `behavioral` — which are explicitly mapped in the observation type labels — do not contribute to the risk signal. A player with three behavioral concern observations shows zero risk.

---

### 2. Data Freshness and Accuracy — 7/10

**What works:**
- Players page computes signals at server-render time (live at page load).
- `playerAttentionRiskLoader` windows are 30 days (concerns) and 7 days (absences).
- Stall detector uses `enrolledAt` from `player_curriculum_states` — the correct reference date.
- DONNA stall answer explicitly states "90-day threshold" in `sourceNote`.

**Gap:**
- `buildAttentionQueue()` is pure TypeScript operating on data already loaded into `DirectorDonnaContext` (the DONNA context package). Attention queue data is as fresh as the last context load — not re-queried per DONNA interaction.
- Stall detector depends on `playerCurriculumStateSummaries` being included in `DirectorDonnaContext.extendedContext`. If that context is unavailable, stall detector returns `stallContextAvailable: false` and falls back to a "data not loaded" message.

---

### 3. Director-to-Player Navigation — 8/10

**What works:**
- Players page advancement-ready banner links directly to `/director/players/${id}?tab=skill-path`.
- `buildAttentionQueue()` high alerts link to `/director/players/${alert.playerId}` when playerId is present.
- DONNA roster attention answers route to `/director/players` (list).
- `donnaUIActionDispatcher` `player_operator` command routes to player profile with guided walkthrough.
- Players page: `data-donna-focus-id` attributes on header, missing-level link, and add-player button — all confirmed present.

**Gap:**
- No deep-link from any attention signal to a specific player profile _tab_ (e.g., directly to notes tab to see priorities/observations). Director lands on the player profile overview tab and must navigate manually.
- No `data-donna-focus-id` attributes on the player profile page. DONNA cannot highlight specific profile sections (notes tab, priority recommendation section, evidence hub). DONNA can navigate _to_ the player profile but cannot focus any element within it.

---

### 4. Priority Recommendation Quality — 8/10

**What works:**
- `createPriorityRecommendationDraftAction` fetches up to 50 recent observations.
- Tag frequency analysis: 44 keywords mapped to 8 categories (technical_skill, tactical_skill, physical_fitness, competition_exposure, behavioral, load_management, reassessment, promotion_readiness).
- OBS_TYPE_CATEGORY_MAP fallback when tags are absent.
- CATEGORY_PRIORITY_ORDER tiebreaker (consistent output for equal-vote categories).
- Overlap check: warns if recommendation title shares keywords with an existing active priority.
- Payload includes `evidence.tag_count`, `evidence.top_tags`, `evidence.obs_type_distribution`, `observationCount` — all traceable.
- All actions route to `proposed_actions` with `status: 'pending_review'`. Never writes `player_priorities` directly.
- Payload warnings: "Draft only. No priority was created or changed." + "Requires director approval before becoming an active player priority."

**Gap:**
- Title and description are minimal machine-assembled strings ("Focus on [tag]. Based on [N] observations showing [type] patterns."). These are not coach-grade language and would need director editing before presentation.
- Limited to last 50 observations — academy with high observation volume may miss older patterns.

---

### 5. Approve → Apply Path Completeness — 5/10

**What works:**
- `PriorityRecommendationDrafts` component renders correctly: shows pending/approved status, category badge, top evidence tags, overlap warning, and date.
- "Draft Only · Not Applied" badge is prominently shown.
- Status transitions (pending_review → approved → clarification_needed) display with correct colors.
- The global review queue at `/director/review` handles approval via `execute_approved_action()`.

**Critical gap:**
- `PriorityRecommendationDrafts` has **no approve/apply CTA**. The component shows that a draft exists and its status, but provides no button, link, or action to approve it. To approve a priority recommendation draft, the director must:
  1. Notice the "Pending Review" status in the component.
  2. Navigate manually to `/director/review`.
  3. Find the draft in the review queue.
  4. Approve it there.
- There is no "Review this in queue →" link, no inline approval, and no navigation hint.
- In a demo, the director will see a draft was created, then have no obvious path forward. This is the highest-priority UX gap in the entire player priority loop.

---

### 6. Player-Facing Priority Surface — 9/10

**What works:**
- Player page queries `player_priorities` selecting only `title, description, category` — all internal fields (is_private, ai_entities, confidence_score, internal notes, source observation IDs) are excluded at the query level.
- IDP (`buildIndividualDevelopmentPlan`) incorporates active priorities into the player's development plan.
- Player missions page maps priorities to active/next/future with urgency labels (critical/high/medium/low → "Priority focus"/"High focus"/"Building toward"/"When ready").
- Mission detail at `/player/missions/[priorityId]` provides full priority context.
- DONNA mission engine suggestion shown on missions page with reason and safety note.
- Player home has `data-status-blue` Ask DONNA section with quick-access prompts.

**Minor gap:**
- Player DONNA chips on home page are static: "What should I practice?", "What does my mission mean?", "How do I get to the next level?", "How do I prepare for a match?" — none reference the player's active priority category or mission title. A player with a `behavioral` active priority sees the same chips as a player with a `technical_skill` priority.

---

### 7. Visibility Gate Enforcement — 10/10

**What works:**
- `developmentProfileQueries.ts`: `fetchPlayerSummaryForParent` hard-codes `.eq('show_to_parent', true)`. `fetchPlayerSummaryForStudent` hard-codes `.eq('show_to_student', true)`. These are not conditional — they're always in the query.
- `visibilityControls.ts`: `computeContentVisibility()` gates on `showToStudent && isPlayerVisible !== false` and `showToParent && isParentVisible !== false && isParentSafe !== false`. Three-flag AND gate for parent visibility.
- Player page queries `player_priorities` for only `title, description, category` — no is_private content, no ai_entities, no confidence scores, no internal analysis.
- Coach notes: `isCoachNoteVisibleToParent(isParentSafe)` — returns false unless explicitly marked safe.
- `filterByVisibility()` utility applies visibility rules uniformly across any typed record array.
- Multiple independent enforcement points: query-level, pure-function-level, component-level.

No gaps found in this dimension.

---

### 8. DONNA Integration Quality — 7/10

**What works:**
- `directorPlayersDonnaIntelligence.ts`: answers "who needs attention?" with up to 3 named high-risk players, reason note, and CTA.
- `playerProgressStallDetector.ts`: detects 90/180-day stalls, names specific players, recommends scheduling an assessment.
- `playerAttentionRiskLoader.ts`: feeds concern + absence data into `DirectorDonnaContext.attentionItems` with playerName.
- `donnaUIActionDispatcher.ts` `player_operator` command: "walk me through a player" / "review this player" launches guided player walkthrough.
- Players page `DonnaPlayersPresenceCTA`: receives `activePlayers`, `missingCurriculumCount`, `advancementReadyCount`, `namedSignals`, `assessmentDueCount` — rich director-facing chip.
- DONNA refuses "move a player to level X" with explicit explanation of the approval pipeline.

**Gaps:**
- No `data-donna-focus-id` on any player profile page component. When DONNA navigates to a player profile (e.g., after a player_operator command), it cannot highlight the notes tab, the priority recommendation section, or the evidence hub. The highlight fires but finds no target.
- DONNA roster attention answers link to `/director/players` (the list), not to the specific flagged player's profile. For "who needs attention?", the director must still search/scroll the list rather than jumping directly to the player.
- Player DONNA (`/player/ask-donna`) uses `playerProgressQa.ts` — a deterministic helper answering level/practice/requirements questions. There is no priority-aware DONNA response (e.g., "Your active mission is [title] — here's what that means for your practice this week").

---

### 9. Coach-to-Director Evidence Handoff — 8/10

**What works:**
- `CoachObservationEvidenceSummary` provides: total/internal/approved/session-linked counts, most recent observation date, top 3 observation types, top 5 tags, recap ratio (% from director-approved session recaps/wrap-ups).
- `recapNote` explicitly distinguishes "No director-approved evidence yet" from partial/majority recap evidence.
- Disclaimer: "Internal evidence summary. This does not change player level, priorities, or parent-facing communication."
- `draftSummaryUpdateAction` traces back to the specific observations it used (`source_observation_count` in payload).
- Evidence hub components (Phase 7A): `PlayerEvidenceTimeline`, `PlayerPriorityEvidenceConnection`, `PlayerCurriculumGateEvidencePanel` — director-only, links gate evidence to director decisions via `audit_logs`.

**Gap:**
- `draftSummaryUpdateAction` only fetches observations where `is_private = true`. Non-private observations (public tactical/technical notes that coaches write to be visible to players) are excluded from summary drafts. A player with 20 public technical observations and 2 private ones will see a 2-observation draft, not a 22-observation draft.
- The `is_private=true` constraint is hard-coded; there's no explanation in the UI for why only internal observations are used.

---

### 10. Loop Closure and Attribution — 6/10

**What works:**
- `PlayerActivePriorities` shows all active priorities after approval, sorted by `priority_rank`.
- Priority levels (high/medium/low) displayed with color coding.
- Categories mapped to human-readable labels.
- `PriorityRecommendationDrafts` shows post-approval status change (pending_review → approved).

**Gaps:**
- `PlayerActivePriorities` displays no attribution — no "approved by [name]" or "approved on [date]". The director cannot see when a priority was set or who approved it without inspecting the audit log.
- The caveat text — "Priorities are shown for visibility only. Observations and evidence summaries do not automatically change priorities yet." — may confuse directors reviewing a profile. This caveat describes the absence of auto-mutation from observations, but approved priorities _are_ live and active. The phrasing could make a director think active priorities are also "read-only" in the sense of not being real.
- No visual confirmation that the review-queue approval step actually wrote to `player_priorities`. Director must trust the `is_active=true` row was created — there's no "Last updated: [date] via review queue" line in the component.
- No "View in review queue →" link from `PlayerActivePriorities` for the director to inspect the originating proposed_action.

---

## Score Summary

| Dimension | Score |
|---|---|
| 1. Signal source completeness | 8/10 |
| 2. Data freshness and accuracy | 7/10 |
| 3. Director-to-player navigation | 8/10 |
| 4. Priority recommendation quality | 8/10 |
| 5. Approve → apply path completeness | 5/10 |
| 6. Player-facing priority surface | 9/10 |
| 7. Visibility gate enforcement | 10/10 |
| 8. DONNA integration quality | 7/10 |
| 9. Coach-to-director evidence handoff | 8/10 |
| 10. Loop closure and attribution | 6/10 |
| **Total** | **76/100** |

---

## Status: ⚠️ DEMO-READY WITH CAVEATS

---

## Critical Gaps (Block Demo Path Without Fix)

### GAP-A: No Approve CTA in PriorityRecommendationDrafts
`src/app/director/players/[playerId]/PriorityRecommendationDrafts.tsx`

The component shows a draft was created and its current status, but provides no action. The director sees "Pending Review" but has no button, link, or navigation hint to get to the review queue. In a live demo, this stops the loop: the director creates a draft, sees it in the profile, and then has no obvious next step.

**Recommended fix:** Add a "Review in queue →" link at the bottom of each pending draft card, linking to `/director/review`.

---

### GAP-B: No data-donna-focus-id on Player Profile Page
`src/app/director/players/[playerId]/page.tsx` and all tab components

DONNA navigates to player profiles (via `player_operator` command or from player list links) but cannot highlight any specific section. The highlight fires to a route with no matching DOM target. Notes tab, priorities section, evidence hub — none are DONNA-addressable.

**Recommended fix:** Add `data-donna-focus-id` attributes to: player profile header (`player-profile-header`), notes tab (`player-notes-tab`), priority recommendations section (`player-priority-recommendation`), PlayerActivePriorities section (`player-active-priorities`).

---

## Notable Findings

### Architectural Strength: Deterministic Priority Pipeline
`createPriorityRecommendationDraftAction` makes no AI calls. It uses tag frequency + category mapping to generate a recommendation. Every input (tags, observation types, observation count) is stored in the proposed_action payload. The recommendation is fully auditable and reproducible. This is the correct architecture for a trust-critical feature.

### Architectural Strength: Three-Layer Visibility Gate
Parent/player content visibility is enforced at: (1) query level (`.eq('show_to_parent', true)`), (2) pure TypeScript function level (`computeContentVisibility`), and (3) field selection level (player portal only receives `title, description, category`). This is the strongest data boundary in the system.

### Architectural Strength: Player Missions as Priority Surface
The player portal translates abstract `player_priorities` rows into mission-framed UX (active/next/future, urgency → human labels). This is the right abstraction layer — the player never sees raw priority system data.

### Design Clarity Issue: PlayerActivePriorities Caveat Text
The caveat "Priorities are shown for visibility only. Observations and evidence summaries do not automatically change priorities yet." describes the absence of auto-mutation from observations. However, the phrasing may lead directors to believe active priorities are also "view-only" in the sense of being inactive or not yet applied. The caveat should be repositioned or reworded to clarify: approved priorities are live and student-facing; the caveat only applies to observation-driven auto-updates.

### Minor Gap: playerAttentionRiskLoader observation_type filter
`observation_type = 'concern'` is the only type checked. The 8 observation types include `injury_concern` and `behavioral` — both of which represent important attention signals that coaches use. These should also contribute to the risk calculation.

---

## Recommended Sprint Order (Post-Audit Phase)

Once all 7 loops are audited:

1. **Player Priority Approve CTA V1** — Add "Review in queue →" link to `PriorityRecommendationDrafts` (GAP-A). Highest impact per line of code.
2. **Player Profile DONNA Focus IDs V1** — Add `data-donna-focus-id` attributes to player profile key sections (GAP-B). Unblocks DONNA-guided player profile navigation.
3. **playerAttentionRiskLoader Observation Type Expansion V1** — Include `injury_concern` and `behavioral` observation types in risk calculation.
4. **PlayerActivePriorities Attribution V1** — Add "approved on [date]" attribution to active priority display.

---

## Files Read (Audit Only — Not Modified)

- `src/app/director/players/page.tsx`
- `src/app/director/players/[playerId]/page.tsx` (partial: lines 1–120, 120–200, 320–520, 1400–1598)
- `src/app/director/players/[playerId]/PlayerActivePriorities.tsx`
- `src/app/director/players/[playerId]/priorityRecommendationAction.ts`
- `src/app/director/players/[playerId]/_components/PlayerActionSummaryCard.tsx`
- `src/app/director/players/[playerId]/CoachObservationEvidenceSummary.tsx`
- `src/app/director/players/[playerId]/PriorityRecommendationDrafts.tsx`
- `src/app/director/players/[playerId]/draftSummaryUpdateAction.ts`
- `src/app/player/page.tsx`
- `src/app/player/missions/page.tsx`
- `src/lib/player/developmentProfileQueries.ts`
- `src/lib/player/visibilityControls.ts`
- `src/lib/player/playerProgressQa.ts`
- `src/lib/director/attentionQueue/index.ts`
- `src/lib/donna/directorPlayersDonnaIntelligence.ts`
- `src/lib/donna/playerAttentionRiskLoader.ts`
- `src/lib/donna/playerProgressStallDetector.ts`
- `src/lib/donna/donnaUIActionDispatcher.ts` (grep)
