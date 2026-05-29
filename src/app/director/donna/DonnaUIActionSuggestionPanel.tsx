// Sprint 924 — DONNA Safe UI Action Suggestions V1
// Shows safe DONNA action suggestions grouped by safety class.
// Each suggestion explains what it does and whether approval is required.
// Read-only UI surface — no mutations.

'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, Lock } from 'lucide-react'
import {
  getUIActionsForPage,
  type UIAction,
  type UIActionSafetyClass,
} from '@/lib/donna/donnaUIActionRegistry'
import { Card, CardContent } from '@/components/ui'

const SAFETY_CHIP: Record<UIActionSafetyClass, { label: string; style: string }> = {
  always_safe:       { label: 'Safe',          style: 'bg-status-green/10 text-status-green border-status-green/20' },
  safe_with_context: { label: 'Safe w/ auth',  style: 'bg-lime/10 text-lime border-lime/20' },
  draft_to_review:   { label: 'Creates draft', style: 'bg-status-blue/10 text-status-blue border-status-blue/20' },
  director_approval: { label: 'Needs approval', style: 'bg-status-orange/10 text-status-orange border-status-orange/20' },
  platform_required: { label: 'Platform only', style: 'bg-surface-raised text-text-muted border-border' },
  always_blocked:    { label: 'Blocked',        style: 'bg-status-red/10 text-status-red border-status-red/20' },
}

interface Props {
  pathname: string
}

const SHOW_CLASSES: UIActionSafetyClass[] = ['always_safe', 'safe_with_context', 'draft_to_review']
const APPROVAL_CLASSES: UIActionSafetyClass[] = ['director_approval']

function ActionRow({ action }: { action: UIAction }) {
  const chip = SAFETY_CHIP[action.safetyClass]
  const example = action.naturalLanguageExamples[0] ?? null
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <p className="text-xs font-semibold text-text-primary">{action.displayName}</p>
          <span className={`text-[9px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded-full border ${chip.style}`}>
            {chip.label}
          </span>
        </div>
        <p className="text-[11px] text-text-secondary leading-snug">{action.description}</p>
        {example && (
          <p className="text-[11px] text-text-muted mt-0.5 italic">
            Try: &ldquo;{example}&rdquo;
          </p>
        )}
        {action.requiresApproval && action.approvalRoute && (
          <p className="text-[10px] text-status-orange mt-0.5 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
            Routes to Review Queue before taking effect
          </p>
        )}
      </div>
    </div>
  )
}

export function DonnaUIActionSuggestionPanel({ pathname }: Props) {
  const [expanded, setExpanded] = useState(false)

  const allActions = getUIActionsForPage(pathname)
  const safeActions = allActions.filter(a =>
    (SHOW_CLASSES as UIActionSafetyClass[]).includes(a.safetyClass) &&
    (a.implementationStatus === 'wired' || a.implementationStatus === 'partially_wired')
  ).slice(0, 8)
  const approvalActions = allActions.filter(a =>
    (APPROVAL_CLASSES as UIActionSafetyClass[]).includes(a.safetyClass) &&
    a.implementationStatus === 'wired'
  ).slice(0, 3)

  if (safeActions.length === 0 && approvalActions.length === 0) return null

  const displaySafe = expanded ? safeActions : safeActions.slice(0, 3)

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="label-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-lime" />
            Safe Actions on This Page
          </p>
          {safeActions.length > 3 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-[10px] text-text-muted hover:text-lime transition-colors"
            >
              {expanded ? 'Show less' : `+${safeActions.length - 3} more`}
            </button>
          )}
        </div>

        <div>
          {displaySafe.map(a => <ActionRow key={a.id} action={a} />)}
        </div>

        {approvalActions.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="label-xs flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-status-orange" />
              Approval Required
            </p>
            {approvalActions.map(a => <ActionRow key={a.id} action={a} />)}
          </div>
        )}

        <div className="flex items-center gap-1.5 pt-1">
          <ShieldCheck className="w-3 h-3 text-text-muted shrink-0" />
          <p className="text-[10px] text-text-muted">
            High-risk actions route to Review Queue — DONNA never auto-executes them.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
