-- ============================================================
-- ACADEMY OS — MIGRATION 040: PLATFORM ROLES
-- Platform-level access table. Identifies users who have
-- platform_owner or platform_admin access (Angles staff).
-- These users operate above the academy level and can view
-- all academy tenants using the regular anon key (RLS).
--
-- Uses auth.users(id) directly — a platform user may or may
-- not have an academy profile row.
--
-- Also adds an additive SELECT policy on academies so
-- platform users can list all tenants without service role.
-- The existing "Users see their own academy" policy is
-- unchanged — Supabase SELECT policies are OR'd together.
-- ============================================================

-- ============================================================
-- TABLE
-- ============================================================
CREATE TABLE platform_roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('platform_owner', 'platform_admin')),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  granted_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX idx_platform_roles_user ON platform_roles(user_id);

CREATE TRIGGER tr_platform_roles_updated_at
  BEFORE UPDATE ON platform_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS — platform_roles
-- Users can read their own active row.
-- All inserts, updates, and deletes must be performed via
-- the Supabase Dashboard or service role — no app-level writes.
-- ============================================================
ALTER TABLE platform_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own platform role"
  ON platform_roles FOR SELECT
  USING (user_id = auth.uid() AND is_active = true);

-- ============================================================
-- ACADEMIES — additive platform visibility policy
-- Allows platform_owner / platform_admin to list all academy
-- tenants via the regular anon key. Existing policies intact.
-- ============================================================
CREATE POLICY "Platform roles see all academies"
  ON academies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_roles
      WHERE user_id = auth.uid()
        AND is_active = true
    )
  );
