import Link from 'next/link'
import { GitBranch, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import type { AcademyOverrideRow } from '@/lib/curriculum/academyCurriculumResolution'

interface PlayerCurriculumAssignmentCardProps {
  usingAcademyVersion: boolean
  curriculumVersionName: string | null
  curriculumVersionId: string | null
  fallbackReason: string | null
  levelName: string | null
  applicableOverrides: AcademyOverrideRow[]
  warnings: string[]
}

export function PlayerCurriculumAssignmentCard({
  usingAcademyVersion,
  curriculumVersionName,
  curriculumVersionId: _curriculumVersionId,
  fallbackReason,
  levelName,
  applicableOverrides,
  warnings,
}: PlayerCurriculumAssignmentCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-lime" />
          <p className="label-xs">Curriculum Assignment</p>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">

        {/* Curriculum source */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border text-[11px]
          border-border bg-surface-raised">
          {usingAcademyVersion ? (
            <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-status-green" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-status-orange" />
          )}
          <span className={usingAcademyVersion ? 'text-text-secondary' : 'text-text-muted'}>
            {usingAcademyVersion
              ? <>Curriculum source: <span className="font-semibold text-text-primary">{curriculumVersionName}</span></>
              : fallbackReason ?? 'Using global curriculum defaults.'}
          </span>
        </div>

        {/* Level */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Assigned Level</p>
            {levelName ? (
              <p className="text-sm font-semibold text-text-primary">{levelName}</p>
            ) : (
              <p className="text-xs text-text-muted italic">Not assigned</p>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Active Overrides</p>
            <p className={`text-sm font-mono font-bold ${applicableOverrides.length > 0 ? 'text-lime' : 'text-text-muted'}`}>
              {applicableOverrides.length}
            </p>
          </div>
        </div>

        {/* Override summaries — up to 2 */}
        {applicableOverrides.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Academy Customizations</p>
            {applicableOverrides.slice(0, 2).map(ov => {
              const change = ov.applied_change ?? ov.proposed_change
              const summary = (change as any)?.proposed_change_summary ?? (change as any)?.summary ?? null
              const rawIn = ov.raw_input
              return (
                <div key={ov.id} className="text-[11px] text-text-secondary px-2 py-1.5 rounded bg-surface-raised border border-border">
                  {summary ?? rawIn ?? `${ov.override_type} override`}
                </div>
              )
            })}
            {applicableOverrides.length > 2 && (
              <p className="text-[10px] text-text-muted">
                +{applicableOverrides.length - 2} more override{applicableOverrides.length - 2 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-1">
            {warnings.map((w, i) => (
              <p key={i} className="text-[11px] text-status-orange flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                {w}
              </p>
            ))}
          </div>
        )}

        <div className="pt-1 border-t border-border">
          <Link
            href="/director/curriculum"
            className="text-[11px] text-text-muted hover:text-lime transition-colors"
          >
            Manage academy curriculum →
          </Link>
        </div>

      </CardContent>
    </Card>
  )
}
