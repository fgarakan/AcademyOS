# Sprint 855 — Player Priority 90+ Certification V1

**Date:** 2026-05-26
**Sprint:** 855
**Type:** Audit/certification — no source files modified
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors) — audit only
**Baseline:** Sprint 833 — 76/100 ⚠️ DEMO-READY WITH CAVEATS
**Previous audit:** Sprint 845 — 87/100 ✅ STRONG — MINOR POLISH REMAINS

---

## Sprints Under Review (849–854)

| Sprint | Summary | Type |
|---|---|---|
| Sprint 849 | `data-donna-focus-id="player-notes-tab"` on Notes tab trigger; `TabsTrigger` prop extension | DOM / DONNA anchor |
| Sprint 850 | `donnaUIActionDispatcher.ts` sourceCommand-aware intent routing: notes/priority/evidence intent → `player-notes-tab` | DONNA dispatcher |
| Sprint 851 | "View in review queue →" link on active priority cards → `/director/review?tab=player-updates` | UX loop closure |
| Sprint 852 | Route-aware DONNA chips on player profile: "View player notes", "Show priorities", "Open player updates" | DONNA chips |
| Sprint 853 | Architecture audit — context injection design; Option D recommended; no source changes | Audit / design |
| Sprint 854 | Typed `DonnaPlayerProfileContext` in `DonnaSessionContext`; `PlayerProfileDonnaRegistrar` client component; priority-aware chip labels | Architecture + UX |

---

## 12-Point Audit

### 1. Player Profile Entry Clarity ✅

**Verified:** `data-donna-focus-id="player-profile-header"` wraps `<PlayerProfileHeader>` at `page.tsx:1654`. This is always in the DOM, outside the tab system. DONNA highlights this on any generic player profile navigation.

Sprint 850 leaves generic navigation pointing to `player-profile-header` when `sourceCommand` is absent or does not match `NOTES_INTENT`. Confirmed in `donnaUIActionDispatcher.ts` lines 389–409: `notesIntent = sourceCommand ? NOTES_INTENT.test(sourceCommand) : false` — absent source command → `player-profile-header` default.

**Result: ✅ CLEAR**

---

### 2. Active Priority Visibility ✅

**Verified:** `PlayerActivePriorities.tsx` renders all `is_active = true` priorities scoped by `academy_id` + `player_id`. Each card shows:
- Title, priority level (color-coded: high=red, medium=orange, low=muted)
- Category badge, urgency badge, status badge
- Description when present
- Named approver + applied date (Sprint 843/844)
- "View in review queue →" link (Sprint 851)

Empty state present with explanatory copy.

**Result: ✅ CLEAR**

---

### 3. Priority Attribution ✅

**Verified:** `page.tsx` lines 156–200 (enrichment block):
1. `audit_logs` queried for `action = 'priority_recommendation.priority.applied'` + `target_id IN priorityIds`
2. `actor_id` → `profiles.display_name` resolved in two batched queries
3. `approved_by_name` populated on `enrichedActivePriorities`
4. `PlayerActivePriorities.tsx` line 104: `Approved by {p.approved_by_name ?? 'director'} · Applied {formatDate(p.generated_at)}`
5. Fallback to "director" for any missing audit entry

Audit log mapping confirmed 1:1: `audit_logs.target_id = player_priorities.id` written synchronously in `review/actions.ts` apply action.

**Result: ✅ CLEAR**

---

### 4. Review Queue Bridge ✅

Two bridges verified:

**Draft → Review Queue (Sprint 840):** `PriorityRecommendationDrafts.tsx` renders status-aware CTA:
- `pending_review` → "Review / Approve in Review Queue →" (orange)
- `approved` → "Apply in Review Queue →" (lime)
- `clarification_needed` → "Return to Review Queue →" (blue)

Header: "Official priority changes require director approval in the Review Queue."

**Active Priority → Review Queue (Sprint 851):** `PlayerActivePriorities.tsx` line 115–119:
```tsx
<Link
  href="/director/review?tab=player-updates"
  className="inline-block text-[11px] text-lime/70 hover:text-lime transition-colors mt-0.5"
>
  View in review queue →
</Link>
```

Both bridges are `<Link>` navigation only — no server actions, no auto-approval.

