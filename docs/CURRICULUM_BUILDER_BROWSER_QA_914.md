# Curriculum Builder Browser QA
Sprint 914 — 2026-05-18

Note: This QA was conducted via code inspection and TypeScript compilation. No live browser session available. Items marked [CODE] are verified from source. Items marked [RUNTIME] require a running browser to confirm.

---

## Route Verification

All routes confirmed as `page.tsx` files:

| Route | File | Status |
|---|---|---|
| `/director/curriculum/builder` | `builder/page.tsx` | ✓ EXISTS |
| `/director/curriculum/map` | `map/page.tsx` | ✓ EXISTS |
| `/director/curriculum/guided` | `guided/page.tsx` | ✓ EXISTS |
| `/director/curriculum/level/[levelId]` | `level/[levelId]/page.tsx` | ✓ EXISTS |
| `/director/curriculum/level/[levelId]/impact` | `level/[levelId]/impact/page.tsx` | ✓ EXISTS |
| `/director/curriculum/builder/add-drill` | `builder/add-drill/page.tsx` | ✓ EXISTS |
| `/director/curriculum/builder/add-fitness` | `builder/add-fitness/page.tsx` | ✓ EXISTS |
| `/director/curriculum/builder/impact-preview` | `builder/impact-preview/page.tsx` | ✓ EXISTS |

---

## Primary Button QA

### Curriculum Map
| Button | Expected action | Status |
|---|---|---|
| Level card click | Routes to `/director/curriculum/level/[id]` | ✓ [CODE] |
| "Start Guided Review" | Routes to `/director/curriculum/guided` | ✓ [CODE] |
| Back arrow | Routes to `/director/curriculum/builder` | ✓ [CODE] |
| DONNA "Start from Red Ball 1" chip | Routes to `/director/curriculum/guided` | ✓ [CODE] |

### Guided Review
| Button | Expected action | Status |
|---|---|---|
| "Keep as-is" | Marks current level as reviewed, advances | ✓ [CODE] |
| "Modify this level" | Routes to `/director/curriculum/level/[id]` | ✓ [CODE] |
| "Skip this level" | Marks as skipped, advances | ✓ [CODE] |
| "Ask DONNA to improve it" | Toggles DONNA panel activeAction | ✓ [CODE] |
| "Previous" | Decrements currentIndex | ✓ [CODE] |
| "Jump to another level" | Opens jump modal | ✓ [CODE] |
| Progress rail dots | tooltip on hover | ✓ [CODE] |
| Back arrow | Routes to `/director/curriculum/map` | ✓ [CODE] |

### Level Builder
| Button | Expected action | Status |
|---|---|---|
| Back arrow | Routes to `/director/curriculum/map` | ✓ [CODE] |
| "Preview Impact" | Routes to `/director/curriculum/level/[id]/impact` | ✓ [CODE] |
| "Back to Review" | Routes to `/director/curriculum/guided` | ✓ [CODE] |
| "Ask DONNA" (per section) | Opens inline DONNA draft panel | ✓ [CODE] |
| "Add" (per section) | Opens inline DONNA draft panel | ✓ [CODE] |
| "Advanced Editor" toggle | Expands collapsible section | ✓ [CODE] |

### Add Drill
| Button | Expected action | Status |
|---|---|---|
| Back arrow | Routes to `/director/curriculum/map` | ✓ [CODE] |
| Example prompt click | Populates textarea | ✓ [CODE] |
| "Generate draft with DONNA" | Shows draft card (local state) | ✓ [CODE] |
| "Save Draft" (draft card) | Local state only — no backend write | ✓ [CODE] |
| "Preview Impact" (draft card) | Routes to `/director/curriculum/builder/impact-preview` | ✓ [CODE] |
| "Cancel" (draft card) | Resets to input state | ✓ [CODE] |

### Add Fitness
| Button | Expected action | Status |
|---|---|---|
| Back arrow | Routes to `/director/curriculum/map` | ✓ [CODE] |
| Example prompt click | Populates textarea | ✓ [CODE] |
| "Generate draft with DONNA" | Shows draft card (local state) | ✓ [CODE] |
| "Save Draft" | Local state only | ✓ [CODE] |
| "Add to Another Level" | Shell — no action yet | ✓ [CODE — labeled as shell] |
| "Cancel" | Resets state | ✓ [CODE] |

### Impact Preview
| Button | Expected action | Status |
|---|---|---|
| Back arrow | Returns to `backHref` (add-drill or level page) | ✓ [CODE] |
| "Apply to this level only" | Disabled — "Goes to Review Queue" badge | ✓ [CODE] |
| "Apply to all groups" | Disabled | ✓ [CODE] |
| "Apply academy-wide" | Disabled | ✓ [CODE] |
| "Save as Draft" | Toggles `draftSaved` local state | ✓ [CODE] |
| "Cancel" | Routes back via `backHref` | ✓ [CODE] |

---

## TypeScript Status

**CLEAN** — `npx tsc --noEmit` exits with no errors.

---

## Known Limitations (Runtime — unverified without browser)

- Cannot confirm animated transitions render correctly
- Cannot confirm `animate-fade-in` CSS class is defined
- Cannot confirm Supabase auth redirects work in dev environment
- Cannot confirm progress rail horizontal scroll gesture on actual touch device
- Cannot confirm sticky DONNA panel scrolls correctly at all content heights
- The `CurriculumJumpToLevelModal` render position (inside flex wrapper) — confirm no z-index issue [RUNTIME]

---

## No Runtime Errors Expected From

- All imports are resolved (TypeScript clean)
- No undefined prop access (types checked)
- No server/client boundary violations (all client components marked `'use client'`)
- No direct DB writes from any curriculum builder UI
