# Data Flow Map

## Architecture Principle

The intelligence engine runs continuously in the background. Every piece of data flows upward toward the Director Command Center (everything visible) and downward toward simplified role-specific views (right level of detail per role). Complexity is hidden from players and parents — not stripped out of the data.

```
                        ENGINE (background)
                              ↑
  Assessment → Signal → Score → Priority → Recommendation → Outcome → Learning
                              ↓
              Director Dashboard (full)
              ├── Coach Workspace (execution layer)
              │   ├── Player App (motivation — filtered)
              │   └── Parent App (trust — filtered)
              └── Intelligence (model / flywheel / cohort)
```

---

## Flow 1: Assessment → Director Dashboard

```
Coach records assessment (5 dimensions: technical, tactical, movement, competition, behavioral)
  ↓
assessments table — overall_score computed
  ↓
Trigger: tr_assessment_update_progression
  ├── player_progressions updated
  ├── player_time_series entry added
  ├── player_progress_snapshots taken
  └── emit_signal() → score_improvement or score_regression
  ↓
score_player() triggered (via tr_signal_triggers_rescore)
  ↓
decision_scores updated (composite score + urgency label)
  ↓
Director Dashboard updates:
  - Priority Queue card (urgency re-ranked)
  - Academy Vital Signs (urgent player count)
  - Player Profile → Overview tab (score card)
  - Player Profile → Skill Path tab (radar chart)
  ↓
Coach Workspace updates:
  - Player row urgency badge
  - Today's focus (if recommendation changes)
```

---

## Flow 2: Live Session → Outcomes → Curriculum → All Roles

```
Coach runs live session (C3 screen)
  ↓
Attendance recorded → player_attendance
Block completion marked → session_blocks.completed = true
Outcome recorded per player per exercise
  ↓
player_outcomes inserted
  ↓
Trigger: tr_outcome_curriculum_update
  └── evaluate_curriculum_domain_progress(player_id, academy_id)
      → player_domain_progress updated (outcome_count, positive_count, status)
      → domain status: not_started → in_progress → complete
  ↓
Trigger: tr_session_complete_load (on session.status = completed)
  └── compute_player_load(player_id)
      → player_load_aggregation updated (7d + 28d windows, fatigue_risk_score)
      → if fatigue_risk_score ≥ threshold: emit_signal('overtraining_risk')
  ↓
What each role sees next:

  DIRECTOR:
    - Priority Queue updates if urgency changed
    - Load Warnings card updates
    - Curriculum Coverage bar updates if domain completed
    - Coach Activity card: session marked as logged

  COACH:
    - Player row: Today's focus may update
    - Load warning on player if overtraining emitted
    - Player Profile → Curriculum tab: domain ring progresses

  PLAYER:
    - Progress screen: domain fill bar updates
    - Wins screen: new milestone appears if domain completed
    - Home: "Next Goal" updates if mastery threshold crossed

  PARENT:
    - Progress screen: domain status label updates
    - Wins screen: milestone appears if domain completed
```

---

## Flow 3: Voice Command → Director Approval → Execution → State

```
Coach or Director taps 🎙 Voice AI
  ↓
voice_commands table (raw transcript stored)
  ↓
AI processes intent:
  - Confidence ≥ 0.85 → high_confidence → auto-present for approval
  - Confidence 0.70–0.84 → needs_review → flagged for human check
  - Confidence < 0.70 → clarification_required → clarification card shown
  - Confidence < 0.40 → rejected → try again prompt
  ↓
proposed_actions table (status = pending_approval)
  ↓
Director Dashboard: Pending Approvals count +1  [bell badge]
  ↓
Director reviews in approval queue:
  ├── Approve → execute_approved_action()
  └── Reject → status = rejected, coach notified
  ↓
execute_approved_action():
  - Creates session / updates player / records note / etc.
  - Logs to execution_logs
  ↓
System state updated → downstream triggers fire
```

---

## Flow 4: Engine Loop (nightly batch) → Director Morning View

```
06:00 UTC — flag_overdue_reassessments()
  → reassessment_overdue signals emitted for players past due date
  → Director Alert card updates

06:30 UTC — score_academy_players(academy_id)
  → For each active player:
      score_player(player_id, academy_id)
      ├── reads all active signals
      ├── applies academy_threshold_configs (dynamic thresholds)
      ├── applies behavioral profile adjustments
      └── writes decision_scores (composite + urgency)
  → Director Priority Queue re-ranked for morning review

07:00 UTC — expire_stale_signals()
07:30 UTC — evaluate_overrides() → decision_learning_logs updated

09:00 UTC — run_cohort_intelligence(academy_id)
  → assign_player_to_cohorts() per player
  → compute_cohort_stats() per cohort
  → emit cohort_below_average / cohort_above_average for outliers
  → Director Cohort Insights card updates

09:30 UTC — run_academy_benchmarks(academy_id)
  → compute_player_benchmarks() per player
  → benchmark_below/above_expectation signals emitted
  → Director Competition card updates

10:00 UTC Sunday — run_flywheel(academy_id)
  → compute_signal_effectiveness()
  → compute_exercise_effectiveness()
  → propose_weight_adjustments() — creates director_configuration (NOT auto-applied)
  → Director Flywheel card: "2 insights need action"
```

