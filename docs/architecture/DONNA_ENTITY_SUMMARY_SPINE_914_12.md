# DONNA Entity Summary Spine V1
**Sprint:** 914.12 | Entity types: academy, player, group, curriculum_level, template, session. Summary kinds: operating, health, curriculum, progress, risk. UNIQUE per (academy, entity_type, entity_id, summary_kind). Upsert semantics. No AI summaries in V1. Context packet includes entity summary when currentEntity is set.
