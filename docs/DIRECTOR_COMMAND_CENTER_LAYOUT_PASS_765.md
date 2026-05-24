# Sprint 765 — Director Command Center Layout Pass V1

**Date:** 2026-05-24
**Sprint:** 765
**Status:** Complete

---

## Summary

Cognitive load pass on `/director`. The page is restructured so the director's first visual contact is with operational signals — not setup steps. Academy Setup and admin panels are moved to the bottom. Section labels are updated to reflect command-centre framing. No new DB queries, no new components, no schema changes.

---

## Section order before Sprint 765

| # | Section | Position |
|---|---|---|
| 1 | Hero Header (greeting + health badge) | Top |
| 2 | DirectorContinueSetupPanel | Early (blocking) |
| 3 | DonnaDashboardPresenceCTA | Early (blocking) |
| 4 | Academy Setup / Live banner | Early (blocking) |
| 5 | DirectorAttentionQueueHero | Below setup panels |
| 6 | DonnaExecutiveCard | Below setup panels |
| 7 | AcademyKpiCardsSection | Middle |
| 8 | DirectorKpiHealthSection | Middle |
| 9 | Health Chart + Live Activity | Middle |
| 10 | Player Activity | Middle |
| 11 | Signals + Intelligence | Middle |
| 12 | Curriculum Coverage | Lower |
| 13 | First template prompt | Lower |
| 14 | Sessions This Week | Lower |
| 15 | Quick Actions | Bottom |

---

## Section order after Sprint 765

| # | Section | Δ |
|---|---|---|
| 1 | Hero Header (greeting + health badge) | Unchanged |
| 2 | **DirectorAttentionQueueHero** | ↑ Moved up — first operational section |
| 3 | DonnaExecutiveCard | ↑ Moved up |
| 4 | AcademyKpiCardsSection | Unchanged |
| 5 | DirectorKpiHealthSection | Unchanged |
| 6 | Health Chart + Live Activity | Unchanged |
| 7 | **Roster Signals** (was "Player Activity") | Label updated |
| 8 | **Academy Health Signals** (was "Signals + Intelligence") | Label updated |
| 9 | Curriculum Coverage | Unchanged |
| 10 | First template prompt | Unchanged |
| 11 | Sessions This Week | Unchanged |
| 12 | Quick Actions | Unchanged |
| 13 | **Academy Setup + Admin** | ↓ Moved to bottom |

---

## Changes made

### A — Attention queue and DONNA moved to top

`DirectorAttentionQueueHero` and `DonnaExecutiveCard` are now rendered immediately after the hero header. No intermediate setup panels block the director's view of their operational priorities.

**Before:**
```tsx
<DirectorContinueSetupPanel ... />
{/* DonnaDashboardPresenceCTA */}
{/* isAcademyLive banner / setup checklist */}
<DirectorAttentionQueueHero ... />
<DonnaExecutiveCard ... />
```

**After:**
```tsx
<DirectorAttentionQueueHero queue={attentionQueue} showMax={3} />
<DonnaExecutiveCard items={donnaItems} directorName={directorDisplayName} />
```

---

### B — Academy Setup + Admin section at the bottom

The three setup components are now grouped into a single labelled section at the bottom of the page, visually separated by a faint divider. The director can access them any time, but they do not block operational signals.

Components moved to bottom:
- `DirectorDnaStatusBadge` — shown when `hasAcademyDna === true`
- `DirectorContinueSetupPanel` — shown when academy is not yet live
- Live banner (inline, static) — shown when `isAcademyLive === true`
- `DonnaDashboardPresenceCTA` — "What should I do first?" chip

Section label: **"Academy Setup"** with sublabel "One-time setup steps and academy DNA. Revisit anytime to update your configuration."

---

### C — Section label updates

| Old label | New label | Rationale |
|---|---|---|
| `Player Activity` | `Roster Signals` | Signals-first framing; matches attention queue terminology |
| `Signals + Intelligence` | `Academy Health Signals` | Clearer command-centre framing; "Intelligence" was vague |

---

### D — Import cleanup

Removed two imports that became unused after the section restructure:
- `SetupProgressChecklist` from `@/components/onboarding/SetupProgressChecklist`
- `OnboardingProgressCard` from `./OnboardingProgressCard`

These were not used in the re-added bottom section (all setup is handled by `DirectorContinueSetupPanel`).

---

## Variables used by the bottom section

All variables computed before the attention queue build are now consumed by the bottom section — no unused variable warnings remain after this sprint.

| Variable | Used by |
|---|---|
| `hasAcademyDna` | Conditional render of `DirectorDnaStatusBadge` |
| `dnaSavedAt` | Prop to `DirectorDnaStatusBadge` |
| `isAcademyLive` | Live banner vs. `DirectorContinueSetupPanel` branch |
| `fitnessTemplateCount` | Prop to `DirectorContinueSetupPanel` |
| `classTemplateCount` | Prop to `DirectorContinueSetupPanel` |

---

## Protected files not staged

| File | Status | Reason |
|---|---|---|
| `docs/SPRINT_398_MANUAL_SQL_EXECUTION_PACKET.md` | Pre-existing modified | Unrelated to Sprint 765 |
| `src/app/api/director/interview/realtime-session/route.ts` | Pre-existing modified | Unrelated to Sprint 765 |
| `src/components/assistant/DonnaAssistantButton.tsx` | Pre-existing modified | DONNA operator-step changes — needs dedicated sprint |

---

## TypeScript validation

```
npx tsc --noEmit → EXIT 0 (clean)
```

No TypeScript errors introduced or left unresolved. All previously-unused variable warnings resolved.

---

## Remaining command center gaps

| Gap | Notes |
|---|---|
| DONNA prompt chips in DonnaExecutiveCard | Future sprint — condition not yet met |
| `buildKpiDashboard()` full aggregator wiring | Deferred |
| `/director/groups` page | Route exists in nav but page not yet built |
| Expiring actions: `expiresAt` within 24h | Activated by Sprint 764 enrichment — visible in live data |

---

## Recommended Sprint 766

**Sprint 766 — Director Command Center Final Demo QA V1**

Goal: Manual QA pass on the director command center (Sprints 761–765 combined). Verify all live wiring, empty states, and visual hierarchy. Produce a 5-minute demo script. Output final verdict: DEMO-READY / FOUNDATION READY / PARTIAL / NOT READY. Documentation only — no code changes unless a TypeScript break is found.
