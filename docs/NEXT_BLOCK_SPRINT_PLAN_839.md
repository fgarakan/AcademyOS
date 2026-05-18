# Sprint 839 — Next Block Sprint Plan V1

**Date:** 2026-05-18
**Sprint:** 839

---

## Next sprint block recommendation

**Block title:** Sprints 841–900 — Curriculum V2 Wiring + Pilot Feedback Integration Block

**Primary goals:**
1. Wire DONNA curriculum drafts to `proposed_actions` (the single highest-value V2 item)
2. Integrate feedback from the Brian Dabul pilot into product improvements
3. Begin the post-pilot second-academy onboarding flow

---

## Recommended sprint sequence

### Curriculum V2 wiring (841–848)

| Sprint | Title |
|--------|-------|
| 841 | Curriculum Server Actions Foundation V1 |
| 842 | DONNA Drill Draft → proposed_actions Wire V1 |
| 843 | DONNA Gate Draft → proposed_actions Wire V1 |
| 844 | DONNA Fitness Draft → proposed_actions Wire V1 |
| 845 | Curriculum Change Queue Live Feed V1 |
| 846 | Review Queue Curriculum Filter V1 |
| 847 | Curriculum Draft Error Handling V1 |
| 848 | Curriculum V2 Wire E2E QA V1 |

### Pilot feedback integration (849–860)

To be defined after retrospective from first pilot. Placeholder sprints:

| Sprint | Title |
|--------|-------|
| 849 | Pilot Feedback Triage V1 |
| 850 | [Top friction fix 1] |
| 851 | [Top friction fix 2] |
| 852 | [Top friction fix 3] |
| 853–860 | Second academy onboarding flow |

### Director sidebar navigation (861–864)

| Sprint | Title |
|--------|-------|
| 861 | Director Sidebar Curriculum Nav Link V1 |
| 862 | Director Sidebar Quick Actions V1 |
| 863 | Director Sidebar Alert Badge V1 |
| 864 | Sidebar Polish and Mobile QA V1 |

---

## Prerequisites before starting next block

1. ✅ Pilot has been run (or explicitly skipped)
2. ✅ Retrospective complete
3. ✅ `docs/POST_V1_BACKLOG_PRIORITY_804.md` reviewed and Tier 1 confirmed
4. ✅ Supabase database is healthy (no paused project)
5. ✅ `CURRENT_BUILD_TARGET.md` updated to reflect next block goal

---

## Hard rules for next block (unchanged)

All rules from the current block apply. No new exceptions without explicit sprint approval.
- No co-author footer
- No migrations unless explicitly approved
- `assertNotPreviewMode()` in every server action that writes curriculum data
- No auto-approval
- DONNA proposes; humans approve; system applies
