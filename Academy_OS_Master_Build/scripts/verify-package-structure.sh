#!/usr/bin/env bash
# ============================================================
# ACADEMY OS — PACKAGE STRUCTURE VERIFIER
# Checks that all required files exist in all packages
# Usage: bash scripts/verify-package-structure.sh
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGES_DIR="$ROOT_DIR/packages"

PASS=0
FAIL=0
WARN=0

check_file() {
  local path="$1"
  local label="$2"
  local required="${3:-required}"

  if [ -f "$path" ]; then
    echo "    ✅ $label"
    PASS=$((PASS + 1))
  elif [ "$required" = "optional" ]; then
    echo "    ○  $label (optional — not created yet)"
    WARN=$((WARN + 1))
  else
    echo "    ❌ $label (MISSING)"
    FAIL=$((FAIL + 1))
  fi
}

check_dir() {
  local path="$1"
  local label="$2"
  if [ -d "$path" ]; then
    echo "    📁 $label"
    PASS=$((PASS + 1))
  else
    echo "    ❌ $label (MISSING DIRECTORY)"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "============================================================"
echo "  ACADEMY OS — PACKAGE STRUCTURE VERIFIER"
echo "============================================================"
echo ""

# Root files
echo "  ROOT FILES"
check_file "$ROOT_DIR/ACADEMY_OS_MASTER_ORG.md" "ACADEMY_OS_MASTER_ORG.md"
check_file "$ROOT_DIR/README.md" "README.md"
check_file "$ROOT_DIR/PACKAGE_INDEX.md" "PACKAGE_INDEX.md"
check_file "$ROOT_DIR/BUILD_ORDER.md" "BUILD_ORDER.md"
check_file "$ROOT_DIR/MISSING_ITEMS_AND_DECISIONS.md" "MISSING_ITEMS_AND_DECISIONS.md"
echo ""

# Package 01
echo "  PACKAGE 01 — Product Strategy"
check_dir "$PACKAGES_DIR/01_PRODUCT_STRATEGY_AND_SCOPE" "Directory"
check_file "$PACKAGES_DIR/01_PRODUCT_STRATEGY_AND_SCOPE/README.md" "README.md"
check_file "$PACKAGES_DIR/01_PRODUCT_STRATEGY_AND_SCOPE/ACADEMY_OS_PRODUCT_VISION.md" "ACADEMY_OS_PRODUCT_VISION.md"
check_file "$PACKAGES_DIR/01_PRODUCT_STRATEGY_AND_SCOPE/LOCKED_PRODUCT_PRINCIPLES.md" "LOCKED_PRODUCT_PRINCIPLES.md"
check_file "$PACKAGES_DIR/01_PRODUCT_STRATEGY_AND_SCOPE/V1_V2_V3_SCOPE.md" "V1_V2_V3_SCOPE.md"
check_file "$PACKAGES_DIR/01_PRODUCT_STRATEGY_AND_SCOPE/TARGET_USERS_AND_ROLES.md" "TARGET_USERS_AND_ROLES.md"
check_file "$PACKAGES_DIR/01_PRODUCT_STRATEGY_AND_SCOPE/DEFINITIONS_AND_TERMINOLOGY.md" "DEFINITIONS_AND_TERMINOLOGY.md"
check_file "$PACKAGES_DIR/01_PRODUCT_STRATEGY_AND_SCOPE/VOICE_FIRST_STRATEGIC_POSITION.md" "VOICE_FIRST_STRATEGIC_POSITION.md" optional
check_file "$PACKAGES_DIR/01_PRODUCT_STRATEGY_AND_SCOPE/BUSINESS_MODEL_AND_GO_TO_MARKET.md" "BUSINESS_MODEL_AND_GO_TO_MARKET.md" optional
check_file "$PACKAGES_DIR/01_PRODUCT_STRATEGY_AND_SCOPE/ANGLES_SYSTEM_CONNECTION.md" "ANGLES_SYSTEM_CONNECTION.md" optional
echo ""

# Package 02
echo "  PACKAGE 02 — Database Schema"
check_dir "$PACKAGES_DIR/02_DATABASE_AND_SUPABASE_SCHEMA" "Directory"
check_file "$PACKAGES_DIR/02_DATABASE_AND_SUPABASE_SCHEMA/README.md" "README.md"
check_file "$PACKAGES_DIR/02_DATABASE_AND_SUPABASE_SCHEMA/0001_core_schema.sql" "0001_core_schema.sql"
check_file "$PACKAGES_DIR/02_DATABASE_AND_SUPABASE_SCHEMA/0002_roles_permissions_rls.sql" "0002_roles_permissions_rls.sql"
check_file "$PACKAGES_DIR/02_DATABASE_AND_SUPABASE_SCHEMA/0003_players_groups_profiles.sql" "0003_players_groups_profiles.sql"
check_file "$PACKAGES_DIR/02_DATABASE_AND_SUPABASE_SCHEMA/0004_assessments_placement.sql" "0004_assessments_placement.sql"
check_file "$PACKAGES_DIR/02_DATABASE_AND_SUPABASE_SCHEMA/0005_templates_sessions_exercises.sql" "0005_templates_sessions_exercises.sql"
check_file "$PACKAGES_DIR/02_DATABASE_AND_SUPABASE_SCHEMA/0006_coach_notes_observations.sql" "0006_coach_notes_observations.sql"
check_file "$PACKAGES_DIR/02_DATABASE_AND_SUPABASE_SCHEMA/0007_voice_commands_proposed_actions.sql" "0007_voice_commands_proposed_actions.sql"
check_file "$PACKAGES_DIR/02_DATABASE_AND_SUPABASE_SCHEMA/0008_audit_logs_versioning.sql" "0008_audit_logs_versioning.sql" optional
check_file "$PACKAGES_DIR/02_DATABASE_AND_SUPABASE_SCHEMA/0009_seed_data.sql" "0009_seed_data.sql"
check_file "$PACKAGES_DIR/02_DATABASE_AND_SUPABASE_SCHEMA/0010_functions_triggers.sql" "0010_functions_triggers.sql" optional
check_file "$PACKAGES_DIR/02_DATABASE_AND_SUPABASE_SCHEMA/0011_views_reporting.sql" "0011_views_reporting.sql" optional
check_file "$PACKAGES_DIR/02_DATABASE_AND_SUPABASE_SCHEMA/SUPABASE_SETUP_GUIDE.md" "SUPABASE_SETUP_GUIDE.md"
check_file "$PACKAGES_DIR/02_DATABASE_AND_SUPABASE_SCHEMA/RLS_TESTING_GUIDE.md" "RLS_TESTING_GUIDE.md" optional
check_file "$PACKAGES_DIR/02_DATABASE_AND_SUPABASE_SCHEMA/DATABASE_CHANGELOG.md" "DATABASE_CHANGELOG.md" optional
echo ""

# Package 03
echo "  PACKAGE 03 — Voice Architecture"
check_dir "$PACKAGES_DIR/03_VOICE_FIRST_ARCHITECTURE" "Directory"
check_file "$PACKAGES_DIR/03_VOICE_FIRST_ARCHITECTURE/README.md" "README.md"
check_file "$PACKAGES_DIR/03_VOICE_FIRST_ARCHITECTURE/VOICE_COMMAND_LIFECYCLE.md" "VOICE_COMMAND_LIFECYCLE.md"
check_file "$PACKAGES_DIR/03_VOICE_FIRST_ARCHITECTURE/VOICE_INTENT_TAXONOMY.md" "VOICE_INTENT_TAXONOMY.md"
check_file "$PACKAGES_DIR/03_VOICE_FIRST_ARCHITECTURE/VOICE_TO_STRUCTURED_ACTION_SPEC.md" "VOICE_TO_STRUCTURED_ACTION_SPEC.md" optional
check_file "$PACKAGES_DIR/03_VOICE_FIRST_ARCHITECTURE/PROPOSED_ACTIONS_SYSTEM.md" "PROPOSED_ACTIONS_SYSTEM.md" optional
echo ""

# Package 04
echo "  PACKAGE 04 — Placement Engine"
check_dir "$PACKAGES_DIR/04_NEW_STUDENT_PLACEMENT_ENGINE" "Directory"
check_file "$PACKAGES_DIR/04_NEW_STUDENT_PLACEMENT_ENGINE/README.md" "README.md"
check_file "$PACKAGES_DIR/04_NEW_STUDENT_PLACEMENT_ENGINE/NEW_STUDENT_PLACEMENT_ENGINE_SPEC.md" "NEW_STUDENT_PLACEMENT_ENGINE_SPEC.md"
check_file "$PACKAGES_DIR/04_NEW_STUDENT_PLACEMENT_ENGINE/PLACEMENT_ASSESSMENT_RUBRIC.md" "PLACEMENT_ASSESSMENT_RUBRIC.md" optional
check_file "$PACKAGES_DIR/04_NEW_STUDENT_PLACEMENT_ENGINE/RECOMMENDATION_LOGIC.md" "RECOMMENDATION_LOGIC.md" optional
echo ""

# Packages 05-11 (summary check)
for PKG in 05 06 07 08 09 10 11; do
  PKG_NAMES=("" "" "" "" "" "PLAYER_PROFILE_AND_DEVELOPMENT_PATHS" "SESSION_TEMPLATE_EXERCISE_SYSTEM" "COACH_NOTES_AND_ASSESSMENTS" "UI_UX_WIREFRAMES_AND_SCREEN_SPECS" "AI_WORKFLOW_AND_CLAUDE_PROMPTS" "IMPLEMENTATION_ROADMAP_AND_TESTING" "ARCHIVE_EXISTING_FILES_AND_REFERENCE")
  case $PKG in
    05) PKG_NAME="05_PLAYER_PROFILE_AND_DEVELOPMENT_PATHS" ;;
    06) PKG_NAME="06_SESSION_TEMPLATE_EXERCISE_SYSTEM" ;;
    07) PKG_NAME="07_COACH_NOTES_AND_ASSESSMENTS" ;;
    08) PKG_NAME="08_UI_UX_WIREFRAMES_AND_SCREEN_SPECS" ;;
    09) PKG_NAME="09_AI_WORKFLOW_AND_CLAUDE_PROMPTS" ;;
    10) PKG_NAME="10_IMPLEMENTATION_ROADMAP_AND_TESTING" ;;
    11) PKG_NAME="11_ARCHIVE_EXISTING_FILES_AND_REFERENCE" ;;
  esac
  echo "  PACKAGE $PKG — $PKG_NAME"
  check_dir "$PACKAGES_DIR/$PKG_NAME" "Directory"
  check_file "$PACKAGES_DIR/$PKG_NAME/README.md" "README.md"
  echo ""
