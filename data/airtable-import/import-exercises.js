#!/usr/bin/env node
/**
 * Exercise Library — Dry-Run Inspector
 * Reads data/airtable-import/Exercise Library-Grid view.csv,
 * transforms and validates every row, and prints what would be
 * inserted into the exercises table.
 *
 * THIS SCRIPT NEVER WRITES TO THE DATABASE.
 * No Supabase client. No service-role key. No inserts. Ever.
 *
 * Usage:
 *   node import-exercises.js
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

// Guard: abort immediately if someone passes --live
if (process.argv.includes('--live')) {
  console.error('ERROR: --live is not supported. This script is dry-run only.');
  console.error('Live insert requires explicit approval. Do not add --live.');
  process.exit(1);
}

const CSV_PATH   = path.resolve(__dirname, 'Exercise Library-Grid view.csv');
const ACADEMY_ID = '00000000-0000-0000-0000-000000000001';

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

  // record is the shape that WOULD be inserted — printed only, never sent anywhere
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

  return { csvLineNum, name: name || '(empty)', errs, record };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  const W  = 62;
  const HR = '─'.repeat(W);

  console.log(`\n${'═'.repeat(W)}`);
  console.log(' Academy OS — Exercise Library Dry-Run Inspector');
  console.log(' Mode     : DRY RUN — read and validate only, no writes');
  console.log(` Academy  : ${ACADEMY_ID}`);
  console.log(` CSV      : ${path.basename(CSV_PATH)}`);
  console.log(`${'═'.repeat(W)}\n`);

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`ERROR: CSV not found at ${CSV_PATH}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(CSV_PATH, 'utf8');
  const rawLines   = rawContent.split('\n');

  // Header
  const headerFields = parseCSVLine(rawLines[0].replace(/\r$/, ''));
  console.log(`Header (${headerFields.length} columns):`);
  headerFields.forEach((h, i) => console.log(`  [${i}] ${h}`));
  console.log('');

  // Classify rows
  const blankRows = [];
  const ghostRows = [];
  const parsed    = [];

  for (let i = 1; i < rawLines.length; i++) {
    const line = rawLines[i].replace(/\r$/, '');
    if (!line.trim()) continue;

    const fields = parseCSVLine(line);

    // Blank: every field is empty
    if (fields.every(f => !f)) {
      blankRows.push(i + 1);
      continue;
    }

    // Ghost: only Status is populated, name is empty
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

  const valid   = parsed.filter(r => r.errs.length === 0);
  const invalid = parsed.filter(r => r.errs.length > 0);

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
}

main();
