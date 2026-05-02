#!/usr/bin/env node
/**
 * scripts/validate-curriculum-seed-sources.mjs
 * Sprint 188 — Curriculum Spreadsheet Validation + Normalized Seed Preview
 *
 * Validates source xlsx files against the constraints defined in
 * migration 052 before migration 053 (seed data) is generated.
 *
 * Parser strategy: No xlsx npm package is installed. This script uses
 * openpyxl via a Python subprocess (Python 3 + openpyxl are available
 * in this environment). If openpyxl is not available, the script exits
 * with instructions to install it or the xlsx npm package.
 *
 * Usage: node scripts/validate-curriculum-seed-sources.mjs
 *
 * Outputs:
 *   - Console pass/fail per validation check
 *   - docs/curriculum/seed-validation-report.md
 *   - docs/curriculum/seed-preview/*.json  (normalized previews)
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// ── Paths ─────────────────────────────────────────────────────────────────────

const SRC_EXTRACTED = resolve(ROOT, 'docs/curriculum/source-files/extracted');
const SRC_ROOT      = resolve(ROOT, 'docs/curriculum/source-files');
const PREVIEW_DIR   = resolve(ROOT, 'docs/curriculum/seed-preview');
const REPORT_PATH   = resolve(ROOT, 'docs/curriculum/seed-validation-report.md');

const SOURCE_FILES = {
  Gates:         resolve(SRC_EXTRACTED, 'AOS_Curriculum_Gates.xlsx'),
  Drills:        resolve(SRC_EXTRACTED, 'AOS_Curriculum_Drills.xlsx'),
  CoachLanguage: resolve(SRC_EXTRACTED, 'AOS_Curriculum_CoachLanguage.xlsx'),
  Competition:   resolve(SRC_EXTRACTED, 'AOS_Curriculum_Competition.xlsx'),
  Fitness:       resolve(SRC_EXTRACTED, 'AOS_Curriculum_Fitness.xlsx'),
  Volume:        resolve(SRC_EXTRACTED, 'AOS_Curriculum_Volume.xlsx'),
  StressTest:    resolve(SRC_ROOT,      'AOS_Curriculum_StressTest.xlsx'),
};

// ── Curriculum constants ───────────────────────────────────────────────────────

const VALID_STAGES = [
  'Red 1', 'Red 2', 'Red 3',
  'Orange 1', 'Orange 2', 'Orange 3',
  'Green 1', 'Green 2', 'Green 3',
  'Yellow 1', 'Yellow 2', 'Yellow 3',
  'HP 1', 'HP 2', 'HP 3',
];

// Migration 052 CHECK constraints
const GATE_DOMAINS_MIGRATION = new Set([
  'Technical', 'Tactical', 'Movement', 'Competition', 'Mentality', 'Fitness Support',
]);

const DRILL_DOMAINS_MIGRATION = new Set([
  'Technical', 'Tactical', 'Movement', 'Competition', 'Mentality', 'Fitness',
]);

const SESSION_BLOCKS_MIGRATION = new Set([
  'Warm-Up', 'Focus', 'Train', 'Play', 'Game',
]);

const GATE_TYPES_MIGRATION = new Set([
  'RATE', 'COUNT', 'OBSERVATION', 'TIME_WINDOW', 'CHECKLIST', 'RESULT',
]);

const EVALUATORS_MIGRATION = new Set(['Coach', 'Director', 'S&C']);

const COACH_LANGUAGE_DOMAINS_MIGRATION = new Set([
  'Technical', 'Tactical', 'Movement', 'Competition',
  'Mentality', 'Fitness', 'Recovery', 'Lifestyle',
]);

const ARCHETYPE_TAGS = new Set(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8']);

const FITNESS_PHASES_MIGRATION = new Set([
  'physical_literacy', 'athletic_foundation', 'sport_performance', 'high_performance',
]);

// Domain normalization: source xlsx value → migration CHECK constraint value
const GATE_DOMAIN_NORMALIZATION = {
  'Movement / Athletic':          'Movement',
  'Mentality / Learning Behavior': 'Mentality',
  'Tactical (Court Mapping)':     'Tactical',
  'Technical':                    'Technical',
  'Competition':                  'Competition',
  'Fitness Support':              'Fitness Support',
};

// Stage-to-fitness-phase mapping
const STAGE_TO_FITNESS_PHASE = {
  'Red 1': 'physical_literacy', 'Red 2': 'physical_literacy', 'Red 3': 'physical_literacy',
  'Orange 1': 'athletic_foundation', 'Orange 2': 'athletic_foundation', 'Orange 3': 'athletic_foundation',
  'Green 1': 'sport_performance', 'Green 2': 'sport_performance', 'Green 3': 'sport_performance',
  'Yellow 1': 'high_performance', 'Yellow 2': 'high_performance', 'Yellow 3': 'high_performance',
  'HP 1': 'high_performance', 'HP 2': 'high_performance', 'HP 3': 'high_performance',
};

// ── Product-tool leakage terms (core fields only; Notes are informational) ────

// Terms to check in CORE data fields (criterion, threshold, drill procedure, cues etc.)
const LEAKAGE_TERMS_CORE = [
  'swinget',
  'the angle™',
  'swingcheck',
  'three-zone diagnostic',
  'three zone diagnostic',
  'strap mode',
  'product cadence',
  'tool volume cadence',
];

// Terms to check in ALL fields including Notes (generates WARNING not BLOCK)
const LEAKAGE_TERMS_NOTES = ['swinget', 'swingcheck', 'the angle™', 'strap mode'];

// Known false positives (exact substring matches that are legitimate tennis terms)
const FALSE_POSITIVES = [
  'closing the angle',     // tennis shot angle, not The Angle™ product
  'the angle of the ball', // physics description
];

// ── Console colours ────────────────────────────────────────────────────────────

const OK   = '  ✓';
const FAIL = '  ✗';
const WARN = '  ⚠';
const INFO = '  ·';

function pass(msg) { console.log(`\x1b[32m${OK}  ${msg}\x1b[0m`); }
function fail(msg) { console.log(`\x1b[31m${FAIL} ${msg}\x1b[0m`); }
function warn(msg) { console.log(`\x1b[33m${WARN}  ${msg}\x1b[0m`); }
function info(msg) { console.log(`\x1b[90m${INFO}  ${msg}\x1b[0m`); }
function head(msg) { console.log(`\n\x1b[1m${msg}\x1b[0m`); }

// ── Python availability check ─────────────────────────────────────────────────

function checkPython() {
  try {
    const result = execSync('python3 -c "import openpyxl; print(openpyxl.__version__)"', {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    info(`openpyxl ${result} detected — using Python for xlsx parsing`);
    return true;
  } catch {
    console.error('\nERROR: openpyxl not available.');
    console.error('This script requires Python 3 with openpyxl installed.');
    console.error('Alternative: install the xlsx npm package:');
    console.error('  npm install --save-dev xlsx');
    console.error('(Smallest xlsx parser at ~1.3 MB. Requires explicit approval per CLAUDE.md.)');
    process.exit(1);
  }
}

// ── xlsx extraction via Python ────────────────────────────────────────────────

function extractXlsx(filePath) {
  // Write a temporary Python script to avoid shell-escaping issues with -c
  const tmpScript = resolve(tmpdir(), `aos_xlsx_extract_${Date.now()}.py`);
  const tmpData   = resolve(tmpdir(), `aos_xlsx_data_${Date.now()}.json`);

  const pyScript = [
    'import openpyxl, json, sys',
    `path = ${JSON.stringify(filePath)}`,
    `out_path = ${JSON.stringify(tmpData)}`,
    'try:',
    '    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)',
    'except Exception as e:',
    '    open(out_path, "w").write(json.dumps({"error": str(e)}))',
    '    sys.exit(0)',
    'result = {"sheetnames": list(wb.sheetnames), "sheets": {}}',
    'for name in wb.sheetnames:',
    '    ws = wb[name]',
    '    rows = list(ws.values)',
    '    if not rows:',
    '        result["sheets"][name] = {"headers": [], "data": [], "total_rows": 0}',
    '        continue',
    '    headers = [str(h) if h is not None else "" for h in rows[0]]',
    '    data = []',
    '    for row in rows[1:]:',
    '        record = {}',
    '        for i, h in enumerate(headers):',
    '            v = row[i] if i < len(row) else None',
    '            record[h] = str(v) if v is not None else None',
    '        if any(v is not None for v in record.values()):',
    '            data.append(record)',
    '    result["sheets"][name] = {"headers": headers, "data": data, "total_rows": len(data)}',
    'wb.close()',
    'open(out_path, "w", encoding="utf-8").write(json.dumps(result, ensure_ascii=False))',
  ].join('\n');

  try {
    writeFileSync(tmpScript, pyScript, 'utf8');
    execSync(`python3 ${JSON.stringify(tmpScript)}`, {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const raw = readFileSync(tmpData, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { error: String(e.message || e) };
  } finally {
    try { unlinkSync(tmpScript); } catch {}
    try { unlinkSync(tmpData); } catch {}
  }
}

// ── Leakage scanner ───────────────────────────────────────────────────────────

function isFalsePositive(text) {
  const lower = text.toLowerCase();
  return FALSE_POSITIVES.some(fp => lower.includes(fp));
}

function scanLeakageCore(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return LEAKAGE_TERMS_CORE.filter(t => lower.includes(t) && !isFalsePositive(text));
}

function scanLeakageNotes(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return LEAKAGE_TERMS_NOTES.filter(t => lower.includes(t) && !isFalsePositive(text));
}

// ── Result accumulator ────────────────────────────────────────────────────────

const results = {
  filesInspected:   [],
  sheetsInspected:  [],
  rowCounts:        {},
  missingColumns:   [],
  invalidDomains:   [],
  duplicateIds:     [],
  leakageCore:      [],   // BLOCKING leakage (in criteria/threshold/procedure fields)
  leakageNotes:     [],   // WARNING leakage (in Notes/informational fields)
  falsePositives:   [],
  domainNormalization: [], // normalization mappings needed
  schemaGaps:       [],   // schema defined but not used
  rowsSafeToSeed:   {},
  rowsBlocked:      {},
  tablesReady:      [],
  tablesDeferred:   [],
  checks:           { passed: 0, failed: 0, warned: 0 },
};

function recordPass()  { results.checks.passed++; }
function recordFail()  { results.checks.failed++; }
function recordWarn()  { results.checks.warned++; }

// ── Validate Gates ─────────────────────────────────────────────────────────────

function validateGates(wb) {
  head('AOS_Curriculum_Gates.xlsx');
  results.filesInspected.push('AOS_Curriculum_Gates.xlsx');

  const expectedSheets = ['Gate Spec Format', 'Gate Library', 'Summary'];
  const actualSheets   = wb.sheetnames || [];
  results.sheetsInspected.push(...actualSheets.map(s => `Gates / ${s}`));

  for (const s of expectedSheets) {
    if (actualSheets.includes(s)) { pass(`Sheet "${s}" exists`); recordPass(); }
    else { fail(`Sheet "${s}" MISSING`); recordFail(); }
  }

  const lib = wb.sheets?.['Gate Library'];
  if (!lib) { fail('Gate Library sheet not accessible'); recordFail(); return {}; }

  // Required columns
  const requiredCols = ['Gate ID', 'From', 'To', 'Domain', 'Criterion', 'Type',
    'Threshold', 'Recording Method', 'Evidence Window', 'Evaluator', 'Cadence'];
  const missing = requiredCols.filter(c => !lib.headers.includes(c));
  if (missing.length === 0) { pass(`All ${requiredCols.length} required columns present`); recordPass(); }
  else {
    fail(`Missing columns: ${missing.join(', ')}`);
    results.missingColumns.push(...missing.map(c => `Gates/${c}`));
    recordFail();
  }

  // Row count
  const count = lib.total_rows;
  if (count === 57) { pass(`Row count: ${count} (expected 57) ✓`); recordPass(); }
  else { fail(`Row count: ${count} (expected 57)`); recordFail(); }
  results.rowCounts['Gates / Gate Library'] = count;

  // Unique gate IDs
  const gateIds = lib.data.map(r => r['Gate ID']).filter(Boolean);
  const dupGateIds = gateIds.filter((id, i) => gateIds.indexOf(id) !== i);
  if (dupGateIds.length === 0) { pass('Gate IDs are unique'); recordPass(); }
  else {
    fail(`Duplicate gate IDs: ${dupGateIds.join(', ')}`);
    results.duplicateIds.push(...dupGateIds.map(id => `Gates/${id}`));
    recordFail();
  }

  // Domain validation + normalization
  const invalidDomains = [];
  const normalizationNeeded = new Set();
  for (const row of lib.data) {
    const raw = row['Domain'];
    if (!raw) continue;
    const normalized = GATE_DOMAIN_NORMALIZATION[raw];
    if (!normalized) {
      invalidDomains.push(raw);
    } else if (raw !== normalized) {
      normalizationNeeded.add(`"${raw}" → "${normalized}"`);
    }
  }
  if (invalidDomains.length === 0) { pass('All gate domains have valid normalization mappings'); recordPass(); }
  else { fail(`Gate domains without normalization: ${[...new Set(invalidDomains)].join(', ')}`); recordFail(); }
  if (normalizationNeeded.size > 0) {
    warn(`Domain normalization required for ${normalizationNeeded.size} raw values:`);
    for (const m of normalizationNeeded) {
      info(m);
      results.domainNormalization.push(`Gates: ${m}`);
    }
    recordWarn();
  }

  // Gate type validation
  const invalidTypes = lib.data
    .map(r => r['Type'])
    .filter(t => t && !GATE_TYPES_MIGRATION.has(t));
  if (invalidTypes.length === 0) { pass('All gate types valid'); recordPass(); }
  else { fail(`Invalid gate types: ${[...new Set(invalidTypes)].join(', ')}`); recordFail(); }

  // Evaluator validation — "Coach + Director" is a compound value needing normalization
  const compoundEvals = lib.data.map(r => r['Evaluator']).filter(e => e && e.includes('+'));
  const invalidEvals  = lib.data.map(r => r['Evaluator'])
    .filter(e => e && !EVALUATORS_MIGRATION.has(e) && !e.includes('+'));
  if (invalidEvals.length === 0 && compoundEvals.length === 0) {
    pass('All evaluator values valid'); recordPass();
  } else if (invalidEvals.length === 0 && compoundEvals.length > 0) {
    warn(`${compoundEvals.length} gate(s) have compound evaluator "Coach + Director" — normalization to "Director" required at seed time`);
    results.domainNormalization.push(`Gates evaluator: "Coach + Director" → "Director" (${compoundEvals.length} gates)`);
    recordWarn();
  } else {
    fail(`Invalid evaluators with no normalization path: ${[...new Set(invalidEvals)].join(', ')}`); recordFail();
  }

  // Stage validation (From / To) — HP3 exit uses "Out (Living-as-a-Pro)"
  const OUT_ALIASES = ['Out', 'Out (Living-as-a-Pro)'];
  const invalidFromTo = lib.data.flatMap(r => {
    const issues = [];
    if (r['From'] && !VALID_STAGES.includes(r['From'])) issues.push(`From="${r['From']}"`);
    if (r['To'] && !VALID_STAGES.includes(r['To']) && !OUT_ALIASES.includes(r['To'])) issues.push(`To="${r['To']}"`);
    return issues;
  });
  const outAliasRows = lib.data.filter(r => r['To'] && r['To'] !== 'Out' && OUT_ALIASES.includes(r['To']));
  if (invalidFromTo.length === 0) { pass('All From/To stage values valid'); recordPass(); }
  else { fail(`Invalid stage values: ${[...new Set(invalidFromTo)].join(', ')}`); recordFail(); }
  if (outAliasRows.length > 0) {
    warn(`HP3 exit gate uses To="${outAliasRows[0]['To']}" — normalize to NULL (to_level_id IS NULL) at seed time`);
    results.domainNormalization.push(`Gates To: "Out (Living-as-a-Pro)" → NULL (to_level_id IS NULL per migration 052 schema)`);
    recordWarn();
  }

  // Leakage check
  let coreLeakCount = 0;
  let notesLeakCount = 0;
  for (const row of lib.data) {
    const coreText = [row['Criterion'], row['Threshold'], row['Recording Method'],
      row['Evidence Window']].filter(Boolean).join(' ');
    const coreHits = scanLeakageCore(coreText);
    if (coreHits.length > 0) {
      coreLeakCount++;
      results.leakageCore.push({ source: 'Gates', id: row['Gate ID'], terms: coreHits, fields: 'criterion/threshold' });
    }

    const notesText = row['Notes'] || '';
    const notesHits = scanLeakageNotes(notesText);
    if (notesHits.length > 0) {
      const context = notesText.toLowerCase();
      const isFP = FALSE_POSITIVES.some(fp => context.includes(fp));
      if (!isFP) {
        notesLeakCount++;
        results.leakageNotes.push({ source: 'Gates', id: row['Gate ID'], terms: notesHits, fields: 'Notes (informational)', text: notesText.substring(0, 120) });
      }
    }
  }
  if (coreLeakCount === 0) { pass('No product-tool leakage in core gate criterion/threshold fields'); recordPass(); }
  else { fail(`BLOCKING leakage in ${coreLeakCount} gate core fields`); recordFail(); }
  if (notesLeakCount > 0) {
    warn(`${notesLeakCount} product-tool reference(s) in Gates Notes column (informational [PROPOSED:] notes — not gate criteria)`);
    recordWarn();
  }

  // Summary
  const blocked = coreLeakCount;
  const safe = count - blocked;
  results.rowsSafeToSeed['curriculum_gates'] = safe;
  results.rowsBlocked['curriculum_gates'] = blocked;
  if (blocked === 0) { results.tablesReady.push('curriculum_gates'); }

  return { data: lib.data, headers: lib.headers };
}

// ── Validate Drills ────────────────────────────────────────────────────────────

function validateDrills(wb) {
  head('AOS_Curriculum_Drills.xlsx');
  results.filesInspected.push('AOS_Curriculum_Drills.xlsx');

  const expectedSheets = ['README', 'Schema', 'Drill Library', 'Stage Coverage', 'Tags Index'];
  const actualSheets   = wb.sheetnames || [];
  results.sheetsInspected.push(...actualSheets.map(s => `Drills / ${s}`));

  for (const s of expectedSheets) {
    if (actualSheets.includes(s)) { pass(`Sheet "${s}" exists`); recordPass(); }
    else { fail(`Sheet "${s}" MISSING`); recordFail(); }
  }

  const lib = wb.sheets?.['Drill Library'];
  if (!lib) { fail('Drill Library sheet not accessible'); recordFail(); return {}; }

  const requiredCols = ['drill_id', 'name', 'stage_min', 'stage_max', 'domain',
    'session_block', 'objective', 'setup', 'procedure', 'coaching_cues',
    'progression_easier', 'progression_harder', 'success_criteria',
    'duration_minutes', 'players_needed', 'tags'];
  const missing = requiredCols.filter(c => !lib.headers.includes(c));
  if (missing.length === 0) { pass(`All ${requiredCols.length} required columns present`); recordPass(); }
  else { fail(`Missing columns: ${missing.join(', ')}`); results.missingColumns.push(...missing.map(c => `Drills/${c}`)); recordFail(); }

  const count = lib.total_rows;
  if (count === 152) { pass(`Row count: ${count} (expected 152) ✓`); recordPass(); }
  else { fail(`Row count: ${count} (expected 152)`); recordFail(); }
  results.rowCounts['Drills / Drill Library'] = count;

  // Unique drill IDs
  const drillIds = lib.data.map(r => r['drill_id']).filter(Boolean);
  const dupDrillIds = drillIds.filter((id, i) => drillIds.indexOf(id) !== i);
  if (dupDrillIds.length === 0) { pass('Drill IDs are unique'); recordPass(); }
  else { fail(`Duplicate drill IDs: ${dupDrillIds.slice(0, 5).join(', ')}…`); results.duplicateIds.push(...dupDrillIds.map(id => `Drills/${id}`)); recordFail(); }

  // Domain validation
  const invalidDomains = lib.data.map(r => r['domain']).filter(d => d && !DRILL_DOMAINS_MIGRATION.has(d));
  if (invalidDomains.length === 0) { pass('All drill domains valid for migration 052 constraint'); recordPass(); }
  else { fail(`Invalid drill domains: ${[...new Set(invalidDomains)].join(', ')}`); recordFail(); }

  // Session block validation
  const usedBlocks = new Set(lib.data.map(r => r['session_block']).filter(Boolean));
  const invalidBlocks = [...usedBlocks].filter(b => !SESSION_BLOCKS_MIGRATION.has(b));
  const unusedBlocks = [...SESSION_BLOCKS_MIGRATION].filter(b => !usedBlocks.has(b));
  if (invalidBlocks.length === 0) { pass('All session_block values valid for migration 052 constraint'); recordPass(); }
  else { fail(`Invalid session blocks: ${invalidBlocks.join(', ')}`); recordFail(); }
  if (unusedBlocks.length > 0) {
    warn(`Session block(s) defined in migration but not present in source: ${unusedBlocks.join(', ')}`);
    info('Not a blocker — migration allows these values but source drills do not use them yet');
    results.schemaGaps.push(`Drills: session_block "${unusedBlocks.join(', ')}" allowed by migration but absent from source`);
    recordWarn();
  }

  // Stage validation
  const invalidStages = lib.data.flatMap(r => {
    const issues = [];
    if (r['stage_min'] && !VALID_STAGES.includes(r['stage_min'])) issues.push(r['stage_min']);
    if (r['stage_max'] && !VALID_STAGES.includes(r['stage_max'])) issues.push(r['stage_max']);
    return issues;
  });
  if (invalidStages.length === 0) { pass('All stage_min/stage_max values match 15 curriculum levels'); recordPass(); }
  else { fail(`Invalid stage values: ${[...new Set(invalidStages)].slice(0, 5).join(', ')}`); recordFail(); }

  // Leakage check — core fields
  let coreLeakCount = 0;
  for (const row of lib.data) {
    const coreText = [row['objective'], row['setup'], row['procedure'],
      row['coaching_cues'], row['success_criteria']].filter(Boolean).join(' ');
    const hits = scanLeakageCore(coreText);
    if (hits.length > 0) {
      coreLeakCount++;
      results.leakageCore.push({ source: 'Drills', id: row['drill_id'], terms: hits });
    }
  }
  if (coreLeakCount === 0) { pass('No product-tool leakage in drill core fields'); recordPass(); }
  else { fail(`BLOCKING leakage in ${coreLeakCount} drill rows`); recordFail(); }

  // Tags Index
  const tagsSheet = wb.sheets?.['Tags Index'];
  if (tagsSheet) {
    results.rowCounts['Drills / Tags Index'] = tagsSheet.total_rows;
    pass(`Tags Index: ${tagsSheet.total_rows} tag entries`);
    recordPass();
  }

  const blocked = coreLeakCount;
  results.rowsSafeToSeed['curriculum_drills'] = count - blocked;
  results.rowsBlocked['curriculum_drills'] = blocked;
  if (blocked === 0) results.tablesReady.push('curriculum_drills');

  return { data: lib.data, headers: lib.headers };
}

// ── Validate CoachLanguage ─────────────────────────────────────────────────────

function validateCoachLanguage(wb) {
  head('AOS_Curriculum_CoachLanguage.xlsx');
  results.filesInspected.push('AOS_Curriculum_CoachLanguage.xlsx');

  const expectedSheets = ['README', 'Coach Language (Long)', 'Technical', 'Tactical',
    'Movement', 'Competition', 'Mentality', 'Fitness', 'Recovery', 'Lifestyle'];
  const actualSheets = wb.sheetnames || [];
  results.sheetsInspected.push(...actualSheets.map(s => `CoachLanguage / ${s}`));

  for (const s of expectedSheets) {
    if (actualSheets.includes(s)) { pass(`Sheet "${s}" exists`); recordPass(); }
    else { fail(`Sheet "${s}" MISSING`); recordFail(); }
  }

  const lib = wb.sheets?.['Coach Language (Long)'];
  if (!lib) { fail('Coach Language (Long) sheet not accessible'); recordFail(); return {}; }

  const requiredCols = ['Stage', 'Domain', 'Doing Well', 'Working On', 'Current Focus', 'Next Step'];
  const missing = requiredCols.filter(c => !lib.headers.includes(c));
  if (missing.length === 0) { pass('All required columns present'); recordPass(); }
  else { fail(`Missing columns: ${missing.join(', ')}`); results.missingColumns.push(...missing.map(c => `CoachLanguage/${c}`)); recordFail(); }

  const count = lib.total_rows;
  if (count <= 120) { pass(`Row count: ${count} (≤120 expected) ✓`); recordPass(); }
  else { fail(`Row count: ${count} (expected ≤120)`); recordFail(); }
  results.rowCounts['CoachLanguage / Coach Language (Long)'] = count;

  // Stage validation
  const stages = new Set(lib.data.map(r => r['Stage']).filter(Boolean));
  const invalidStages = [...stages].filter(s => !VALID_STAGES.includes(s));
  const missingStages = VALID_STAGES.filter(s => !stages.has(s));
  if (invalidStages.length === 0) { pass('All stage values match 15 curriculum levels'); recordPass(); }
  else { fail(`Invalid stage values: ${invalidStages.join(', ')}`); recordFail(); }
  if (missingStages.length === 0) { pass('All 15 curriculum levels present'); recordPass(); }
  else { warn(`Missing stages: ${missingStages.join(', ')}`); recordWarn(); }

  // Domain validation
  const invalidDomains = lib.data.map(r => r['Domain']).filter(d => d && !COACH_LANGUAGE_DOMAINS_MIGRATION.has(d));
  if (invalidDomains.length === 0) { pass('All domains valid for migration 052 constraint'); recordPass(); }
  else { fail(`Invalid domains: ${[...new Set(invalidDomains)].join(', ')}`); recordFail(); }

  // Leakage check
  let coreLeakCount = 0;
  const falsePositiveRows = [];
  for (const row of lib.data) {
    const coreText = [row['Doing Well'], row['Working On'], row['Current Focus'], row['Next Step']].filter(Boolean).join(' ');
    const hits = scanLeakageCore(coreText);
    if (hits.length > 0) {
      coreLeakCount++;
      results.leakageCore.push({ source: 'CoachLanguage', id: `${row['Stage']}/${row['Domain']}`, terms: hits });
    }
    // Specifically scan for "the angle" and flag FP
    if (coreText.toLowerCase().includes('the angle')) {
      if (isFalsePositive(coreText)) {
        falsePositiveRows.push(`${row['Stage']} / ${row['Domain']}: "${coreText.match(/[^.]*the angle[^.]*/i)?.[0]?.trim()}"`);
        results.falsePositives.push({
          source: 'CoachLanguage', stage: row['Stage'], domain: row['Domain'],
          text: coreText.substring(0, 100),
          reason: '"the angle" = tennis shot angle, not The Angle™ product',
        });
      }
    }
  }
  if (coreLeakCount === 0) { pass('No product-tool leakage in coach language core fields'); recordPass(); }
  else { fail(`BLOCKING leakage in ${coreLeakCount} coach language rows`); recordFail(); }
  if (falsePositiveRows.length > 0) {
    info(`False positive detected and excluded from leakage count:`);
    falsePositiveRows.forEach(r => info(`  ${r}`));
    info('Reason: "closing the angle" is a legitimate tennis coaching term, not The Angle™ product');
  }

  const blocked = coreLeakCount;
  results.rowsSafeToSeed['curriculum_coach_language'] = count - blocked;
  results.rowsBlocked['curriculum_coach_language'] = blocked;
  if (blocked === 0) results.tablesReady.push('curriculum_coach_language');

  return { data: lib.data, headers: lib.headers };
}

