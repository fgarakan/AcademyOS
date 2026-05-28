# Package 04 — New Student Placement Engine
**Status:** Draft v1.0

## Contents
| File | Purpose |
|---|---|
| `NEW_STUDENT_PLACEMENT_ENGINE_SPEC.md` | Complete V1 placement flow spec |
| `PLACEMENT_ENGINE_USER_FLOW.md` | Screen-by-screen flow (TODO) |
| `PLACEMENT_ASSESSMENT_RUBRIC.md` | Scoring rubric for all 4 layers (TODO) |
| `RECOMMENDATION_LOGIC.md` | Rules for track/level/group assignment (TODO) |
| `OVERRIDE_AND_APPROVAL_WORKFLOW.md` | Override patterns and approval UI (TODO) |
| `PLAYER_ACTIVATION_LOGIC.md` | What finalize_player_placement() does (TODO) |
| `PLACEMENT_TESTING_CHECKLIST.md` | QA checklist for placement flow (TODO) |

## V1 placement flow
1. Create player shell → 2. Run assessment (4 layers) → 3. Coach notes → 4. AI recommendation →
5. Director review → 6. Approve/override → 7. finalize_player_placement() → 8. Baseline locked
