# DONNA Knowledge Promotion Engine V1 — Sprint Report
**Sprint:** 2891–2920
**Date:** 2026-06-16
**Status:** COMPLETE — 100% Certified, TypeScript Clean

---

## Mission

Build the promotion pipeline that converts approved learning into official DONNA knowledge.

**Guiding principle:**
> Learning is not truth. Approved learning becomes knowledge. AcademyOS remains the source of truth. OpenAI may assist. OpenAI may not approve. OpenAI may not promote.

---

## Pipeline Overview

```
ConversationLearningRecord
         ↓
    LearningEntry (Learning Ledger)
         ↓  [eligibility check — 9 gates]
KnowledgePromotionCandidate (status: candidate)
         ↓  [director places in review]
KnowledgePromotionCandidate (status: in_review)
         ↓  [named approver: academy_director / owner / brian_dabul]
KnowledgePromotionCandidate (status: approved)
         ↓  [DonnaKnowledgeTargetRouter — human-triggered]
ApprovedKnowledgeEntry in DonnaApprovedKnowledgeRegistry
         ↓  [retrievable by DONNA for answers]
KnowledgeReuseItem (with source trace)
```

No step is automatic. Every promotion requires a named human approver.

---

## Files Created

### `src/lib/donna/knowledgePromotion/`

| File | Purpose |
|---|---|
| `knowledgePromotionCandidateModel.ts` | Candidate type, 6-status machine, 7 target scopes, score computation, factory |
| `donnaPromotionEligibilityEngine.ts` | 9 eligibility gates — blocks low-quality, duplicate, contradicted entries |
| `donnaKnowledgeDraftGenerator.ts` | Draft generator (system or OpenAI advisory — never approves) |
| `donnaKnowledgeApprovalWorkflow.ts` | Approval workflow: 6 actions, permission model, status transitions |
| `donnaApprovedKnowledgeRegistry.ts` | In-memory registry singleton — only promoted entries; full audit trail |
| `donnaKnowledgeTargetRouter.ts` | Routes approved candidates to registry; handles supersede; returns receipt |
| `brianKnowledgePromotionProfile.ts` | Brian Promoted Knowledge Influence Score (BPKIS) + profile |
| `donnaKnowledgeReuseEngine.ts` | Retrieval for DONNA answers; scope ranking; source trace |
| `knowledgePromotionCertification.ts` | 36-test suite — 100% pass |
| `index.ts` | Barrel export |

---

## Key Design Decisions

### Knowledge Target Scopes (7)
| Scope | Approver Required |
|---|---|
| `academy_specific_knowledge` | Academy director |
| `curriculum_knowledge` | Academy director |
| `coach_standard_knowledge` | Academy director |
| `parent_communication_knowledge` | Academy director |
| `operating_model_knowledge` | Academy director |
| `brian_philosophy_knowledge` | Owner or `brian_dabul` only |
| `global_platform_knowledge_candidate` | Owner or `brian_dabul` only |

### Eligibility Gates (9)
All gates must pass for a LearningEntry to become a candidate:
1. `status` — must be `approved` or `promoted`
2. `learning_score` — must be ≥ 70
3. `not_duplicate` — must not be flagged as duplicate
4. `source_reliability` — must be ≥ 0.60
5. `frequency` — must have ≥ 1 observation
6. `has_evidence` — evidence ≥ 10 characters
7. `has_summary` — summary ≥ 15 characters
8. `has_concepts` — at least 1 AcademyOS concept tagged
9. `no_unresolved_contradiction` — no `needs_director_review` contradiction pair

### Brian Direct Trust
- `sourceType: 'brian_direct'` → `brian_philosophy_knowledge` scope
- Promotion score +10 boost (max 100)
- Requires `requiresBrianApproval: true`
- BPKIS measures Brian's influence in promoted knowledge (50% count + 50% score weight)

### Retrieval Priority (DONNA answers)
1. Brian philosophy knowledge (if `preferBrianPhilosophy=true`)
2. Academy-specific knowledge
3. Curriculum knowledge
4. Coach standard knowledge
5. Parent communication knowledge
6. Operating model knowledge
7. Global platform knowledge (only if `includeGlobal=true`)

Relevance scoring: concept match 40% + domain 25% + keyword 20% + reliability 15%

---

## Duplicate System Audit

The following pre-existing systems were audited and confirmed as distinct — no duplication:

| System | Location | Purpose |
|---|---|---|
| External knowledge | `src/lib/knowledge/` | ITF, USTA, research papers, coaching manuals |
| Player/curriculum promotion | `src/lib/donna/promotion/` | Player level advancement — unrelated |
| Knowledge area definitions | `src/lib/donna/academyKnowledge/` | Query routing definitions — not a registry |
| DONNA memory | `src/lib/donna/memory/` | Operational memory (proposed_actions) — different |

The Knowledge Promotion Engine (`src/lib/donna/knowledgePromotion/`) is the only internal-learning-to-operational-knowledge bridge.

---

## Privacy & Data Risks

- No PII stored in promotion candidates or registry entries
- No external API calls except OpenAI (draft generation only, advisory, no approval)
- No DB mutations — in-memory only (DB persistence is a future sprint)
- All registry entries trace back to their source LearningEntry (full audit chain)
- Rejected entries never appear in the registry — they remain only in the ledger

---

## Certification Results

**36/36 tests — 100% PASS**

| Test Group | Tests | Result |
|---|---|---|
| 1 — High-score Brian → candidate | 4 | ✓ |
| 2 — Low-score player → no promote | 3 | ✓ |
| 3 — Contradiction blocks promotion | 3 | ✓ |
| 4 — Duplicate → merge not new entry | 3 | ✓ |
| 5 — Owner approval promotes knowledge | 4 | ✓ |
| 6 — Rejected → no reuse | 3 | ✓ |
| 7 — Approved knowledge retrievable | 4 | ✓ |
| 8 — Academy-specific outranks global | 3 | ✓ |
| 9 — Brian profile updates | 4 | ✓ |
| 10 — Full traceability | 5 | ✓ |

---

## TypeScript Status

`npx tsc --noEmit` — **CLEAN** (0 errors)

---

## Recommended Next Sprint

**Sprint 2921–2950 — DONNA Knowledge Promotion UI V1**

Surface the Knowledge Promotion pipeline in the Director Dashboard:
- `KnowledgePromotionQueueCard` — director review queue for promotion candidates
- `KnowledgeApprovalModal` — approve / reject / request revision with reason
- `ApprovedKnowledgePanel` — browse promoted knowledge by scope/domain/concept
- `BrianPhilosophyCard` — Brian's promoted knowledge + BPKIS display

Or alternatively:

**Sprint 2921–2950 — DONNA Learning → Promotion Bridge V1**

Auto-nominate eligible LearningEntries as promotion candidates on approval, surface in director review queue, and wire the full pipeline to the Learning Ledger.

---

*No commit was made. Awaiting director approval to commit.*
