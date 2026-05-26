import Link from 'next/link'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const CATEGORY_LABELS: Record<string, string> = {
  technical_skill:      'Technical Skill',
  tactical_skill:       'Tactical Skill',
  physical_fitness:     'Physical Fitness',
  competition_exposure: 'Competition Exposure',
  behavioral:           'Behavioral',
  load_management:      'Load Management',
  reassessment:         'Reassessment',
  promotion_readiness:  'Promotion Readiness',
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

// Sprint 840: CTA copy + style per draft status.
// All three active statuses (pending_review, approved, clarification_needed) link to
// /director/review?tab=player-updates — the review queue section that renders
// PriorityRecommendationDraftCard with full approve / apply controls.
const CTA_CONFIG: Record<string, { label: string; color: string } | null> = {
  pending_review:       { label: 'Review / Approve in Review Queue', color: 'text-status-orange hover:text-status-orange/80' },
  approved:             { label: 'Apply in Review Queue',            color: 'text-lime hover:text-lime/80' },
  clarification_needed: { label: 'Return to Review Queue',           color: 'text-status-blue hover:text-status-blue/80' },
}

export interface PriorityRecommendationDraftRow {
  id: string
  status: string
  proposed_payload: unknown
  created_at: string
}

interface Props {
  drafts: PriorityRecommendationDraftRow[]
}

export function PriorityRecommendationDrafts({ drafts }: Props) {
  if (drafts.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <p className="label-xs">Priority Recommendation Drafts</p>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">

        <p className="text-[11px] text-text-muted leading-relaxed">
          Draft recommendations generated from player evidence. None of these have been applied.
          Active priorities are unchanged. Official priority changes require director approval in the
          Review Queue.
        </p>

        {drafts.map((draft) => {
          const payload = draft.proposed_payload as Record<string, unknown> | null
          const rec = payload?.recommended_priority as Record<string, unknown> | null
          const evidence = payload?.evidence as Record<string, unknown> | null
          const overlapWarning = payload?.active_priority_overlap_warning as string | null

          if (!rec) return null

          const title = (rec.title as string | null) ?? '—'
          const category = (rec.category as string | null) ?? ''
          const topTags = (evidence?.top_tags as string[] | null) ?? []

          const cta = CTA_CONFIG[draft.status] ?? null

          return (
            <div
              key={draft.id}
              className="bg-surface-raised border border-border rounded p-4 space-y-3"
            >
              {/* Status row */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[10px] uppercase tracking-widest text-status-orange font-medium">
                  Draft Only · Not Applied
                </span>
                <span
                  className={`text-[11px] uppercase tracking-widest ${STATUS_COLORS[draft.status] ?? 'text-text-muted'}`}
                >
                  {STATUS_LABELS[draft.status] ?? draft.status}
                </span>
              </div>

              {/* Recommended title */}
              <p className="text-sm text-text-primary font-medium leading-snug">{title}</p>

              {/* Category badge */}
              {category && (
                <span className="inline-block text-[11px] bg-surface border border-border text-text-secondary px-2 py-0.5 rounded">
                  {CATEGORY_LABELS[category] ?? category}
                </span>
              )}

              {/* Evidence tags */}
              {topTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {topTags.slice(0, 5).map(tag => (
                    <span
                      key={tag}
                      className="text-[11px] bg-surface border border-border text-text-muted px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Overlap warning */}
              {overlapWarning && (
                <div className="flex items-start gap-2 text-status-orange text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{overlapWarning}</span>
                </div>
              )}

              {/* Date */}
              <p className="text-[11px] text-text-muted">
                Created {formatDate(draft.created_at)}
              </p>

              {/* Sprint 840: Review queue CTA — present for all active statuses.
                  Links to /director/review?tab=player-updates where PriorityRecommendationDraftCard
                  renders the full approve / apply controls. No approval happens here — all priority
                  changes require explicit director action in the review queue. */}
              {cta && (
                <div className="pt-2 border-t border-border">
                  <Link
                    href="/director/review?tab=player-updates"
                    className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${cta.color}`}
                  >
                    {cta.label}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <p className="text-[10px] text-text-muted mt-1">
                    Director approval required before any priority change is applied.
                  </p>
                </div>
              )}
            </div>
          )
        })}

      </CardContent>
    </Card>
  )
}
