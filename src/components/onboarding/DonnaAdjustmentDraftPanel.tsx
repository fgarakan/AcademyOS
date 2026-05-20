'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, CheckCircle2, X, Pencil } from 'lucide-react'
import type { OnboardingDraft } from './OnboardingShell'

// ── Types ─────────────────────────────────────────────────────

interface ProposalTemplate {
  id: string
  title: string
  explanation: string
  changes: string[]
  affectedAreas: string[]
  category: 'coaching' | 'session' | 'parent' | 'player' | 'identity'
  keywords: string[]
  apply: (draft: OnboardingDraft) => Partial<OnboardingDraft>
}

interface ActiveProposal {
  key: string
  templateId: string
  title: string
  explanation: string
  changes: string[]
  affectedAreas: string[]
  requestText: string
  apply: (draft: OnboardingDraft) => Partial<OnboardingDraft>
}

interface ChatMessage {
  role: 'user' | 'donna'
  text: string
}

// ── Proposal templates ────────────────────────────────────────

const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  {
    id: 'add-game-based',
    title: 'Add Game-Based Learning',
    explanation: 'Adds game-based learning to coaching DNA and weights session templates toward constraint games and live-ball development.',
    changes: [
      'Add "Game-Based Learning" to coaching styles',
      'Session templates will lead with constraint games and live-ball blocks',
      'Coach prompts will emphasize tactical problem-solving over isolated drills',
    ],
    affectedAreas: ['Coaching Philosophy', 'Session Design', 'Future Templates'],
    category: 'coaching',
    keywords: ['game-based', 'game based', 'constraint', 'live ball', 'games'],
    apply: (d) => ({
      coachingStyles: d.coachingStyles.includes('game-based')
        ? d.coachingStyles
        : [...d.coachingStyles.slice(0, 2), 'game-based'],
    }),
  },
  {
    id: 'add-tactical',
    title: 'Prioritize Tactical Development',
    explanation: 'Adds Tactical IQ to the top of development priorities and tunes session prompts toward decision-making and point construction.',
    changes: [
      'Add "Tactical IQ" as a top development priority',
      'Session templates will include tactical problem-solving blocks',
      'Coach prompts will emphasize court awareness and decision-making',
    ],
    affectedAreas: ['Player Development', 'Session Design', 'Coach Defaults'],
    category: 'session',
    keywords: ['tactical', 'tactics', 'decision', 'point construction', 'court awareness', 'strategy'],
    apply: (d) => ({
      developmentPriorities: d.developmentPriorities.includes('tactical-iq')
        ? d.developmentPriorities
        : ['tactical-iq', ...d.developmentPriorities.filter(p => p !== 'tactical-iq').slice(0, 4)],
    }),
  },
  {
    id: 'add-fitness',
    title: 'Add Fitness Emphasis to Sessions',
    explanation: 'Adds fitness integration to the session structure so physical development is built into every default template.',
    changes: [
      'Add "Fitness Integrated" to session blocks',
      'Session templates will include a dedicated fitness block',
      'Add "Movement Quality" to development priorities',
    ],
    affectedAreas: ['Session Design', 'Player Development', 'Future Templates'],
    category: 'session',
    keywords: ['fitness', 'physical', 'movement', 'conditioning', 'athletic', 'strength'],
    apply: (d) => ({
      sessionBlocks: d.sessionBlocks.includes('fitness-integrated')
        ? d.sessionBlocks
        : [...d.sessionBlocks, 'fitness-integrated'],
      developmentPriorities: d.developmentPriorities.includes('movement-quality')
        ? d.developmentPriorities
        : [...d.developmentPriorities.slice(0, 4), 'movement-quality'],
    }),
  },
  {
    id: 'protect-parents',
    title: 'Maximize Parent Privacy Protection',
    explanation: 'Sets all five parent visibility rules to protected, ensuring sensitive data is hidden from the parent portal.',
    changes: [
      'All 5 parent visibility rules set to protected',
      'Raw coach notes, rankings, and comparisons hidden from parent view',
      'Director notes and unapproved AI drafts blocked from parent portal',
    ],
    affectedAreas: ['Parent Communication', 'DONNA Behavior'],
    category: 'parent',
    keywords: ['parent', 'privacy', 'protect', 'hide', 'visible', 'sensitive'],
    apply: () => ({
      parentVisibilityRules: {
        hideRawCoachNotes: true,
        hideInternalDirectorNotes: true,
        hideRankings: true,
        hideComparisons: true,
        hideUnapprovedAI: true,
      },
    }),
  },
  {
    id: 'add-competition',
    title: 'Add Point Play to Every Session',
    explanation: 'Adds point play progression to default session blocks so competitive practice is built into every template.',
    changes: [
      'Add "Point Play Progression" to session blocks',
      'Sessions include a progression from cooperative to competitive rally to live points',
      'Coach templates will prompt competitive intensity escalation',
    ],
    affectedAreas: ['Session Design', 'Future Templates', 'Coach Defaults'],
    category: 'session',
    keywords: ['competition', 'competitive', 'point play', 'match play', 'live points'],
    apply: (d) => ({
      sessionBlocks: d.sessionBlocks.includes('point-play')
        ? d.sessionBlocks
        : [...d.sessionBlocks, 'point-play'],
    }),
  },
  {
    id: 'player-challenge',
    title: 'Frame Players as Challenge Seekers',
    explanation: 'Sets player mission style to Challenge Seeker, using stretch goals and competitive milestones in the player portal.',
    changes: [
      'Set player mission style to "Challenge Seeker"',
      'Player portal missions will use stretch goal language',
      'Dashboard copy will emphasize competitive milestones',
    ],
    affectedAreas: ['Player Development', 'DONNA Behavior'],
    category: 'player',
    keywords: ['challenge', 'stretch', 'mission', 'goal', 'competitive player'],
    apply: () => ({
      playerMissionStyle: 'challenge-seeker',
    }),
  },
  {
    id: 'calm-voice',
    title: 'Set Calm and Precise Coaching Voice',
    explanation: 'Sets primary coaching communication to Calm + Precise, using low-noise, technical language in coach notes and cues.',
    changes: [
      'Set primary communication to "Calm + Precise"',
      'Coach notes and session cues will use technical, precise language',
      'Parent communication will adopt a measured, professional tone',
    ],
    affectedAreas: ['Coaching Philosophy', 'Parent Communication', 'Coach Defaults'],
    category: 'coaching',
    keywords: ['calm', 'precise', 'quiet', 'technical', 'low noise', 'measured'],
    apply: () => ({
      primaryCommunication: 'calm-precise',
    }),
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  coaching: 'bg-lime/8 border-lime/20 text-lime',
  session:  'bg-status-blue/8 border-status-blue/20 text-status-blue',
  parent:   'bg-status-orange/8 border-status-orange/20 text-status-orange',
  player:   'bg-status-green/8 border-status-green/20 text-status-green',
  identity: 'bg-surface-raised border-border text-text-muted',
}

