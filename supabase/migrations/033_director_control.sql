-- ============================================================
-- ACADEMY OS — MIGRATION 033: DIRECTOR CONTROL LAYER
-- Gives directors a complete management surface over the engine:
--   • named configuration profiles (save, apply, roll back)
--   • full audit trail for every weight change
--   • threshold tuning without code deploys
--
-- Loop integration:
--   ↔ signal_priority_weights (019) — all changes logged + configurable
--   ↔ academy_threshold_configs (030) — included in config snapshots
--   ↔ model_versions (030) — each applied config creates a model version
--   → audit_logs (011) — every change written to the audit log
--   → director UI — full management surface
--
-- Design: directors can save the current configuration as a named
-- profile, later activate any saved profile atomically. Every change
-- to signal_priority_weights is logged in weight_change_history via
-- trigger — no change can be made silently.
-- ============================================================

-- ============================================================
-- WEIGHT CHANGE HISTORY
-- Append-only log of every change to signal_priority_weights.
-- Created by trigger; never written directly.
-- ============================================================
CREATE TABLE weight_change_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  signal_type     signal_type NOT NULL,

  -- What changed
  old_weight              NUMERIC(4,2),
  new_weight              NUMERIC(4,2),
  old_low_multiplier      NUMERIC(4,2),
  new_low_multiplier      NUMERIC(4,2),
  old_medium_multiplier   NUMERIC(4,2),
  new_medium_multiplier   NUMERIC(4,2),
  old_high_multiplier     NUMERIC(4,2),
  new_high_multiplier     NUMERIC(4,2),
  old_critical_multiplier NUMERIC(4,2),
  new_critical_multiplier NUMERIC(4,2),
  old_min_confidence      NUMERIC(4,3),
  new_min_confidence      NUMERIC(4,3),

  -- Context
  changed_by      UUID REFERENCES profiles(id),
  change_reason   TEXT,
  source          TEXT NOT NULL DEFAULT 'ui'
                  CHECK (source IN ('ui', 'configuration_apply', 'flywheel_auto', 'migration')),

  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_weight_history_academy ON weight_change_history(academy_id, changed_at DESC);
CREATE INDEX idx_weight_history_signal  ON weight_change_history(academy_id, signal_type, changed_at DESC);

