'use client'

import { AlertTriangle, CheckCircle, Clock, RotateCcw, Shield, Tag } from 'lucide-react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card'
import {
  SCOPE_BY_ID,
  SCOPE_RISK_COLOR,
  SCOPE_RISK_LABEL,
  type CurriculumChangeDraft,
  type CurriculumChangeDraftStatus,
} from '@/lib/curriculum/curriculumChangeScope'

// ── Affected objects summary ─────────────────────────────────────────────────

export interface CurriculumDraftAffectedSummary {
  playerCount: number
  templateCount: number
  gateCount: number
  groupCount: number
  levelCount: number
}

// ── Status display helpers ───────────────────────────────────────────────────

const STATUS_CONFIG: Record<CurriculumChangeDraftStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: {
    label: 'Draft',
    color: 'text-text-muted border-border',
    icon: <Clock size={12} />,
  },
  pending_review: {
    label: 'Pending Director Review',
    color: 'text-status-orange border-status-orange/30',
    icon: <AlertTriangle size={12} />,
  },
  approved: {
    label: 'Approved — Not Yet Applied',
    color: 'text-status-green border-status-green/30',
    icon: <CheckCircle size={12} />,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-status-red border-status-red/30',
    icon: <AlertTriangle size={12} />,
  },
  applied: {
    label: 'Applied',
    color: 'text-lime border-lime/30',
    icon: <CheckCircle size={12} />,
  },
}

// ── Component ────────────────────────────────────────────────────────────────

interface CurriculumOverrideDraftShellProps {
  draft: CurriculumChangeDraft
  affected?: CurriculumDraftAffectedSummary
  className?: string
}

export function CurriculumOverrideDraftShell({
  draft,
  affected,
  className,
}: CurriculumOverrideDraftShellProps) {
  const scopeDef = SCOPE_BY_ID[draft.scope]
  const statusConfig = STATUS_CONFIG[draft.status]
  const needsRollback = scopeDef?.requiresRollbackNote && !draft.rollbackNote

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          {/* Header */}
          <div className="flex items-start justify-between gap-2 flex-wrap mb-3">
            <div>
              <p className="label-xs mb-1">Curriculum Override Draft</p>
              <p className="text-text-primary font-medium text-sm">{draft.targetObjectLabel}</p>
              <p className="text-xs text-text-muted capitalize mt-0.5">
                {draft.changeType.replace(/_/g, ' ')} · {draft.targetObjectType.replace(/_/g, ' ')}
              </p>
            </div>
            {/* Status badge */}
            <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest border rounded px-2 py-0.5 ${statusConfig.color}`}>
              {statusConfig.icon}
              {statusConfig.label}
            </span>
          </div>

          {/* Scope + risk */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-surface-raised border border-border rounded px-2 py-0.5 text-text-secondary flex items-center gap-1">
              <Tag size={10} />
              {scopeDef?.label ?? draft.scope}
            </span>
            <span className={`font-medium ${SCOPE_RISK_COLOR[scopeDef?.risk ?? 'low']}`}>
              {SCOPE_RISK_LABEL[scopeDef?.risk ?? 'low']}
            </span>
            {scopeDef?.approverLabel && (
              <span className="flex items-center gap-1 text-text-muted">
                <Shield size={10} />
                {scopeDef.approverLabel}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">

            {/* Approval required banner */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-status-orange/5 border border-status-orange/20 text-xs text-status-orange">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Approval required. No curriculum has changed. This draft must be reviewed and approved before any system change occurs.
              </span>
            </div>

            {/* Proposed change */}
            <div>
              <p className="label-xs mb-1">Proposed change</p>
              <p className="text-xs text-text-primary bg-surface-raised border border-border rounded-lg px-3 py-2 leading-relaxed">
                {draft.proposedChange || <span className="text-text-muted italic">Not specified</span>}
              </p>
            </div>

            {/* Reason */}
            <div>
              <p className="label-xs mb-1">Reason</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {draft.reason || <span className="text-text-muted italic">No reason provided</span>}
              </p>
            </div>

            {/* Affected objects */}
            {affected && (
              <div>
                <p className="label-xs mb-2">Affected objects (estimate)</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { label: 'Players', value: affected.playerCount },
                    { label: 'Templates', value: affected.templateCount },
                    { label: 'Gates', value: affected.gateCount },
                    { label: 'Groups', value: affected.groupCount },
                    { label: 'Levels', value: affected.levelCount },
                  ].map(item => (
                    <div key={item.label} className="bg-surface-raised border border-border rounded-lg p-2 text-center">
                      <p className={`text-lg font-mono font-bold ${item.value > 0 ? 'text-lime' : 'text-text-muted'}`}>
                        {item.value}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scope-specific impact labels */}
            {scopeDef && (
              <div className="space-y-1">
                <p className="label-xs mb-1">Scope impact</p>
                <div className="flex flex-wrap gap-2">
                  {scopeDef.affectsTemplates && (
                    <span className="text-[10px] bg-surface-raised border border-border rounded px-2 py-0.5 text-text-secondary">
                      Affects templates
                    </span>
                  )}
                  {scopeDef.affectsPlayers && (
                    <span className="text-[10px] bg-surface-raised border border-border rounded px-2 py-0.5 text-text-secondary">
                      Affects players
                    </span>
                  )}
                  {scopeDef.affectsParentLanguage && (
                    <span className="text-[10px] bg-surface-raised border border-border rounded px-2 py-0.5 text-text-secondary">
                      Affects parent language
                    </span>
                  )}
                  {scopeDef.affectsCoachBriefs && (
                    <span className="text-[10px] bg-surface-raised border border-border rounded px-2 py-0.5 text-text-secondary">
                      Affects coach briefs
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Rollback note */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <RotateCcw size={11} className="text-text-muted" />
                <p className="label-xs">Rollback note</p>
                {scopeDef?.requiresRollbackNote && (
                  <span className="text-[10px] text-status-orange ml-1">Required</span>
                )}
              </div>
              {draft.rollbackNote ? (
                <p className="text-xs text-text-secondary bg-surface-raised border border-border rounded-lg px-3 py-2 leading-relaxed">
                  {draft.rollbackNote}
                </p>
              ) : (
                <p className={`text-xs italic ${needsRollback ? 'text-status-orange' : 'text-text-muted'}`}>
                  {needsRollback
                    ? 'Rollback note required before this scope can be approved.'
                    : 'Not required for this scope.'}
                </p>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted">
              <span>Created by: <span className="text-text-secondary">{draft.createdBy}</span></span>
              <span>
                {new Date(draft.createdAt).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })}
              </span>
              {draft.approvedBy && (
                <span>Approved by: <span className="text-text-secondary">{draft.approvedBy}</span></span>
              )}
            </div>

          </div>
        </CardContent>

        <CardFooter>
          <div className="space-y-1">
            <p className="text-[11px] text-text-muted">
              {scopeDef?.safetyNote}
            </p>
            <p className="text-[10px] text-text-muted italic">
              Nothing changes until a director approves and the execution adapter applies this change.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