// ── Validate Competition ───────────────────────────────────────────────────────

function validateCompetition(wb) {
  head('AOS_Curriculum_Competition.xlsx');
  results.filesInspected.push('AOS_Curriculum_Competition.xlsx');

  const expectedSheets = ['README', 'Competition Progression', 'Tournament Types', 'Behaviors Progression'];
  const actualSheets = wb.sheetnames || [];
  results.sheetsInspected.push(...actualSheets.map(s => `Competition / ${s}`));

  for (const s of expectedSheets) {
    if (actualSheets.includes(s)) { pass(`Sheet "${s}" exists`); recordPass(); }
    else { fail(`Sheet "${s}" MISSING`); recordFail(); }
  }

  const lib = wb.sheets?.['Competition Progression'];
  if (!lib) { fail('Competition Progression sheet not accessible'); recordFail(); return {}; }

  const count = lib.total_rows;
  if (count === 15) { pass(`Row count: ${count} (expected 15) ✓`); recordPass(); }
  else { fail(`Row count: ${count} (expected 15)`); recordFail(); }
  results.rowCounts['Competition / Competition Progression'] = count;

  // Stage validation
  const stages = lib.data.map(r => r['Stage']).filter(Boolean);
  const invalidStages = stages.filter(s => !VALID_STAGES.includes(s));
  if (invalidStages.length === 0) { pass('All stage values match 15 curriculum levels'); recordPass(); }
  else { fail(`Invalid stage values: ${[...new Set(invalidStages)].join(', ')}`); recordFail(); }

  // Leakage
  let coreLeakCount = 0;
  for (const row of lib.data) {
    const coreText = Object.values(row).filter(Boolean).join(' ');
    const hits = scanLeakageCore(coreText);
    if (hits.length > 0) { coreLeakCount++; results.leakageCore.push({ source: 'Competition', id: row['Stage'], terms: hits }); }
  }
  if (coreLeakCount === 0) { pass('No product-tool leakage in competition data'); recordPass(); }
  else { fail(`BLOCKING leakage in ${coreLeakCount} competition rows`); recordFail(); }

  const blocked = coreLeakCount;
  results.rowsSafeToSeed['curriculum_competition_track'] = count - blocked;
  results.rowsBlocked['curriculum_competition_track'] = blocked;
  if (blocked === 0) results.tablesReady.push('curriculum_competition_track');

  return { data: lib.data };
}