**Note:** Direct deep-link to specific `proposed_action_id` not available — `player_priorities` schema has no `proposed_action_id` column (confirmed Sprint 851). Fallback to Player Updates tab is honest and useful.

**Result: ✅ CLEAR (with documented limitation)**

---

### 5. DONNA Notes-Tab Navigation ✅

**Two-part chain verified:**

**Part A — DOM anchor (Sprint 849):** `PlayerProfileTabs.tsx` line 48:
```tsx
<TabsTrigger value="notes" data-donna-focus-id="player-notes-tab">Notes</TabsTrigger>
```
This renders on a `<button role="tab">` — always in DOM regardless of active tab. `DonnaHighlightBanner`'s `querySelector` finds it and can apply teal-glow + `scrollIntoView`.

**Part B — Dispatcher wiring (Sprint 850):** `donnaUIActionDispatcher.ts` lines 389–408:
```ts
const NOTES_INTENT = /priorit|evidence|note|development|observation|coach|recommendation/i
const notesIntent = sourceCommand ? NOTES_INTENT.test(sourceCommand) : false

targetId: notesIntent ? 'player-notes-tab' : 'player-profile-header'
```

Commands like "show priorities", "view development notes", "check evidence", "review coach observations" → `player-notes-tab` highlighted. Generic commands → `player-profile-header` (safe default preserved).

**Known limitation:** `DonnaHighlightBanner` fires on `usePathname()` change only. Tab switches via `?tab=notes` (query-string) do NOT change the pathname → teal highlight cannot be triggered from chip navigation. This is documented, accepted, and requires path-segment tab routing to resolve.

**Result: ✅ CLEAR (highlight limitation documented and accepted)**

---

### 6. DONNA Player-Profile Chips ✅

**Verified:** `DonnaAssistantButton.tsx` lines 3585–3630.

Route detection: `pathname.startsWith('/director/players/') && pathname.split('/').length === 4` — matches `/director/players/<uuid>`, does not match list or sub-pages.

Chip logic reads `donnaSession.playerProfileContext` (IIFE pattern):
```ts
const playerCtx = donnaSession.playerProfileContext
// Chip 1: View: <title> (<level>) OR "View player notes"
// Chip 2: Show priorities (<count>) OR "Show priorities"
// Chip 3: "Open player updates" — always
```

Generic Sprint 800 chips preserved for all non-player-profile routes: "What do I need to do today?", "What needs my attention?", "What can you help me do here?".

**Result: ✅ CLEAR**

---

### 7. Typed Player Context Injection ✅

**Verified full chain:**

1. `donnaSessionContext.ts` — `DonnaPlayerProfileContext` interface defined; `playerProfileContext: DonnaPlayerProfileContext | null` in `DonnaSessionState`; `updatePlayerProfileContext(ctx | null)` in `DonnaSessionContextValue`; default `null` in `DEFAULT_DONNA_SESSION`
2. `DonnaSessionContextProvider.tsx` — `updatePlayerProfileContext` callback implemented with no falsy guard:
   ```ts
   const updatePlayerProfileContext = useCallback((ctx: DonnaPlayerProfileContext | null) => {
     setSession(prev => ({ ...prev, playerProfileContext: ctx }))
   }, [])
   ```
3. `PlayerProfileDonnaRegistrar.tsx` — `'use client'` component; calls `updatePlayerProfileContext(ctx)` on mount/update; cleanup calls `updatePlayerProfileContext(null)` on unmount
4. `page.tsx` — renders `<PlayerProfileDonnaRegistrar activePriorityCount={...} topPriorityTitle={...} topPriorityLevel={...} />` using existing `activePriorities` data (no new DB queries)
5. `DonnaAssistantButton.tsx` — destructures `session: donnaSession` from context; reads `donnaSession.playerProfileContext` in chip logic

**Result: ✅ CLEAR — full chain implemented and verified**

---

### 8. Stale Context Clearing Behavior ✅

**Verified:** `PlayerProfileDonnaRegistrar.tsx` lines 39–43:
```ts
return () => {
  // Clear on unmount — prevents stale priority data leaking into context
  // after the director navigates away from this player profile.
  updatePlayerProfileContext(null)
}
```

