import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { DevelopmentIntakeClient } from './DevelopmentIntakeClient'
import type { IntakePlayerRow } from './DevelopmentIntakeClient'

export default async function DevelopmentIntakePage() {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  let academyId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()
    academyId = profile?.academy_id ?? null
  }

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  // Load active players
  const { data: playerRows } = await supabase
    .from('players')
    .select('id, full_name, first_name, last_name')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .eq('status', 'active')
    .order('full_name')

  const players = playerRows ?? []
  const playerIds = players.map(p => p.id)

  // Load development summaries
  const devMap = new Map<string, { strengths: string[]; needs: string[]; notes: string | null }>()
  if (playerIds.length > 0) {
    const { data: devRows } = await rawDb
      .from('player_development_summary')
      .select('player_id, current_strengths, things_to_work_on, coach_summary')
      .in('player_id', playerIds)

    for (const row of devRows ?? []) {
      devMap.set(row.player_id, {
        strengths: (row.current_strengths as string[]) ?? [],
        needs: (row.things_to_work_on as string[]) ?? [],
        notes: row.coach_summary ?? null,
      })
    }
  }

  // Load top active priority per player
  const priorityMap = new Map<string, string>()
  if (playerIds.length > 0) {
    const { data: priRows } = await rawDb
      .from('player_priorities')
      .select('player_id, title, priority_rank')
      .in('player_id', playerIds)
      .eq('is_active', true)
      .order('priority_rank', { ascending: true })

    for (const row of priRows ?? []) {
      if (!priorityMap.has(row.player_id)) {
        priorityMap.set(row.player_id, row.title)
      }
    }
  }

  const intakePlayers: IntakePlayerRow[] = players.map(p => {
    const dev = devMap.get(p.id)
    return {
      playerId: p.id,
      fullName: p.full_name ?? `${p.first_name} ${p.last_name}`.trim(),
      strengths: dev?.strengths ?? [],
      needs: dev?.needs ?? [],
      currentPriority: priorityMap.get(p.id) ?? null,
      coachNotes: dev?.notes ?? null,
      hasDevelopmentData: !!dev && (dev.strengths.length > 0 || dev.needs.length > 0),
    }
  })

  return (
    <div className="animate-fade-in p-6 space-y-6 max-w-3xl">
      <Link
        href="/director/players"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All Players
      </Link>

      <div>
        <p className="page-eyebrow">Players</p>
        <h1 className="page-title">Development Profile Intake</h1>
        <p className="page-subtitle">Quickly add strengths, needs, and current priorities so coaches are aligned.</p>
      </div>

      {intakePlayers.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <p className="text-text-primary font-medium">No active players yet</p>
          <p className="text-sm text-text-muted">Import players first, then return here to add their development data.</p>
          <Link
            href="/director/players/import"
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors"
          >
            Import Players
          </Link>
        </div>
      ) : (
        <DevelopmentIntakeClient players={intakePlayers} />
      )}
    </div>
  )
}