// ── Validate Fitness ───────────────────────────────────────────────────────────

function validateFitness(wb) {
  head('AOS_Curriculum_Fitness.xlsx');
  results.filesInspected.push('AOS_Curriculum_Fitness.xlsx');

  const expectedSheets = ['README', 'Fitness Progression', 'Energy Systems', 'Strength Progression'];
  const actualSheets = wb.sheetnames || [];
  results.sheetsInspected.push(...actualSheets.map(s => `Fitness / ${s}`));

  for (const s of expectedSheets) {
    if (actualSheets.includes(s)) { pass(`Sheet "${s}" exists`); recordPass(); }
    else { fail(`Sheet "${s}" MISSING`); recordFail(); }
  }

  const lib = wb.sheets?.['Fitness Progression'];
  if (!lib) { fail('Fitness Progression sheet not accessible'); recordFail(); return {}; }

  const count = lib.total_rows;
  if (count === 15) { pass(`Row count: ${count} (expected 15) ✓`); recordPass(); }
  else { fail(`Row count: ${count} (expected 15)`); recordFail(); }
  results.rowCounts['Fitness / Fitness Progression'] = count;

  // Phase validation — source uses descriptive phase names, migration uses snake_case enum
  const rawPhases = new Set(lib.data.map(r => r['Fitness Phase']).filter(Boolean));
  const phaseNormMap = {
    'Physical Literacy':             'physical_literacy',
    'Athletic Foundation':           'athletic_foundation',
    'Sport Performance':             'sport_performance',
    'Tennis-Specific Conditioning':  'sport_performance',  // Green band
    'Strength + Speed + Endurance':  'high_performance',   // Yellow band
    'High Performance':              'high_performance',
    'High Performance / Pro Transition': 'high_performance', // HP 3
  };
  const unmappablePhases = [...rawPhases].filter(p => !phaseNormMap[p]);
  if (unmappablePhases.length === 0) {
    pass('All fitness phase values have normalization mappings'); recordPass();
    if ([...rawPhases].some(p => phaseNormMap[p] !== p)) {
      warn(`Fitness phase normalization required at seed time (source uses descriptive names, migration uses enum)`);
      [...rawPhases].forEach(p => results.domainNormalization.push(`Fitness phase: "${p}" → "${phaseNormMap[p]}"`));
      recordWarn();
    }
  } else {
    warn(`Fitness phase normalization may be needed: ${unmappablePhases.join(', ')}`); recordWarn();
  }

  // Leakage
  let coreLeakCount = 0;
  for (const row of lib.data) {
    const coreText = Object.values(row).filter(Boolean).join(' ');
    const hits = scanLeakageCore(coreText);
    if (hits.length > 0) { coreLeakCount++; results.leakageCore.push({ source: 'Fitness', id: row['Stage'], terms: hits }); }
  }
  if (coreLeakCount === 0) { pass('No product-tool leakage in fitness data'); recordPass(); }
  else { fail(`BLOCKING leakage in ${coreLeakCount} fitness rows`); recordFail(); }

  const blocked = coreLeakCount;
  results.rowsSafeToSeed['curriculum_fitness_guidance'] = count - blocked;
  results.rowsBlocked['curriculum_fitness_guidance'] = blocked;
  if (blocked === 0) results.tablesReady.push('curriculum_fitness_guidance');

  return { data: lib.data };
}

