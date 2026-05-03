#!/usr/bin/env python3
"""
scripts/generate-curriculum-seed-sql.py
Sprint 189 — Generate curriculum seed migration 053.

Reads validated xlsx source files and produces:
  supabase/migrations/053_curriculum_seed.sql

Run: python3 scripts/generate-curriculum-seed-sql.py
"""

import openpyxl
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
EXTRACTED = ROOT / "docs/curriculum/source-files/extracted"
SRC_ROOT  = ROOT / "docs/curriculum/source-files"
OUT_PATH  = ROOT / "supabase/migrations/053_curriculum_seed.sql"

# ── Stage → (curriculum_stage enum, level_number) ──────────────────────────────

STAGE_MAP = {
    "Red 1":    ("red_foundation",    1),
    "Red 2":    ("red_foundation",    2),
    "Red 3":    ("red_foundation",    3),
    "Orange 1": ("orange_development", 1),
    "Orange 2": ("orange_development", 2),
    "Orange 3": ("orange_development", 3),
    "Green 1":  ("green_performance", 1),
    "Green 2":  ("green_performance", 2),
    "Green 3":  ("green_performance", 3),
    "Yellow 1": ("yellow_competitive", 1),
    "Yellow 2": ("yellow_competitive", 2),
    "Yellow 3": ("yellow_competitive", 3),
    "HP 1":     ("high_performance",  1),
    "HP 2":     ("high_performance",  2),
    "HP 3":     ("high_performance",  3),
}

DISPLAY_NAMES = {
    "Red 1":    "Red 1 — Foundation",
    "Red 2":    "Red 2 — Intermediate",
    "Red 3":    "Red 3 — Matchplay",
    "Orange 1": "Orange 1 — Foundation",
    "Orange 2": "Orange 2 — Intermediate",
    "Orange 3": "Orange 3 — Matchplay",
    "Green 1":  "Green 1 — Foundation",
    "Green 2":  "Green 2 — Intermediate",
    "Green 3":  "Green 3 — Matchplay",
    "Yellow 1": "Yellow 1 — Foundation",
    "Yellow 2": "Yellow 2 — Intermediate",
    "Yellow 3": "Yellow 3 — Matchplay",
    "HP 1":     "High Performance 1 — Foundation",
    "HP 2":     "High Performance 2 — Intermediate",
    "HP 3":     "High Performance 3 — Matchplay",
}

# Gate domain normalization
GATE_DOMAIN_NORM = {
    "Movement / Athletic":           "Movement",
    "Mentality / Learning Behavior": "Mentality",
    "Tactical (Court Mapping)":      "Tactical",
    "Technical":                     "Technical",
    "Competition":                   "Competition",
    "Fitness Support":               "Fitness Support",
}

# Fitness phase normalization
FITNESS_PHASE_NORM = {
    "Physical Literacy":              "physical_literacy",
    "Athletic Foundation":            "athletic_foundation",
    "Tennis-Specific Conditioning":   "sport_performance",
    "Strength + Speed + Endurance":   "high_performance",
    "High Performance":               "high_performance",
    "High Performance / Pro Transition": "high_performance",
}

# ── Product-language stripping ──────────────────────────────────────────────────
#
# Removes the literal "[PROPOSED:]" marker and Angles product/tool names from any
# text field before it is written to the seed SQL.
#
# Rules:
#   - "[PROPOSED:]" prefix is removed; the sentence that follows is kept.
#   - "Swing Check app", "SwingCheck", "Swing Check" → "a video assessment protocol"
#   - "Swinget" → "a rotational training tool"
#   - "The Angle™" (with trademark symbol) → "the Angles methodology"
#   - "The Angle device" / "The Angle product" / "The Angle tool" → "the Angles methodology"
#   - Normal tennis phrases ("closing the angle", "short angle", "create an angle",
#     "crosscourt angle") are NEVER touched — "angle" as court geometry is allowed.
#   - "Angles intake protocol" → "intake protocol"
#
_PRODUCT_SUBS = [
    # Remove [PROPOSED:] marker, keep the rest of the sentence
    (re.compile(r"\[PROPOSED:\]\s*", re.IGNORECASE), ""),
    # "Swing Check app" / "SwingCheck app"
    (re.compile(r"Swing\s*Check\s+app", re.IGNORECASE), "a video assessment protocol"),
    # "Swing Check (…zone/diagnostic…)" — product diagnostic framework
    (re.compile(r"Swing\s*Check\s*\([^)]*\)", re.IGNORECASE), "a standardized movement assessment"),
    # Remaining bare "Swing Check" / "SwingCheck"
    (re.compile(r"Swing\s*Check", re.IGNORECASE), "a video assessment protocol"),
    # "Swinget"
    (re.compile(r"Swinget", re.IGNORECASE), "a rotational training tool"),
    # "The Angle™" — only with explicit trademark symbol
    (re.compile(r"The\s+Angle™"), "the Angles methodology"),
    # "The Angle device/product/tool/app" — explicit product-noun context
    (re.compile(r"\bThe\s+Angle\s+(?:device|product|tool|app|system)\b", re.IGNORECASE), "the Angles methodology"),
    # "Angles intake protocol" → "intake protocol"
    (re.compile(r"Angles\s+intake\s+protocol", re.IGNORECASE), "intake protocol"),
]

