'use client'
import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp, CheckCircle2, TriangleAlert, Info, Eye, Clock, X } from 'lucide-react'
import type { CurriculumIntelligenceContext } from '@/lib/donna/curriculum/curriculumIntelligenceContext'
import { runCurriculumEvolution, type EvolutionRecommendation } from '@/lib/donna/curriculum/curriculumEvolutionEngine'
import { EVIDENCE_STRENGTH_LABEL, RECOMMENDATION_TYPE_LABEL } from '@/lib/donna/curriculum/curriculumEvidenceStrength'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  intelligenceContext: CurriculumIntelligenceContext
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function impactColor(impact: EvolutionRecommendation['expectedImpact']): string {
  return impact === 'high'   ? '#C8FF00' :
         impact === 'medium' ? '#FF9500' :
         impact === 'low'    ? '#AAAAAA' : '#555555'
}

function evidenceColor(strength: EvolutionRecommendation['evidenceStrength']): string {
  return strength === 'high'         ? '#30D158' :
         strength === 'medium'       ? '#C8FF00' :
         strength === 'low'          ? '#FF9500' :
         /* insufficient */           '#FF3B30'
}

function recTypeColor(type: EvolutionRecommendation['recommendationType']): string {
  return type === 'CREATE'      ? '#0A84FF' :
         type === 'IMPROVE'     ? '#30D158' :
         type === 'REMOVE'      ? '#FF3B30' :
         type === 'MERGE'       ? '#FF9500' :
         type === 'REORDER'     ? '#C8FF00' :
         type === 'INVESTIGATE' ? '#AAAAAA' :
         /* MONITOR */            '#555555'
}

// ── Explanation modal ─────────────────────────────────────────────────────────

