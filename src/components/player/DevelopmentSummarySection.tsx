import { ClipboardList } from 'lucide-react'
import { Card, EmptyState } from '@/components/ui'
import type { PlayerDevelopmentSummary } from '@/lib/backend/notes'

interface Props {
  summary: PlayerDevelopmentSummary | null
}

export function DevelopmentSummarySection({ summary }: Props) {
  if (!summary) {
    return (
      <Card>
        <EmptyState
          icon={<ClipboardList className="w-5 h-5" />}
          title="No development summary yet"
          description="Use the form below to create a development summary for this player."
        />
      </Card>
    )
  }

  const hasContent =
    summary.current_strengths.length > 0 ||
    summary.things_to_work_on.length > 0 ||
    summary.development_focus ||
    summary.coach_summary ||
    summary.student_friendly_summary

  if (!hasContent) {
    return (
      <Card>
        <EmptyState
          icon={<ClipboardList className="w-5 h-5" />}
          title="Summary is empty"
          description="Use the form below to fill in the development summary."
        />
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {summary.current_strengths.length > 0 && (
        <div>
          <p className="label-xs mb-2">Current Strengths</p>
          <ul className="space-y-1.5">
            {summary.current_strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-secondary">
                <span className="text-lime shrink-0">·</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.things_to_work_on.length > 0 && (
        <div>
          <p className="label-xs mb-2">Things to Work On</p>
          <ul className="space-y-1.5">
            {summary.things_to_work_on.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-secondary">
                <span className="text-status-orange shrink-0">·</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.development_focus && (
        <div>
          <p className="label-xs mb-1">Development Focus</p>
          <p className="text-sm text-text-secondary leading-relaxed">{summary.development_focus}</p>
        </div>
      )}

      {summary.coach_summary && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="label-xs">Coach Summary</p>
            <span className="text-[10px] text-status-orange uppercase tracking-wide">Internal</span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{summary.coach_summary}</p>
        </div>
      )}

      {summary.student_friendly_summary && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="label-xs">Student-Facing Preview</p>
            <span className="text-[10px] text-text-muted uppercase tracking-wide">
              {summary.show_to_student ? 'Visible to student' : 'Hidden until enabled'}
            </span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {summary.student_friendly_summary}
          </p>
        </div>
      )}
    </div>
  )
}
