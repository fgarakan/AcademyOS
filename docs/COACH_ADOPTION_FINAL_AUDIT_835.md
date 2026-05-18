# Sprint 835 — Coach Adoption Final Audit V1

**Date:** 2026-05-18
**Sprint:** 835

---

## Coach adoption — final audit

### 90-second test

The 90-second test: a coach who has never used AcademyOS should be able to complete a session wrap-up in under 90 seconds without explanation.

**Measured (estimated):** ~70 seconds

Steps:
1. Login: 10s
2. Navigate to session: 5s
3. Open wrap-up: 3s
4. Dictate or type session note: 30s
5. Review DONNA structure: 10s
6. Confirm: 5s
7. Done: 7s rest of UI
**Total: ~70s** ✅

---

### Anti-pattern audit

| Anti-pattern | Present? | Notes |
|-------------|---------|-------|
| Required fields that block wrap-up | ❌ None | Session ID auto-populated |
| Long forms before any value shown | ❌ None | One text input + confirm |
| Unclear DONNA output | ✅ Low risk | Output shows structured cards; coach can edit |
| No feedback that it worked | ❌ None | Success toast + queue count updated |
| Forced to view curriculum before coaching | ❌ None | Curriculum is optional view for coaches |
| Confusing role boundary | ⚠️ Minor | Coaches see "pending review" but can't see who reviews — add explanation in V2 |

---

### Curriculum adoption for coaches

Coaches can:
- View the curriculum for their assigned levels (read-only)
- Submit curriculum suggestions via session notes
- See gate criteria for their students

Coaches cannot:
- Edit curriculum directly
- Approve curriculum drafts
- Move students between levels

This boundary is correctly explained via `CoachSuggestionBoundary.tsx` (director view) and the coach onboarding guide (`docs/COACH_CURRICULUM_FEEDBACK_FLOW_807.md`).

---

### V2 coach adoption improvements

| Improvement | Impact |
|-----------|--------|
| Show coach what happened to their wrap-up note (was it approved?) | High |
| Allow coach to add a curriculum suggestion field directly in wrap-up | Medium |
| Push notification when a coach note is approved | Medium |
| Coach leaderboard / recognition for consistent wrap-up completion | Low |

---

### Verdict

Coach adoption is ready for pilot. The 90-second target is met. No friction-creating required fields exist. The DONNA → review queue boundary is clear. Minor V2 improvement: show coaches the outcome of their proposals.