done

# TypeScript scaffolds
echo "  TYPESCRIPT SCAFFOLDS (src/)"
REPO_ROOT="$(dirname "$ROOT_DIR")"
check_file "$REPO_ROOT/src/lib/voice/voice-command-types.ts" "src/lib/voice/voice-command-types.ts"
check_file "$REPO_ROOT/src/lib/voice/voice-command-examples.ts" "src/lib/voice/voice-command-examples.ts"
check_file "$REPO_ROOT/src/lib/placement/placement-types.ts" "src/lib/placement/placement-types.ts"
check_file "$REPO_ROOT/src/lib/actions/proposed-action-validator.ts" "src/lib/actions/proposed-action-validator.ts"
echo ""

# Generated reports
echo "  GENERATED REPORTS"
check_file "$ROOT_DIR/generated/frontend_inventory.md" "frontend_inventory.md"
check_file "$ROOT_DIR/generated/backend_inventory.md" "backend_inventory.md"
check_file "$ROOT_DIR/generated/recommended_next_steps.md" "recommended_next_steps.md"
check_file "$ROOT_DIR/generated/risk_register.md" "risk_register.md"
check_file "$ROOT_DIR/generated/acceptance_report.md" "acceptance_report.md"
echo ""

# Summary
echo "============================================================"
echo "  VERIFICATION SUMMARY"
echo "============================================================"
echo "  ✅ Present:  $PASS"
echo "  ○  Optional: $WARN"
echo "  ❌ Missing:  $FAIL"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo "  ✅ All required files present. Structure verified."
else
  echo "  ⚠️  $FAIL required file(s) missing. Run create-zips.sh after fixing."
fi
echo "============================================================"
echo ""
