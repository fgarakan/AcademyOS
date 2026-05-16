'use client'

import { useState } from 'react'
import { FileText, BookOpen, ChevronDown, ChevronRight, AlertTriangle, Eye, PenLine } from 'lucide-react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card'
import type { CurriculumChangeScopeId } from '@/lib/curriculum/curriculumChangeScope'
import { SCOPE_BY_ID } from '@/lib/curriculum/curriculumChangeScope'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ImpactedBlockDetail {
  blockId: string
  blockTitle: string
  blockIndex: number
  currentDrillOrFocus: string
  previewChange: string
  changeType: 'drill_removed' | 'drill_added' | 'focus_shifted' | 'gate_added' | 'gate_removed' | 'content_updated' | 'no_change'
}

export interface TemplateImpactDetail {
  templateId: string
  templateName: string
  levelName: string
  totalBlocks: number
  impactedBlocks: ImpactedBlockDetail[]
  overallImpact: 'none' | 'minor' | 'moderate' | 'significant'
  recommendedAction: string
  templateOverwriteApplied: false
}

export interface CoachBriefImpactDetail {
  groupId: string
  groupName: string
  coachName: string | null
  sessionCount: number
  currentFocusLines: string[]
  updatedFocusLines: string[]
  removedFocusLines: string[]
  addedFocusLines: string[]
  recommendedEdits: string[]
}

export interface TemplateCoachBriefImpactSummary {
  scopeId: CurriculumChangeScopeId
  changeDescription: string
  templates: TemplateImpactDetail[]
  coachBriefs: CoachBriefImpactDetail[]
  templatesAffected: number
  blocksAffected: number
  groupsAffected: number
  dataNote: string | null
  generatedAt: string
}

// ── Impact color helpers ──────────────────────────────────────────────────────

const IMPACT_COLOR: Record<TemplateImpactDetail['overallImpact'], string> = {
  none: 'text-text-muted',
  minor: 'text-status-blue',
  moderate: 'text-status-orange',
  significant: 'text-status-red',
}

const BLOCK_CHANGE_COLOR: Record<ImpactedBlockDetail['changeType'], string> = {
  drill_removed: 'text-status-red',
  drill_added: 'text-lime',
  focus_shifted: 'text-status-orange',
  gate_added: 'text-status-orange',
  gate_removed: 'text-status-blue',
  content_updated: 'text-status-blue',
  no_change: 'text-text-muted',
}

const BLOCK_CHANGE_LABEL: Record<ImpactedBlockDetail['changeType'], string> = {
  drill_removed: 'Drill removed',
  drill_added: 'Drill added',
  focus_shifted: 'Focus shifted',
  gate_added: 'Gate added',
  gate_removed: 'Gate removed',
  content_updated: 'Content updated',
  no_change: 'No change',
}

// ── Template section ──────────────────────────────────────────────────────────

