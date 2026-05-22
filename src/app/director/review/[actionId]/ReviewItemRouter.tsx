import { AlertTriangle, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { WrapUpDraftCard } from '@/app/director/review/WrapUpDraftCard'
import type { EnrichedWrapUpDraftItem } from '@/app/director/review/WrapUpDraftCard'
import { WrapUpObservationDraftCard } from '@/app/director/review/WrapUpObservationDraftCard'
import type { EnrichedObservationDraftItem } from '@/app/director/review/WrapUpObservationDraftCard'
import { AttendanceExceptionDraftCard } from '@/app/director/review/AttendanceExceptionDraftCard'
import type { EnrichedAttendanceExceptionDraftItem } from '@/app/director/review/AttendanceExceptionDraftCard'
import { PriorityRecommendationDraftCard } from '@/app/director/review/PriorityRecommendationDraftCard'
import type { EnrichedPriorityDraftItem } from '@/app/director/review/PriorityRecommendationDraftCard'
import { EvidenceRequirementDraftCard } from '@/app/director/review/EvidenceRequirementDraftCard'
import type { EnrichedEvidenceLinkDraftItem } from '@/app/director/review/EvidenceRequirementDraftCard'
import { DevelopmentSummaryDraftCard } from '@/app/director/review/DevelopmentSummaryDraftCard'
import type { EnrichedSummaryDraftItem } from '@/app/director/review/DevelopmentSummaryDraftCard'
import { StructuredDraftCard } from '@/app/director/review/StructuredDraftCard'
import type { EnrichedDraftItem } from '@/app/director/review/StructuredDraftCard'
import { CurriculumOverrideDraftCard } from '@/app/director/review/CurriculumOverrideDraftCard'
import type { EnrichedCurriculumOverrideDraftItem } from '@/app/director/review/CurriculumOverrideDraftCard'
import { LevelMovementReviewCard } from '@/app/director/review/LevelMovementReviewCard'
import type { EnrichedLevelMovementDraftItem } from '@/app/director/review/LevelMovementReviewCard'
import { ParentSummaryReviewCard } from '@/app/director/review/ParentSummaryReviewCard'
import type { EnrichedParentSummaryDraftItem } from '@/app/director/review/ParentSummaryReviewCard'

export type ReviewItemData =
  | { type: 'wrap_up'; item: EnrichedWrapUpDraftItem }
  | { type: 'observation'; item: EnrichedObservationDraftItem }
  | { type: 'attendance_exception'; item: EnrichedAttendanceExceptionDraftItem }
  | { type: 'priority_recommendation'; item: EnrichedPriorityDraftItem }
  | { type: 'evidence_link'; item: EnrichedEvidenceLinkDraftItem }
  | { type: 'development_summary'; item: EnrichedSummaryDraftItem }
  | { type: 'session_recap'; item: EnrichedDraftItem }
  | { type: 'curriculum_override'; item: EnrichedCurriculumOverrideDraftItem }
  | { type: 'level_review'; item: EnrichedLevelMovementDraftItem }
  | { type: 'parent_summary'; item: EnrichedParentSummaryDraftItem }
  | { type: 'unsupported'; targetModule: string; actionId: string; status: string; createdAt: string }

function UnsupportedCard({ targetModule, actionId }: { targetModule: string; actionId: string }) {
  return (
    <Card>
      <CardContent className="py-6 space-y-3">
        <div className="flex items-start gap-3">
          <FileText className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-primary">Draft type: {targetModule}</p>
            <p className="text-xs text-text-muted">This draft type does not have an inline detail view yet. Use the Review Queue to manage it.</p>
          </div>
        </div>
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
          <span>Action ID: {actionId} — no action has been taken.</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReviewItemRouter({ data }: { data: ReviewItemData }) {
  if (data.type === 'wrap_up') return <WrapUpDraftCard draft={data.item} />
  if (data.type === 'observation') return <WrapUpObservationDraftCard draft={data.item} />
  if (data.type === 'attendance_exception') return <AttendanceExceptionDraftCard draft={data.item} />
  if (data.type === 'priority_recommendation') return <PriorityRecommendationDraftCard draft={data.item} />
  if (data.type === 'evidence_link') return <EvidenceRequirementDraftCard draft={data.item} />
  if (data.type === 'development_summary') return <DevelopmentSummaryDraftCard draft={data.item} />
  if (data.type === 'session_recap') return <StructuredDraftCard draft={data.item} />
  if (data.type === 'curriculum_override') return <CurriculumOverrideDraftCard draft={data.item} />
  if (data.type === 'level_review') return <LevelMovementReviewCard draft={data.item} />
  if (data.type === 'parent_summary') return <ParentSummaryReviewCard draft={data.item} />
  return <UnsupportedCard targetModule={data.targetModule} actionId={data.actionId} />
}
