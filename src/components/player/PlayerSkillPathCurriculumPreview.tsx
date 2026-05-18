import { BookOpen, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import type { QaDrillRow } from '@/lib/player/playerProgressQa'

interface GatePreviewRow {
  id: string
  domain: string
  criterion: string
  threshold: string
}

interface Props {
  currentLevelName: string | null
  drills: QaDrillRow[]
  gates: GatePreviewRow[]
  hasCurriculumState: boolean
}

const DOMAIN_COLOR: Record<string, string> = {
  Technical:   'text-[#11d9df]',
  Tactical:    'text-status-blue',
  Movement:    'text-status-green',
  Competition: 'text-lime',
  Mentality:   'text-violet-400',
  Fitness:     'text-status-orange',
  Recovery:    'text-text-secondary',
}

function domainColor(domain: string): string {
  return DOMAIN_COLOR[domain] ?? 'text-text-muted'
}

export function PlayerSkillPathCurriculumPreview({
  currentLevelName,
  drills,
  gates,
  hasCurriculumState,
}: Props) {
  if (!hasCurriculumState) return null

  const drillsByDomain = drills.reduce<Record<string, QaDrillRow[]>>((acc, d) => {
    if (!acc[d.domain]) acc[d.domain] = []
    acc[d.domain].push(d)
    return acc
  }, {})

  const domainKeys = Object.keys(drillsByDomain)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#11d9df]" />
            <p className="label-xs">Skill Path</p>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[#11d9df] px-2 py-0.5 rounded border border-[#11d9df]/20 bg-[#11d9df]/5">
            Curriculum preview
          </span>
        </div>
        {currentLevelName && (
          <p className="text-sm text-text-secondary mt-1">{currentLevelName}</p>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-5">

        {domainKeys.length > 0 ? (
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Drills at this level</p>
            {domainKeys.map(domain => (
              <div key={domain}>
                <p className={`text-[11px] font-semibold mb-1.5 ${domainColor(domain)}`}>{domain}</p>
                <div className="space-y-1.5">
                  {drillsByDomain[domain].map(drill => (
                    <div key={drill.id} className="px-3 py-2 rounded-lg bg-surface-raised border border-border">
                      <p className="text-xs text-text-primary font-medium">{drill.name}</p>
                      {drill.objective && (
                        <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{drill.objective}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-3 py-3 rounded-lg border border-dashed border-border">
            <p className="text-[11px] text-text-muted">No drills found for this level in the curriculum spine.</p>
          </div>
        )}

        {gates.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Advancement gates</p>
            {gates.map(gate => (
              <div key={gate.id} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-surface-raised border border-border">
                <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] text-text-primary leading-snug">{gate.criterion}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] ${domainColor(gate.domain)}`}>{gate.domain}</span>
                    {gate.threshold && (
                      <span className="text-[10px] text-text-muted">· {gate.threshold}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-text-muted leading-relaxed border-t border-border pt-3">
          Curriculum-derived preview. Drill completion and gate pass/fail are not tracked here — use the gates section and evidence tools above to record advancement evidence.
        </p>

      </CardContent>
    </Card>
  )
}
