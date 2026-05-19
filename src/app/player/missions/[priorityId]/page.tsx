// Player Mission Detail — Sprint 1071
// Full detail view for a single active priority / mission.
// Director-set priority data only. No raw coach notes. No automatic level movement.
// Player-authenticated via profile_id linkage — never URL params.

import Link from 'next/link'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import {
  Target, Lightbulb, Dumbbell, Eye, CheckCircle2,
  FileText, ArrowRight, ChevronLeft, AlertCircle,
} from 'lucide-react'

interface Props {
  params: { priorityId: string }
}

const CATEGORY_LABELS: Record<string, string> = {
  technical:   'Technical',
  tactical:    'Tactical',
  fitness:     'Fitness',
  competition: 'Competition',
  behavioral:  'Behavioral',
  mental:      'Mental',
}

const WHAT_TO_DO_BY_CATEGORY: Record<string, string[]> = {
  technical:   ['Focus on one technical aspect per session', 'Shadow reps first — quality over speed', 'Ask your coach to watch your technique'],
  tactical:    ['Practice decision-making in match-like situations', 'Play points with a specific target in mind', 'Notice when you use the skill in a match'],
  fitness:     ['Warm up properly before each session', 'Focus on controlled movement — not just speed', 'Rest and recovery are part of training too'],
  competition: ['Use routines between points to reset', 'Focus on one tactical habit per match', 'Play practice matches to build match feel'],
  behavioral:  ['Stay focused on what you can control', 'Bring a positive attitude to every session', 'Ask your coach for specific feedback'],
  mental:      ['Breathe and reset after tough points', 'One point at a time — past points are gone', 'Focus on the process, not the outcome'],
}

const HOW_TO_KNOW_BY_CATEGORY: Record<string, string[]> = {
  technical:   ['Your coach confirms the technique in a session', 'You can repeat the skill consistently', 'It feels natural in a match situation'],
  tactical:    ['You make the right decision under pressure', 'Your coach notices the improvement', 'You apply the skill in a real match'],
  fitness:     ['You feel stronger and more comfortable on court', 'Your movement improves in sessions', 'Your coach notices the physical improvement'],
  competition: ['You use the skill in a real match', 'You stay composed in pressure situations', 'Your match results reflect the improvement'],
  behavioral:  ['Your coach sees the change in sessions', 'You feel more confident on court', 'You apply it consistently over multiple sessions'],
  mental:      ['You recover faster from tough points', 'Your focus lasts longer during matches', 'Your coach notices improved composure'],
}

