-- ============================================================
-- ACADEMY OS — MIGRATION 001: EXTENSIONS
-- Must run first. No dependencies.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- trigram text search on names/labels
CREATE EXTENSION IF NOT EXISTS "unaccent";       -- accent-insensitive search (player names)
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- query performance visibility
