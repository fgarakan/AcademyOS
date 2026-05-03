import type {
  CurriculumLevel,
  CurriculumGate,
  CurriculumDrill,
  CurriculumCoachLanguage,
  CurriculumCompetitionTrack,
  CurriculumFitnessGuidance,
  CurriculumVolumeGuidance,
} from '@/lib/backend/curriculumExplorer'

const DOMAIN_COLOR: Record<string, string> = {
  Technical: 'text-sky-400',
  Tactical: 'text-indigo-400',
  Movement: 'text-emerald-400',
  Competition: 'text-orange-400',
  Mentality: 'text-purple-400',
  'Fitness Support': 'text-lime',
  Fitness: 'text-lime',
  Recovery: 'text-blue-400',
  Lifestyle: 'text-pink-400',
}

const STAGE_COLOR: Record<string, string> = {
  red_foundation: 'text-red-400',
  orange_development: 'text-amber-400',
  green_performance: 'text-green-400',
  yellow_competitive: 'text-yellow-300',
  high_performance: 'text-violet-400',
}

interface Props {
  level: CurriculumLevel
  gates: CurriculumGate[]
  drills: CurriculumDrill[]
  coachLanguage: CurriculumCoachLanguage[]
  competition: CurriculumCompetitionTrack | null
  fitness: CurriculumFitnessGuidance | null
  volume: CurriculumVolumeGuidance | null
  tablesAvailable: boolean
}

