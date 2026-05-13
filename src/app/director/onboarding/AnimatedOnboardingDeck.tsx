'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react'

// ── Deck content ───────────────────────────────────────────────

interface DeckCard {
  title: string
  body: string
  bullets: string[]
  unlocks: string
}

const DECK_CARDS: DeckCard[] = [
  {
    title: 'Welcome to Academy OS',
    body: 'Your academy, your methodology — powered by a connected system for directors, coaches, players, and parents.',
    bullets: [],
    unlocks: 'Your full setup roadmap',
  },
  {
    title: 'Build your operating system',
    body: 'Academy OS connects curriculum, player development, coach workflow, sessions, and parent communication into one system.',
    bullets: [
      'Curriculum structure',
      'Player profiles',
      'Session planning',
      'Coach execution',
      'Parent clarity',
    ],
    unlocks: 'Your setup map',
  },
  {
    title: 'You define how the academy works',
    body: 'Start by confirming your academy identity and preferences. Your answers shape how the entire system behaves.',
    bullets: [
      'Your levels and language',
      'Your coaching workflow',
      'Approval rules',
      'Launch priorities',
    ],
    unlocks: 'Academy customization',
  },
  {
    title: 'Coaches know exactly what to do',
    body: 'Once setup is complete, coaches see session plans, rosters, player priorities, and structured recap prompts.',
    bullets: [
      'Session objectives',
      'Player watch-fors',
      'Attendance',
      'Wrap-up notes',
    ],
    unlocks: 'Coach session clarity',
  },
  {
    title: 'Player progress becomes visible',
    body: "Curriculum, coach notes, attendance, and session history connect back to each player's development profile.",
    bullets: [
      'Skill path',
      'Competition path',
      'Fitness and load',
      'Next focus area',
    ],
    unlocks: 'Player profile intelligence',
  },
  {
    title: 'Families see what helps, not internal noise',
    body: 'Parents and players receive simple, director-approved guidance about what the player is working on and why.',
    bullets: [
      'Current focus',
      'Progress summary',
      'At-home support',
      'Next step clarity',
    ],
    unlocks: 'Parent and player-safe communication',
  },
  {
    title: 'AI drafts. You approve.',
    body: 'The assistant helps organize setup, structure notes, and suggest next steps — but nothing important publishes without human review.',
    bullets: [
      'AI proposes',
      'Coaches and directors review',
      'Nothing publishes without approval',
    ],
    unlocks: 'AI-assisted review workflows',
  },
]

const JOURNEY_STEPS = [
  'Confirm basics',
  'Customize',
  'Curriculum',
  'Levels + groups',
  'Coach setup',
  'Add players',
  'Launch',
]

// ── Component ──────────────────────────────────────────────────

interface Props {
  nextStepHref: string
  nextStepLabel: string
  completedCount: number
}

