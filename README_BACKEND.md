# Academy OS — Backend Reference

## Architecture

The core loop. Every system either feeds it or closes it.

```
player_development_signals
  → player_priorities       (ranked actionable focus areas)
    → player_recommendations (what to do, with confidence + urgency)
      → session_recommendations (specific sessions to run)
        → sessions + exercises  (execution)
          → player_outcomes     (what actually happened)
            → decision_learning_logs (did it work?)
              → recommendation_overrides (human corrections)
                → signal_priority_weights (weight adjustment)
                  → player_development_signals (better signals next cycle)
```

## Migration Order

Run in sequence. Each depends on the previous.

| File | Contents |
|------|----------|
| `001_extensions.sql` | PostgreSQL extensions (uuid-ossp, pg_trgm, unaccent) |
| `002_core_identity.sql` | Academies, profiles, roles, memberships, levels, groups |
| `003_rls_helpers.sql` | RLS helper functions + core table policies |
| `004_players.sql` | Players, guardians, group memberships, player progression |
| `005_assessments.sql` | Assessments, placement recommendations, `finalize_player_placement()` |
| `006_exercises_templates.sql` | Exercise library, templates, template blocks |
| `007_sessions.sql` | Sessions, session blocks, attendance |
| `008_voice_pipeline.sql` | Voice commands, clarification requests, action type enum |
| `009_proposed_actions.sql` | Proposed actions, execution logs, `execute_approved_action()` |
| `010_coach_notes.sql` | Coach observations, voice notes, parent updates |
| `011_audit_versioning.sql` | Object snapshots, changelog, `write_audit_log()`, `take_snapshot()` |
| `012_functions_triggers.sql` | Assessment → progression trigger, overdue flags, session-from-template |
| `013_reporting_views.sql` | Core reporting views (player summary, group summary, reassessment pipeline) |
| **— MOAT LAYERS —** | |
| `014_signal_layer.sql` | `player_development_signals`, `emit_signal()`, `resolve_signal()` |
| `015_utr_integration.sql` | `player_utr_profiles`, `player_utr_history`, `player_utr_matches`, `player_utr_insights` |
| `016_player_outcomes.sql` | `player_outcomes`, `player_progress_snapshots`, `take_progress_snapshot()` |
| `017_time_intelligence.sql` | `player_time_series`, `player_phase_states`, `academy_calendar`, `competition_schedule` |
| `018_player_load_aggregation.sql` | `player_load_aggregation`: 7d/28d windows, fatigue risk score, `compute_player_load()` |
| `019_decision_scoring.sql` | `signal_priority_weights`, `decision_scores`, `score_player()`, `score_academy_players()` |
| `020_player_priorities.sql` | `player_priorities`: ranked from signals, `generate_player_priorities()` |
| `021_recommendations.sql` | `player_recommendations`, `session_recommendations`, `run_full_engine()` |
| `022_learning_system.sql` | `recommendation_overrides`, `decision_learning_logs`, `evaluate_overrides()` |
| `023_moat_views.sql` | `v_academy_priority_queue`, `v_recommendation_review_queue`, `v_player_development_loop` |
| `024_seed_data.sql` | Demo academy, levels, groups, exercises, signal weights, demo players |
| **— INTELLIGENCE LAYERS —** | |
| `025_exercise_intelligence.sql` | Exercise tags (movement_pattern, skill_phase, load_type, transfer_level), `exercise_signal_mappings`, `exercise_outcome_improvements`, `get_exercises_for_signal()`, `populate_session_rec_exercises()` |
| `026_recommendation_reasoning.sql` | `recommendation_reasoning` (1:1 with recommendations), `build_recommendation_reasoning()`, updated `run_full_engine()` |
| `027_player_behavioral_model.sql` | `player_behavior_profiles` (fatigue_sensitivity, volume_response, pressure_tolerance etc.), `evaluate_behavior_profile()`, behavioral adjustments integrated into `score_player()` and `build_recommendation_reasoning()` |
| `028_predictions.sql` | `player_predictions` (predicted_performance_score, injury_risk_score, readiness_score), `generate_player_predictions()`, updated `run_full_engine()` |
| `029_coaching_output.sql` | `coaching_messages` (short player-facing + detailed coach-facing), `generate_coaching_message()`, `v_coaching_messages_pending`, final `run_full_engine()` with all 5 layers |
| **— SYSTEM INTELLIGENCE LAYERS —** | |
| `030_model_optimization.sql` | `academy_threshold_configs` (runtime-tunable urgency/load thresholds), `model_versions`, `model_evaluation_runs`, `snapshot_current_model()`, `evaluate_model_performance()`, dynamic `score_player()` |
| `031_cohort_intelligence.sql` | `player_cohorts`, `cohort_memberships`, `cohort_stats`, `assign_player_to_cohorts()`, `compute_cohort_stats()`, `get_cohort_comparison()`, `run_cohort_intelligence()` |
| `032_competitive_benchmarks.sql` | `benchmark_definitions`, `player_benchmark_results`, `compute_player_benchmarks()`, `run_academy_benchmarks()`, benchmark signals |
| `033_director_control.sql` | `director_configurations`, `weight_change_history` (auto-triggered), `save_current_as_configuration()`, `apply_director_configuration()`, `update_signal_weight()`, `update_threshold()` |
| `034_data_flywheel.sql` | `signal_effectiveness_scores`, `exercise_effectiveness_scores`, `system_usage_metrics`, `flywheel_insights`, `compute_signal_effectiveness()`, `propose_weight_adjustments()`, `run_flywheel()`, final `run_full_engine()` |
| **— SECURITY —** | |
| `035_security_fixes.sql` | `validate_player_academy()` helper; 8 functions patched with explicit tenant cross-checks |

