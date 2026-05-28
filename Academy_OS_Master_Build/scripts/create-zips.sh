#!/usr/bin/env bash
# ============================================================
# ACADEMY OS — ZIP PACKAGE GENERATOR
# Creates individual package zips + one master zip
# Usage: bash scripts/create-zips.sh
# Run from Academy_OS_Master_Build/ directory
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGES_DIR="$ROOT_DIR/packages"
ZIPS_DIR="$ROOT_DIR/zips"

echo ""
echo "============================================================"
echo "  ACADEMY OS — ZIP PACKAGE GENERATOR"
echo "============================================================"
echo "  Root: $ROOT_DIR"
echo "  Packages: $PACKAGES_DIR"
echo "  Output: $ZIPS_DIR"
echo "============================================================"
echo ""

# Create zips directory
mkdir -p "$ZIPS_DIR"

# Define packages
PACKAGES=(
  "01_PRODUCT_STRATEGY_AND_SCOPE"
  "02_DATABASE_AND_SUPABASE_SCHEMA"
  "03_VOICE_FIRST_ARCHITECTURE"
  "04_NEW_STUDENT_PLACEMENT_ENGINE"
  "05_PLAYER_PROFILE_AND_DEVELOPMENT_PATHS"
  "06_SESSION_TEMPLATE_EXERCISE_SYSTEM"
  "07_COACH_NOTES_AND_ASSESSMENTS"
  "08_UI_UX_WIREFRAMES_AND_SCREEN_SPECS"
  "09_AI_WORKFLOW_AND_CLAUDE_PROMPTS"
  "10_IMPLEMENTATION_ROADMAP_AND_TESTING"
  "11_ARCHIVE_EXISTING_FILES_AND_REFERENCE"
)

SUCCESS_COUNT=0
FAIL_COUNT=0

# Zip each package
for PKG in "${PACKAGES[@]}"; do
  PKG_PATH="$PACKAGES_DIR/$PKG"
  ZIP_PATH="$ZIPS_DIR/${PKG}.zip"

  if [ -d "$PKG_PATH" ]; then
    echo -n "  Zipping $PKG ... "
    (cd "$PACKAGES_DIR" && zip -r "$ZIP_PATH" "$PKG" -x "*.DS_Store" -x "*__pycache__*" > /dev/null 2>&1)
    FILE_COUNT=$(unzip -l "$ZIP_PATH" | tail -1 | awk '{print $2}')
    echo "✓ ($FILE_COUNT files)"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "  ⚠️  MISSING: $PKG (directory not found)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

echo ""
echo "  Creating master zip (all packages) ..."
MASTER_ZIP="$ZIPS_DIR/ACADEMY_OS_MASTER_BUILD_ALL_PACKAGES.zip"

# Master zip: packages + root docs (excluding zips/ to avoid recursion)
(cd "$ROOT_DIR" && zip -r "$MASTER_ZIP" \
  packages/ \
  ACADEMY_OS_MASTER_ORG.md \
  MISSING_ITEMS_AND_DECISIONS.md \
  BUILD_ORDER.md \
  PACKAGE_INDEX.md \
  README.md \
  -x "*.DS_Store" -x "*__pycache__*" -x "zips/*" > /dev/null 2>&1)

MASTER_COUNT=$(unzip -l "$MASTER_ZIP" | tail -1 | awk '{print $2}')
echo "  ✓ ACADEMY_OS_MASTER_BUILD_ALL_PACKAGES.zip ($MASTER_COUNT files)"

echo ""
echo "============================================================"
echo "  RESULTS"
echo "============================================================"
echo "  Packages zipped: $SUCCESS_COUNT"
if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "  Packages missing: $FAIL_COUNT ⚠️"
fi
echo ""
echo "  Output location: $ZIPS_DIR/"
echo ""
ls -lh "$ZIPS_DIR/"
echo ""
echo "  Done."
echo "============================================================"
echo ""
