// Sprint 1131-1140 — Parent Development Plan Card V2
// Improved parent translation layer with "Why It Matters" and "What Helps At Home".
//
// Parent sees in under 30 seconds:
//   1. Current Focus
//   2. Why This Matters
//   3. What We're Working On (plain language)
//   4. What Helps At Home
//   5. Next Check-In
//
// NO raw scores. NO internal disagreements. NO technical jargon.
// NO coach/director conflict. NO placement recommendation debate.
// All content requires show_to_parent = true (director must enable).

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { Target, Heart, ChevronRight, ShieldCheck, BookOpen, Calendar } from 'lucide-react'

interface ParentDevelopmentPlanCardProps {
  playerId: string
  academyId: string
  childFirstName: string
}

// Plain-language home support ideas by development focus keyword
function buildHomeSupport(developmentFocus: string | null, childName: string): string | null {
  if (!developmentFocus) return null
  const focus = developmentFocus.toLowerCase()

  if (focus.includes('rhythm') || focus.includes('serve')) {
    return `When ${childName} practises at home, try counting "one, two, three" together to help build a relaxed service rhythm. The mental timing matters more than the result.`
  }
  if (focus.includes('spacing') || focus.includes('contact')) {
    return `Encourage ${childName} to set up early before hitting, rather than reaching. A simple reminder: "get there first, then hit" is all they need.`
  }
  if (focus.includes('movement') || focus.includes('footwork')) {
    return `Any ball sport at home (juggling, catching, kicking) helps ${childName}'s movement development. Keep it fun — the coordination transfers.`
  }
  if (focus.includes('confidence') || focus.includes('mental')) {
    return `After practice, ask ${childName}: "What was one thing that went well today?" Focus on effort, not outcome. Confidence grows from repeated positive recognition.`
  }
  if (focus.includes('rally') || focus.includes('consistency')) {
    return `Counting consecutive hits together is great practice. Start at 5 and build from there. Celebrate any personal record — that's real progress.`
  }
  return `The most helpful thing at home is encouraging ${childName} to enjoy the process. Asking "what did you work on today?" shows interest without creating pressure.`
}

function buildNextCheckIn(childName: string): string {
  return `We'll share a progress update after the next coaching assessment. Check the Updates section for any director-approved summaries from the coaching team.`
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

  const homeSupport = buildHomeSupport(summary.development_focus as string | null, childFirstName)
  const nextCheckIn = buildNextCheckIn(childFirstName)

  return (
    <div className="space-y-3">
      {/* Approval badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-lime/5 border border-lime/20">
        <ShieldCheck className="w-3.5 h-3.5 text-lime shrink-0" />
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Director-approved Development Plan for {childFirstName}
          {updatedDate && <span className="text-text-muted"> · Updated {updatedDate}</span>}
        </p>
      </div>

      {/* Current focus — most prominent */}
      {summary.development_focus && (
        <div className="rounded-xl border border-lime/20 bg-lime/4 px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-lime shrink-0" />
            <p className="text-sm font-bold text-text-primary">Current Focus</p>
          </div>
          <p className="text-sm text-text-primary font-semibold">{summary.development_focus as string}</p>
        </div>
      )}

      {/* Why it matters */}
      {summary.student_friendly_summary && (
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-text-muted shrink-0" />
            <p className="text-sm font-semibold text-text-primary">Why This Matters</p>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{summary.student_friendly_summary as string}</p>
        </div>
      )}

      {/* Parent summary (full development plan) */}
      {summary.parent_summary && (
        <Card>
          <div className="bg-surface-raised px-4 py-3 border-b border-border rounded-t-xl">
            <p className="text-sm font-semibold text-text-primary">From Your Coaching Team</p>
          </div>
          <CardContent className="py-4">
            <p className="text-sm text-text-secondary leading-relaxed">{summary.parent_summary as string}</p>
          </CardContent>
        </Card>
      )}

      {/* What we're working on */}
      {thingsToWorkOn.length > 0 && (
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
          <p className="text-sm font-semibold text-text-primary mb-3">What We're Working On</p>
          <ul className="space-y-2">
            {thingsToWorkOn.slice(0, 4).map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary leading-snug">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What helps at home */}
      {homeSupport && (
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-status-green shrink-0" />
            <p className="text-sm font-semibold text-text-primary">What Helps At Home</p>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{homeSupport}</p>
        </div>
      )}

      {/* Next check-in */}
      <div className="rounded-xl border border-border bg-surface-raised px-4 py-3 flex items-start gap-2.5">
        <Calendar className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-text-primary mb-0.5">Next Check-In</p>
          <p className="text-xs text-text-muted leading-relaxed">{nextCheckIn}</p>
        </div>
      </div>

      {/* Safety note */}
      <p className="text-[10px] text-text-muted text-center px-4">
        All content here has been reviewed and approved by your academy director.
      </p>
    </div>
  )
}
