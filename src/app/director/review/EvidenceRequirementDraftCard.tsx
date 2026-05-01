import Link from 'next/link'
import { AlertTriangle, CheckCircle, ExternalLink, Link2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { EvidenceRequirementDraftDecisionControls } from './EvidenceRequirementDraftDecisionControls'

const DOMAIN_LABELS: Record<string, string> = {
  skill:       'Skill',
  competition: 'Competition',
  fitness:     'Fitness',
}

const DOMAIN_COLORS: Record<string, string> = {
  skill:       'text-status-blue',
  competition: 'text-status-orange',
  fitness:     'text-status-green',
}

interface DraftLinkItem {
  requirement_title: string
  requirement_domain_key: string
  evidence_summary: string
  confidence: number
}

export interface EvidenceRequirementLinkPayload {
  draft_type: string
  links: DraftLinkItem[]
  warnings: string[]
}

export interface EnrichedEvidenceLinkDraftItem {
  id: string
  status: string
  createdAt: string
  playerId: string | null
  playerName: string | null
  proposerName: string | null
  payload: EvidenceRequirementLinkPayload
}

export function EvidenceRequirementDraftCard({ draft }: { draft: EnrichedEvidenceLinkDraftItem }) {
  const { payload } = draft
  const links = payload.links ?? []

  const domainCounts: Record<string, number> = {}
  for (const link of links) {
    const domain = link.requirement_domain_key ?? 'other'
    domainCounts[domain] = (domainCounts[domain] ?? 0) + 1
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className={`text-[10px] uppercase tracking-widest font-medium ${draft.status === 'approved' ? 'text-lime' : 'text-status-orange'}`}>
              Evidence Link Draft ·{' '}
              {draft.status === 'approved' ? 'approved — awaiting future application' : 'pending review'}
            </p>
            {draft.playerName && (
              <p className="text-sm font-semibold text-text-primary mt-0.5">{draft.playerName}</p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted mt-1">
              {draft.proposerName && <span>by {draft.proposerName}</span>}
              <span>
                Created{' '}
                {new Date(draft.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          {draft.playerId && (
            <Link
              href={`/director/players/${draft.playerId}`}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-lime transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Player Profile
            </Link>
          )}
        </div>

        {/* Draft-only warnings — required sprint copy */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-status-orange/5 border border-status-orange/20 text-xs text-status-orange">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p>Draft only. No official evidence links have been created.</p>
            <p>Approval does not update requirement status or mark anything complete.</p>
          </div>
        </div>

        {/* Proposed link count + domain breakdown */}
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Proposed Links</p>
            <p className="text-lg font-mono font-bold text-lime">{links.length}</p>
          </div>
          {Object.entries(domainCounts).map(([domain, count]) => (
            <div key={domain}>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">
                {DOMAIN_LABELS[domain] ?? domain}
              </p>
              <p className={`text-lg font-mono font-bold ${DOMAIN_COLORS[domain] ?? 'text-text-secondary'}`}>
                {count}
              </p>
            </div>
          ))}
        </div>

        {/* Proposed evidence links — requirement titles + domain + confidence + evidence summary */}
        {links.length > 0 && (
          <section className="space-y-1.5">
            <p className="label-xs flex items-center gap-1.5">
              <Link2 className="w-3 h-3" />
              Proposed Evidence Links
            </p>
            <div className="space-y-2.5">
              {links.slice(0, 5).map((link, i) => (
                <div key={i} className="pl-3 border-l border-border space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium text-text-primary leading-snug">
                      {link.requirement_title}
                    </p>
                    {link.requirement_domain_key && (
                      <span className="text-[10px] bg-surface border border-border text-text-muted px-1.5 py-0.5 rounded">
                        {DOMAIN_LABELS[link.requirement_domain_key] ?? link.requirement_domain_key}
                      </span>
                    )}
                    {link.confidence != null && (
                      <span className="text-[10px] text-text-muted">
                        {Math.round(link.confidence * 100)}% match
                      </span>
                    )}
                  </div>
                  {link.evidence_summary && (
                    <p className="text-[11px] text-text-muted leading-snug line-clamp-2">
                      {link.evidence_summary}
                    </p>
                  )}
                </div>
              ))}
              {links.length > 5 && (
                <p className="text-xs text-text-muted pl-3">
                  +{links.length - 5} more proposed {links.length - 5 === 1 ? 'link' : 'links'}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Approved status banner */}
        {draft.status === 'approved' && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-lime/5 border border-lime/20 text-xs text-lime">
            <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Approved for future evidence application. No official evidence links have been created yet.
            </span>
          </div>
        )}

        {/* Decision controls — pending drafts only */}
        {draft.status === 'pending_review' && (
          <EvidenceRequirementDraftDecisionControls proposedActionId={draft.id} />
        )}

      </CardContent>
    </Card>
  )
}
