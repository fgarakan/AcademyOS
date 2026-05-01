'use server'

import { getSupabaseServer } from '@/lib/supabase/server'

export interface DemoSandboxResult {
  ok: boolean
  error?: string
  created?: {
    players: number
    group: boolean
    template: boolean
    session: boolean
    devProfiles: number
    priorities: number
    curriculumVersion: boolean
    curriculumOverride: boolean
  }
  deleted?: {
    sessions: number
    templates: number
    players: number
    groups: number
    curriculumVersions: number
    suggestions: number
  }
  warnings?: string[]
}

async function resolveDirectorContext() {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' } as const

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!profile?.academy_id) return { error: 'Academy context unavailable' } as const

  return { supabase, rawDb, userId: user.id, academyId: profile.academy_id as string }
}

// ============================================================
// SEED ACTION
// Creates demo data within the director's real academy.
// All records tagged with [DEMO] prefix. Idempotent.
// ============================================================

export async function createOrResetDemoSandboxAction(): Promise<DemoSandboxResult> {
  const ctx = await resolveDirectorContext()
  if ('error' in ctx) return { ok: false, error: ctx.error }
  const { supabase, rawDb, userId, academyId } = ctx

  const warnings: string[] = []
  const created = {
    players: 0,
    group: false,
    template: false,
    session: false,
    devProfiles: 0,
    priorities: 0,
    curriculumVersion: false,
    curriculumOverride: false,
  }

  // ============================================================
  // 1. Demo Group
  // ============================================================
  let demoGroupId: string | null = null
  const { data: existingGroup } = await supabase
    .from('groups')
    .select('id')
    .eq('academy_id', academyId)
    .eq('name', '[DEMO] Orange 2 Sample Group')
    .single()

  if (existingGroup?.id) {
    demoGroupId = existingGroup.id
  } else {
    const { data: newGroup, error: groupErr } = await supabase
      .from('groups')
      .insert({
        academy_id: academyId,
        name: '[DEMO] Orange 2 Sample Group',
        description: 'Sample group for demo purposes. Safe to delete.',
        track: 'skill',
      })
      .select('id')
      .single()

    if (groupErr) {
      warnings.push(`Group creation failed: ${groupErr.message}`)
    } else {
      demoGroupId = newGroup!.id
      created.group = true
    }
  }

  // ============================================================
  // 2. Find an Orange curriculum level (best-effort)
  // ============================================================
  let orangeLevelId: string | null = null
  const { data: orangeLevels } = await supabase
    .from('curriculum_levels')
    .select('id, display_name, stage')
    .eq('stage', 'orange_development')
    .order('level_number', { ascending: true })
    .limit(1)

  if (orangeLevels && orangeLevels.length > 0) {
    orangeLevelId = orangeLevels[0].id
  } else {
    warnings.push('No orange_development curriculum level found — curriculum assignment will be skipped for demo players.')
  }

  // ============================================================
  // 3. Demo Players
  // ============================================================
  const demoPlayersSpec = [
    {
      first_name: '[DEMO] Mia',
      last_name: 'Alvarez',
      strengths: ['Rally tolerance', 'Forehand consistency'],
      needs: ['Recovery after direction', 'Return readiness'],
      priority: 'Recover after crosscourt ball',
    },
    {
      first_name: '[DEMO] Leo',
      last_name: 'Martin',
      strengths: ['Movement', 'Effort'],
      needs: ['Contact spacing', 'Directional control'],
      priority: 'Create more space before contact',
    },
    {
      first_name: '[DEMO] Sophie',
      last_name: 'Chen',
      strengths: ['Focus', 'Backhand control'],
      needs: ['Return readiness', 'Split-step timing'],
      priority: 'Get ready earlier on return',
    },
    {
      first_name: '[DEMO] Ben',
      last_name: 'Rivera',
      strengths: ['Clean technique', 'Competitive mindset'],
      needs: ['Decision-making under pressure'],
      priority: 'Choose direction earlier',
    },
    {
      first_name: '[DEMO] Ava',
      last_name: 'Thompson',
      strengths: ['Consistency', 'Listening'],
      needs: ['Recovery after wide ball', 'Serve routine'],
      priority: 'Reset after movement',
    },
    {
      first_name: '[DEMO] Noah',
      last_name: 'Patel',
      strengths: ['Athletic movement', 'Energy'],
      needs: ['Patience in rallies', 'Target discipline'],
      priority: 'Slow down and choose bigger targets',
    },
  ]

  const demoPlayerIds: string[] = []

  for (const spec of demoPlayersSpec) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('academy_id', academyId)
      .eq('first_name', spec.first_name)
      .eq('last_name', spec.last_name)
      .single()

    let playerId: string

    if (existing?.id) {
      playerId = existing.id
    } else {
      const { data: newPlayer, error: playerErr } = await supabase
        .from('players')
        .insert({
          academy_id: academyId,
          first_name: spec.first_name,
          last_name: spec.last_name,
          date_of_birth: '2014-07-01',
          status: 'active',
          is_active: true,
          created_by: userId,
        })
        .select('id')
        .single()

      if (playerErr || !newPlayer) {
        warnings.push(`Player creation failed for ${spec.first_name} ${spec.last_name}: ${playerErr?.message}`)
        continue
      }

      playerId = newPlayer.id
      created.players++
    }

    demoPlayerIds.push(playerId)

    // Group membership
    if (demoGroupId) {
      const { data: existingMembership } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('player_id', playerId)
        .eq('group_id', demoGroupId)
        .single()

      if (!existingMembership) {
        await supabase
          .from('group_memberships')
          .insert({
            academy_id: academyId,
            player_id: playerId,
            group_id: demoGroupId,
            is_current: true,
          })
      }
    }

    // Curriculum state
    if (orangeLevelId) {
      const { data: existingState } = await rawDb
        .from('player_curriculum_states')
        .select('id')
        .eq('player_id', playerId)
        .eq('academy_id', academyId)
        .single()

      if (!existingState) {
        await rawDb
          .from('player_curriculum_states')
          .insert({
            player_id: playerId,
            academy_id: academyId,
            current_level_id: orangeLevelId,
          })
      }
    }

    // Development summary
    const { data: existingDev } = await rawDb
      .from('player_development_summary')
      .select('id')
      .eq('player_id', playerId)
      .single()

    if (!existingDev) {
      const { error: devErr } = await rawDb
        .from('player_development_summary')
        .insert({
          academy_id: academyId,
          player_id: playerId,
          created_by: userId,
          current_strengths: spec.strengths,
          things_to_work_on: spec.needs,
          development_focus: spec.needs[0] ?? null,
          coach_summary: `Demo player: ${spec.first_name.replace('[DEMO] ', '')} ${spec.last_name}. Sample development profile.`,
          show_to_student: false,
          show_to_parent: false,
          source: 'manual',
        })

      if (!devErr) created.devProfiles++
    }

    // Priority
    const { data: existingPriority } = await rawDb
      .from('player_priorities')
      .select('id')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .single()

    if (!existingPriority) {
      const { error: priErr } = await rawDb
        .from('player_priorities')
        .insert({
          academy_id: academyId,
          player_id: playerId,
          title: spec.priority,
          category: 'technical_skill',
          priority_rank: 1,
          priority_level: 'high',
          urgency: 'medium',
          is_active: true,
          source_signal_ids: [],
          confidence_score: 0.8,
          status: 'active',
        })

      if (!priErr) created.priorities++
    }
  }

  // ============================================================
  // 4. Demo Template
  // ============================================================
  let demoTemplateId: string | null = null
  const { data: existingTemplate } = await supabase
    .from('templates')
    .select('id')
    .eq('academy_id', academyId)
    .eq('name', '[DEMO] Orange 2 Direction + Return Start')
    .single()

  if (existingTemplate?.id) {
    demoTemplateId = existingTemplate.id
  } else {
    const { data: newTemplate, error: templateErr } = await supabase
      .from('templates')
      .insert({
        academy_id: academyId,
        name: '[DEMO] Orange 2 Direction + Return Start',
        description: 'Sample template for Orange 2 direction + return-of-serve session. Demo only.',
        is_active: true,
        is_default: false,
        track: 'skill',
        total_duration_min: 75,
        created_by: userId,
      })
      .select('id')
      .single()

    if (templateErr) {
      warnings.push(`Template creation failed: ${templateErr.message}`)
    } else {
      demoTemplateId = newTemplate!.id
      created.template = true

      const blocks = [
        { order_index: 1, name: 'Movement Prep', type: 'movement', duration_min: 10, notes: 'Dynamic warm-up. Emphasize split-step and lateral movement.' },
        { order_index: 2, name: 'Direction Technical Drill', type: 'technical', duration_min: 20, notes: 'Feed-based. Players choose crosscourt or down-the-line off short ball.' },
        { order_index: 3, name: 'Crosscourt Recovery Game', type: 'tactical', duration_min: 20, notes: 'Rally points. Focus: recover to middle after each shot.' },
        { order_index: 4, name: 'Serve + Return Start', type: 'technical', duration_min: 15, notes: 'Return of serve readiness. Rotate every 3 points.' },
        { order_index: 5, name: 'Cooldown', type: 'cool_down', duration_min: 10, notes: 'Light stretch and review of session focus.' },
      ] as const

      for (const block of blocks) {
        await supabase
          .from('template_blocks')
          .insert({
            template_id: demoTemplateId!,
            order_index: block.order_index,
            name: block.name,
            type: block.type,
            duration_min: block.duration_min,
            notes: block.notes,
          })
      }
    }
  }

  // ============================================================
  // 5. Demo Session
  // ============================================================
  let demoSessionId: string | null = null
  const { data: existingSession } = await supabase
    .from('sessions')
    .select('id')
    .eq('academy_id', academyId)
    .eq('name', '[DEMO] Orange 2 Adaptive Session')
    .single()

  if (existingSession?.id) {
    demoSessionId = existingSession.id
  } else if (demoGroupId) {
    const { data: newSession, error: sessionErr } = await supabase
      .from('sessions')
      .insert({
        academy_id: academyId,
        name: '[DEMO] Orange 2 Adaptive Session',
        group_id: demoGroupId,
        template_id: demoTemplateId ?? undefined,
        coach_id: userId,
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '10:00',
        duration_min: 75,
        status: 'planned',
        created_by: userId,
        session_notes: 'Demo session for the Academy OS interactive tour. Safe to modify or delete.',
      })
      .select('id')
      .single()

    if (sessionErr) {
      warnings.push(`Session creation failed: ${sessionErr.message}`)
    } else {
      demoSessionId = newSession!.id
      created.session = true

      const sessionBlocks = [
        { order_index: 1, name: 'Movement Prep', type: 'movement', duration_min: 10, notes: 'Dynamic warm-up. Emphasize split-step and lateral movement.' },
        { order_index: 2, name: 'Direction Technical Drill', type: 'technical', duration_min: 20, notes: 'Feed-based. Players choose crosscourt or down-the-line off short ball.' },
        { order_index: 3, name: 'Crosscourt Recovery Game', type: 'tactical', duration_min: 20, notes: 'Rally points. Focus: recover to middle after each shot.' },
        { order_index: 4, name: 'Serve + Return Start', type: 'technical', duration_min: 15, notes: 'Return of serve readiness. Rotate every 3 points.' },
        { order_index: 5, name: 'Cooldown', type: 'cool_down', duration_min: 10, notes: 'Light stretch and review of session focus.' },
      ] as const

      for (const block of sessionBlocks) {
        await supabase
          .from('session_blocks')
          .insert({
            session_id: demoSessionId!,
            order_index: block.order_index,
            name: block.name,
            type: block.type,
            duration_min: block.duration_min,
            notes: block.notes,
            is_override: false,
          })
      }
    }
  }

  // ============================================================
  // 6. Demo Curriculum Version (best-effort)
  // ============================================================
  const { data: existingVersion } = await rawDb
    .from('academy_curriculum_versions')
    .select('id')
    .eq('academy_id', academyId)
    .eq('name', '[DEMO] Dabul Academy Curriculum')
    .single()

  if (!existingVersion) {
    const { data: newVersion, error: versionErr } = await rawDb
      .from('academy_curriculum_versions')
      .insert({
        academy_id: academyId,
        name: '[DEMO] Dabul Academy Curriculum',
        description: 'Demo curriculum version. Shows how academy-specific customizations work.',
        status: 'active',
        version_number: 1,
        created_by: userId,
      })
      .select('id')
      .single()

    if (versionErr) {
      warnings.push(`Curriculum version creation failed: ${versionErr.message}`)
    } else {
      created.curriculumVersion = true

      // Demo override: emphasis shift example
      const { error: overrideErr } = await rawDb
        .from('academy_curriculum_overrides')
        .insert({
          academy_id: academyId,
          curriculum_version_id: newVersion.id,
          target_type: 'level',
          override_type: 'emphasis_shift',
          scope: 'level',
          proposed_change: {
            emphasis: 'return_readiness',
            note: 'More return-of-serve readiness before Orange 3.',
          },
          override_reason: 'For our Orange 2 players, I want more return-of-serve readiness before Orange 3.',
          source: 'typed',
          raw_input: 'For our Orange 2 players, I want more return-of-serve readiness before Orange 3.',
          status: 'applied',
          created_by: userId,
        })

      if (!overrideErr) created.curriculumOverride = true
    }
  }

  // ============================================================
  // 7. Audit log
  // ============================================================
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: userId,
      action: 'demo_sandbox_seed',
      target_type: 'demo_sandbox',
      metadata: { created },
    })
    .throwOnError()
    .then(() => {})
    .catch(() => {})

  return { ok: true, created, warnings }
}

