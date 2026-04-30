import { Card, CardHeader, CardContent } from '@/components/ui'
import { Link2, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export interface EvidenceRequirementDraftRow {
  id: string
  status: string
  proposed_payload: unknown
  created_at: string
}

interface Props {
  drafts: EvidenceRequirementDraftRow[]
}

const DOMAIN_LABELS: Record<string, string> = {
  skill:       'Skill Path',
  competition: 'Competition Path',
  fitness:     'Fitness Path',
}

const STATUS_COLORS: Record<string, string> = {
  pending_review:       'text-status-orange',
  approved:             'text-lime',
  clarification_needed: 'text-status-blue',
}

const STATUS_LABELS: Record<string, string> = {
  pending_review:       'Pending Review',
  approved:             'Approved',
  clarification_needed: 'Needs Clarification',
}

export function EvidenceRequirementDrafts({ drafts }: Props) {
  if (drafts.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <p className="label-xs">Evidence Link Drafts</p>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">

        <p className="text-[11px] text-text-muted leading-relaxed">
          Draft links between coach observations and requirements. No evidence links have been created
          and no requirement statuses have changed.
        </p>

        {drafts.map((draft) => {
          const payload = draft.proposed_payload as Record<string, unknown> | null
          const links = (payload?.links as Record<string, unknown>[] | null) ?? []
          const warnings = (payload?.warnings as string[] | null) ?? []

          const domainCounts: Record<string, number> = {}
          for (const link of links) {
            const domain = (link.requirement_domain_key as string) ?? 'other'
            domainCounts[domain] = (domainCounts[domain] ?? 0) + 1
          }

          return (
            <div
              key={draft.id}
              className="bg-surface-raised border border-border rounded p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-[10px] uppercase tracking-widest text-status-orange font-medium">
                    Evidence Link Draft · Not Applied
                  </span>
                </div>
                <span className={`text-[11px] uppercase tracking-widest ${STATUS_COLORS[draft.status] ?? 'text-text-muted'}`}>
                  {STATUS_LABELS[draft.status] ?? draft.status}
                </span>
              </div>

              {/* Link count */}
              <p className="text-sm text-text-primary font-medium">
                {links.length} proposed evidence {links.length === 1 ? 'link' : 'links'}
              </p>

              {/* Domain breakdown */}
              {Object.keys(domainCounts).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(domainCounts).map(([domain, count]) => (
                    <span
                      key={domain}
                      className="text-[11px] bg-surface border border-border text-text-secondary px-2 py-0.5 rounded"
                    >
                      {DOMAIN_LABELS[domain] ?? domain}: {count}
                    </span>
                  ))}
                </div>
              )}

              {/* Requirement titles (first 5) */}
              {links.length > 0 && (
                <div className="space-y-1">
                  {links.slice(0, 5).map((link, i) => (
                    <p key={i} className="text-xs text-text-secondary leading-snug">
                      · {link.requirement_title as string}
                    </p>
                  ))}
                  {links.length > 5 && (
                    <p className="text-xs text-text-muted">
                      +{links.length - 5} more proposed {links.length - 5 === 1 ? 'link' : 'links'}
                    </p>
                  )}
                </div>
              )}

              {/* First warning */}
              {warnings.length > 0 && (
                <div className="flex items-start gap-2 text-status-orange text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{warnings[0]}</span>
                </div>
              )}

              <p className="text-[11px] text-text-muted">
                Created {formatDate(draft.created_at)}
              </p>
            </div>
          )
        })}

      </CardContent>
    </Card>
  )
}
