# NEW STUDENT PLACEMENT ENGINE SPEC

## Purpose

Placement is the most important decision an academy makes about a player.

Get it wrong and the player:
- Trains with the wrong group (too easy = boredom, too hard = frustration)
- Develops bad habits against inappropriate partners
- Gets discouraged or checked out within months
- Leaves — taking the family's fees with them

Get it right and:
- Development accelerates from week one
- Parent confidence is established immediately
- Retention is dramatically higher
- The coach has an accurate baseline to measure progress against

**The Placement Engine replaces gut feel with structured evidence.**

---

## V1 Flow

### Step 1: Create Player Shell
Coach or director creates a minimal player record:
- First name, last name
- Date of birth
- Handedness
- Any initial intake notes
- Status: `pending_placement`

### Step 2: Run Placement Assessment
The assessment has four scored layers (1–10 scale):

#### Layer 1: Technical
- Forehand groundstroke (control, consistency, grip)
- Backhand groundstroke
- Serve mechanics (beginner: consistency; advanced: placement)
- Return of serve
- Volley/net play
- Movement to the ball (footwork efficiency)

#### Layer 2: Competition Readiness
- Rally tolerance (how long can they sustain a rally)
- Scoring awareness (do they understand the game)
- Match behavior (effort, composure, attitude under pressure)
- Tournament/match experience (if any)

#### Layer 3: Movement
- Lateral speed
- Court recovery
- Split-step timing
- Endurance (within a session)

#### Layer 4: Learning Behavior
- Coachability (responds to instruction, adjusts)
- Effort and engagement
- Focus and concentration
- Communication with coach

### Step 3: Add Coach Notes
During or after the assessment, the coach adds observations:
- Key strengths seen
- Key concerns
- Overall impression

### Step 4: Generate Recommendation (AI)
Claude analyzes the scores + notes and generates:

```json
{
  "recommended_track": "skill",
  "recommended_level": "Orange Development",
  "recommended_group": "Orange Beginners",
  "confidence_score": 0.85,
  "rationale": "Strong movement and coachability scores indicate a player who will develop quickly. Technique is developing but rally tolerance is limited — orange ball level is appropriate. Competition track not yet recommended.",
  "top_strengths": ["movement", "coachability", "effort"],
  "top_weaknesses": ["serve_mechanics", "rally_tolerance", "tactical_awareness"],
  "top_priorities": [
    "Build consistent rally baseline (10+ ball rallies)",
    "Serve toss consistency",
    "Footwork patterns from baseline"
  ],
  "reassessment_weeks": 10
}
```

### Step 5: Director Review
Head coach or academy director sees the recommendation with:
- Player scores (radar chart)
- AI reasoning
- Confidence score
- Full recommendation

They can:
- **Approve** — proceed with recommendation as-is
- **Override** — modify group, level, or track with a reason
- **Reject** — return to assessment (something is missing)

### Step 6: Finalize Placement
`finalize_player_placement()` is called:
- Player status → `active`
- Group membership created
- Baseline scores locked
- Reassessment date set
- Audit log written

### Step 7: Activate Profile
Player profile baseline is now permanent. All future assessments compare to this baseline.
Parent receives intake summary (if parent portal is enabled — V2).

---

## Recommendation Logic Rules

### Track assignment
- **Skill track:** Technical score ≥ 3.0 AND competition score < 6.0
- **Competition track:** Competition score ≥ 6.0 AND match experience exists
- **Combined:** Both tracks ≥ 6.0
- **Fitness only:** Edge case — injury recovery, physical development priority

### Level assignment
| Overall Score | Recommended Level |
|---|---|
| 1.0–3.0 | Level 1 (Red Ball Beginners) |
| 3.1–5.0 | Level 2 (Orange Development) |
| 5.1–6.5 | Level 3 (Green Performance) |
| 6.6–7.5 | Level 4 (Elite Development) |
| 7.6–8.5 | Level 5 (Performance) |
| 8.6–10.0 | Level 6 (Elite) |

### Age adjustment
- Under 8: cap at Level 2 regardless of score
- 8–10: cap at Level 3 if score is borderline
- 14+: Level 5–6 eligible based on scores

### Confidence scoring
- All 4 layers assessed: confidence 0.85+
- Missing 1 layer: confidence 0.65–0.84
- Missing 2+ layers: confidence < 0.65 → flag for reassessment

---

## Override Rules

Overrides are always allowed. The system's recommendation is advisory.

Override must include:
- What is being changed (group, level, track)
- Reason (free text)

Override is recorded in:
- `placement_recommendations.override_*` fields
- Audit log
- Director's dashboard (override history)

Override rate is a useful signal for the academy director:
- High override rate = AI recommendations not calibrated
- Low override rate = recommendations are trusted

---

## Voice-Created Assessment (V2+)

Example command:
> "Create a placement assessment for Mateo, age 9, right-handed. He's a beginner-intermediate with strong movement, limited rally tolerance, and great coachability. Recommend the right group."

System creates:
- Player shell (Mateo, age 9, right-handed)
- Draft assessment with scores pre-filled from spoken description
- Preliminary recommendation
- All presented as a proposed action for review

Director reviews, adjusts any scores, approves.
`finalize_player_placement()` executes.
