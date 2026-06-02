# DONNA-First Screen Patterns

**Version:** 1.0
**Date:** 2026-06-02
**Reference:** `docs/architecture/DONNA_UI_CONSTITUTION.md`

---

## The Pattern Library

This document defines the reusable screen patterns created in Mega Sprint 1124–1130.
All new screens and all screen migrations must use these patterns.

---

## Pattern 1: Page Header with DONNA Brief

Every constitution-compliant page starts with this structure:

```tsx
// Server Component
<DonnaScreenBriefStatic
  brief="[Computed 1–2 sentence brief using real data]"
  primaryActionLabel="[Primary action]"
  primaryActionHref="/route/to/action"
  emphasis="normal" // or "urgent" when count > 3 or pending items exist
/>
```

### Brief computation rules

```typescript
// Pattern: what + how many + what to do
// BAD:  "There are items pending review."
// GOOD: "3 wrap-ups waiting for review, 2 players need placement."

// Pattern: name the entity, name the number, name the urgency
// BAD:  "Some sessions need attention."
// GOOD: "You have 2 sessions today — Orange 1 at 4pm is next. 1 wrap-up is overdue."

// Pattern: fallback for empty state
// BAD:  "" (empty string)
// GOOD: "No sessions today. Check your upcoming schedule or add a quick note."
```

---

## Pattern 2: PlayerProfileConstitutionHero

The 5-signal player header placed ABOVE all tabs and cards.

```tsx
<PlayerProfileConstitutionHero
  playerFirstName="Jamie"
  playerLastName="Chen"
  playerStatus="active"
  currentLevelName="Orange 1"
  currentStage="orange_development"
  nextLevelName="Orange 2"
  advancementEligible={false}
  topPriorities={[{ title: "Serve Rhythm", urgency: "high", category: "technical" }]}
  activeMissionCount={2}
  pendingMissionCount={0}
  latestAssessmentDate="2026-04-15"
  latestAssessmentOverallScore={6.2}
  playerId="..."
  academyId="..."
/>
```

**Outputs:** DONNA brief + 5 signal cards (level, next target, top priority, missions, Ask DONNA chips)

---

## Pattern 3: DecisionCard

For any item requiring a director decision (review queue, approval items).

```tsx
<DecisionCard
  type="Coach Wrap-Up"
  title="Sarah submitted Orange Group wrap-up"
  whyItMatters="2 attendance exceptions need your decision."
  risk="medium"
  status="pending"
  ageDays={1}
  href="/director/review/..."
  donnaRecommendation="Review the attendance exception — Jamie was marked absent but attended."
/>
```

**Fields:** type, title, whyItMatters, risk (high/medium/low), status, ageDays, href, actionSlot, donnaRecommendation

---

## Pattern 4: CollapsedDetailSection

For hiding complexity behind a toggle.

```tsx
// Client Component — requires 'use client' in parent or own file
<CollapsedDetailSection label="Assessment History" count={4}>
  <AssessmentHistoryCard ... />
</CollapsedDetailSection>
```

**Default:** collapsed. `defaultExpanded={true}` for sections that should start open.

---

## Pattern 5: AskDonnaInlinePrompt

Inline chip that opens DONNA with a pre-filled question.

```tsx
<AskDonnaInlinePrompt
  question="Why isn't Jamie ready for Orange 2?"
  label="What's blocking?"
  size="xs" // or "sm"
/>
```

Also available as `<PlayerProfileDonnaPrompts>` which renders 4 pre-built chips for any player.

---

## Pattern 6: DonnaSimplifiedPageHeader

Full page header that combines eyebrow, title, DONNA brief, and primary action in one component.

```tsx
<DonnaSimplifiedPageHeader
  eyebrow="Operations"
  title="Approvals"
  donnaBrief="3 items needing decision. Two wrap-ups, one placement override."
  primaryActionLabel="Review First Item"
  primaryActionHref="/director/review"
  urgency="normal"
/>
```

---

## When to use which pattern

| Situation | Pattern |
|---|---|
| Any page top | `DonnaScreenBriefStatic` |
| Player profile | `PlayerProfileConstitutionHero` + `DonnaScreenBriefStatic` |
| Review/decision items | `DecisionCard` |
| Complex details to hide | `CollapsedDetailSection` |
| "Ask DONNA" inline on player profile | `AskDonnaInlinePrompt` |
| Any new page header | `DonnaSimplifiedPageHeader` |

---

## Component file locations

| Component | Path |
|---|---|
| `DonnaScreenBrief` | `src/components/donna/DonnaScreenBrief.tsx` |
| `DonnaScreenBriefStatic` | same file |
| `DonnaSimplifiedPageHeader` | `src/components/donna/DonnaSimplifiedPageHeader.tsx` |
| `DecisionCard` | `src/components/donna/DecisionCard.tsx` |
| `CollapsedDetailSection` | `src/components/donna/CollapsedDetailSection.tsx` |
| `AskDonnaInlinePrompt` | `src/components/donna/AskDonnaInlinePrompt.tsx` |
| `PlayerProfileConstitutionHero` | `src/app/director/players/[playerId]/_components/PlayerProfileConstitutionHero.tsx` |

---

## Screen migration status (Sprint 1124–1130)

| Screen | Constitution Hero | DONNA Brief | Collapsed Details |
|---|---|---|---|
| Director Dashboard | — | ✅ Sprint 1123 | ❌ next sprint |
| Players List | — | ✅ Sprint 1123 | ❌ next sprint |
| Player Profile | ✅ Sprint 1124 | ✅ in hero | ❌ next sprint |
| Review Queue | — | ✅ existing DonnaReviewBriefPanel | ❌ next sprint |
| Coach Home | — | ✅ Sprint 1124 | ❌ next sprint |
| Curriculum | — | ❌ next sprint | ❌ next sprint |
| Sessions | — | ❌ next sprint | ❌ next sprint |

---

## The brief computation algorithm

All DONNA briefs follow this algorithm:

```typescript
function buildBrief(urgentCount: number, context: BriefContext): string {
  // 1. State the most urgent number first
  if (urgentCount === 0) {
    return buildEmptyStateBrief(context)
  }

  // 2. Name each category of issue
  const parts = buildIssueParts(context)
  
  // 3. End with implied action
  return parts.join(', ') + '.'
  
  // NEVER: vague language ("some", "several", "many")
  // ALWAYS: specific numbers
  // ALWAYS: role-appropriate language (coach ≠ director ≠ parent)
}
```
