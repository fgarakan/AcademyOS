-- ============================================================
-- ACADEMY OS — MIGRATION 064: FIRST-RUN DECK PROFILE FIELDS
-- Adds two columns to public.profiles to track whether a user
-- has seen and dismissed the role-specific first-run introduction deck.
--
-- WHY:
--   Sprint 210 added the AOSDeck component and 18 role-specific
--   illustrations. Sprint 211 wires it into the app using
--   persistent DB gating instead of localStorage, so the deck
--   is shown once per user across all devices and sessions.
--
-- COLUMNS ADDED:
--   has_seen_first_run_deck  BOOLEAN NOT NULL DEFAULT false
--   first_run_deck_seen_at   TIMESTAMPTZ (nullable, set when dismissed)
--
-- SAFETY:
--   ADD COLUMN IF NOT EXISTS — idempotent, safe to re-run
--   Existing rows get DEFAULT false → all existing users will
--   see the deck exactly once on next visit (intentional).
--   No rows deleted or modified.
--   No RLS changed.
--   No other tables touched.
--
-- Sprint: 211 — First-Run Deck Gating + Role Wiring V1
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_seen_first_run_deck BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_run_deck_seen_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.has_seen_first_run_deck IS
  'True once the user has completed or skipped the role first-run introduction deck. '
  'Defaults to false — all users see the deck exactly once on next visit. '
  'Set via markFirstRunDeckSeenAction server action. Added Sprint 211.';

COMMENT ON COLUMN public.profiles.first_run_deck_seen_at IS
  'Timestamp when has_seen_first_run_deck was set to true. '
  'NULL until the deck has been dismissed. Added Sprint 211.';