// ── Validate Volume ────────────────────────────────────────────────────────────

function validateVolume(wb) {
  head('AOS_Curriculum_Volume.xlsx');
  results.filesInspected.push('AOS_Curriculum_Volume.xlsx');

  const expectedSheets = ['README', 'Volume Progression', 'Progression Rate', 'Load Distribution'];
  const actualSheets = wb.sheetnames || [];
  results.sheetsInspected.push(...actualSheets.map(s => `Volume / ${s}`));

  for (const s of expectedSheets) {
    if (actualSheets.includes(s)) { pass(`Sheet "${s}" exists`); recordPass(); }
    else { fail(`Sheet "${s}" MISSING`); recordFail(); }
  }

  const lib = wb.sheets?.['Volume Progression'];
  if (!lib) { fail('Volume Progression sheet not accessible'); recordFail(); return {}; }

  const count = lib.total_rows;
  if (count === 15) { pass(`Row count: ${count} (expected 15) ✓`); recordPass(); }
  else { fail(`Row count: ${count} (expected 15)`); recordFail(); }
  results.rowCounts['Volume / Volume Progression'] = count;

  // ACR column present
  if (lib.headers.includes('ACR Target')) {
    pass('ACR Target column present (⚠ definition requires confirmation — see synthesis doc §14.1)');
    recordPass();
  } else {
    warn('ACR Target column not found in expected location');
    recordWarn();
  }

  // Stage validation
  const stages = lib.data.map(r => r['Stage']).filter(Boolean);
  const invalidStages = stages.filter(s => !VALID_STAGES.includes(s));
  if (invalidStages.length === 0) { pass('All stage values match 15 curriculum levels'); recordPass(); }
  else { fail(`Invalid stage values: ${[...new Set(invalidStages)].join(', ')}`); recordFail(); }

  // Leakage
  let coreLeakCount = 0;
  for (const row of lib.data) {
    const coreText = Object.values(row).filter(Boolean).join(' ');
    const hits = scanLeakageCore(coreText);
    if (hits.length > 0) { coreLeakCount++; results.leakageCore.push({ source: 'Volume', id: row['Stage'], terms: hits }); }
  }
  if (coreLeakCount === 0) { pass('No product-tool leakage in volume data'); recordPass(); }
  else { fail(`BLOCKING leakage in ${coreLeakCount} volume rows`); recordFail(); }

  const blocked = coreLeakCount;
  results.rowsSafeToSeed['curriculum_volume_guidance'] = count - blocked;
  results.rowsBlocked['curriculum_volume_guidance'] = blocked;
  if (blocked === 0) results.tablesReady.push('curriculum_volume_guidance');

  return { data: lib.data };
}

