import { Card, CardContent, CardHeader } from '@/components/ui'
import type { CurriculumDrillRow } from '@/lib/templates/curriculumTemplateLinks'

const DOMAIN_BADGE: Record<string, string> = {
  Technical:         'text-sky-400    border-sky-400/30    bg-sky-400/5',
  Tactical:          'text-indigo-400  border-indigo-400/30  bg-indigo-400/5',
  Movement:          'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  Competition:       'text-orange-400  border-orange-400/30  bg-orange-400/5',
  Mentality:         'text-purple-400  border-purple-400/30  bg-purple-400/5',
  'Fitness Support': 'text-lime        border-lime/30        bg-lime/5',
  Fitness:           'text-lime        border-lime/30        bg-lime/5',
  Recovery:          'text-blue-400    border-blue-400/30    bg-blue-400/5',
  Lifestyle:         'text-pink-400    border-pink-400/30    bg-pink-400/5',
}

const SESSION_BLOCK_ORDER = ['Warm-Up', 'Focus', 'Train', 'Play', 'Game']

const SESSION_BLOCK_BADGE: Record<string, string> = {
  'Warm-Up': 'text-status-orange  border-status-orange/30  bg-status-orange/5',
  'Focus':   'text-sky-400        border-sky-400/30        bg-sky-400/5',
  'Train':   'text-lime           border-lime/30           bg-lime/5',
  'Play':    'text-purple-400     border-purple-400/30     bg-purple-400/5',
  'Game':    'text-indigo-400     border-indigo-400/30     bg-indigo-400/5',
}

function parseCues(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter(c => typeof c === 'string').slice(0, 3)
  if (typeof raw === 'object' && raw !== null) {
    const known = ['setup', 'key_point', 'coaching_focus', 'cue_1', 'cue_2', 'cue_3']
    const vals: string[] = []
    for (const k of known) {
      const v = (raw as Record<string, unknown>)[k]
      if (typeof v === 'string' && v) vals.push(v)
    }
    return vals.slice(0, 3)
  }
  if (typeof raw === 'string' && raw) return [raw]
  return []
}

interface Props {
  drills: CurriculumDrillRow[]
  levelName: string
}

export function CurriculumDrillReferencePanel({ drills, levelName }: Props) {
  const byBlock: Record<string, CurriculumDrillRow[]> = {}
  for (const d of drills) {
    byBlock[d.session_block] = byBlock[d.session_block] ?? []
    byBlock[d.session_block].push(d)
  }

  const orderedBlocks = [
    ...SESSION_BLOCK_ORDER.filter(b => byBlock[b]),
    ...Object.keys(byBlock).filter(b => !SESSION_BLOCK_ORDER.includes(b)),
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="label-xs">Curriculum Drill Reference</p>
            <p className="text-[10px] text-text-muted mt-0.5">
              Drills aligned to <span className="text-lime">{levelName}</span> — coaching reference only.
            </p>
          </div>
          <span className="text-[10px] font-mono text-text-muted shrink-0">{drills.length} drills</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {drills.length === 0 ? (
          <p className="text-[11px] text-text-muted py-2">
            No curriculum drills found for this level.
          </p>
        ) : (
          orderedBlocks.map(block => {
            const blockDrills = byBlock[block] ?? []
            const blockBadge = SESSION_BLOCK_BADGE[block] ?? 'text-text-muted border-border bg-surface-raised'
            return (
              <div key={block}>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold mb-1.5 ${blockBadge}`}>
                  {block}
                  <span className="opacity-60 font-mono">{blockDrills.length}</span>
                </span>
                <div className="space-y-2">
                  {blockDrills.map(d => {
                    const cues = parseCues(d.coaching_cues)
                    const domainBadge = DOMAIN_BADGE[d.domain] ?? 'text-text-muted border-border bg-surface-raised'
                    return (
                      <div
                        key={d.id}
                        className="px-3 py-2.5 rounded-lg border border-border bg-surface-raised space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <p className="text-[11px] text-text-primary font-medium leading-snug">{d.name}</p>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${domainBadge}`}>
                            {d.domain}
                          </span>
                        </div>

                        {d.objective && (
                          <p className="text-[10px] text-text-secondary leading-snug">{d.objective}</p>
                        )}

                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          {d.duration_minutes != null && (
                            <span className="text-[9px] text-text-muted">
                              Duration: <span className="text-text-secondary font-mono">{d.duration_minutes} min</span>
                            </span>
                          )}
                          {d.players_needed != null && (
                            <span className="text-[9px] text-text-muted">
                              Players: <span className="text-text-secondary font-mono">{d.players_needed}</span>
                            </span>
                          )}
                        </div>

                        {cues.length > 0 && (
                          <div className="space-y-0.5">
                            {cues.map((cue, i) => (
                              <p key={i} className="text-[10px] text-text-muted leading-snug">
                                <span className="text-lime/60 font-mono mr-1">·</span>{cue}
                              </p>
                            ))}
                          </div>
                        )}

                        {d.success_criteria && (
                          <p className="text-[10px] text-text-muted leading-snug">
                            <span className="text-[9px] font-semibold uppercase tracking-wide text-text-muted/50 mr-1">Success:</span>
                            {d.success_criteria}
                          </p>
                        )}

                        {(d.progression_easier || d.progression_harder) && (
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
                            {d.progression_easier && (
                              <p className="text-[10px] text-text-muted leading-snug">
                                <span className="text-[9px] font-semibold uppercase tracking-wide text-status-blue/60 mr-1">Easier:</span>
                                {d.progression_easier}
                              </p>
                            )}
                            {d.progression_harder && (
                              <p className="text-[10px] text-text-muted leading-snug">
                                <span className="text-[9px] font-semibold uppercase tracking-wide text-status-orange/60 mr-1">Harder:</span>
                                {d.progression_harder}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}

        <p className="text-[10px] text-text-muted pt-1 border-t border-border">
          Reference only — nothing is added to this template automatically.
        </p>
      </CardContent>
    </Card>
  )
}
