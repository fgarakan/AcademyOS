# Voice Intake Architecture

**Version:** 1.0
**Sprint:** 240
**Date:** 2026-05-04
**Status:** Active — defines the V1 Voice Intake OS foundation

---

## North Star

Academy OS is a voice-first, role-aware operating system for tennis academies.

> Voice captures messy human intent.
> OS structures it.
> OS identifies possible destinations.
> OS proposes the highest-impact uses.
> Human confirms.
> System updates or drafts safely.

Or, compressed to the operating model:

> **Voice creates → UI confirms → Database structures → System executes**

Every voice input follows this sequence. Nothing skips a step. Nothing executes without
human confirmation. Nothing reaches a player or parent without director or head coach approval.

---

## Why Voice Is the Input Layer, Not a Feature

Voice is not a notification. Voice is not a helper widget.
Voice is the primary input channel for every role in Academy OS.

- A director at courtside should be able to speak a group change and have it drafted for review.
- A coach between drills should be able to speak a recap and have it structured into attendance, observations, and evidence candidates.
- The OS should identify all useful destinations for a spoken message.
- The OS should recommend the highest-impact use.
- The OS should show exactly what would change and what would not change.
- Human approval remains required for every important change.

The text fallback is not a degraded experience. For V1, text input IS the voice experience.
Browser-based SpeechRecognition is an enhancement — the text transcript is always the payload.

---

## Role-Specific Voice Sources

| Role | Voice entry point | Primary uses |
|---|---|---|
| `academy_director` | `/director/command-center` | Session drafts, group changes, parent safe drafts, curriculum queries, director notes, coaching briefings |
| `head_coach` | `/director/command-center` | Session drafts, player observations, curriculum gap summaries |
| `coach` | `/coach/sessions/[sessionId]` | Session recaps, attendance exceptions, player observations, evidence signals, gap alerts |
| `player` | Not in scope V1 | (Future — player Q&A is deterministic text, not voice-driven yet) |
| `parent` | Not in scope V1 | (Future — parent messages received via approved director drafts only) |

---

## Director Voice Examples

```
"Create an Orange 2 session focused on movement recovery for next Tuesday."
"I want Orange 2 coaches watching Lucas and Maya for wide-ball recovery next week."
"Draft a parent update explaining what Orange 2 is working on this month."
"Show me all players who are missing curriculum evidence in the backhand domain."
"Note: Lucas is showing improvement — consider fast-tracking his gate review."
"Create a coach briefing for the Orange group about the upcoming tournament prep."
```

---

## Coach Voice Examples

```
"Everyone was here except Sarah — she texted that she'll be late next week."
"Jeremy showed up today but I don't think he is on the roster for this group."
"Lucas recovered much better after wide balls but then rushed his next shot."
"Maya understood the cross-court pattern today and executed it consistently."
"The group showed strong improvement in first-volley footwork."
"I think Lucas is close to the backhand gate — worth a director look."
```

---

## Supported V1 Voice Intents

### Director / Head Coach Intents

| Intent | Type | Creates Draft |
|---|---|---|
| `create_session_draft` | action | Yes — pending_review |
| `create_group_draft` | action | Yes — pending_review |
| `set_group_focus` | action | Yes — pending_review |
| `create_player_review_request` | action | Yes — pending_review |
| `create_parent_safe_draft` | action | Yes — pending_review |
| `summarize_curriculum_gaps` | query | No — read-only result |
| `create_coach_briefing` | action | Yes — pending_review |
| `record_director_note` | action | Yes — pending_review |

### Coach Intents

| Intent | Type | Creates Draft |
|---|---|---|
| `record_attendance_exception` | action | Yes — pending_review |
| `flag_unrostered_attendee` | action | Yes — pending_review |
| `create_player_observation` | action | Yes — pending_review |
| `create_gate_evidence_draft` | action | Yes — pending_review |
| `create_session_recap` | action | Yes — pending_review |
| `create_gap_signal` | action | Yes — pending_review |
| `create_parent_safe_candidate` | action | Yes — pending_review |
| `alert_director` | action | Yes — pending_review |

### Shared

| Intent | Type | Creates Draft |
|---|---|---|
| `unknown` | fallback | No — shows structured parse result only |

---

## Destination Modules

Every voice intake message may route to one or more destination modules.
The OS identifies all applicable destinations and recommends the highest-impact one.

