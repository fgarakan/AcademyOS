# DATABASE CHANGELOG
**Academy OS — Schema change log**

Add a row every time a migration is written or modified.
Never modify a migration that has been run on any environment — write a new one.

---

| Date | Migration | Description | Author |
|---|---|---|---|
| 2026-04-27 | 0001_core_schema.sql | Academies, profiles, roles, memberships, groups, audit_logs | Initial build |
| 2026-04-27 | 0002_roles_permissions_rls.sql | RLS policies + auth helper functions | Initial build |
| 2026-04-27 | 0003_players_groups_profiles.sql | Players, guardians, group_memberships, player_progression | Initial build |
| 2026-04-27 | 0004_assessments_placement.sql | Assessments, placement_recommendations, finalize_player_placement() | Initial build |
| 2026-04-27 | 0005_templates_sessions_exercises.sql | Exercises, templates, sessions, attendance, session blocks | Initial build |
| 2026-04-27 | 0006_coach_notes_observations.sql | coach_observations, voice_notes, parent_updates | Initial build |
| 2026-04-27 | 0007_voice_commands_proposed_actions.sql | voice_commands, proposed_actions, execute_approved_action() | Initial build |
| 2026-04-28 | 0008_audit_logs_versioning.sql | object_snapshots, database_changelog table, write_audit_log(), take_snapshot() | Package completion |
| 2026-04-28 | 0009_seed_data.sql | Demo academy, director, coach, groups, levels, players | Initial build |
| 2026-04-28 | 0010_functions_triggers.sql | update_player_progression_from_assessment(), flag_overdue_reassessments(), create_session_from_template() | Package completion |
| 2026-04-28 | 0011_views_reporting.sql | v_player_summary, v_group_summary, v_reassessment_pipeline, v_session_load, v_pending_proposed_actions, v_recent_audit_log | Package completion |
