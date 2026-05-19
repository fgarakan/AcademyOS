// Player Ask DONNA — Sprint 1077
// Guardrailed DONNA interface for players. Suggested question chips with static
// context-aware responses. No external AI API calls. No raw coach notes.
// Player-authenticated via profile_id linkage.

import { getSupabaseServer } from '@/lib/supabase/server'
import { DonnaChat, DonnaChip } from '@/components/player/DonnaChat'
import { Shield, BookOpen } from 'lucide-react'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technical',
  tactical: 'Tactical',
  fitness: 'Fitness',
  competition: 'Competition',
  behavioral: 'Behavioral',
  mental: 'Mental',
}

const CATEGORY_PRACTICE_TIPS: Record<string, string> = {
  technical:   'shadow swings, wall rallies, and slow deliberate reps',
  tactical:    'mental rehearsal, pattern visualization, and reviewing your last match',
  fitness:     'dynamic warm-up, court movement drills, and core stability work',
  competition: 'pre-match routines, breathing exercises, and mental rehearsal',
  behavioral:  'your between-point reset routine, journaling, and setting one session goal',
  mental:      'box breathing, focus exercises, and positive self-talk practice',
}

function buildChips(
  missionTitle: string | null,
  missionCategory: string | null,
  currentLevelName: string | null,
  nextLevelName: string | null,
): DonnaChip[] {
  const catLabel = missionCategory ? (CATEGORY_LABELS[missionCategory] ?? missionCategory) : 'current'
  const catTip   = missionCategory ? (CATEGORY_PRACTICE_TIPS[missionCategory] ?? 'consistent repetition and focused practice') : 'consistent repetition and focused practice'

  return [
    {
      id: 'what-work-on',
      label: 'What should I work on?',
      response: missionTitle
        ? `Your current mission is "${missionTitle}". Focus on quality of reps in practice, not quantity. Every session where you stay present and intentional is a step forward.`
        : `Ask your coach to assign you an active mission — that's the clearest signal of what matters most right now.`,
    },
    {
      id: 'how-level-up',
      label: 'How do I level up?',
      response: currentLevelName
        ? `You're currently at ${currentLevelName}. ${nextLevelName ? `To advance to ${nextLevelName}, your coach and director need to confirm you've met the advancement requirements. Check your Level Up page to see what's left.` : 'Check your Level Up page for your current advancement requirements.'} Advancement is earned through consistent work — it's never automatic.`
        : `Your director hasn't assigned your curriculum level yet. Check back after your next session, or ask your coach.`,
    },
    {
      id: 'practice-today',
      label: 'What should I practice today?',
      response: `For your ${catLabel} mission, great at-home practice includes ${catTip}. Short sessions done with focus beat long sessions on autopilot. Check the Practice page for a full drill set.`,
    },
    {
      id: 'how-am-i-doing',
      label: 'How am I doing?',
      response: `Your coach and director track your progress through observations at practice. The best way to know how you're doing is to keep showing up, asking good questions, and staying focused during sessions. Your Missions page shows exactly what's being built right now.`,
    },
    {
      id: 'feel-stuck',
      label: 'I feel stuck — what do I do?',
      response: `Feeling stuck is part of the process — it often means you're right at the edge of a breakthrough. Keep doing the reps even when it doesn't feel like progress. Be honest with your coach at your next session about what feels hard. That's how real development happens.`,
    },
    {
      id: 'before-match',
      label: 'How should I prepare before a match?',
      response: `The night before: rest, hydrate, and don't think too much about tactics. Morning of: a short dynamic warm-up, your go-to mental reset routine, and one clear intention for the match (e.g. "stay first strike"). Don't try to change anything major — play what's trained.`,
    },
    {
      id: 'after-loss',
      label: 'I had a tough loss — what now?',
      response: `A tough loss is information, not failure. Give yourself 24 hours to feel it without analyzing. After that, ask: what was one thing I controlled well, and one thing I want to do differently? Write it down. Bring it to your next session — that's when coaches can actually help you use it.`,
    },
    {
      id: 'stay-focused',
      label: 'How do I stay focused during practice?',
      response: `Focus is a skill, not a given. Try setting one specific intention at the start of each drill — not "play well" but something you can observe, like "watch the ball all the way to contact." When your mind wanders, use the between-point reset your coach has given you. Short focus beats long drift.`,
    },
  ]
}

export default async function PlayerAskDonnaPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let missionTitle: string | null = null
  let missionCategory: string | null = null
  let currentLevelName: string | null = null
  let nextLevelName: string | null = null

  if (user) {
    const rawDb = supabase as any

    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()

    const academyId = profile?.academy_id ?? null

    if (academyId) {
      const { data: playerRow } = await rawDb
        .from('players')
        .select('id')
        .eq('academy_id', academyId)
        .eq('profile_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (playerRow) {
        // Active mission
        const { data: priority } = await rawDb
          .from('player_priorities')
          .select('title, category')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)
          .eq('priority_rank', 1)
          .eq('is_active', true)
          .maybeSingle()

        if (priority) {
          missionTitle    = priority.title ?? null
          missionCategory = priority.category ?? null
        }

        // Current level
        const { data: csRows } = await rawDb
          .from('player_curriculum_states')
          .select('curriculum_level_id')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)
          .limit(1)

        const levelId = csRows?.[0]?.curriculum_level_id ?? null
        if (levelId) {
          const { data: lvl } = await rawDb
            .from('curriculum_levels')
            .select('display_name, sort_order')
            .eq('id', levelId)
            .single()
          currentLevelName = lvl?.display_name ?? null

          if (lvl?.sort_order != null) {
            const { data: nextLvl } = await rawDb
              .from('curriculum_levels')
              .select('display_name')
              .gt('sort_order', lvl.sort_order)
              .order('sort_order', { ascending: true })
              .limit(1)
            nextLevelName = nextLvl?.[0]?.display_name ?? null
          }
        }
      }
    }
  }

  const chips = buildChips(missionTitle, missionCategory, currentLevelName, nextLevelName)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-2">
        <p className="page-eyebrow">Ask DONNA</p>
        <h1 className="page-title">Your Training Guide</h1>
        <p className="page-subtitle">Questions about your mission, practice, or next level.</p>
      </div>

      {/* Guardrails notice */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-status-blue/5 border border-status-blue/20">
        <Shield className="w-4 h-4 text-status-blue shrink-0" />
        <p className="text-xs text-status-blue leading-relaxed">
          DONNA shares coach-approved context only. No rankings, no pressure, no private notes.
        </p>
      </div>

      {/* Interactive chat */}
      <DonnaChat chips={chips} />

      {/* Quick links */}
      <div className="rounded-xl bg-surface-raised border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-text-primary">Helpful Pages</p>
        </div>
        <div className="divide-y divide-border">
          {[
            { href: '/player/missions', label: 'My Missions', desc: 'See your active and upcoming goals' },
            { href: '/player/level-up', label: 'Level Up', desc: 'Advancement requirements and progress' },
            { href: '/player/practice', label: 'At-Home Practice', desc: 'Drill set for today' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors"
            >
              <BookOpen className="w-4 h-4 text-text-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{item.label}</p>
                <p className="text-xs text-text-muted">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-text-muted text-center px-4">
        DONNA is a guided assistant — not a replacement for your coach. Talk to your coach first.
      </p>
    </div>
  )
}
