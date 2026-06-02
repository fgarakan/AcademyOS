'use server'

// Post-Migration Verification Action V1
//
// Checks whether migrations 076–080 are applied to the live DB by:
//   1. Attempting to query each table (existence check)
//   2. Checking RLS is enabled via information_schema
//   3. Counting existing policies via pg_policies
//   4. Counting rows inserted (non-destructive read test)
//
// Used by the migration verification dashboard at /director/migration-verify.
// Director/head_coach only. Read-only — no mutations.

import { getSupabaseServer } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

export type MigrationStatus = 'applied' | 'missing' | 'error'

export interface TableVerification {
  tableName: string
  migration: string
  description: string
  status: MigrationStatus
  rowCount: number | null
  rlsEnabled: boolean | null
  policyCount: number | null
  errorMessage?: string | null
}

export interface MigrationVerificationResult {
  ok: boolean
  error?: string
  academyId: string
  verifiedAt: string
  tables: TableVerification[]
  overallStatus: 'all_applied' | 'partial' | 'none_applied'
  readyForPilot: boolean
  missingTables: string[]
  appliedTables: string[]
}

const MIGRATIONS_TO_CHECK = [
  {
    tableName: 'player_mission_assignments',
    migration: '076',
    description: 'Player mission assignments — missions tab, blueprint missions, player portal missions',
  },
  {
    tableName: 'friction_reports',
    migration: '077',
    description: 'Friction reports — in-app friction capture for pilot feedback',
  },
  {
    tableName: 'player_development_blueprints',
    migration: '078',
    description: 'Player development blueprints — 4-pathway priorities, 30-day plan, coach brief',
  },
  {
    tableName: 'assessment_events',
    migration: '079',
    description: 'Assessment events — structured assessment workflow with scheduling',
  },
  {
    tableName: 'donna_placement_recommendations',
    migration: '080',
    description: 'DONNA placement recommendations — post-assessment placement intelligence',
  },
]

