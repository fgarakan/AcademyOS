# DONNA Intent, Goal & Continuity Engine V1 — QA

Sprint: Mega Sprint 1831–1860
Date: 2026-06-04

## Purpose

Complete the DONNA goal completion system. DONNA infers intent and goal from natural language — no exact trigger phrase required.

## Full resolution chain

```
Director text
  → donnaIntentEngine      (what are they trying to do?)
  → donnaEntityResolver    (who/what are they talking about?)
  → donnaGoalEngine        (what outcome do they want?)
  → guidedCompletion       (which workflow gets them there?)
  → donnaGoalMemory        (persist across turns)
  → donnaClarificationEngine (ask when confidence is low)
```

## Module overview

| Module | File | Purpose |
|--------|------|---------|
| Confidence scoring | `intent/confidenceScoring.ts` | Shared scoring utils (thresholds, weights, blending) |
| Intent engine | `intent/donnaIntentEngine.ts` | NL intent from fragments + voice transcripts |
| Entity resolver | `entities/donnaEntityResolver.ts` | Player, coach, level, session, template extraction |
| Goal engine | `goals/donnaGoalEngine.ts` | Intent + entity → goal + workflow candidate |
| Goal memory | `memory/donnaGoalMemory.ts` | sessionStorage-backed goal continuity |
| Clarification engine | `intent/donnaClarificationEngine.ts` | Contextual options when confidence is low |
| Proactive brief (enhanced) | `DonnaProactiveBriefCard.tsx` | Goal-continuity banner when workflow was interrupted |

---

## QA Test Scenarios

### Scenario 1 — "Need help with Orange 2"

```ts
classifyIntent("Need help with Orange 2", "/director/curriculum")
```

**Expected:**
- `intent: 'curriculum_help'`
- `confidence >= 0.72` (act threshold)
- `extractedEntity: 'Orange Ball 2'` (or 'Orange 2')
- `clarificationNeeded: false`

```ts
resolveTextToGoal("Need help with Orange 2", "/director/curriculum")
```

**Expected:**
- `goal: 'curriculum_completion'`
- `workflowCandidate: 'curriculum_builder_completion'`
- `subjectLabel: 'Orange Ball 2'`
- `recommendedRoute: '/director/curriculum'`

---

### Scenario 2 — "Let's finish onboarding"

```ts
classifyIntent("Let's finish onboarding")
```

**Expected:**
- `intent: 'onboarding_setup'`
- `confidence >= 0.72`
- `clarificationNeeded: false`

```ts
resolveTextToGoal("Let's finish onboarding")
```

**Expected:**
- `goal: 'academy_setup_completion'`
- `workflowCandidate: 'academy_setup_completion'`
- `recommendedRoute: '/director/onboarding'`

---

### Scenario 3 — "Need to update parents"

```ts
classifyIntent("Need to update parents")
```

**Expected:**
- `intent: 'parent_communication'`
- `confidence >= 0.85`
- `clarificationNeeded: false`

```ts
resolveTextToGoal("Need to update parents")
```

**Expected:**
- `goal: 'parent_update_completion'`
- `workflowCandidate: 'parent_update_completion'`

---

### Scenario 4 — "Sarah seems stuck"

```ts
classifyIntent("Sarah seems stuck")
```

**Expected:**
- `intent: 'player_progress_review'`
- `confidence >= 0.72`
- `extractedEntity: 'Sarah'` (heuristic name extraction)
- `hasNamedEntity: true`

```ts
resolveEntities("Sarah seems stuck")
```

**Expected:**
- `primary.entityType: 'player'`
- `primary.normalizedLabel: 'Sarah'`
- `primary.needsResolution: true` (DB lookup required for actual player_id)

---

### Scenario 5 — "Take me there"

```ts
buildContinuityResponse("Take me there")
```

**Setup:** Active goal in memory: `{ activeGoal: 'curriculum_completion', activeGoalSubject: 'Orange Ball 2', activeGoalRoute: '/director/curriculum' }`

**Expected:**
- `action: 'resume'`
- `message: 'Taking you to **Curriculum Level Builder — Orange Ball 2**.'`
- `route: '/director/curriculum'`

**Without active goal:**
- `message: "I don't have a specific destination in mind. Where would you like to go?"`
- `route: null`

---

### Scenario 6 — "Let's continue"

**Setup:** Interrupted goal in memory: `{ interruptedGoal: 'parent_update_completion', interruptedGoalSubject: 'Jamie Chen' }`