function ExplainWhyModal({
  rec,
  onClose,
}: {
  rec: EvolutionRecommendation
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-surface-raised border border-border rounded-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-text-primary font-semibold text-sm">Why DONNA recommends this</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <p className="label-xs mb-1">Why</p>
            <p className="text-text-secondary">{rec.why}</p>
          </div>

          <div>
            <p className="label-xs mb-1">Evidence</p>
            <ul className="space-y-1">
              {rec.evidence.map((e, i) => (
                <li key={i} className="text-text-secondary flex gap-2">
                  <span className="text-text-muted mt-0.5">·</span>
                  {e}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="label-xs mb-1">Expected Benefit</p>
            <p className="text-[#30D158] text-sm">{rec.expectedBenefit}</p>
          </div>

          {rec.possibleRisk && (
            <div>
              <p className="label-xs mb-1">Possible Risk</p>
              <p className="text-[#FF9500] text-sm">{rec.possibleRisk}</p>
            </div>
          )}

          {rec.alternativeOptions.length > 0 && (
            <div>
              <p className="label-xs mb-1">Alternative Options</p>
              <ul className="space-y-1">
                {rec.alternativeOptions.map((opt, i) => (
                  <li key={i} className="text-text-muted text-xs flex gap-2">
                    <span className="mt-0.5">·</span>{opt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {rec.missingData.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="label-xs mb-1">Missing Data</p>
              <ul className="space-y-1">
                {rec.missingData.map((m, i) => (
                  <li key={i} className="text-text-muted text-xs flex gap-2">
                    <span className="mt-0.5">·</span>{m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl text-sm font-medium bg-surface border border-border text-text-secondary hover:border-lime/30 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ── Recommendation card ───────────────────────────────────────────────────────

function RecommendationCard({
  rec,
  onDismiss,
  onDefer,
}: {
  rec: EvolutionRecommendation
  onDismiss: (id: string) => void
  onDefer:   (id: string) => void
}) {
  const [expanded, setExpanded]     = useState(false)
  const [showExplain, setShowExplain] = useState(false)

  return (
    <>
      {showExplain && (
        <ExplainWhyModal rec={rec} onClose={() => setShowExplain(false)} />
      )}

      <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {/* Recommendation type badge */}
              <span
                className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border"
                style={{ color: recTypeColor(rec.recommendationType), borderColor: `${recTypeColor(rec.recommendationType)}40` }}
              >
                {RECOMMENDATION_TYPE_LABEL[rec.recommendationType]}
              </span>
              {/* Impact badge */}
              <span
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: impactColor(rec.expectedImpact) }}
              >
                {rec.expectedImpact !== 'unknown' ? `${rec.expectedImpact} impact` : 'impact unknown'}
              </span>
              {/* Priority */}
              {rec.priority === 1 && (
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF3B30]">
                  Priority 1
                </span>
              )}
            </div>

            <h4 className="text-text-primary text-sm font-medium leading-snug">{rec.title}</h4>
            <p className="text-text-muted text-xs mt-0.5">{rec.reason}</p>
          </div>

          {/* Confidence */}
          <div className="text-right shrink-0">
            <div className="font-mono text-lime text-sm font-semibold">{rec.confidence}%</div>
            <div className="label-xs">confidence</div>
          </div>
        </div>

        {/* Evidence strength */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: evidenceColor(rec.evidenceStrength) }}
          />
          <span className="text-[11px] text-text-muted">
            {EVIDENCE_STRENGTH_LABEL[rec.evidenceStrength]}
          </span>
          {rec.affectedPlayerCount > 0 && (
            <span className="text-[11px] text-text-muted ml-2">
              · {rec.affectedPlayerCount} player{rec.affectedPlayerCount !== 1 ? 's' : ''} affected
            </span>
          )}
        </div>

        {/* Expandable evidence list */}
        {expanded && (
          <div className="pt-2 border-t border-border space-y-2">
            <p className="label-xs">Evidence</p>
            <ul className="space-y-1">
              {rec.evidence.map((e, i) => (
                <li key={i} className="text-text-secondary text-xs flex gap-2">
                  <span className="text-text-muted mt-0.5">·</span>
                  {e}
                </li>
              ))}
            </ul>

            <div className="pt-2 border-t border-border">
              <p className="label-xs mb-1">Recommended Action</p>
              <p className="text-text-secondary text-xs">{rec.recommendedAction}</p>
            </div>
          </div>
        )}

        {/* Toggle evidence */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 text-text-muted text-xs hover:text-text-secondary transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Hide evidence' : 'Show evidence'}
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setShowExplain(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-border text-text-secondary hover:border-lime/30 hover:text-text-primary transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            Ask Why
          </button>
          <button
            onClick={() => onDefer(rec.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-border text-text-secondary hover:border-border transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            Later
          </button>
          <button
            onClick={() => onDismiss(rec.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-border text-text-muted hover:text-text-secondary transition-colors ml-auto"
          >
            <X className="w-3.5 h-3.5" />
            Dismiss
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-lime text-base hover:opacity-90 transition-opacity">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approve
          </button>
        </div>
      </div>
    </>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function CurriculumEvolutionPanel({ intelligenceContext }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [deferred,  setDeferred]  = useState<Set<string>>(new Set())
  const [showAll,   setShowAll]   = useState(false)

  const report = runCurriculumEvolution(intelligenceContext)
  const visible = report.recommendations.filter(r => !dismissed.has(r.id) && !deferred.has(r.id))
  const displayed = showAll ? visible : visible.slice(0, 3)

  function handleDismiss(id: string) {
    setDismissed(prev => new Set(Array.from(prev).concat(id)))
  }

  function handleDefer(id: string) {
    setDeferred(prev => new Set(Array.from(prev).concat(id)))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lime" />
          <h3 className="text-text-primary font-semibold text-sm">Curriculum Evolution</h3>
          {report.topRecommendations.length > 0 && (
            <span className="text-xs font-mono text-[#FF3B30] bg-[#FF3B30]/10 px-2 py-0.5 rounded-full">
              {report.topRecommendations.length} priority
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="label-xs">
            {report.dataConfidence}% confidence
          </span>
          {deferred.size > 0 && (
            <button
              onClick={() => setDeferred(new Set())}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              {deferred.size} deferred
            </button>
          )}
        </div>
      </div>

      {/* Health summary */}
      {(report.healthReport.risks.length > 0 || report.healthReport.opportunities.length > 0) && (
        <div className="grid grid-cols-2 gap-2">
          {report.healthReport.risks.slice(0, 1).map((risk, i) => (
            <div key={i} className="bg-surface border border-[#FF3B30]/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TriangleAlert className="w-3.5 h-3.5 text-[#FF3B30]" />
                <span className="label-xs text-[#FF3B30]">Risk</span>
              </div>
              <p className="text-text-secondary text-xs leading-snug">{risk}</p>
            </div>
          ))}
          {report.healthReport.opportunities.slice(0, 1).map((opp, i) => (
            <div key={i} className="bg-surface border border-[#30D158]/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#30D158]" />
                <span className="label-xs text-[#30D158]">Opportunity</span>
              </div>
              <p className="text-text-secondary text-xs leading-snug">{opp}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {visible.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <CheckCircle2 className="w-6 h-6 text-[#30D158] mx-auto mb-2" />
          <p className="text-text-secondary text-sm font-medium">No evolution recommendations right now</p>
          <p className="text-text-muted text-xs mt-1">
            {dismissed.size > 0 || deferred.size > 0
              ? `${dismissed.size} dismissed, ${deferred.size} deferred`
              : 'Curriculum is well-aligned with current reality'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(rec => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              onDismiss={handleDismiss}
              onDefer={handleDefer}
            />
          ))}

          {visible.length > 3 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="w-full py-2.5 rounded-xl text-xs font-medium border border-border text-text-muted hover:text-text-secondary hover:border-lime/20 transition-colors"
            >
              {showAll
                ? `Show fewer`
                : `Show ${visible.length - 3} more recommendation${visible.length - 3 !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}

      {/* Footer stats */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <div className="flex items-center gap-4 text-[11px] text-text-muted">
          <span>{report.totalPlayerCount} players analysed</span>
          <span>{report.recommendations.length} total signals</span>
          <span>{report.bottleneckReport.suppressed.length} suppressed by outcomes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Eye className="w-3 h-3 text-text-muted" />
          <span className="text-[11px] text-text-muted">Reality-grounded</span>
        </div>
      </div>
    </div>
  )
}
