# Voice Intake Demo Flow — V1

**Last updated:** 2026-05-04
**Sprints:** 240–249 — Voice Intake OS Foundation V1
**Status:** Demo-ready. No AI. No STT. All structuring is deterministic pattern matching.

---

## What this system does

Voice Intake OS is the first-party input layer for Academy OS. Directors and coaches speak or type what they observed, want done, or want reviewed. The system:

1. Structures the input deterministically (no AI calls)
2. Detects intents, entities, safety flags
3. Routes to suggested destination modules
4. Creates a `proposed_actions` row with `status = pending_review`
5. Surfaces the draft in the Director Review Queue

**Nothing is applied automatically. Everything requires director approval before any data changes.**

---

## Operating principle

> Voice creates → UI confirms → Director approves → Database structures → System records

The pipeline has one-way data flow. Voice input can only move forward by reaching the review queue. It can never write directly to any player, attendance, roster, session, or billing table.

---

## Demo scenario A — Director Command Center

### Setup

Route: `/director/command-center`
Role: Academy Director
Entry point: VoiceIntakePanel (mic icon, role badge, "Director Command Center" label)

---

### A1 — Session planning intent

**What to type (or say):**
```
Create an Orange 2 session focused on movement recovery for next Tuesday.
```

**Expected structured output:**
```
Detected Intents:     Session Draft
Confidence:           high
Extracted:
  curriculum_level:   Orange 2
  focus:              movement, recovery
Suggested Destinations:
  Session Planning ★  (primary)
  Director Review Queue
Recommended Action:
  Create a session plan draft for director review.
What Would Change (if approved):
  A session plan draft is created in the review queue (pending_review)
Will Not Change Automatically:
  No session published — sessions require director approval
  No billing or enrollment changes — requires director action
  ...
Safety Flags:         (none)
```

**UI safety labels to confirm visible:**
- "Review draft only — requires approval" (confidence badge row)
- "Sends this voice intake to the review queue. Nothing changes until you approve it there." (button footer)

**Action: click "Create Review Draft"**
Expected: "✓ Voice intake draft created" + "View Review Queue →" link

---

### A2 — Safety flag trigger — parent communication

**What to type:**
```
Draft a parent update explaining what Orange 2 is working on this month.
```

**Expected structured output:**
```
Safety Flags:
  Parent exposure risk     (orange)
  Parent send blocked      (red)
Detected Intents:     Parent Safe Draft
Confidence:           medium
Suggested Destinations:
  Parent Safe Draft ★
  Director Review Queue
What Would Change (if approved):
  A parent-safe draft is created in the review queue — not sent until director approves
Will Not Change Automatically:
  No parent message sent — requires director approval before any communication
```

**Key demo point:** Two safety flags appear in orange/red. The submit flow still works — safety flags do not block submission, they annotate the draft so the director has full context when reviewing.

---

### A3 — Safety flag trigger — level change

**What to type:**
```
Move Lucas up to Orange 2, he is ready.
```

**Expected structured output:**
```
Safety Flags:
  Level change flagged     (orange)
Detected Intents:     (unknown — coach-only observation, no director action matched)
  or: Player Review Request (if observation patterns match)
Confidence:           medium / low
```

**Key demo point:** Level change language is always flagged. Director still controls any decision — the flag is informational and the intake routes to review.

---

### A4 — Coach briefing intent

**What to type:**
```
I want Orange 2 coaches watching Lucas and Maya for wide-ball recovery next week.
```

**Expected structured output:**
```
Safety Flags:         (cross-player scope flag if 3+ names detected)
Detected Intents:     Set Group Focus, Player Review Request
Confidence:           high
Extracted:
  player:             Lucas, Maya
  focus:              wide ball, recovery
  curriculum_level:   Orange 2
Suggested Destinations:
  Group Planning ★
  Coach Briefing
  Director Review Queue
```

---

## Demo scenario B — Coach Session Workspace

### Setup

Route: `/coach/sessions/[sessionId]`
Role: Coach
Entry point: CoachRecapCommandPanel → VoiceTextInput area

---

### B1 — Attendance exception

**What to type:**
```
Everyone was here today except Sarah. She texted she is sick.
```