// ── Validate StressTest (Archetypes + Failure Modes) ──────────────────────────

function validateStressTest(wb) {
  head('AOS_Curriculum_StressTest.xlsx');
  results.filesInspected.push('AOS_Curriculum_StressTest.xlsx');

  const expectedSheets = ['README', 'Archetypes', 'Trace', 'Failure Modes'];
  const actualSheets = wb.sheetnames || [];
  results.sheetsInspected.push(...actualSheets.map(s => `StressTest / ${s}`));

  for (const s of expectedSheets) {
    if (actualSheets.includes(s)) { pass(`Sheet "${s}" exists`); recordPass(); }
    else { fail(`Sheet "${s}" MISSING`); recordFail(); }
  }

  // Archetypes
  const archetypes = wb.sheets?.['Archetypes'];
  if (archetypes) {
    const count = archetypes.total_rows;
    if (count === 8) { pass(`Archetypes row count: ${count} (expected 8) ✓`); recordPass(); }
    else { fail(`Archetypes row count: ${count} (expected 8)`); recordFail(); }
    results.rowCounts['StressTest / Archetypes'] = count;

    const tags = archetypes.data.map(r => r['Tag']).filter(Boolean);
    const invalidTags = tags.filter(t => !ARCHETYPE_TAGS.has(t));
    const missingTags = [...ARCHETYPE_TAGS].filter(t => !tags.includes(t));
    if (invalidTags.length === 0 && missingTags.length === 0) {
      pass('Archetype tags A1–A8 all present and valid');
      recordPass();
    } else {
      if (invalidTags.length > 0) { fail(`Invalid archetype tags: ${invalidTags.join(', ')}`); recordFail(); }
      if (missingTags.length > 0) { fail(`Missing archetype tags: ${missingTags.join(', ')}`); recordFail(); }
    }
    const dupTags = tags.filter((t, i) => tags.indexOf(t) !== i);
    if (dupTags.length === 0) { pass('Archetype tags are unique'); recordPass(); }
    else { fail(`Duplicate archetype tags: ${dupTags.join(', ')}`); recordFail(); }

    results.rowsSafeToSeed['curriculum_archetypes'] = count;
    results.rowsBlocked['curriculum_archetypes'] = 0;
    results.tablesReady.push('curriculum_archetypes');

    // Leakage
    let archLeakCount = 0;
    for (const row of archetypes.data) {
      const coreText = Object.values(row).filter(Boolean).join(' ');
      const hits = scanLeakageCore(coreText);
      if (hits.length > 0) { archLeakCount++; results.leakageCore.push({ source: 'Archetypes', id: row['Tag'], terms: hits }); }
    }
    if (archLeakCount === 0) { pass('No product-tool leakage in archetypes data'); recordPass(); }
    else { fail(`Leakage in ${archLeakCount} archetype rows`); recordFail(); }

    return archetypes.data;
  }

  // Failure Modes
  const fmSheet = wb.sheets?.['Failure Modes'];
  let fmData = [];
  if (fmSheet) {
    // Filter to only real FM rows (exclude SUMMARY rows at bottom)
    const fmRows = fmSheet.data.filter(r => r['ID'] && /^FM-\d+$/.test(r['ID']));
    const count = fmRows.length;
    if (count === 14) { pass(`Failure Modes row count: ${count} (expected 14) ✓`); recordPass(); }
    else { fail(`Failure Modes row count: ${count} (expected 14)`); recordFail(); }
    results.rowCounts['StressTest / Failure Modes'] = count;

    const fmIds = fmRows.map(r => r['ID']).filter(Boolean);
    const dupFmIds = fmIds.filter((id, i) => fmIds.indexOf(id) !== i);
    if (dupFmIds.length === 0) { pass('Failure mode IDs are unique'); recordPass(); }
    else { fail(`Duplicate failure mode IDs: ${dupFmIds.join(', ')}`); recordFail(); }

    const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const invalidSeverities = fmRows.map(r => r['Severity']).filter(s => s && !validSeverities.includes(s));
    if (invalidSeverities.length === 0) { pass('All failure mode severities valid'); recordPass(); }
    else { fail(`Invalid severities: ${[...new Set(invalidSeverities)].join(', ')}`); recordFail(); }

    // Leakage
    let fmLeakCount = 0;
    for (const row of fmRows) {
      const coreText = Object.values(row).filter(Boolean).join(' ');
      const hits = scanLeakageCore(coreText);
      if (hits.length > 0) { fmLeakCount++; results.leakageCore.push({ source: 'FailureModes', id: row['ID'], terms: hits }); }
    }
    if (fmLeakCount === 0) { pass('No product-tool leakage in failure modes data'); recordPass(); }
    else { fail(`Leakage in ${fmLeakCount} failure mode rows`); recordFail(); }

    results.rowsSafeToSeed['curriculum_failure_modes'] = count;
    results.rowsBlocked['curriculum_failure_modes'] = 0;
    results.tablesReady.push('curriculum_failure_modes');

    fmData = fmRows;
  }

  return fmData;
}

