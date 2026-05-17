import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import type { SuggestionEvidenceItem, SuggestionImpactPreview, AcademySuggestionConfidence } from '@/lib/suggestions/suggestionTypes'
import { CONFIDENCE_LABEL, CONFIDENCE_CLASSES } from '@/lib/suggestions/suggestionTypes'

interface Props {
  ifAccepted: string[]
  willNotChange: string[]
  evidence: SuggestionEvidenceItem[]
  confidence: AcademySuggestionConfidence
  nextStep?: string
}

export function ImpactPreviewPanel({ ifAccepted, willNotChange, evidence, confidence, nextStep }: Props) {
  return (
    <div className="space-y-4">

      {/* Evidence */}
      {evidence.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2 flex items-center gap-2">
            Evidence
            <span className={`text-[10px] font-medium ${CONFIDENCE_CLASSES[confidence]}`}>
              · {CONFIDENCE_LABEL[confidence]}
            </span>
          </p>
          <ul className="space-y-2">
            {evidence.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-secondary">
                <span className="text-lime shrink-0 mt-0.5">·</span>
                <span className="leading-relaxed space-y-0.5">
                  <span className="block">{item.description}</span>
                  {(item.type || item.date) && (
                    <span className="flex items-center gap-2 text-[10px] text-text-muted">
                      {item.type && <span className="uppercase tracking-widest">{item.type.replace(/_/g, ' ')}</span>}
                      {item.type && item.date && <span>·</span>}
                      {item.date && <span>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* If accepted */}
      {ifAccepted.length > 0 && (
        <div className="rounded-xl bg-lime/5 border border-lime/15 px-4 py-3 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-lime mb-2">If accepted</p>
          <ul className="space-y-1.5">
            {ifAccepted.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-primary">
                <CheckCircle2 className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Will not change */}
      {willNotChange.length > 0 && (
        <div className="rounded-xl bg-surface-raised border border-border px-4 py-3 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Will not change</p>
          <ul className="space-y-1.5">
            {willNotChange.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-secondary">
                <XCircle className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next step */}
      {nextStep && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-surface-raised border border-border">
          <ArrowRight className="w-3.5 h-3.5 text-status-blue shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Recommended next step</p>
            <p className="text-sm text-text-secondary leading-relaxed">{nextStep}</p>
          </div>
        </div>
      )}

    </div>
  )
}

// Re-export preview-shape helper so callers can narrow the jsonb
export function parseSuggestionImpactPreview(raw: unknown): SuggestionImpactPreview {
  if (typeof raw !== 'object' || raw === null) return { if_accepted: [] }
  const r = raw as Record<string, unknown>
  return {
    if_accepted: Array.isArray(r.if_accepted) ? (r.if_accepted as string[]) : [],
    next_step: typeof r.next_step === 'string' ? r.next_step : undefined,
  }
}
