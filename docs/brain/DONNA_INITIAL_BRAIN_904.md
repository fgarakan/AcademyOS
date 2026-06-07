# DONNA Initial Brain — Architecture & Entry Map

**Sprint:** Mega Sprint 904–933B
**Date:** 2026-06-07
**File:** `src/lib/donna/brain/initialBrainSeed.ts`
**Governance:** `src/lib/donna/brain/donnaBrainGovernance.ts`
**Audit:** `docs/qa/DONNA_BRAIN_INVENTORY_AUDIT_904.md`

---

## Summary

The Initial Brain is a **hardcoded TypeScript seed** of 21 `GlobalBrainEntry` records. Every entry traces to a specific existing source file. Nothing is invented.

This is not a new system. It is a consolidation of intelligence that was already scattered across ~170 DONNA files. The seed makes that intelligence explicit, canonical, and traceable.

| Category | Count |
|---|---|
| Vocabulary | 8 |
| Intent | 6 |
| Decision Rule | 4 |
| Philosophy | 3 |
| **Total** | **21** |

---

## Design Decisions

**Why hardcoded TypeScript and not a DB table?**
The Brain Governance contract (Sprint 874–903) defines DB-ready types but no migration was built. A hardcoded seed avoids a migration while establishing the canonical vocabulary. When a DB layer is added, `INITIAL_BRAIN_ENTRIES` becomes the migration seed data.

**Why a `SeedBrainEntry` extended type?**
`GlobalBrainEntry` has no `source` field (by design — it is a runtime contract). Source attribution is seed-file-only metadata. `SeedBrainEntry` adds it without polluting the runtime schema. `INITIAL_BRAIN_ENTRIES` strips source attribution for runtime consumers.

**Why not wire to `processDonnaMessage.ts` yet?**
The intent and vocabulary entries document what already exists — they do not change the routing logic. The wiring step (injecting `INITIAL_BRAIN_ENTRIES` into `donnaKnowledgeContextAdapter.ts`) is a separate sprint to avoid touching the brain routing chain here.

---

## Entry Map — All 21 Entries

### Vocabulary (8 entries)

| ID suffix | Key | Source file | Source symbol |
|---|---|---|---|
| …0001 | `vocabulary.group` | `lib/donna/academyKnowledge/index.ts` | `AcademyKnowledgeArea 'groups'` |
| …0002 | `vocabulary.session` | `lib/donna/donnaCommandRouter.ts` | `DonnaCommandCategory 'session_actual'` |
| …0003 | `vocabulary.wrap_up` | `lib/donna/intent/donnaIntentEngine.ts` | `session_review signals` |
| …0004 | `vocabulary.level` | `lib/donna/entity/donnaEntityResolver.ts` | `BALL_COLORS, EntityKind curriculum_level` |
| …0005 | `vocabulary.template` | `components/assistant/donnaTaskContracts.ts` | `DonnaTaskId 'create_class_template'` |
| …0006 | `vocabulary.coach` | `lib/donna/academyKnowledge/index.ts` | `AcademyKnowledgeArea 'staff'` |
| …0007 | `vocabulary.player` | `lib/donna/academyKnowledge/index.ts` | `AcademyKnowledgeArea 'players'` |
| …0008 | `vocabulary.proposed_action` | `lib/donna/donnaCommandRouter.ts` | `DonnaRouteResult.requiresDirectorApproval` |

### Intent (6 entries)

| ID suffix | Key | Source file | Source symbol |
|---|---|---|---|
| …0001 | `intent.review_queue` | `lib/donna/brain/processDonnaMessage.ts` | `isReviewQueuePhrase()` |
| …0002 | `intent.daily_brief` | `lib/donna/donnaIntentClassifier.ts` | `matchesDailyBriefIntent(), DAILY_BRIEF_PATTERNS` |
| …0003 | `intent.academy_attention` | `lib/donna/brain/processDonnaMessage.ts` | `isAttentionPhrase()` |
| …0004 | `intent.today_guidance` | `lib/donna/guidance/donnaTodayGuidanceLoop.ts` | `detectTodayGuidanceQuestion()` |
| …0005 | `intent.coo_intelligence` | `lib/donna/brain/processDonnaMessage.ts` | `isCOOIntelligencePhrase(), Step 7.5` |
| …0006 | `intent.continuity` | `lib/donna/memory/donnaGoalMemory.ts` | `isContinuityPhrase()` |

### Decision Rule (4 entries)

