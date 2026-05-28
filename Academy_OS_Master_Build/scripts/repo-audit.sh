#!/usr/bin/env bash
# ============================================================
# ACADEMY OS — REPOSITORY AUDIT
# Outputs a summary of all important files in the repo
# Usage: bash scripts/repo-audit.sh
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$ROOT_DIR")"

echo ""
echo "============================================================"
echo "  ACADEMY OS — REPOSITORY AUDIT"
echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  Repo root: $REPO_ROOT"
echo "============================================================"
echo ""

echo "── ROOT FILES"
find "$REPO_ROOT" -maxdepth 1 -type f | sort | while read f; do
  FNAME=$(basename "$f")
  SIZE=$(wc -l < "$f" 2>/dev/null || echo "?")
  echo "   $FNAME ($SIZE lines)"
done
echo ""

echo "── MASTER BUILD (Academy_OS_Master_Build/)"
echo "   Root docs:"
find "$ROOT_DIR" -maxdepth 1 -type f -name "*.md" | sort | while read f; do
  FNAME=$(basename "$f")
  SIZE=$(wc -l < "$f")
  echo "     $FNAME ($SIZE lines)"
done
echo ""
echo "   Packages:"
for PKG_DIR in "$ROOT_DIR/packages"/*/; do
  PKG_NAME=$(basename "$PKG_DIR")
  FILE_COUNT=$(find "$PKG_DIR" -type f | wc -l)
  echo "     $PKG_NAME ($FILE_COUNT files)"
done
echo ""
echo "   Generated reports:"
find "$ROOT_DIR/generated" -type f -name "*.md" | sort | while read f; do
  FNAME=$(basename "$f")
  SIZE=$(wc -l < "$f")
  echo "     $FNAME ($SIZE lines)"
done
echo ""
echo "   Scripts:"
find "$ROOT_DIR/scripts" -type f | sort | while read f; do
  FNAME=$(basename "$f")
  echo "     $FNAME"
done
echo ""
echo "   Zips:"
if ls "$ROOT_DIR/zips"/*.zip 2>/dev/null | head -1 > /dev/null 2>&1; then
  ls -lh "$ROOT_DIR/zips"/*.zip | awk '{print "     " $9 " (" $5 ")"}'
else
  echo "     (none generated yet — run create-zips.sh)"
fi
echo ""

echo "── TYPESCRIPT SCAFFOLDS (src/)"
if [ -d "$REPO_ROOT/src" ]; then
  find "$REPO_ROOT/src" -type f | sort | while read f; do
    REL="${f#$REPO_ROOT/}"
    SIZE=$(wc -l < "$f")
    echo "   $REL ($SIZE lines)"
  done
else
  echo "   (no src/ directory — Next.js not initialized yet)"
fi
echo ""

echo "── GIT STATUS"
cd "$REPO_ROOT" && git status --short
echo ""
echo "── RECENT COMMITS"
cd "$REPO_ROOT" && git log --oneline -5
echo ""
echo "============================================================"
echo "  Audit complete."
echo "============================================================"
echo ""
