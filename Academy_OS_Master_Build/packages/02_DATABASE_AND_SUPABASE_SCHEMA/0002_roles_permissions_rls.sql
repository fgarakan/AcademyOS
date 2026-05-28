-- ============================================================
-- ACADEMY OS — MIGRATION 0002: ROLES, PERMISSIONS, RLS
-- Row Level Security policies for all core tables
-- ============================================================

-- Enable RLS on all core tables
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_group_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- Used inside RLS policies. Cached per transaction.
-- ============================================================

-- Get the current user's profile id
CREATE OR REPLACE FUNCTION auth_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get the current user's academy_id
CREATE OR REPLACE FUNCTION auth_academy_id()
RETURNS UUID AS $$
  SELECT academy_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if current user has a given role in their academy
CREATE OR REPLACE FUNCTION auth_has_role(check_role user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM academy_memberships
    WHERE profile_id = auth.uid()
    AND role = check_role
    AND is_active = true
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if current user is a staff member (any staff role)
CREATE OR REPLACE FUNCTION auth_is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM academy_memberships
    WHERE profile_id = auth.uid()
    AND role IN ('academy_director', 'head_coach', 'coach')
    AND is_active = true
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if current user is director or head coach
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
-- ACADEMIES RLS
-- Users can only see their own academy
-- ============================================================
CREATE POLICY "Users see their own academy"
  ON academies FOR SELECT
  USING (id = auth_academy_id());

CREATE POLICY "Directors can update academy settings"
  ON academies FOR UPDATE
  USING (id = auth_academy_id() AND auth_has_role('academy_director'));

-- ============================================================
-- PROFILES RLS
-- Users see profiles in their academy. Only staff sees all.
-- ============================================================
CREATE POLICY "Staff see all profiles in academy"
  ON profiles FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Players see own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Directors manage all profiles"
  ON profiles FOR ALL
  USING (academy_id = auth_academy_id() AND auth_has_role('academy_director'));

-- ============================================================
-- ACADEMY MEMBERSHIPS RLS
-- ============================================================
CREATE POLICY "Staff see memberships in their academy"
  ON academy_memberships FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors manage memberships"
  ON academy_memberships FOR ALL
  USING (academy_id = auth_academy_id() AND auth_has_role('academy_director'));

-- ============================================================
-- GROUPS RLS
-- ============================================================
CREATE POLICY "All academy members see groups"
  ON groups FOR SELECT
  USING (academy_id = auth_academy_id());

CREATE POLICY "Directors and head coaches manage groups"
  ON groups FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

-- ============================================================
-- COACH GROUP ASSIGNMENTS RLS
-- ============================================================
CREATE POLICY "Staff see coach assignments"
  ON coach_group_assignments FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors manage coach assignments"
  ON coach_group_assignments FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

-- ============================================================
-- AUDIT LOGS RLS
-- ============================================================
CREATE POLICY "Directors see all audit logs"
  ON audit_logs FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "System inserts audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (academy_id = auth_academy_id());

-- No UPDATE or DELETE on audit logs (immutable)
