import Link from 'next/link'
import type { DirectorGuidance } from '@/lib/donna/operating/directorGuidanceEngine'
import type { OperatingSignal } from '@/lib/donna/operating/operatingSignal'
import type { AcademyHealthModelV2 } from '@/lib/donna/operating/academyHealthModelV2'

interface Props {
  guidance: DirectorGuidance
  signals: OperatingSignal[]
  health: AcademyHealthModelV2
}

const DOMAIN_LABELS: Record<string, string> = {
  players:         'Players',
  coaches:         'Coaches',
  parents:         'Parents',
  curriculum:      'Curriculum',
  assessments:     'Assessments',
  recommendations: 'Queue',
  attendance:      'Attendance',
  academy:         'Academy',
}

interface DomainScoreProps {
  label: string
  score: number
}

function DomainScorePill({ label, score }: DomainScoreProps) {
  const color =
    score >= 75 ? 'text-status-green' :
    score >= 60 ? 'text-status-orange' :
    'text-status-red'
  return (
    <div className="text-center">
      <p className={`text-xl font-mono font-bold ${color}`}>{score}</p>
      <p className="text-[10px] text-text-muted leading-tight mt-0.5">{label}</p>
    </div>
  )
}

export function DonnaEvidencePanel({ guidance, signals, health }: Props) {
  const escalatedSignals = signals.filter(s => s.isEscalated).slice(0, 3)
  const criticalNotEscalated = signals
    .filter(s => s.severity === 'critical' && !s.isEscalated)
    .slice(0, 2)

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <p className="label-xs">DONNA — Evidence Layer</p>
          <h3 className="text-sm font-medium text-text-primary mt-0.5">
            Why This Recommendation
          </h3>
        </div>
        <span className="label-xs text-text-muted">
          {signals.length} signal{signals.length !== 1 ? 's' : ''} analysed
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Top Recommendation */}
        <div className="bg-surface-raised rounded-lg p-4 border-l-2 border-lime">
          <p className="label-xs text-lime mb-2">Highest Leverage Action</p>
          <p className="text-sm font-medium text-text-primary leading-snug">
            {guidance.highestLeverageAction}
          </p>
          <p className="text-xs text-text-secondary mt-2 leading-relaxed">
            {guidance.whyItMatters}
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <span className="label-xs text-text-muted">{guidance.timeEstimate}</span>
            <span className="label-xs text-text-muted">confidence: {guidance.confidence}</span>
            {guidance.navigationTarget && (
              <Link
                href={guidance.navigationTarget}
                className="label-xs text-lime hover:underline"
              >
                {guidance.navigationLabel ?? 'View →'}
              </Link>
            )}
          </div>
        </div>

        {/* Expected Impact vs Risk */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-raised rounded-lg p-3">
            <p className="label-xs text-status-green mb-2">Expected Impact</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              {guidance.expectedImpact}
            </p>
          </div>
          <div className="bg-surface-raised rounded-lg p-3">
            <p className="label-xs text-status-orange mb-2">Risk If Ignored</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              {guidance.riskIfIgnored}
            </p>
          </div>
        </div>

        {/* Escalated signals */}
        {escalatedSignals.length > 0 && (
          <div>
            <p className="label-xs text-status-red mb-2">
              Escalated — {escalatedSignals.length} item{escalatedSignals.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-2">
              {escalatedSignals.map(s => (
                <div key={s.id} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-status-red flex-shrink-0" />
                  <div>
                    <p className="text-xs text-text-primary">{s.title}</p>
                    {s.ageDays > 0 && (
                      <p className="text-xs text-text-muted mt-0.5">
                        {s.ageDays} day{s.ageDays !== 1 ? 's' : ''} pending — {DOMAIN_LABELS[s.domain] ?? s.domain}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critical (not yet escalated) */}
        {criticalNotEscalated.length > 0 && (
          <div>
            <p className="label-xs text-status-orange mb-2">Critical</p>
            <div className="space-y-1.5">
              {criticalNotEscalated.map(s => (
                <div key={s.id} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-status-orange flex-shrink-0" />
                  <p className="text-xs text-text-secondary">{s.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alternative actions */}
        {guidance.alternativeActions.length > 0 && (
          <div>
            <p className="label-xs mb-2">Also Consider</p>
            <div className="space-y-1">
              {guidance.alternativeActions.map((action, i) => (
                <p key={i} className="text-xs text-text-muted">
                  <span className="text-text-secondary">{i + 1}.</span> {action}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Domain health snapshot */}
        <div className="border-t border-border pt-4">
          <p className="label-xs mb-3">Domain Health</p>
          <div className="grid grid-cols-4 gap-3">
            <DomainScorePill label={DOMAIN_LABELS['players']}     score={health.playerHealth.score} />
            <DomainScorePill label={DOMAIN_LABELS['coaches']}     score={health.coachHealth.score} />
            <DomainScorePill label={DOMAIN_LABELS['parents']}     score={health.parentHealth.score} />
            <DomainScorePill label={DOMAIN_LABELS['assessments']} score={health.assessmentCompliance.score} />
          </div>
        </div>
      </div>
    </div>
  )
}