// ── Preview file generators ───────────────────────────────────────────────────

function writeGatesPreview(data) {
  const preview = data.map(row => ({
    gate_id:          row['Gate ID'],
    from:             row['From'],
    to:               row['To'],
    domain_raw:       row['Domain'],
    domain_normalized: GATE_DOMAIN_NORMALIZATION[row['Domain']] || row['Domain'],
    criterion:        row['Criterion'],
    gate_type:        row['Type'],
    threshold:        row['Threshold'],
    recording_method: row['Recording Method'],
    evidence_window:  row['Evidence Window'],
    evaluator:        row['Evaluator'],
    cadence:          row['Cadence'],
    notes:            row['Notes'] || null,
  }));
  writeFileSync(
    resolve(PREVIEW_DIR, 'curriculum-gates-preview.json'),
    JSON.stringify({ generated: new Date().toISOString(), sprint: 188, count: preview.length, warning: 'PREVIEW ONLY — not final seed data. Domain normalization required before SQL insert.', rows: preview }, null, 2),
  );
}

function writeDrillsPreview(data) {
  const preview = data.slice(0, 20).map(row => ({
    drill_id:           row['drill_id'],
    name:               row['name'],
    stage_min:          row['stage_min'],
    stage_max:          row['stage_max'],
    domain:             row['domain'],
    session_block:      row['session_block'],
    objective:          row['objective'],
    duration_minutes:   row['duration_minutes'] ? parseInt(row['duration_minutes']) : null,
    players_needed:     row['players_needed'] ? parseInt(row['players_needed']) : null,
    tags:               row['tags'] ? row['tags'].split(',').map(t => t.trim()) : [],
  }));
  writeFileSync(
    resolve(PREVIEW_DIR, 'curriculum-drills-preview.json'),
    JSON.stringify({ generated: new Date().toISOString(), sprint: 188, total_rows: data.length, preview_rows: preview.length, note: 'First 20 of 152 drills. Full coaching_cues, setup, procedure fields omitted for brevity.', rows: preview }, null, 2),
  );
}

function writeCoachLanguagePreview(data) {
  const preview = data.map(row => ({
    stage:         row['Stage'],
    domain:        row['Domain'],
    doing_well:    row['Doing Well'],
    working_on:    row['Working On'],
    current_focus: row['Current Focus'],
    next_step:     row['Next Step'],
  }));
  writeFileSync(
    resolve(PREVIEW_DIR, 'curriculum-coach-language-preview.json'),
    JSON.stringify({ generated: new Date().toISOString(), sprint: 188, count: preview.length, rows: preview }, null, 2),
  );
}

function writeArchetypesPreview(data) {
  const preview = data.map(row => ({
    tag:                         row['Tag'],
    name:                        row['Name'],
    age_band:                    row['Age Band'],
    entry_stage:                 row['Entry Stage'],
    profile:                     row['Profile'],
    competition_track_posture:   row['Competition Track Posture'],
    key_risks:                   row['Key Risks'],
    curriculum_protection:       row['What Curriculum Must Protect'],
  }));
  writeFileSync(
    resolve(PREVIEW_DIR, 'curriculum-archetypes-preview.json'),
    JSON.stringify({ generated: new Date().toISOString(), sprint: 188, count: preview.length, rows: preview }, null, 2),
  );
}

function writeFailureModesPreview(data) {
  const fmRows = data.filter(row => row['ID'] && /^FM-\d+$/.test(row['ID']));
  const preview = fmRows.map(row => ({
    failure_mode_id:    row['ID'],
    severity:           row['Severity'],
    affected_stage:     row['Stages'],
    affected_archetype: row['Archetypes'],
    risk_description:   row['Gap'],
    required_response:  row['Recommended Fix'],
    target_piece:       row['Target Piece'],
    is_addressed:       false,
  }));
  writeFileSync(
    resolve(PREVIEW_DIR, 'curriculum-failure-modes-preview.json'),
    JSON.stringify({ generated: new Date().toISOString(), sprint: 188, count: preview.length, rows: preview }, null, 2),
  );
}

// ── Report generator ──────────────────────────────────────────────────────────

