// Sprint 1113-1120 — Parent Development Plan Card
// Server Component — shows the blueprint-sourced parent-safe development plan.
// Reads from player_development_summary (existing RLS-compliant table).
// Only shows content where show_to_parent = true.
// NO raw coach notes. NO assessment scores. NO internal priorities.
// Parent sees: summary, development focus, things to work on, 30-day preview.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { Target, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react'

interface ParentDevelopmentPlanCardProps {
  playerId: string
  academyId: string
  childFirstName: string
}

export async function ParentDevelopmentPlanCard({
  playerId,
  academyId,
  childFirstName,
}: ParentDevelopmentPlanCardProps) {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // Read parent-approved development summary — show_to_parent must be true
  const { data: summary } = await rawDb
    .from('player_development_summary')
    .select('parent_summary, development_focus, things_to_work_on, student_friendly_summary, updated_at, show_to_parent')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .eq('show_to_parent', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!summary) return null

  const thingsToWorkOn: string[] = (summary.things_to_work_on as string[] | null) ?? []
  const updatedDate = summary.updated_at
    ? new Date(summary.updated_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="space-y-3">
      {/* Safety badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-lime/5 border border-lime/20">
        <ShieldCheck className="w-3.5 h-3.5 text-lime shrink-0" />
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Director-approved Development Plan for {childFirstName}
          {updatedDate && <span className="text-text-muted"> · Updated {updatedDate}</span>}
        </p>
      </div>

      {/* Development summary */}
      {summary.parent_summary && (
        <Card>
          <div className="bg-surface-raised px-4 py-3 border-b border-border rounded-t-xl">
            <p className="text-sm font-semibold text-text-primary">Development Plan</p>
          </div>
          <CardContent className="py-4">
            <p className="text-sm text-text-secondary leading-relaxed">{summary.parent_summary as string}</p>
          </CardContent>
        </Card>
      )}

      {/* Current focus */}
      {summary.development_focus && (
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-lime shrink-0" />
            <p className="text-sm font-semibold text-text-primary">Current Focus</p>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{summary.development_focus as string}</p>
        </div>
      )}

      {/* Things to work on — parent-friendly labels */}
      {thingsToWorkOn.length > 0 && (
        <Card>
          <div className="bg-surface-raised px-4 py-3 border-b border-border rounded-t-xl">
            <p className="text-sm font-semibold text-text-primary">What {childFirstName} Is Developing</p>
          </div>
          <CardContent className="py-4">
            <ul className="space-y-2">
              {thingsToWorkOn.slice(0, 4).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
                  <p className="text-sm text-text-secondary leading-snug">{item}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 30-day preview — student_friendly_summary used here */}
      {summary.student_friendly_summary && (
        <div className="rounded-xl border border-lime/20 bg-lime/3 px-4 py-4">
          <p className="label-xs text-lime mb-2">What to Expect</p>
          <p className="text-sm text-text-secondary leading-relaxed">{summary.student_friendly_summary as string}</p>
        </div>
      )}
    </div>
  )
}