## Running Migrations

```bash
# Option 1: Supabase CLI
supabase db push

# Option 2: psql direct (for initial setup or CI)
for f in supabase/migrations/*.sql; do
  psql "$DATABASE_URL" -f "$f"
done

# Option 3: Via Supabase dashboard SQL editor
# Paste each migration in order
```

## Authentication Setup

1. Create Supabase project at https://supabase.com
2. Run all migrations in order
3. In the Supabase Dashboard → Authentication → Users, create:
   - One academy director account
   - One or more coach accounts
4. After accounts exist, insert profiles and memberships:

```sql
-- Replace with real auth.users IDs from the dashboard
INSERT INTO profiles (id, academy_id, display_name, email)
VALUES (
  'the-auth-user-uuid-from-dashboard',
  '00000000-0000-0000-0000-000000000001',
  'Dr. Rachel Simmons',
  'director@angles.com'
);

INSERT INTO academy_memberships (academy_id, profile_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'the-auth-user-uuid-from-dashboard',
  'academy_director'
);
```

## Key Functions

### The voice pipeline
```typescript
// Submit a command
const commandId = await submitVoiceCommand(db, academyId, userId, role, 'Create a session for Elite-A next Monday')

// After AI processing creates a proposed_action:
await approveAction(db, actionId, directorId)
await executeApprovedAction(db, actionId, directorId)
```

### The decision engine
```typescript
// Full loop for one player
const result = await db.rpc('run_full_engine', { p_player_id: id, p_academy_id: academyId })

// Batch rescore all active players (run nightly)
await db.rpc('score_academy_players', { p_academy_id: academyId })
```

### Recording an assessment
```typescript
const { id, overall_score } = await createAssessment(db, academyId, playerId, coachId, {
  technical_score: 7.0,
  tactical_score: 6.5,
  movement_score: 7.5,
  competition_score: 6.0,
  behavioral_score: 8.0,
})
// Triggers automatically: progression update, time series, progress snapshot, signals
```

### Placing a new player
```typescript
// 1. Create assessment (type: 'intake', is_baseline: true)
// 2. AI generates placement_recommendation
// 3. Director approves
// 4. Activate:
const result = await finalizePlacement(db, recommendationId, directorId)
```

## Moat Architecture: Why It's Different

Most academy software has isolated tables. This system has a **signal mesh**:

