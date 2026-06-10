# Academy Onboarding — Product Lock Certification
**Sprint:** Mega Sprint 1715A — Academy Onboarding Final Product Lock V1  
**Date:** 2026-06-10  
**Status:** CERTIFIED — ready for Sprint 1715B implementation  
**References:**
- `docs/architecture/ACADEMY_ONBOARDING_QUESTION_AUDIT_FINAL.md`
- `docs/architecture/DONNA_ONBOARDING_CONVERSATION_PACK.md`
- `docs/architecture/ACADEMY_ONBOARDING_FINAL_SPEC.md`

---

## Certification Checklist

---

### ✅ 1. Every Question Changes System Behavior

**Check:** Each of the 10 required director decisions has a documented, measurable behavior change.

| Question | Behavior change | Pass? |
|---|---|---|
| Q1: Academy name | Namespaces all DONNA output | PASS |
| Q2: Player mix | 0.6× weight toward inferred model | PASS |
| Q3: Family priorities | 0.4× weight toward inferred model | PASS |
| Q4: Age groups | Determines active stages + curriculum levels | PASS |
| Q5: Curriculum starting point | Build now vs mapping-pending mode | PASS |
| Q6: Stage priorities | Per-stage assessment weights + curriculum emphasis | PASS |
| Q7: Technical vs tactical edge | Pathway weighting vector; stage-weight order adjustment | PASS |
| Q8: Session duration | Template `total_minutes`; coach time budgets | PASS |
| Q9: Advancement approval | Level gate strictness for all active levels | PASS |
| Q10: Parent transparency | All 5 parent portal visibility flags | PASS |

**Result: PASS — all 10 questions change system behavior**

---

### ✅ 2. Every Question Survived the Audit

**Check:** No question in the final flow was marked for removal in `ACADEMY_ONBOARDING_QUESTION_AUDIT_FINAL.md`.

**Audit outcome summary:**

| Decision | Verdict |
|---|---|
| Q1: Academy name | KEEP |
| Q2: Player mix | KEEP (new behavioral proxy) |
| Q3: Family priorities | KEEP (new behavioral proxy) |
| Q4: Age groups | KEEP |
| Q5: Curriculum starting point | KEEP |
| Q6: Stage priorities (confirm-or-swap) | KEEP — redesigned from 28 sliders |
| Q7: Technical vs tactical | KEEP |
| Q8: Session duration | KEEP |
| Q9: Advancement approval | KEEP — behavioral replacement for gate strictness picker |
| Q10: Parent transparency | KEEP — single abstraction replacing 5 individual toggles |

**Removed questions audit:**
- Model picker (5 options): REMOVED — behavioral inference is more accurate
- Location count: REMOVED — no V1 system effect
- Coaching style picker: REMOVED — DONNA assertion replaces it
- Dev priority stack (10-ranked): REMOVED — Q7 captures the non-derivable signal
- Coach communication voice: REMOVED — derivable from model
- Curriculum spine picker: REMOVED — DONNA assertion + Q5 replaces it
- Assessment cadence: DEFERRED — no launch-day effect
- Session blocks picker: REMOVED — DONNA visual preview replaces it
- Fitness template: DEFERRED — no launch-day effect
- Wrap-up expectations: REMOVED — triple derivation
- Parent communication style: REMOVED — derivable from model
- Parent visibility toggles (5 individual): REMOVED — Q10 preset bundle replaces
- Player mission style: DEFERRED — no effect until players exist
- Stage sliders (28 manual): REDESIGNED — confirm-or-swap defaults is the lowest-cognitive-load version that preserves the signal

**Result: PASS — all retained questions survived audit; all removed questions documented with reason**

---

### ✅ 3. Stage Weighting Decision Finalized

**Decision:** Include stage weighting in onboarding using a confirm-or-swap UX. Not manual sliders.

**Rationale documented in:** `ACADEMY_ONBOARDING_QUESTION_AUDIT_FINAL.md` § Stage Weighting Resolution

**Key points:**
- Per-stage weights drive curriculum emphasis, assessment scoring, and DONNA explanations per stage
- Model inference alone cannot produce per-stage granularity — two academies with the same model can have meaningfully different stage priorities
- 28 manual sliders have too high cognitive load with too low accuracy (directors guess; guesses are wrong)
- Confirm-or-swap defaults: cognitive load approaches zero (1 click per stage to confirm); customization is 2 clicks max per stage
- DONNA defaults grounded in developmental pedagogy (ITF play-learn-compete framework)
- Q7 (technical vs tactical) enriches stage weights without replacing them

