'use client'

import { ChevronDown, ChevronRight, AlertTriangle, Eye, Users, FileText, BookOpen, MessageSquare, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import {
  SCOPE_BY_ID,
  SCOPE_RISK_COLOR,
  SCOPE_RISK_LABEL,
  type CurriculumChangeDraft,
  type CurriculumChangeScopeId,
} from '@/lib/curriculum/curriculumChangeScope'

// ── Impact domain types ──────────────────────────────────────────────────────

export interface ImpactedRequirement {
  gateId: string
  gateName: string
  levelName: string
  affectedPlayerCount: number
  changeDescription: string
}

export interface ImpactedPlayer {
  playerId: string
  playerName: string
  currentLevel: string
  advancementEligible: boolean
  impactDescription: string
}

export interface ImpactedTemplate {
  templateId: string
  templateName: string
  levelName: string
  blockCount: number
  impactDescription: string
}

export interface ImpactedCoachBrief {
  groupName: string
  coachName: string | null
  currentFocus: string
  suggestedFocusChange: string
}

export interface ImpactedParentLanguage {
  contentType: string
  currentText: string
  previewText: string
  isSafeForParent: boolean
}

export interface ImpactedDonnaRecommendation {
  recommendationType: string
  currentBehavior: string
  updatedBehavior: string
}

export interface CurriculumImpactSummary {
  scopeId: CurriculumChangeScopeId
  requirements: ImpactedRequirement[]
  players: ImpactedPlayer[]
  templates: ImpactedTemplate[]
  coachBriefs: ImpactedCoachBrief[]
  parentLanguage: ImpactedParentLanguage[]
  donnaRecommendations: ImpactedDonnaRecommendation[]
  dataNote: string | null
  generatedAt: string
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ImpactSection({
  icon,
  title,
  count,
  children,
  emptyLabel,
  defaultOpen = false,
}: {
  icon: React.ReactNode
  title: string
  count: number
  children: React.ReactNode
  emptyLabel: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-raised transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-text-muted">{icon}</span>
          <span className="text-sm font-medium text-text-primary">{title}</span>
          <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${count > 0 ? 'bg-lime/10 text-lime' : 'bg-surface-raised text-text-muted'}`}>
            {count}
          </span>
        </div>
        <span className="text-text-muted">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border bg-surface-raised">
          {count === 0 ? (
            <p className="text-xs text-text-muted italic py-2">{emptyLabel}</p>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  )
}

function PreviewPill() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-text-muted border border-border rounded px-1.5 py-0.5 select-none">
      <Eye size={9} />
      Preview only
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface CurriculumImpactPreviewProps {
  draft: Pick<CurriculumChangeDraft, 'scope' | 'changeType' | 'targetObjectLabel' | 'proposedChange' | 'reason'>
  impact: CurriculumImpactSummary
  className?: string
}

export function CurriculumImpactPreview({ draft, impact, className }: CurriculumImpactPreviewProps) {
  const scopeDef = SCOPE_BY_ID[draft.scope]

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="label-xs mb-1">Curriculum Change Impact Preview</p>
              <p className="text-text-primary font-medium text-sm">{draft.targetObjectLabel}</p>
              {draft.proposedChange && (
                <p className="text-xs text-text-secondary mt-0.5">{draft.proposedChange}</p>
              )}
            </div>
            <PreviewPill />
          </div>

          {/* Scope + risk row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-surface-raised border border-border rounded px-2 py-0.5 text-text-secondary">
              Scope: <span className="text-text-primary font-medium">{scopeDef?.label ?? draft.scope}</span>
            </span>
            <span className={`font-medium ${SCOPE_RISK_COLOR[scopeDef?.risk ?? 'low']}`}>
              {SCOPE_RISK_LABEL[scopeDef?.risk ?? 'low']}
            </span>
            {scopeDef?.approverLabel && (
              <span className="text-text-muted">
                Approver: <span className="text-text-secondary">{scopeDef.approverLabel}</span>
              </span>
            )}
          </div>

          {draft.reason && (
            <p className="text-xs text-text-muted mt-2 italic">"{draft.reason}"</p>
          )}
        </CardHeader>

        <CardContent>
          <div className="space-y-2">

            {/* Requirements */}
            <ImpactSection
              icon={<AlertTriangle size={14} />}
              title="Gate Requirements"
              count={impact.requirements.length}
              emptyLabel="No gate requirements affected by this change."
              defaultOpen={impact.requirements.length > 0}
            >
              <div className="space-y-2 mt-2">
                {impact.requirements.map(req => (
                  <div key={req.gateId} className="text-xs border border-border rounded-lg p-3 bg-surface">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-text-primary">{req.gateName}</span>
                      <span className="text-text-muted">{req.levelName}</span>
                    </div>
                    <p className="text-text-secondary">{req.changeDescription}</p>
                    {req.affectedPlayerCount > 0 && (
                      <p className="text-status-orange mt-1">{req.affectedPlayerCount} player{req.affectedPlayerCount !== 1 ? 's' : ''} affected</p>
                    )}
                  </div>
                ))}
              </div>
            </ImpactSection>

            {/* Players */}
            <ImpactSection
              icon={<Users size={14} />}
              title="Players Affected"
              count={impact.players.length}
              emptyLabel="No players directly affected by this change."
              defaultOpen={impact.players.length > 0}
            >
              <div className="space-y-2 mt-2">
                {impact.players.map(p => (
                  <div key={p.playerId} className="text-xs border border-border rounded-lg p-3 bg-surface">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-text-primary">{p.playerName}</span>
                      <span className="text-text-muted">{p.currentLevel}</span>
                    </div>
                    <p className="text-text-secondary">{p.impactDescription}</p>
                    {p.advancementEligible && (
                      <p className="text-lime text-[10px] mt-1 uppercase tracking-widest">Currently advancement-eligible</p>
                    )}
                  </div>
                ))}
              </div>
            </ImpactSection>

            {/* Templates */}
            <ImpactSection
              icon={<FileText size={14} />}
              title="Session Templates"
              count={impact.templates.length}
              emptyLabel="No session templates linked to this curriculum object."
            >
              <div className="space-y-2 mt-2">
                {impact.templates.map(t => (
                  <div key={t.templateId} className="text-xs border border-border rounded-lg p-3 bg-surface">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-text-primary">{t.templateName}</span>
                      <span className="text-text-muted">{t.levelName}</span>
                    </div>
                    <p className="text-text-secondary">{t.impactDescription}</p>
                    <p className="text-text-muted mt-1">{t.blockCount} block{t.blockCount !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            </ImpactSection>

            {/* Coach Briefs */}
            <ImpactSection
              icon={<BookOpen size={14} />}
              title="Coach Briefs"
              count={impact.coachBriefs.length}
              emptyLabel="No coach briefs affected."
            >
              <div className="space-y-2 mt-2">
                {impact.coachBriefs.map((brief, i) => (
                  <div key={i} className="text-xs border border-border rounded-lg p-3 bg-surface">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-text-primary">{brief.groupName}</span>
                      {brief.coachName && <span className="text-text-muted">{brief.coachName}</span>}
                    </div>
                    <p className="text-text-muted">Current: <span className="text-text-secondary">{brief.currentFocus}</span></p>
                    <p className="text-lime/80 mt-0.5">Suggested: {brief.suggestedFocusChange}</p>
                  </div>
                ))}
              </div>
            </ImpactSection>

            {/* Parent/Player Language */}
            <ImpactSection
              icon={<MessageSquare size={14} />}
              title="Parent / Player Language"
              count={impact.parentLanguage.length}
              emptyLabel="No parent or player language affected."
            >
              <div className="space-y-2 mt-2">
                {impact.parentLanguage.map((item, i) => (
                  <div key={i} className="text-xs border border-border rounded-lg p-3 bg-surface">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-text-primary capitalize">{item.contentType}</span>
                      <span className={`text-[10px] uppercase tracking-widest ${item.isSafeForParent ? 'text-status-green' : 'text-status-orange'}`}>
                        {item.isSafeForParent ? 'Parent-safe' : 'Review required'}
                      </span>
                    </div>
                    <p className="text-text-muted line-through text-[11px]">{item.currentText}</p>
                    <p className="text-text-secondary mt-1">{item.previewText}</p>
                    <p className="text-text-muted text-[10px] mt-1 italic">Not sent — director review required before any publication.</p>
                  </div>
                ))}
              </div>
            </ImpactSection>

            {/* DONNA Recommendations */}
            <ImpactSection
              icon={<Sparkles size={14} />}
              title="DONNA Recommendations"
              count={impact.donnaRecommendations.length}
              emptyLabel="No DONNA recommendation behavior changes from this scope."
            >
              <div className="space-y-2 mt-2">
                {impact.donnaRecommendations.map((rec, i) => (
                  <div key={i} className="text-xs border border-border rounded-lg p-3 bg-surface">
                    <p className="font-medium text-text-primary mb-1 capitalize">{rec.recommendationType}</p>
                    <p className="text-text-muted line-through text-[11px]">{rec.currentBehavior}</p>
                    <p className="text-text-secondary mt-1">{rec.updatedBehavior}</p>
                  </div>
                ))}
              </div>
            </ImpactSection>

          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-border space-y-1">
            {impact.dataNote && (
              <p className="text-[11px] text-status-orange flex items-center gap-1">
                <AlertTriangle size={10} />
                {impact.dataNote}
              </p>
            )}
            <p className="text-[11px] text-text-muted">
              This is a preview only. Nothing changes until a director approves and applies this change through the review queue.
            </p>
            <p className="text-[10px] text-text-muted">
              Generated {new Date(impact.generatedAt).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
