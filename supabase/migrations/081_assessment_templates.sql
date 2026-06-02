-- Migration 081: Assessment Template System
-- Creates 5 tables for the template-driven Assessment Studio.
-- No existing tables are modified. All tables have RLS + academy_id scoping.

-- ─── assessment_templates ────────────────────────────────────────────────────
-- Holds the global platform-owned template (is_global=true) and
-- per-academy clones (is_global=false). Directors edit only their academy clone.

CREATE TABLE IF NOT EXISTS assessment_templates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id       uuid REFERENCES academies(id) ON DELETE CASCADE,
  name             text NOT NULL DEFAULT 'Core Assessment Template',
  is_global        boolean NOT NULL DEFAULT false,
  platform_version text NOT NULL DEFAULT '1.0',
  description      text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Global template has no academy_id; academy clones have academy_id.
-- Unique: one active clone per academy (enforced in application layer).

ALTER TABLE assessment_templates ENABLE ROW LEVEL SECURITY;

-- Global template: readable by all authenticated users.
DROP POLICY IF EXISTS "assessment_templates_select_global"
  ON assessment_templates;

CREATE POLICY "assessment_templates_select_global"
  ON assessment_templates FOR SELECT
  USING (
    is_global = true
    AND auth.role() = 'authenticated'
  );

-- Academy clone: readable by members of that academy.
DROP POLICY IF EXISTS "assessment_templates_select_academy"
  ON assessment_templates;

CREATE POLICY "assessment_templates_select_academy"
  ON assessment_templates FOR SELECT
  USING (
    is_global = false
    AND academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid() AND is_active = true
    )
  );

-- Academy clone: directors and head coaches can insert/update their own.
DROP POLICY IF EXISTS "assessment_templates_write_academy"
  ON assessment_templates;

CREATE POLICY "assessment_templates_write_academy"
  ON assessment_templates FOR ALL
  USING (
    is_global = false
    AND academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid()
        AND role IN ('academy_director', 'head_coach')
        AND is_active = true
    )
  )
  WITH CHECK (
    is_global = false
    AND academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid()
        AND role IN ('academy_director', 'head_coach')
        AND is_active = true
    )
  );

-- ─── assessment_template_sections ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assessment_template_sections (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id         uuid NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
  section_key         text NOT NULL,
  display_name        text NOT NULL,
  sort_order          integer NOT NULL DEFAULT 0,
  is_visible          boolean NOT NULL DEFAULT true,
  is_custom           boolean NOT NULL DEFAULT false,
  pathway_category    text CHECK (pathway_category IN ('skill','competition','fitness','mental_performance')),
  level_applicability text[] NOT NULL DEFAULT ARRAY['general','red_ball','orange_ball','green_dot','yellow_ball','high_performance'],
  coach_guidance      text,
  parent_safe_label   text,
  player_safe_label   text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, section_key)
);

ALTER TABLE assessment_template_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assessment_template_sections_select"
  ON assessment_template_sections;

CREATE POLICY "assessment_template_sections_select"
  ON assessment_template_sections FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM assessment_templates
      WHERE is_global = true
         OR academy_id IN (
           SELECT academy_id FROM academy_memberships
           WHERE profile_id = auth.uid() AND is_active = true
         )
    )
  );

DROP POLICY IF EXISTS "assessment_template_sections_write"
  ON assessment_template_sections;

CREATE POLICY "assessment_template_sections_write"
  ON assessment_template_sections FOR ALL
  USING (
    template_id IN (
      SELECT t.id FROM assessment_templates t
      JOIN academy_memberships am ON am.academy_id = t.academy_id
      WHERE am.profile_id = auth.uid()
        AND am.role IN ('academy_director', 'head_coach')
        AND am.is_active = true
        AND t.is_global = false
    )
  )
  WITH CHECK (
    template_id IN (
      SELECT t.id FROM assessment_templates t
      JOIN academy_memberships am ON am.academy_id = t.academy_id
      WHERE am.profile_id = auth.uid()
        AND am.role IN ('academy_director', 'head_coach')
        AND am.is_active = true
        AND t.is_global = false
    )
  );