The `useEffect` cleanup fires when:
- Director navigates away from `/director/players/<uuid>` (component unmounts)
- Director navigates from Player A's profile to Player B's profile (component remounts with new props, cleanup fires for old props before new effect fires)
- Director's session ends

`updatePlayerProfileContext` has no falsy guard (unlike `updateObjectContext` which has `summary ? ... : prev.lastSummary`). The explicit `null` always writes through.

**Scenario: Player A → Player B navigation:**
1. Player A's registrar unmounts → `updatePlayerProfileContext(null)` → `playerProfileContext = null`
2. Player B's registrar mounts → `updatePlayerProfileContext(ctx_B)` → `playerProfileContext = ctx_B`

No stale Player A data appears on Player B's chips.

**Result: ✅ CLEAR**

---

### 9. Data Honesty ✅

**Chips:** When `playerProfileContext` is null (registrar not yet mounted), chips fall back to "View player notes" and "Show priorities" — these are honest navigation labels, not invented data. No fake priority titles. No invented counts.

**DonnaPlayerProfileContext contents:**
- `activePriorityCount: number` — exact count from `activePriorities.length`
- `topPriorityTitle: string | null` — from `activePriorities[0]?.title ?? null` — real DB value or null
- `topPriorityLevel: string | null` — from `activePriorities[0]?.priority_level ?? null` — real DB value or null

No raw coach notes. No private observation content. No generated descriptions. No parent-visible data.

**Result: ✅ CLEAR — all chip labels are real data or honest fallbacks**

---

### 10. Safety / Approval Boundaries ✅

Verified across all Sprints 849–854:

| Guarantee | Sprint | Verification |
|---|---|---|
| No DB writes | All | Chips are `router.push` navigation; registrar has no DB calls; links are `<Link>` |
| No auto-approval | All | No `proposed_actions.status` writes in any sprint |
| No review queue bypass | All | CTAs are `<Link>` navigation, not server actions |
| No player level movement | All | `finalize_player_placement()` not called |
| No parent/player visibility change | All | DonnaSessionContext in director layout only; chips director-only |
| No schema changes | All | No migrations in Sprints 849–854 |
| No RLS weakening | All | `academy_id` scoping preserved on all queries |
| No private note in chips | 852/854 | `DonnaPlayerProfileContext` has no `description`, no coach note content |
| No service role | All | All queries through `getSupabaseServer()` (user session) |
| audit_logs provenance preserved | All | Sprints read audit_logs; do not write to them |

**Result: ✅ FULLY SAFE**

---

### 11. Mobile / Cognitive Load ✅

**Chips:** Maximum 3 chips on player profile + optional "Back to". No chip overload. Chips are contextual (match current page intent) rather than generic director commands. Labels are short and action-oriented ("View: Technical Skill (high)", "Show priorities (2)", "Open player updates").

**PlayerActivePriorities:** Each card shows the essential context (title, level, category, attribution, queue link) without overwhelming the director. The caveat text is present but concise.

**Remaining concern (low):** The caveat text "Priorities are shown for visibility only. Observations and evidence summaries do not automatically change priorities yet." may still be mildly confusing — it describes the absence of auto-mutation, but directors who have gone through the approve/apply flow know priorities are active. This is a copy polish item, not a functional gap.

**Result: ✅ ACCEPTABLE**

---

### 12. Remaining Low-Priority Gaps ✅ (all low, none blocking)

| Gap | Dimension | Source | Blocking? |
|---|---|---|---|
| DONNA attention context not live-requeried per interaction | 2 | Sprint 833 | No — freshness gap, not a correctness gap |
| DONNA attention answers link to player list, not specific player | 3, 8 | Sprint 833 | No — directs to the list; director navigates from there |
| `draftSummaryUpdateAction` is_private filter excludes public coach notes | 9 | Sprint 833 | No — private obs still dominate; draft is reviewed before approval |
| Priority title/description are minimal machine-assembled strings | 4 | Sprint 833 | No — director edits before approval |
| Teal highlight can't fire on query-string tab change | 3, 8 | Sprint 852 | No — navigation works; highlight is UX polish |
| Direct `proposed_action_id` deep-link not available | 5, 10 | Sprint 851 | No — fallback to Player Updates tab is functional |
| Player DONNA chips static — player side | 6 | Sprint 833 | No — player portal scope; not director-demo blocking |
| Active priority caveat text mildly ambiguous | 10 | Sprint 833 | No — copy polish item |