export function CurriculumLevelDetailPanel({
  level,
  gates,
  drills,
  coachLanguage,
  competition,
  fitness,
  volume,
  tablesAvailable,
}: Props) {
  const stageColor = STAGE_COLOR[level.stage] ?? 'text-text-secondary'
  const stageLabel = level.stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const gatesByDomain = gates.reduce<Record<string, CurriculumGate[]>>((acc, g) => {
    acc[g.domain] = acc[g.domain] ?? []
    acc[g.domain].push(g)
    return acc
  }, {})

  return (
    <div className="space-y-3">

      {/* Level header */}
      <div className="px-5 py-4 rounded-xl border border-border bg-surface">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-[10px] uppercase tracking-widest font-medium mb-0.5 ${stageColor}`}>
              {stageLabel}
            </p>
            <h2 className="text-base font-semibold text-text-primary">{level.display_name}</h2>
          </div>
          {level.min_utr != null && (
            <div className="text-right shrink-0">
              <p className="text-[10px] text-text-muted">Min UTR</p>
              <p className="text-sm font-mono text-lime">{level.min_utr}</p>
            </div>
          )}
        </div>

        {tablesAvailable && (
          <div className="flex gap-5 mt-3 pt-3 border-t border-border">
            <div>
              <p className="text-[10px] text-text-muted">Exit gates</p>
              <p className="text-base font-mono font-bold text-text-primary">{gates.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted">Drills</p>
              <p className="text-base font-mono font-bold text-text-primary">{drills.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted">Coach language</p>
              <p className="text-base font-mono font-bold text-text-primary">{coachLanguage.length}</p>
            </div>
            {level.advance_min_domains_complete != null && (
              <div>
                <p className="text-[10px] text-text-muted">Min domains</p>
                <p className="text-base font-mono font-bold text-text-primary">
                  {level.advance_min_domains_complete}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {!tablesAvailable && (
        <div className="px-4 py-3 rounded-xl border border-border bg-surface">
          <p className="text-[11px] text-text-muted">
            Gate, drill, and language data require migration 052 to be applied.
          </p>
        </div>
      )}

      {tablesAvailable && (
        <>
          {/* Exit gates by domain */}
          {Object.keys(gatesByDomain).length > 0 && (
            <div className="px-5 py-4 rounded-xl border border-border bg-surface">
              <p className="label-xs mb-3">Exit Gates ({gates.length})</p>
              <div className="space-y-3">
                {Object.entries(gatesByDomain).map(([domain, domainGates]) => (
                  <div key={domain}>
                    <p className={`text-[10px] font-semibold mb-1 ${DOMAIN_COLOR[domain] ?? 'text-text-muted'}`}>
                      {domain}
                    </p>
                    <div className="space-y-1">
                      {domainGates.map(g => (
                        <div key={g.id} className="flex items-start gap-2">
                          <span className="text-[10px] font-mono text-text-muted shrink-0 mt-0.5">
                            {g.gate_type.slice(0, 3)}
                          </span>
                          <p className="text-[10px] text-text-secondary leading-snug">{g.criterion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drills preview */}
          {drills.length > 0 && (
            <div className="px-5 py-4 rounded-xl border border-border bg-surface">
              <p className="label-xs mb-3">Drills ({drills.length})</p>
              <div className="space-y-2">
                {drills.slice(0, 7).map(d => (
                  <div key={d.id} className="flex items-start gap-2">
                    <span className={`text-[9px] font-mono shrink-0 mt-0.5 px-1 py-0.5 rounded border ${DOMAIN_COLOR[d.domain] ? `${DOMAIN_COLOR[d.domain]} border-current/30 bg-current/5` : 'text-text-muted border-border'}`}>
                      {d.session_block.slice(0, 3).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-text-secondary truncate">{d.name}</p>
                      <p className="text-[10px] text-text-muted">
                        {d.domain}
                        {d.duration_minutes ? ` · ${d.duration_minutes}min` : ''}
                        {d.players_needed ? ` · ${d.players_needed}p` : ''}
                      </p>
                    </div>
                  </div>
                ))}
                {drills.length > 7 && (
                  <p className="text-[10px] text-text-muted">+{drills.length - 7} more drills</p>
                )}
              </div>
            </div>
          )}

          {/* Coach language */}
          {coachLanguage.length > 0 && (
            <div className="px-5 py-4 rounded-xl border border-border bg-surface">
              <p className="label-xs mb-3">Coach Language ({coachLanguage.length} domains)</p>
              <div className="space-y-3">
                {coachLanguage.slice(0, 4).map(cl => (
                  <div key={cl.id}>
                    <p className={`text-[10px] font-semibold mb-1 ${DOMAIN_COLOR[cl.domain] ?? 'text-text-muted'}`}>
                      {cl.domain}
                    </p>
                    <p className="text-[10px] text-text-secondary italic leading-relaxed">
                      &ldquo;{cl.doing_well}&rdquo;
                    </p>
                  </div>
                ))}
                {coachLanguage.length > 4 && (
                  <p className="text-[10px] text-text-muted">+{coachLanguage.length - 4} more domains</p>
                )}
              </div>
            </div>
          )}

          {/* Competition / Fitness / Volume snapshot */}
          {(competition || fitness || volume) && (
            <div className="grid grid-cols-3 gap-2">
              {competition && (
                <div className="px-3 py-3 rounded-xl border border-border bg-surface">
                  <p className="label-xs mb-2">Competition</p>
                  {competition.match_format && (
                    <p className="text-[10px] text-text-secondary leading-snug">
                      {competition.match_format}
                    </p>
                  )}
                  {competition.tournament_cadence && (
                    <p className="text-[10px] text-text-muted mt-1">{competition.tournament_cadence}</p>
                  )}
                </div>
              )}
              {fitness && (
                <div className="px-3 py-3 rounded-xl border border-border bg-surface">
                  <p className="label-xs mb-2">Fitness</p>
                  <p className="text-[10px] text-text-secondary capitalize">
                    {fitness.fitness_phase.replace(/_/g, ' ')}
                  </p>
                  {fitness.strength_band && (
                    <p className="text-[10px] text-text-muted mt-1">{fitness.strength_band}</p>
                  )}
                  {(fitness.off_court_sessions_per_week_min != null) && (
                    <p className="text-[10px] text-text-muted mt-1">
                      {fitness.off_court_sessions_per_week_min}–{fitness.off_court_sessions_per_week_max}x/wk off-court
                    </p>
                  )}
                </div>
              )}
              {volume && (
                <div className="px-3 py-3 rounded-xl border border-border bg-surface">
                  <p className="label-xs mb-2">Volume</p>
                  {volume.weekly_hours_min != null && volume.weekly_hours_max != null && (
                    <p className="text-[11px] font-mono text-lime">
                      {volume.weekly_hours_min}–{volume.weekly_hours_max}h/wk
                    </p>
                  )}
                  {volume.sessions_per_week_min != null && (
                    <p className="text-[10px] text-text-muted mt-1">
                      {volume.sessions_per_week_min}–{volume.sessions_per_week_max} sessions
                    </p>
                  )}
                  {volume.typical_stage_months_min != null && (
                    <p className="text-[10px] text-text-muted mt-1">
                      Typical: {volume.typical_stage_months_min}–{volume.typical_stage_months_max}mo
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