def strip_product_refs(text):
    """Strip [PROPOSED:] markers and Angles product/tool names from a text field."""
    if not text:
        return text
    s = str(text)
    for pattern, replacement in _PRODUCT_SUBS:
        s = pattern.sub(replacement, s)
    s = s.strip()
    return s if s else None


# ── Helpers ────────────────────────────────────────────────────────────────────

def esc(s):
    """Escape a Python string for use in a SQL single-quoted literal."""
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def esc_jsonb(d):
    """Serialize dict to a SQL JSONB literal."""
    if not d:
        return "NULL"
    return "'" + json.dumps(d, ensure_ascii=False).replace("'", "''") + "'::jsonb"


def level_ref(stage_name):
    """Return a SQL subquery to find the curriculum_levels.id for a stage name."""
    if not stage_name or stage_name not in STAGE_MAP:
        return "NULL"
    stage_enum, level_num = STAGE_MAP[stage_name]
    return f"(SELECT id FROM curriculum_levels WHERE stage = '{stage_enum}'::curriculum_stage AND level_number = {level_num})"


def parse_range_numeric(text):
    """Parse '1.5-3' → (1.5, 3.0). Single number '3' → (3.0, 3.0)."""
    if not text:
        return None, None
    s = str(text).strip().split(" ")[0]  # strip trailing unit like "min"
    m = re.match(r"^(\d+\.?\d*)-(\d+\.?\d*)$", s)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.match(r"^(\d+\.?\d*)$", s)
    if m:
        v = float(m.group(1))
        return v, v
    return None, None


def parse_range_int(text):
    """Parse '1-2' → (1, 2). Single number '3' → (3, 3). Strips trailing 'min' etc."""
    if not text:
        return None, None
    s = str(text).strip()
    s = re.sub(r"\s*(min|hr|hrs|hours|weeks?).*$", "", s, flags=re.IGNORECASE).strip()
    # handle "Open (varies — 12-24+)"
    nums = re.findall(r"\d+", s)
    if len(nums) >= 2:
        return int(nums[0]), int(nums[1])
    elif len(nums) == 1:
        v = int(nums[0])
        return v, v
    return None, None


def parse_reassessment_weeks(text):
    """Extract the lower-bound number of weeks from text like 'Every 8-12 weeks'."""
    if not text:
        return None
    nums = re.findall(r"\d+", str(text))
    if nums:
        return int(nums[0])  # conservative: use minimum (more frequent reassessment)
    return None


def parse_acr(text):
    """Strip parenthetical from ACR like '0.8-1.2 (very stable)' → '0.8-1.2'."""
    if not text:
        return None
    return re.sub(r"\s*\(.*?\)", "", str(text)).strip()


def parse_overload_flags(text):
    """Convert overload text into a TEXT[] SQL literal."""
    if not text:
        return "NULL"
    cleaned = str(text).replace("'", "''").strip()
    # Split on '. ' to get separate sentences, filter empty
    parts = [p.strip() for p in re.split(r"\.\s+", cleaned) if p.strip()]
    if not parts:
        return "NULL"
    items = ", ".join(f"'{p}'" for p in parts)
    return f"ARRAY[{items}]"


