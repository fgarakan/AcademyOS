'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { runPlayerImportParsing } from '@/lib/player-import/playerImportParser'
import type { NormalizedImportRow } from '@/lib/player-import/playerImportParser'

// ─── Shared auth helper ───────────────────────────────────────────────────────

async function resolveDirectorContext(supabase: any): Promise<
  { userId: string; academyId: string } | { error: string }
> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { error: 'Academy context unavailable.' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('profile_id', user.id)
    .eq('academy_id', profile.academy_id)
    .eq('is_active', true)
    .in('role', ['academy_director', 'head_coach'])
    .single()
  if (!membership) return { error: 'Access denied. Director or head coach role required.' }

  return { userId: user.id, academyId: profile.academy_id }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DryRunRowResult {
  rowIndex: number
  fullName: string
  action: 'create' | 'update_dev_data' | 'skip_duplicate' | 'skip_error'
  existingPlayerId: string | null
  groupResolved: boolean
  groupName: string | null
  curriculumLevelResolved: boolean
  curriculumLevelName: string | null
  coachResolved: boolean
  coachName: string | null
  warnings: string[]
  errors: string[]
}

export interface DryRunReport {
  ok: boolean
  error?: string
  headerError?: string | null
  rows: DryRunRowResult[]
  counts: {
    total: number
    toCreate: number
    toUpdateDevData: number
    skippedDuplicates: number
    skippedErrors: number
    unresolvedGroups: number
    unresolvedLevels: number
    unresolvedCoaches: number
    parseWarnings: number
    parseErrors: number
  }
  warnings: string[]
}

// ─── Dry Run Action ───────────────────────────────────────────────────────────

export async function runPlayerImportDryRunAction(csvText: string): Promise<DryRunReport> {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any
  const ctx = await resolveDirectorContext(supabase)
  if ('error' in ctx) {
    return { ok: false, error: ctx.error, rows: [], counts: emptyDryCounts(), warnings: [] }
  }
  const { academyId } = ctx

  // Parse + validate CSV
  const parseResult = runPlayerImportParsing(csvText)
  if (parseResult.headerError) {
    return {
      ok: false,
      headerError: parseResult.headerError,
      rows: [],
      counts: emptyDryCounts(),
      warnings: [],
    }
  }

  const warnings: string[] = parseResult.warnings.map(w => `Row ${w.rowIndex}: [${w.field}] ${w.message}`)

  if (parseResult.normalizedRows.length === 0) {
    return {
      ok: true,
      rows: [],
      counts: { ...emptyDryCounts(), parseWarnings: parseResult.counts.warningRows },
      warnings: [...warnings, 'No valid rows to import.'],
    }
  }

  // Load existing players for duplicate detection
  const { data: existingPlayers } = await supabase
    .from('players')
    .select('id, first_name, last_name')
    .eq('academy_id', academyId)
    .eq('is_active', true)

  const existingNameMap = new Map<string, string>()
  for (const p of existingPlayers ?? []) {
    const key = `${p.first_name} ${p.last_name}`.toLowerCase()
    existingNameMap.set(key, p.id)
  }

  // Load existing groups
  const { data: groupRows } = await supabase
    .from('groups')
    .select('id, name')
    .eq('academy_id', academyId)
    .eq('is_active', true)

  const groupNameMap = new Map<string, string>()
  for (const g of groupRows ?? []) {
    groupNameMap.set(g.name.toLowerCase().trim(), g.id)
  }

  // Load curriculum levels
  const { data: levelRows } = await rawDb
    .from('curriculum_levels')
    .select('id, display_name')

  const levelNameMap = new Map<string, string>()
  for (const l of levelRows ?? []) {
    levelNameMap.set((l.display_name as string).toLowerCase().trim(), l.id as string)
  }

  // Load coach profiles
  const { data: coachProfiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .not('display_name', 'is', null)

  const coachNameMap = new Map<string, string>()
  for (const c of coachProfiles ?? []) {
    if (c.display_name) {
      coachNameMap.set(c.display_name.toLowerCase().trim(), c.id)
    }
  }

  // Build per-row results
  const rows: DryRunRowResult[] = []

  for (const row of parseResult.normalizedRows) {
    const rowWarnings: string[] = []
    const rowErrors: string[] = []

    // Check for parse errors on this specific row
    const rowParseErrors = parseResult.errors.filter(e => e.rowIndex === row.rowIndex)
    const rowParseWarnings = parseResult.warnings.filter(w => w.rowIndex === row.rowIndex)

    if (rowParseErrors.length > 0) {
      rows.push({
        rowIndex: row.rowIndex,
        fullName: row.fullName,
        action: 'skip_error',
        existingPlayerId: null,
        groupResolved: false,
        groupName: null,
        curriculumLevelResolved: false,
        curriculumLevelName: null,
        coachResolved: false,
        coachName: null,
        warnings: rowParseWarnings.map(w => w.message),
        errors: rowParseErrors.map(e => e.message),
      })
      continue
    }

    // Duplicate check
    const nameKey = row.fullName.toLowerCase()
    const existingId = existingNameMap.get(nameKey) ?? null
    const action: DryRunRowResult['action'] = existingId ? 'update_dev_data' : 'create'

    if (existingId) {
      rowWarnings.push(`Player "${row.fullName}" already exists in this academy. Development data (strengths, needs, priority) will be updated if provided; core fields will not be changed.`)
    }

    // Group resolution
    let groupResolved = false
    let groupName: string | null = null
    if (row.currentGroup) {
      const gid = groupNameMap.get(row.currentGroup.toLowerCase().trim())
      if (gid) {
        groupResolved = true
        groupName = row.currentGroup
      } else {
        rowWarnings.push(`Group "${row.currentGroup}" not found in this academy. Group assignment will be skipped.`)
      }
    }

    // Curriculum level resolution
    let curriculumLevelResolved = false
    let curriculumLevelName: string | null = null
    if (row.curriculumLevel) {
      const lid = levelNameMap.get(row.curriculumLevel.toLowerCase().trim())
      if (lid) {
        curriculumLevelResolved = true
        curriculumLevelName = row.curriculumLevel
      } else {
        rowWarnings.push(`Curriculum level "${row.curriculumLevel}" not found. Curriculum assignment will be skipped.`)
      }
    }

    // Coach resolution
    let coachResolved = false
    let coachName: string | null = null
    if (row.primaryCoach) {
      const cid = coachNameMap.get(row.primaryCoach.toLowerCase().trim())
      if (cid) {
        coachResolved = true
        coachName = row.primaryCoach
      } else {
        rowWarnings.push(`Coach "${row.primaryCoach}" not found. Coach assignment will be skipped.`)
      }
    }

    rows.push({
      rowIndex: row.rowIndex,
      fullName: row.fullName,
      action,
      existingPlayerId: existingId,
      groupResolved,
      groupName,
      curriculumLevelResolved,
      curriculumLevelName,
      coachResolved,
      coachName,
      warnings: [...rowParseWarnings.map(w => w.message), ...rowWarnings],
      errors: rowErrors,
    })
  }

  const counts = {
    total: rows.length,
    toCreate: rows.filter(r => r.action === 'create').length,
    toUpdateDevData: rows.filter(r => r.action === 'update_dev_data').length,
    skippedDuplicates: parseResult.duplicateCandidates.reduce((acc, d) => acc + d.rowIndexes.length - 1, 0),
    skippedErrors: rows.filter(r => r.action === 'skip_error').length,
    unresolvedGroups: rows.filter(r => !r.groupResolved && r.warnings.some(w => w.includes('Group'))).length,
    unresolvedLevels: rows.filter(r => !r.curriculumLevelResolved && r.warnings.some(w => w.includes('Curriculum level'))).length,
    unresolvedCoaches: rows.filter(r => !r.coachResolved && r.warnings.some(w => w.includes('Coach'))).length,
    parseWarnings: parseResult.counts.warningRows,
    parseErrors: parseResult.counts.errorRows,
  }

  return { ok: true, rows, counts, warnings }
}

// ─── Commit Action ────────────────────────────────────────────────────────────

export interface CommitResult {
  ok: boolean
  error?: string
  createdCount: number
  updatedCount: number
  skippedCount: number
  profileSummaryCreatedCount: number
  priorityCreatedCount: number
  curriculumAssignedCount: number
  groupAssignedCount: number
  warnings: string[]
  errors: string[]
}

export async function commitPlayerImportAction(csvText: string): Promise<CommitResult> {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any
  const ctx = await resolveDirectorContext(supabase)
  if ('error' in ctx) {
    return { ok: false, error: ctx.error, ...emptyCommitCounts() }
  }
  const { userId, academyId } = ctx

  // Re-run parse (never trust client result)
  const parseResult = runPlayerImportParsing(csvText)
  if (parseResult.headerError) {
    return { ok: false, error: parseResult.headerError, ...emptyCommitCounts() }
  }

  const { normalizedRows } = parseResult
  if (normalizedRows.length === 0) {
    return { ok: false, error: 'No valid rows to import.', ...emptyCommitCounts() }
  }

  const warnings: string[] = parseResult.warnings.map(w => `Row ${w.rowIndex}: ${w.message}`)
  const errors: string[] = parseResult.errors.map(e => `Row ${e.rowIndex}: ${e.message}`)

  // Load lookup maps (same as dry run)
  const { data: existingPlayers } = await supabase
    .from('players')
    .select('id, first_name, last_name')
    .eq('academy_id', academyId)
    .eq('is_active', true)

  const existingNameToId = new Map<string, string>()
  for (const p of existingPlayers ?? []) {
    existingNameToId.set(`${p.first_name} ${p.last_name}`.toLowerCase(), p.id)
  }

  const { data: groupRows } = await supabase
    .from('groups')
    .select('id, name')
    .eq('academy_id', academyId)
    .eq('is_active', true)

  const groupNameToId = new Map<string, string>()
  for (const g of groupRows ?? []) {
    groupNameToId.set(g.name.toLowerCase().trim(), g.id)
  }

  const { data: levelRows } = await rawDb
    .from('curriculum_levels')
    .select('id, display_name')

  const levelNameToId = new Map<string, string>()
  for (const l of levelRows ?? []) {
    levelNameToId.set((l.display_name as string).toLowerCase().trim(), l.id as string)
  }

  const { data: coachProfiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .not('display_name', 'is', null)

  const coachNameToId = new Map<string, string>()
  for (const c of coachProfiles ?? []) {
    if (c.display_name) coachNameToId.set(c.display_name.toLowerCase().trim(), c.id)
  }

  // Process rows
  let createdCount = 0
  let updatedCount = 0
  // Error rows are already excluded from normalizedRows; count them as skipped.
  let skippedCount = parseResult.counts.errorRows
  let profileSummaryCreatedCount = 0
  let priorityCreatedCount = 0
  let curriculumAssignedCount = 0
  let groupAssignedCount = 0

  for (const row of normalizedRows) {
    const nameKey = row.fullName.toLowerCase()
    const existingId = existingNameToId.get(nameKey) ?? null

    let playerId: string | null = existingId

    if (!existingId) {
      // Create player
      const dateOfBirth = row.birthYear ? `${row.birthYear}-07-01` : '1900-01-01'

      const { data: newPlayer, error: insertErr } = await supabase
        .from('players')
        .insert({
          academy_id: academyId,
          first_name: row.firstName,
          last_name: row.lastName,
          date_of_birth: dateOfBirth,
          status: row.status === 'on_hold' ? 'pending_placement' : 'active',
          is_active: true,
          created_by: userId,
        })
        .select('id')
        .single()

      if (insertErr || !newPlayer) {
        warnings.push(`Row ${row.rowIndex}: Failed to create player "${row.fullName}": ${insertErr?.message ?? 'unknown error'}. Skipped.`)
        skippedCount++
        continue
      }

      playerId = newPlayer.id
      createdCount++
    } else {
      updatedCount++
    }

    if (!playerId) { skippedCount++; continue }

    // Development summary (upsert)
    const hasDevData = row.strengths.length > 0 || row.needs.length > 0 || row.coachNotes
    if (hasDevData) {
      const { error: devErr } = await rawDb
        .from('player_development_summary')
        .upsert({
          player_id: playerId,
          academy_id: academyId,
          created_by: userId,
          updated_by: userId,
          current_strengths: row.strengths,
          things_to_work_on: row.needs,
          development_focus: row.developmentFocus,
          coach_summary: row.coachNotes,
          show_to_student: false,
          show_to_parent: false,
          source: 'manual',
        }, { onConflict: 'player_id' })

      if (!devErr) profileSummaryCreatedCount++
      else warnings.push(`Row ${row.rowIndex}: Development summary could not be saved for "${row.fullName}": ${devErr.message}`)
    }

    // Priority (create only if provided and no existing active priority)
    if (row.currentPriority) {
      const { data: existingPriorities } = await rawDb
        .from('player_priorities')
        .select('id')
        .eq('player_id', playerId)
        .eq('is_active', true)
        .limit(1)

      if (!existingPriorities || existingPriorities.length === 0) {
        const { error: priErr } = await rawDb
          .from('player_priorities')
          .insert({
            player_id: playerId,
            academy_id: academyId,
            category: 'technical_skill',
            title: row.currentPriority,
            priority_rank: 1,
            is_active: true,
            status: 'open',
          })

        if (!priErr) priorityCreatedCount++
        else warnings.push(`Row ${row.rowIndex}: Priority could not be saved for "${row.fullName}": ${priErr.message}`)
      }
    }

    // Curriculum assignment
    if (row.curriculumLevel) {
      const levelId = levelNameToId.get(row.curriculumLevel.toLowerCase().trim())
      if (levelId) {
        const { error: csErr } = await rawDb
          .from('player_curriculum_states')
          .upsert({
            player_id: playerId,
            academy_id: academyId,
            current_level_id: levelId,
            advancement_eligible: false,
          }, { onConflict: 'player_id,academy_id' })

        if (!csErr) curriculumAssignedCount++
        else warnings.push(`Row ${row.rowIndex}: Curriculum assignment failed for "${row.fullName}": ${csErr.message}`)
      } else {
        warnings.push(`Row ${row.rowIndex}: Curriculum level "${row.curriculumLevel}" not found for "${row.fullName}". Skipped.`)
      }
    }

    // Group assignment
    if (row.currentGroup && !existingId) {
      const groupId = groupNameToId.get(row.currentGroup.toLowerCase().trim())
      if (groupId) {
        const { error: gmErr } = await rawDb
          .from('group_memberships')
          .insert({
            academy_id: academyId,
            player_id: playerId,
            group_id: groupId,
            is_current: true,
          })

        if (!gmErr) groupAssignedCount++
        else warnings.push(`Row ${row.rowIndex}: Group assignment failed for "${row.fullName}": ${gmErr.message}`)
      } else {
        warnings.push(`Row ${row.rowIndex}: Group "${row.currentGroup}" not found for "${row.fullName}". Skipped.`)
      }
    }
  }

  // Audit log
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: userId,
      action: 'player_import_commit',
      target_type: 'player_import',
      payload: {
        created_count: createdCount,
        updated_count: updatedCount,
        skipped_count: skippedCount,
        profile_summary_created: profileSummaryCreatedCount,
        priority_created: priorityCreatedCount,
        curriculum_assigned: curriculumAssignedCount,
        group_assigned: groupAssignedCount,
        total_rows: normalizedRows.length,
      },
    })

  return {
    ok: true,
    createdCount,
    updatedCount,
    skippedCount,
    profileSummaryCreatedCount,
    priorityCreatedCount,
    curriculumAssignedCount,
    groupAssignedCount,
    warnings,
    errors,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyDryCounts() {
  return {
    total: 0, toCreate: 0, toUpdateDevData: 0, skippedDuplicates: 0, skippedErrors: 0,
    unresolvedGroups: 0, unresolvedLevels: 0, unresolvedCoaches: 0,
    parseWarnings: 0, parseErrors: 0,
  }
}

function emptyCommitCounts() {
  return {
    createdCount: 0, updatedCount: 0, skippedCount: 0,
    profileSummaryCreatedCount: 0, priorityCreatedCount: 0,
    curriculumAssignedCount: 0, groupAssignedCount: 0,
    warnings: [] as string[], errors: [] as string[],
  }
}
