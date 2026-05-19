// Parent Updates — Sprint 1082
// Coach-approved parent summaries and academy communications.
// Only shows player_development_summary where show_to_parent = true.
// Parent-authenticated via guardian -> player_guardians chain.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { Bell, MessageSquare, ShieldCheck, AlertCircle, FileText } from 'lucide-react'

interface DevSummary {
  parentSummary: string
  updatedAt: string
  developmentFocus: string | null
}

export default async function ParentUpdatesPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let childFirstName: string | null = null
  let devSummary: DevSummary | null = null
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
      const { data: guardian } = await rawDb
        .from('guardians')
        .select('id')
        .eq('profile_id', user.id)
        .eq('academy_id', academyId)
        .maybeSingle()

      if (!guardian) {
        noAccess = true
      } else {
        const { data: pgRows } = await rawDb
          .from('player_guardians')
          .select('player_id')
          .eq('guardian_id', guardian.id)
          .limit(3)

        const playerIds: string[] = (pgRows ?? []).map((r: any) => r.player_id)

        if (playerIds.length === 0) {
          noAccess = true
        } else {
          const { data: playerRow } = await rawDb
            .from('players')
            .select('id, first_name, full_name')
            .eq('id', playerIds[0])
            .eq('academy_id', academyId)
            .eq('is_active', true)
            .maybeSingle()

          if (!playerRow) {
            noAccess = true
          } else {
            childFirstName = playerRow.first_name ?? playerRow.full_name ?? null

            // Parent-approved development summary only
            const { data: summaryRow } = await rawDb
              .from('player_development_summary')
              .select('parent_summary, updated_at, development_focus')
              .eq('player_id', playerRow.id)
              .eq('academy_id', academyId)
              .eq('show_to_parent', true)
              .maybeSingle()

            if (summaryRow?.parent_summary) {
              devSummary = {
                parentSummary: summaryRow.parent_summary,
                updatedAt: summaryRow.updated_at,
                developmentFocus: summaryRow.development_focus ?? null,
              }
            }
          }
        }
      }
    }
  }

  const name = childFirstName ?? 'Your child'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-2">
        <p className="page-eyebrow">From the Academy</p>
        <h1 className="page-title">Updates</h1>
        <p className="page-subtitle">Coach summaries and messages approved for you to see.</p>
      </div>

      {noAccess && (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-7 h-7 text-text-muted mx-auto mb-2" />
            <p className="text-text-muted text-xs">Ask the academy director to link your parent account.</p>
          </CardContent>
        </Card>
      )}

      {!noAccess && (
        <>
          {/* Approval notice */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-lime/5 border border-lime/20">
            <ShieldCheck className="w-4 h-4 text-lime shrink-0" />
            <p className="text-xs text-text-secondary leading-relaxed">
              Only director-approved content appears here. Raw coach notes are never visible.
            </p>
          </div>

          {/* Coach development summary */}
          {devSummary ? (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="bg-surface-raised px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-text-muted" />
                  <p className="text-sm font-semibold text-text-primary">Development Summary</p>
                </div>
                <p className="text-[10px] text-text-muted">
                  {new Date(devSummary.updatedAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </p>
              </div>
              <div className="bg-surface px-4 py-4 space-y-3">
                {devSummary.developmentFocus && (
                  <div>
                    <p className="label-xs text-text-muted mb-1">Current Focus</p>
                    <p className="text-xs text-text-secondary">{devSummary.developmentFocus}</p>
                  </div>
                )}
                <div>
                  <p className="label-xs text-text-muted mb-2">From Your Coaching Team</p>
                  <p className="text-sm text-text-primary leading-relaxed">{devSummary.parentSummary}</p>
                </div>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
                <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-text-muted" />
                </div>
                <p className="text-text-primary text-sm font-medium">Your first update is on its way</p>
                <p className="text-text-muted text-xs leading-relaxed max-w-xs">
                  When your coaching team prepares a parent summary for {name}, it will appear here.
                  Your director reviews all content before it reaches you.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Academy announcements — empty state */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-text-muted" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Academy Announcements</p>
                  <p className="text-xs text-text-muted">Schedules, events, and updates from the academy</p>
                </div>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                No announcements at this time. Your academy will post important updates here.
              </p>
            </CardContent>
          </Card>

          {/* Footer note */}
          <p className="text-[10px] text-text-muted text-center px-4">
            All content here is reviewed and approved by your academy director before being shared with you.
          </p>
        </>
      )}
    </div>
  )
}