**Director opens dashboard at 08:00 → sees clean morning briefing with overnight results.**

---

## Flow 5: Recommendation → Coaching Message → Parent + Player

```
Engine: generate_recommendations() (inside run_full_engine())
  ↓
player_recommendations table (pending approval)
  ↓
Director/Head Coach reviews in Recommendation Queue:
  ├── Approve → recommendation status = approved
  └── Override → recommendation_overrides recorded + reason required
  ↓
generate_coaching_message() (inside run_full_engine())
  → Tone selected based on urgency + behavioral profile
  → Short message (≤280 chars) + detailed message generated
  → Audience determined (player / coach / parent / all)
  ↓
coaching_messages table (is_reviewed = false, is_sent = false)
  ↓
Coach reviews in Notes + Comms tab of Player Profile:
  ├── Edit if needed
  └── Send → is_sent = true
  ↓
What appears by role:

  PLAYER:
    - Messages screen: coach message (if audience = player or all)
    - Home screen: Today's Focus (if message contains focus keyword)

  PARENT:
    - Updates screen: message (if audience = parent or all)
    - Progress screen: "What you can do at home" (from parent_level_descriptions)

  COACH:
    - Notes + Comms tab: sent messages log
    - Parent Comms Queue in Director Dashboard count decreases
```

---

## Flow 6: Curriculum Advancement — Director Approval

```
evaluate_curriculum_domain_progress() runs after each outcome
  ↓
check_progression_eligibility() runs in engine cycle
  ↓
If eligible:
  emit_signal('curriculum_ready_to_advance')
  Update player_curriculum_states.advancement_eligible = true
  ↓
Director Dashboard:
  - Curriculum Coverage bar: player shown with "3 eligible to advance" label
  - Priority Queue: advancement_eligible players surfaced
  ↓
Director or Head Coach clicks "Advance Level" (Director Dashboard or Player Profile)
  ↓
advance_player_level(player_id, academy_id, advanced_by):
  - Validates eligibility
  - Writes player_curriculum_history
  - Updates player_curriculum_states → new level, new enrolled_at
  - Initializes player_domain_progress for new level (all domains: not_started)
  - Resolves curriculum_ready_to_advance signal
  ↓
What each role sees:

  DIRECTOR:
    - Curriculum Coverage bar updates
    - Priority Queue reloads
    - Player Profile → Curriculum tab: new level + fresh domain rings

  COACH:
    - Player row: level badge updates
    - Player Profile → Curriculum tab: new level

  PLAYER:
    - Home: Stage badge updates (new color), level name updates
    - Wins: "Moved to [New Level]" milestone card appears

  PARENT:
    - Home: level name updates, new plain-language description loads
    - Wins: milestone card appears
    - Progress: domain status resets (all "Working on")
```

---

## Data Hierarchy Summary

```
academies
  ├── profiles (staff accounts → academy_memberships with roles)
  └── players
      ├── ─── CURRICULUM ──────────────────────────────
      │   player_curriculum_states (current level)
      │   └── player_domain_progress (8 domains)
      │       └── player_curriculum_history (advancement log)
      │
      ├── ─── INTELLIGENCE ENGINE ──────────────────────
      │   player_development_signals
      │   └── → decision_scores (composite + urgency)
      │       └── → player_priorities (ranked)
      │           └── → player_recommendations
      │               ├── recommendation_reasoning
      │               ├── session_recommendations
      │               └── coaching_messages
      │
      ├── ─── DEVELOPMENT DATA ─────────────────────────
      │   assessments → player_time_series
      │   player_outcomes
      │   player_load_aggregation
      │   player_behavior_profiles
      │   player_predictions
      │
      ├── ─── EXTERNAL BENCHMARKS ──────────────────────
      │   player_utr_profiles → player_utr_history
      │   player_benchmark_results → benchmark_definitions
      │   cohort_memberships → player_cohorts → cohort_stats
      │
      └── ─── AUDIT + HISTORY ──────────────────────────
          coach_observations + voice_notes
          recommendation_overrides
          decision_learning_logs
          weight_change_history
```