export async function postMigrationVerifyAction(): Promise<MigrationVerificationResult> {
  const fail = (error: string): MigrationVerificationResult => ({
    ok: false,
    error,
    academyId: '',
    verifiedAt: new Date().toISOString(),
    tables: [],
    overallStatus: 'none_applied',
    readyForPilot: false,
    missingTables: MIGRATIONS_TO_CHECK.map(m => m.tableName),
    appliedTables: [],
  })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return fail('Academy context unavailable.')
  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role as UserRole | undefined
  if (role !== 'academy_director' && role !== 'head_coach') {
    return fail('Director or head coach access required.')
  }

  const rawDb = supabase as any
  const tables: TableVerification[] = []

  for (const migration of MIGRATIONS_TO_CHECK) {
    let status: MigrationStatus = 'missing'
    let rowCount: number | null = null
    let rlsEnabled: boolean | null = null
    let policyCount: number | null = null
    let errorMessage: string | null = null

    try {
      // 1. Check table exists + count rows for this academy
      const { count, error: countError } = await rawDb
        .from(migration.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('academy_id', academyId)

      if (countError) {
        if (
          countError.code === '42P01' ||
          String(countError.message).includes('does not exist') ||
          String(countError.message).includes('relation') ||
          String(countError.code) === 'PGRST106'
        ) {
          status = 'missing'
          errorMessage = 'Table does not exist. Apply migration ' + migration.migration + '.'
        } else {
          status = 'error'
          errorMessage = String(countError.message ?? 'Unknown error')
        }
      } else {
        status = 'applied'
        rowCount = (count as number | null) ?? 0
      }

      // 2. Check RLS status via information_schema (best-effort)
      if (status === 'applied') {
        try {
          const { data: rlsRows } = await rawDb.rpc('check_table_rls', {
            p_table_name: migration.tableName,
          })
          rlsEnabled = rlsRows?.[0]?.row_security ?? null
        } catch {
          // RPC not available — check via pg_tables query if possible
          rlsEnabled = null
        }

        // 3. Count policies (best-effort via a known pg_policies view or indirect check)
        try {
          // Try to use a known policy check — if we can select, RLS is probably configured
          const { data: policyRows } = await rawDb
            .from('pg_policies')
            .select('policyname')
            .eq('tablename', migration.tableName)

          policyCount = Array.isArray(policyRows) ? policyRows.length : null
        } catch {
          policyCount = null
        }
      }
    } catch (err) {
      status = 'error'
      errorMessage = err instanceof Error ? err.message : 'Unexpected error'
    }

    tables.push({
      tableName: migration.tableName,
      migration: migration.migration,
      description: migration.description,
      status,
      rowCount,
      rlsEnabled,
      policyCount,
      errorMessage,
    })
  }

  const appliedTables = tables.filter(t => t.status === 'applied').map(t => t.tableName)
  const missingTables = tables.filter(t => t.status !== 'applied').map(t => t.tableName)

  const overallStatus =
    appliedTables.length === tables.length ? 'all_applied'
    : appliedTables.length > 0 ? 'partial'
    : 'none_applied'

  // Pilot ready = at minimum 076 (missions) and 078 (blueprints) applied
  const readyForPilot = appliedTables.includes('player_mission_assignments') &&
                        appliedTables.includes('player_development_blueprints')

  return {
    ok: true,
    academyId,
    verifiedAt: new Date().toISOString(),
    tables,
    overallStatus,
    readyForPilot,
    missingTables,
    appliedTables,
  }
}

// ── Write smoke test action ────────────────────────────────────────────────────
// Attempts a non-destructive insert + immediate delete on each new table.
// Returns pass/fail per table. Director only.

export interface SmokeTestResult {
  tableName: string
  canInsert: boolean
  canSelect: boolean
  errorMessage?: string | null
}

export interface SmokeSuiteResult {
  ok: boolean
  error?: string
  results: SmokeTestResult[]
  passCount: number
  failCount: number
}

export async function runMigrationSmokeTest(): Promise<SmokeSuiteResult> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.', results: [], passCount: 0, failCount: 0 }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.', results: [], passCount: 0, failCount: 0 }
  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role as UserRole | undefined
  if (role !== 'academy_director') {
    return { ok: false, error: 'Director access required for smoke test.', results: [], passCount: 0, failCount: 0 }
  }

  const rawDb = supabase as any

  // Fetch a real player for smoke tests that need player_id
  const { data: playerRow } = await supabase
    .from('players')
    .select('id')
    .eq('academy_id', academyId)
    .limit(1)
    .maybeSingle()
  const testPlayerId = playerRow?.id ?? null

  const results: SmokeTestResult[] = []

  // Test 1: player_mission_assignments
  {
    let canInsert = false
    let canSelect = false
    let errorMessage: string | null = null

    if (!testPlayerId) {
      errorMessage = 'No player found for smoke test. Add a player first.'
    } else {
      try {
        const { data: inserted, error: insertErr } = await rawDb
          .from('player_mission_assignments')
          .insert({
            academy_id:     academyId,
            player_id:      testPlayerId,
            mission_label:  '__smoke_test_delete_me__',
            status:         'draft',
            source_type:    'director',
            assigned_by:    user.id,
            display_order:  9999,
          })
          .select('id')
          .single()

        if (insertErr) {
          errorMessage = String(insertErr.message ?? 'Insert failed')
        } else {
          canInsert = true
          // Clean up
          await rawDb
            .from('player_mission_assignments')
            .delete()
            .eq('id', inserted.id)
          canSelect = true
        }
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : 'Unexpected error'
      }
    }

    results.push({ tableName: 'player_mission_assignments', canInsert, canSelect, errorMessage })
  }

  // Test 2: friction_reports
  {
    let canInsert = false
    let canSelect = false
    let errorMessage: string | null = null

    try {
      const { data: inserted, error: insertErr } = await rawDb
        .from('friction_reports')
        .insert({
          academy_id:    academyId,
          reporter_id:   user.id,
          reporter_role: role,
          page_path:     '/director/migration-verify',
          friction_type: 'other',
          severity:      'low',
          comment:       '__smoke_test_delete_me__',
          status:        'open',
        })
        .select('id')
        .single()

      if (insertErr) {
        errorMessage = String(insertErr.message ?? 'Insert failed')
      } else {
        canInsert = true
        await rawDb.from('friction_reports').delete().eq('id', inserted.id)
        canSelect = true
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Unexpected error'
    }

    results.push({ tableName: 'friction_reports', canInsert, canSelect, errorMessage })
  }

  // Test 3: player_development_blueprints (insert + delete)
  {
    let canInsert = false
    let canSelect = false
    let errorMessage: string | null = null

    if (!testPlayerId) {
      errorMessage = 'No player found for smoke test.'
    } else {
      try {
        const { data: inserted, error: insertErr } = await rawDb
          .from('player_development_blueprints')
          .insert({
            academy_id:           academyId,
            player_id:            testPlayerId,
            curriculum_level_name: '__smoke_test__',
            curriculum_stage_key:  'orange_development',
            strengths:            [],
            gaps:                 [],
            skill_priorities:     [],
            competition_priorities: [],
            fitness_priorities:   [],
            mental_priorities:    [],
            thirty_day_plan:      {},
            coach_focus_areas:    [],
            parent_next_steps:    [],
            status:               'active',
            generated_by:         user.id,
          })
          .select('id')
          .single()

        if (insertErr) {
          errorMessage = String(insertErr.message ?? 'Insert failed')
        } else {
          canInsert = true
          await rawDb.from('player_development_blueprints').delete().eq('id', inserted.id)
          canSelect = true
        }
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : 'Unexpected error'
      }
    }

    results.push({ tableName: 'player_development_blueprints', canInsert, canSelect, errorMessage })
  }

  // Test 4: assessment_events
  {
    let canInsert = false
    let canSelect = false
    let errorMessage: string | null = null

    if (!testPlayerId) {
      errorMessage = 'No player found for smoke test.'
    } else {
      try {
        const { data: inserted, error: insertErr } = await rawDb
          .from('assessment_events')
          .insert({
            academy_id:       academyId,
            player_id:        testPlayerId,
            assessment_type:  'director_requested',
            assessment_mode:  'quick',
            trigger_source:   'director',
            requested_by:     user.id,
            assessor_id:      user.id,
            status:           'draft',
          })
          .select('id')
          .single()

        if (insertErr) {
          errorMessage = String(insertErr.message ?? 'Insert failed')
        } else {
          canInsert = true
          await rawDb.from('assessment_events').delete().eq('id', inserted.id)
          canSelect = true
        }
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : 'Unexpected error'
      }
    }

    results.push({ tableName: 'assessment_events', canInsert, canSelect, errorMessage })
  }

  // Test 5: donna_placement_recommendations
  {
    let canInsert = false
    let canSelect = false
    let errorMessage: string | null = null

    if (!testPlayerId) {
      errorMessage = 'No player found for smoke test.'
    } else {
      try {
        const { data: inserted, error: insertErr } = await rawDb
          .from('donna_placement_recommendations')
          .insert({
            academy_id:             academyId,
            player_id:              testPlayerId,
            recommended_stage:      'orange_development',
            recommended_level_name: '__smoke_test__',
            confidence_score:       0,
            confidence_tier:        'low',
            top_reasons:            [],
            limiting_factors:       [],
            risk_notes:             [],
            alternative_placements: [],
            evidence_used:          [],
            check_after_4_to_6_weeks: [],
            status:                 'pending_director_review',
            generated_by:           user.id,
          })
          .select('id')
          .single()

        if (insertErr) {
          errorMessage = String(insertErr.message ?? 'Insert failed')
        } else {
          canInsert = true
          await rawDb.from('donna_placement_recommendations').delete().eq('id', inserted.id)
          canSelect = true
        }
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : 'Unexpected error'
      }
    }

    results.push({ tableName: 'donna_placement_recommendations', canInsert, canSelect, errorMessage })
  }

  const passCount = results.filter(r => r.canInsert && r.canSelect).length
  const failCount = results.length - passCount

  return { ok: true, results, passCount, failCount }
}
