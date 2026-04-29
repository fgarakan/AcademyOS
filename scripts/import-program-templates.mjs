#!/usr/bin/env node
/**
 * scripts/import-program-templates.mjs
 * Sprint 8 — Program Templates Guarded Live Import
 *
 * Default mode: dry-run only. No database writes. No service role needed.
 * Live mode:    requires --live AND --confirm-live-import. Both flags are mandatory.
 *
 * Usage:
 *   node scripts/import-program-templates.mjs                              # dry-run (safe)
 *   node scripts/import-program-templates.mjs --live                       # ERROR — missing confirm flag
 *   node scripts/import-program-templates.mjs --confirm-live-import        # ERROR — missing --live
 *   node scripts/import-program-templates.mjs --live --confirm-live-import # live import (requires approval)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// ── Constants ─────────────────────────────────────────────────────────────────

const IMPORT_BATCH_TAG = 'import_batch:airtable_program_templates_2026_04_29';
const ACADEMY_ID       = '00000000-0000-0000-0000-000000000001';

// Sprint 7 locked decision: skip TPL-1776243285121, keep TPL-1776288406910
const SKIP_TEMPLATE_IDS = new Set(['TPL-1776243285121']);
const SKIP_REASON_MAP   = new Map([
  ['TPL-1776243285121', {
    reason:    'duplicate_skip',
    canonical: 'TPL-1776288406910',
    note:      'Identical name and Blocks JSON as TPL-1776288406910. Earlier timestamp (4:54am vs 5:26pm). Sprint 7 decision: canonical is the later record.',
  }],
]);

// Sprint 7 locked block type mapping
const BLOCK_TYPE_MAP = {
  'Movement':  'movement',
  'Agility':   'fitness',
  'Speed':     'fitness',
  'Games':     'competition',
  'Cool Down': 'cool_down',
};

const VALID_BLOCK_TYPES = new Set([
  'warm_up', 'technical', 'tactical', 'movement',
  'fitness', 'competition', 'mental', 'cool_down', 'free',
]);

const CSV_PATH     = resolve(ROOT, 'data/airtable-import/Program Templates-Grid view.csv');
const UUID_MAP_PATH = resolve(ROOT, 'data/airtable-import/reports/airtable-rec-id-exercise-map.json');
const REPORT_PATH  = resolve(ROOT, 'data/airtable-import/reports/program-template-live-import-dry-run-report.json');

const SOURCE_FILES = [
  'data/airtable-import/Program Templates-Grid view.csv',
  'data/airtable-import/reports/airtable-rec-id-exercise-map.json',
  'docs/PROGRAM_TEMPLATE_IMPORT_DECISIONS.md',
  'supabase/migrations/006_exercises_templates.sql',
];

// ── CLI arg validation ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const wantsLive = args.includes('--live');
const hasConfirm = args.includes('--confirm-live-import');

if (wantsLive && !hasConfirm) {
  console.error('');
  console.error('ERROR: --live requires --confirm-live-import. Both flags must be passed together.');
  console.error('');
  console.error('  node scripts/import-program-templates.mjs --live --confirm-live-import');
  console.error('');
  process.exit(1);
}

if (hasConfirm && !wantsLive) {
  console.error('');
  console.error('ERROR: --confirm-live-import requires --live. Both flags must be passed together.');
  console.error('');
  console.error('  node scripts/import-program-templates.mjs --live --confirm-live-import');
  console.error('');
  process.exit(1);
}

const LIVE_MODE = wantsLive && hasConfirm;
const DRY_RUN   = !LIVE_MODE;

// ── Env loader (live mode only) ───────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(ROOT, '.env.local');
  try {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key   = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local may not exist — env vars must be set externally
  }
}

if (LIVE_MODE) {
  loadEnv();
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing  = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`\nERROR: Live mode requires env vars: ${missing.join(', ')}\n`);
    process.exit(1);
  }
}

// ── RFC-4180 CSV parser ───────────────────────────────────────────────────────

function parseCSV(content) {
  const rows = [];
  let i = 0;
  const len = content.length;

  while (i < len) {
    const row = [];

    // Parse one row
    while (i < len) {
      if (content[i] === '"') {
        // Quoted field
        i++;
        let field = '';
        while (i < len) {
          if (content[i] === '"') {
            if (content[i + 1] === '"') {
              field += '"';
              i += 2;
            } else {
              i++; // closing quote
              break;
            }
          } else {
            field += content[i++];
          }
        }
        row.push(field);
      } else {
        // Unquoted field
        let field = '';
        while (i < len && content[i] !== ',' && content[i] !== '\n' && content[i] !== '\r') {
          field += content[i++];
        }
        row.push(field);
      }

      if (i < len && content[i] === ',') {
        i++; // next field
      } else {
        // End of row
        if (i < len && content[i] === '\r') i++;
        if (i < len && content[i] === '\n') i++;
        break;
      }
    }

    rows.push(row);
  }

  return rows;
}

// ── UUID map loader ───────────────────────────────────────────────────────────

function loadUUIDMap(path) {
  const raw = JSON.parse(readFileSync(path, 'utf-8'));
  const map = {};
  for (const entry of raw.entries) {
    map[entry.airtable_rec_id] = {
      supabase_uuid: entry.supabase_uuid,
      name:          entry.airtable_name,
      category:      entry.category,
    };
  }
  return map;
}

// ── Block type normalizer ─────────────────────────────────────────────────────

function normalizeBlockType(airtableLabel) {
  const mapped = BLOCK_TYPE_MAP[airtableLabel];
  if (mapped === undefined) {
    throw new Error(
      `Unknown Airtable block type label: "${airtableLabel}". ` +
      `Add to BLOCK_TYPE_MAP in this script before live import.`
    );
  }
  if (!VALID_BLOCK_TYPES.has(mapped)) {
    throw new Error(
      `Mapped value "${mapped}" for Airtable label "${airtableLabel}" ` +
      `is not a valid Supabase block_type enum value.`
    );
  }
  return mapped;
}

// ── Template processor ────────────────────────────────────────────────────────

function processTemplates(allRows, uuidMap) {
  const headers  = allRows[0];
  const colIdx   = {};
  headers.forEach((h, i) => { colIdx[h.trim()] = i; });

  const col = name => colIdx[name];

  const results = {
    blankRowsSkipped:     0,
    csvDataRowsFound:     0,
    duplicatesSkipped:    [],
    approved:             [],
    blockers:             [],
    warnings:             [],
  };

  for (let rowNum = 1; rowNum < allRows.length; rowNum++) {
    const row        = allRows[rowNum];
    const templateId = (row[col('Template ID')] || '').trim();

    if (!templateId) {
      results.blankRowsSkipped++;
      continue;
    }

    results.csvDataRowsFound++;

    // Skip list
    if (SKIP_TEMPLATE_IDS.has(templateId)) {
      const skipInfo = SKIP_REASON_MAP.get(templateId);
      results.duplicatesSkipped.push({
        airtable_template_id: templateId,
        csv_row:              rowNum + 1,
        reason:               skipInfo?.reason || 'skip_list',
        canonical_id:         skipInfo?.canonical || null,
        note:                 skipInfo?.note || '',
      });
      continue;
    }

    const templateName  = (row[col('Template Name')] || '').trim();
    const blocksJsonRaw = (row[col('Blocks JSON')] || '').trim();
    const updatedDate   = (row[col('Updated Date')] || '').trim();

    if (!templateName) {
      results.blockers.push({
        template_id: templateId, csv_row: rowNum + 1,
        severity: 'hard', message: 'Template Name is blank.',
      });
      continue;
    }

    if (!blocksJsonRaw) {
      results.blockers.push({
        template_id: templateId, csv_row: rowNum + 1,
        severity: 'hard', message: 'Blocks JSON is blank — cannot build template structure.',
      });
      continue;
    }

    let blocksJson;
    try {
      blocksJson = JSON.parse(blocksJsonRaw);
    } catch (e) {
      results.blockers.push({
        template_id: templateId, csv_row: rowNum + 1,
        severity: 'hard', message: `Blocks JSON parse error: ${e.message}`,
      });
      continue;
    }

    if (!Array.isArray(blocksJson) || blocksJson.length === 0) {
      results.blockers.push({
        template_id: templateId, csv_row: rowNum + 1,
        severity: 'hard', message: 'Blocks JSON is not a non-empty array.',
      });
      continue;
    }

    // Generate placeholder UUIDs for dry-run report cross-referencing
    const templateDryUUID = randomUUID();
    const totalDuration   = blocksJson.reduce((s, b) => s + (b.duration || 0), 0);

    const templatePayload = {
      _dry_run_uuid:                templateDryUUID,
      _source_airtable_template_id: templateId,
      _source_csv_row:              rowNum + 1,
      _updated_date:                updatedDate,
      // DB columns
      academy_id:        ACADEMY_ID,
      name:              templateName,
      description:       null,
      group_id:          null,
      track:             null,
      level_id:          null,
      total_duration_min: totalDuration > 0 ? totalDuration : null,
      tags: [
        IMPORT_BATCH_TAG,
        'source:airtable',
        `airtable_id:${templateId}`,
      ],
      is_active:    true,
      is_default:   false,
      created_by:   null,
    };

    const blockPayloads    = [];
    const exercisePayloads = [];
    let templateHardBlocker = false;

    // Sort blocks by order field to guarantee order_index preservation
    const sortedBlocks = [...blocksJson].sort((a, b) => (a.order || 0) - (b.order || 0));

    for (const block of sortedBlocks) {
      // Block type normalization
      let supabaseType;
      try {
        supabaseType = normalizeBlockType(block.type);
      } catch (e) {
        results.blockers.push({
          template_id: templateId, block_type_airtable: block.type,
          severity: 'hard', message: e.message,
        });
        templateHardBlocker = true;
        continue;
      }

      const blockDuration = typeof block.duration === 'number' ? block.duration : null;
      if (!blockDuration || blockDuration <= 0) {
        results.blockers.push({
          template_id: templateId, block_type_airtable: block.type, order: block.order,
          severity: 'hard',
          message: `Block "${block.type}" (order ${block.order}) has duration=${blockDuration}. Schema requires CHECK (duration_min > 0).`,
        });
        templateHardBlocker = true;
        continue;
      }

      const blockDryUUID = randomUUID();
      const isMapped = BLOCK_TYPE_MAP[block.type] !== block.type; // any transformation?

      blockPayloads.push({
        _dry_run_uuid:                blockDryUUID,
        _source_airtable_template_id: templateId,
        _source_block_type_airtable:  block.type,
        _type_mapping_note: isMapped
          ? `Airtable '${block.type}' → Supabase '${supabaseType}' (Sprint 7 locked mapping). Original label preserved in name column.`
          : undefined,
        // DB columns
        template_id:  `[dry-run ref: ${templateDryUUID}]`,
        type:         supabaseType,
        name:         block.type,   // original Airtable label — required per Sprint 7 section 6
        duration_min: blockDuration,
        order_index:  block.order,
        intensity:    null,
        notes:        null,
      });

      // Exercises within this block
      const exercises = Array.isArray(block.exercises) ? block.exercises : [];

      for (let exIdx = 0; exIdx < exercises.length; exIdx++) {
        const ex       = exercises[exIdx];
        const recId    = ex.id;
        const resolved = uuidMap[recId];

        if (!resolved) {
          results.blockers.push({
            template_id:     templateId,
            block_type:      block.type,
            exercise_rec_id: recId,
            exercise_name:   ex.name || '(unknown)',
            severity:        'hard',
            message:         `rec_id ${recId} (${ex.name || 'unknown'}) not found in UUID map. Cannot insert template_block_exercises without a resolved exercise UUID.`,
          });
          templateHardBlocker = true;
          continue;
        }

        exercisePayloads.push({
          _dry_run_uuid:                randomUUID(),
          _source_airtable_template_id: templateId,
          _source_block_type_airtable:  block.type,
          _source_rec_id:               recId,
          _resolved_exercise_name:      resolved.name,
          // DB columns
          block_id:     `[dry-run ref: ${blockDryUUID}]`,
          exercise_id:  resolved.supabase_uuid,
          order_index:  exIdx + 1,
          duration_min: typeof ex.durationMin === 'number' ? ex.durationMin : null,
          notes:        null,
        });
      }
    }

    results.approved.push({
      hasHardBlocker:  templateHardBlocker,
      templatePayload,
      blockPayloads,
      exercisePayloads,
    });
  }

  return results;
}

// ── Live import ───────────────────────────────────────────────────────────────

async function runLiveImport(approved, uuidMap) {
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const insertedTemplateIds  = [];
  const insertedBlockIds     = [];
  const insertedExerciseIds  = [];

  // Print rollback SQL before any write
  console.log('');
  console.log('── ROLLBACK SQL (save this before any write) ────────────────────────────');
  console.log(`DELETE FROM template_block_exercises`);
  console.log(`  WHERE block_id IN (`);
  console.log(`    SELECT tb.id FROM template_blocks tb`);
  console.log(`    JOIN templates t ON t.id = tb.template_id`);
  console.log(`    WHERE '${IMPORT_BATCH_TAG}' = ANY(t.tags)`);
  console.log(`    AND t.academy_id = '${ACADEMY_ID}'`);
  console.log(`  );`);
  console.log(`DELETE FROM template_blocks`);
  console.log(`  WHERE template_id IN (`);
  console.log(`    SELECT id FROM templates`);
  console.log(`    WHERE '${IMPORT_BATCH_TAG}' = ANY(tags)`);
  console.log(`    AND academy_id = '${ACADEMY_ID}'`);
  console.log(`  );`);
  console.log(`DELETE FROM templates`);
  console.log(`  WHERE '${IMPORT_BATCH_TAG}' = ANY(tags)`);
  console.log(`  AND academy_id = '${ACADEMY_ID}';`);
  console.log('─────────────────────────────────────────────────────────────────────────');
  console.log('');

  for (const tpl of approved) {
    if (tpl.hasHardBlocker) {
      console.warn(`SKIP (hard blocker): ${tpl.templatePayload._source_airtable_template_id}`);
      continue;
    }

    const airtableId = tpl.templatePayload._source_airtable_template_id;

    // Duplicate protection: check if already imported
    const { data: existing, error: checkErr } = await supabase
      .from('templates')
      .select('id, tags')
      .contains('tags', [`airtable_id:${airtableId}`])
      .eq('academy_id', ACADEMY_ID)
      .limit(1);

    if (checkErr) throw new Error(`Duplicate check failed for ${airtableId}: ${checkErr.message}`);
    if (existing && existing.length > 0) {
      console.warn(`SKIP (already imported): ${airtableId} → existing id=${existing[0].id}`);
      continue;
    }

    // Build clean DB payload (no _ fields)
    const dbTemplate = {
      academy_id:         tpl.templatePayload.academy_id,
      name:               tpl.templatePayload.name,
      description:        tpl.templatePayload.description,
      group_id:           tpl.templatePayload.group_id,
      track:              tpl.templatePayload.track,
      level_id:           tpl.templatePayload.level_id,
      total_duration_min: tpl.templatePayload.total_duration_min,
      tags:               tpl.templatePayload.tags,
      is_active:          tpl.templatePayload.is_active,
      is_default:         tpl.templatePayload.is_default,
      created_by:         tpl.templatePayload.created_by,
    };

    const { data: tplRow, error: tplErr } = await supabase
      .from('templates')
      .insert(dbTemplate)
      .select('id')
      .single();

    if (tplErr) throw new Error(`Template insert failed for ${airtableId}: ${tplErr.message}`);
    const templateId = tplRow.id;
    insertedTemplateIds.push(templateId);
    console.log(`  INSERT template: ${airtableId} → ${templateId}`);

    for (const block of tpl.blockPayloads) {
      const dbBlock = {
        template_id:  templateId,
        type:         block.type,
        name:         block.name,
        duration_min: block.duration_min,
        order_index:  block.order_index,
        intensity:    block.intensity,
        notes:        block.notes,
      };

      const { data: blockRow, error: blockErr } = await supabase
        .from('template_blocks')
        .insert(dbBlock)
        .select('id')
        .single();

      if (blockErr) throw new Error(`Block insert failed (${block.name}): ${blockErr.message}`);
      const blockId = blockRow.id;
      insertedBlockIds.push(blockId);

      const blockExercises = tpl.exercisePayloads.filter(
        ex => ex._dry_run_uuid && ex.block_id.includes(block._dry_run_uuid)
      );

      // Re-find exercises for this block by matching the dry-run uuid reference
      const dryUUID = block._dry_run_uuid;
      const exForBlock = tpl.exercisePayloads.filter(ex => ex.block_id === `[dry-run ref: ${dryUUID}]`);

      for (const ex of exForBlock) {
        const dbEx = {
          block_id:     blockId,
          exercise_id:  ex.exercise_id,
          order_index:  ex.order_index,
          duration_min: ex.duration_min,
          notes:        ex.notes,
        };

        const { data: exRow, error: exErr } = await supabase
          .from('template_block_exercises')
          .insert(dbEx)
          .select('id')
          .single();

        if (exErr) throw new Error(`Exercise insert failed (${ex._resolved_exercise_name}): ${exErr.message}`);
        insertedExerciseIds.push(exRow.id);
      }
    }
  }

  // Post-import verification
  const { count: tplCount } = await supabase
    .from('templates')
    .select('*', { count: 'exact', head: true })
    .contains('tags', [IMPORT_BATCH_TAG])
    .eq('academy_id', ACADEMY_ID);

  const { count: blockCount } = await supabase
    .from('template_blocks')
    .select('*', { count: 'exact', head: true })
    .in('template_id', insertedTemplateIds);

  const { count: exCount } = await supabase
    .from('template_block_exercises')
    .select('*', { count: 'exact', head: true })
    .in('block_id', insertedBlockIds);

  return {
    inserted_template_ids:  insertedTemplateIds,
    inserted_block_ids:     insertedBlockIds,
    inserted_exercise_ids:  insertedExerciseIds,
    verification: {
      templates_in_db:                tplCount,
      template_blocks_in_db:          blockCount,
      template_block_exercises_in_db: exCount,
    },
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('Academy OS — Program Template Import');
  console.log(`Mode:   ${DRY_RUN ? 'DRY RUN (no database writes)' : 'LIVE IMPORT'}`);
  console.log(`Sprint: Sprint 8 — Program Templates Guarded Live Import Plan + Dry-Run Script`);
  console.log('');

  // Load inputs
  const csvContent = readFileSync(CSV_PATH, 'utf-8');
  const uuidMap    = loadUUIDMap(UUID_MAP_PATH);
  const allRows    = parseCSV(csvContent);

  // Process
  const results = processTemplates(allRows, uuidMap);

  // Aggregate counts
  const templatesCount  = results.approved.length;
  const blocksCount     = results.approved.reduce((s, t) => s + t.blockPayloads.length, 0);
  const exercisesCount  = results.approved.reduce((s, t) => s + t.exercisePayloads.length, 0);
  const unresolvedCount = results.blockers.filter(b => b.exercise_rec_id).length;
  const hardBlockers    = results.blockers.filter(b => b.severity === 'hard');
  const isLiveReady     = unresolvedCount === 0 && hardBlockers.length === 0;

  // Rollback plan
  const rollbackPlan = {
    description: 'Run steps in this order. CASCADE handles children, but explicit SQL is shown for auditability.',
    step_1: `DELETE FROM template_block_exercises WHERE block_id IN (SELECT tb.id FROM template_blocks tb JOIN templates t ON t.id = tb.template_id WHERE '${IMPORT_BATCH_TAG}' = ANY(t.tags) AND t.academy_id = '${ACADEMY_ID}');`,
    step_2: `DELETE FROM template_blocks WHERE template_id IN (SELECT id FROM templates WHERE '${IMPORT_BATCH_TAG}' = ANY(tags) AND academy_id = '${ACADEMY_ID}');`,
    step_3: `DELETE FROM templates WHERE '${IMPORT_BATCH_TAG}' = ANY(tags) AND academy_id = '${ACADEMY_ID}';`,
    note:   'Steps 1 and 2 are redundant given ON DELETE CASCADE on template_blocks and template_block_exercises. Shown explicitly for manual verification.',
  };

  // Build report
  const report = {
    report_type: 'program_template_guarded_import_dry_run',
    generated:   new Date().toISOString().slice(0, 10),
    sprint:      'Sprint 8 — Program Templates Guarded Live Import Plan + Dry-Run Script',
    mode:        'dry_run_only',
    writes_performed:            false,
    service_role_used:           false,
    supabase_writes_performed:   false,
    source_files_inspected:      SOURCE_FILES,

    decisions_applied: {
      block_type_mapping: BLOCK_TYPE_MAP,
      duplicate_template_skip: {
        skipped:          'TPL-1776243285121',
        canonical:        'TPL-1776288406910',
        reason:           'Identical name and Blocks JSON. Later timestamp (5:26pm vs 4:54am) is the canonical record.',
        documented_in:    'docs/PROGRAM_TEMPLATE_IMPORT_DECISIONS.md — Section 7',
      },
    },

    schema_findings: {
      templates: {
        required_columns:    ['academy_id', 'name'],
        nullable_columns:    ['description', 'group_id', 'track', 'level_id', 'total_duration_min', 'tags', 'created_by', 'voice_command_id'],
        defaults:            { is_active: true, is_default: false },
        unique_constraints:  'None on (academy_id, name) — duplicate names are schema-legal. Duplicate protection relies on airtable_id tag check.',
        metadata_json_field: false,
        airtable_id_storage: "tags TEXT[] — format: 'airtable_id:<TPL-ID>'. Same convention as exercise library import.",
      },
      template_blocks: {
        required_columns: ['template_id', 'type', 'name', 'duration_min', 'order_index'],
        nullable_columns: ['intensity', 'notes'],
        constraints:      'duration_min CHECK (duration_min > 0) — all blocks have duration > 0 per source CSV',
        block_type_enum:  [...VALID_BLOCK_TYPES],
      },
      template_block_exercises: {
        required_columns: ['block_id', 'exercise_id', 'order_index'],
        nullable_columns: ['duration_min', 'notes'],
        fk_note:          'exercise_id NOT NULL FK → exercises(id). All 14 exercise UUIDs are resolved.',
      },
    },

    duplicate_protection: {
      strategy:     'airtable_id_tag_check',
      description:  "Before any live insert, query: SELECT id FROM templates WHERE 'airtable_id:<TPL-ID>' = ANY(tags) AND academy_id = '<ACADEMY_ID>'. If row found, skip. This is idempotent as long as the airtable_id tag is always set on insert.",
      risk:         'MEDIUM — tags is TEXT[]. If a template is imported without this tag, the check will not detect it. Rollback by batch tag is reliable only if the tag was set.',
      skip_list:    [...SKIP_TEMPLATE_IDS],
      tag_pattern:  'airtable_id:<TPL-ID>',
      no_migration_required: true,
      migration_needed_for_stronger_protection: 'A UNIQUE constraint on (academy_id, ARRAY[airtable source id]) or a dedicated source_id column would remove the risk. Not planned for this sprint.',
    },

    summary: {
      csv_template_rows_found:          results.csvDataRowsFound,
      blank_rows_skipped:               results.blankRowsSkipped,
      duplicate_templates_skipped:      results.duplicatesSkipped.length,
      templates_to_import:              templatesCount,
      template_blocks_to_import:        blocksCount,
      template_block_exercises_to_import: exercisesCount,
      unresolved_exercise_uuid_count:   unresolvedCount,
      live_import_ready:                isLiveReady,
    },

    proposed_payloads: {
      _note: 'All payloads are proposed only. _dry_run_uuid values are random placeholders — actual UUIDs are assigned by Supabase on INSERT. template_id and block_id fields show [dry-run ref: <uuid>] to cross-reference payloads within this report.',
      templates:               results.approved.map(t => t.templatePayload),
      template_blocks:         results.approved.flatMap(t => t.blockPayloads),
      template_block_exercises: results.approved.flatMap(t => t.exercisePayloads),
    },

    skipped:                  results.duplicatesSkipped,
    blockers_for_live_import: hardBlockers,

    warnings: [
      ...results.warnings,
      {
        id:      'WARN-1',
        message: `academy_id is hardcoded to seed constant '${ACADEMY_ID}' (Angles Tennis Academy). Verify this matches the live Supabase project before running live import.`,
      },
      {
        id:      'WARN-2',
        message: "Foam Roll – Full Body (rec ID recx8uMV0VivQvwkC) uses an en dash (U+2013) in its name, not a hyphen (-). UUID was resolved correctly in Sprint 6 via exact character match.",
      },
      {
        id:      'WARN-3',
        message: "T-Drill (rec0q2GF4MRxhCtd1) appears in both the Movement block (order 1) and Games block (order 3) for both approved templates. One exercise UUID maps to two positions — this is intentional, not a data error.",
      },
      {
        id:      'WARN-4',
        message: "Agility and Speed blocks both map to type='fitness'. They share the same enum value and will appear in the same type bucket for any filter on template_blocks.type='fitness'. Distinguishable by block name only.",
      },
      {
        id:      'WARN-5',
        message: "Live insert order is mandatory: (1) templates → (2) template_blocks → (3) template_block_exercises. Steps cannot run in parallel. Supabase-returned UUIDs from step N are required for step N+1.",
      },
    ],

    rollback_plan: rollbackPlan,

    next_steps: [
      'Review this dry-run report and confirm counts match expected (2 templates, 10 blocks, 29 exercises).',
      `Confirm academy_id '${ACADEMY_ID}' matches the live Supabase project.`,
      'Confirm .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set.',
      'To run live import after explicit approval: node scripts/import-program-templates.mjs --live --confirm-live-import',
      'After live import: compare verification counts in report to expected counts. Run rollback SQL immediately if mismatch.',
    ],
  };

  // Write report
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');

  // Console summary
  const line = (label, value) => console.log(`  ${label.padEnd(36)} ${value}`);

  console.log('── Source ───────────────────────────────────────────────────────────────');
  line('CSV data rows found:',           report.summary.csv_template_rows_found);
  line('Blank rows skipped:',           report.summary.blank_rows_skipped);
  line('Duplicate templates skipped:',  `${report.summary.duplicate_templates_skipped} (${results.duplicatesSkipped.map(d => d.airtable_template_id).join(', ')})`);
  console.log('');
  console.log('── Proposed inserts ─────────────────────────────────────────────────────');
  line('Templates to import:',           report.summary.templates_to_import);
  line('Template blocks to import:',     report.summary.template_blocks_to_import);
  line('Template block exercises:',      report.summary.template_block_exercises_to_import);
  line('Unresolved exercise UUIDs:',     report.summary.unresolved_exercise_uuid_count);
  console.log('');
  console.log(`── Live import ready: ${isLiveReady ? 'YES' : 'NO'} ` + '─'.repeat(isLiveReady ? 48 : 47));
  if (hardBlockers.length > 0) {
    console.log('  Blockers:');
    for (const b of hardBlockers) {
      console.log(`    [${b.severity}] ${b.message}`);
    }
  }
  console.log('');
  console.log(`Report: ${REPORT_PATH}`);
  console.log('');

  // Live import execution
  if (LIVE_MODE) {
    if (!isLiveReady) {
      console.error('ERROR: Live import aborted — hard blockers present. Resolve them first.');
      process.exit(1);
    }
    console.log('── LIVE IMPORT ───────────────────────────────────────────────────────────');
    const liveResult = await runLiveImport(results.approved, uuidMap);

    report.mode = 'live';
    report.writes_performed = true;
    report.service_role_used = true;
    report.supabase_writes_performed = true;
    report.live_result = liveResult;

    writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');
    console.log('');
    console.log('── Verification ──────────────────────────────────────────────────────────');
    console.log(`  Templates in DB:                ${liveResult.verification.templates_in_db} (expected ${templatesCount})`);
    console.log(`  Template blocks in DB:          ${liveResult.verification.template_blocks_in_db} (expected ${blocksCount})`);
    console.log(`  Template block exercises in DB: ${liveResult.verification.template_block_exercises_in_db} (expected ${exercisesCount})`);

    const ok =
      liveResult.verification.templates_in_db === templatesCount &&
      liveResult.verification.template_blocks_in_db === blocksCount &&
      liveResult.verification.template_block_exercises_in_db === exercisesCount;

    console.log('');
    console.log(ok ? '  PASS — all counts match.' : '  FAIL — count mismatch. Run rollback SQL immediately.');
    console.log('');
  }
}

main().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