| Destination | Description | Risk | Requires Approval |
|---|---|---|---|
| `attendance` | Records attendance exception or unrostered attendee | Medium | Yes |
| `unrostered_attendee_review` | Flags a player present who is not on the roster | Low | Yes |
| `session_actual` | Updates session actual focus vs plan | Low | Yes |
| `player_observation` | Creates a coach observation draft for a named player | Low | Yes |
| `curriculum_evidence` | Creates a gate evidence candidate draft | Medium | Yes |
| `gap_engine` | Adds a gap signal for director/coach attention | Low | Yes |
| `parent_safe_draft` | Generates a parent-safe summary candidate | Medium | Yes — director must approve before send |
| `player_mission` | Updates or creates a player mission draft | Medium | Yes |
| `director_review_queue` | Routes any draft to the director review queue | Low | Yes |
| `session_planning` | Creates a session plan draft | Low | Yes |
| `group_planning` | Creates a group change or focus draft | Medium | Yes |
| `coach_briefing` | Creates a coaching team briefing draft | Low | Yes |
| `curriculum_note` | Records a curriculum observation (internal only) | Low | Yes |
| `director_note` | Records a director internal note | Low | Yes |

---

## VoiceIntakeDraft Shape

The output of the voice intake structuring pipeline is a typed draft object.
This object is never written to the database directly — it becomes the `proposed_payload`
inside a `proposed_actions` row.

```typescript
interface VoiceIntakeDraft {
  // Identity
  role: VoiceIntakeRole               // which role submitted this
  context: VoiceIntakeContext         // what page / session / group context

  // Input
  raw_transcript: string              // original text or STT output — never modified
  cleaned_summary: string             // normalized, whitespace-cleaned version

  // Classification
  detected_intents: VoiceIntakeIntentType[]  // all matched intents
  confidence: 'high' | 'medium' | 'low'

  // Routing
  suggested_destinations: VoiceDestinationModule[]
  recommended_primary_action: string  // human-readable recommended next step

  // Extracted context
  extracted_entities: VoiceExtractedEntity[]
  affected_players: string[]          // player first names or IDs mentioned
  affected_groups: string[]           // group names mentioned
  affected_sessions: string[]         // session IDs mentioned (from context)
  curriculum_links: string[]          // curriculum level names mentioned
  gap_links: string[]                 // gap types inferred from language

  // Review state
  requires_review: boolean            // always true for action intents
  safety_flags: VoiceSafetyFlag[]     // any blocked or dangerous patterns detected

  // Transparency
  what_would_change: string[]         // if approved, what gets created/updated
  what_would_not_change: string[]     // always-blocked list — never automatic
}
```

### Supporting Types

```typescript
type VoiceIntakeRole =
  | 'academy_director'
  | 'head_coach'
  | 'coach'

type VoiceIntakeContext = {
  page: string                        // e.g. 'command-center', 'coach-session'
  session_id?: string
  group_id?: string
  academy_id: string
}

type VoiceIntakeIntentType =
  // Director
  | 'create_session_draft'
  | 'create_group_draft'
  | 'set_group_focus'
  | 'create_player_review_request'
  | 'create_parent_safe_draft'
  | 'summarize_curriculum_gaps'
  | 'create_coach_briefing'
  | 'record_director_note'
  // Coach
  | 'record_attendance_exception'
  | 'flag_unrostered_attendee'
  | 'create_player_observation'
  | 'create_gate_evidence_draft'
  | 'create_session_recap'
  | 'create_gap_signal'
  | 'create_parent_safe_candidate'
  | 'alert_director'
  // Shared
  | 'unknown'

type VoiceDestinationModule =
  | 'attendance'
  | 'unrostered_attendee_review'
  | 'session_actual'
  | 'player_observation'
  | 'curriculum_evidence'
  | 'gap_engine'
  | 'parent_safe_draft'
  | 'player_mission'
  | 'director_review_queue'
  | 'session_planning'
  | 'group_planning'
  | 'coach_briefing'
  | 'curriculum_note'
  | 'director_note'

type VoiceSafetyFlag =
  | 'parent_exposure_risk'       // message may contain internal language
  | 'auto_execution_requested'   // user said "do it" or "apply now"
  | 'level_change_requested'     // curriculum level change inferred
  | 'parent_send_requested'      // sending a parent message directly inferred
  | 'roster_mutation_requested'  // player add/remove/create inferred
  | 'billing_enrollment_risk'    // billing/enrollment language detected
  | 'cross_player_leak_risk'     // multiple player names mentioned together

type VoiceExtractedEntity = {
  type: 'player' | 'group' | 'curriculum_level' | 'session' | 'coach' | 'date' | 'focus' | 'unknown'
  value: string
  confidence: 'high' | 'medium' | 'low'
}
```