export function AnimatedOnboardingDeck({ nextStepHref, nextStepLabel, completedCount }: Props) {
  const [currentCard, setCurrentCard] = useState(0)
  const [collapsed, setCollapsed] = useState(completedCount > 0)
  const [dismissed, setDismissed] = useState(false)

  // After skip — show a compact replay trigger so returning directors can re-open
  if (dismissed) {
    return (
      <button
        onClick={() => { setDismissed(false); setCollapsed(false); setCurrentCard(0) }}
        className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
      >
        <RotateCcw className="w-3 h-3" />
        Replay overview
      </button>
    )
  }

  const card = DECK_CARDS[currentCard]
  const isFirst = currentCard === 0
  const isLast = currentCard === DECK_CARDS.length - 1

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="label-xs">Academy OS Overview</span>
          {completedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-status-green/80 tabular-nums">
              <CheckCircle2 className="w-2.5 h-2.5" />
              {completedCount} of 7 steps done
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!collapsed && (
            <button
              onClick={() => setDismissed(true)}
              className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
            >
              Skip
            </button>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
          >
            {collapsed
              ? <><span>Overview</span><ChevronDown className="w-3 h-3" /></>
              : <><span>Collapse</span><ChevronUp className="w-3 h-3" /></>}
          </button>
        </div>
      </div>

      {/* ── Collapsed state — compact CTA only ── */}
      {collapsed && (
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-sm text-text-secondary leading-snug">
            Not sure where to start? See how everything connects first.
          </p>
          <Link
            href={nextStepHref}
            className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-lime hover:brightness-110 transition-all"
            style={{ color: '#030506' }}
          >
            {nextStepLabel}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* ── Expanded deck ── */}
      {!collapsed && (
        <>
          {/* Card content — key triggers animate-fade-in on every card change */}
          <div className="px-6 pt-5 pb-3 min-h-[200px]">
            <div
              key={currentCard}
              className="animate-fade-in motion-reduce:animate-none"
              style={{ animationDuration: '200ms' }}
            >
              <p className="text-[10px] font-mono text-text-muted tabular-nums mb-3">
                {currentCard + 1} / {DECK_CARDS.length}
              </p>
              <h2 className="text-[15px] font-semibold text-text-primary leading-snug mb-2">
                {card.title}
              </h2>
              <p className="text-[13px] text-text-secondary leading-relaxed mb-3">
                {card.body}
              </p>
              {card.bullets.length > 0 && (
                <ul className="space-y-1.5 mb-4">
                  {card.bullets.map(bullet => (
                    <li
                      key={bullet}
                      className="flex items-center gap-2 text-[12px] text-text-secondary"
                    >
                      <span className="w-1 h-1 rounded-full bg-lime opacity-60 shrink-0" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-lime/10 border border-lime/20">
                <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
                  Unlocks
                </span>
                <span className="text-[11px] font-medium text-lime">{card.unlocks}</span>
              </div>
            </div>
          </div>

          {/* ── Navigation row ── */}
          <div className="px-6 pb-5 flex items-center justify-between">
            {/* Dot progress indicator */}
            <div className="flex items-center gap-1.5">
              {DECK_CARDS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentCard(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === currentCard
                      ? 'w-5 h-1.5 bg-lime'
                      : 'w-1.5 h-1.5 bg-border hover:bg-border-strong'
                  }`}
                  aria-label={`Go to card ${i + 1}`}
                />
              ))}
            </div>

            {/* Prev / Next / Start CTA */}
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={() => setCurrentCard(c => c - 1)}
                  className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors px-2.5 py-1.5 rounded-lg border border-border hover:border-border-strong"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Back
                </button>
              )}
              {!isLast ? (
                <button
                  onClick={() => setCurrentCard(c => c + 1)}
                  className="flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-lime transition-colors px-2.5 py-1.5 rounded-lg border border-border hover:border-lime/30"
                >
                  Next
                  <ChevronRight className="w-3 h-3" />
                </button>
              ) : (
                <Link
                  href={nextStepHref}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-lg bg-lime hover:brightness-110 transition-all"
                  style={{ color: '#030506' }}
                >
                  Start Academy Setup
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* ── Setup journey strip ── */}
          <div className="border-t border-border px-5 py-4">
            <p className="label-xs mb-2.5">Setup journey</p>
            <div className="flex gap-1.5">
              {JOURNEY_STEPS.map((label, i) => {
                const done = i < completedCount
                const active = i === completedCount
                return (
                  <div key={i} className="flex-1 flex flex-col items-start gap-1 min-w-0">
                    <div
                      className={`w-full h-1 rounded-full transition-colors duration-300 ${
                        done ? 'bg-lime' : active ? 'bg-lime/30' : 'bg-border'
                      }`}
                    />
                    <span
                      className={`text-[9px] font-medium leading-tight truncate w-full ${
                        done
                          ? 'text-lime/70'
                          : active
                          ? 'text-text-secondary'
                          : 'text-text-muted/40'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
