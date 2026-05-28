# BACKEND INVENTORY
**Generated:** 2026-04-27

## Current state

No backend exists. No Supabase project. No API routes. No auth.

## What has been created (spec/schema only)

| File | Purpose | Status |
|---|---|---|
| `0001_core_schema.sql` | Core tables, types, audit_logs | Written, not run |
| `0002_roles_permissions_rls.sql` | RLS policies + auth helpers | Written, not run |
| `0003_players_groups_profiles.sql` | Player system | Written, not run |
| `0004_assessments_placement.sql` | Placement engine + finalize_player_placement() | Written, not run |
| `0005_templates_sessions_exercises.sql` | Training system | Written, not run |
| `0006_coach_notes_observations.sql` | Notes + voice notes + parent updates | Written, not run |
| `0007_voice_commands_proposed_actions.sql` | Voice pipeline + execute_approved_action() | Written, not run |
| `0009_seed_data.sql` | Demo data | Written, not run |
| `voice-command-types.ts` | TypeScript types | ✅ Created |
| `placement-types.ts` | TypeScript types | ✅ Created |
| `proposed-action-validator.ts` | Validation logic | ✅ Created |
| `voice-command-examples.ts` | Sample commands + payloads | ✅ Created |

## What is missing

| Item | Priority | Blocker |
|---|---|---|
| Supabase project | CRITICAL | Manual action required |
| `0008_audit_logs_versioning.sql` | High | Content not written |
| `0010_functions_triggers.sql` | High | Content not written |
| `0011_views_reporting.sql` | Medium | Content not written |
| Generated TypeScript types (`database.ts`) | High | Need Supabase project |
| RLS testing | High | Need Supabase project |
| API routes (Next.js) | Medium | Need framework setup |
| Claude API integration | Medium | Need API key |
| Whisper integration (V2) | Low | V2 scope |
| Storage buckets (voice notes) | Medium | Need Supabase project |

## Key backend functions designed

### `finalize_player_placement(recommendation_id, activator_id)`
Location: `0004_assessments_placement.sql`
- Validates recommendation is approved
- Resolves final group/level/track (override takes precedence over recommendation)
- Deactivates existing group membership
- Creates new group membership
- Updates player status to 'active'
- Sets reassessment due date
- Writes audit log
- Returns summary JSONB

### `execute_approved_action(action_id, executor_id)`
Location: `0007_voice_commands_proposed_actions.sql`
- Validates action is approved and not expired
- Routes by action_type
- Executes appropriate operation
- Writes execution log
- Writes audit log
- Returns result JSONB

## API pattern (Next.js)

All Supabase mutations will go through Next.js API routes (server actions), never directly from the client:
- Keeps service role key server-side
- Validates user role before mutation
- Logs all changes

Pattern: `src/app/api/[feature]/route.ts` or `src/lib/supabase/actions/[feature].ts`
