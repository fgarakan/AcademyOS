#!/usr/bin/env node
/**
 * scripts/qa-curriculum-seed-migration.mjs
 * Sprint 190 — Static QA for curriculum seed migration 053.
 *
 * Parses supabase/migrations/053_curriculum_seed.sql without executing it.
 * Reports expected row counts, domain validity, product-tool leakage,
 * and structural checks.
 *
 * Run: node scripts/qa-curriculum-seed-migration.mjs
 *
 * Limitations:
 *   - Cannot verify that migrations actually applied to a live DB.
 *   - Cannot verify FK resolution (level subqueries return correct UUIDs).
 *   - Cannot verify ON CONFLICT deduplication behavior.
 *   All of the above require a live Supabase environment.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const MIGRATION_053 = join(ROOT, 'supabase/migrations/053_curriculum_seed.sql');

const content = readFileSync(MIGRATION_053, 'utf8');

let passed = 0;
let failed = 0;
const issues = [];

function check(label, actual, expected, exact = true) {
  const ok = exact ? actual === expected : actual >= expected;
  if (ok) {
    console.log(`  ✓ ${label}: ${actual}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}: got ${actual}, expected ${expected}`);
    failed++;
    issues.push(`${label}: got ${actual}, expected ${expected}`);
  }
}

function checkTrue(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}${detail ? ': ' + detail : ''}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}${detail ? ': ' + detail : ''}`);
    failed++;
    issues.push(label);
  }
}

// ── Section detection ───────────────────────────────────────────────────────
const SECTIONS = {
  archetypes:  [content.indexOf('-- SECTION 2:'), content.indexOf('-- SECTION 3:')],
  failmodes:   [content.indexOf('-- SECTION 3:'), content.indexOf('-- SECTION 4:')],
  gates:       [content.indexOf('-- SECTION 4:'), content.indexOf('-- SECTION 5:')],
  coachlang:   [content.indexOf('-- SECTION 5:'), content.indexOf('-- SECTION 6a:')],
  drills:      [content.indexOf('-- SECTION 6a:'), content.indexOf('-- SECTION 6b:')],
  drilltags:   [content.indexOf('-- SECTION 6b:'), content.indexOf('-- SECTION 7:')],
  competition: [content.indexOf('-- SECTION 7:'), content.indexOf('-- SECTION 8:')],
  fitness:     [content.indexOf('-- SECTION 8:'), content.indexOf('-- SECTION 9:')],
  volume:      [content.indexOf('-- SECTION 9:'), content.length],
};

function section(name) {
  const [s, e] = SECTIONS[name];
  return content.slice(s, e);
}

// ── 1. Row counts ───────────────────────────────────────────────────────────
console.log('\n=== Row Count Checks ===');

check('curriculum_levels UPDATE statements',
  (content.match(/^UPDATE curriculum_levels/gm) || []).length, 15);

check('curriculum_archetypes rows (A1–A8)',
  (section('archetypes').match(/^\s*\('A\d/gm) || []).length, 8);

check('curriculum_failure_modes rows (FM-01–FM-14)',
  (section('failmodes').match(/^\s*\('FM-\d+/gm) || []).length, 14);

check('curriculum_gates INSERTs',
  (content.match(/^INSERT INTO curriculum_gates$/gm) || []).length, 57);

check('curriculum_coach_language INSERTs',
  (content.match(/^INSERT INTO curriculum_coach_language$/gm) || []).length, 120);

check('curriculum_drills INSERTs',
  (content.match(/^INSERT INTO curriculum_drills$/gm) || []).length, 152);

check('curriculum_drill_tags INSERTs',
  (content.match(/^INSERT INTO curriculum_drill_tags/gm) || []).length, 614);

check('curriculum_competition_track INSERTs',
  (content.match(/^INSERT INTO curriculum_competition_track$/gm) || []).length, 15);

check('curriculum_fitness_guidance INSERTs',
  (content.match(/^INSERT INTO curriculum_fitness_guidance$/gm) || []).length, 15);

check('curriculum_volume_guidance INSERTs',
  (content.match(/^INSERT INTO curriculum_volume_guidance$/gm) || []).length, 15);

check('drill_gate_mappings INSERTs (must be 0)',
  (content.match(/INSERT INTO drill_gate_mappings/g) || []).length, 0);

// ── 2. Idempotency ──────────────────────────────────────────────────────────
console.log('\n=== Idempotency Check ===');
const onConflict = (content.match(/ON CONFLICT/gm) || []).length;
const doNothing  = (content.match(/DO NOTHING/gm) || []).length;
checkTrue('All ON CONFLICT have DO NOTHING', onConflict === doNothing,
  `${onConflict} ON CONFLICT = ${doNothing} DO NOTHING`);

// ── 3. HP3 exit gate ────────────────────────────────────────────────────────
console.log('\n=== HP3 Exit Gate ===');
checkTrue('HP3__OUT__01 gate exists', content.includes("'HP3__OUT__01'"));
checkTrue('HP3__OUT__01 has NULL to_level_id',
  /HP3__OUT__01[\s\S]{0,300}NULL,/.test(content));

// ── 4. Stage enum values ────────────────────────────────────────────────────
console.log('\n=== Stage Enum Values ===');
const VALID_STAGES = new Set(['red_foundation','orange_development','green_performance',
                               'yellow_competitive','high_performance']);
const stagesUsed = new Set((content.match(/'(\w+)'::curriculum_stage/g) || [])
  .map(m => m.replace(/'(\w+)'::curriculum_stage/, '$1').replace(/'/g, '')));
// Re-extract properly
const stageMatches = [...content.matchAll(/'([^']+)'::curriculum_stage/g)].map(m => m[1]);
const invalidStages = stageMatches.filter(s => !VALID_STAGES.has(s));
checkTrue('All curriculum_stage references valid',
  invalidStages.length === 0,
  invalidStages.length > 0 ? `Invalid: ${[...new Set(invalidStages)].join(', ')}` : '5 valid stages');

// ── 5. Product-tool leakage ─────────────────────────────────────────────────
console.log('\n=== Product-Tool Leakage ===');

// Check sections AFTER failure_modes (line ~182)
const postPlanningContent = content.slice(content.indexOf('-- SECTION 4:'));
const nonCommentLines = postPlanningContent.split('\n').filter(l => !l.trimStart().startsWith('--'));
const nonCommentText = nonCommentLines.join('\n');

const productTerms = ['swinget', 'swingcheck', 'swing check app'];
productTerms.forEach(term => {
  const found = nonCommentText.toLowerCase().includes(term);
  checkTrue(`No "${term}" in core data fields`, !found);
});

// "the angle" - allowed only as tennis phrase
const angleMatches = [...nonCommentText.matchAll(/'[^']*the angle[^']*'/gi)];
const badAngles = angleMatches.filter(m => !m[0].toLowerCase().includes('closing the angle'));
checkTrue('No "The Angle™" product references in data (tennis phrase allowed)',
  badAngles.length === 0,
  badAngles.length === 0 ? '"closing the angle" tennis phrase is only match' : badAngles.map(m=>m[0]).join(', '));

// [PROPOSED:] - allowed only in archetypes/failure_modes sections (before SECTION 4)
const prePlanning = content.slice(0, content.indexOf('-- SECTION 4:'));
const postPlanning = content.slice(content.indexOf('-- SECTION 4:'));
const proposedInCore = postPlanning.split('\n')
  .filter(l => l.includes('[PROPOSED:]') && !l.trimStart().startsWith('--'));
checkTrue('[PROPOSED:] markers only in archetypes/failure_modes (not in core tables)',
  proposedInCore.length === 0,
  proposedInCore.length > 0 ? `Found in core sections: ${proposedInCore.length} lines` : 'clean');

// ── 6. Level display names ──────────────────────────────────────────────────
console.log('\n=== Level Display Names ===');
const EXPECTED_NAMES = [
  'Red 1 — Foundation', 'Red 2 — Intermediate', 'Red 3 — Matchplay',
  'Orange 1 — Foundation', 'Orange 2 — Intermediate', 'Orange 3 — Matchplay',
  'Green 1 — Foundation', 'Green 2 — Intermediate', 'Green 3 — Matchplay',
  'Yellow 1 — Foundation', 'Yellow 2 — Intermediate', 'Yellow 3 — Matchplay',
  'High Performance 1 — Foundation', 'High Performance 2 — Intermediate',
  'High Performance 3 — Matchplay',
];
EXPECTED_NAMES.forEach(name => {
  checkTrue(`Display name: "${name}"`, content.includes(`'${name}'`));
});

// ── 7. Deferred tables ──────────────────────────────────────────────────────
console.log('\n=== Deferred Tables ===');
checkTrue('drill_gate_mappings intentionally empty',
  !content.includes('INSERT INTO drill_gate_mappings'));
checkTrue('No ACR algorithm in seed',
  !content.toLowerCase().includes('acr_score') && !content.toLowerCase().includes('acr_algorithm'));
checkTrue('No automated archetype assignment',
  !content.toLowerCase().includes('auto_assign_archetype'));

// ── Summary ─────────────────────────────────────────────────────────────────
console.log('\n=== Summary ===');
console.log(`Checks: ${passed + failed} total — ${passed} passed, ${failed} failed`);
if (issues.length > 0) {
  console.log('Issues:');
  issues.forEach(i => console.log(`  - ${i}`));
  process.exit(1);
} else {
  console.log('All checks passed. Migration 053 is statically valid.');
}