**UX specification confirmed:**
- Per active stage from Q4
- DONNA shows top 2 priorities from model defaults
- Director: [Confirm] [Swap one] [Swap both]
- Weight distribution: Priority 1 = 30%, Priority 2 = 22%, remaining 48% from stage defaults
- Max 5 stages (Red/Orange/Green/Yellow/HP); Adult deferred

**Result: PASS — stage weighting finalized; approach documented and locked**

---

### ✅ 4. Curriculum Starting Point Finalized

**Decision:** Include in onboarding as Q5. Required. 2 active options.

**Options:**
1. **AcademyOS Curriculum** (recommended) — DONNA builds curriculum content on launch day
2. **Import My Curriculum** — DONNA creates level structure; curriculum content deferred to import mapping
3. **Partner Curriculum** (disabled) — Coming soon; shown but not selectable

**"Build Later" option:** Explicitly excluded. A curriculum baseline is required for DONNA to be useful from day one.

**Behavior fork documented:**
- AcademyOS → working curriculum on day one; recommendations at full confidence
- Import → mapping-pending state; recommendations marked lower confidence until mapped

**Result: PASS — curriculum starting point finalized and documented**

---

### ✅ 5. DONNA Conversation Requirements Finalized

**Check:** DONNA can have a full conversation about every onboarding section — not just FAQs.

**Requirements confirmed in:** `DONNA_ONBOARDING_CONVERSATION_PACK.md`

**DONNA must be able to answer 10 question types per section:**

| Question type | Documented? |
|---|---|
| "Why do you need this?" | PASS — documented for all 10 questions |
| "What changes if I answer X vs Y?" | PASS — behavior consequences shown after each answer |
| "Can I skip this?" | PASS — skip behavior documented; DONNA explains the default and asks for confirmation |
| "Can I change this later?" | PASS — post-launch location documented for all settings |
| "What does [term] mean?" | PASS — plain-language definitions for all 7 stage categories and all 4 model types |
| "I'm not sure — what would you recommend?" | PASS — DONNA gives a recommendation + one-sentence reasoning for ambiguous questions |
| "What does this mean for my coaches?" | PASS — documented in conversation pack for Q9 and coach invite section |
| "What does this mean for my parents?" | PASS — documented for Q10 |
| "What does this mean for player movement?" | PASS — documented for Q9 |
| "What does this mean for curriculum?" | PASS — documented for Q5 and Q6 |

**DONNA voice requirements confirmed:**
- No filler responses ("Great!", "Sure!", "Perfect!") — PASS
- Shows consequences after every answer — PASS
- Short sentences; one idea per sentence — PASS
- Never asks a question already answerable from prior signals — PASS
- Handles ambiguous answers with a "pick the closest" response — PASS

**Anti-patterns documented and prohibited** — PASS

**Result: PASS — DONNA conversation requirements finalized and documented**

---

### ✅ 6. Launch Review Finalized

**Check:** Phase 4 has a complete specification: checklist, DONNA summary, and launch action.

**Required checklist (9 items):** Documented in Final Spec. All 9 items are clear, binary, and testable.

**Launch button behavior:** Disabled until all 9 checklist items are green.

**"Meet Your Academy" moment:** Exact screen copy documented in Final Spec § The "Meet Your Academy" Moment. Covers:
- Academy identity summary
- Player development approach
- Stage priorities table
- Curriculum starting point
- Parent visibility
- Team composition

**What Launch writes:** Full `academy_dna` schema documented. Atomic write — no partial DB writes during onboarding. All writes in one server action at Launch.

**Classification reveal:** Shown at Launch Review as DONNA output only. Director sees it for the first time here. Never shown as a question or input.

**Result: PASS — launch review finalized with complete spec**

---

### ✅ 7. Final Onboarding Flow Locked

**Check:** The 4-phase flow is complete, consistent across all three documents, and contains no contradictions.

**Phase count:** 4 — Your Academy, Your Program, Your Team, Launch Review. No Phase 0. Phase 4 (Session Blueprint from blueprint) eliminated.

