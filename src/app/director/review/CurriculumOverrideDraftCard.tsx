import { AlertTriangle, Mic, Tag, MapPin, Layers, HelpCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import type { CurriculumOverrideDraftPayload } from '@/lib/actions/curriculumOverrideDraft'
import { CurriculumOverrideDraftDecisionControls } from './CurriculumOverrideDraftDecisionControls'
import { ApplyCurriculumOverrideDraftControls } from './ApplyCurriculumOverrideDraftControls'

export interface EnrichedCurriculumOverrideDraftItem {
  id: string
  status: string
  createdAt: string
  proposerName: string | null
  payload: CurriculumOverrideDraftPayload
}

export function CurriculumOverrideDraftCard({ draft }: { draft: EnrichedCurriculumOverrideDraftItem }) {
  const { payload } = draft

  const statusLabel =
    draft.status === 'approved' ? 'Approved — ready to apply' :
    draft.status === 'pending_review' ? 'Pending review' :
    draft.status === 'executed' ? 'Applied' :
    draft.status

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-lime font-medium">
              Curriculum Override Draft V1 · {statusLabel}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted mt-1">
              {draft.proposerName && <span>by {draft.proposerName}</span>}
              <span>
                {new Date(draft.createdAt).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Safety banner */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-status-orange/5 border border-status-orange/20 text-xs text-status-orange">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Draft only. No curriculum has been changed. Approving creates an official override record only after you click Apply.
          </span>
        </div>

        {/* Raw input */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Mic className="w-3 h-3 text-text-muted" />
            <p className="label-xs">Director input</p>
          </div>
          <p className="text-xs text-text-primary bg-surface-raised rounded-lg px-3 py-2 border border-border leading-relaxed">
            &ldquo;{payload.raw_input}&rdquo;
          </p>
        </div>

        {/* Parsed fields */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Layers className="w-3 h-3 text-text-muted" />
              <p className="label-xs">Level</p>
            </div>
            <p className="text-xs text-text-primary">
              {payload.parsed_level ?? <span className="text-text-muted italic">not detected</span>}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Tag className="w-3 h-3 text-text-muted" />
              <p className="label-xs">Pathway</p>
            </div>
            <p className="text-xs text-text-primary">
              {payload.parsed_pathway ?? <span className="text-text-muted italic">not detected</span>}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Tag className="w-3 h-3 text-text-muted" />
              <p className="label-xs">Focus</p>
            </div>
            <p className="text-xs text-text-primary">
              {payload.parsed_focus.length > 0
                ? payload.parsed_focus.join(', ')
                : <span className="text-text-muted italic">not detected</span>}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-text-muted" />
              <p className="label-xs">Scope</p>
            </div>
            <p className="text-xs text-text-primary">
              {payload.parsed_scope ?? <span className="text-text-muted italic">not detected</span>}
            </p>
          </div>
        </div>

        {/* Proposed change summary */}
        <div className="space-y-1">
          <p className="label-xs">Proposed change summary</p>
          <p className="text-xs text-text-secondary leading-relaxed">{payload.proposed_change_summary}</p>
        </div>

        {/* Affected targets */}
        {payload.affected_targets_guess.length > 0 && (
          <div className="space-y-1">
            <p className="label-xs">Estimated affected areas</p>
            <ul className="space-y-0.5">
              {payload.affected_targets_guess.map((t, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <span className="w-1 h-1 rounded-full bg-text-muted shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {payload.warnings.length > 0 && (
          <div className="space-y-1">
            <p className="label-xs text-status-orange">Warnings</p>
            <ul className="space-y-1">
              {payload.warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-status-orange">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Clarification questions */}
        {payload.clarification_questions.length > 0 && (
          <div className="space-y-1">
            <p className="label-xs text-status-blue">Clarification needed</p>
            <ul className="space-y-1">
              {payload.clarification_questions.map((q, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-status-blue">
                  <HelpCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Decision controls */}
        {draft.status === 'pending_review' && (
          <CurriculumOverrideDraftDecisionControls proposedActionId={draft.id} />
        )}
        {draft.status === 'approved' && (
          <ApplyCurriculumOverrideDraftControls proposedActionId={draft.id} />
        )}
      </CardContent>
    </Card>
  )
}