const CATEGORY_LABELS: Record<string, string> = {
  coaching: 'Coaching',
  session:  'Session',
  parent:   'Parent',
  player:   'Player',
  identity: 'Identity',
}

function matchTemplate(text: string): ProposalTemplate | null {
  const lower = text.toLowerCase()
  for (const t of PROPOSAL_TEMPLATES) {
    if (t.keywords.some(k => lower.includes(k))) return t
  }
  return null
}

// ── Component ─────────────────────────────────────────────────

interface Props {
  draft: OnboardingDraft
  updateDraft: (p: Partial<OnboardingDraft>) => void
}

export function DonnaAdjustmentDraftPanel({ draft, updateDraft }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'donna',
      text: "I've reviewed your Academy DNA draft. Select an adjustment below — I'll create a draft proposal for your review before anything changes.",
    },
  ])
  const [inputValue, setInputValue]       = useState('')
  const [activeProposal, setActiveProposal] = useState<ActiveProposal | null>(null)
  const [appliedIds, setAppliedIds]       = useState<string[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeProposal])

  const openProposal = (template: ProposalTemplate, requestText: string) => {
    setMessages(prev => [...prev, { role: 'user', text: requestText }])
    setActiveProposal({
      key:         `${template.id}-${Date.now()}`,
      templateId:  template.id,
      title:       template.title,
      explanation: template.explanation,
      changes:     template.changes,
      affectedAreas: template.affectedAreas,
      requestText,
      apply:       template.apply,
    })
  }

  const openCustomProposal = (requestText: string) => {
    setMessages(prev => [...prev, { role: 'user', text: requestText }])
    setActiveProposal({
      key:         `custom-${Date.now()}`,
      templateId:  'custom',
      title:       'Custom Adjustment Request',
      explanation: "DONNA has noted your request. For immediate changes, use the quick adjustments below — or go back to any previous step to edit fields directly.",
      changes: [
        'Request noted in adjustment history',
        'Use quick adjustments for specific field changes',
        'Go back to any step to edit values directly',
      ],
      affectedAreas: ['DONNA Behavior'],
      requestText,
      apply:       () => ({}),
    })
  }

  const approveProposal = () => {
    if (!activeProposal) return
    const isCustom = activeProposal.templateId === 'custom'
    if (!isCustom) {
      updateDraft(activeProposal.apply(draft))
    }
    setAppliedIds(prev => [...prev, activeProposal.templateId])
    setMessages(prev => [
      ...prev,
      {
        role: 'donna',
        text: isCustom
          ? 'Request acknowledged. Use the quick adjustments or go back to edit fields directly.'
          : `Done. "${activeProposal.title}" applied to your local draft. Nothing is saved until Final Activation.`,
      },
    ])
    setActiveProposal(null)
  }

  const editProposal = () => {
    if (!activeProposal) return
    setInputValue(activeProposal.requestText)
    setActiveProposal(null)
  }

  const cancelProposal = () => {
    if (!activeProposal) return
    setMessages(prev => [
      ...prev,
      { role: 'donna', text: 'Proposal cancelled. No changes were made to your draft.' },
    ])
    setActiveProposal(null)
  }

  const handleChipClick = (template: ProposalTemplate) => {
    if (activeProposal || appliedIds.includes(template.id)) return
    openProposal(template, template.title)
  }

  const handleSend = () => {
    const text = inputValue.trim()
    if (!text || activeProposal) return
    setInputValue('')
    const matched = matchTemplate(text)
    if (matched) {
      openProposal(matched, text)
    } else {
      openCustomProposal(text)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const hasProposalPending = !!activeProposal

  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden">

      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-raised border-b border-border">
        <div className="w-6 h-6 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-3 h-3 text-lime" />
        </div>
        <span className="text-sm font-semibold text-text-primary">Adjust with DONNA</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-lime/60 bg-lime/8 border border-lime/15 rounded px-1.5 py-0.5">
          Draft only
        </span>
      </div>

      {/* Chat thread */}
      <div className="px-4 py-3 space-y-3 max-h-52 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={['flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}
          >
            {msg.role === 'donna' && (
              <div className="w-5 h-5 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-2.5 h-2.5 text-lime" />
              </div>
            )}
            <div className={[
              'max-w-[80%] rounded-xl px-3 py-2 text-[11px] leading-relaxed',
              msg.role === 'donna'
                ? 'bg-surface-raised border border-border text-text-secondary'
                : 'bg-lime/10 border border-lime/20 text-lime',
            ].join(' ')}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Active proposal card */}
      {activeProposal && (
        <div className="px-4 pb-3">
          <div className="rounded-2xl border border-lime/25 overflow-hidden">

            {/* Proposal badge */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-lime/5 border-b border-lime/15">
              <Sparkles className="w-3 h-3 text-lime shrink-0" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-lime/70 flex-1">
                DONNA Proposal
              </span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted/50 bg-surface-raised border border-border rounded px-1.5 py-0.5">
                Draft only
              </span>
            </div>

            {/* Title + explanation */}
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-text-primary mb-1.5">
                {activeProposal.title}
              </p>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                {activeProposal.explanation}
              </p>
            </div>

            {/* Proposed changes */}
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">
                Proposed Changes
              </p>
              <ul className="flex flex-col gap-1.5">
                {activeProposal.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-lime/60 shrink-0 mt-1.5" />
                    <span className="text-[11px] text-text-secondary leading-relaxed">{change}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Affected areas */}
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">
                Affected Areas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeProposal.affectedAreas.map(area => (
                  <span
                    key={area}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-raised border border-border text-[10px] text-text-muted font-medium"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            {/* Safety notice */}
            <div className="px-4 py-2 bg-surface-raised border-b border-border">
              <p className="text-[9px] text-text-muted/50 italic">
                Draft proposal — review before applying. Nothing is saved until Final Activation.
              </p>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
              <button
                onClick={approveProposal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-lime text-base font-semibold text-[11px] hover:brightness-110 transition-all"
              >
                <CheckCircle2 className="w-3 h-3" />
                {activeProposal.templateId === 'custom' ? 'Acknowledge' : 'Approve Change'}
              </button>
              <button
                onClick={editProposal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-text-secondary font-medium text-[11px] hover:text-text-primary hover:border-border-strong transition-all"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={cancelProposal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-muted font-medium text-[11px] hover:text-text-secondary transition-colors"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Quick adjustment chips */}
      <div className="px-4 pb-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">
          {hasProposalPending ? 'Resolve current proposal to continue' : 'Quick Adjustments'}
        </p>
        <div className="flex flex-col gap-1.5">
          {PROPOSAL_TEMPLATES.map(template => {
            const isApplied  = appliedIds.includes(template.id)
            const isDisabled = hasProposalPending || isApplied
            return (
              <button
                key={template.id}
                onClick={() => handleChipClick(template)}
                disabled={isDisabled}
                className={[
                  'flex items-center gap-2 text-left rounded-lg border px-3 py-2 text-[11px] transition-all',
                  isApplied
                    ? 'bg-lime/5 border-lime/15 text-lime/50 cursor-default'
                    : isDisabled
                      ? 'bg-surface border-border text-text-muted/40 cursor-not-allowed'
                      : 'bg-surface border-border text-text-secondary hover:bg-surface-raised hover:border-border-strong hover:text-text-primary',
                ].join(' ')}
              >
                <span className={[
                  'shrink-0 text-[8px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 border',
                  CATEGORY_COLORS[template.category],
                  isDisabled && !isApplied ? 'opacity-40' : '',
                ].join(' ')}>
                  {CATEGORY_LABELS[template.category]}
                </span>
                <span className="flex-1">{template.title}</span>
                {isApplied && (
                  <span className="text-[9px] font-semibold text-lime/60 shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Applied
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Text input */}
      <div className="px-4 pb-4">
        <div className={[
          'flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors',
          hasProposalPending ? 'border-border/40' : 'border-border bg-surface-raised',
        ].join(' ')}>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={hasProposalPending}
            placeholder={hasProposalPending ? 'Resolve the current proposal first...' : 'Tell DONNA what to adjust...'}
            className="flex-1 bg-transparent text-[11px] text-text-secondary placeholder:text-text-muted outline-none disabled:opacity-40"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || hasProposalPending}
            className={[
              'p-1 rounded-lg transition-all',
              inputValue.trim() && !hasProposalPending
                ? 'text-lime hover:bg-lime/10'
                : 'text-text-muted/30 cursor-not-allowed',
            ].join(' ')}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[9px] text-text-muted/40 mt-1.5 text-center">
          Draft adjustments only — nothing applied until Activation Checklist.
        </p>
      </div>

    </div>
  )
}
