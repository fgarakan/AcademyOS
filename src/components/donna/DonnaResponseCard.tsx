'use client'

// Sprint 1008 — DONNA Response Card UI V1
// Renders a single OrchestratorOutput from the LLM orchestrator.
// Pure display — no navigation, no sessionStorage, no mutations.
//
// Responsibility split:
//   This card: visual rendering + callback triggers only.
//   Parent (Sprint 1011 panel): handles navigation, highlight wiring, session state.
//
// Usage:
//   <DonnaResponseCard
//     output={orchestratorOutput}
//     onNavigate={(route) => router.push(route)}
//     onHighlight={(targetId, route, label) => setDonnaFocusTarget(...) + dispatch donna:highlight}
//   />
//
// Safety invariants:
//   Never renders raw prompts, raw notes, raw IDs, or private player/session data.
//   All text rendered comes from OrchestratorOutput.text which is validated by the safety contract.
//   onNavigate only receives internal routes (/director/..., /coach/...) — validated by orchestrator.

import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  Target,
  Info,
  Zap,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react'
import type { OrchestratorOutput, OrchestratorOutputType } from '@/lib/donna/llmOrchestration/types'

// ── Output type config ────────────────────────────────────────────────────────

interface OutputTypeConfig {
  label: string
  icon: React.ReactNode
  accentClass: string
}

const OUTPUT_TYPE_CONFIG: Record<OrchestratorOutputType, OutputTypeConfig> = {
  answer: {
    label: 'Answer',
    icon: <Info className="w-3 h-3" />,
    accentClass: 'text-text-muted bg-surface border-border',
  },
  recommend_next_action: {
    label: 'Recommended action',
    icon: <Zap className="w-3 h-3" />,
    accentClass: 'text-lime bg-lime/10 border-lime/20',
  },
  highlight_target: {
    label: 'Pointing here',
    icon: <Target className="w-3 h-3" />,
    accentClass: 'text-[#11d9df] bg-[#11d9df]/10 border-[#11d9df]/20',
  },
  explain_action: {
    label: 'Explanation',
    icon: <Info className="w-3 h-3" />,
    accentClass: 'text-status-blue bg-status-blue/10 border-status-blue/20',
  },
  draft_proposed_action: {
    label: 'Draft action',
    icon: <FileText className="w-3 h-3" />,
    accentClass: 'text-status-orange bg-status-orange/10 border-status-orange/20',
  },
  route_to_review: {
    label: 'Review queue',
    icon: <ExternalLink className="w-3 h-3" />,
    accentClass: 'text-status-orange bg-status-orange/10 border-status-orange/20',
  },
  ask_clarifying_question: {
    label: 'Clarifying question',
    icon: <HelpCircle className="w-3 h-3" />,
    accentClass: 'text-text-secondary bg-surface border-border',
  },
}

// ── Confidence config ─────────────────────────────────────────────────────────

const CONFIDENCE_CONFIG = {
  high: {
    label: 'Confident',
    icon: <CheckCircle2 className="w-3 h-3" />,
    className: 'text-status-green bg-status-green/10 border-status-green/20',
  },
  medium: {
    label: 'Estimated',
    icon: <AlertCircle className="w-3 h-3" />,
    className: 'text-status-orange bg-status-orange/10 border-status-orange/20',
  },
  low: {
    label: 'Uncertain',
    icon: <AlertCircle className="w-3 h-3" />,
    className: 'text-text-muted bg-surface border-border',
  },
}

// ── Safety badge ──────────────────────────────────────────────────────────────

const SAFETY_BADGE: Partial<Record<string, { label: string; className: string }>> = {
  review_only: {
    label: 'Draft only',
    className: 'text-text-muted bg-surface border-border',
  },
  approval_gated: {
    label: 'Requires approval',
    className: 'text-status-orange bg-status-orange/10 border-status-orange/20',
  },
}

// ── Route label helper ────────────────────────────────────────────────────────