def parse_coaching_cues(text):
    """Parse 'Doing Well: X | Working On: Y | Current Focus: Z | Next Step: W' → dict."""
    if not text:
        return {}
    result = {}
    markers = [
        ("doing_well",    "Doing Well:"),
        ("working_on",    "Working On:"),
        ("current_focus", "Current Focus:"),
        ("next_step",     "Next Step:"),
    ]
    for key, prefix in markers:
        pattern = re.compile(re.escape(prefix) + r"\s*(.+?)(?=\s*\|\s*(?:Doing Well|Working On|Current Focus|Next Step):|$)", re.DOTALL)
        m = pattern.search(text)
        if m:
            result[key] = m.group(1).strip().rstrip("|").strip()
    return result


def read_sheet(path, sheet_name):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb[sheet_name]
    rows = list(ws.values)
    wb.close()
    if not rows:
        return [], []
    headers = [str(h) if h is not None else "" for h in rows[0]]
    data = []
    for row in rows[1:]:
        record = {}
        for i, h in enumerate(headers):
            v = row[i] if i < len(row) else None
            record[h] = str(v) if v is not None else None
        if any(v is not None for v in record.values()):
            data.append(record)
    return headers, data


# ── Section generators ──────────────────────────────────────────────────────────

def gen_level_updates():
    lines = []
    lines.append("-- ============================================================")
    lines.append("-- SECTION 1: Update curriculum_levels display names")
    lines.append("-- Canonical 15-stage names per angles-master-spine.md")
    lines.append("-- ============================================================")
    lines.append("")
    for stage_name, display_name in DISPLAY_NAMES.items():
        stage_enum, level_num = STAGE_MAP[stage_name]
        lines.append(f"UPDATE curriculum_levels")
        lines.append(f"  SET display_name = {esc(display_name)}")
        lines.append(f"  WHERE stage = '{stage_enum}'::curriculum_stage")
        lines.append(f"    AND level_number = {level_num};")
        lines.append("")
    return "\n".join(lines)


def gen_archetypes():
    _, data = read_sheet(SRC_ROOT / "AOS_Curriculum_StressTest.xlsx", "Archetypes")
    lines = []
    lines.append("-- ============================================================")
    lines.append("-- SECTION 2: curriculum_archetypes (8 rows)")
    lines.append("-- Source: AOS_Curriculum_StressTest.xlsx — Archetypes sheet")
    lines.append("-- ============================================================")
    lines.append("")
    lines.append("INSERT INTO curriculum_archetypes")
    lines.append("  (tag, name, entry_stage, description, primary_curriculum_protection)")
    lines.append("VALUES")
    rows_sql = []
    for row in data:
        tag  = row.get("Tag") or ""
        name = row.get("Name") or ""
        entry = row.get("Entry Stage") or ""
        desc = strip_product_refs(row.get("Profile") or "")
        protect = strip_product_refs(row.get("What Curriculum Must Protect") or "")
        rows_sql.append(
            f"  ({esc(tag)}, {esc(name)}, {esc(entry)}, {esc(desc)}, {esc(protect)})"
        )
    lines.append(",\n".join(rows_sql))
    lines.append("ON CONFLICT (tag) DO NOTHING;")
    lines.append("")
    return "\n".join(lines)


def gen_failure_modes():
    _, data = read_sheet(SRC_ROOT / "AOS_Curriculum_StressTest.xlsx", "Failure Modes")
    # Filter to FM-01..FM-14 only
    fm_rows = [r for r in data if r.get("ID") and re.match(r"^FM-\d+$", r["ID"])]
    lines = []
    lines.append("-- ============================================================")
    lines.append("-- SECTION 3: curriculum_failure_modes (14 rows)")
    lines.append("-- Source: AOS_Curriculum_StressTest.xlsx — Failure Modes sheet")
    lines.append("-- Engineering requirements. [PROPOSED:] markers stripped; content kept.")
    lines.append("-- Product/tool names stripped from risk_description + required_response.")
    lines.append("-- is_addressed starts false — updated manually when resolved.")
    lines.append("-- ============================================================")
    lines.append("")
    lines.append("INSERT INTO curriculum_failure_modes")
    lines.append("  (failure_mode_id, severity, affected_stage, affected_archetype,")
    lines.append("   risk_description, required_response, affected_components, is_addressed)")
    lines.append("VALUES")
    rows_sql = []
    for row in fm_rows:
        fm_id    = row.get("ID") or ""
        severity = row.get("Severity") or ""
        stage    = row.get("Stages") or ""
        archetype = row.get("Archetypes") or ""
        gap      = strip_product_refs(row.get("Gap") or "")
        fix      = strip_product_refs(row.get("Recommended Fix") or "")
        piece    = row.get("Target Piece") or ""
        # affected_components from Target Piece
        components = f"ARRAY[{esc(piece)}]" if piece else "NULL"
        rows_sql.append(
            f"  ({esc(fm_id)}, {esc(severity)}, {esc(stage)}, {esc(archetype)},\n"
            f"   {esc(gap)}, {esc(fix)}, {components}, false)"
        )
    lines.append(",\n".join(rows_sql))
    lines.append("ON CONFLICT (failure_mode_id) DO NOTHING;")
    lines.append("")
    return "\n".join(lines)