No new critical or medium gaps discovered in this audit.

---

## 10-Dimension Score — Sprint 855

### Dimension 1: Signal Source Completeness — 9/10 (unchanged from Sprint 845)

Sprint 842 expanded `playerAttentionRiskLoader` to `concern + injury_concern + behavioral`. Signal coverage complete for the primary UX flow.

**Remaining gap (low):** `buildAttentionQueue()` is pure TypeScript on cached context — not live-requeried per interaction.

---

### Dimension 2: Data Freshness and Accuracy — 7/10 (unchanged from Sprint 845)

No sprints in this cycle addressed DONNA context freshness. The DONNA attention context is loaded once and not re-queried per interaction. This is the primary drag on the overall score.

**Remaining gap (low-medium):** Structural — requires DONNA infrastructure sprint (live context queries per panel open). Out of scope for Player Priority loop.

---

### Dimension 3: Director-to-Player Navigation — 9.5/10 (was 9/10, +0.5 from Sprints 849+850)

- Sprint 849: `player-notes-tab` always-in-DOM anchor on Notes tab trigger ✅
- Sprint 850: sourceCommand-aware dispatcher → notes/priority/evidence intent → `player-notes-tab` ✅
- Two stable always-in-DOM anchors: `player-profile-header` + `player-notes-tab` ✅

**Remaining gap (low):** DONNA attention answers route to `/director/players` (list), not the specific flagged player's profile. Gap would require changing `directorPlayersDonnaIntelligence.ts` to link to `/director/players/${playerId}`.

---

### Dimension 4: Priority Recommendation Quality — 8/10 (unchanged from Sprint 845)

No sprints in this cycle touched recommendation generation. The deterministic tag-frequency algorithm is unchanged.

**Remaining gaps (low):** Machine-assembled title/description strings; 50-observation limit.

---

### Dimension 5: Approve → Apply Path Completeness — 9.5/10 (was 9/10, +0.5 from Sprint 851)

- Sprint 840: CTA from draft to review queue ✅
- Sprint 843/844: named approver + applied date attribution ✅
- Sprint 851: "View in review queue →" from active priority cards ✅

Full UX loop: draft → CTA → review queue → approve → apply → active priority with attribution + back-link.

**Remaining gap (low):** Direct `proposed_action_id` deep-link requires schema migration (nullable column addition to `player_priorities`). The fallback tab link is functional.

---

### Dimension 6: Player-Facing Priority Surface — 9/10 (unchanged from Sprint 845)

Three-layer visibility gate intact throughout Sprints 849–854:
1. Query-level: `show_to_parent`, `show_to_student` filters
2. Function-level: `computeContentVisibility()` three-flag AND gate
3. Field-selection-level: player portal query selects only `title, description, category`

`DonnaPlayerProfileContext` (Sprint 854) contains only `activePriorityCount`, `topPriorityTitle`, `topPriorityLevel` — safe summary data, no private content.

**Remaining gap (low):** Player-side DONNA chips are not priority-aware. Out of scope for director loop.

---

### Dimension 7: Visibility Gate Enforcement — 10/10 (unchanged from Sprint 845)

No changes to visibility gate enforcement in Sprints 849–854. All three enforcement layers verified intact. No new data paths expose private data to unauthorized roles.

---

### Dimension 8: DONNA Integration Quality — 9.5/10 (was 9/10, +0.5 from Sprints 849–854)

- Sprint 849: `player-notes-tab` stable always-in-DOM anchor ✅
- Sprint 850: intent-aware dispatcher activates `player-notes-tab` for notes/priority/evidence ✅
- Sprint 852: route-aware chips on player profile ✅
- Sprint 854: priority-aware chip labels with real title/level/count from typed context injection ✅

DONNA now has a complete guidance chain on player profiles: arrive at `player-profile-header`, intent-navigate to `player-notes-tab`, see real priority data in chips, navigate to notes or review queue.