-- Trigger: log every change to signal_priority_weights
CREATE OR REPLACE FUNCTION tr_log_weight_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    OLD.weight              IS DISTINCT FROM NEW.weight OR
    OLD.low_multiplier      IS DISTINCT FROM NEW.low_multiplier OR
    OLD.medium_multiplier   IS DISTINCT FROM NEW.medium_multiplier OR
    OLD.high_multiplier     IS DISTINCT FROM NEW.high_multiplier OR
    OLD.critical_multiplier IS DISTINCT FROM NEW.critical_multiplier OR
    OLD.min_confidence      IS DISTINCT FROM NEW.min_confidence
  ) THEN
    INSERT INTO weight_change_history (
      academy_id, signal_type,
      old_weight,             new_weight,
      old_low_multiplier,     new_low_multiplier,
      old_medium_multiplier,  new_medium_multiplier,
      old_high_multiplier,    new_high_multiplier,
      old_critical_multiplier,new_critical_multiplier,
      old_min_confidence,     new_min_confidence,
      source
    ) VALUES (
      NEW.academy_id, NEW.signal_type,
      OLD.weight,             NEW.weight,
      OLD.low_multiplier,     NEW.low_multiplier,
      OLD.medium_multiplier,  NEW.medium_multiplier,
      OLD.high_multiplier,    NEW.high_multiplier,
      OLD.critical_multiplier,NEW.critical_multiplier,
      OLD.min_confidence,     NEW.min_confidence,
      'ui'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_signal_weight_change_log
  AFTER UPDATE ON signal_priority_weights
  FOR EACH ROW EXECUTE FUNCTION tr_log_weight_change();

-- ============================================================
-- DIRECTOR CONFIGURATIONS
-- Named snapshots of signal weights + thresholds that can be
-- saved, described, and re-applied atomically.
-- ============================================================
CREATE TABLE director_configurations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT false,

  -- Full parameter snapshot at time of save (mirrors model_versions.parameter_snapshot)
  configuration_snapshot JSONB NOT NULL DEFAULT '{}',

  -- Who created/last applied this configuration
  created_by      UUID REFERENCES profiles(id),
  last_applied_by UUID REFERENCES profiles(id),
  last_applied_at TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_director_configs_academy ON director_configurations(academy_id, is_active);

CREATE TRIGGER tr_director_configs_updated_at
  BEFORE UPDATE ON director_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SAVE_CURRENT_AS_CONFIGURATION()
-- Captures current signal weights + thresholds into a named
-- director_configurations row. Does NOT activate it.
-- ============================================================
CREATE OR REPLACE FUNCTION save_current_as_configuration(
  p_academy_id UUID,
  p_name       TEXT,
  p_desc       TEXT DEFAULT NULL,
  p_creator_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_weights JSONB;
  v_thresh  JSONB;
  v_id      UUID;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'signal_type',           signal_type,
      'weight',                weight,
      'low_multiplier',        low_multiplier,
      'medium_multiplier',     medium_multiplier,
      'high_multiplier',       high_multiplier,
      'critical_multiplier',   critical_multiplier,
      'min_confidence',        min_confidence,
      'is_active',             is_active
    ) ORDER BY signal_type::TEXT
  ), '[]'::JSONB)
  INTO v_weights
  FROM signal_priority_weights
  WHERE academy_id = p_academy_id;

  v_thresh := get_academy_thresholds(p_academy_id);

  INSERT INTO director_configurations (
    academy_id, name, description,
    configuration_snapshot, created_by
  ) VALUES (
    p_academy_id, p_name, p_desc,
    jsonb_build_object(
      'signal_weights', v_weights,
      'thresholds',     v_thresh,
      'saved_at',       NOW()
    ),
    p_creator_id
  )
  RETURNING id INTO v_id;

  PERFORM write_audit_log(
    p_academy_id, p_creator_id,
    'configuration_saved',
    'director_configurations', v_id, p_name,
    jsonb_build_object('weight_count', jsonb_array_length(v_weights)),
    'ui'
  );

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- APPLY_DIRECTOR_CONFIGURATION()
-- Atomically restores signal weights + thresholds from a saved
-- configuration. Creates a model_version snapshot first.
-- Only directors can call this.
-- ============================================================
CREATE OR REPLACE FUNCTION apply_director_configuration(
  p_config_id  UUID,
  p_applier_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_config       director_configurations%ROWTYPE;
  v_weight_obj   JSONB;
  v_thresh_obj   JSONB;
  v_sig_type     signal_type;
  v_weight_count INTEGER := 0;
  v_thresh_count INTEGER := 0;
  v_version_id   UUID;
BEGIN
  -- Validate config belongs to caller's academy
  SELECT * INTO v_config
  FROM director_configurations
  WHERE id = p_config_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Configuration not found');
  END IF;

  -- Snapshot CURRENT state before overwriting (rollback point)
  v_version_id := snapshot_current_model(
    v_config.academy_id,
    'Pre-config: ' || v_config.name,
    'Automatic snapshot before applying director configuration',
    p_applier_id
  );

  -- Apply signal weights from snapshot
  FOR v_weight_obj IN
    SELECT jsonb_array_elements(v_config.configuration_snapshot->'signal_weights')
  LOOP
    -- Cast text to enum safely
    BEGIN
      v_sig_type := (v_weight_obj->>'signal_type')::signal_type;
    EXCEPTION WHEN invalid_text_representation THEN
      CONTINUE;
    END;

    UPDATE signal_priority_weights SET
      weight               = (v_weight_obj->>'weight')::NUMERIC,
      low_multiplier       = (v_weight_obj->>'low_multiplier')::NUMERIC,
      medium_multiplier    = (v_weight_obj->>'medium_multiplier')::NUMERIC,
      high_multiplier      = (v_weight_obj->>'high_multiplier')::NUMERIC,
      critical_multiplier  = (v_weight_obj->>'critical_multiplier')::NUMERIC,
      min_confidence       = (v_weight_obj->>'min_confidence')::NUMERIC
    WHERE academy_id = v_config.academy_id
    AND   signal_type = v_sig_type;

    -- Log the source of this change in the weight history
    UPDATE weight_change_history SET source = 'configuration_apply'
    WHERE academy_id = v_config.academy_id
    AND signal_type  = v_sig_type
    AND changed_at > NOW() - INTERVAL '5 seconds';

    v_weight_count := v_weight_count + 1;
  END LOOP;

  -- Apply thresholds from snapshot
  IF v_config.configuration_snapshot ? 'thresholds' THEN
    FOR v_thresh_obj IN
      SELECT jsonb_each(v_config.configuration_snapshot->'thresholds')
    LOOP
      UPDATE academy_threshold_configs SET
        config_value = (v_thresh_obj->>'value')::NUMERIC,
        updated_by   = p_applier_id
      WHERE academy_id = v_config.academy_id
      AND   config_key = v_thresh_obj->>'key';

      v_thresh_count := v_thresh_count + 1;
    END LOOP;
  END IF;

  -- Mark configuration as the active one
  UPDATE director_configurations
  SET is_active = false
  WHERE academy_id = v_config.academy_id AND is_active = true;

  UPDATE director_configurations SET
    is_active       = true,
    last_applied_by = p_applier_id,
    last_applied_at = NOW()
  WHERE id = p_config_id;

  -- Snapshot AFTER applying (makes this the current model version)
  PERFORM snapshot_current_model(
    v_config.academy_id,
    'Applied: ' || v_config.name,
    'Snapshot after applying director configuration',
    p_applier_id
  );

  PERFORM write_audit_log(
    v_config.academy_id, p_applier_id,
    'configuration_applied',
    'director_configurations', p_config_id, v_config.name,
    jsonb_build_object(
      'weights_applied', v_weight_count,
      'thresholds_applied', v_thresh_count,
      'rollback_version_id', v_version_id
    ),
    'ui'
  );

  RETURN jsonb_build_object(
    'success', true,
    'config_name', v_config.name,
    'weights_applied', v_weight_count,
    'thresholds_applied', v_thresh_count,
    'rollback_version_id', v_version_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- UPDATE_SIGNAL_WEIGHT()
-- Director-facing wrapper to update a single weight with a
-- reason. Enforces tenant isolation. Logs change with context.
-- ============================================================
CREATE OR REPLACE FUNCTION update_signal_weight(
  p_academy_id    UUID,
  p_signal_type   signal_type,
  p_weight        NUMERIC DEFAULT NULL,
  p_high_mult     NUMERIC DEFAULT NULL,
  p_critical_mult NUMERIC DEFAULT NULL,
  p_min_conf      NUMERIC DEFAULT NULL,
  p_reason        TEXT DEFAULT NULL,
  p_changed_by    UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE signal_priority_weights SET
    weight               = COALESCE(p_weight,        weight),
    high_multiplier      = COALESCE(p_high_mult,     high_multiplier),
    critical_multiplier  = COALESCE(p_critical_mult, critical_multiplier),
    min_confidence       = COALESCE(p_min_conf,      min_confidence)
  WHERE academy_id  = p_academy_id
  AND   signal_type = p_signal_type;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN RETURN false; END IF;

  -- Annotate the auto-created history row with the reason and actor
  UPDATE weight_change_history SET
    changed_by    = p_changed_by,
    change_reason = p_reason
  WHERE academy_id  = p_academy_id
  AND   signal_type = p_signal_type
  AND   changed_at > NOW() - INTERVAL '5 seconds';

  PERFORM write_audit_log(
    p_academy_id, p_changed_by,
    'signal_weight_updated',
    'signal_priority_weights', NULL,
    p_signal_type::TEXT,
    jsonb_build_object(
      'signal_type', p_signal_type,
      'new_weight', p_weight,
      'reason', p_reason
    ),
    'ui'
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- UPDATE_THRESHOLD()
-- Director-facing wrapper to update a single threshold value.
-- Validates bounds and writes audit log.
-- ============================================================
CREATE OR REPLACE FUNCTION update_threshold(
  p_academy_id UUID,
  p_key        TEXT,
  p_value      NUMERIC,
  p_reason     TEXT DEFAULT NULL,
  p_changed_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_cfg RECORD;
BEGIN
  SELECT * INTO v_cfg
  FROM academy_threshold_configs
  WHERE academy_id = p_academy_id AND config_key = p_key;

  IF NOT FOUND THEN RETURN false; END IF;

  -- Validate bounds
  IF v_cfg.min_value IS NOT NULL AND p_value < v_cfg.min_value THEN
    RAISE EXCEPTION 'Value % is below minimum % for %', p_value, v_cfg.min_value, p_key;
  END IF;
  IF v_cfg.max_value IS NOT NULL AND p_value > v_cfg.max_value THEN
    RAISE EXCEPTION 'Value % exceeds maximum % for %', p_value, v_cfg.max_value, p_key;
  END IF;

  UPDATE academy_threshold_configs SET
    config_value = p_value,
    updated_by   = p_changed_by
  WHERE academy_id = p_academy_id AND config_key = p_key;

  PERFORM write_audit_log(
    p_academy_id, p_changed_by,
    'threshold_updated',
    'academy_threshold_configs', v_cfg.id, p_key,
    jsonb_build_object(
      'key', p_key,
      'old_value', v_cfg.config_value,
      'new_value', p_value,
      'reason', p_reason
    ),
    'ui'
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Seed: save the initial configuration as a named profile
-- ============================================================
SELECT save_current_as_configuration(
  '00000000-0000-0000-0000-000000000001',
  'Default Configuration',
  'Initial configuration — standard signal weights and thresholds'
);

-- ============================================================
-- View: v_weight_change_history — director audit trail
-- ============================================================
CREATE OR REPLACE VIEW v_weight_change_history AS
SELECT
  wch.changed_at,
  wch.academy_id,
  wch.signal_type,
  wch.old_weight,
  wch.new_weight,
  ROUND(wch.new_weight - COALESCE(wch.old_weight, 0), 2) AS weight_delta,
  wch.old_high_multiplier,
  wch.new_high_multiplier,
  wch.source,
  wch.change_reason,
  pr.display_name AS changed_by_name
FROM weight_change_history wch
LEFT JOIN profiles pr ON pr.id = wch.changed_by
ORDER BY wch.changed_at DESC;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE weight_change_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE director_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see weight history"         ON weight_change_history   FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "System writes weight history"     ON weight_change_history   FOR INSERT WITH CHECK (academy_id = auth_academy_id());

CREATE POLICY "Staff see director configs"       ON director_configurations FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Directors manage configurations"  ON director_configurations FOR ALL   USING (academy_id = auth_academy_id() AND auth_is_director_or_head());
CREATE POLICY "System manages configurations"    ON director_configurations FOR ALL   USING (academy_id = auth_academy_id());
