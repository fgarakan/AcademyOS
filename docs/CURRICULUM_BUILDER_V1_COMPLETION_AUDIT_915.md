# Curriculum Builder V1 Completion Audit
Sprint 915 — 2026-05-18

---

## Summary

The Curriculum Builder V1 visual/product experience is **complete** as a read-only, draft-safe, screenshot-matched UI layer. The backend write path (proposed_actions integration) remains pending.

---

## Screenshot Match Status

| Page | Screenshot Direction | Match Level | Notes |
|---|---|---|---|
| Curriculum Map | 2-column, level cards by stage lane | 90% | Level cards, stage lanes, DONNA panel match. Health stats wired to real data. |
| Guided Review | Progress rail, review card, action buttons, DONNA | 95% | Compact pill rail (R1/O1/HP1), 5-section rows, all buttons wired locally. |
| Level Builder | 5-card grid, summary row, DONNA, Advanced Editor | 95% | All sections implemented, controlled activePanel, DONNA activeAction wired. |
| Add Drill | Input form, example prompt, Generate button, DONNA | 95% | Draft card shows structured fields. Local-only. |
| Add Fitness | Input form, example prompt, Generate button, DONNA | 95% | Full draft card with pathway chain. Local-only. |
| Impact Preview | Counters, 9 impact rows, scope actions, DONNA | 90% | Scope buttons present but disabled — correct safety behavior. |

---

## What Is Wired (Real data / real behavior)

- All curriculum data read from Supabase (`getCurriculumExplorerData`) — levels, gates, drills, competition track, fitness guidance ✓
- Curriculum Map: health stats (levels with drills, gates, missing data) derived from real data ✓
- Level Builder: readiness scores, section statuses derived from real level data ✓
- Progress Rail: shows real levels from DB with correct stage prefixes and status dots ✓
- Level routing (`/director/curriculum/level/[levelId]`) resolves real level IDs ✓
- "Modify this level" in Guided Review links to the correct level builder page ✓
- Auth guard on all curriculum pages ✓

---

## What Is Local-Only (UI state, no persistence)

| Feature | Status |
|---|---|
| Guided Review kept/skipped/modified state | Local state only — resets on page reload |
| Guided Review progress % | Local state only |
| DONNA "Ask to improve it" toggle | Local UI state only |
| Add Drill "Generate draft" → draft card | Local simulation — no AI call, static template |
| Add Fitness "Generate draft" → draft card | Local simulation — static template |
| Impact Preview counters | Static data — not derived from a real pending change |
| Impact Preview "Save as Draft" | Toggles local draftSaved state — no DB write |

---

## What Is Draft-Only / Shell

| Feature | Status |
|---|---|
| Level Builder "Ask DONNA" inline panels | Open shell panels; textarea input works locally; no draft written |
| Add Drill "Save Draft" button | Shell — no proposed_actions write |
| Add Fitness "Save Draft" button | Shell — no proposed_actions write |
| Impact Preview scope buttons | Disabled shells with "Goes to Review Queue" copy |
| Add Drill "Edit Draft" button | Shell — no draft editor |
| Add Fitness "Add to Another Level" | Shell — no level selector |

---

## What Is Blocked by Schema / Backend

| Feature | Blocker |
|---|---|
| Draft creation (drills, gates, fitness) | Requires server action writing to `proposed_actions` with `CurriculumBuilderDraftPayload` |
| Real AI-generated drill/fitness content | Requires external AI API call (blocked by sprint rules) |
| Player Missions section | No `curriculum_missions` table in schema |
| Guided Review persistence | Requires a `review_sessions` table or user preference store |
| Impact scope application | Requires curriculum mutation path through `execute_approved_action()` |

---

## Route Inventory (Final)

| Route | Status | Component |
|---|---|---|
| `/director/curriculum/builder` | ✓ Active | CurriculumBuilderWelcome + CurriculumSetupBuilder |
| `/director/curriculum/map` | ✓ Active | CurriculumLevelMap + CurriculumMapLevelCard |
| `/director/curriculum/guided` | ✓ Active | CurriculumGuidedReviewExperience |
| `/director/curriculum/level/[levelId]` | ✓ Active | CurriculumLevelBuilderExperience |
| `/director/curriculum/level/[levelId]/impact` | ✓ Active | CurriculumImpactPreviewExperience (with backHref) |
| `/director/curriculum/builder/add-drill` | ✓ Active | CurriculumAddDrillExperience |
| `/director/curriculum/builder/add-fitness` | ✓ Active | CurriculumAddFitnessExperience |
| `/director/curriculum/builder/impact-preview` | ✓ Active | CurriculumImpactPreviewExperience (standalone) |
| `/director/curriculum` | ✓ Active (admin/legacy) | Dense admin view |
| `/director/curriculum/learning` | ✓ Active | LearningModulesClient |
| `/director/curriculum/academy-version` | ✓ Active | Override/diff view |

---

## DONNA Integration Score: 9/10

| Page | Mode | activeAction | Score |
|---|---|---|---|
| Map | map | — | ✓ |
| Guided Review | guided_review | "Ask DONNA to improve it" | ✓ |
| Level Builder | level | panelToAction(activePanel) | ✓ |
| Add Drill | add_drill | — | ✓ |
| Add Fitness | add_fitness | — | ✓ |
| Impact Preview | impact | — | ✓ |

All 6 target pages wired. -1 for missing real action dispatch from DONNA chips.

---

## Mobile Score: 8/10

- DONNA panel `hidden lg:block` on all 6 pages ✓
- Action buttons `flex-wrap` on all key screens ✓
- Progress rail horizontal scroll ✓
- Mobile-safe padding `p-4 sm:p-6` ✓
- `overflow-x-hidden` on all wrappers ✓
- -2 for no mobile DONNA collapsed chip/bar (DONNA is completely absent on mobile)

---

## Desktop Score: 9/10

- Consistent `max-w-[1440px]` on all experience wrappers ✓
- Consistent `w-72` DONNA panel ✓
- Consistent `gap-6 items-start` 2-column layout ✓
- Consistent `page-eyebrow` + `page-title` headers ✓
- Consistent `space-y-6` vertical rhythm ✓
- Teal `#11d9df` accent used consistently across curriculum builder ✓
- -1 for impact counter grid could be wider on ultra-wide screens

---

## Curriculum Builder V1 Readiness

| Category | Score |
|---|---|
| Visual/screenshot match | 93% |
| Route coverage | 100% |
| Real data wired | 80% |
| DONNA integration | 90% |
| Mobile | 80% |
| Desktop | 90% |
| Draft safety (no unsafe mutations) | 100% |
| TypeScript | 100% |

**Overall V1 Readiness: ~90%**

The remaining 10% is the backend write path (proposed_actions integration) which is intentionally deferred.

---

## Recommended Next Block: Sprints 916–918

1. **Sprint 916** — Curriculum Pathway Data Model Audit: Document what can connect without migrations and what requires schema changes.
2. **Sprint 917** — Skill Path Curriculum Connection: Connect curriculum drill/skill data to player profile pathway preview (read-only).
3. **Sprint 918** — Competition Path Curriculum Connection: Connect competition track data to player profile preview (read-only).

These sprints begin the pathway connection layer that links the curriculum visual experience to the player development data model.
