// PlayerPathwayEvidenceCards — Sprint 1058
// Director-facing pathway evidence summary cards: Skill / Competition / Fitness.
// Shows latest evidence, count, missing evidence signal, and source labels.
// Director-only. No parent/player exposure. No mutations. No automatic recommendations.

import { Zap, Trophy, Activity, AlertCircle, Clock } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import type { PathwayEvidenceData, CoachObservationItem } from '@/lib/players/playerEvidenceRepository'

interface Props {
  pathwayEvidence: PathwayEvidenceData | null
  isSchemaMissing: boolean
  currentFocusSkill?: string | null
  currentFocusCompetition?: string | null
  currentFocusFitness?: string | null
}

interface PathwayCardProps {
  icon: React.ReactNode
  label: string
  accentClass: string
  borderClass: string
  bgClass: string
  items: CoachObservationItem[]
  currentFocus?: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function PathwayCard({ icon, label, accentClass, borderClass, bgClass, items, currentFocus }: PathwayCardProps) {
  const latest = items[0] ?? null
  const count = items.length
  const hasEvidence = count > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl ${bgClass} ${borderClass} border flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-text-primary text-sm">{label}</p>
            {currentFocus && (
              <p className="text-text-muted text-[10px] truncate">{currentFocus}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Count row */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-text-secondary">Observations recorded</p>
          <p className={`text-sm font-mono font-bold ${hasEvidence ? accentClass : 'text-text-muted'}`}>{count}</p>
        </div>

        {/* Latest evidence */}
        {latest ? (
          <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Latest</p>
              <div className="flex items-center gap-1 text-[10px] text-text-muted">
                <Clock className="w-2.5 h-2.5" />
                {formatDate(latest.createdAt)}
              </div>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
              {latest.content}
            </p>
            {latest.coachName && (
              <p className="text-[10px] text-text-muted">— {latest.coachName}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
            <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0" />
            <p className="text-xs text-status-orange">No evidence recorded yet</p>
          </div>
        )}

        {/* Missing evidence / recommended next */}
        {!hasEvidence && (
          <p className="text-[10px] text-text-muted leading-relaxed">
            Recommended: record a {label.toLowerCase()} observation in the next coaching session.
          </p>
        )}

        {/* Source + director note */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[10px] text-text-muted uppercase tracking-widest">Coach observations</span>
          <span className="text-[10px] text-text-muted">Director review required</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function PlayerPathwayEvidenceCards({
  pathwayEvidence,
  isSchemaMissing,
  currentFocusSkill,
  currentFocusCompetition,
  currentFocusFitness,
}: Props) {
  if (isSchemaMissing || !pathwayEvidence) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {['Skill', 'Competition', 'Fitness'].map(label => (
          <Card key={label}>
            <CardHeader>
              <p className="text-sm font-semibold text-text-primary">{label} Path</p>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-text-muted">{isSchemaMissing ? 'Schema not yet deployed.' : 'Evidence unavailable.'}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <PathwayCard
        icon={<Zap className="w-4 h-4 text-lime" />}
        label="Skill Path"
        accentClass="text-lime"
        borderClass="border-lime/20"
        bgClass="bg-lime/10"
        items={pathwayEvidence.skillEvidence}
        currentFocus={currentFocusSkill}
      />
      <PathwayCard
        icon={<Trophy className="w-4 h-4 text-status-orange" />}
        label="Competition Path"
        accentClass="text-status-orange"
        borderClass="border-status-orange/20"
        bgClass="bg-status-orange/10"
        items={pathwayEvidence.competitionEvidence}
        currentFocus={currentFocusCompetition}
      />
      <PathwayCard
        icon={<Activity className="w-4 h-4 text-status-blue" />}
        label="Fitness Path"
        accentClass="text-status-blue"
        borderClass="border-status-blue/20"
        bgClass="bg-status-blue/10"
        items={pathwayEvidence.fitnessEvidence}
        currentFocus={currentFocusFitness}
      />
    </div>
  )
}
