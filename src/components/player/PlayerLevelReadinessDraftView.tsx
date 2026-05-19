// PlayerLevelReadinessDraftView — Sprint 1061
// Director-facing level readiness draft view.
// Shows evidence supporting and missing for next level advancement.
// CTAs are visual/local-only. No actual level movement. No automatic approval.
// Director-only. No parent/player exposure.

'use client'

import { useState } from 'react'
import { TrendingUp, CheckCircle2, AlertCircle, FileText, MessageSquare, X } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import type { PlayerEvidenceSummary } from '@/lib/players/playerEvidenceRepository'

interface GateRow {
  id: string
  domain: string
  criterion: string
  gate_type: string
  threshold: string
  sort_order: number
}

interface GateStatus {
  gate_id: string
  status: string
  evidence_count: number
}

interface Props {
  currentLevelName: string | null
  nextLevelName: string | null
  evidenceSummary: PlayerEvidenceSummary | null
  gates: GateRow[]
  gateStatuses: Record<string, GateStatus>
  playerFirstName: string | null
}

function getConfidence(
  summary: PlayerEvidenceSummary | null,
  gates: GateRow[],
  gateStatuses: Record<string, GateStatus>
): { label: string; color: string; score: number } {
  if (!summary) return { label: 'Insufficient data', color: 'text-text-muted', score: 0 }

  const passedGates = gates.filter(g => gateStatuses[g.id]?.status === 'passed').length
  const totalGates = gates.length
  const gateRatio = totalGates > 0 ? passedGates / totalGates : 0

  const totalEvidence = summary.totalObservations + summary.requirementEvidenceCount
  const score = Math.round((gateRatio * 0.6 + Math.min(totalEvidence / 10, 1) * 0.4) * 100)

  if (score >= 80) return { label: 'Strong — review recommended', color: 'text-status-green', score }
  if (score >= 50) return { label: 'Moderate — more evidence needed', color: 'text-status-orange', score }
  return { label: 'Early stage — continue developing', color: 'text-text-muted', score }
}

export function PlayerLevelReadinessDraftView({
  currentLevelName,
  nextLevelName,
  evidenceSummary,
  gates,
  gateStatuses,
  playerFirstName,
}: Props) {
  const [showDraft, setShowDraft] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const firstName = playerFirstName ?? 'This player'

  if (dismissed) return null

  const passedGates = gates.filter(g => gateStatuses[g.id]?.status === 'passed')
  const unpassed = gates.filter(g => gateStatuses[g.id]?.status !== 'passed')
  const withEvidence = unpassed.filter(g => (gateStatuses[g.id]?.evidence_count ?? 0) > 0)
  const noEvidence = unpassed.filter(g => (gateStatuses[g.id]?.evidence_count ?? 0) === 0)

  const confidence = getConfidence(evidenceSummary, gates, gateStatuses)

  const totalEvidence = evidenceSummary
    ? evidenceSummary.totalObservations + evidenceSummary.requirementEvidenceCount
    : 0

  const donnaDraftCopy = nextLevelName
    ? `Based on current evidence, ${firstName} has ${passedGates.length} of ${gates.length} gates passed and ${totalEvidence} evidence items recorded. ${noEvidence.length > 0 ? `${noEvidence.length} gate${noEvidence.length !== 1 ? 's' : ''} still need evidence.` : 'All gates have at least some evidence.'} Readiness confidence: ${confidence.label}. Director review recommended before any level decision.`
    : `${firstName} does not have a defined next level target. Assign a next level in the curriculum to enable readiness tracking.`

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-lime" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Level Readiness Draft</p>
              <p className="text-text-muted text-[10px] uppercase tracking-widest">Director view — no automatic advancement</p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-text-muted hover:text-text-secondary transition-colors p-1 rounded"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Level summary */}
        <div className="flex items-center gap-4 px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Current</p>
            <p className="text-sm font-semibold text-text-primary">{currentLevelName ?? 'No level assigned'}</p>
          </div>
          <TrendingUp className="w-4 h-4 text-text-muted shrink-0" />
          <div className="flex-1 min-w-0 text-right">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Next Target</p>
            <p className="text-sm font-semibold text-text-primary">{nextLevelName ?? 'Not set'}</p>
          </div>
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border">
          <TrendingUp className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Readiness confidence</p>
            <p className={`text-xs font-medium ${confidence.color}`}>{confidence.label}</p>
          </div>
        </div>

        {/* Evidence supporting */}
        {passedGates.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Evidence Supporting Advancement</p>
            {passedGates.map(g => (
              <div key={g.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-status-green/5 border border-status-green/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
                <p className="text-xs text-text-secondary leading-snug">{g.criterion}</p>
              </div>
            ))}
            {withEvidence.map(g => (
              <div key={g.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-status-orange/5 border border-status-orange/20">
                <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0" />
                <p className="text-xs text-text-secondary leading-snug">{g.criterion} — partial evidence ({gateStatuses[g.id]?.evidence_count} obs)</p>
              </div>
            ))}
          </div>
        )}

        {/* Evidence missing */}
        {noEvidence.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Evidence Missing</p>
            {noEvidence.map(g => (
              <div key={g.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-raised border border-border">
                <div className="w-3 h-3 rounded-full border-2 border-border shrink-0" />
                <p className="text-xs text-text-muted leading-snug">{g.criterion}</p>
              </div>
            ))}
          </div>
        )}

        {/* DONNA draft copy */}
        {showDraft ? (
          <div className="rounded-xl bg-lime/5 border border-lime/20 px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-lime" />
              <p className="text-[10px] font-semibold text-lime uppercase tracking-widest">DONNA Draft</p>
              <span className="ml-auto text-[10px] text-status-orange border border-status-orange/30 bg-status-orange/10 px-2 py-0.5 rounded-full">
                Requires director review before any action
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{donnaDraftCopy}</p>
            <p className="text-[10px] text-text-muted italic">
              This is a DONNA-generated draft summary. It does not constitute an advancement recommendation. Director must review and decide independently.
            </p>
            <button
              onClick={() => setShowDraft(false)}
              className="text-[10px] text-text-muted underline hover:text-text-secondary"
            >
              Hide draft
            </button>
          </div>
        ) : null}

        {/* CTAs */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => setShowDraft(true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors bg-lime/10 border border-lime/20 text-lime hover:bg-lime/15"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Ask DONNA
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors bg-surface-raised border border-border text-text-secondary hover:border-lime/30"
          >
            <FileText className="w-3.5 h-3.5" />
            Create Review Draft
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-2.5 rounded-xl text-xs font-medium text-text-muted hover:text-text-secondary border border-border transition-colors"
          >
            Not now
          </button>
        </div>

        <p className="text-[10px] text-text-muted text-center">
          No automatic level movement. All decisions require director review and approval.
        </p>
      </CardContent>
    </Card>
  )
}