**Total director decisions:** 10 (Q1–Q10) — confirmed across Question Audit and Final Spec

**Total operational inputs:** 2 (group name+track required; coach invites optional)

**Total DONNA assertions:** 4 (model description, curriculum levels confirmation, coaching style, session block preview)

**Consistency check:**

| Item | Question Audit | Conversation Pack | Final Spec | Consistent? |
|---|---|---|---|---|
| Q1 Academy name | Q1 | ✓ | Q1 Phase 1 | PASS |
| Q2 Player mix | Q2 | ✓ | Q2 Phase 1 | PASS |
| Q3 Family priorities | Q3 | ✓ | Q3 Phase 1 | PASS |
| Q4 Age groups | Q4 | ✓ | Q4 Phase 1 | PASS |
| Q5 Curriculum starting point | Q5 | ✓ | Q5 Phase 2 | PASS |
| Q6 Stage priorities | Q6 | ✓ | Q6 Phase 2 | PASS |
| Q7 Technical vs tactical | Q7 | ✓ | Q7 Phase 2 | PASS |
| Q8 Session duration | Q8 | ✓ | Q8 Phase 2 | PASS |
| Q9 Advancement approval | Q9 | ✓ | Q9 Phase 2 | PASS |
| Q10 Parent transparency | Q10 | ✓ | Q10 Phase 3 | PASS |

**Result: PASS — final flow is locked, consistent, and contains no contradictions**

---

### ✅ 8. Ready for Implementation

**Check:** All requirements are documented at a level of specificity that allows Sprint 1715B to begin without further design work.

**Implementation readiness checklist:**

| Requirement | Status |
|---|---|
| All 10 questions have exact options, types, and mappings | PASS |
| DONNA inference tables (model, coaching style, portal rules, gate strictness) are complete | PASS |
| Stage weight distribution formula is defined | PASS |
| DONNA default top-2 per stage by model are defined | PASS |
| `academy_dna` schema is fully specified with all field names and types | PASS |
| `onboarding_completed_at` signal and its effect on Setup Mode is defined | PASS |
| Setup Mode behavior (suppressed items + shown items) is defined | PASS |
| Launch Review checklist (9 items) is specified | PASS |
| "Meet Your Academy" screen copy is written with exact template | PASS |
| What Launch action writes to DB is fully specified | PASS |
| Backward compatibility for existing academies is defined | PASS |
| Deferred items and their post-launch locations are documented | PASS |
| DONNA conversational responses are written for all 10 questions | PASS |
| Anti-patterns and voice guidelines are documented | PASS |
| No open design questions that would block implementation | PASS |

**Remaining open questions** (D1–D6 from Product Review): All have V1 decisions. None block implementation.

**Result: PASS — ready for Sprint 1715B implementation**

---

## Certification Summary

| Check | Result |
|---|---|
| 1. Every question changes behavior | ✅ PASS |
| 2. Every question survived audit | ✅ PASS |
| 3. Stage weighting finalized | ✅ PASS |
| 4. Curriculum starting point finalized | ✅ PASS |
| 5. DONNA conversation requirements finalized | ✅ PASS |
| 6. Launch review finalized | ✅ PASS |
| 7. Final onboarding flow locked | ✅ PASS |
| 8. Ready for implementation | ✅ PASS |

**All 8 checks PASS.**

**Mega Sprint 1715A is certified complete.**  
**Sprint 1715B (implementation) may begin.**

---

## Documents Produced in This Sprint

| Document | Location | Purpose |
|---|---|---|
| ACADEMY_ONBOARDING_QUESTION_AUDIT_FINAL.md | `docs/architecture/` | Audit of all questions; stage weighting resolution; curriculum starting point resolution; locked question set |
| DONNA_ONBOARDING_CONVERSATION_PACK.md | `docs/architecture/` | Full DONNA conversational spec for all onboarding sections |
| ACADEMY_ONBOARDING_FINAL_SPEC.md | `docs/architecture/` | Implementation source of truth: 4-phase flow, 10 questions, inference tables, schema, setup mode, launch moment copy |
| ACADEMY_ONBOARDING_PRODUCT_LOCK_CERTIFICATION.md | `docs/qa/` | This document |

---

## No Code. No UI. No Database Changes.

This sprint produced design and specification documents only.

All implementation is deferred to Sprint 1715B.
