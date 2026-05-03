import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

const DOMAIN_BADGE: Record<string, string> = {
  Technical:       'text-sky-400   border-sky-400/30   bg-sky-400/5',
  Tactical:        'text-indigo-400 border-indigo-400/30 bg-indigo-400/5',
  Movement:        'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  Competition:     'text-orange-400 border-orange-400/30 bg-orange-400/5',
  Mentality:       'text-purple-400 border-purple-400/30 bg-purple-400/5',
  'Fitness Support': 'text-lime border-lime/30 bg-lime/5',
  Fitness:         'text-lime border-lime/30 bg-lime/5',
  Recovery:        'text-blue-400 border-blue-400/30 bg-blue-400/5',
  Lifestyle:       'text-pink-400 border-pink-400/30 bg-pink-400/5',
}

interface GateSummary {
  id: string
  domain: string
  criterion: string
  threshold: string
}

interface DrillSummary {
  id: string
  name: string
  domain: string
  session_block: string
  objective: string
  duration_minutes: number | null
}

interface LanguageSummary {
  id: string
  domain: string
  current_focus: string
}

interface Props {
  levelId: string
  levelName: string
  levelStage: string
  topGates: GateSummary[]
  topDomains: string[]
  topDrills: DrillSummary[]
  topLanguage: LanguageSummary[]
}

export function SessionCurriculumContextPanel({
  levelId: _levelId,
  levelName,
  levelStage,
  topGates,
  topDomains,
  topDrills,
  topLanguage,
}: Props) {
  const stageLabel = levelStage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <Card>
      <CardContent className="py-4 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-widest">Curriculum context</p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">{levelName}</p>
            <p className="text-[11px] text-text-muted capitalize">{stageLabel}</p>
          </div>
          <Link
            href="/director/curriculum"
            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-lime transition-colors shrink-0"
          >
            <BookOpen className="w-3 h-3" />
            Full explorer
          </Link>
        </div>

        {/* Top domains */}
        {topDomains.length > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-wide text-text-muted mb-1.5">Top domains</p>
            <div className="flex flex-wrap gap-1.5">
              {topDomains.map(d => (
                <span
                  key={d}
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    DOMAIN_BADGE[d] ?? 'text-text-muted border-border bg-surface-raised'
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Key gates */}
        {topGates.length > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-wide text-text-muted mb-1.5">
              Active gates ({topGates.length} shown)
            </p>
            <div className="space-y-1.5">
              {topGates.map(g => (
                <div key={g.id} className="px-2.5 py-2 rounded-lg border border-border bg-surface-raised">
                  <p className="text-[10px] text-text-secondary leading-snug">{g.criterion}</p>
                  {g.threshold && (
                    <p className="text-[9px] text-text-muted mt-0.5">
                      Target: <span className="text-lime font-mono">{g.threshold}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended drills */}
        {topDrills.length > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-wide text-text-muted mb-1.5">Recommended drills</p>
            <div className="space-y-1">
              {topDrills.map(d => (
                <div key={d.id} className="flex items-start gap-2">
                  <span
                    className={`text-[8px] font-mono px-1 py-0.5 rounded border shrink-0 mt-0.5 ${
                      DOMAIN_BADGE[d.domain] ?? 'text-text-muted border-border bg-surface-raised'
                    }`}
                  >
                    {d.session_block.slice(0, 3).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-text-secondary leading-snug font-medium">{d.name}</p>
                    <p className="text-[9px] text-text-muted leading-snug">{d.objective}</p>
                  </div>
                  {d.duration_minutes && (
                    <span className="text-[9px] text-text-muted font-mono shrink-0">{d.duration_minutes}m</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coach language cues */}
        {topLanguage.length > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-wide text-text-muted mb-1.5">Coach cues for today</p>
            <div className="space-y-1.5">
              {topLanguage.map(cl => (
                <div key={cl.id}>
                  <p className={`text-[9px] font-semibold uppercase tracking-wide mb-0.5 ${
                    DOMAIN_BADGE[cl.domain]?.split(' ')[0] ?? 'text-text-muted'
                  }`}>
                    {cl.domain}
                  </p>
                  <p className="text-[10px] text-text-secondary italic leading-snug">&ldquo;{cl.current_focus}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {topGates.length === 0 && topDrills.length === 0 && topLanguage.length === 0 && (
          <p className="text-[10px] text-text-muted">
            No additional curriculum data available for this level. Check the{' '}
            <Link href="/director/curriculum" className="text-lime hover:underline">
              curriculum explorer
            </Link>
            .
          </p>
        )}

        <p className="text-[10px] text-text-muted italic pt-1 border-t border-border">
          Read-only — internal coach context only.
        </p>
      </CardContent>
    </Card>
  )
}

export function SessionNoCurriculumContextPanel() {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Curriculum context</p>
        <p className="text-[11px] text-text-muted">No curriculum context assigned to this session template.</p>
        <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
          Assign a curriculum level to the session template to surface coaching context, gates, and drills here.
        </p>
        <Link
          href="/director/curriculum"
          className="inline-flex items-center gap-1 mt-2 text-[10px] text-text-muted hover:text-lime transition-colors"
        >
          <BookOpen className="w-3 h-3" />
          Explore curriculum
        </Link>
      </CardContent>
    </Card>
  )
}
