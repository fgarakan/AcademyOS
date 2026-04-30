import { Card, CardHeader, CardContent } from '@/components/ui'
import { ArrowRight } from 'lucide-react'

interface LevelRequirements {
  sort_order: number | null
  level_number: number | null
  min_assessment_score: number | null
  min_domains_mastered: number | null
  min_total_outcomes: number | null
  min_weeks_at_level: number | null
  requires_director_approval: boolean | null
  requires_final_assessment: boolean | null
  blocking_signal_types: string[] | null
}

interface NextLevel {
  display_name: string
  level_number: number
  stage: string
}

interface TrackScores {
  technical_score: number | null
  tactical_score: number | null
  competition_score: number | null
  movement_score: number | null
}

interface Props {
  hasCurriculumState: boolean
  currentLevelName: string | null
  currentStageName: string | null
  advancementEligible: boolean | null
  nextLevel: NextLevel | null
  requirements: LevelRequirements | null
  trackScores: TrackScores | null
}

function RequirementRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-b-0">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className="text-xs font-mono text-lime">{value}</span>
    </div>
  )
}

const STAGE_LABELS: Record<string, string> = {
  red_foundation:      'Red — Foundation',
  orange_development:  'Orange — Development',
  green_performance:   'Green — Performance',
  yellow_competitive:  'Yellow — Competitive',
  high_performance:    'High Performance',
}

export function PlayerProgressionRequirements({
  hasCurriculumState,
  currentLevelName,
  currentStageName,
  advancementEligible,
  nextLevel,
  requirements,
  trackScores,
}: Props) {
  const hasAnyRequirement =
    requirements !== null &&
    (requirements.min_assessment_score !== null ||
      requirements.min_domains_mastered !== null ||
      requirements.min_total_outcomes !== null ||
      requirements.min_weeks_at_level !== null ||
      requirements.requires_director_approval ||
      requirements.requires_final_assessment)

  const hasTrackScores =
    trackScores !== null &&
    (trackScores.technical_score !== null ||
      trackScores.tactical_score !== null ||
      trackScores.competition_score !== null ||
      trackScores.movement_score !== null)

  return (
    <Card>
      <CardHeader>
        <p className="label-xs">Progression Requirements</p>
      </CardHeader>
      <CardContent className="pt-0 space-y-5">

        <p className="text-[11px] text-text-muted leading-relaxed">
          Read-only development guidance. This does not move the player up, change priorities, or publish anything to parents.
        </p>

        {!hasCurriculumState ? (
          <p className="text-xs text-text-muted">
            No curriculum level has been assigned to this player yet. Use the Skill Path tab to assign a curriculum.
          </p>
        ) : (
          <>
            {/* Current + Next Level */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-raised border border-border rounded p-4">
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Current Level</p>
                <p className="text-sm font-medium text-text-primary leading-snug">
                  {currentLevelName ?? '—'}
                </p>
                {currentStageName && (
                  <p className="text-[11px] text-text-secondary mt-1">{currentStageName}</p>
                )}
              </div>

              <div className="bg-surface-raised border border-border rounded p-4">
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Next Target</p>
                {nextLevel ? (
                  <>
                    <p className="text-sm font-medium text-text-primary leading-snug">
                      {nextLevel.display_name}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-1">
                      {STAGE_LABELS[nextLevel.stage] ?? nextLevel.stage}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-text-muted">Next target level has not been configured yet.</p>
                )}
              </div>
            </div>

            {/* Advancement eligibility status */}
            {advancementEligible !== null && (
              <div
                className={`text-xs px-3 py-2 rounded border ${
                  advancementEligible
                    ? 'border-lime/30 bg-lime/5 text-lime'
                    : 'border-border text-text-muted'
                }`}
              >
                {advancementEligible
                  ? 'Player currently meets advancement criteria.'
                  : 'Player does not currently meet advancement criteria.'}
              </div>
            )}

            {/* Advancement criteria */}
            <div>
              <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">
                Advancement Criteria
              </p>

              {hasAnyRequirement ? (
                <div className="bg-surface-raised border border-border rounded px-4 py-1">
                  {requirements!.min_assessment_score !== null && (
                    <RequirementRow
                      label="Min assessment score"
                      value={String(requirements!.min_assessment_score)}
                    />
                  )}
                  {requirements!.min_domains_mastered !== null && (
                    <RequirementRow
                      label="Min domains mastered"
                      value={String(requirements!.min_domains_mastered)}
                    />
                  )}
                  {requirements!.min_total_outcomes !== null && (
                    <RequirementRow
                      label="Min total outcomes"
                      value={String(requirements!.min_total_outcomes)}
                    />
                  )}
                  {requirements!.min_weeks_at_level !== null && (
                    <RequirementRow
                      label="Min weeks at level"
                      value={String(requirements!.min_weeks_at_level)}
                    />
                  )}
                  {requirements!.requires_director_approval && (
                    <RequirementRow label="Director approval required" value="Yes" />
                  )}
                  {requirements!.requires_final_assessment && (
                    <RequirementRow label="Final assessment required" value="Yes" />
                  )}
                </div>
              ) : (
                <p className="text-xs text-text-muted">
                  Progression requirements are not configured for this level yet. Future curriculum spine sprints will connect level-up requirements across Skill, Competition, and Fitness.
                </p>
              )}

              {/* Blocking signal types */}
              {requirements?.blocking_signal_types && requirements.blocking_signal_types.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1.5">
                    Blocking signals
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {requirements.blocking_signal_types.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] bg-surface border border-border text-status-orange px-2 py-0.5 rounded"
                      >
                        {s.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Track scores — current development context */}
            {hasTrackScores && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1.5">
                  Current Development Scores
                </p>
                <p className="text-[11px] text-text-muted mb-3">
                  Per-track level requirements across Skill, Competition, and Fitness will be connected in a future curriculum sprint.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { label: 'Technical',    value: trackScores!.technical_score },
                    { label: 'Tactical',     value: trackScores!.tactical_score },
                    { label: 'Competition',  value: trackScores!.competition_score },
                    { label: 'Movement',     value: trackScores!.movement_score },
                  ] as const).filter((s) => s.value !== null).map(({ label, value }) => (
                    <div
                      key={label}
                      className="bg-surface-raised border border-border rounded p-3 text-center"
                    >
                      <p className="text-lg font-mono font-bold text-lime">
                        {typeof value === 'number' ? value.toFixed(1) : '—'}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted mt-0.5">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </CardContent>
    </Card>
  )
}