// ============================================================
// RESET ACTION
// Deletes all demo-tagged records from the academy.
// Requires confirmed: true.
// ============================================================

export async function resetDemoSandboxAction(confirmed: boolean): Promise<DemoSandboxResult> {
  if (!confirmed) return { ok: false, error: 'Confirmation required to delete demo data.' }

  const ctx = await resolveDirectorContext()
  if ('error' in ctx) return { ok: false, error: ctx.error }
  const { supabase, rawDb, userId, academyId } = ctx

  const deleted = {
    sessions: 0,
    templates: 0,
    players: 0,
    groups: 0,
    curriculumVersions: 0,
    suggestions: 0,
  }

  // Step 1: Get demo session IDs
  const { data: demoSessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('academy_id', academyId)
    .ilike('name', '[DEMO]%')

  const demoSessionIds = (demoSessions ?? []).map(s => s.id)

  // Step 2: Delete session_adjustment_suggestions for demo sessions
  if (demoSessionIds.length > 0) {
    const { data: deletedSuggestions } = await rawDb
      .from('session_adjustment_suggestions')
      .delete()
      .in('session_id', demoSessionIds)
      .select('id')

    deleted.suggestions = (deletedSuggestions ?? []).length
  }

  // Step 3: Delete sessions (session_blocks cascade)
  const { data: deletedSessions } = await supabase
    .from('sessions')
    .delete()
    .eq('academy_id', academyId)
    .ilike('name', '[DEMO]%')
    .select('id')

  deleted.sessions = (deletedSessions ?? []).length

  // Step 4: Delete templates (template_blocks cascade)
  const { data: deletedTemplates } = await supabase
    .from('templates')
    .delete()
    .eq('academy_id', academyId)
    .ilike('name', '[DEMO]%')
    .select('id')

  deleted.templates = (deletedTemplates ?? []).length

  // Step 5: Delete demo players (group_memberships, priorities, dev summaries, curriculum states cascade)
  const { data: deletedPlayers } = await supabase
    .from('players')
    .delete()
    .eq('academy_id', academyId)
    .ilike('first_name', '[DEMO]%')
    .select('id')

  deleted.players = (deletedPlayers ?? []).length

  // Step 6: Delete demo groups (memberships already cleared by player cascade)
  const { data: deletedGroups } = await supabase
    .from('groups')
    .delete()
    .eq('academy_id', academyId)
    .ilike('name', '[DEMO]%')
    .select('id')

  deleted.groups = (deletedGroups ?? []).length

  // Step 7: Delete demo curriculum versions (overrides cascade)
  const { data: deletedVersions } = await rawDb
    .from('academy_curriculum_versions')
    .delete()
    .eq('academy_id', academyId)
    .ilike('name', '[DEMO]%')
    .select('id')

  deleted.curriculumVersions = (deletedVersions ?? []).length

  // Audit log
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: userId,
      action: 'demo_sandbox_reset',
      target_type: 'demo_sandbox',
      metadata: { deleted },
    })
    .throwOnError()
    .then(() => {})
    .catch(() => {})

  return { ok: true, deleted }
}

