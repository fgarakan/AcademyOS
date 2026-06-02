'use client'

// DONNA Suggested Questions V1
//
// Page-specific suggested question chips.
// Clicking a chip fires the question into the adjacent DonnaCommandBar.
//
// Configuration-driven: each route has 3-5 pre-set questions.
// Questions are role-safe and page-aware.

import { MessageCircle } from 'lucide-react'

// ── Question sets per route ────────────────────────────────────────────────────

const PAGE_QUESTIONS: Record<string, string[]> = {
  '/director': [
    'What needs my attention today?',
    'Who is ready for reassessment?',
    'Which parent updates need approval?',
    'Who is stalled?',
  ],
  '/director/players': [
    'Who is stalled?',
    'Who is ready to move up?',
    'Who is overdue for assessment?',
    'Show players missing a level',
  ],
  '/director/players/[id]': [
    'Why this level?',
    'What is blocking progress?',
    'What should the coach focus on?',
    'What should the parent know?',
  ],
  '/director/review': [
    'What should I review first?',
    'Which items are high risk?',
    'Which parent updates are ready?',
    'How many wrap-ups are pending?',
  ],
  '/director/sessions': [
    'Which sessions need wrap-up?',
    'Which coaches have missing notes?',
    'What should today\'s coaches watch for?',
  ],
  '/director/curriculum': [
    'What curriculum gaps need attention?',
    'Which players are blocked by curriculum gates?',
    'What levels need content?',
  ],
  '/director/kpi': [
    'Where does the academy need attention?',
    'Which groups are overloaded?',
    'Which players are at risk?',
  ],
  '/director/today': [
    'What needs my attention today?',
    'What changed since yesterday?',
    'Who should I review first?',
    'What can wait?',
  ],
}

/** Resolve the question set for a given route, including fuzzy matching */
export function getQuestionsForRoute(pagePath: string): string[] {
  // Exact match
  if (PAGE_QUESTIONS[pagePath]) return PAGE_QUESTIONS[pagePath]

  // Player profile: any /director/players/[id]
  if (pagePath.startsWith('/director/players/') && pagePath.split('/').length >= 4) {
    return PAGE_QUESTIONS['/director/players/[id]'] ?? []
  }

  // Prefix match (longest first)
  const sorted = Object.keys(PAGE_QUESTIONS).sort((a, b) => b.length - a.length)
  for (const key of sorted) {
    if (pagePath.startsWith(key)) return PAGE_QUESTIONS[key] ?? []
  }

  // Default
  return [
    'What needs my attention today?',
    'Who needs help?',
    'What should I do first?',
  ]
}

// ── Component ─────────────────────────────────────────────────────────────────

interface DonnaSuggestedQuestionsProps {
  pagePath: string
  /** Called when a chip is clicked with the question text */
  onSelect: (question: string) => void
  /** Optional: override the question set */
  questions?: string[]
}

export function DonnaSuggestedQuestions({
  pagePath,
  onSelect,
  questions,
}: DonnaSuggestedQuestionsProps) {
  const chips = questions ?? getQuestionsForRoute(pagePath)

  if (chips.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <MessageCircle className="w-3 h-3 text-lime/60 shrink-0" />
      {chips.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          className="text-[10px] px-2.5 py-1 rounded-lg border border-lime/15 bg-lime/3 text-lime/80 hover:bg-lime/10 hover:text-lime hover:border-lime/30 transition-all whitespace-nowrap"
        >
          {q}
        </button>
      ))}
    </div>
  )
}