-- ─── assessment_template_skills ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assessment_template_skills (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id          uuid NOT NULL REFERENCES assessment_template_sections(id) ON DELETE CASCADE,
  template_id         uuid NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
  skill_key           text NOT NULL,
  display_name        text NOT NULL,
  sort_order          integer NOT NULL DEFAULT 0,
  is_visible          boolean NOT NULL DEFAULT true,
  is_custom           boolean NOT NULL DEFAULT false,
  is_required         boolean NOT NULL DEFAULT false,
  appears_in_quick    boolean NOT NULL DEFAULT false,
  appears_in_standard boolean NOT NULL DEFAULT true,
  appears_in_deep     boolean NOT NULL DEFAULT true,
  scoring_scale       text NOT NULL DEFAULT '1_10' CHECK (scoring_scale IN ('1_10','1_5','pass_fail')),
  level_applicability text[] NOT NULL DEFAULT ARRAY['general','red_ball','orange_ball','green_dot','yellow_ball','high_performance'],
  pathway_category    text CHECK (pathway_category IN ('skill','competition','fitness','mental_performance')),
  coach_guidance      text,
  parent_safe_label   text,
  player_safe_label   text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section_id, skill_key)
);

ALTER TABLE assessment_template_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assessment_template_skills_select"
  ON assessment_template_skills;

CREATE POLICY "assessment_template_skills_select"
  ON assessment_template_skills FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM assessment_templates
      WHERE is_global = true
         OR academy_id IN (
           SELECT academy_id FROM academy_memberships
           WHERE profile_id = auth.uid() AND is_active = true
         )
    )
  );

DROP POLICY IF EXISTS "assessment_template_skills_write"
  ON assessment_template_skills;

CREATE POLICY "assessment_template_skills_write"
  ON assessment_template_skills FOR ALL
  USING (
    template_id IN (
      SELECT t.id FROM assessment_templates t
      JOIN academy_memberships am ON am.academy_id = t.academy_id
      WHERE am.profile_id = auth.uid()
        AND am.role IN ('academy_director', 'head_coach')
        AND am.is_active = true
        AND t.is_global = false
    )
  )
  WITH CHECK (
    template_id IN (
      SELECT t.id FROM assessment_templates t
      JOIN academy_memberships am ON am.academy_id = t.academy_id
      WHERE am.profile_id = auth.uid()
        AND am.role IN ('academy_director', 'head_coach')
        AND am.is_active = true
        AND t.is_global = false
    )
  );

-- ─── assessment_template_versions ────────────────────────────────────────────
-- Immutable snapshot created on every director template edit.
-- assessments.version_id references this table for historical accuracy.

CREATE TABLE IF NOT EXISTS assessment_template_versions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
  academy_id  uuid REFERENCES academies(id) ON DELETE CASCADE,
  version_num integer NOT NULL DEFAULT 1,
  snapshot    jsonb NOT NULL,
  change_note text,
  created_by  uuid REFERENCES profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assessment_template_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assessment_template_versions_select"
  ON assessment_template_versions;

CREATE POLICY "assessment_template_versions_select"
  ON assessment_template_versions FOR SELECT
  USING (
    academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid() AND is_active = true
    )
    OR (
      academy_id IS NULL
      AND auth.role() = 'authenticated'
    )
  );

DROP POLICY IF EXISTS "assessment_template_versions_insert"
  ON assessment_template_versions;

CREATE POLICY "assessment_template_versions_insert"
  ON assessment_template_versions FOR INSERT
  WITH CHECK (
    academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid()
        AND role IN ('academy_director', 'head_coach')
        AND is_active = true
    )
  );

-- ─── academy_assessment_templates ────────────────────────────────────────────
-- Links each academy to their active assessment template (their clone).
-- One active template per academy.

CREATE TABLE IF NOT EXISTS academy_assessment_templates (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id              uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  template_id             uuid NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
  is_active               boolean NOT NULL DEFAULT true,
  current_version_id      uuid REFERENCES assessment_template_versions(id),
  cloned_from_global_at   timestamptz NOT NULL DEFAULT now(),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academy_id, is_active)
);

ALTER TABLE academy_assessment_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "academy_assessment_templates_select"
  ON academy_assessment_templates;

CREATE POLICY "academy_assessment_templates_select"
  ON academy_assessment_templates FOR SELECT
  USING (
    academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "academy_assessment_templates_write"
  ON academy_assessment_templates;

CREATE POLICY "academy_assessment_templates_write"
  ON academy_assessment_templates FOR ALL
  USING (
    academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid()
        AND role IN ('academy_director', 'head_coach')
        AND is_active = true
    )
  )
  WITH CHECK (
    academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid()
        AND role IN ('academy_director', 'head_coach')
        AND is_active = true
    )
  );

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_assessment_template_sections_template
  ON assessment_template_sections(template_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_assessment_template_skills_section
  ON assessment_template_skills(section_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_assessment_template_skills_template
  ON assessment_template_skills(template_id);

CREATE INDEX IF NOT EXISTS idx_assessment_template_versions_template
  ON assessment_template_versions(template_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_academy_assessment_templates_academy
  ON academy_assessment_templates(academy_id) WHERE is_active = true;