def gen_gates():
    _, data = read_sheet(EXTRACTED / "AOS_Curriculum_Gates.xlsx", "Gate Library")
    lines = []
    lines.append("-- ============================================================")
    lines.append("-- SECTION 4: curriculum_gates (57 rows)")
    lines.append("-- Source: AOS_Curriculum_Gates.xlsx — Gate Library sheet")
    lines.append("-- Domain normalization applied per seed-validation-report.md:")
    lines.append("--   Movement / Athletic  → Movement")
    lines.append("--   Mentality / Learning Behavior → Mentality")
    lines.append("--   Tactical (Court Mapping) → Tactical")
    lines.append("-- Evaluator normalization: Coach + Director → Director")
    lines.append("-- HP3 exit: to_level_id = NULL (no next stage)")
    lines.append("-- Notes: Swinget [PROPOSED:] reference stripped from RED1__RED2__02")
    lines.append("-- Notes: Swing Check app [PROPOSED:] reference stripped from RED3__ORANGE1__03")
    lines.append("-- ============================================================")
    lines.append("")

    for i, row in enumerate(data):
        gate_id = row.get("Gate ID") or ""
        from_s  = row.get("From") or ""
        to_s    = row.get("To") or ""
        domain_raw = row.get("Domain") or ""
        domain  = GATE_DOMAIN_NORM.get(domain_raw, domain_raw)
        criterion = row.get("Criterion") or ""
        gtype   = row.get("Type") or ""
        threshold = row.get("Threshold") or ""
        rec_method = row.get("Recording Method") or ""
        ev_window = row.get("Evidence Window") or ""
        evaluator_raw = row.get("Evaluator") or ""
        evaluator = "Director" if "+" in evaluator_raw else evaluator_raw
        cadence = row.get("Cadence") or ""
        notes_raw = row.get("Notes") or ""
        notes = strip_product_refs(notes_raw) or None
        sort_order = i + 1
        to_ref = "NULL" if (not to_s or "Out" in to_s) else level_ref(to_s)
        lines.append(f"INSERT INTO curriculum_gates")
        lines.append(f"  (gate_id, from_level_id, to_level_id, domain, criterion, gate_type,")
        lines.append(f"   threshold, recording_method, evidence_window, evaluator, cadence, notes, sort_order)")
        lines.append(f"VALUES (")
        lines.append(f"  {esc(gate_id)},")
        lines.append(f"  {level_ref(from_s)},")
        lines.append(f"  {to_ref},")
        lines.append(f"  {esc(domain)},")
        lines.append(f"  {esc(criterion)},")
        lines.append(f"  {esc(gtype)},")
        lines.append(f"  {esc(threshold)},")
        lines.append(f"  {esc(rec_method)},")
        lines.append(f"  {esc(ev_window)},")
        lines.append(f"  {esc(evaluator)},")
        lines.append(f"  {esc(cadence)},")
        lines.append(f"  {esc(notes)},")
        lines.append(f"  {sort_order}")
        lines.append(f") ON CONFLICT (gate_id) DO NOTHING;")
        lines.append("")

    return "\n".join(lines)


