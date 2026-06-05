import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import type { CurriculumRankingResult } from '@/lib/curriculum/curriculumAttentionRanking'

interface Props {
  ranking: CurriculumRankingResult
  versionStatus: 'none' | 'draft' | 'active'
}

interface Brief {
  line1: string
  line2: string
  ctaLabel?: string
  ctaHref?: string
}

function buildBrief(
  ranking: CurriculumRankingResult,
  versionStatus: 'none' | 'draft' | 'active',
): Brief {
  if (versionStatus === 'none') {
    return {
      line1: "Your curriculum spine isn't active yet.",
      line2: 'Start setup to activate the Academy OS starter spine and unlock player intelligence.',
      ctaLabel: 'Start Setup',
      ctaHref: '/director/onboarding/curriculum',
    }
  }

  if (versionStatus === 'draft') {
    return {
      line1: 'Your curriculum spine is in draft.',
      line2: 'Approve it to activate player curriculum connections and unlock progression intelligence.',
      ctaLabel: 'Continue Setup',
      ctaHref: '/director/onboarding/curriculum',
    }
  }

  if (!ranking.hasData) {
    return {
      line1: 'Your curriculum spine is active.',
      line2: 'Assign players to curriculum levels to unlock player progression intelligence.',
      ctaLabel: 'View Players',
      ctaHref: '/director/players',
    }
  }

  const top = ranking.priorities[0]

  if (ranking.attentionScore === 'critical') {
    const blockedCount = ranking.priorities.filter(p => p.stalledPlayers > 0).length
    const lvl = top?.levelName ?? 'a level'
    const stalled = top?.stalledPlayers ?? 0
    const pct = top?.avgCompletionPct ?? 0
    return {
      line1: `${blockedCount} level${blockedCount !== 1 ? 's are' : ' is'} blocking player advancement.`,
      line2: `${lvl} has ${stalled} stalled player${stalled !== 1 ? 's' : ''} at ${pct}% completion — I recommend reviewing it now.`,
      ctaLabel: 'Improve This Level',
      ctaHref: top?.levelKey ? `/director/curriculum?improve=${top.levelKey}` : '/director/curriculum',
    }
  }

  if (ranking.attentionScore === 'needs_attention') {
    const lvl = top?.levelName ?? 'a level'
    const stalled = top?.stalledPlayers ?? 0
    return {
      line1: `${lvl} needs attention.`,
      line2: `${stalled} player${stalled !== 1 ? 's' : ''} stalled — consider reviewing before the next session.`,
      ctaLabel: 'Review Level',
      ctaHref: top?.levelKey ? `/director/curriculum?improve=${top.levelKey}` : '/director/curriculum',
    }
  }

  return {
    line1: 'Your curriculum looks healthy.',
    line2: 'No levels are actively blocking player advancement right now.',
    ctaLabel: 'Open Builder',
    ctaHref: '/director/curriculum/builder',
  }
}

export function DonnaCurriculumBrief({ ranking, versionStatus }: Props) {
  const brief = buildBrief(ranking, versionStatus)

  return (
    <div
      className="rounded-2xl border border-lime/20 bg-lime/[0.03] p-4 space-y-2"
      data-donna-focus-id="curriculum-brief"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
        <p className="text-[10px] uppercase tracking-widest text-lime font-semibold">DONNA · Curriculum</p>
      </div>
      <p className="text-[13px] font-semibold text-text-primary leading-snug">{brief.line1}</p>
      <p className="text-[12px] text-text-secondary leading-relaxed">{brief.line2}</p>
      {brief.ctaLabel && brief.ctaHref && (
        <Link
          href={brief.ctaHref}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-lime hover:opacity-80 transition-opacity"
        >
          {brief.ctaLabel} →
        </Link>
      )}
    </div>
  )
}