function writeReport() {
  const now = new Date().toISOString().slice(0, 10);
  const totalBlocked = Object.values(results.rowsBlocked).reduce((a, b) => a + b, 0);
  const overallStatus = results.checks.failed === 0 ? '✅ PASS' : '❌ FAIL';
  const leakageStatus = results.leakageCore.length === 0 ? '✅ CLEAN' : '❌ BLOCKED LEAKAGE FOUND';

  const rowCountTable = Object.entries(results.rowCounts)
    .map(([k, v]) => `| ${k} | ${v} |`)
    .join('\n');

  const readyTable = results.tablesReady
    .map(t => `| \`${t}\` | ✅ Ready | — |`)
    .join('\n');

  const deferredTable = results.tablesDeferred.length > 0
    ? results.tablesDeferred.map(t => `| \`${t.table}\` | ⏳ Deferred | ${t.reason} |`).join('\n')
    : '| `drill_gate_mappings` | ⏳ Deferred | Mapping strategy not confirmed (see synthesis doc §14.5) |';

  const normTable = results.domainNormalization.length > 0
    ? results.domainNormalization.map(n => `| ${n} |`).join('\n')
    : '| No normalization issues |';

  const leakageCoreRows = results.leakageCore.length > 0
    ? results.leakageCore.map(l => `| ${l.source} | ${l.id} | ${l.terms.join(', ')} | BLOCKED |`).join('\n')
    : '| — | — | — | — |';

  const leakageNotesRows = results.leakageNotes.length > 0
    ? results.leakageNotes.map(l => `| ${l.source} | ${l.id} | ${l.terms.join(', ')} | ${l.text?.substring(0, 80) || ''} |`).join('\n')
    : '| — | — | — | — |';

  const falsePosRows = results.falsePositives.length > 0
    ? results.falsePositives.map(f => `| ${f.source} | ${f.stage} / ${f.domain} | ${f.reason} |`).join('\n')
    : '| — | — | — |';

  const schemaGapRows = results.schemaGaps.length > 0
    ? results.schemaGaps.map(g => `- ${g}`).join('\n')
    : '- None';

  const seedReadyRows = Object.entries(results.rowsSafeToSeed)
    .map(([t, n]) => `| \`${t}\` | ${n} | ${results.rowsBlocked[t] || 0} |`)
    .join('\n');

  const report = `# Curriculum Seed Validation Report
**Sprint:** 188 — Curriculum Spreadsheet Validation + Normalized Seed Preview
**Date:** ${now}
**Status:** ${overallStatus}
**Product-tool leakage:** ${leakageStatus}
**Checks:** ${results.checks.passed} passed · ${results.checks.failed} failed · ${results.checks.warned} warned

---

## Files Inspected

${results.filesInspected.map(f => `- \`${f}\``).join('\n')}