def gen_coach_language():
    _, data = read_sheet(EXTRACTED / "AOS_Curriculum_CoachLanguage.xlsx", "Coach Language (Long)")
    lines = []
    lines.append("-- ============================================================")
    lines.append("-- SECTION 5: curriculum_coach_language (120 rows)")
    lines.append("-- Source: AOS_Curriculum_CoachLanguage.xlsx — Coach Language (Long)")
    lines.append("-- 15 stages × 8 domains × 4 phrases.")
    lines.append("-- Zero product dependencies. Zero [PROPOSED:] flags.")
    lines.append("-- ============================================================")
    lines.append("")
    for row in data:
        stage   = row.get("Stage") or ""
        domain  = row.get("Domain") or ""
        dw      = strip_product_refs(row.get("Doing Well") or "")
        wo      = strip_product_refs(row.get("Working On") or "")
        cf      = strip_product_refs(row.get("Current Focus") or "")
        ns      = strip_product_refs(row.get("Next Step") or "")
        lines.append(f"INSERT INTO curriculum_coach_language")
        lines.append(f"  (level_id, domain, doing_well, working_on, current_focus, next_step)")
        lines.append(f"VALUES (")
        lines.append(f"  {level_ref(stage)},")
        lines.append(f"  {esc(domain)},")
        lines.append(f"  {esc(dw)},")
        lines.append(f"  {esc(wo)},")
        lines.append(f"  {esc(cf)},")
        lines.append(f"  {esc(ns)}")
        lines.append(f") ON CONFLICT (level_id, domain) DO NOTHING;")
        lines.append("")
    return "\n".join(lines)


def gen_drills():
    _, lib_data = read_sheet(EXTRACTED / "AOS_Curriculum_Drills.xlsx", "Drill Library")
    lines = []
    lines.append("-- ============================================================")
    lines.append("-- SECTION 6a: curriculum_drills (152 rows)")
    lines.append("-- Source: AOS_Curriculum_Drills.xlsx — Drill Library sheet")
    lines.append("-- Full 152 rows — validated clean in Sprint 188.")
    lines.append("-- coaching_cues stored as JSONB (parsed from pipe-delimited source).")
    lines.append("-- academy_id IS NULL for all rows → global platform drills.")
    lines.append("-- ============================================================")
    lines.append("")
    for row in lib_data:
        drill_id   = row.get("drill_id") or ""
        name       = strip_product_refs(row.get("name") or "")
        stage_min  = row.get("stage_min") or ""
        stage_max  = row.get("stage_max") or ""
        domain     = row.get("domain") or ""
        s_block    = row.get("session_block") or ""
        objective  = strip_product_refs(row.get("objective") or "")
        setup      = strip_product_refs(row.get("setup") or "")
        procedure  = strip_product_refs(row.get("procedure") or "")
        cues_raw   = strip_product_refs(row.get("coaching_cues") or "")
        cues       = parse_coaching_cues(cues_raw)
        prog_easy  = strip_product_refs(row.get("progression_easier") or "")
        prog_hard  = strip_product_refs(row.get("progression_harder") or "")
        success_c  = strip_product_refs(row.get("success_criteria") or "")
        dur_raw    = row.get("duration_minutes")
        _dur_val   = int(float(dur_raw)) if dur_raw else 0
        dur_sql    = str(_dur_val) if _dur_val >= 1 else "NULL"
        players_raw = row.get("players_needed")
        players_sql = str(int(float(players_raw))) if players_raw else "NULL"

        lines.append(f"INSERT INTO curriculum_drills")
        lines.append(f"  (drill_id, academy_id, name, level_min_id, level_max_id, domain,")
        lines.append(f"   session_block, objective, setup, procedure, coaching_cues,")
        lines.append(f"   progression_easier, progression_harder, success_criteria,")
        lines.append(f"   duration_minutes, players_needed, source_type, is_active)")
        lines.append(f"VALUES (")
        lines.append(f"  {esc(drill_id)},")
        lines.append(f"  NULL,")
        lines.append(f"  {esc(name)},")
        lines.append(f"  {level_ref(stage_min)},")
        lines.append(f"  {level_ref(stage_max)},")
        lines.append(f"  {esc(domain)},")
        lines.append(f"  {esc(s_block)},")
        lines.append(f"  {esc(objective)},")
        lines.append(f"  {esc(setup)},")
        lines.append(f"  {esc(procedure)},")
        lines.append(f"  {esc_jsonb(cues) if cues else 'NULL'},")
        lines.append(f"  {esc(prog_easy)},")
        lines.append(f"  {esc(prog_hard)},")
        lines.append(f"  {esc(success_c)},")
        lines.append(f"  {dur_sql},")
        lines.append(f"  {players_sql},")
        lines.append(f"  'global_default',")
        lines.append(f"  true")
        lines.append(f") ON CONFLICT (drill_id) WHERE academy_id IS NULL DO NOTHING;")
        lines.append("")
    return "\n".join(lines)


