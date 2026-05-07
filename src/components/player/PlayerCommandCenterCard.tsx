import {
  ArrowRight,
  Zap,
  Clock,
  AlertCircle,
  ClipboardList,
  MessageSquare,
  Eye,
  CheckCircle2,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, LevelBadge } from '@/components/ui'
import { formatDate } from '@/lib/utils'

interface Props {
  currentLevelName: string | null
  currentStage: string | null
  nextLevelName: string | null
  developmentFocus: string | null
  doingWell: string[]
  workingOn: string[]
  activePriorityCount: number
  gateCount: number
  assessmentCount: number
  latestAssessmentDate: string | null
  latestAssessmentScore: number | null
  advancementEligible: boolean | null
  hasCurriculumState: boolean
}

function StatPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex-1 flex flex-col items-center py-2.5 px-2 rounded-xl border border-border bg-surface-raised">
      <span className={`text-xl font-mono font-bold ${value > 0 ? color : 'text-text-muted'}`}>
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-widest text-text-muted text-center leading-tight mt-0.5">
        {label}
      </span>
    </div>
  )
}

function ActionRow({ icon, label, tab }: { icon: ReactNode; label: string; tab: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 px-3">
      <div className="flex items-center gap-2">
        <span className="text-text-muted shrink-0">{icon}</span>
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <span className="text-[10px] text-text-muted bg-surface border border-border px-2 py-0.5 rounded shrink-0 whitespace-nowrap">
        {tab}
      </span>
    </div>
  )
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-status-green'
  if (score >= 50) return 'text-lime'
  if (score >= 25) return 'text-status-orange'
  return 'text-status-red'
}

export function PlayerCommandCenterCard({
  currentLevelName,
  currentStage,
  nextLevelName,
  developmentFocus,
  doingWell,
  workingOn,
  activePriorityCount,
  gateCount,
  assessmentCount,
  latestAssessmentDate,
  latestAssessmentScore,
  advancementEligible,
  hasCurriculumState,
}: Props) {
  const primaryFocus = developmentFocus ?? workingOn[0] ?? doingWell[0] ?? null
  const extraFocusCount = workingOn.length > 1 ? workingOn.length - 1 : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <p className="label-xs">Player Command Center</p>
          <span className="text-[10px] uppercase tracking-widest text-text-muted bg-surface-raised border border-border px-2 py-0.5 rounded">
            Director View
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-5">

        {/* 1. Level + advancement status */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            {hasCurriculumState ? (
              <>
                {currentStage ? (
                  <LevelBadge
                    stage={currentStage}
                    levelName={currentLevelName ?? undefined}
                    size="md"
                  />
                ) : (
                  <p className="text-base font-bold text-text-primary">{currentLevelName ?? '—'}</p>
                )}
                {nextLevelName && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <ArrowRight className="w-3 h-3 text-text-muted shrink-0" />
                    <span className="text-[11px] text-text-muted">Targeting</span>
                    <span className="text-[11px] text-lime font-medium">{nextLevelName}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <AlertCircle className="w-4 h-4 text-status-orange shrink-0" />
                <p className="text-sm text-status-orange font-medium">No level assigned</p>
                <p className="text-[11px] text-text-muted">— assign one in Skill Path tab</p>
              </div>
            )}
          </div>

          {hasCurriculumState && (
            <div className="shrink-0">
              {advancementEligible === true && (
                <span className="px-2.5 py-1 rounded-lg bg-status-green/10 border border-status-green/20 text-[10px] text-status-green font-semibold uppercase tracking-wider">
                  Ready to Advance
                </span>
              )}
              {advancementEligible === false && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-raised border border-border text-[10px] text-text-muted uppercase tracking-wider">
                  <Clock className="w-2.5 h-2.5 shrink-0" /> In Progress
                </span>
              )}
              {advancementEligible === null && (
                <span className="px-2.5 py-1 rounded-lg bg-surface-raised border border-border text-[10px] text-text-muted uppercase tracking-wider">
                  Not Evaluated
                </span>
              )}
            </div>
          )}
        </div>

        {/* 2. Development focus */}
        {primaryFocus ? (
          <div className="px-3 py-3 rounded-xl border border-lime/20 bg-lime/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-lime shrink-0" />
              <p className="text-[10px] uppercase tracking-widest text-lime/80">Current Focus</p>
            </div>
            <p className="text-sm text-text-primary leading-snug">{primaryFocus}</p>
            {extraFocusCount > 0 && (
              <p className="text-[10px] text-text-muted mt-1.5">
                +{extraFocusCount} more area{extraFocusCount > 1 ? 's' : ''} · open Notes tab
              </p>
            )}
          </div>
        ) : (
          <div className="px-3 py-3 rounded-xl border border-border border-dashed">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-text-muted shrink-0" />
              <p className="text-[10px] uppercase tracking-widest text-text-muted">No Focus Set Yet</p>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Add coach observations in Notes tab, then use AI Draft to generate a development focus.
            </p>
          </div>
        )}

        {/* 3. Quick stats */}
        <div className="flex gap-2">
          <StatPill
            value={activePriorityCount}
            label="Active Priorities"
            color="text-status-orange"
          />
          <StatPill
            value={gateCount}
            label="Gate Criteria"
            color="text-lime"
          />
          <StatPill
            value={assessmentCount}
            label="Assessments"
            color="text-status-blue"
          />
        </div>

        {/* 4. Latest assessment teaser */}
        {latestAssessmentDate ? (
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
            <div className="flex items-center gap-2.5">
              <ClipboardList className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Latest Assessment</p>
                <p className="text-xs text-text-secondary">{formatDate(latestAssessmentDate)}</p>
              </div>
            </div>
            {latestAssessmentScore !== null && (
              <span className={`text-xl font-mono font-bold ${scoreColor(latestAssessmentScore)}`}>
                {latestAssessmentScore}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-surface-raised border border-border border-dashed">
            <ClipboardList className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <p className="text-[11px] text-text-muted">
              No assessments recorded yet — run one below in this tab
            </p>
          </div>
        )}

        {/* 5. Next Best Actions */}
        <div>
          <p className="label-xs mb-2">Next Best Actions</p>
          <div className="rounded-xl border border-border bg-surface-raised overflow-hidden divide-y divide-border">
            <ActionRow
              icon={<MessageSquare className="w-3.5 h-3.5" />}
              label="Add a coach note"
              tab="Notes"
            />
            <ActionRow
              icon={<Eye className="w-3.5 h-3.5" />}
              label="Review or generate AI summary"
              tab="Notes → AI Draft"
            />
            <ActionRow
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              label="Record gate evidence"
              tab="Skill Path"
            />
            <ActionRow
              icon={<ClipboardList className="w-3.5 h-3.5" />}
              label="Run a quick assessment"
              tab="Overview ↓ scroll"
            />
            <ActionRow
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              label="Evaluate advancement readiness"
              tab="Skill Path"
            />
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