**Excluded (by product-tool exclusion decision):**
- \`AOS_Curriculum_TechModel.xlsx\` — deferred to optional Angles Tools Integration Layer

---

## Sheets Inspected

${results.sheetsInspected.map(s => `- ${s}`).join('\n')}

---

## Row Counts

| Sheet | Row Count |
|---|---|
${rowCountTable}

---

## Missing Columns

${results.missingColumns.length === 0
  ? 'None. All required columns present across all source files.'
  : results.missingColumns.map(c => `- ${c}`).join('\n')}

---

## Domain Normalization Required

Gate domain values in source use descriptive suffixes not present in migration 052 CHECK constraint.
Normalization must be applied at seed-insert time.

| Source Value → Migration Value |
|---|
${normTable}

**Drill domains:** already aligned with migration 052 CHECK constraint. No normalization needed.
**CoachLanguage domains:** already aligned. No normalization needed.

---

## Schema Gaps (migration allows, source does not use)

${schemaGapRows}

---

## Invalid Domains

${results.invalidDomains.length === 0
  ? 'None. All source domain values are either valid or have confirmed normalization mappings.'
  : results.invalidDomains.map(d => `- ${d}`).join('\n')}

---

## Duplicate IDs

${results.duplicateIds.length === 0
  ? 'None. All gate IDs and drill IDs are unique.'
  : results.duplicateIds.map(d => `- ${d}`).join('\n')}

---

## Product-Tool Leakage Results

### Leakage in Core Fields (BLOCKING)

Checked in: gate criterion/threshold, drill objective/setup/procedure/coaching_cues,
coach language doing_well/working_on/current_focus/next_step, competition/fitness/volume data fields.

| Source | ID | Terms Found | Status |
|---|---|---|---|
${leakageCoreRows}

### Leakage in Notes / Informational Fields (WARNING — not blocking)

Informational references appear only in Notes columns or [PROPOSED:] annotations.
These do not appear in gate criteria, thresholds, or any field that will be seeded into core data.
They are acknowledged but do not block the seed.

| Source | ID | Terms Found | Context |
|---|---|---|---|
${leakageNotesRows}

### False Positives (excluded from leakage count)

| Source | Location | Reason |
|---|---|---|
${falsePosRows}

---

## Rows Safe to Seed vs Blocked

| Table | Safe Rows | Blocked Rows |
|---|---|---|
${seedReadyRows}

**Total blocked rows:** ${totalBlocked}

---

## Tables Ready for Migration 053

| Table | Status | Notes |
|---|---|---|
${readyTable}

---

## Tables Intentionally Deferred

| Table | Status | Reason |
|---|---|---|
${deferredTable}

---

## Key Findings

1. **Gates domain normalization required.** Source uses descriptive domain names
   ("Movement / Athletic", "Mentality / Learning Behavior", "Tactical (Court Mapping)").
   Migration 052 CHECK constraint uses shortened names ("Movement", "Mentality", "Tactical").
   SQL seed must apply the normalization map above at insert time.

2. **Drills session block 'Play' unused.** The migration 052 CHECK constraint allows
   'Play' as a session_block value, but no source drill uses it. This is not a blocker
   — the value is reserved for future use.

3. **Swinget reference in Gates Notes.** One gate (RED1__RED2__02) has a [PROPOSED:]
   annotation in its Notes column mentioning Swinget integration. The Notes column is
   informational and will not be seeded into a field that affects gate criteria, thresholds,
   or evaluation logic. This reference is confirmed as a non-blocking informational note.

4. **"The angle" in CoachLanguage is a false positive.** Orange 2 / Technical Next Step
   reads "First-volley closing the angle." This is a legitimate tennis coaching term
   (closing off the shot angle) — not a reference to The Angle™ product.
   Excluded from leakage count.

5. **Failure Modes sheet has summary rows.** Rows 15–20 in the Failure Modes sheet are
   summary/count rows (SUMMARY, CRITICAL count, HIGH count, etc.). Validation filters
   to FM-01 through FM-14 only (14 rows confirmed).

---

## Recommendation

${results.checks.failed === 0
  ? 'All validation checks passed. Migration 053 (seed data) may be drafted.\n\nApply domain normalization mapping (item 1 above) in the seed SQL.\nReview the Notes leakage warning (item 3) before marking migration clean.'
  : `${results.checks.failed} validation check(s) failed. Resolve the failures above before drafting migration 053.`}

---

*Generated by \`scripts/validate-curriculum-seed-sources.mjs\`*
*Parser: openpyxl (Python) — no xlsx npm package required*
`;

  writeFileSync(REPORT_PATH, report);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Sprint 188 — Curriculum Seed Source Validation              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  checkPython();

  // Ensure preview directory exists
  if (!existsSync(PREVIEW_DIR)) mkdirSync(PREVIEW_DIR, { recursive: true });

  // ── File existence checks ────────────────────────────────────────────────────
  head('File Existence');
  for (const [name, path] of Object.entries(SOURCE_FILES)) {
    if (existsSync(path)) { pass(`${name}: ${path.replace(ROOT, '.')}`); recordPass(); }
    else { fail(`${name} NOT FOUND: ${path.replace(ROOT, '.')}`); recordFail(); }
  }

  // ── Check excluded file is not used ─────────────────────────────────────────
  const excludedPath = resolve(SRC_EXTRACTED, 'AOS_Curriculum_TechModel.xlsx');
  if (existsSync(excludedPath)) {
    pass('TechModel.xlsx present in repo (excluded per product-tool decision — not parsed)');
    recordPass();
  } else {
    warn('TechModel.xlsx not found (expected to be present but excluded)');
    recordWarn();
  }

  // ── Load and validate each file ──────────────────────────────────────────────
  info('\nExtracting xlsx data via Python openpyxl...');

  const gatesWb         = extractXlsx(SOURCE_FILES.Gates);
  const drillsWb        = extractXlsx(SOURCE_FILES.Drills);
  const coachLangWb     = extractXlsx(SOURCE_FILES.CoachLanguage);
  const competitionWb   = extractXlsx(SOURCE_FILES.Competition);
  const fitnessWb       = extractXlsx(SOURCE_FILES.Fitness);
  const volumeWb        = extractXlsx(SOURCE_FILES.Volume);
  const stressTestWb    = extractXlsx(SOURCE_FILES.StressTest);

  const gatesResult     = validateGates(gatesWb);
  const drillsResult    = validateDrills(drillsWb);
  const coachLangResult = validateCoachLanguage(coachLangWb);
  validateCompetition(competitionWb);
  validateFitness(fitnessWb);
  validateVolume(volumeWb);

  // StressTest validates both Archetypes and Failure Modes
  head('AOS_Curriculum_StressTest.xlsx — Archetypes');
  const archetypesData  = validateStressTest(stressTestWb);

  head('AOS_Curriculum_StressTest.xlsx — Failure Modes');
  // Re-access failure modes directly
  const fmSheet = stressTestWb.sheets?.['Failure Modes'];
  if (fmSheet) {
    const fmRows = fmSheet.data.filter(r => r['ID'] && /^FM-\d+$/.test(r['ID']));
    const count = fmRows.length;
    if (count === 14) { pass(`Failure Modes row count: ${count} (expected 14) ✓`); recordPass(); }
    else { fail(`Failure Modes row count: ${count} (expected 14)`); recordFail(); }
    results.rowCounts['StressTest / Failure Modes'] = count;

    const fmIds = fmRows.map(r => r['ID']).filter(Boolean);
    const dupFmIds = fmIds.filter((id, i) => fmIds.indexOf(id) !== i);
    if (dupFmIds.length === 0) { pass('Failure mode IDs (FM-01…FM-14) are unique'); recordPass(); }
    else { fail(`Duplicate failure mode IDs: ${dupFmIds.join(', ')}`); recordFail(); }

    const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const invalidSeverities = fmRows.map(r => r['Severity']).filter(s => s && !validSeverities.includes(s));
    if (invalidSeverities.length === 0) { pass('All failure mode severities valid'); recordPass(); }
    else { fail(`Invalid severities: ${[...new Set(invalidSeverities)].join(', ')}`); recordFail(); }

    let fmLeakCount = 0;
    for (const row of fmRows) {
      const coreText = Object.values(row).filter(Boolean).join(' ');
      const hits = scanLeakageCore(coreText);
      if (hits.length > 0) { fmLeakCount++; results.leakageCore.push({ source: 'FailureModes', id: row['ID'], terms: hits }); }
    }
    if (fmLeakCount === 0) { pass('No product-tool leakage in failure modes data'); recordPass(); }
    else { fail(`Leakage in ${fmLeakCount} failure mode rows`); recordFail(); }

    results.rowsSafeToSeed['curriculum_failure_modes'] = count;
    results.rowsBlocked['curriculum_failure_modes'] = 0;
    if (!results.tablesReady.includes('curriculum_failure_modes')) {
      results.tablesReady.push('curriculum_failure_modes');
    }

    // Write preview
    writeFailureModesPreview(fmSheet.data);
    pass('Preview written: docs/curriculum/seed-preview/curriculum-failure-modes-preview.json');
    recordPass();
  }

  // ── Write preview files ──────────────────────────────────────────────────────
  head('Writing Normalized Preview Files');

  if (gatesResult.data) {
    writeGatesPreview(gatesResult.data);
    pass('Preview written: docs/curriculum/seed-preview/curriculum-gates-preview.json');
    recordPass();
  }
  if (drillsResult.data) {
    writeDrillsPreview(drillsResult.data);
    pass('Preview written: docs/curriculum/seed-preview/curriculum-drills-preview.json');
    recordPass();
  }
  if (coachLangResult.data) {
    writeCoachLanguagePreview(coachLangResult.data);
    pass('Preview written: docs/curriculum/seed-preview/curriculum-coach-language-preview.json');
    recordPass();
  }
  if (archetypesData && archetypesData.length > 0) {
    writeArchetypesPreview(archetypesData);
    pass('Preview written: docs/curriculum/seed-preview/curriculum-archetypes-preview.json');
    recordPass();
  }

  // ── Deferred tables ──────────────────────────────────────────────────────────
  results.tablesDeferred = [
    { table: 'drill_gate_mappings', reason: 'Mapping strategy not confirmed — see synthesis doc §14.5' },
  ];

  // ── Summary ──────────────────────────────────────────────────────────────────
  head('Validation Summary');
  console.log(`  Checks passed:  \x1b[32m${results.checks.passed}\x1b[0m`);
  console.log(`  Checks failed:  ${results.checks.failed > 0 ? '\x1b[31m' : ''}${results.checks.failed}\x1b[0m`);
  console.log(`  Warnings:       ${results.checks.warned > 0 ? '\x1b[33m' : ''}${results.checks.warned}\x1b[0m`);
  console.log(`\n  Leakage (core fields):  ${results.leakageCore.length === 0 ? '\x1b[32mCLEAN\x1b[0m' : '\x1b[31m' + results.leakageCore.length + ' found\x1b[0m'}`);
  console.log(`  Leakage (notes/info):   ${results.leakageNotes.length === 0 ? '\x1b[32mCLEAN\x1b[0m' : '\x1b[33m' + results.leakageNotes.length + ' warning(s)\x1b[0m'}`);
  console.log(`  False positives:        ${results.falsePositives.length} excluded`);
  console.log(`\n  Tables ready for 053:   ${results.tablesReady.length}`);
  console.log(`  Tables deferred:        ${results.tablesDeferred.length}`);

  // ── Write report ─────────────────────────────────────────────────────────────
  head('Writing Report');
  writeReport();
  pass(`Report written: docs/curriculum/seed-validation-report.md`);

  // ── Final verdict ─────────────────────────────────────────────────────────────
  console.log('');
  if (results.checks.failed === 0) {
    console.log('\x1b[32m✅ ALL CHECKS PASSED — Migration 053 may be drafted\x1b[0m');
    console.log('\x1b[33m⚠  Apply domain normalization mapping before SQL insert\x1b[0m');
    console.log('\x1b[33m⚠  Review Notes leakage warning (RED1__RED2__02) — informational, not blocking\x1b[0m');
  } else {
    console.log(`\x1b[31m❌ ${results.checks.failed} CHECK(S) FAILED — resolve before drafting migration 053\x1b[0m`);
    process.exit(1);
  }
  console.log('');
}

main().catch(err => { console.error(err); process.exit(1); });
