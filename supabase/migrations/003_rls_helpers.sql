-- ============================================================
-- ACADEMY OS — MIGRATION 003: RLS HELPER FUNCTIONS + CORE POLICIES
-- All policies for tables created in 002.
-- Helper functions are SECURITY DEFINER + STABLE for cache efficiency.
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- Called inside RLS policies — keep them fast.
-- ============================================================

CREATE OR REPLACE FUNCTION auth_academy_id()
RETURNS UUID AS $$
  SELECT academy_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_has_role(check_role user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM academy_memberships
    WHERE profile_id = auth.uid()
    AND role = check_role
    AND is_active = true
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Staff = any of the three staff roles
CREATE OR REPLACE FUNCTION auth_is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM academy_memberships
    WHERE profile_id = auth.uid()
    AND role IN ('academy_director', 'head_coach', 'coach')
    AND is_active = true
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Directors and head coaches can approve placements and voice actions
CREATE OR REPLACE FUNCTION auth_is_director_or_head()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM academy_memberships
    WHERE profile_id = auth.uid()
    AND role IN ('academy_director', 'head_coach')
    AND is_active = true
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- ENABLE RLS ON ALL CORE TABLES
-- ============================================================
ALTER TABLE academies               ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_memberships     ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_levels          ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_group_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs              ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ACADEMIES POLICIES
-- ============================================================
CREATE POLICY "Users see their own academy"
  ON academies FOR SELECT
  USING (id = auth_academy_id());

CREATE POLICY "Directors update academy settings"
  ON academies FOR UPDATE
  USING (id = auth_academy_id() AND auth_has_role('academy_director'));

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
CREATE POLICY "Staff see all profiles in academy"
  ON profiles FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Users see own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Directors manage profiles"
  ON profiles FOR ALL
  USING (academy_id = auth_academy_id() AND auth_has_role('academy_director'));

-- ============================================================
-- ACADEMY MEMBERSHIPS POLICIES
-- ============================================================
CREATE POLICY "Staff see academy memberships"
  ON academy_memberships FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors manage memberships"
  ON academy_memberships FOR ALL
  USING (academy_id = auth_academy_id() AND auth_has_role('academy_director'));

-- ============================================================
-- ACADEMY LEVELS POLICIES
-- ============================================================
CREATE POLICY "Academy members see levels"
  ON academy_levels FOR SELECT
  USING (academy_id = auth_academy_id());

CREATE POLICY "Directors manage levels"
  ON academy_levels FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

-- ============================================================
-- GROUPS POLICIES
-- ============================================================
CREATE POLICY "Academy members see groups"
  ON groups FOR SELECT
  USING (academy_id = auth_academy_id());

CREATE POLICY "Directors and heads manage groups"
  ON groups FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

-- ============================================================
-- COACH ASSIGNMENTS POLICIES
-- ============================================================
CREATE POLICY "Staff see coach assignments"
  ON coach_group_assignments FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors manage coach assignments"
  ON coach_group_assignments FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

-- ============================================================
-- AUDIT LOG POLICIES
-- Immutable: INSERT allowed, no UPDATE or DELETE.
-- ============================================================
CREATE POLICY "Directors see audit logs"
  ON audit_logs FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "System inserts audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (academy_id = auth_academy_id());
