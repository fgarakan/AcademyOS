# Package 02 — Database and Supabase Schema
**Status:** Draft v1.0 — Migrations written, not yet run against real Supabase project

## Migration Files (run in order)
| File | Contents |
|---|---|
| `0001_core_schema.sql` | academies, profiles, roles, groups, memberships, audit_logs |
| `0002_roles_permissions_rls.sql` | RLS policies and helper auth functions |
| `0003_players_groups_profiles.sql` | players, guardians, group_memberships, player_progression |
| `0004_assessments_placement.sql` | assessments, placement_recommendations, finalize_player_placement() |
| `0005_templates_sessions_exercises.sql` | exercises, templates, template_blocks, sessions, session_blocks, attendance |
| `0006_coach_notes_observations.sql` | coach_observations, voice_notes, parent_updates |
| `0007_voice_commands_proposed_actions.sql` | voice_commands, proposed_actions, execute_approved_action() |
| `0008_audit_logs_versioning.sql` | Extended versioning (TODO) |
| `0009_seed_data.sql` | Demo academy, levels, groups, exercises |
| `0010_functions_triggers.sql` | Additional functions (TODO) |
| `0011_views_reporting.sql` | Reporting views (TODO) |

## Key functions
- `finalize_player_placement(recommendation_id, activator_id)` — activates a player placement
- `execute_approved_action(action_id, executor_id)` — executes an approved voice action
- `auth_academy_id()`, `auth_is_staff()`, `auth_is_director_or_head()` — RLS helpers

## Setup
See `SUPABASE_SETUP_GUIDE.md`

## Open items
- Files 0008, 0010, 0011 need content (TODO stubs only)
- TypeScript types not yet generated (need real Supabase project)
- RLS policies not yet tested
