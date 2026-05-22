// Player Level Up — Sprint 1075
// Shows current -> next level and gate requirements list with done/not-done state.
// Director-set data only. No percentage scores. No automatic level movement.
// Player-authenticated via profile_id linkage.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState } from '@/components/ui'
import { CheckCircle2, Circle, ArrowRight, Lock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface GateRow {
  id: string
  domain: string
  criterion: string
  threshold: string
}

interface GateStatus {
  gate_id: string
  status: string
}

const DOMAIN_LABELS: Record<string, string> = {
  technical:   'Technical',
  tactical:    'Tactical',
  fitness:     'Fitness',
  competition: 'Competition',
  behavioral:  'Behavioral',
  assessment:  'Assessment',
}

export default async function PlayerLevelUpPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let currentLevelName: string | null = null
  let nextLevelName: string | null = null
  let gates: GateRow[] = []
  let gateStatuses: Record<string, GateStatus> = {}
  let noAccess = false

  if (user) {
    const rawDb = supabase as any

    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()

    const academyId = profile?.academy_id ?? null

    if (!academyId) {
      noAccess = true
    } else {
      const { data: playerRow } = await rawDb
        .from('players')
        .select('id')
        .eq('academy_id', academyId)
        .eq('profile_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (!playerRow) {
        noAccess = true
      } else {
        // Curriculum state
        const { data: csRows } = await rawDb
          .from('player_curriculum_states')
          .select('current_level_id')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)
          .limit(1)

        const levelId = csRows?.[0]?.current_level_id ?? null

        if (levelId) {
          const { data: lvl } = await rawDb
            .from('curriculum_levels')
            .select('display_name, sort_order')
            .eq('id', levelId)
            .single()
          currentLevelName = lvl?.display_name ?? null

          // Next level
          if (lvl?.sort_order != null) {
            const { data: nextLvl } = await rawDb
              .from('curriculum_levels')
              .select('display_name')
              .gt('sort_order', lvl.sort_order)
              .order('sort_order', { ascending: true })
              .limit(1)
            nextLevelName = nextLvl?.[0]?.display_name ?? null
          }

          // Gates
          const { data: gateRows } = await rawDb
            .from('curriculum_gates')
            .select('id, domain, criterion, threshold, sort_order')
            .eq('from_level_id', levelId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .limit(8)
          gates = (gateRows ?? []).map((g: any) => ({
            id: g.id,
            domain: g.domain,
            criterion: g.criterion,
            threshold: g.threshold ?? '',
          }))

          // Gate statuses
          if (gates.length > 0) {
            const { data: statusRows } = await rawDb
              .from('player_gate_status')
              .select('gate_id, status')
              .eq('player_id', playerRow.id)
              .eq('academy_id', academyId)
              .in('gate_id', gates.map(g => g.id))

            gateStatuses = Object.fromEntries(
              (statusRows ?? []).map((s: any) => [s.gate_id, s])
            )
          }
        }
      }
    }
  }

  const passedCount = gates.filter(g => gateStatuses[g.id]?.status === 'passed').length
  const totalGates = gates.length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-2">
        <p className="page-eyebrow">Level Up</p>
        <h1 className="page-title">Your Next Unlock</h1>
        <p className="page-subtitle">Here&apos;s what you&apos;re building toward — no pressure, just progress.</p>
      </div>

      {noAccess && (
        <EmptyState
          icon={<AlertCircle className="w-5 h-5" />}
          title="Profile not linked"
          description="Ask your director to link your profile to see your level-up requirements."
        />
      )}

      {!noAccess && (
        <>
          {/* Level comparison */}
          <div className="rounded-2xl bg-status-orange/5 border border-status-orange/20 px-5 py-5">
            <div className="flex items-center justify-between mb-4">
              {/* Current */}
              <div className="text-center">
                <p className="label-xs text-text-muted mb-2">Current Level</p>
                <div className="rounded-xl bg-surface-raised border border-border px-4 py-3 min-w-[80px]">
                  <p className="text-sm font-bold text-text-primary leading-tight">
                    {currentLevelName ?? 'Not set'}
                  </p>
                </div>
              </div>

              {/* Arrow + count */}
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] text-text-muted">{passedCount}/{totalGates} done</p>
                <ArrowRight className="w-5 h-5 text-status-orange" />
              </div>

              {/* Next */}
              <div className="text-center">
                <p className="label-xs text-text-muted mb-2">Next Level</p>
                <div className="rounded-xl border-2 border-dashed border-status-orange/40 px-4 py-3 min-w-[80px] flex items-center gap-1.5 justify-center">
                  <p className="text-sm font-bold text-status-orange leading-tight">
                    {nextLevelName ?? 'TBD'}
                  </p>
                  <Lock className="w-3.5 h-3.5 text-status-orange/50" />
                </div>
              </div>
            </div>

            {/* Progress bar */}
            {totalGates > 0 && (
              <div>
                <div className="flex justify-between mb-1.5">
                  <p className="text-[10px] text-text-muted">Level progress</p>
                  <p className="text-[10px] font-semibold text-status-orange">
                    {passedCount} of {totalGates} requirements met
                  </p>
                </div>
                <div className="h-2 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-full bg-status-orange transition-all duration-500"
                    style={{ width: totalGates > 0 ? `${Math.round((passedCount / totalGates) * 100)}%` : '0%' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Requirements list */}
          {totalGates > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="bg-surface-raised px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-text-primary">What You&apos;re Building</p>
              </div>
              <div className="bg-surface divide-y divide-border">
                {gates.map(gate => {
                  const passed = gateStatuses[gate.id]?.status === 'passed'
                  const domainLabel = DOMAIN_LABELS[gate.domain] ?? gate.domain
                  return (
                    <div key={gate.id} className="flex items-start gap-4 px-4 py-3.5">
                      <div className="mt-0.5 shrink-0">
                        {passed ? (
                          <CheckCircle2 className="w-4.5 h-4.5 text-status-green" />
                        ) : (
                          <Circle className="w-4.5 h-4.5 text-text-muted" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-snug ${passed ? 'text-status-green line-through decoration-status-green/40' : 'text-text-primary'}`}>
                          {gate.criterion}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">{domainLabel}</p>
                      </div>
                      {passed && (
                        <span className="text-[10px] font-semibold text-status-green bg-status-green/10 px-2 py-0.5 rounded-full shrink-0">
                          Done
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* No gates state */}
          {totalGates === 0 && !noAccess && (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-text-muted text-xs">
                  {currentLevelName
                    ? `No advancement requirements defined for ${currentLevelName} yet.`
                    : 'Curriculum level not assigned. Ask your director.'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Encouragement */}
          {totalGates > 0 && (
            <div className="rounded-xl bg-surface-raised border border-border px-4 py-4">
              <p className="text-sm text-text-secondary leading-relaxed">
                {passedCount === 0
                  ? `You're at the start of your journey toward ${nextLevelName ?? 'the next level'}. Keep showing up and working on your missions.`
                  : passedCount === totalGates
                  ? 'All requirements met! Your coach and director will confirm your advancement.'
                  : `You've met ${passedCount} of ${totalGates} requirements. Keep working on your active mission — that's the key to the next unlock.`}
              </p>
              <div className="mt-3">
                <Link href="/player/missions" className="text-xs text-lime hover:text-lime/80 transition-colors">
                  Continue your mission →
                </Link>
              </div>
            </div>
          )}

          {/* Director note */}
          <p className="text-[10px] text-text-muted text-center px-4">
            Level advancement requires coach and director confirmation — not automatic.
          </p>
        </>
      )}
    </div>
  )
}