---

## Approval Rules

| Action | Who approves | How |
|---|---|---|
| Player curriculum level change | Director or Head Coach | Via `/director/review` |
| Attendance exception | Director or Head Coach | Via `/director/review` |
| Parent-safe message approved to send | Director only | Explicit send action — never automatic |
| Player observation saved | Director or Head Coach | Via `/director/review` |
| Session plan published | Director | Via `/director/review` |
| Player advancement activated | Director only | `finalize_player_placement()` only |
| Evidence requirement linked | Director or Head Coach | Via `/director/review` |
| Voice intake → proposed_action created | No extra approval needed | Creating the draft itself is safe |
| proposed_action → executed | Director or Head Coach | Via `/director/review` — `execute_approved_action()` only |

---

## Safety Rules

### Always blocked — cannot be triggered from voice intake:
1. Player curriculum level change without director/head_coach approval
2. Parent communication sent without explicit director approval
3. Attendance record change without director/head_coach confirmation
4. Player creation from partial voice payload
5. Roster/enrollment/billing mutation from voice
6. Player advancement via voice
7. AI-generated content reaching players or parents without human review
8. Any voice command bypassing `proposed_actions` pipeline
9. Coach observations published to players without director confirmation
10. Any player's data exposed to another player

### Safety flag responses:
- `parent_exposure_risk` → cleaned_summary must be sanitized via `sanitizeParentFacingText()` before any parent-safe draft field is populated
- `auto_execution_requested` → block execution path, add to `what_would_not_change`, surface to director
- `level_change_requested` → flag for director attention, do not set any level fields
- `parent_send_requested` → add "No parent message sent — requires director approval" to `what_would_not_change`
- `roster_mutation_requested` → block, add "No player created/removed automatically"
- `billing_enrollment_risk` → block, add "No billing or enrollment changes made"

---

## Mapping to proposed_actions

Voice intake drafts are stored as `proposed_actions` rows.

```
Voice transcript submitted
  ↓
structureVoiceIntake(role, transcript, context)
  ↓ VoiceIntakeStructureResult
createVoiceIntakeReviewDraft(result)
  ↓
1. INSERT voice_commands (input_method='typed', issuer_role, raw_input, processing_status='normalized')
2. INSERT proposed_actions (
     voice_command_id = <new voice_commands row>,
     action_type = 'other',
     target_module = 'voice_intake',
     proposed_payload = { VoiceIntakeDraft },
     status = 'pending_review'
   )
  ↓
Draft appears in /director/review
  ↓
Director reviews → approves → execute_approved_action() routes by detected_intent
  OR
Director rejects → no execution
```

**Important:** `action_type = 'other'` is used for voice intake drafts in V1.
`other` has no execution handler — director reviews and uses the review card to act.
Future sprint can wire `detected_intents` → specific `action_type` values for auto-routing.

---

## What Must Never Happen Automatically

This list is unconditional. Voice intake never triggers any of these without a human approval step:

- Player curriculum level change
- Parent communication sent
- Attendance record written
- Player created
- Player removed from group
- Session published
- Enrollment or billing change
- Player advancement
- Coach observation published to players
- Another player's data included in any output

The `what_would_not_change` array in every `VoiceIntakeDraft` always includes these items
as visible confirmation to the reviewing director.

---

## Text Input Fallback

The text fallback is not a degraded voice experience. It is the primary V1 experience.

**Why text fallback matters:**
- Browser SpeechRecognition has variable browser support (Chrome/Edge work; Firefox/Safari may not)
- SpeechRecognition requires microphone permission — users may deny it
- Noisy environments (tennis courts, indoor gyms) produce unreliable transcripts
- Text input produces cleaner, reviewable transcripts
- The structuring pipeline works identically on typed and spoken text

**V1 implementation rule:** Every voice UI component must degrade gracefully to text input.
The `VoiceTextInput` component at `src/components/voice/VoiceTextInput.tsx` already implements this pattern.

---

## Future AI/STT Integration Plan

V1 uses deterministic structuring only — no external AI calls.

### V2 — STT Integration
- Replace browser SpeechRecognition with a server-side STT step (e.g. Whisper via Supabase Edge Function)
- Store audio path in `voice_commands.audio_path`
- Return transcript, then feed through `structureVoiceIntake()` as normal

### V3 — AI-Assisted Intent Enrichment
- Add an optional AI enrichment step after deterministic structuring
- AI suggests additional entities, corrects names, resolves ambiguity
- AI output is additive — never replaces deterministic safety checks
- All AI output goes through same `requires_review = true` path
- External AI call is gated behind academy setting (opt-in)