| ID suffix | Key | Source file | Source symbol | Verbatim value |
|---|---|---|---|---|
| …0001 | `decision_rule.player_stall_medium` | `lib/donna/playerProgressStallDetector.ts` | `STALL_THRESHOLD_MEDIUM_DAYS` | `= 90` |
| …0002 | `decision_rule.player_stall_high` | `lib/donna/playerProgressStallDetector.ts` | `STALL_THRESHOLD_HIGH_DAYS` | `= 180` |
| …0003 | `decision_rule.assessment_overdue` | `lib/donna/dataQualityGuardian.ts` | `90 days assessment threshold` | `'last 90 days'` |
| …0004 | `decision_rule.mutation_requires_approval` | `lib/donna/donnaCommandRouter.ts` + `CLAUDE.md` | `DonnaRouteResult.requiresDirectorApproval` | `'proposals only'` |

### Philosophy (3 entries)

| ID suffix | Key | Source file | Source symbol | Verbatim |
|---|---|---|---|---|
| …0001 | `philosophy.voice_creates_ui_confirms` | `CLAUDE.md` | Operating model block | `Voice creates → UI confirms → Database structures → System executes` |
| …0002 | `philosophy.ai_proposes_director_approves` | `CLAUDE.md` | Core operating model — never violate | `AI proposes → Director/Head Coach approves → System records → System executes` |
| …0003 | `philosophy.data_never_invented` | `lib/donna/conversation/index.ts` | `DONNA_CONVERSATION_RULES[4]` | `Say "I don't have enough data" when uncertain — never invent.` |

---

## Related-Keys Graph

```
vocabulary.group ←→ vocabulary.session
                 ←→ vocabulary.coach
                 ←→ vocabulary.player
                 ←→ vocabulary.level

vocabulary.session ←→ vocabulary.template
                   ←→ vocabulary.wrap_up

vocabulary.wrap_up ←→ vocabulary.proposed_action

vocabulary.proposed_action ←→ decision_rule.mutation_requires_approval
                            ←→ philosophy.ai_proposes_director_approves

vocabulary.player ←→ decision_rule.player_stall_medium
                   ←→ decision_rule.player_stall_high
                   ←→ decision_rule.assessment_overdue

decision_rule.mutation_requires_approval ←→ philosophy.ai_proposes_director_approves
                                          ←→ philosophy.voice_creates_ui_confirms

philosophy.voice_creates_ui_confirms ←→ philosophy.ai_proposes_director_approves

intent.review_queue    ←→ intent.academy_attention
intent.daily_brief     ←→ intent.today_guidance
                        ←→ intent.academy_attention
intent.coo_intelligence ←→ intent.academy_attention
                          ←→ intent.today_guidance
```

---

## Governance Compliance

| Rule | Status |
|---|---|
| Every entry has a stable ID | ✓ — format `b1a00000-{cat}-4000-8000-{seq}` |
| Every entry has a canonical key | ✓ — format `{type}.{slug}` |
| Every entry has a definition | ✓ — all 21 |
| Every entry has examples | ✓ — all 21 |
| Every entry has related keys | ✓ — all 21 |
| Every entry has source attribution | ✓ — via `SeedBrainEntry.source` |
| No speculative content | ✓ — all entries traced to existing code or CLAUDE.md |
| No entries without verbatim or structural basis | ✓ |
| `status: 'active'` for all seed entries | ✓ |
| `promotedBy: 'system-initial-seed'` marks seed origin | ✓ |

---

## Owner and Scope

| Field | Value |
|---|---|
| Owner | Platform owner (`system-initial-seed` for initial population) |
| Scope | Global Brain — applies across all academies |
| Layer | Layer 1 of the 5-layer governance model |
| Can be read by | All roles (platform_owner, academy_director, head_coach, coach, donna) |
| Can be written by | Platform owner only |
| Can be aliased by | `academy_director` via AcademyAlias entries (not yet built) |

---

## What Is Not In The Seed (Intentionally)

| Excluded | Reason |
|---|---|
| Academy-specific rules | Belong in Layer 2 (AcademyKnowledgeEntry), not Layer 1 |
| Player names, coach names | Entity data, not brain vocabulary |
| Session history, attendance data | Live DB data, not brain knowledge |
| Curriculum level content | Curriculum library, not Global Brain |
| New intents not yet in runtime | Out of scope — only existing detectors |
| Knowledge Inbox entries | No Inbox runtime built yet |
| Learning/ingestion/memory | Explicitly excluded from 904–933 scope |

---

## Next Steps (Not In This Sprint)

1. Wire `INITIAL_BRAIN_ENTRIES` into `donnaKnowledgeContextAdapter.ts` as the first live retrieval path
2. Build `AcademyKnowledgeEntry[]` for Dabul Tennis Academy (academy-specific Layer 2 seed)
3. Add DB migration when persistence is needed for academy-created entries
4. Build platform owner Inbox review UI when DONNA begins suggesting new entries
