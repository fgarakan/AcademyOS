# COACH NOTES SPEC
**Package:** 07 — Coach Notes and Assessments
**Version:** 1.0 | **Status:** Draft

---

## Architecture Rules

1. **Internal coach notes and parent-facing updates are separate objects.** A coach note is never sent to parents without an explicit review and approval step.
2. **Voice-originated and written notes follow the same pipeline.** The DB schema is identical; only `source` differs.
3. **Parent updates are AI-drafted, coach-reviewed, director-approved before sending.** The AI draft is never sent directly.

---

## Object: Coach Observation (`coach_observations`)

The primary observation record. Created by any staff member for any player.

### Observation Fields

| Field | Notes |
|---|---|
| `raw_text` | What the coach typed or voice-transcribed |
| `ai_parsed_text` | AI-cleaned and structured version (optional) |
| `parent_version` | AI-generated parent-friendly rewrite (separate text) |
| `source` | `written` / `voice_transcript` / `assessment` / `session` |
| `visibility` | `internal` / `parent_visible` / `player_visible` / `all` |
| `category` | technical / tactical / movement / competition / behavioral / general |
| `sentiment` | positive / concern / neutral / flag |
| `strengths_tags` | Array of tagged strengths observed |
| `weakness_tags` | Array of tagged weaknesses observed |
| `priority_tags` | Development priorities surfaced |
| `ai_insights` | Structured JSONB: strengths, concerns, priorities, signals |

### Creating an Observation

**Written path (V1):**
1. Coach opens player profile or is in an active session
2. "Add Note" button → note form
3. Required: text content, visibility
4. Optional: category, sentiment, tags
5. Save → observation created

**Voice path (V1 — typed through voice pipeline):**
1. Coach uses "Tell the OS" command area
2. Types observation: *"Mateo's backhand showed good depth today. Still losing serve at 30-40."*
3. Goes through voice pipeline: intent = `add_observation`, entities = {player, text}
4. AI extracts: tags, sentiment, category, priorities
5. Proposed observation shown to coach for review
6. Coach approves → `coach_observations` row created

**Voice path (V2 — real audio):**
- Same flow but uses Whisper for transcription
- Audio stored in Supabase storage

---

## Observation Visibility Rules

| Visibility | Visible to |
|---|---|
| `internal` | Staff only |
| `parent_visible` | Staff + parents (in parent portal V2) |
| `player_visible` | Staff + player (in player view V2) |
| `all` | Staff + parents + player |

**Default visibility:** `internal`

Coaches should mark notes parent-visible intentionally. The parent portal (V2) only shows `parent_visible` or `all` notes.

---

## Structured Assessment Form

Used for quarterly assessments and reassessments. Feeds into `assessments` table.

### Form Structure

Five sections matching the rubric (see Package 04: PLACEMENT_ASSESSMENT_RUBRIC.md):

**Technical** — sliders for: forehand, backhand, serve, return, volley, overhead
**Tactical** — sliders for: patterns, positioning, decision_making, game_style
**Movement** — sliders for: speed, agility, recovery, court_coverage
**Competition** — sliders for: pressure_handling, consistency, match_tactics, mental_resilience
**Behavioral** — sliders for: attitude, effort, coachability, communication

Each subcategory: 0.0–10.0 in 0.5 increments.

**Narrative section:**
- Strengths (free text, encouraged to be specific)
- Weaknesses (free text)
- Top 3 priorities (ordered: highest priority first)
- Promotion ready? (toggle)
- Promotion notes (if promoted)
- Overall notes

**On save:**
- `assessments` row created
- `update_player_progression_from_assessment()` called automatically
- Player's `player_progression` scores updated
- Baseline set if `is_baseline = true`

---

## AI Observation Parsing

After a typed or voice note is saved, an optional AI parse step runs asynchronously.

**Input:** `raw_text`

**Output (stored in `ai_insights`):**
```json
{
  "strengths": ["backhand_depth"],
  "concerns": ["serve_double_faults", "net_approach_timing"],
  "priorities": ["serve_consistency_practice"],
  "suggested_exercises": [],
  "promotion_signal": false,
  "reassessment_signal": false
}
```

The coach sees this in the note detail view and can confirm or dismiss individual tags.

In V1: AI parse is a background step, not blocking. Note is always saved first.

---

## Parent Update Generator

**Trigger:** Coach or director clicks "Generate Parent Update" on a player profile.

### Flow

1. Select period (default: last 4 weeks)
2. System fetches: `coach_observations` (parent_visible), `assessments` in period
3. Claude API call generates a parent-friendly update draft
   - Tone: encouraging by default (configurable)
   - Language: no jargon, no raw scores
   - Structure: progress highlights → areas of focus → next period
4. Draft displayed to coach in editable field
5. Coach reviews, edits if needed
6. Submit for approval → `parent_updates.status = 'pending_approval'`
7. Director/head coach sees pending update
8. Director approves → `status = 'approved'`
9. Send → `status = 'sent'`, `sent_at` recorded

### What Claude receives

```json
{
  "player_name": "Mateo",
  "age": 11,
  "group": "Orange Development",
  "period_start": "2026-04-01",
  "period_end": "2026-04-28",
  "observations": [
    { "date": "2026-04-14", "text": "Backhand improving...", "sentiment": "positive" },
    { "date": "2026-04-21", "text": "Serve still inconsistent...", "sentiment": "concern" }
  ],
  "assessment_delta": {
    "technical": "+0.5",
    "movement": "+0.0",
    "overall": "+0.3"
  },
  "priorities": ["Serve mechanics", "Backhand depth", "Pattern introduction"],
  "tone": "encouraging"
}
```

### Separation rules

- The parent update is a separate document from coach notes
- `source_observation_ids` and `source_assessment_ids` track what was used
- Editing the parent update does not change original notes
- The update is stored in `parent_updates` — immutable once `sent`

---

## Observation Feed on Player Profile

Shows 10 most recent internal observations. Each entry:

- Date
- Coach name
- Note text (truncated to 2 lines; expand button)
- Category badge
- Sentiment indicator
- Visibility indicator (internal / parent-visible)
- Tags

**"Add Note" button** available inline.

---

## Voice Notes (V2 Preview)

In V2, a coach can record a voice note in a session or from the player profile.

**Flow:**
1. Press microphone button → MediaRecorder starts
2. Coach speaks
3. Stop → audio saved to Supabase storage
4. Whisper transcription runs
5. Transcript shown to coach for review
6. Coach confirms → AI parsing runs → observation created

**V1:** Same exact pipeline, but input is typed text. No audio storage in V1.

---

## Access Control

| Action | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| Create observation | Yes | Yes | Yes (own players) | No | No |
| Edit own observation | Yes | Yes | Yes | No | No |
| Delete observation | Yes | No | No | No | No |
| View internal observations | Yes | Yes | Yes | No | No |
| Generate parent update | Yes | Yes | Yes | No | No |
| Approve parent update | Yes | Yes | No | No | No |
| Send parent update | Yes | Yes | No | No | No |
| View sent parent update | Yes | Yes | Yes | No | V2 only |

---

## V1 Scope

- Written observation form ✅
- Visibility setting ✅
- Tags: strengths, weaknesses, priorities ✅
- Observation feed on player profile ✅
- Structured assessment form ✅
- Assessment history view ✅
- Parent update generator (AI draft → review → approval) ✅
- Parent update send log ✅

**V2:**
- Voice note recording (audio → Whisper)
- AI parsing of observations
- Real-time parent portal delivery
- Parent update PDF export