**Remaining gaps (low):**
- Teal highlight cannot fire on query-string tab changes (path-routing change required)
- DONNA attention context not live-requeried per interaction

---

### Dimension 9: Coach-to-Director Evidence Handoff — 8/10 (unchanged from Sprint 845)

No sprints in this cycle touched evidence handoff or `draftSummaryUpdateAction`.

**Remaining gap (low):** `draftSummaryUpdateAction` fetches only `is_private = true` observations. Non-private coach notes excluded from development summary drafts.

---

### Dimension 10: Loop Closure and Attribution — 9.5/10 (was 9/10, +0.5 from Sprints 851+854)

- Sprint 843/844: named approver + applied date on active priority cards ✅
- Sprint 851: "View in review queue →" link from active priority to originating draft (fallback to Player Updates tab) ✅
- Sprint 854: DONNA chips show real priority data → loop awareness in DONNA panel improved ✅

**Remaining gap (low):** Direct `proposed_action_id` deep-link not available (schema change required).

---

## Score Comparison

| Dimension | Sprint 833 | Sprint 845 | Sprint 855 | Delta 845→855 |
|---|---|---|---|---|
| 1. Signal source completeness | 8/10 | 9/10 | 9/10 | 0 |
| 2. Data freshness and accuracy | 7/10 | 7/10 | 7/10 | 0 |
| 3. Director-to-player navigation | 8/10 | 9/10 | 9.5/10 | +0.5 |
| 4. Priority recommendation quality | 8/10 | 8/10 | 8/10 | 0 |
| 5. Approve → apply path completeness | 5/10 | 9/10 | 9.5/10 | +0.5 |
| 6. Player-facing priority surface | 9/10 | 9/10 | 9/10 | 0 |
| 7. Visibility gate enforcement | 10/10 | 10/10 | 10/10 | 0 |
| 8. DONNA integration quality | 7/10 | 9/10 | 9.5/10 | +0.5 |
| 9. Coach-to-director evidence handoff | 8/10 | 8/10 | 8/10 | 0 |
| 10. Loop closure and attribution | 6/10 | 9/10 | 9.5/10 | +0.5 |
| **Total** | **76/100** | **87/100** | **89/100** | **+2** |

**Delta 833→855: +13 points**
**Delta 845→855: +2 points** (across Sprints 849–854)

---

## Gap Resolution Table (Sprints 849–855)

| Gap | Sprint 845 severity | Sprint fixed | Status |
|---|---|---|---|
| No `player-notes-tab` DOM anchor | Low | Sprint 849 | ✅ CLOSED |
| Dispatcher didn't distinguish generic vs notes-intent navigation | Low | Sprint 850 | ✅ CLOSED |
| No "View in review queue →" link from active priority | Low | Sprint 851 | ✅ CLOSED |
| Player DONNA chips static (route-aware only, no data) | Low | Sprint 852 | ✅ PARTIALLY CLOSED (route-aware; data injection deferred) |
| Player DONNA chips data-static (no priority title/count in labels) | Low | Sprint 854 | ✅ CLOSED |

---

## Remaining Gaps (All Low Priority)

| Gap | Dimension | Source | Resolution path |
|---|---|---|---|
| DONNA context not live-requeried per interaction | 2 | Sprint 833 | DONNA infrastructure sprint (live context queries) |
| DONNA attention answers link to player list not specific player | 3, 8 | Sprint 833 | `directorPlayersDonnaIntelligence.ts` change |
| `draftSummaryUpdateAction` is_private filter | 9 | Sprint 833 | Remove `is_private` filter |
| Machine-assembled recommendation strings | 4 | Sprint 833 | Director editing UX improvement |
| Teal highlight can't fire on query-string tab change | 3, 8 | Sprint 852 | Path-segment tab routing (deferred) |
| Direct `proposed_action_id` deep-link | 5, 10 | Sprint 851 | Schema migration (nullable column) |
| Active priority caveat text mildly ambiguous | 10 | Sprint 833 | Copy edit |

No gap blocks a director demo. All are architectural, copy, or polish items.

---

## Safety Audit