### V4 — Real-Time Session Voice
- Continuous voice listening during a live session
- Coach speaks; transcript accumulates in real time
- End-of-session trigger: "Wrap up" → structures entire session voice log
- Same pipeline — no new approval bypass

---

## Build Order — Sprints 241–249

| Sprint | Title | What it builds |
|---|---|---|
| 241 | Universal Voice Button UI V1 | `VoiceIntakePanel` — reusable voice/text intake component; integrate into command-center |
| 242 | Voice Intake Draft Model V1 | `voiceIntakeTypes.ts` + `structureVoiceIntake()` — typed model and structuring helper |
| 243 | Director Voice Structuring V1 | Wire `structureVoiceIntake()` into command-center; show structured output in UI |
| 244 | Coach Voice Structuring V1 | Integrate VoiceIntakePanel into coach session page; show structured coach result |
| 245 | Voice Destination Router V1 | `voiceDestinationRouter.ts` — deterministic destination routing with risk levels |
| 246 | Voice Intake to Proposed Actions V1 | Server action to create `proposed_actions` from `VoiceIntakeDraft`; "Create review draft" button |
| 247 | Voice Intake Review Panel V1 | `VoiceIntakeDraftCard` in `/director/review`; display voice-sourced proposed_actions |
| 248 | Voice Safety and Role Guardrails V1 | `canRoleCreateVoiceIntent()`, `canRoleRouteToDestination()`, safety flag enforcement |
| 249 | Voice Intake Demo and QA V1 | Demo scripts, polish, QA checklist, limitations doc, CURRENT_BUILD_TARGET update |

---

## Architecture Diagram

```
User speaks or types
       ↓
VoiceIntakePanel (client component)
  - role badge
  - context label
  - transcript textarea (+ browser SpeechRecognition if available)
  - clear / submit
       ↓
onSubmit(transcript)
       ↓
structureVoiceIntake({ role, transcript, context })  ← pure helper, no DB
  - cleans transcript
  - detects intents (deterministic)
  - extracts entities
  - suggests destinations
  - recommends primary action
  - builds what_would_change
  - builds what_would_not_change
  - sets requires_review
  - sets safety_flags
  - returns VoiceIntakeStructureResult
       ↓
UI shows structured result for director/coach to review
  - detected intents
  - suggested destinations
  - recommended action
  - safety flags (if any)
  - what would change
  - what would NOT change
       ↓
"Create review draft" button
       ↓
createVoiceIntakeReviewAction(draft)  ← server action, writes to DB
  1. INSERT voice_commands
  2. INSERT proposed_actions (target_module='voice_intake', status='pending_review')
       ↓
/director/review — VoiceIntakeDraftCard
  - shows all VoiceIntakeDraft fields
  - director approves or rejects
       ↓
If approved: execute_approved_action() or manual director follow-through
If rejected: no changes made
```

---

## Relationship to Existing Pipeline

| Existing component | Role in voice intake |
|---|---|
| `VoiceTextInput` (`src/components/voice/VoiceTextInput.tsx`) | Base textarea+SpeechRecognition — reused inside VoiceIntakePanel |
| `voice-command-types.ts` | Spec types — VoiceIntakeDraft extends/augments these for intake-specific fields |
| `parseAcademyCommand.ts` | Director command parser — still used for director query intents; voice intake structuring is additive |
| `roleGuardrails.ts` | Permission model — voice intake checks `canRoleUseIntent()` before structuring |
| `structureRecapAction.ts` | Existing coach recap pattern — voice intake is the generalisation of this |
| `proposed_actions` table | Storage for all review drafts — voice intake drafts use `target_module = 'voice_intake'` |
| `/director/review` | Review queue — voice intake cards added here in Sprint 247 |
| `parentSafeResponseRules.ts` | Applied to any parent-safe draft candidate in voice intake output |

---

## Known V1 Limitations

1. `structureVoiceIntake()` uses deterministic pattern matching only — no AI
2. Player name extraction is partial (keyword matching, not roster lookup)
3. Browser SpeechRecognition requires Chrome/Edge; Firefox/Safari may show text-only fallback
4. `action_type = 'other'` means voice intake proposed_actions have no auto-execution path
5. Voice intake does not yet link directly to player IDs — director must confirm entity matches
6. Destination routing is advisory — director decides final action from the review card
7. No real-time session voice capture (V4 item)
8. No server-side STT — audio is not saved, only the resulting text transcript
