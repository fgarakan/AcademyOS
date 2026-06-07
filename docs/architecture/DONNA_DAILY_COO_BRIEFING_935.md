# DONNA Daily COO Briefing — Architecture
**Sprint 935–964 — DONNA Daily COO Briefing V1**
**Date: 2026-06-07**

---

## Core principle

**DONNA briefs the director. The director doesn't need to ask.**

The COO daily brief surfaces on login at the top of the director home page, immediately after the morning greeting. It presents a structured, actionable picture of the academy's current state — what is urgent, what to watch, what decisions are waiting, and the top 3 recommended actions.

```
Director opens /director
  → Server fetches all signals (players, sessions, review queue, curriculum, setup)
  → buildCOODailyBrief(signals) → COODailyBrief
  → DonnaCOODailyBriefPanel renders the brief as a structured panel
  → Director sees priorities, action routes, and missing data notes
  → Director clicks an action route to navigate directly
```

---

## 1. Data flow

All signals are fetched by `src/app/director/page.tsx` before the brief is computed. The brief aggregator is a pure function — it receives already-fetched values and returns a structured brief. It makes no database calls.

```
src/app/director/page.tsx
  → fetches: players, sessions, proposed_actions (review queue), curriculum states,
             templates, academy settings, groups, reassessment pipeline
  → computes: activePlayers, pendingWrapUps, assessmentsInReview, etc.
  → calls: buildCOODailyBrief(COOAggregatorInput) → COODailyBrief
  → passes: brief to DonnaCOODailyBriefPanel

src/lib/donna/dailyBrief/donnaDailyCOOAggregator.ts
  → pure TypeScript — no DB, no API, no React, no side effects
  → builds 5 sections from signal counts
  → derives top 3 actions from all sections
  → generates missing data notes
  → returns COODailyBrief

src/app/director/_components/DonnaCOODailyBriefPanel.tsx
  → server component — no useState, no useEffect
  → renders COODailyBrief as structured panel with action routes
  → placed immediately after DonnaMorningBrief on the director home
```

---

## 2. Brief structure

### `COODailyBrief`

| Field | Type | Description |
|---|---|---|
| `generatedAt` | `string` (ISO) | When the brief was computed |
| `overallStatus` | `'critical' \| 'attention' \| 'on_track' \| 'no_data'` | Academy-wide status signal |
| `openingStatement` | `string` | DONNA's 1-sentence summary |
| `sections` | `5 sections` | Structured brief sections |
| `top3Actions` | `COOBriefItem[]` | Top 3 actionable items across all sections |
| `missingDataNotes` | `string[]` | Disclosed gaps in signal coverage |
| `hasUrgentItems` | `boolean` | True if any item is critical or high urgency |
| `totalAttentionItems` | `number` | Total count of items across all sections |

### `COOBriefSection`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Section identifier |
| `title` | `string` | Section label for display |
| `items` | `COOBriefItem[]` | Action items in this section |
| `status` | `'urgent' \| 'attention' \| 'clear' \| 'no_data'` | Section-level status |
| `clearMessage` | `string` | Text shown when no items |

### `COOBriefItem`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Item identifier |
| `label` | `string` | Human-readable item description |
| `detail` | `string \| null` | Additional context (e.g., "oldest 5 days ago") |
| `urgency` | `'critical' \| 'high' \| 'medium' \| 'low'` | Item urgency level |
| `actionLabel` | `string` | Link label (e.g., "Open Review Queue") |
| `actionHref` | `string` | Navigation route |

---

## 3. Five sections

### Section 1 — Today's Priority

Critical and high-urgency items only. Maximum 3 items. This is the "must act today" view.

| Signal | Urgency | Action route |
|---|---|---|
| Review queue total ≥5 items | critical | `/director/review` |
| Review queue total 1–4 items | high | `/director/review` |
| Players on hold or reassessment due ≥3 | critical | `/director/players` |
| Players on hold or reassessment due 1–2 | high | `/director/players` |
| Sessions today with no assigned coach | high | `/director/sessions` |

### Section 2 — Watch List

Player development signals. Medium-to-high urgency.

