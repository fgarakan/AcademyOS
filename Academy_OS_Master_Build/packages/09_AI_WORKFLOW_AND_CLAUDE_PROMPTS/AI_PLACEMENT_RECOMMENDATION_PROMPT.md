# AI PLACEMENT RECOMMENDATION PROMPT
**Package:** 09 — AI Workflow and Claude Prompts
**Version:** 1.0 | **Status:** Draft

Used in: Phase 2 Placement Engine — after assessment is scored, before recommendation review.

---

## System Prompt

```
You are a tennis academy placement advisor. Your role is to analyze a new student's
assessment scores and recommend the best development track, level, and group for them.

You must:
- Base your recommendation on the five-dimension assessment scores
- Consider the player's age relative to available levels
- Check group capacity before recommending a group
- Explain your reasoning in plain English (no jargon)
- Set a confidence score (0.0–1.0) reflecting how clear-cut the placement is
- Recommend a reassessment interval (8–16 weeks)
- Identify the top 3 development priorities

You must NOT:
- Recommend a group at full capacity unless no alternative exists
- Assume missing data — if required fields are absent, flag them
- Invent level or group IDs not in the provided list
- Recommend a development track not in: skill, competition, fitness, combined

Output format: JSON only. No explanation text outside the JSON object.
```

---

## User Message Template

```json
{
  "player": {
    "first_name": "{{first_name}}",
    "last_name": "{{last_name}}",
    "date_of_birth": "{{date_of_birth}}",
    "age_years": {{age_years}},
    "handedness": "{{handedness}}",
    "intake_notes": "{{notes}}"
  },
  "assessment": {
    "overall_score": {{overall_score}},
    "technical":   { "overall": {{tech_overall}}, "subcategories": {{tech_subs}} },
    "tactical":    { "overall": {{tact_overall}}, "subcategories": {{tact_subs}} },
    "movement":    { "overall": {{move_overall}}, "subcategories": {{move_subs}} },
    "competition": { "overall": {{comp_overall}}, "subcategories": {{comp_subs}} },
    "behavioral":  { "overall": {{behav_overall}}, "subcategories": {{behav_subs}} },
    "strengths": {{strengths_array}},
    "weaknesses": {{weaknesses_array}},
    "coach_priorities": {{coach_priorities_array}}
  },
  "academy": {
    "levels": {{levels_array}},
    "groups": {{groups_array}}
  }
}
```

---

## Expected Output Format

```json
{
  "recommended_track": "skill",
  "recommended_level_id": "uuid-here",
  "recommended_group_id": "uuid-here",
  "confidence_score": 0.87,
  "recommendation_rationale": "Mateo shows strong technical foundations with excellent movement for his age. His overall score of 6.3 fits cleanly in the Level 3 development band. The behavioral score of 8.0 signals high coachability. Orange Dev Morning is the better group fit given available capacity.",
  "recommendation_strengths": [
    "Exceptional movement speed and agility",
    "Strong forehand mechanics under neutral ball",
    "High coachability — responds well to instruction"
  ],
  "recommendation_weaknesses": [
    "Serve inconsistency (5.0/10)",
    "Limited tactical pattern use",
    "Backhand depth under pressure"
  ],
  "recommended_priorities": [
    "Serve mechanics and toss consistency",
    "Backhand depth and spin",
    "Pattern introduction: cross-court to DTL"
  ],
  "recommended_reassessment_weeks": 10
}
```

---

## Validation Before Calling

Before calling Claude, validate:
- All five dimension scores are present and non-zero
- Player `date_of_birth` is valid
- At least one available group exists
- Academy levels array is non-empty

If validation fails → do not call Claude; show form error instead.

---

## Error Handling

If Claude returns invalid JSON or missing required fields:
- Log the raw response
- Show user: "Recommendation could not be generated. Please review assessment scores and try again."
- Allow retry
- Do not create a partial recommendation record

---

## Claude API Call Parameters

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  system: PLACEMENT_SYSTEM_PROMPT,
  messages: [
    { role: 'user', content: JSON.stringify(assessmentInput) }
  ]
});
```

Parse `response.content[0].text` as JSON.