**Expected structured display (CoachVoiceStructureDisplay):**
```
Detected Coach Intents:   Attendance Exception
Player Mentions:          Sarah
Safety Note:              Review draft only — not visible to players
                          No parent message sent · No level change · No roster change — all require director approval
```

**Key demo point:** The coach sees their input has been understood. The structured labels show exactly what will and will not happen.

---

### B2 — Unrostered attendee

**What to type:**
```
Jeremy showed up today. Not sure he is on the roster.
```

**Expected structured display:**
```
Detected Coach Intents:   Unrostered Attendee Flag, Attendance Exception
Player Mentions:          Jeremy
```

---

### B3 — Player observation + gap signal

**What to type:**
```
Lucas recovered better on wide balls today. Getting closer to gate level. Backhand still rushed under pressure.
```

**Expected structured display:**
```
Detected Coach Intents:   Player Observation, Gate Evidence Draft, Gap Signal
Player Mentions:          Lucas
Gap Signals:              wide ball, recovery, backhand, rushed
```

**Key demo point:** Gap signals automatically link to the gap engine vocabulary. No manual tagging required.

---

## Demo scenario C — Director Review Queue

### Setup

Route: `/director/review` → Voice Intake tab
Role: Academy Director

---

### C1 — Reviewing a pending voice intake draft

After a director submits from the Command Center or a coach submits from a session, the draft appears in the **Voice Intake** tab with `pending_review` status.

**Draft card shows:**
- Transcript (verbatim)
- Role badge (Director / Coach)
- Confidence level
- Safety flags (if any)
- Detected intents as chips
- Extracted entities (player, group, curriculum level, focus)
- Suggested destinations with primary starred
- Recommended action
- What Would Change (if approved)
- Will Not Change Automatically (first 4 items from the invariant list)
- Source note: "Source: Voice Intake — no data changed without director approval"

**Decision controls:**
- Approve
- Needs Clarification
- Reject

**Key demo point for V1:** Approving records the director's review decision. In V1 there is no downstream execution step for voice intake — the approval marks the draft as reviewed. Downstream routing to specific modules (attendance exception, player observation, session plan, etc.) is the Sprint 250+ scope.

---

## Safety invariants — never automatic

These six items are always present in the "Will Not Change Automatically" list regardless of intent, role, or confidence:

1. No parent message sent — requires director approval before any communication
2. No player curriculum level changed — requires director/head coach approval
3. No attendance record written — requires director/head coach confirmation
4. No player created or removed — roster changes require director action
5. No session published — sessions require director approval
6. No billing or enrollment changes — requires director action

---

## Safety flags reference

| Flag | Label shown | Color | When triggered |
|------|------------|-------|----------------|
| `parent_exposure_risk` | Parent exposure risk | orange | Send/message/notify + parent/guardian in same utterance |
| `parent_send_requested` | Parent send blocked | red | Any send-to-parent phrasing |
| `auto_execution_requested` | Auto-execution blocked | red | "do it", "apply now", "execute", "run it" |
| `level_change_requested` | Level change flagged | orange | Move up/promote/level up/advance to [level] |
| `roster_mutation_requested` | Roster mutation blocked | red | Add player/create player/enroll/register |
| `billing_enrollment_risk` | Billing/enrollment risk | red | billing/invoice/payment/fee/enrollment |
| `cross_player_leak_risk` | Multiple players — review scope | orange | 3+ distinct capitalized names in one transcript |

---

## Role permission matrix

| Intent | Director | Head Coach | Coach |
|--------|----------|-----------|-------|
| create_session_draft | ✓ | ✓ | ✗ |
| create_group_draft | ✓ | ✓ | ✗ |
| set_group_focus | ✓ | ✓ | ✗ |
| create_player_review_request | ✓ | ✓ | ✗ |
| create_parent_safe_draft | ✓ | ✓ | ✗ |
| summarize_curriculum_gaps | ✓ | ✓ | ✗ |
| create_coach_briefing | ✓ | ✓ | ✗ |
| record_director_note | ✓ | ✓ | ✗ |
| record_attendance_exception | ✓ | ✓ | ✓ |
| flag_unrostered_attendee | ✓ | ✓ | ✓ |
| create_player_observation | ✓ | ✓ | ✓ |
| create_gate_evidence_draft | ✓ | ✓ | ✓ |
| create_session_recap | ✓ | ✓ | ✓ |
| create_gap_signal | ✓ | ✓ | ✓ |
| create_parent_safe_candidate | ✓ | ✓ | ✓ |
| alert_director | ✓ | ✓ | ✓ |

