# DONNA Context Registration Certification V1

**Sprint:** Mega Sprint 1681–1690
**Date:** 2026-06-03
**Scope:** Context registration by page; "Hey Donna" awareness matrix

---

## How Context Registration Works

DONNA gets page context from two layers:

**Layer 1 — Automatic (pathname tracking):**
`DonnaSessionContextProvider` tracks pathname on every route change. `buildDonnaLiveContext()` maps pathname to `pageLabel` and `pageIntent` via `donnaPageContextEngine.getPageCapabilityMap()`. Every page gets page-level context automatically.

**Layer 2 — Explicit (entity registration):**
Pages with specific entities (player profile, curriculum level) must register the entity label into `DonnaSessionContext` so DONNA can reference it by name.

---

## Context Registration Matrix

| Page | Automatic Pathname Context | Explicit Entity Registration | Entity Label Available | Status |
|---|---|---|---|---|
| `/director` | ✓ "Director Dashboard" | — | — | PASS |
| `/director/attention` | ✓ "Attention Queue" | — | — | PASS |
| `/director/players` | ✓ "Players" | — | — | PASS |
| `/director/players/{id}` | ✓ "Player Profile" | `PlayerProfileDonnaRegistrar` (Sprint 854) | Player name via `lastObjectLabel` | PASS |
| `/director/curriculum` | ✓ "Curriculum" | — | — | PASS |
| `/director/curriculum?improve={levelKey}` | ✓ "Curriculum" | `CurriculumDonnaRegistrar` (Sprint 1681) | Level label e.g. "Orange Ball 2" | **PASS (new)** |
| `/director/review` | ✓ "Review Center" | — | — | PASS |
| `/director/sessions` | ✓ "Sessions" | — | — | PASS |
| `/director/sessions/{id}` | ✓ "Session Detail" | — | — | PASS |
| `/director/donna` | ✓ "DONNA" | — | — | PASS |
| `/director/assessment-templates` | ✓ "Assessment Templates" | — | — | PASS |
| `/director/class-templates` | ✓ "Class Templates" | — | — | PASS |
| `/director/onboarding` | ✓ "Academy Setup" | — | — | PASS |

**Pages without explicit registration** use pathname context, which produces page-level greetings: "You're on [page label]. [page intent]. What would you like to do?" This is always correct and never blank.

---

## "Hey Donna" Page Awareness Matrix

| Page | DONNA knows entity? | Greeting quality | No generic response? |
|---|---|---|---|
| Dashboard | No entity (correct) | "You're on Director Dashboard. [intent]..." | PASS |
| Attention Queue | No entity | "You're on Attention Queue. [intent]..." | PASS |
| Players list | No entity | "You're on Players. [intent]..." | PASS |
| Player profile (Jamie) | Yes — "Jamie Chen" | "You're viewing Jamie Chen's profile. Current priorities: 2 active…" | PASS |
| Curriculum (no improve) | No entity | "You're on Curriculum. [intent]..." | PASS |
| Curriculum (?improve=orange_ball_2) | Yes — "Orange Ball 2" | "You're currently reviewing Orange Ball 2. I can show…" | PASS |
| Review center | No entity, but pending count | "You're in the Review Center. N items pending review…" | PASS |
| Sessions | No entity | "You're on Sessions. [intent]..." | PASS |
| DONNA page | No entity | "You're on DONNA. [intent]..." | PASS |

**None of these produce "How can I help?" as the greeting.** The `HEY_DONNA_PATTERN` intercept always calls `liveCtx.greeting()` which is context-first.

---

## CurriculumDonnaRegistrar — Behavior Detail

**File:** `src/app/director/curriculum/_components/CurriculumDonnaRegistrar.tsx`

| Check | Expected | Status |
|---|---|---|
| `/director/curriculum?improve=orange_ball_2` → `updateObjectContext` called | `'Orange Ball 2'` | PASS |
| `/director/curriculum?improve=orange_ball_2` → `updateModule` called | `'Curriculum: Orange Ball 2'` | PASS |
| Navigate away → context cleared | `updateObjectContext('Curriculum')` | PASS |
| Level changes (e.g., `?improve=red_ball_1`) → re-registers | New `levelKey` in deps triggers effect | PASS |
| Renders null — no visual output | `return null` | PASS |

---

## Level Label Derivation

The `CurriculumDonnaRegistrar` derives the level label from the URL param:

```
orange_ball_2  →  "Orange Ball 2"   ✓
red_ball_1     →  "Red Ball 1"      ✓
green_dot      →  "Green Dot"       ✓
yellow_ball_2  →  "Yellow Ball 2"   ✓
high_performance → "High Performance" ✓
```

Pattern: `levelKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())`

This matches the `LEVEL_LABELS` map in `DonnaCurriculumContextPanel` for all standard keys.
