-- Sprint 94: Session Adjustment Suggestions
-- Stores deterministic rule-engine suggestion drafts for human review/apply.
-- Never auto-applied. Suggestions modify only session_blocks.notes when approved+applied.

CREATE TABLE session_adjustment_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  source_template_id UUID REFERENCES templates(id),
  group_id UUID REFERENCES groups(id),
  curriculum_level_id UUID REFERENCES curriculum_levels(id),
  academy_curriculum_version_id UUID,
  target_session_block_id UUID REFERENCES session_blocks(id),
  suggestion_type TEXT NOT NULL,
  suggested_change TEXT NOT NULL,
  reason TEXT NOT NULL,
  players_supported JSONB NOT NULL DEFAULT '[]',
  player_needs_considered JSONB NOT NULL DEFAULT '[]',
  curriculum_context JSONB NOT NULL DEFAULT '{}',
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  scope TEXT NOT NULL DEFAULT 'this_session_only',
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('draft', 'pending_review', 'approved', 'applied', 'rejected', 'dismissed')),
  created_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  applied_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ
);

ALTER TABLE session_adjustment_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academy members can read session_adjustment_suggestions"
  ON session_adjustment_suggestions FOR SELECT
  USING (
    academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "academy directors and head coaches can insert session_adjustment_suggestions"
  ON session_adjustment_suggestions FOR INSERT
  WITH CHECK (
    academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid()
        AND is_active = true
        AND role IN ('academy_director', 'head_coach')
    )
  );

CREATE POLICY "academy directors and head coaches can update session_adjustment_suggestions"
  ON session_adjustment_suggestions FOR UPDATE
  USING (
    academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid()
        AND is_active = true
        AND role IN ('academy_director', 'head_coach')
    )
  );

CREATE INDEX idx_session_adjustment_suggestions_session_id
  ON session_adjustment_suggestions (session_id);

CREATE INDEX idx_session_adjustment_suggestions_academy_id
  ON session_adjustment_suggestions (academy_id);