Destination routing also enforces role restrictions (see `voiceDestinationRouter.ts`). `parent_safe_draft`, `player_mission`, `session_planning`, `group_planning`, `coach_briefing`, `director_note` are restricted to Director/Head Coach in the destination catalogue.

---

## QA safety checklist

Before demo, confirm all of the following:

- [ ] VoiceIntakePanel shows "Review draft only — nothing changes until you approve"
- [ ] VoiceStructuredResultCard shows "Review draft only — requires approval" badge when `requires_review = true`
- [ ] Safety flags render as orange/red chips in `VoiceStructuredResultCard`
- [ ] "Create Review Draft" button creates a `proposed_actions` row with `status = pending_review`
- [ ] Success state shows "✓ Voice intake draft created" + review queue link
- [ ] Review queue Voice Intake tab shows the draft with full payload
- [ ] VoiceIntakeDraftCard shows "Source: Voice Intake — no data changed without director approval"
- [ ] Decision controls present: Approve / Needs Clarification / Reject
- [ ] Approving updates `status = approved` — no other tables written
- [ ] Rejecting updates `status = rejected` — no other tables written
- [ ] Coach session panel shows "No parent message sent · No level change · No roster change — all require director approval"
- [ ] QA script: 15/15 passing (`node scripts/qa-voice-intake-structure.mjs`)
- [ ] TypeScript: `npx tsc --noEmit` clean

---

## V1 known limitations

1. **No real STT.** Voice capture uses the browser's native `SpeechRecognition` API (Chrome/Edge only). On unsupported browsers, the mic button is hidden and text input is always available. Production voice should use a dedicated STT service (Whisper, Google STT, etc.).

2. **Deterministic structuring only.** Intent detection is pure pattern matching — no AI inference. Long or ambiguous transcripts may produce `unknown` or miss secondary intents.

3. **No voice intake execution in V1.** Approving a voice intake draft marks it as reviewed but triggers no downstream execution. The director sees the intent, reviews it, and approves — but the actual creation of (e.g.) a session plan, attendance exception, or player observation requires a future execution sprint.

4. **No real-time session context.** The coach session voice panel (`CoachRecapCommandPanel`) has the session ID available but voice structuring does not use live roster data. Player name extraction is heuristic — names matched by capitalization pattern, not against a real roster.

5. **Player names are not resolved to IDs.** Extracted player names in voice intake drafts (e.g., "Lucas", "Maya") are display strings, not resolved UUIDs. The review card shows them as extracted entities. Resolution to actual player records is a future sprint.

6. **No multi-turn context.** Each voice submission is stateless. The system does not remember previous intents or build on prior context within a session.

7. **No voice intake metrics.** There is no analytics surface yet showing how many voice intakes are submitted per session, approval rates, or safety flag frequency.

---

## Future AI/STT integration path

The voice intake architecture was intentionally designed to be STT/AI-agnostic:

1. **Replace `VoiceTextInput` browser STT** with a dedicated STT provider (Whisper API, Google STT, Deepgram) without changing any downstream components. The `VoiceIntakePanel` accepts a `value/onChange` string — the source of that string is swappable.

2. **Replace `structureVoiceIntake()` deterministic logic** with an LLM-backed structurer that returns the same `VoiceIntakeStructureResult` shape. Because the type contract is the same, no UI changes are required. The safety flags, NEVER_AUTOMATIC list, and destination routing remain in the TypeScript layer regardless of what generates the intents.

3. **Add AI-driven player name resolution.** The extracted `affected_players` array can be fed to a fuzzy name resolver that matches against the academy roster and populates `player_ids` in the draft payload. The review card can then show confirmed vs. unresolved player matches.

4. **Add confidence feedback loops.** Track which voice intents are approved vs. rejected over time and use that signal to improve future pattern matching or tune an LLM classifier.

5. **Add voice intake execution routing.** Once `execute_approved_action()` RPC covers voice intake action types, approved voice intake drafts can trigger specific downstream actions (create session plan, create attendance exception, etc.) via the existing proposed_actions execution pipeline.