| Guarantee | Status |
|---|---|
| No player level movement | ✅ |
| No parent/player messages | ✅ |
| No auto-approval | ✅ |
| No review queue bypass | ✅ |
| No official priority change from player profile | ✅ |
| No schema changes | ✅ |
| No RLS weakening | ✅ |
| No private note in chip labels | ✅ |
| No service role | ✅ |
| audit_logs provenance preserved | ✅ |
| Player portal content gates intact | ✅ |
| DonnaSessionContext data is director-only | ✅ |
| Stale Player A context cleared on navigation | ✅ |

**Safety result: ✅ FULLY SAFE — All guardrails intact**

---

## Director Demo Story (Post-Sprint 855)

The full player priority loop can be demonstrated without caveats:

1. **Signal detection:** "Show me who needs attention" → DONNA names players with concern/injury/behavioral flags (Sprint 842)
2. **Navigation:** Director opens player profile → DONNA highlights `player-profile-header` on arrival (Sprint 841); DONNA can highlight `player-notes-tab` for notes/priority/evidence commands (Sprints 849+850)
3. **DONNA chip awareness:** Director opens DONNA panel on player profile → chips show "View: Technical Skill (high)" and "Show priorities (2)" using real priority data (Sprint 854)
4. **Draft generation:** Director generates recommendation → draft appears with "Review / Approve in Review Queue →" (Sprint 840)
5. **Approval:** Director approves in review queue → status updates to "approved" → CTA updates to "Apply in Review Queue →"
6. **Application:** Director applies → `player_priorities` row inserted → `audit_logs` written
7. **Attribution:** Director returns to player profile → active priority shows "Approved by [Name] · Applied [date]" + "View in review queue →" (Sprints 843/844/851)
8. **DONNA awareness:** On next visit, DONNA chip shows real priority title and level (Sprint 854)

---

## Certification Decision

### ✅ STRONG — MINOR POLISH REMAINS, BUT READY FOR DONNA /GOAL

**Score:** 89/100 (up from 76/100 at Sprint 833; up from 87/100 at Sprint 845)

**Rationale:**

**Why STRONG rather than 90+ CERTIFIED:**
- Dimension 2 (Data Freshness) holds at 7/10 — DONNA attention context is not live-requeried per interaction. This is a structural gap requiring DONNA infrastructure work that belongs in the DONNA /goal block, not a Player Priority sprint. It cannot be closed without a broader architectural change.
- The remaining score gap to 90 is one point — achievable by live context requeries or attention answer deep-linking, both of which are DONNA-scope improvements.

**Why READY FOR DONNA /GOAL:**
- All Sprint 833 critical and medium gaps are closed.
- The complete priority loop — signal → profile → DONNA guidance → draft → approval → apply → attribution + back-link — is UX-connected and director-trustworthy.
- DONNA is now context-aware on player profiles (real priority title/level/count in chips).
- Remaining gaps are all low priority, architectural, or copy polish. None block a director demo or the DONNA /goal work.
- The Player Priority loop will benefit directly from DONNA /goal sprints (live context queries, attention answer deep-linking) — there is no reason to delay.

**Does Dimension 2 block the DONNA /goal?** No. The DONNA /goal block is the natural home for live context requeries. Starting DONNA /goal work now means Dimension 2 will improve as a side effect of broader DONNA architectural improvements, without needing a dedicated Player Priority re-sprint.

---

## Files Created

### `docs/PLAYER_PRIORITY_90_CERTIFICATION_855.md`

This file.

---

## Files Modified

None — audit only.

---

## Recommended Next Steps

### Proceed to DONNA 10/10 /goal block

The Player Priority loop is certified strong at 89/100 and ready for the next phase. The remaining gaps (Dim 2 freshness, Dim 3/8 attention deep-link, Dim 9 observation scope) will all be addressed naturally within DONNA /goal sprints.

**Suggested first DONNA /goal sprint:** DONNA Live Context Query V1 — implement a per-panel-open context refresh query that re-fetches the current page's data into `DirectorDonnaContext`. This would close Dim 2 to ~9/10 and increase the Player Priority loop score to ~91/100 as a side effect.

**Alternative first sprint:** DONNA Attention Answer Deep-link V1 — change `directorPlayersDonnaIntelligence.ts` to link to `/director/players/${playerId}` instead of `/director/players` when a specific player is named. This closes a Dim 3/8 gap cleanly with minimal risk.