// ============================================================
// STATUS QUERY — used by demo page to show current sandbox state
// ============================================================

export interface DemoSandboxStatus {
  playerCount: number
  groupExists: boolean
  groupName: string | null
  templateExists: boolean
  templateName: string | null
  sessionExists: boolean
  sessionId: string | null
  sessionName: string | null
  curriculumVersionExists: boolean
  demoPlayers: Array<{
    id: string
    fullName: string
    strengths: string[]
    needs: string[]
    priority: string | null
  }>
}

export async function getDemoSandboxStatusAction(): Promise<{ ok: boolean; status?: DemoSandboxStatus; error?: string }> {
  const ctx = await resolveDirectorContext()
  if ('error' in ctx) return { ok: false, error: ctx.error }
  const { supabase, rawDb, academyId } = ctx

  const { data: demoPlayers } = await supabase
    .from('players')
    .select('id, first_name, last_name, full_name')
    .eq('academy_id', academyId)
    .ilike('first_name', '[DEMO]%')
    .order('first_name')

  const players = demoPlayers ?? []
  const playerIds = players.map(p => p.id)

  const devMap = new Map<string, { strengths: string[]; needs: string[] }>()
  if (playerIds.length > 0) {
    const { data: devRows } = await rawDb
      .from('player_development_summary')
      .select('player_id, current_strengths, things_to_work_on')
      .in('player_id', playerIds)

    for (const row of devRows ?? []) {
      devMap.set(row.player_id, {
        strengths: (row.current_strengths as string[]) ?? [],
        needs: (row.things_to_work_on as string[]) ?? [],
      })
    }
  }

  const priorityMap = new Map<string, string>()
  if (playerIds.length > 0) {
    const { data: priRows } = await rawDb
      .from('player_priorities')
      .select('player_id, title')
      .in('player_id', playerIds)
      .eq('is_active', true)
      .order('priority_rank', { ascending: true })

    for (const row of priRows ?? []) {
      if (!priorityMap.has(row.player_id)) {
        priorityMap.set(row.player_id, row.title)
      }
    }
  }

  const { data: demoGroups } = await supabase
    .from('groups')
    .select('id, name')
    .eq('academy_id', academyId)
    .ilike('name', '[DEMO]%')
    .limit(1)

  const { data: demoTemplates } = await supabase
    .from('templates')
    .select('id, name')
    .eq('academy_id', academyId)
    .ilike('name', '[DEMO]%')
    .limit(1)

  const { data: demoSessions } = await supabase
    .from('sessions')
    .select('id, name')
    .eq('academy_id', academyId)
    .ilike('name', '[DEMO]%')
    .limit(1)

  const { data: demoVersions } = await rawDb
    .from('academy_curriculum_versions')
    .select('id, name')
    .eq('academy_id', academyId)
    .ilike('name', '[DEMO]%')
    .limit(1)

  const group = demoGroups?.[0] ?? null
  const template = demoTemplates?.[0] ?? null
  const session = demoSessions?.[0] ?? null

  return {
    ok: true,
    status: {
      playerCount: players.length,
      groupExists: !!group,
      groupName: group?.name ?? null,
      templateExists: !!template,
      templateName: template?.name ?? null,
      sessionExists: !!session,
      sessionId: session?.id ?? null,
      sessionName: session?.name ?? null,
      curriculumVersionExists: (demoVersions ?? []).length > 0,
      demoPlayers: players.map(p => ({
        id: p.id,
        fullName: p.full_name ?? `${p.first_name} ${p.last_name}`.trim(),
        strengths: devMap.get(p.id)?.strengths ?? [],
        needs: devMap.get(p.id)?.needs ?? [],
        priority: priorityMap.get(p.id) ?? null,
      })),
    },
  }
}