def gen_drill_tags():
    _, lib_data = read_sheet(EXTRACTED / "AOS_Curriculum_Drills.xlsx", "Drill Library")
    lines = []
    lines.append("-- ============================================================")
    lines.append("-- SECTION 6b: curriculum_drill_tags")
    lines.append("-- Generated from the 'tags' column in each drill row.")
    lines.append("-- One INSERT per drill-tag pair, using drill_id FK lookup.")
    lines.append("-- ============================================================")
    lines.append("")
    tag_count = 0
    for row in lib_data:
        drill_id = row.get("drill_id") or ""
        tags_raw = row.get("tags") or ""
        if not tags_raw:
            continue
        tags = [t.strip() for t in tags_raw.split(",") if t.strip()]
        for tag in tags:
            lines.append(f"INSERT INTO curriculum_drill_tags (drill_id, tag)")
            lines.append(f"SELECT cd.id, {esc(tag)}")
            lines.append(f"FROM curriculum_drills cd")
            lines.append(f"WHERE cd.drill_id = {esc(drill_id)} AND cd.academy_id IS NULL")
            lines.append(f"ON CONFLICT (drill_id, tag) DO NOTHING;")
            tag_count += 1
    lines.append(f"-- Total tag inserts: {tag_count}")
    lines.append("")
    return "\n".join(lines)


def gen_competition_track():
    _, data = read_sheet(EXTRACTED / "AOS_Curriculum_Competition.xlsx", "Competition Progression")
    lines = []
    lines.append("-- ============================================================")
    lines.append("-- SECTION 7: curriculum_competition_track (15 rows)")
    lines.append("-- Source: AOS_Curriculum_Competition.xlsx — Competition Progression")
    lines.append("-- federation_note is NULL — USTA tournament names in match_format")
    lines.append("-- and tournament_cadence columns are labeled as federation-specific;")
    lines.append("-- non-US academies substitute their federation equivalent.")
    lines.append("-- ============================================================")
    lines.append("")
    for row in data:
        stage    = row.get("Stage") or ""
        mfmt     = strip_product_refs(row.get("Match Format") or "")
        scoring  = strip_product_refs(row.get("Scoring") or "")
        density  = strip_product_refs(row.get("Point Density") or "")
        opp_pool = strip_product_refs(row.get("Opponent Pool") or "")
        t_cad    = strip_product_refs(row.get("Tournament Cadence") or "")
        wl_tgt   = strip_product_refs(row.get("Win:Loss Target") or "")
        c_behav  = strip_product_refs(row.get("Competition Behaviors") or "")
        p_role   = strip_product_refs(row.get("Parent Role") or "")
        c_role   = strip_product_refs(row.get("Coach Role") or "")
        t_signal = strip_product_refs(row.get("Transition Signal (toward next stage)") or "")
        lines.append(f"INSERT INTO curriculum_competition_track")
        lines.append(f"  (level_id, match_format, scoring_system, point_density, opponent_pool,")
        lines.append(f"   tournament_cadence, win_loss_target, competition_behaviors,")
        lines.append(f"   parent_role, coach_role, transition_signal, federation_note)")
        lines.append(f"VALUES (")
        lines.append(f"  {level_ref(stage)},")
        lines.append(f"  {esc(mfmt)},")
        lines.append(f"  {esc(scoring)},")
        lines.append(f"  {esc(density)},")
        lines.append(f"  {esc(opp_pool)},")
        lines.append(f"  {esc(t_cad)},")
        lines.append(f"  {esc(wl_tgt)},")
        lines.append(f"  {esc(c_behav)},")
        lines.append(f"  {esc(p_role)},")
        lines.append(f"  {esc(c_role)},")
        lines.append(f"  {esc(t_signal)},")
        lines.append(f"  NULL")
        lines.append(f") ON CONFLICT (level_id) DO NOTHING;")
        lines.append("")
    return "\n".join(lines)