export default async function PlayerMissionDetailPage({ params }: Props) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let priority: {
    id: string
    title: string
    description: string | null
    category: string | null
    urgency: string | null
  } | null = null
  let notFound = false
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
        const { data: priorityRow } = await rawDb
          .from('player_priorities')
          .select('id, title, description, category, urgency')
          .eq('id', params.priorityId)
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)
          .eq('is_active', true)
          .maybeSingle()

        if (!priorityRow) {
          notFound = true
        } else {
          priority = priorityRow
        }
      }
    }
  }

  if (noAccess || notFound || !priority) {
    return (
      <div className="space-y-4">
        <Link href="/player/missions" className="text-xs text-text-muted hover:text-text-secondary flex items-center gap-1 pt-2">
          <ChevronLeft className="w-3 h-3" /> Back to Missions
        </Link>
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-text-muted" />
            <p className="text-text-primary text-sm font-medium">
              {notFound ? 'Mission not found' : 'Access not available'}
            </p>
            <p className="text-text-muted text-xs">
              {notFound
                ? 'This mission may have been updated. Go back to see your current missions.'
                : 'Ask your director to link your profile.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const categoryLabel = CATEGORY_LABELS[priority.category ?? ''] ?? priority.category ?? 'General'
  const whatToDo = WHAT_TO_DO_BY_CATEGORY[priority.category ?? ''] ?? WHAT_TO_DO_BY_CATEGORY['technical']
  const howToKnow = HOW_TO_KNOW_BY_CATEGORY[priority.category ?? ''] ?? HOW_TO_KNOW_BY_CATEGORY['technical']

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link href="/player/missions" className="text-xs text-text-muted hover:text-text-secondary flex items-center gap-1 pt-2">
        <ChevronLeft className="w-3 h-3" /> Back to Missions
      </Link>

      {/* Hero */}
      <div className="rounded-2xl bg-lime/5 border border-lime/20 px-4 py-5">
        <p className="label-xs text-lime mb-2">Active Mission</p>
        <h1 className="text-xl font-bold text-text-primary leading-snug mb-1">
          {priority.title}
        </h1>
        {priority.description && (
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            {priority.description}
          </p>
        )}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-text-muted px-2 py-0.5 rounded-full bg-surface border border-border">
            {categoryLabel}
          </span>
          <Link
            href="/player/practice"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-lime hover:text-lime/80 transition-colors"
          >
            See practice exercises <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Mission Goal */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
              <Target className="w-3.5 h-3.5 text-lime" />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-lime font-semibold">Mission Goal</p>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {priority.description ?? priority.title}
          </p>
        </CardContent>
      </Card>

      {/* Why It Matters */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-status-orange/10 border border-status-orange/20 flex items-center justify-center shrink-0">
              <Lightbulb className="w-3.5 h-3.5 text-status-orange" />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-status-orange font-semibold">Why It Matters</p>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            This mission builds one of the key skills your coach has identified for your development at your current level.
            Mastering it will help you compete more effectively and move toward the next milestone.
          </p>
        </CardContent>
      </Card>

      {/* What To Do */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-status-blue/10 border border-status-blue/20 flex items-center justify-center shrink-0">
              <Dumbbell className="w-3.5 h-3.5 text-status-blue" />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-status-blue font-semibold">What To Do</p>
          </div>
          <ul className="space-y-2">
            {whatToDo.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-status-blue/10 text-status-blue text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-text-secondary leading-relaxed">{step}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Coach Watch-For */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <Eye className="w-3.5 h-3.5 text-text-muted" />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Your Coach Is Watching For</p>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            Your coach will be watching for this skill in sessions and matches. Bring focus and consistency — that&apos;s what coaches notice most.
          </p>
        </CardContent>
      </Card>

      {/* How To Know You Improved */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-lime" />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-lime font-semibold">How To Know You Improved</p>
          </div>
          <ul className="space-y-2">
            {howToKnow.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary leading-relaxed">{item}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Evidence Needed */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-status-orange/10 border border-status-orange/20 flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5 text-status-orange" />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-status-orange font-semibold">Evidence Needed</p>
          </div>
          <div className="space-y-2">
            {[
              'Coach observation in a session',
              'Consistent effort across multiple sessions',
              'Coach confirmation of progress',
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0">
                <p className="text-xs text-text-secondary">{item}</p>
                <span className="text-[10px] text-text-muted shrink-0">Your coach records this</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ask DONNA + Practice CTAs */}
      <div className="grid grid-cols-2 gap-3 pb-2">
        <Link
          href="/player/practice"
          className="rounded-xl bg-lime/10 border border-lime/20 px-3 py-3 text-center hover:bg-lime/15 transition-colors"
        >
          <Dumbbell className="w-4 h-4 text-lime mx-auto mb-1" />
          <p className="text-xs font-semibold text-lime">Practice</p>
        </Link>
        <Link
          href="/player/ask-donna"
          className="rounded-xl bg-surface-raised border border-border px-3 py-3 text-center hover:border-status-blue/20 transition-colors"
        >
          <Eye className="w-4 h-4 text-text-muted mx-auto mb-1" />
          <p className="text-xs font-semibold text-text-secondary">Ask DONNA</p>
        </Link>
      </div>
    </div>
  )
}
