// Parent Ask DONNA — Sprint 1083
// Guardrailed DONNA guidance for parents. Personalized with child's context.
// No external AI API calls. No raw coach notes. No rankings.
// Parent-authenticated via guardian -> player_guardians chain.

import { getSupabaseServer } from '@/lib/supabase/server'
import { ParentDonnaChat, ParentDonnaChip } from '@/components/player/ParentDonnaChat'
import { Shield, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { sanitizeParentFacingText } from '@/lib/communications/parentSafeResponseRules'

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technical',
  tactical: 'Tactical',
  fitness: 'Fitness',
  competition: 'Competition',
  behavioral: 'Behavioral',
  mental: 'Mental',
}

const CATEGORY_AT_HOME_TIPS: Record<string, string> = {
  technical:   'Make sure they have time to do shadow swings or wall rallies — short sessions done consistently build muscle memory.',
  tactical:    'Ask them to explain one tactical pattern they worked on this week. Teaching it to you reinforces the learning.',
  fitness:     'Support a regular sleep schedule and hydration habits. Fitness development is mostly built away from the court.',
  competition: 'Keep the home environment calm before and after match days. Avoid debriefs immediately after a loss.',
  behavioral:  'Praise the process: "I noticed you stayed composed in that situation." Effort and attitude, not just results.',
  mental:      'Give space after tough sessions. Let them decompress before asking questions. They process in their own time.',
}

const CATEGORY_AFTER_PRACTICE: Record<string, string> = {
  technical:   'What are you working on with your strokes right now?',
  tactical:    "Did anything click for you in today's practice?",
  fitness:     'How does your body feel after today? Did you push yourself?',
  competition: 'Is there a match situation you want to get better at handling?',
  behavioral:  "What's one thing you did well today that had nothing to do with tennis technique?",
  mental:      'What was going through your mind during the toughest moment of today?',
}

function buildChips(
  childName: string,
  focusCategory: string | null,
  currentLevelName: string | null,
  doingWell: string | null,
): ParentDonnaChip[] {
  const name = childName
  const catLabel = focusCategory ? (CATEGORY_LABELS[focusCategory] ?? focusCategory) : 'their current focus area'
  const atHomeTip = focusCategory ? (CATEGORY_AT_HOME_TIPS[focusCategory] ?? 'Encourage consistent effort and let the coaching team lead the technical work.') : 'The best support is consistent encouragement and letting the coaching team lead.'
  const afterPracticeQ = focusCategory ? (CATEGORY_AFTER_PRACTICE[focusCategory] ?? 'What was the best moment of today?') : 'What was one good thing from today?'

  return [
    {
      id: 'support-at-home',
      label: 'How can I support at home?',
      response: `For ${name}'s current focus on ${catLabel}: ${atHomeTip} Avoid technical coaching at home — that's the coaching team's job. Your role is calm, consistent support.`,
    },
    {
      id: 'after-practice',
      label: 'What should I say after practice?',
      response: `The most powerful thing you can say after practice is just "I love watching you play." If you want to start a conversation, try asking: "${afterPracticeQ}" — then listen without advising.`,
    },
    {
      id: 'how-progressing',
      label: 'How is my child progressing?',
      response: currentLevelName
        ? `${name} is currently working at the ${currentLevelName} level. ${doingWell ? `Your coaching team has noted strength in: ${doingWell}. ` : ''}Development takes time — the most important indicator is consistent attendance and positive engagement.`
        : `${name}'s development is being tracked by the coaching team. Check the Progress tab for a detailed view of their level and advancement journey.`,
    },
    {
      id: 'should-worry',
      label: 'Should I be worried?',
      response: `Most development happens in invisible ways — a player can look like they're plateauing and then jump forward in a few weeks. If you have a specific concern, the best first step is a conversation with the coaching team. DONNA can only share approved summaries, not live coaching observations.`,
    },
    {
      id: 'help-motivation',
      label: 'How do I help with motivation?',
      response: `The biggest motivators for young players are: feeling competent, having fun, and feeling connected to their team. Avoid tying results to praise — instead celebrate effort, attitude, and small wins. If ${name} expresses doubt, acknowledge it without fixing it: "That sounds hard. What do you want to do?"`,
    },
  ]
}

export default async function ParentAskDonnaPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let childFirstName: string | null = null
  let focusCategory: string | null = null
  let currentLevelName: string | null = null
  let doingWell: string | null = null

  if (user) {
    const rawDb = supabase as any

    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()

    const academyId = profile?.academy_id ?? null

    if (academyId) {
      const { data: guardian } = await rawDb
        .from('guardians')
        .select('id')
        .eq('profile_id', user.id)
        .eq('academy_id', academyId)
        .maybeSingle()

      if (guardian) {
        const { data: pgRows } = await rawDb
          .from('player_guardians')
          .select('player_id')
          .eq('guardian_id', guardian.id)
          .limit(3)

        const playerIds: string[] = (pgRows ?? []).map((r: any) => r.player_id)

        if (playerIds.length > 0) {
          const { data: playerRow } = await rawDb
            .from('players')
            .select('id, first_name, full_name')
            .eq('id', playerIds[0])
            .eq('academy_id', academyId)
            .eq('is_active', true)
            .maybeSingle()

          if (playerRow) {
            childFirstName = playerRow.first_name ?? playerRow.full_name ?? null

            const { data: priority } = await rawDb
              .from('player_priorities')
              .select('category')
              .eq('player_id', playerRow.id)
              .eq('academy_id', academyId)
              .eq('priority_rank', 1)
              .eq('is_active', true)
              .maybeSingle()
            focusCategory = priority?.category ?? null

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
                .select('display_name')
                .eq('id', levelId)
                .single()
              currentLevelName = lvl?.display_name ?? null

              const { data: clData } = await rawDb
                .from('curriculum_coach_language')
                .select('doing_well')
                .eq('level_id', levelId)
                .limit(1)
              if (clData?.[0]?.doing_well) {
                doingWell = sanitizeParentFacingText(clData[0].doing_well)
              }
            }
          }
        }
      }
    }
  }

  const name = childFirstName ?? 'your child'
  const chips = buildChips(name, focusCategory, currentLevelName, doingWell)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-2">
        <p className="page-eyebrow">Ask DONNA</p>
        <h1 className="page-title">Parent Guide</h1>
        <p className="page-subtitle">Guidance on supporting your child at home and after practice.</p>
      </div>

      {/* Guardrails notice */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-status-blue/5 border border-status-blue/20">
        <Shield className="w-4 h-4 text-status-blue shrink-0" />
        <p className="text-xs text-status-blue leading-relaxed">
          DONNA shares coach-approved guidance only. No rankings, no comparisons, no private notes.
        </p>
      </div>

      {/* Interactive chat */}
      <ParentDonnaChat chips={chips} />

      {/* Helpful links */}
      <div className="rounded-xl bg-surface-raised border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-text-primary">More Support</p>
        </div>
        <div className="divide-y divide-border">
          {[
            { href: '/parent/progress', label: 'Progress Overview', desc: 'Level and development summary' },
            { href: '/parent/updates', label: 'Coach Updates', desc: 'Director-approved summaries' },
            { href: '/parent', label: 'Home', desc: 'Full support guide and attendance' },
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
        DONNA provides parent guidance only. For coaching questions, speak directly with your child's coach.
      </p>
    </div>
  )
}