def gen_fitness_guidance():
    _, data = read_sheet(EXTRACTED / "AOS_Curriculum_Fitness.xlsx", "Fitness Progression")
    lines = []
    lines.append("-- ============================================================")
    lines.append("-- SECTION 8: curriculum_fitness_guidance (15 rows)")
    lines.append("-- Source: AOS_Curriculum_Fitness.xlsx — Fitness Progression sheet")
    lines.append("-- fitness_phase normalized per seed-validation-report.md")
    lines.append("-- off_court_sessions_per_week_min/max left NULL — source provides")
    lines.append("-- weekly minutes, not session counts; cannot safely convert.")
    lines.append("-- coaching_notes carries Primary Focus description.")
    lines.append("-- ============================================================")
    lines.append("")
    for row in data:
        stage    = row.get("Stage") or ""
        phase_raw = row.get("Fitness Phase") or ""
        phase    = FITNESS_PHASE_NORM.get(phase_raw, phase_raw.lower().replace(" ", "_"))
        energy   = strip_product_refs(row.get("Energy Systems") or "")
        strength = strip_product_refs(row.get("Strength") or "")
        key_tests_raw = strip_product_refs(row.get("Key Tests") or "")
        primary_focus = strip_product_refs(row.get("Primary Focus") or "")
        speed    = strip_product_refs(row.get("Speed") or "")
        endurance = strip_product_refs(row.get("Endurance") or "")
        # Build coaching_notes from primary focus + speed + endurance summary
        notes_parts = [p for p in [primary_focus, f"Speed: {speed}" if speed else None, f"Endurance: {endurance}" if endurance else None] if p]
        coaching_notes = " | ".join(notes_parts) if notes_parts else None
        # Build key_fitness_tests array
        if key_tests_raw:
            tests = [t.strip() for t in re.split(r"[,;]", key_tests_raw) if t.strip()]
            tests_sql = "ARRAY[" + ", ".join(esc(t) for t in tests) + "]"
        else:
            tests_sql = "NULL"
        lines.append(f"INSERT INTO curriculum_fitness_guidance")
        lines.append(f"  (level_id, fitness_phase, primary_energy_system, strength_band,")
        lines.append(f"   key_fitness_tests, off_court_sessions_per_week_min,")
        lines.append(f"   off_court_sessions_per_week_max, coaching_notes)")
        lines.append(f"VALUES (")
        lines.append(f"  {level_ref(stage)},")
        lines.append(f"  {esc(phase)},")
        lines.append(f"  {esc(energy)},")
        lines.append(f"  {esc(strength)},")
        lines.append(f"  {tests_sql},")
        lines.append(f"  NULL,")
        lines.append(f"  NULL,")
        lines.append(f"  {esc(coaching_notes)}")
        lines.append(f") ON CONFLICT (level_id) DO NOTHING;")
        lines.append("")
    return "\n".join(lines)


def gen_volume_guidance():
    _, data = read_sheet(EXTRACTED / "AOS_Curriculum_Volume.xlsx", "Volume Progression")
    lines = []
    lines.append("-- ============================================================")
    lines.append("-- SECTION 9: curriculum_volume_guidance (15 rows)")
    lines.append("-- Source: AOS_Curriculum_Volume.xlsx — Volume Progression sheet")
    lines.append("-- acr_target_range stored as TEXT (definition pending confirmation")
    lines.append("-- per synthesis doc §14.1 — almost certainly Acute:Chronic Workload Ratio).")
    lines.append("-- Do not build any ACR algorithm against this field until confirmed.")
    lines.append("-- ============================================================")
    lines.append("")
    for row in data:
        stage     = row.get("Stage") or ""
        wk_hours  = row.get("Weekly Total Hours") or ""
        sessions  = row.get("Sessions / Week") or ""
        dur_raw   = row.get("Session Duration") or ""
        months    = row.get("Typical Stage Duration (months)") or ""
        reassess  = row.get("Reassessment Cadence") or ""
        acr_raw   = row.get("ACR Target") or ""
        deload    = strip_product_refs(row.get("Deload Cadence") or "")
        overload  = strip_product_refs(row.get("Overload Flags") or "")

        wh_min, wh_max       = parse_range_numeric(wk_hours)
        sess_min, sess_max   = parse_range_int(sessions)
        dur_min, dur_max     = parse_range_int(dur_raw)
        mon_min, mon_max     = parse_range_int(months)
        reassess_weeks       = parse_reassessment_weeks(reassess)
        acr_text             = parse_acr(acr_raw)
        overload_arr         = parse_overload_flags(overload)

        def num_or_null(v):
            return str(v) if v is not None else "NULL"

        lines.append(f"INSERT INTO curriculum_volume_guidance")
        lines.append(f"  (level_id, weekly_hours_min, weekly_hours_max,")
        lines.append(f"   sessions_per_week_min, sessions_per_week_max,")
        lines.append(f"   session_duration_min_minutes, session_duration_max_minutes,")
        lines.append(f"   typical_stage_months_min, typical_stage_months_max,")
        lines.append(f"   reassessment_cadence_weeks, acr_target_range,")
        lines.append(f"   deload_cadence, overload_flags)")
        lines.append(f"VALUES (")
        lines.append(f"  {level_ref(stage)},")
        lines.append(f"  {num_or_null(wh_min)}, {num_or_null(wh_max)},")
        lines.append(f"  {num_or_null(sess_min)}, {num_or_null(sess_max)},")
        lines.append(f"  {num_or_null(dur_min)}, {num_or_null(dur_max)},")
        lines.append(f"  {num_or_null(mon_min)}, {num_or_null(mon_max)},")
        lines.append(f"  {num_or_null(reassess_weeks)},")
        lines.append(f"  {esc(acr_text)},")
        lines.append(f"  {esc(deload)},")
        lines.append(f"  {overload_arr}")
        lines.append(f") ON CONFLICT (level_id) DO NOTHING;")
        lines.append("")
    return "\n".join(lines)


