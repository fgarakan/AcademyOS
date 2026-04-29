#!/usr/bin/env node
/**
 * Exercise Library — Dry-Run Inspector + Live Importer
 * Reads data/airtable-import/Exercise Library-Grid view.csv,
 * transforms and validates every row, and either prints what would be
 * inserted (dry-run) or inserts valid rows into the exercises table (live).
 *
 * DEFAULT MODE: dry-run — reads and validates only, no writes.
 *
 * Usage:
 *   node import-exercises.js                              # dry-run (default)
 *   node import-exercises.js --live                       # blocked (confirm flag required)
 *   node import-exercises.js --live --confirm-live-import # live insert
 *
 * Required env vars for live mode:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Mapping decisions (confirmed 2026-04-29):
 *   Agility/Speed/Strength → fitness enum; original kept as tag
 *   Recovery              → cool_down enum; "recovery" kept as tag
 *   Technical/Movement    → direct enum match
 *   Subcategory           → stored raw in subcategory TEXT (age ranges)
 *   Sets and reps         → instructions TEXT
 *   level_range           → null (age→level mapping deferred)
 *   Leg Swings (line 72)  → flagged and skipped (missing category + duration)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// Argument parsing
// ─────────────────────────────────────────────────────────────────────────────

const IS_LIVE    = process.argv.includes('--live');
const IS_CONFIRM = process.argv.includes('--confirm-live-import');

// --live without --confirm-live-import: block immediately
if (IS_LIVE && !IS_CONFIRM) {
  console.error('ERROR: Refusing live import without --confirm-live-import');
  console.error('Re-run with: --live --confirm-live-import');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CSV_PATH    = path.resolve(__dirname, 'Exercise Library-Grid view.csv');
const REPORT_DIR  = path.resolve(__dirname, 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'exercise-import-dry-run-report.json');
const ACADEMY_ID  = '00000000-0000-0000-0000-000000000001';
const IMPORT_BATCH_TAG = 'import_batch:airtable_exercise_library_2026_04_29';

// ─────────────────────────────────────────────────────────────────────────────
// Category normalization
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_ENUM = {
  agility:   'fitness',
  speed:     'fitness',
  strength:  'fitness',
  technical: 'technical',
  movement:  'movement',
  recovery:  'cool_down',
};

// Preserve original label as a tag when collapsing to a shared enum value
const CATEGORY_PRESERVE_TAG = new Set(['agility', 'speed', 'strength', 'recovery']);

// ─────────────────────────────────────────────────────────────────────────────
// CSV parser  (handles double-quoted fields containing commas)
// ─────────────────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const fields = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQ = !inQ; }
    } else if (c === ',' && !inQ) {
      fields.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  fields.push(cur.trim());
  return fields;
}

// ─────────────────────────────────────────────────────────────────────────────
// Field parsers
// ─────────────────────────────────────────────────────────────────────────────

function parseDuration(raw) {
  const m = (raw || '').match(/^(\d+)\s*min$/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n > 0 ? n : null;
}

function parseEquipment(raw) {
  const s = (raw || '').trim();
  if (!s || s.toLowerCase() === 'none') return null;
  return [s];
}

function buildTags(categoryKey, difficultyRaw) {
  const tags = [];
  if (CATEGORY_PRESERVE_TAG.has(categoryKey)) tags.push(categoryKey);
  if (difficultyRaw) tags.push(`difficulty:${difficultyRaw.toLowerCase()}`);
  return tags.length > 0 ? tags : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Column indices  (0-based, matching CSV header order)
// ─────────────────────────────────────────────────────────────────────────────

const COL = {
  EXERCISE_ID:    0,  // always empty in this export — discarded
  NAME:           1,
  CATEGORY:       2,
  SUBCATEGORY:    3,
  DURATION:       4,
  DESCRIPTION:    5,
  COACHING_NOTES: 6,
  SETS_REPS:      7,
  DIFFICULTY:     8,
  EQUIPMENT:      9,
  VIDEO_URL:      10,
  STATUS:         11,
};

// ─────────────────────────────────────────────────────────────────────────────
// Row transform  (read + validate only — no database interaction)
// Returns categoryKey so main() can count normalization stats.
// ─────────────────────────────────────────────────────────────────────────────

function transformRow(fields, csvLineNum) {
  const name        = (fields[COL.NAME]           || '').trim();
  const rawCategory = (fields[COL.CATEGORY]       || '').trim();
  const rawDuration = (fields[COL.DURATION]       || '').trim();
  const subcategory = (fields[COL.SUBCATEGORY]    || '').trim() || null;
  const description = (fields[COL.DESCRIPTION]    || '').trim() || null;
  const coachPts    = (fields[COL.COACHING_NOTES] || '').trim() || null;
  const instructions= (fields[COL.SETS_REPS]      || '').trim() || null;
  const difficulty  = (fields[COL.DIFFICULTY]     || '').trim();
  const rawEquip    = (fields[COL.EQUIPMENT]      || '').trim();
  const videoUrl    = (fields[COL.VIDEO_URL]      || '').trim() || null;
  const status      = (fields[COL.STATUS]         || '').trim();

  const errs = [];

  if (!name) errs.push('missing Exercise Name');

  const categoryKey = rawCategory.toLowerCase();
  const category    = CATEGORY_ENUM[categoryKey];
  if (name && !category) errs.push(`unknown Category "${rawCategory}"`);

  const durationMin = parseDuration(rawDuration);
  if (name && !durationMin) errs.push(`unparseable Duration "${rawDuration}"`);

  // record is the shape that WOULD be inserted
  const record = errs.length === 0 ? {
    academy_id:      ACADEMY_ID,
    name,
    category,
    subcategory,
    duration_min:    durationMin,
    description,
    coaching_points: coachPts,
    instructions,
    equipment:       parseEquipment(rawEquip),
    tags:            buildTags(categoryKey, difficulty),
    video_url:       videoUrl,
    is_active:       status === 'Approved',
    level_range:     null,
  } : null;

  return { csvLineNum, name: name || '(empty)', errs, record, categoryKey };
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV loading + classification (shared by dry-run and live)
// ─────────────────────────────────────────────────────────────────────────────

function loadAndClassify() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`ERROR: CSV not found at ${CSV_PATH}`);
    process.exit(1);
  }

  const rawLines = fs.readFileSync(CSV_PATH, 'utf8').split('\n');
  const headerFields = parseCSVLine(rawLines[0].replace(/\r$/, ''));

  const blankRows = [];
  const ghostRows = [];
  const parsed    = [];

  for (let i = 1; i < rawLines.length; i++) {
    const line = rawLines[i].replace(/\r$/, '');
    if (!line.trim()) continue;

    const fields = parseCSVLine(line);

    if (fields.every(f => !f)) {
      blankRows.push(i + 1);
      continue;
    }

    const hasName       = !!(fields[COL.NAME] || '').trim();
    const onlyStatusSet = !hasName &&
      fields.slice(0, COL.STATUS).every(f => !f) &&
      !!(fields[COL.STATUS] || '').trim();
    if (onlyStatusSet) {
      ghostRows.push(i + 1);
      continue;
    }

    parsed.push(transformRow(fields, i + 1));
  }

  return {
    headerFields,
    blankRows,
    ghostRows,
    parsed,
    valid:   parsed.filter(r => r.errs.length === 0),
    invalid: parsed.filter(r => r.errs.length > 0),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Dry-run mode
// ─────────────────────────────────────────────────────────────────────────────

function runDryRun() {
  const W  = 62;
  const HR = '─'.repeat(W);

  console.log(`\n${'═'.repeat(W)}`);
  console.log(' Academy OS — Exercise Library Dry-Run Inspector');
  console.log(' Mode     : DRY RUN — read and validate only, no writes');
  console.log(` Academy  : ${ACADEMY_ID}`);
  console.log(` CSV      : ${path.basename(CSV_PATH)}`);
  console.log(`${'═'.repeat(W)}\n`);

  const { headerFields, blankRows, ghostRows, parsed, valid, invalid } = loadAndClassify();

  console.log(`Header (${headerFields.length} columns):`);
  headerFields.forEach((h, i) => console.log(`  [${i}] ${h}`));
  console.log('');

  // ── Valid rows ──────────────────────────────────────────────────────────────
  console.log(HR);
  console.log(` VALID ROWS  (${valid.length})`);
  console.log(HR);
  for (const r of valid) {
    const tagStr   = (r.record.tags      || []).join(', ') || '—';
    const equipStr = (r.record.equipment || []).join(', ') || '—';
    const origCat  = (r.record.tags || []).find(t => !t.startsWith('difficulty:')) || r.record.category;
    console.log(`[WOULD INSERT] line ${r.csvLineNum}: "${r.name}"`);
    console.log(`  → category: ${r.record.category}  (csv: ${origCat})  subcategory: ${r.record.subcategory ?? 'null'}`);
    console.log(`    duration: ${r.record.duration_min}min  tags: [${tagStr}]  equipment: [${equipStr}]  active: ${r.record.is_active}`);
  }
  console.log('');

  // ── Skipped rows ────────────────────────────────────────────────────────────
  console.log(HR);
  console.log(` SKIPPED ROWS`);
  console.log(HR);
  for (const r of invalid) {
    console.log(`[SKIP] line ${r.csvLineNum}: "${r.name}" — ${r.errs.join('; ')}`);
  }
  if (blankRows.length > 0) {
    console.log(`[SKIP] ${blankRows.length} blank rows  (lines ${blankRows[0]}–${blankRows[blankRows.length - 1]})`);
  }
  if (ghostRows.length > 0) {
    console.log(`[SKIP] ${ghostRows.length} ghost rows (Status="Approved" only, no name)  (lines ${ghostRows[0]}–${ghostRows[ghostRows.length - 1]})`);
  }
  console.log('');

  // ── Summary ─────────────────────────────────────────────────────────────────
  const totalData = parsed.length + blankRows.length + ghostRows.length;
  console.log(HR);
  console.log(' SUMMARY');
  console.log(HR);
  console.log(`  Total data rows (excl. header) : ${totalData}`);
  console.log(`  Would insert                   : ${valid.length}`);
  console.log(`  Skipped — invalid/incomplete   : ${invalid.length}`);
  console.log(`  Skipped — blank                : ${blankRows.length}`);
  console.log(`  Skipped — ghost (Status only)  : ${ghostRows.length}`);
  console.log('');
  console.log('NO DATA WAS INSERTED.');
  console.log('');

  // ── Category normalization counts ────────────────────────────────────────────
  const rawCatCounts = {};
  for (const r of valid) {
    rawCatCounts[r.categoryKey] = (rawCatCounts[r.categoryKey] || 0) + 1;
  }
  const categoryNormalization = {
    agility_to_fitness:    rawCatCounts['agility']   || 0,
    speed_to_fitness:      rawCatCounts['speed']     || 0,
    strength_to_fitness:   rawCatCounts['strength']  || 0,
    technical_direct:      rawCatCounts['technical'] || 0,
    movement_direct:       rawCatCounts['movement']  || 0,
    recovery_to_cool_down: rawCatCounts['recovery']  || 0,
  };

  // ── CSV duplicate name detection (case-insensitive) ──────────────────────────
  const nameLineMap = new Map();
  for (const r of parsed) {
    if (r.name === '(empty)') continue;
    const key = r.name.toLowerCase();
    if (!nameLineMap.has(key)) nameLineMap.set(key, { name: r.name, csv_lines: [] });
    nameLineMap.get(key).csv_lines.push(r.csvLineNum);
  }
  const csvDuplicateNames = [];
  for (const entry of nameLineMap.values()) {
    if (entry.csv_lines.length > 1) csvDuplicateNames.push(entry);
  }

  // ── Skipped rows for report ───────────────────────────────────────────────────
  const skippedRows = [];
  for (const r of invalid) {
    skippedRows.push({ csv_line: r.csvLineNum, name: r.name, reason: r.errs.join('; ') });
  }
  if (blankRows.length > 0) {
    skippedRows.push({
      csv_line_range: `${blankRows[0]}–${blankRows[blankRows.length - 1]}`,
      reason: 'blank row',
      count: blankRows.length,
    });
  }
  if (ghostRows.length > 0) {
    skippedRows.push({
      csv_line_range: `${ghostRows[0]}–${ghostRows[ghostRows.length - 1]}`,
      reason: 'ghost row (Status only, no name)',
      count: ghostRows.length,
    });
  }

  // ── Write JSON report ────────────────────────────────────────────────────────
  const report = {
    generated_at:          new Date().toISOString(),
    mode:                  'DRY_RUN',
    no_write_confirmation: 'NO DATA WAS INSERTED',
    csv_path:              path.basename(CSV_PATH),
    academy_id:            ACADEMY_ID,
    totals: {
      total_data_rows: totalData,
      would_insert:    valid.length,
      skipped_invalid: invalid.length,
      skipped_blank:   blankRows.length,
      skipped_ghost:   ghostRows.length,
    },
    category_normalization: categoryNormalization,
    csv_duplicate_names:    csvDuplicateNames,
    db_duplicate_check: {
      available: false,
      reason:    'not_run_service_role_not_approved',
    },
    skipped_rows:   skippedRows,
    valid_payloads: valid.map(r => r.record),
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Report → ${path.relative(process.cwd(), REPORT_PATH)}`);
  console.log('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Live import mode
// ─────────────────────────────────────────────────────────────────────────────

async function runLive() {
  const W  = 62;
  const HR = '─'.repeat(W);

  // ── Env var check — must happen before any network call ──────────────────────
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('');
    console.error('ERROR: Live import requires both env vars to be set:');
    if (!supabaseUrl)  console.error('  SUPABASE_URL is missing');
    if (!serviceKey)   console.error('  SUPABASE_SERVICE_ROLE_KEY is missing');
    console.error('');
    console.error('Set them before running:');
    console.error('  SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node import-exercises.js --live --confirm-live-import');
    process.exit(1);
  }

  console.log(`\n${'═'.repeat(W)}`);
  console.log(' Academy OS — Exercise Library LIVE IMPORT');
  console.log(' ┌────────────────────────────────────────────────┐');
  console.log(' │   LIVE IMPORT MODE — WRITES ENABLED            │');
  console.log(' └────────────────────────────────────────────────┘');
  console.log(` Academy  : ${ACADEMY_ID}`);
  console.log(` CSV      : ${path.basename(CSV_PATH)}`);
  console.log(` Batch tag: ${IMPORT_BATCH_TAG}`);
  console.log(`${'═'.repeat(W)}\n`);

  // ── Load and classify CSV ────────────────────────────────────────────────────
  const { blankRows, ghostRows, valid, invalid } = loadAndClassify();

  console.log(HR);
  console.log(` CSV CLASSIFICATION`);
  console.log(HR);
  console.log(`  Valid (passed all checks) : ${valid.length}`);
  console.log(`  Invalid/incomplete        : ${invalid.length}`);
  console.log(`  Blank rows                : ${blankRows.length}`);
  console.log(`  Ghost rows                : ${ghostRows.length}`);
  console.log('');

  for (const r of invalid) {
    console.log(`[SKIP-INVALID] line ${r.csvLineNum}: "${r.name}" — ${r.errs.join('; ')}`);
  }
  if (invalid.length > 0) console.log('');

  // ── Connect to Supabase ──────────────────────────────────────────────────────
  const { createClient } = require('@supabase/supabase-js');
  // Service role key: read from env, never logged
  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ── Fetch existing exercise names for the academy ────────────────────────────
  console.log(HR);
  console.log(` DB DUPLICATE CHECK`);
  console.log(HR);
  console.log('  Fetching existing exercise names from DB...');

  const { data: existingRows, error: fetchError } = await db
    .from('exercises')
    .select('name')
    .eq('academy_id', ACADEMY_ID);

  if (fetchError) {
    console.error(`\nERROR: Failed to fetch existing exercises: ${fetchError.message}`);
    process.exit(1);
  }

  const existingNamesLower = new Set(
    (existingRows || []).map(r => r.name.toLowerCase())
  );
  console.log(`  Found ${existingNamesLower.size} existing exercise(s) in DB`);
  console.log('');

  // ── Deduplicate: partition valid rows into insert vs. skip ───────────────────
  const toInsert  = [];
  const dbSkipped = [];

  for (const r of valid) {
    if (existingNamesLower.has(r.name.toLowerCase())) {
      dbSkipped.push(r);
    } else {
      toInsert.push(r);
    }
  }

  for (const r of dbSkipped) {
    console.log(`[SKIP-DB-DUPLICATE] "${r.name}"`);
  }
  if (dbSkipped.length > 0) console.log('');

  console.log(`  To insert  : ${toInsert.length}`);
  console.log(`  DB dupes   : ${dbSkipped.length}`);
  console.log('');

  if (toInsert.length === 0) {
    console.log('Nothing to insert — all valid rows already exist in DB.');
    console.log('');
    printRollbackSQL();
    return;
  }

  // ── Build payloads: append import batch tag to each row ──────────────────────
  const payloads = toInsert.map(r => {
    const existingTags = r.record.tags || [];
    return {
      ...r.record,
      tags: [...existingTags, IMPORT_BATCH_TAG],
    };
  });

  // ── Insert ───────────────────────────────────────────────────────────────────
  console.log(HR);
  console.log(` INSERTING ${payloads.length} ROW(S)`);
  console.log(HR);

  let insertedCount = 0;
  const insertErrors = [];

  // Insert in batches of 20 to stay well within PostgREST limits
  const BATCH_SIZE = 20;
  for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
    const batch = payloads.slice(i, i + BATCH_SIZE);
    const { data: inserted, error: insertError } = await db
      .from('exercises')
      .insert(batch)
      .select('id, name');

    if (insertError) {
      insertErrors.push({ batchStart: i, message: insertError.message });
      console.error(`  [ERROR] batch starting at index ${i}: ${insertError.message}`);
    } else {
      insertedCount += (inserted || []).length;
      for (const row of (inserted || [])) {
        console.log(`  [INSERTED] "${row.name}"  id: ${row.id}`);
      }
    }
  }

  // ── Final summary ────────────────────────────────────────────────────────────
  console.log('');
  console.log(HR);
  console.log(' LIVE IMPORT SUMMARY');
  console.log(HR);
  console.log(`  Inserted successfully : ${insertedCount}`);
  console.log(`  Skipped — DB duplicate: ${dbSkipped.length}`);
  console.log(`  Skipped — invalid     : ${invalid.length}`);
  console.log(`  Skipped — blank       : ${blankRows.length}`);
  console.log(`  Skipped — ghost       : ${ghostRows.length}`);
  console.log(`  Insert errors         : ${insertErrors.length}`);

  if (insertErrors.length > 0) {
    console.log('');
    console.log('  ERRORS:');
    for (const e of insertErrors) {
      console.log(`    batch@${e.batchStart}: ${e.message}`);
    }
  }

  console.log('');
  printRollbackSQL();
}

// ─────────────────────────────────────────────────────────────────────────────
// Rollback SQL — printed to stdout after live import completes
// ─────────────────────────────────────────────────────────────────────────────

function printRollbackSQL() {
  const W  = 62;
  const HR = '─'.repeat(W);
  console.log(HR);
  console.log(' ROLLBACK SQL (run in Supabase SQL editor to undo import)');
  console.log(HR);
  console.log(`  DELETE FROM exercises`);
  console.log(`  WHERE academy_id = '${ACADEMY_ID}'`);
  console.log(`    AND '${IMPORT_BATCH_TAG}' = ANY(tags);`);
  console.log('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

if (IS_LIVE && IS_CONFIRM) {
  runLive().catch(err => {
    console.error('\nUnhandled error during live import:', err.message || err);
    process.exit(1);
  });
} else {
  runDryRun();
}
