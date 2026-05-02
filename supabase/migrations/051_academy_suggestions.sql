-- Sprint 177: Academy Suggestions Table
-- Stores reviewable system-generated suggestions for director review.
-- Never auto-applied. Director or head_coach must explicitly accept a suggestion.
-- RLS: director/head_coach only — no parent/player access.

CREATE TABLE academy_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'denied', 'deferred', 'applied', 'failed')),
  source TEXT NOT NULL DEFAULT 'system',
  entity_type TEXT,
  entity_id UUID,
  evidence JSONB NOT NULL DEFAULT '[]'::JSONB,
  impact_preview JSONB NOT NULL DEFAULT '{}'::JSONB,
  proposed_changes JSONB NOT NULL DEFAULT '{}'::JSONB,
  will_not_change JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_by UUID REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE academy_suggestions ENABLE ROW LEVEL SECURITY;

-- Directors and head coaches can read suggestions for their academy
CREATE POLICY "academy directors and head coaches can read academy_suggestions"
  ON academy_suggestions FOR SELECT
  USING (
    academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid()
        AND is_active = true
        AND role IN ('academy_director', 'head_coach')
    )
  );

-- Directors and head coaches can insert suggestions for their academy
CREATE POLICY "academy directors and head coaches can insert academy_suggestions"
  ON academy_suggestions FOR INSERT
  WITH CHECK (
    academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid()
        AND is_active = true
        AND role IN ('academy_director', 'head_coach')
    )
  );

-- Directors and head coaches can update suggestions (for review status changes)
CREATE POLICY "academy directors and head coaches can update academy_suggestions"
  ON academy_suggestions FOR UPDATE
  USING (
    academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid()
        AND is_active = true
        AND role IN ('academy_director', 'head_coach')
    )
  );

-- Index: fast lookups by academy
CREATE INDEX idx_academy_suggestions_academy_id
  ON academy_suggestions (academy_id);

-- Index: fast filtering by status within academy
CREATE INDEX idx_academy_suggestions_status
  ON academy_suggestions (academy_id, status);

-- Index: duplicate prevention — same suggestion type + entity within academy
CREATE INDEX idx_academy_suggestions_entity
  ON academy_suggestions (academy_id, suggestion_type, entity_type, entity_id)
  WHERE status = 'pending';