# ── Main ────────────────────────────────────────────────────────────────────────

def main():
    print("Generating 053_curriculum_seed.sql ...")

    header = """\
-- ============================================================
-- ACADEMY OS — MIGRATION 053: CURRICULUM SEED DATA
-- Sprint 189 — Curriculum Seed Migration
--
-- Seeds the curriculum foundation tables created in migration 052.
-- All data validated clean in Sprint 188 (86 checks passed, 0 failed).
--
-- Tables seeded:
--   curriculum_levels         — 15 display-name updates
--   curriculum_archetypes     — 8 rows (A1–A8)
--   curriculum_failure_modes  — 14 rows (FM-01 through FM-14)
--   curriculum_gates          — 57 rows (14 in-curriculum transitions + HP3 exit)
--   curriculum_coach_language — 120 rows (15 stages × 8 domains × 4 phrases)
--   curriculum_drills         — 152 rows (global platform drills)
--   curriculum_drill_tags     — tags per drill (from drill 'tags' column)
--   curriculum_competition_track — 15 rows
--   curriculum_fitness_guidance  — 15 rows
--   curriculum_volume_guidance   — 15 rows
--
-- Intentionally empty:
--   drill_gate_mappings       — strategy not confirmed (see synthesis doc §14.5)
--
-- Product-agnostic: No Swinget, The Angle, SwingCheck references in any
-- seeded data field. One [PROPOSED:] note stripped from Gates Notes.
-- Exclusion decision: docs/curriculum/product-tool-exclusion-decision.md
--
-- Normalization applied:
--   Gate domains:   Movement / Athletic → Movement
--                   Mentality / Learning Behavior → Mentality
--                   Tactical (Court Mapping) → Tactical
--   Gate evaluator: Coach + Director → Director (19 gates)
--   Gate exit:      Out (Living-as-a-Pro) → to_level_id IS NULL
--   Fitness phases: descriptive → migration 052 enum values
--
-- All inserts use ON CONFLICT DO NOTHING — safe to re-run.
-- All level lookups use subqueries by (stage, level_number).
-- Never hardcoded UUIDs.
--
-- Source validation: docs/curriculum/seed-validation-report.md
-- Source of truth:   docs/curriculum/angles-master-spine.md
-- ============================================================

"""

    sections = [
        header,
        gen_level_updates(),
        gen_archetypes(),
        gen_failure_modes(),
        gen_gates(),
        gen_coach_language(),
        gen_drills(),
        gen_drill_tags(),
        gen_competition_track(),
        gen_fitness_guidance(),
        gen_volume_guidance(),
        "-- ============================================================\n"
        "-- drill_gate_mappings: intentionally empty.\n"
        "-- Populate after mapping strategy is confirmed (synthesis doc §14.5).\n"
        "-- ============================================================\n",
        "-- DONE\n",
    ]

    output = "\n".join(sections)
    OUT_PATH.write_text(output, encoding="utf-8")
    print(f"Written: {OUT_PATH}")
    print(f"Size: {OUT_PATH.stat().st_size:,} bytes")
    print(f"Lines: {output.count(chr(10)):,}")


if __name__ == "__main__":
    main()
