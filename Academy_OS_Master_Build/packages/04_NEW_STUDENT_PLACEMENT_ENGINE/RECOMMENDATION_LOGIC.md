# RECOMMENDATION LOGIC
**Package:** 04 — New Student Placement Engine
**Version:** 1.0 | **Status:** Draft

---

## Overview

After a placement assessment is scored, the system generates a placement recommendation.

The recommendation is AI-assisted (Claude API) and produces:
- Recommended `development_track` (`skill` / `competition` / `fitness` / `combined`)
- Recommended `level_id` (from academy's configured levels)
- Recommended `group_id` (from available groups matching level + track)
- `confidence_score` (0.0–1.0)
- `recommendation_rationale` (plain English explanation)
- `recommendation_strengths` (what supports the placement)
- `recommendation_weaknesses` (what to watch for)
- `recommended_priorities` (top 3 development focus areas)
- `recommended_reassessment_weeks` (default 10)

---

## Input to Claude

The Claude recommendation call receives:

```json
{
  "player": {
    "first_name": "Mateo",
    "last_name": "Rodriguez",
    "date_of_birth": "2015-03-14",
    "handedness": "right",
    "notes": "Previous club player. Eager."
  },
  "assessment": {
    "technical": { "overall": 6.0, "subcategories": { "forehand": 6.5, "backhand": 5.5, "serve": 5.0, "return": 6.0, "volley": 5.5, "overhead": 5.5 } },
    "tactical":  { "overall": 5.5, "subcategories": { "patterns": 5.0, "positioning": 5.5, "decision_making": 5.5, "game_style": 6.0 } },
    "movement":  { "overall": 7.0, "subcategories": { "speed": 7.5, "agility": 7.0, "recovery": 6.5, "court_coverage": 7.0 } },
    "competition": { "overall": 5.5 },
    "behavioral":  { "overall": 8.0 },
    "overall_score": 6.3,
    "strengths": ["Exceptional movement for age", "High coachability", "Strong forehand under neutral ball"],
    "weaknesses": ["Serve inconsistency", "Limited tactical pattern use"],
    "priorities": ["Serve mechanics and consistency", "Backhand depth and spin", "Pattern introduction: cross-court to DTL"]
  },
  "academy": {
    "levels": [
      { "id": "uuid-l3", "level_number": 3, "label": "Orange Development", "track": "skill" },
      { "id": "uuid-l4", "level_number": 4, "label": "Green Performance", "track": "combined" }
    ],
    "groups": [
      { "id": "uuid-g1", "name": "Orange Dev — Morning", "level_id": "uuid-l3", "max_players": 8, "current_count": 5 },
      { "id": "uuid-g2", "name": "Orange Dev — Afternoon", "level_id": "uuid-l3", "max_players": 8, "current_count": 7 }
    ]
  }
}
```

---

## Claude Prompt Pattern

See `packages/09_AI_WORKFLOW_AND_CLAUDE_PROMPTS/AI_PLACEMENT_RECOMMENDATION_PROMPT.md`
for the full system prompt.

The prompt instructs Claude to:
1. Analyze the five dimension scores and their subcategories
2. Consider the player's age and overall score relative to available levels
3. Recommend the most appropriate level and group
4. Select the best development track
5. Explain the recommendation in 2–4 sentences
6. List the top 3 development priorities
7. Set a reassessment interval (8–12 weeks based on gaps observed)
8. Set confidence score (0.0–1.0)

---

## Track Selection Logic

Claude applies this logic (described in its prompt):

| Scenario | Recommended Track |
|---|---|
| Strong technical + movement, average competition | `skill` |
| Strong competition scores, above-average technical | `competition` |
| Movement very high, all others average | `fitness` |
| Strong across all dimensions (level 5+) | `combined` |
| Age < 10 | Default to `skill` regardless |

---

## Level Selection Logic

Level selection is based on `overall_score` + age + group capacity.

### Scoring bands (default, academy-configurable)

| Level | Overall Score Range | Notes |
|---|---|---|
| Level 1 (Beginners) | 1.0–3.0 | New to tennis, no prior development |
| Level 2 (Foundation) | 3.0–5.0 | Basic strokes; no consistent pattern play |
| Level 3 (Development) | 5.0–7.0 | Functional technique; moderate tactical awareness |
| Level 4 (Performance) | 6.5–8.0 | Strong technique; competition-ready |
| Level 5 (Elite) | 8.0–9.5 | Near-elite; high consistency; tournament active |
| Level 6 (Elite Academy) | 9.0–10.0 | National/international level |

Overlap in bands is intentional. Claude uses dimension weighting and age to break ties.

### Group Selection

Within a recommended level, Claude selects the group with:
1. Available capacity (current_count < max_players)
2. Track match
3. If tie: morning group preferred (arbitrary default, configurable)

If no group has capacity → recommendation is made with a warning:
> "Recommended group is at capacity. Director action required before activation."

---

## Confidence Score Calculation

Claude is prompted to assign confidence based on:

| Factor | High confidence signal | Low confidence signal |
|---|---|---|
| Score distribution | Scores cluster around one level | Scores span two adjacent levels |
| Dimension consistency | All dimensions point same direction | Conflict between dimensions |
| Group availability | Obvious best group available | All groups at capacity or no match |
| Behavioral score | High (8+) — coachable, will adapt | Low (< 5) — uncertainty about fit |

**Thresholds:**
- ≥ 0.85: High confidence — recommended group is clearly right
- 0.65–0.84: Moderate confidence — borderline level; director review recommended
- < 0.65: Low confidence — director override likely needed; flag for discussion

---

## Reassessment Interval

Default: **10 weeks**

Adjusted by Claude based on:
- Larger gaps (e.g., borderline placement) → shorter interval: **8 weeks**
- Strong clear placement + high behavioral → longer interval: **12 weeks**

Min: 6 weeks | Max: 16 weeks

---

## Human Approval Requirement

**The AI recommendation is never automatically activated.**

After generation:
1. Recommendation displayed in director review screen
2. Director sees: recommended level, group, track, confidence, rationale, priorities
3. Director can: approve as-is / override any field / reject
4. On override: override reason required (text field)
5. On approval: `finalize_player_placement()` called → player activated → baseline set

See `NEW_STUDENT_PLACEMENT_ENGINE_SPEC.md` for full approval flow.

---

## Override Flow

If the director disagrees with any part of the recommendation:

1. Click "Override" — fields become editable
2. Change: track / level / group (any combination)
3. Enter override reason (required)
4. Save override — creates `override_*` fields in `placement_recommendations`
5. `overridden_by` and `overridden_at` recorded
6. Proceed to activation — `finalize_player_placement()` uses override values

Override reason is required because placement overrides inform future AI training and
surface systematic patterns in under-performing recommendations.

---

## Error Cases

| Scenario | Handling |
|---|---|
| Claude API call fails | Show error; allow retry; do not create partial recommendation |
| No matching groups available | Create recommendation with warning; director must add group or override |
| Player already active | Block new placement; show current placement instead |
| Assessment scores all zero | Validation error — incomplete assessment |
| Confidence < 0.50 | Recommendation flagged as "Low confidence — director review required" with orange badge |