function TemplateImpactSection({ templates }: { templates: TemplateImpactDetail[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (templates.length === 0) {
    return <p className="text-xs text-text-muted italic py-2">No session templates linked to this curriculum object.</p>
  }

  return (
    <div className="space-y-2">
      {templates.map(template => {
        const isExpanded = expandedId === template.templateId
        return (
          <div key={template.templateId} className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : template.templateId)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-raised transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={13} className="text-text-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-text-primary truncate">{template.templateName}</p>
                  <p className="text-[10px] text-text-muted">{template.levelName} · {template.totalBlocks} blocks</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-medium uppercase tracking-widest ${IMPACT_COLOR[template.overallImpact]}`}>
                  {template.overallImpact} impact
                </span>
                <span className="text-text-muted">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 pt-1 border-t border-border bg-surface-raised space-y-3">
                {/* Impacted blocks */}
                {template.impactedBlocks.length > 0 && (
                  <div>
                    <p className="label-xs mb-2">Impacted blocks</p>
                    <div className="space-y-1.5">
                      {template.impactedBlocks.map(block => (
                        <div key={block.blockId} className="text-xs border border-border rounded-lg p-3 bg-surface">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-text-primary">
                              Block {block.blockIndex + 1}: {block.blockTitle}
                            </span>
                            <span className={`text-[10px] uppercase tracking-widest ${BLOCK_CHANGE_COLOR[block.changeType]}`}>
                              {BLOCK_CHANGE_LABEL[block.changeType]}
                            </span>
                          </div>
                          <p className="text-text-muted line-through text-[11px]">{block.currentDrillOrFocus}</p>
                          {block.changeType !== 'no_change' && (
                            <p className="text-text-secondary mt-0.5">{block.previewChange}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended action */}
                {template.recommendedAction && (
                  <div className="flex items-start gap-1.5 text-xs text-text-secondary bg-surface border border-border rounded-lg px-3 py-2">
                    <PenLine size={12} className="shrink-0 mt-0.5 text-text-muted" />
                    <span><span className="text-text-muted">Recommended: </span>{template.recommendedAction}</span>
                  </div>
                )}

                {/* No overwrite guard */}
                <p className="text-[10px] text-text-muted italic">
                  Template not overwritten — review required before any edit is applied.
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Coach brief section ───────────────────────────────────────────────────────

function CoachBriefImpactSection({ briefs }: { briefs: CoachBriefImpactDetail[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (briefs.length === 0) {
    return <p className="text-xs text-text-muted italic py-2">No coach briefs affected by this change.</p>
  }

  return (
    <div className="space-y-2">
      {briefs.map(brief => {
        const isExpanded = expandedId === brief.groupId
        const hasChanges = brief.addedFocusLines.length > 0 || brief.removedFocusLines.length > 0

        return (
          <div key={brief.groupId} className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : brief.groupId)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-raised transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <BookOpen size={13} className="text-text-muted shrink-0" />
                <div>
                  <p className="text-sm text-text-primary">{brief.groupName}</p>
                  <p className="text-[10px] text-text-muted">
                    {brief.coachName ?? 'No coach assigned'} · {brief.sessionCount} sessions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <span className="text-[10px] font-medium text-status-orange uppercase tracking-widest">
                    Focus changes
                  </span>
                )}
                <span className="text-text-muted">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 pt-1 border-t border-border bg-surface-raised space-y-3">
                {/* Current focus */}
                {brief.currentFocusLines.length > 0 && (
                  <div>
                    <p className="label-xs mb-1">Current focus</p>
                    <ul className="space-y-0.5">
                      {brief.currentFocusLines.map((line, i) => (
                        <li key={i} className={`flex items-center gap-1.5 text-xs ${brief.removedFocusLines.includes(line) ? 'text-status-red line-through' : 'text-text-secondary'}`}>
                          <span className="w-1 h-1 rounded-full bg-text-muted shrink-0" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Added lines */}
                {brief.addedFocusLines.length > 0 && (
                  <div>
                    <p className="label-xs mb-1 text-lime">Added focus</p>
                    <ul className="space-y-0.5">
                      {brief.addedFocusLines.map((line, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-xs text-lime">
                          <span className="w-1 h-1 rounded-full bg-lime shrink-0" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended edits */}
                {brief.recommendedEdits.length > 0 && (
                  <div>
                    <p className="label-xs mb-1">Recommended edits</p>
                    <ul className="space-y-1">
                      {brief.recommendedEdits.map((edit, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                          <PenLine size={11} className="shrink-0 mt-0.5 text-text-muted" />
                          {edit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface TemplateCoachBriefImpactPreviewProps {
  summary: TemplateCoachBriefImpactSummary
  className?: string
}

export function TemplateCoachBriefImpactPreview({ summary, className }: TemplateCoachBriefImpactPreviewProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'coach_briefs'>('templates')
  const scopeDef = SCOPE_BY_ID[summary.scopeId]

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="label-xs mb-1">Template & Coach Brief Impact Preview</p>
              <p className="text-text-primary font-medium text-sm">{summary.changeDescription}</p>
              <p className="text-xs text-text-muted mt-0.5">Scope: {scopeDef?.label ?? summary.scopeId}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-text-muted border border-border rounded px-1.5 py-0.5">
              <Eye size={9} />
              Preview only
            </span>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Templates', value: summary.templatesAffected },
              { label: 'Blocks', value: summary.blocksAffected },
              { label: 'Groups', value: summary.groupsAffected },
            ].map(stat => (
              <div key={stat.label} className="bg-surface-raised border border-border rounded-lg p-2 text-center">
                <p className={`text-xl font-mono font-bold ${stat.value > 0 ? 'text-status-orange' : 'text-text-muted'}`}>
                  {stat.value}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {[
              { id: 'templates' as const, label: 'Templates', icon: <FileText size={12} /> },
              { id: 'coach_briefs' as const, label: 'Coach Briefs', icon: <BookOpen size={12} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  activeTab === tab.id
                    ? 'text-lime bg-lime/10 border-lime/30 font-medium'
                    : 'text-text-muted border-border hover:border-text-muted hover:text-text-secondary'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {activeTab === 'templates' ? (
            <TemplateImpactSection templates={summary.templates} />
          ) : (
            <CoachBriefImpactSection briefs={summary.coachBriefs} />
          )}
        </CardContent>

        <CardFooter>
          <div className="space-y-1">
            {summary.dataNote && (
              <p className="text-[11px] text-status-orange flex items-center gap-1">
                <AlertTriangle size={10} />
                {summary.dataNote}
              </p>
            )}
            <p className="text-[11px] text-text-muted">
              No templates have been modified. No coach briefs have been updated. This is a preview only.
            </p>
            <p className="text-[10px] text-text-muted">
              Generated {new Date(summary.generatedAt).toLocaleString()}
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
