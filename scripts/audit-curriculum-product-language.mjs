#!/usr/bin/env node
/**
 * scripts/audit-curriculum-product-language.mjs
 * Sprint 190 follow-up — Product-language audit for curriculum seed data.
 *
 * Searches all curriculum-facing seed sections of migration 053 for
 * Angles product/tool names that must not appear in curriculum data.
 *
 * Run: node scripts/audit-curriculum-product-language.mjs
 *
 * Returns exit code 0 if clean, 1 if any prohibited term found.
 *
 * Allowed tennis vocabulary (never flagged):
 *   - "closing the angle"  (court geometry — shot angle)
 *   - "short angle"        (court geometry — cross-court shot)
 *   - "create an angle"    (tactical instruction)
 *   - "crosscourt angle"   (tactical instruction)
 *   - "angle of" / "angle on" / "angle at" / "angle in" (court geometry)
 *
 * Prohibited product/tool terms:
 *   - Swinget
 *   - Swing Check / SwingCheck / Swing Check app
 *   - The Angle™  (only as product name; tennis phrases excluded)
 *   - Angles product / Angles device
 *   - device-based gate / app-based gate
 *   - product cadence / tool cadence
 *   - [PROPOSED:]  (must be stripped before seeding)
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');
const MIGRATION_053 = join(ROOT, 'supabase/migrations/053_curriculum_seed.sql');

const content = readFileSync(MIGRATION_053, 'utf8');
const lines   = content.split('\n');

// ── Section boundaries ──────────────────────────────────────────────────────
function sectionRange(name) {
  const start = content.indexOf(`-- SECTION ${name}:`);
  const names = ['1','2','3','4','5','6a','6b','7','8','9'];
  const idx   = names.indexOf(name);
  const nextName = idx !== -1 && idx + 1 < names.length ? names[idx + 1] : null;
  const end   = nextName ? content.indexOf(`-- SECTION ${nextName}:`) : content.length;
  return { start, end };
}

const CURRICULUM_FACING_SECTIONS = ['4','5','6a','6b','7','8','9'];
const ALL_SECTIONS = ['1','2','3','4','5','6a','6b','7','8','9'];

const SECTION_LABELS = {
  '1': 'curriculum_levels (UPDATE)',
  '2': 'curriculum_archetypes',
  '3': 'curriculum_failure_modes',
  '4': 'curriculum_gates',
  '5': 'curriculum_coach_language',
  '6a': 'curriculum_drills',
  '6b': 'curriculum_drill_tags',
  '7': 'curriculum_competition_track',
  '8': 'curriculum_fitness_guidance',
  '9': 'curriculum_volume_guidance',
};

// ── Product terms to flag ───────────────────────────────────────────────────
// Each entry: { pattern: RegExp, label: string, severity: 'BLOCKING'|'WARNING' }
const PRODUCT_TERMS = [
  { pattern: /swinget/i,              label: 'Swinget',            severity: 'BLOCKING' },
  { pattern: /swing\s*check\s+app/i,  label: 'Swing Check app',    severity: 'BLOCKING' },
  { pattern: /swing\s*check/i,        label: 'Swing Check',        severity: 'BLOCKING' },
  { pattern: /swingcheck/i,           label: 'SwingCheck',         severity: 'BLOCKING' },
  { pattern: /The\s+Angle™/,          label: 'The Angle™',         severity: 'BLOCKING' },
  // "The Angle" in explicit product context (device/product/tool/app)
  { pattern: /\bThe\s+Angle\s+(?:device|product|tool|app|system)\b/i,
                                       label: 'The Angle (product)', severity: 'BLOCKING' },
  { pattern: /angles\s+product/i,     label: 'Angles product',     severity: 'BLOCKING' },
  { pattern: /angles\s+device/i,      label: 'Angles device',      severity: 'BLOCKING' },
  { pattern: /device-based\s+gate/i,  label: 'device-based gate',  severity: 'BLOCKING' },
  { pattern: /app-based\s+gate/i,     label: 'app-based gate',     severity: 'BLOCKING' },
  { pattern: /product\s+cadence/i,    label: 'product cadence',    severity: 'BLOCKING' },
  { pattern: /tool\s+cadence/i,       label: 'tool cadence',       severity: 'BLOCKING' },
  { pattern: /\[PROPOSED:\]/,         label: '[PROPOSED:]',        severity: 'BLOCKING' },
];

// ── Allowed tennis phrases (context that makes a potential hit safe) ────────
const ALLOWED_CONTEXT = [
  'closing the angle',
  'short angle',
  'create an angle',
  'crosscourt angle',
  'angle of ',
  'angle on ',
  'angle at ',
  'angle in ',
  'angle to ',
  'angle for ',
  'the angle.',    // sentence-ending tennis usage
  'the angle,',
  'the angle)',
  'an angle',
  'wide angle',
  'down-the-line angle',
];

function isAllowedHit(line, match) {
  const lower = line.toLowerCase();
  const matchStart = match.index;
  const context = lower.slice(Math.max(0, matchStart - 25), matchStart + 40);
  return ALLOWED_CONTEXT.some(phrase => context.includes(phrase));
}

// ── Run audit ───────────────────────────────────────────────────────────────
let totalHits = 0;
const sectionHits = {};

for (const sec of ALL_SECTIONS) {
  const { start, end } = sectionRange(sec);
  if (start === -1) continue;

  const secLines = content.slice(start, end).split('\n');
  const startLineNum = content.slice(0, start).split('\n').length;

  const hits = [];
  for (let i = 0; i < secLines.length; i++) {
    const line = secLines[i];
    if (line.trimStart().startsWith('--')) continue; // skip SQL comments
    const lower = line.toLowerCase();

    for (const { pattern, label, severity } of PRODUCT_TERMS) {
      let m;
      const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      while ((m = re.exec(lower)) !== null) {
        if (!isAllowedHit(line, m)) {
          hits.push({
            lineNum: startLineNum + i,
            term: label,
            severity,
            preview: line.trim().slice(0, 100),
          });
          break; // one hit per term per line is enough
        }
      }
    }
  }

  sectionHits[sec] = hits;
  totalHits += hits.length;
}

// ── Report ──────────────────────────────────────────────────────────────────
console.log('\n=== Curriculum Product-Language Audit ===');
console.log(`Migration: supabase/migrations/053_curriculum_seed.sql\n`);

for (const sec of ALL_SECTIONS) {
  const hits = sectionHits[sec] || [];
  const label = SECTION_LABELS[sec] || sec;
  const isCurriculumFacing = CURRICULUM_FACING_SECTIONS.includes(sec);
  const tag = isCurriculumFacing ? '[curriculum-facing]' : '[engineering/planning]';

  if (hits.length === 0) {
    console.log(`  ✓ Section ${sec} (${label}) ${tag}: CLEAN`);
  } else {
    console.log(`  ✗ Section ${sec} (${label}) ${tag}: ${hits.length} hit(s)`);
    for (const h of hits) {
      console.log(`    Line ${h.lineNum} [${h.severity}] "${h.term}": ${h.preview}`);
    }
  }
}

console.log('\n=== Allowed Tennis Phrases (must be present and untouched) ===');
const tennisChecks = [
  { phrase: 'First-volley closing the angle', required: true },
];
for (const { phrase, required } of tennisChecks) {
  const found = content.toLowerCase().includes(phrase.toLowerCase());
  if (found) {
    console.log(`  ✓ "${phrase}" — present`);
  } else if (required) {
    console.log(`  ✗ "${phrase}" — MISSING (should not have been stripped)`);
    totalHits++;
  }
}

console.log('\n=== Summary ===');
if (totalHits === 0) {
  console.log('PASS — zero product/tool references. Allowed tennis phrases intact.');
  process.exit(0);
} else {
  console.log(`FAIL — ${totalHits} issue(s) found. Fix generator and regenerate migration.`);
  process.exit(1);
}