- An assessment result doesn't just update a score — it emits `score_improvement` or `score_regression` signals
- A UTR drop emits `utr_regression` AND cross-validates against assessment scores to emit `utr_underperformance`
- Load calculations emit `overtraining_risk` which constrains the recommendations engine
- Session outcomes close the loop: was the recommended session actually helpful?
- Every override is tracked and evaluated 30 days later

The `score_player()` function aggregates all active signals using academy-configurable weights. A player with a `utr_regression` (weight 1.6) + `reassessment_overdue` (weight 1.4) + `overtraining_risk` (weight 1.8) gets a high composite score and `urgent` urgency — regardless of which individual signal fired first.

## Nightly Scheduled Functions

Set these up via Supabase Edge Functions + pg_cron:

```sql
-- Flag overdue reassessments (runs at 06:00 UTC)
SELECT cron.schedule('flag-reassessments', '0 6 * * *', $$SELECT flag_overdue_reassessments()$$);

-- Rescore all players (runs at 06:30 UTC)
SELECT cron.schedule('score-players', '30 6 * * *', $$SELECT score_academy_players('00000000-0000-0000-0000-000000000001')$$);

-- Expire stale signals (runs at 07:00 UTC)
SELECT cron.schedule('expire-signals', '0 7 * * *', $$SELECT expire_stale_signals()$$);

-- Evaluate overrides (runs at 07:30 UTC)
SELECT cron.schedule('evaluate-overrides', '30 7 * * *', $$SELECT evaluate_overrides()$$);

-- Run cohort intelligence nightly (runs at 09:00 UTC)
SELECT cron.schedule('cohort-intelligence', '0 9 * * *', $$SELECT run_cohort_intelligence('00000000-0000-0000-0000-000000000001')$$);

-- Run competitive benchmarks nightly (runs at 09:30 UTC)
SELECT cron.schedule('run-benchmarks', '30 9 * * *', $$SELECT run_academy_benchmarks('00000000-0000-0000-0000-000000000001')$$);

-- Run data flywheel weekly (runs at 10:00 UTC Sunday)
SELECT cron.schedule('flywheel', '0 10 * * 0', $$SELECT run_flywheel('00000000-0000-0000-0000-000000000001')$$);

-- Calibrate behavioral profiles weekly (runs at 08:30 UTC Monday)
SELECT cron.schedule('calibrate-behavior', '30 8 * * 1', $$
  SELECT evaluate_behavior_profile(p.id, p.academy_id)
  FROM players p WHERE p.is_active = true AND p.status = 'active'
$$);

-- Expire proposed actions (runs at 08:00 UTC)
SELECT cron.schedule('expire-actions', '0 8 * * *', $$SELECT expire_proposed_actions()$$);
```

## TypeScript Client Files

| File | Purpose |
|------|---------|
| `src/lib/supabase/client.ts` | Browser Supabase client (singleton) |
| `src/lib/supabase/server.ts` | Server Supabase client + admin client |
| `src/lib/supabase/database.types.ts` | Full TypeScript types for all tables |
| `src/lib/backend/players.ts` | Player queries, signals, engine calls |
| `src/lib/backend/sessions.ts` | Session queries, outcomes, recommendations |
| `src/lib/backend/assessments.ts` | Assessment CRUD, placement finalization |
| `src/lib/backend/voice.ts` | Voice pipeline, action approval, execution |
| `src/lib/backend/dashboard.ts` | Director dashboard queries |
| `src/lib/backend/utr.ts` | UTR data recording and retrieval |
| `src/lib/backend/intelligence.ts` | Reasoning queries, behavioral profiles, predictions, coaching messages |

## Bugs Fixed vs. Package Spec

| Bug | Location | Fix |
|-----|----------|-----|
| `guardians` missing `updated_at` | `004_players.sql` | Column added |
| `session_blocks` missing `updated_at` | `007_sessions.sql` | Column added |
| `cancel_session` missing from `action_type` enum | `008_voice_pipeline.sql` | Added |
| Placement spec: 4 dimensions vs 5 | `005_assessments.sql` | Correct 5-dimension schema |
| Confidence threshold inconsistency | `008_voice_pipeline.sql` | Canonical thresholds: ≥0.85 / 0.70–0.84 / <0.70 / <0.40 |
