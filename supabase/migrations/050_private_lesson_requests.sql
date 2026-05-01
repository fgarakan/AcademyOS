-- Sprint 151: Private Lesson Requests
-- Stores parent/player requests for private lessons, routed to director queue.
-- No automatic communication, no calendar events, no billing.

CREATE TABLE private_lesson_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  parent_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  requested_coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  requested_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  preferred_days TEXT,
  preferred_times TEXT,
  goal TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewing', 'assigned', 'scheduled', 'declined', 'completed')),
  director_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE private_lesson_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "directors and head coaches can select private_lesson_requests"
  ON private_lesson_requests FOR SELECT
  USING (
    academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid()
        AND is_active = true
        AND role IN ('academy_director', 'head_coach')
    )
  );

CREATE POLICY "directors and head coaches can insert private_lesson_requests"
  ON private_lesson_requests FOR INSERT
  WITH CHECK (
    academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid()
        AND is_active = true
        AND role IN ('academy_director', 'head_coach')
    )
  );

CREATE POLICY "directors and head coaches can update private_lesson_requests"
  ON private_lesson_requests FOR UPDATE
  USING (
    academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid()
        AND is_active = true
        AND role IN ('academy_director', 'head_coach')
    )
  );
