'use client'

import Link from 'next/link'
import { ShieldCheck, AlertTriangle, Zap, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react'
import type { DecisionExecutionPlan } from '@/lib/donna/execution/donnaDecisionExecutionTypes'

const CONFIDENCE_BADGE: Record<DecisionExecutionPlan['confidence'], { label: string; cls: string }> = {
  high:   { label: 'High confidence',   cls: 'text-status-green bg-status-green/10 border-status-green/20' },
  medium: { label: 'Medium confidence', cls: 'text-status-orange bg-status-orange/10 border-status-orange/20' },
  low:    { label: 'Low confidence',    cls: 'text-text-muted bg-surface-raised border-border' },
}

interface Props {
  plan: DecisionExecutionPlan
}

function dispatchDonna(prompt: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('donna:open', { detail: { prompt } }))
  }
}

export function TodayActionExpansionPanel({ plan }: Props) {
  const badge = CONFIDENCE_BADGE[plan.confidence]

  const primaryAction = plan.actions.find(a => a.isPrimary) ?? plan.actions[0]
  const secondaryActions = plan.actions.filter(a => !a.isPrimary)

  return (
    <div className="ml-7 mt-2 mb-1 rounded-xl border border-lime/10 bg-lime/[0.02] p-3 space-y-3">

      {/* Recommendation + confidence */}
      <div className="flex items-start gap-2">
        <Zap className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[11px] font-semibold text-lime uppercase tracking-widest">Recommendation</p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-[12px] text-text-primary leading-relaxed">{plan.recommendation}</p>
        </div>
      </div>

      {/* Evidence */}
      {plan.evidence.length > 0 && (
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Evidence</p>
            {plan.evidence.map((e, i) => (
              <p key={i} className="text-[11px] text-text-secondary leading-relaxed">• {e}</p>
            ))}
          </div>
        </div>
      )}

      {/* Risk if ignored */}
      {plan.risks.length > 0 && (
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Risk if ignored</p>
            {plan.risks.map((r, i) => (
              <p key={i} className="text-[11px] text-text-secondary leading-relaxed">• {r}</p>
            ))}
          </div>
        </div>
      )}

      {/* Approval guardrail */}
      {plan.approvalRequired && plan.approvalGuardrail && (
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-status-blue shrink-0 mt-0.5" />
          <p className="text-[11px] text-text-muted italic leading-relaxed">{plan.approvalGuardrail}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {primaryAction && !primaryAction.href.startsWith('donna:') && (
          <Link
            href={primaryAction.href}
            className="flex items-center gap-1 text-[11px] font-semibold text-base bg-lime text-black px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            {primaryAction.label}
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}
        {secondaryActions.map((action, i) => {
          if (action.href.startsWith('donna:')) {
            const prompt = action.href.slice('donna:'.length)
            return (
              <button
                key={i}
                type="button"
                onClick={() => dispatchDonna(prompt)}
                className="flex items-center gap-1 text-[11px] text-text-muted hover:text-lime border border-border/60 hover:border-lime/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Sparkles className="w-3 h-3 shrink-0" />
                Ask DONNA
              </button>
            )
          }
          return (
            <Link
              key={i}
              href={action.href}
              className="text-[11px] text-text-secondary hover:text-text-primary border border-border/60 px-3 py-1.5 rounded-lg transition-colors"
            >
              {action.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
