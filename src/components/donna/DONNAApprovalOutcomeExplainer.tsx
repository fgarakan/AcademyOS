'use client'

// Sprint 625 — Director Approval Flow Polish V1
// Inline outcome explainer — shows the director exactly what happens after each decision.
// Display only — no DB writes, no actions.

import { CheckCircle2, HelpCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApprovalDraftCategory =
  | 'wrap_up'
  | 'parent_draft'
  | 'attendance_exception'
  | 'curriculum_override'
  | 'level_readiness'
  | 'voice_intake'
  | 'general'

export interface DONNAApprovalOutcomeExplainerProps {
  category: ApprovalDraftCategory
  playerName?: string
  defaultOpen?: boolean
  className?: string
}

// ── Outcome copy per category ─────────────────────────────────────────────────

interface OutcomeCopy {
  approve: string
  clarify: string
  reject: string
}

const OUTCOME_COPY: Record<ApprovalDraftCategory, OutcomeCopy> = {
  wrap_up: {
    approve: 'Wrap-up is marked ready for application. Coach observations become eligible for the player profile. Nothing auto-applies.',
    clarify: 'Draft is flagged for the coach to revise. Coach is notified that clarification is needed before this can be approved.',
    reject: 'Wrap-up draft is discarded. Coach is notified. No player data is affected.',
  },
  parent_draft: {
    approve: 'Draft moves to the parent portal queue. No message is sent — parent sees it only when they log in. External send is not configured.',
    clarify: 'Draft is returned for revision. Parent is not notified. No content is visible outside the academy.',
    reject: 'Draft is removed. Parent sees nothing. No external communication is triggered.',
  },
  attendance_exception: {
    approve: 'Exception is marked approved. Attendance record can now be amended in the next application step. No change happens automatically.',
    clarify: 'Exception is flagged for the submitting coach to provide more context before a decision is made.',
    reject: 'Exception is declined. Attendance record stays as originally recorded. Coach is notified.',
  },
  curriculum_override: {
    approve: 'Override is approved. A curriculum_overrides record will be written (not modifying template_blocks). Template is protected.',
    clarify: 'Override is sent back for clarification. Curriculum remains unchanged until approved.',
    reject: 'Override is declined. Curriculum plan stays as-is. Coach is notified.',
  },
  level_readiness: {
    approve: 'Level readiness flag is cleared. Player remains at current level until a separate level-up action is formally submitted and approved.',
    clarify: 'Flag is returned for more evidence. Player level is unchanged.',
    reject: 'Flag is dismissed. Player remains at current level. No promotion action is taken.',
  },
  voice_intake: {
    approve: 'Voice intake is accepted and routed to the appropriate follow-up queue. No automatic mutation occurs.',
    clarify: 'Voice intake is flagged as ambiguous. Returns to the originating coach for review.',
    reject: 'Voice intake is discarded. No data changes. Coach may re-submit if the intent was valid.',
  },
  general: {
    approve: 'Draft is approved. It moves to the application queue and will be applied in a subsequent step.',
    clarify: 'Draft is returned for clarification before a final decision can be made.',
    reject: 'Draft is declined and removed from the queue. No changes are applied.',
  },
}

// ── Outcome row ───────────────────────────────────────────────────────────────

function OutcomeRow({
  icon,
  label,
  description,
  colorClass,
}: {
  icon: React.ReactNode
  label: string
  description: string
  colorClass: string
}) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-border/40 last:border-0">
      <div className={`mt-0.5 shrink-0 ${colorClass}`}>{icon}</div>
      <div>
        <p className={`text-[11px] font-medium mb-0.5 ${colorClass}`}>{label}</p>
        <p className="text-[10px] text-text-muted leading-snug">{description}</p>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNAApprovalOutcomeExplainer({
  category,
  playerName,
  defaultOpen = false,
  className = '',
}: DONNAApprovalOutcomeExplainerProps) {
  const [open, setOpen] = useState(defaultOpen)
  const copy = OUTCOME_COPY[category]

  return (
    <div className={`rounded-lg border border-border/60 bg-surface-raised overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface transition-colors"
      >
        <span className="text-[11px] text-text-muted">
          What happens after each decision
          {playerName ? ` · ${playerName}` : ''}
        </span>
        {open
          ? <ChevronUp className="w-3 h-3 text-text-muted shrink-0" />
          : <ChevronDown className="w-3 h-3 text-text-muted shrink-0" />
        }
      </button>

      {open && (
        <div className="px-3 pb-1 border-t border-border/40">
          <OutcomeRow
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            label="If approved"
            description={copy.approve}
            colorClass="text-status-green"
          />
          <OutcomeRow
            icon={<HelpCircle className="w-3.5 h-3.5" />}
            label="If needs clarification"
            description={copy.clarify}
            colorClass="text-status-orange"
          />
          <OutcomeRow
            icon={<XCircle className="w-3.5 h-3.5" />}
            label="If rejected"
            description={copy.reject}
            colorClass="text-status-red"
          />
        </div>
      )}
    </div>
  )
}