function routeToLabel(route: string): string {
  const map: Record<string, string> = {
    '/director': 'Director Dashboard',
    '/director/review': 'Review Queue',
    '/director/players': 'Players',
    '/director/groups': 'Groups',
    '/director/curriculum': 'Curriculum',
    '/director/sessions': 'Sessions',
    '/director/templates': 'Templates',
    '/coach': 'Coach Dashboard',
  }
  return map[route] ?? route
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DonnaResponseCardProps {
  output: OrchestratorOutput
  /** Called when director chooses to navigate to a suggested route. No auto-nav. */
  onNavigate?: (route: string) => void
  /** Called when director chooses to activate a highlight target. No side-effects in card. */
  onHighlight?: (targetId: string, route: string, label: string) => void
  /** Optional additional bottom content (e.g., follow-up chips) */
  children?: React.ReactNode
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaResponseCard({
  output,
  onNavigate,
  onHighlight,
  children,
}: DonnaResponseCardProps) {
  const typeCfg = OUTPUT_TYPE_CONFIG[output.type]
  const confCfg = CONFIDENCE_CONFIG[output.confidence]
  const safetyCfg = SAFETY_BADGE[output.safetyLevel]

  const hasNavigateAction =
    (output.suggestedRoute || output.type === 'route_to_review') && onNavigate
  const navigateRoute = output.suggestedRoute ?? '/director/review'

  const hasHighlightAction = output.highlightTarget && onHighlight

  const isApprovalGated = output.safetyLevel === 'approval_gated'
  const isLlmInferred = output.source === 'llm_inferred'

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">

      {/* ── Header row: avatar + type badge ── */}
      <div className="flex items-center gap-2.5 px-3.5 pt-3.5 pb-2">
        <div className="w-7 h-7 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0">
          <span className="text-lime text-[10px] font-bold">D</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${typeCfg.accentClass}`}
        >
          {typeCfg.icon}
          {typeCfg.label}
        </span>
        {isLlmInferred && (
          <span className="ml-auto text-[9px] text-text-muted border border-border rounded-full px-1.5 py-0.5">
            AI
          </span>
        )}
      </div>

      {/* ── Text response ── */}
      <div className="px-3.5 pb-3">
        <p className="text-sm text-text-primary leading-snug whitespace-pre-line">
          {output.text}
        </p>
      </div>

      {/* ── Approval gate warning ── */}
      {isApprovalGated && (
        <div className="flex items-start gap-2 mx-3.5 mb-3 px-2.5 py-2 rounded-lg bg-status-orange/5 border border-status-orange/20">
          <ShieldAlert className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
          <p className="text-[11px] text-status-orange leading-snug">
            This action requires your approval before anything changes.
            Nothing is applied until you confirm in the Review Queue.
          </p>
        </div>
      )}

      {/* ── Meta row: confidence + safety badge ── */}
      <div className="flex items-center gap-2 px-3.5 pb-3">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${confCfg.className}`}
        >
          {confCfg.icon}
          {confCfg.label}
        </span>
        {safetyCfg && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${safetyCfg.className}`}
          >
            {safetyCfg.label}
          </span>
        )}
      </div>

      {/* ── Action row: highlight + navigate ── */}
      {(hasHighlightAction || hasNavigateAction) && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-t border-border/50 bg-surface">
          {hasHighlightAction && (
            <button
              type="button"
              onClick={() =>
                onHighlight!(
                  output.highlightTarget!.targetId,
                  output.highlightTarget!.route,
                  output.highlightTarget!.label,
                )
              }
              className="inline-flex items-center gap-1.5 text-[11px] text-[#11d9df] hover:text-[#11d9df]/80 transition-colors"
            >
              <Target className="w-3 h-3" />
              Focus: {output.highlightTarget!.label}
            </button>
          )}
          {hasHighlightAction && hasNavigateAction && (
            <span className="text-border">·</span>
          )}
          {hasNavigateAction && (
            <button
              type="button"
              onClick={() => onNavigate!(navigateRoute)}
              className="inline-flex items-center gap-1.5 text-[11px] text-lime hover:text-lime/80 transition-colors"
            >
              <ArrowRight className="w-3 h-3" />
              Go to {routeToLabel(navigateRoute)}
            </button>
          )}
        </div>
      )}

      {/* ── Optional child content (follow-up chips, etc.) ── */}
      {children && (
        <div className="px-3.5 pb-3 pt-1 border-t border-border/30">
          {children}
        </div>
      )}
    </div>
  )
}
