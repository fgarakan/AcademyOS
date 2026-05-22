'use client'

// Sprint 621 — DONNA presence chips for KPI, Dashboard, and Players routes
// All components fire donna:open CustomEvent — read-only, no mutations.

import { MessageSquare } from 'lucide-react'
import {
  buildKpiPageDonnaPrompt,
  buildDashboardDonnaPrompt,
  buildPlayersPageDonnaPrompt,
  buildKpiExplainAnswer,
  buildKpiPriorityAnswer,
  buildDashboardPriorityAnswer,
  buildRosterAttentionAnswer,
  type KpiPageDonnaContext,
  type DashboardDonnaContext,
  type PlayersPageDonnaContext,
  type DonnaInlineAnswer,
} from '@/lib/donna/directorKpiDonnaContext'

function fireDonna(prompt: string, donnaAnswer?: DonnaInlineAnswer) {
  window.dispatchEvent(new CustomEvent('donna:open', { detail: { prompt, donnaAnswer } }))
}

// ── Shared chip ───────────────────────────────────────────────────────────────

function DonnaChip({
  label,
  prompt,
  donnaAnswer,
}: {
  label: string
  prompt: string
  donnaAnswer?: DonnaInlineAnswer
}) {
  return (
    <button
      onClick={() => fireDonna(prompt, donnaAnswer)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border hover:border-lime/40 hover:bg-surface transition-colors cursor-pointer text-left"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />
      <p className="text-xs text-text-secondary">{label}</p>
    </button>
  )
}

// ── KPI Explainer Panel — three suggestion chips for /director/kpi ────────────

export interface DonnaKpiExplainerPanelProps extends KpiPageDonnaContext {}

export function DonnaKpiExplainerPanel(props: DonnaKpiExplainerPanelProps) {
  const chips = [
    {
      label: 'Explain these KPIs',
      prompt: buildKpiPageDonnaPrompt(props, 'Explain what these KPI signals mean for the academy.'),
      donnaAnswer: buildKpiExplainAnswer(props),
    },
    {
      label: 'What should I look at first?',
      prompt: buildKpiPageDonnaPrompt(props, 'Which signal needs my attention first and why?'),
      donnaAnswer: buildKpiPriorityAnswer(props),
    },
    {
      label: 'Which KPI needs the most attention?',
      prompt: buildKpiPageDonnaPrompt(props, 'Which KPI is furthest from target? What does that mean for the academy?'),
      donnaAnswer: buildKpiPriorityAnswer(props),
    },
  ]

  return (
    <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-3.5 h-3.5 text-lime shrink-0" />
        <p className="text-[11px] uppercase tracking-widest font-semibold text-lime/80">Ask DONNA</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map(chip => (
          <DonnaChip key={chip.label} label={chip.label} prompt={chip.prompt} donnaAnswer={chip.donnaAnswer} />
        ))}
      </div>
      <p className="text-[10px] text-text-muted">
        DONNA reads available academy signals. No changes are made. Explanations are based on visible data only.
      </p>
    </div>
  )
}

// ── Dashboard Presence CTA — "What should I do first?" for /director ─────────

export interface DonnaDashboardPresenceCTAProps extends DashboardDonnaContext {}

export function DonnaDashboardPresenceCTA(props: DonnaDashboardPresenceCTAProps) {
  const prompt = buildDashboardDonnaPrompt(props)
  const donnaAnswer = buildDashboardPriorityAnswer(props)

  return (
    <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-3.5 h-3.5 text-lime shrink-0" />
        <p className="text-[11px] uppercase tracking-widest font-semibold text-lime/80">Ask DONNA</p>
      </div>
      <DonnaChip label="What should I do first?" prompt={prompt} donnaAnswer={donnaAnswer} />
      <p className="text-[10px] text-text-muted">
        DONNA reviews available signals and suggests priorities. No changes are made without your approval.
      </p>
    </div>
  )
}

// ── Players Presence CTA — "Who needs attention?" for /director/players ───────

export interface DonnaPlayersPresenceCTAProps extends PlayersPageDonnaContext {}

export function DonnaPlayersPresenceCTA(props: DonnaPlayersPresenceCTAProps) {
  const prompt = buildPlayersPageDonnaPrompt(props)
  const donnaAnswer = buildRosterAttentionAnswer(props)

  return (
    <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-3.5 h-3.5 text-lime shrink-0" />
        <p className="text-[11px] uppercase tracking-widest font-semibold text-lime/80">Ask DONNA</p>
      </div>
      <DonnaChip label="Who needs attention?" prompt={prompt} donnaAnswer={donnaAnswer} />
      <p className="text-[10px] text-text-muted">
        DONNA identifies patterns from available player data. No player records are changed.
      </p>
    </div>
  )
}