```ts
buildContinuityResponse("Let's continue")
```

**Expected:**
- `action: 'resume'`
- `message` contains "Parent Update Draft — Jamie Chen"
- `route: '/director/review'`

---

### Scenario 7 — "What were we doing?"

```ts
buildContinuityResponse("What were we doing?")
```

**Setup:** Previous goal: `{ previousGoal: 'assessment_completion', previousGoalSubject: 'Jake' }`

**Expected:**
- `action: 'recall'`
- `message` contains "Complete a player assessment (Jake)"

**Without any previous goal:**
- `message: "We haven't worked on anything together yet this session."`

---

### Scenario 8 — Resume interrupted workflow via goal memory

1. Start `curriculum_builder_completion` workflow (via guided completion).
2. Call `setActiveGoal({ goal: 'curriculum_completion', subject: 'Orange Ball 2', route: '/director/curriculum', workflow: 'curriculum_builder_completion' })`.
3. Navigate away (close panel).
4. Re-open DONNA panel.

**Expected in `DonnaProactiveBriefCard`:**
- GoalContinuityBanner appears above the page brief.
- "Interrupted workflow" label (if interrupted) or "In progress" (if active).
- "Continue where you left off" button → dispatches `donna:open` with `"let's continue"`.
- `buildContinuityResponse("let's continue")` returns the right resume message.

---

### Scenario 9 — Low-confidence clarification

```ts
classifyIntent("Help me with Sarah")
```

**Expected:**
- `intent: 'player_progress_review'` (some signal match)
- `confidence < 0.72` (below ACT threshold — "Sarah" alone is ambiguous)
- `clarificationNeeded: true`
- `clarificationQuestion` contains numbered options

```ts
buildClarificationQuestion({
  confidence: 0.45,
  pathname: '/director/players',
  entity: 'Sarah',
  entityType: 'player',
  intent: 'player_progress_review',
})
```

**Expected:**
- `question` contains "I see you're asking about **Sarah**"
- `options.length <= 4`
- Options include: review progress, assessment, parent update, level readiness

---

### Scenario 10 — Voice transcript with incomplete sentence

```ts
classifyIntent("orange ball two need to")
```

**Expected:**
- `extractedEntity: 'Orange Ball 2'` or similar
- `intent: 'curriculum_help'` (ball level detected)
- `clarificationNeeded` likely true (incomplete sentence)
- `clarificationQuestion` generated with curriculum options

---

## Confidence scoring thresholds

| Threshold | Value | Behavior |
|-----------|-------|---------|
| `CONFIDENCE_ACT_THRESHOLD` | 0.72 | Act without clarification |
| `CONFIDENCE_LIKELY_THRESHOLD` | 0.50 | Show clarification options |
| `CONFIDENCE_LOW_THRESHOLD` | 0.35 | No assumption; generic prompt |

---

## Guardrails

- Entity resolver returns `needsResolution: true` for all named entities — DB lookup must be user-confirmed.
- Goal engine never auto-starts workflows — it returns a `workflowCandidate` label only.
- Continuity responses never approve, execute, or mutate records.
- Proactive brief goal banner dispatches `donna:open` with "let's continue" — this is handled by the existing guided completion session memory.
- All modules are pure TypeScript with no DB calls.

---

## Acceptance Checklist

- [ ] `classifyIntent("Need help with Orange 2")` returns `curriculum_help` with `confidence >= 0.72`
- [ ] `classifyIntent("Sarah seems stuck")` returns `player_progress_review` with entity "Sarah"
- [ ] `classifyIntent("Need to update parents")` returns `parent_communication`
- [ ] `resolveEntities("Orange Ball 2")` returns `curriculum_level` entity
- [ ] `resolveEntities("Coach Marcus")` returns `coach` entity
- [ ] `resolveTextToGoal(text, pathname)` returns correct goal + workflow candidate
- [ ] `buildContinuityResponse("let's continue")` returns resume message
- [ ] `buildContinuityResponse("what were we doing?")` returns recall message
- [ ] `buildContinuityResponse("take me there")` returns navigate message
- [ ] `isContinuityPhrase("finish it")` returns true
- [ ] `buildClarificationQuestion(...)` returns ≤ 4 options, page-aware
- [ ] GoalContinuityBanner appears in `DonnaProactiveBriefCard` when goal is active/interrupted
- [ ] TypeScript: clean (`npx tsc --noEmit`)
- [ ] No DB calls, mutations, or auto-approvals in any module