| Signal | Urgency | Action route |
|---|---|---|
| Players awaiting curriculum placement | high | `/director/players` |
| Players overdue for reassessment | high | `/director/players` |
| Players advancement-eligible | medium | `/director/players` |
| Players stalled 180+ days | medium | `/director/players` |

### Section 3 — Decisions Waiting

Review queue breakdown by type.

| Signal | Urgency | Action route |
|---|---|---|
| Pending wrap-ups ≥3 | high | `/director/review` |
| Pending wrap-ups 1–2 | medium | `/director/review` |
| Assessments in review | medium | `/director/review` |
| Placement reviews | high | `/director/review` |
| Private lesson requests | medium | `/director/review` |

### Section 4 — Parent & Coach Follow-up

Communication and session quality signals.

| Signal | Urgency | Action route |
|---|---|---|
| Parent updates awaiting approval | medium | `/director/review` |
| Sessions missing coach recap ≥3 | high | `/director/sessions` |
| Sessions missing coach recap 1–2 | medium | `/director/sessions` |

### Section 5 — Setup & Curriculum

Academy readiness and curriculum health.

| Signal | Urgency | Action route |
|---|---|---|
| No class templates created | high | `/director/templates` |
| Players without curriculum level | medium | `/director/players` |
| Curriculum gaps detected | medium | `/director/curriculum` |
| Active levels with no class template | medium | `/director/curriculum` |

---

## 4. Top 3 actions

Derived from all items across all sections:

1. Collect all items from all 5 sections.
2. De-duplicate by `actionHref` — keep the highest-urgency item per route.
3. Sort by urgency (critical → high → medium → low).
4. Take top 3.

This ensures the top 3 are always the most urgent, unique action routes available — not 3 links to the same page.

---

## 5. Missing data disclosure

Missing data is disclosed at the bottom of the brief, never silently omitted.

| Condition | Note displayed |
|---|---|
| `sessionsExist === false` | "No session history yet — session and recap signals will appear once sessions are scheduled." |
| `activePlayers === 0` | "No active players — player development signals will appear once players are added and placed." |

No hallucinated signals. No invented counts. If data is absent, DONNA says so.

---

## 6. Overall status derivation

| Status | Condition |
|---|---|
| `no_data` | `activePlayers === 0` AND no items across all sections |
| `critical` | Any item has `urgency === 'critical'` |
| `attention` | Any items exist (and none are critical) |
| `on_track` | All sections are clear (no items) |

The status badge renders in the panel header:
- `critical` → red badge ("Needs Attention")
- `attention` → orange badge ("Items to Review")
- `on_track` → green badge ("On Track")
- `no_data` → muted badge ("No Data Yet")

---

## 7. Component placement

```
/director page layout (server component):

  Section 1   — DonnaMorningBrief (greeting, health %, narrative line)
  Section 1b  — DonnaCOODailyBriefPanel (full structured COO brief) ← NEW
  Section 2   — ImmediateAttentionFeed (attention queue items)
  Section 3   — TodayOperationsPanel (today's sessions, coverage)
  Section 4   — DevelopmentWatchList (player buckets)
  Section 5   — DirectorDecisionsQueue (review queue counts)
  Section 6   — ProgramHealthNarrative
  Section 7   — AcademyIntelligenceSection
  Section 8   — DonnaRecommendedActions
```

The COO brief is proactive — it appears without Brian asking. The subsequent sections (2–8) provide deeper data for directors who want to drill in.

---

## 8. Guarantees

| Rule | Implementation |
|---|---|
| No hidden mutations | Brief is read-only — no actions, no writes |
| No hallucinated data | All items derived from live signal counts passed from page |
| No AI calls | Pure deterministic computation |
| Missing data disclosed | `missingDataNotes` always shown when signals are absent |
| Director always in control | Every item links to the relevant page — director navigates and decides |
| TypeScript clean | 0 errors |

---

*Aggregator: `src/lib/donna/dailyBrief/donnaDailyCOOAggregator.ts`*
*Panel component: `src/app/director/_components/DonnaCOODailyBriefPanel.tsx`*
*Page wiring: `src/app/director/page.tsx`*
