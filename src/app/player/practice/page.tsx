// Player Practice — Sprint 1076
// At-home practice session keyed to player's active mission category.
// Checklist is local state only — no DB writes, no coach visibility.
// Player-authenticated via profile_id linkage.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState } from '@/components/ui'
import { PracticeChecklist, DrillItem } from '@/components/player/PracticeChecklist'
import { AlertCircle, Dumbbell } from 'lucide-react'
import Link from 'next/link'

const DRILLS_BY_CATEGORY: Record<string, DrillItem[]> = {
  technical: [
    { id: 't1', text: 'Shadow groundstroke swings — slow and deliberate', duration: '5 min' },
    { id: 't2', text: 'Footwork pattern: split step and recovery shuffle', duration: '5 min' },
    { id: 't3', text: 'Wall rally — focus on contact point, not power', duration: '10 min' },
    { id: 't4', text: 'Toss and swing — controlled follow-through only', duration: '5 min' },
  ],
  tactical: [
    { id: 'ta1', text: 'Visualize 3 point-construction patterns from practice', duration: '5 min' },
    { id: 'ta2', text: 'Mental replay: last match — identify 2 tactical decisions', duration: '5 min' },
    { id: 'ta3', text: 'Shadow drill: serve + 1 approach pattern', duration: '8 min' },
    { id: 'ta4', text: 'Write down one tactical focus for your next session', duration: '2 min' },
  ],
  fitness: [
    { id: 'f1', text: 'Dynamic warm-up: leg swings, hip circles, arm circles', duration: '5 min' },
    { id: 'f2', text: 'Court movement: side shuffles and split steps', duration: '8 min' },
    { id: 'f3', text: 'Core stability: plank holds and rotations', duration: '5 min' },
    { id: 'f4', text: 'Cool down: quad, hip flexor, shoulder stretches', duration: '5 min' },
  ],
  competition: [
    { id: 'c1', text: 'Walk through your full pre-match warm-up ritual', duration: '5 min' },
    { id: 'c2', text: 'Breathing: 4-count inhale, hold, exhale — 10 rounds', duration: '5 min' },
    { id: 'c3', text: 'Visualize playing a tight tiebreak calmly and clearly', duration: '5 min' },
    { id: 'c4', text: 'Review one match pattern you want to improve', duration: '5 min' },
  ],
  behavioral: [
    { id: 'b1', text: 'Journal: one moment you stayed composed this week', duration: '3 min' },
    { id: 'b2', text: 'Practice your between-point reset routine', duration: '5 min' },
    { id: 'b3', text: 'Set one behavior goal for your next session', duration: '2 min' },
    { id: 'b4', text: 'Visualize playing your best under pressure', duration: '5 min' },
  ],
  mental: [
    { id: 'm1', text: 'Box breathing exercise — 4 full rounds', duration: '5 min' },
    { id: 'm2', text: 'Focus drill: count breaths for 3 minutes without losing count', duration: '3 min' },
    { id: 'm3', text: 'Write 3 honest affirmations for your game right now', duration: '3 min' },
    { id: 'm4', text: 'Visualize executing your strongest shot perfectly, 10 times', duration: '5 min' },
  ],
}

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technical',
  tactical: 'Tactical',
  fitness: 'Fitness',
  competition: 'Competition',
  behavioral: 'Behavioral',
  mental: 'Mental',
}

const DEFAULT_DRILLS = DRILLS_BY_CATEGORY.technical

export default async function PlayerPracticePage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let missionTitle: string | null = null
  let missionCategory: string | null = null
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
        const { data: priority } = await rawDb
          .from('player_priorities')
          .select('title, category')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)
          .eq('priority_rank', 1)
          .eq('is_active', true)
          .maybeSingle()

        if (priority) {
          missionTitle = priority.title ?? null
          missionCategory = priority.category ?? null
        }
      }
    }
  }

  const drills: DrillItem[] = missionCategory && DRILLS_BY_CATEGORY[missionCategory]
    ? DRILLS_BY_CATEGORY[missionCategory]
    : DEFAULT_DRILLS

  const categoryLabel = missionCategory ? (CATEGORY_LABELS[missionCategory] ?? missionCategory) : 'Technical'
  const totalMinutes = drills.reduce((sum, d) => {
    const n = d.duration ? parseInt(d.duration) : 0
    return sum + (isNaN(n) ? 0 : n)
  }, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-2">
        <p className="page-eyebrow">Practice</p>
        <h1 className="page-title">At-Home Practice</h1>
        <p className="page-subtitle">Short, focused practice. Quality over quantity.</p>
      </div>

      {noAccess && (
        <EmptyState
          icon={<AlertCircle className="w-5 h-5" />}
          title="Profile not linked"
          description="Ask your director to link your profile to unlock at-home practice sessions."
        />
      )}

      {!noAccess && (
        <>
          {/* Today's focus */}
          <div className="rounded-2xl bg-lime/5 border border-lime/20 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0 mt-0.5">
                <Dumbbell className="w-4.5 h-4.5 text-lime" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="label-xs text-lime">Today&apos;s Focus</p>
                  <span className="text-[10px] text-text-muted bg-surface-raised border border-border px-2 py-0.5 rounded-full">
                    {categoryLabel}
                  </span>
                </div>
                <p className="text-sm font-semibold text-text-primary leading-snug">
                  {missionTitle ?? 'Technical Foundation Work'}
                </p>
                <p className="text-xs text-text-muted mt-1">~{totalMinutes} min total</p>
              </div>
            </div>
          </div>

          {/* Interactive checklist */}
          <PracticeChecklist drills={drills} />

          {/* Tips */}
          <div className="rounded-xl bg-surface-raised border border-border px-4 py-4">
            <p className="text-xs font-semibold text-text-primary mb-2">Practice Tips</p>
            <ul className="space-y-1.5">
              <li className="text-xs text-text-secondary leading-relaxed">
                Focus on feel, not outcome — slow is smooth, smooth is fast.
              </li>
              <li className="text-xs text-text-secondary leading-relaxed">
                Short sessions done consistently beat long sessions done rarely.
              </li>
              <li className="text-xs text-text-secondary leading-relaxed">
                Bring one thought from this session to your next court practice.
              </li>
            </ul>
          </div>

          {/* CTAs */}
          <div className="flex gap-3">
            <Link
              href="/player/missions"
              className="flex-1 rounded-xl bg-surface-raised border border-border px-4 py-3 text-center text-xs font-semibold text-text-primary hover:border-lime/30 transition-colors"
            >
              See My Mission
            </Link>
            <Link
              href="/player/ask-donna"
              className="flex-1 rounded-xl bg-surface-raised border border-lime/20 px-4 py-3 text-center text-xs font-semibold text-lime hover:bg-lime/5 transition-colors"
            >
              Ask DONNA
            </Link>
          </div>

          {/* Footer note */}
          <p className="text-[10px] text-text-muted text-center px-4">
            Practice log is local — nothing here is sent to your coach. Just for you.
          </p>
        </>
      )}
    </div>
  )
}
