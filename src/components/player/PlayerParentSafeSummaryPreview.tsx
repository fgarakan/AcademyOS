// PlayerParentSafeSummaryPreview — Sprint 1062
// Director-facing preview of what parents/players could safely see.
// Shows approved content alongside what is intentionally hidden.
// Preview only. No sending. No publishing. No parent access via this component.
// Requires approval before parent/player visibility.

import { Eye, Lock, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import type { ParentSafeSummaryData } from '@/lib/players/playerEvidenceRepository'

interface Props {
  parentSafeData: ParentSafeSummaryData | null
  isSchemaMissing: boolean
  playerFirstName: string | null
  currentFocus: string | null
  nextStep: string | null
  parentSupportTip: string | null
}

const HIDDEN_ITEMS = [
  'Raw coach observation notes',
  'Internal director comments and flags',
  'Assessment scores and benchmark comparisons',
  'Sensitive behavioral or injury flags',
  'Unapproved AI interpretations',
  'Rankings or comparisons to other players',
]

export function PlayerParentSafeSummaryPreview({
  parentSafeData,
  isSchemaMissing,
  playerFirstName,
  currentFocus,
  nextStep,
  parentSupportTip,
}: Props) {
  const firstName = playerFirstName ?? 'This player'

  const summary = parentSafeData?.developmentSummary ?? null
  const parentSafeRequirements = parentSafeData?.parentSafeRequirements ?? []
  const parentSafeEvidenceLinks = parentSafeData?.parentSafeEvidenceLinks ?? []

  const hasApprovedSummary = summary?.showToParent ?? false
  const workingOn = summary?.thingsToWorkOn ?? []
  const strengths = summary?.currentStrengths ?? []
  const devFocus = summary?.developmentFocus ?? currentFocus

  const approvedItemCount = (hasApprovedSummary ? 1 : 0) + parentSafeRequirements.length + parentSafeEvidenceLinks.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-status-blue/10 border border-status-blue/20 flex items-center justify-center shrink-0">
            <Eye className="w-4 h-4 text-status-blue" />
          </div>
          <div>
            <p className="font-semibold text-text-primary text-sm">Parent-Safe Summary Preview</p>
            <p className="text-text-muted text-[10px] uppercase tracking-widest">Director view — preview only</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Approval requirement banner */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-status-orange/5 border border-status-orange/20">
          <ShieldCheck className="w-4 h-4 text-status-orange shrink-0" />
          <p className="text-xs text-status-orange leading-relaxed">
            Requires approval before parent/player visibility. Nothing shown here is sent automatically.
          </p>
        </div>

        {/* Schema warning */}
        {isSchemaMissing && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border">
            <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0" />
            <p className="text-xs text-text-secondary">Schema not yet deployed — showing available data only.</p>
          </div>
        )}

        {/* What would be shown to parents */}
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-status-blue flex items-center gap-1.5">
            <Eye className="w-3 h-3" /> What parents could see ({approvedItemCount} approved items)
          </p>

          {/* Development focus */}
          {devFocus && (
            <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">What {firstName} is working on</p>
              <p className="text-xs text-text-secondary leading-relaxed">{devFocus}</p>
            </div>
          )}

          {/* Approved strengths */}
          {strengths.length > 0 && hasApprovedSummary && (
            <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Recent progress</p>
              <ul className="space-y-1">
                {strengths.slice(0, 2).map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-status-green shrink-0 mt-0.5" />
                    <p className="text-xs text-text-secondary leading-relaxed">{s}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Things to work on */}
          {workingOn.length > 0 && hasApprovedSummary && (
            <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Next focus</p>
              <p className="text-xs text-text-secondary leading-relaxed">{workingOn[0]}</p>
            </div>
          )}

          {/* Parent support tip */}
          {parentSupportTip && (
            <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">How parent can support</p>
              <p className="text-xs text-text-secondary leading-relaxed italic">{parentSupportTip}</p>
            </div>
          )}

          {/* Next step */}
          {nextStep && (
            <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Next development step</p>
              <p className="text-xs text-text-secondary leading-relaxed">{nextStep}</p>
            </div>
          )}

          {/* Parent-safe requirements */}
          {parentSafeRequirements.length > 0 && (
            <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-text-muted">
                Parent-visible requirements ({parentSafeRequirements.length})
              </p>
              {parentSafeRequirements.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <p className="text-xs text-text-secondary truncate">{r.requirementTitle}</p>
                  <span className="text-[10px] text-text-muted shrink-0">{r.evidenceCount} obs</span>
                </div>
              ))}
              {parentSafeRequirements.length > 3 && (
                <p className="text-[10px] text-text-muted">+{parentSafeRequirements.length - 3} more</p>
              )}
            </div>
          )}

          {approvedItemCount === 0 && !devFocus && !nextStep && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
              <AlertCircle className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <p className="text-xs text-text-muted">No approved parent-safe content available yet. Approve a development summary to enable parent view.</p>
            </div>
          )}
        </div>

        {/* What is hidden */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-text-muted flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> Intentionally hidden from parents
          </p>
          <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5 space-y-2">
            {HIDDEN_ITEMS.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <Lock className="w-2.5 h-2.5 text-text-muted shrink-0 mt-0.5" />
                <p className="text-xs text-text-muted leading-snug">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-text-muted text-center">
          Parent/player visibility controlled by `show_to_parent` and `is_parent_safe` flags. Director approval required.
        </p>
      </CardContent>
    </Card>
  )
}
