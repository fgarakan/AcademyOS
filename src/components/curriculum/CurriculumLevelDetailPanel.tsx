'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type {
  CurriculumLevel,
  CurriculumGate,
  CurriculumDrill,
  CurriculumCoachLanguage,
  CurriculumCompetitionTrack,
  CurriculumFitnessGuidance,
  CurriculumVolumeGuidance,
} from '@/lib/backend/curriculumExplorer'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'

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

const DOMAIN_BADGE: Record<string, string> = {
  Technical: 'text-sky-400 border-sky-400/30 bg-sky-400/5',
  Tactical: 'text-indigo-400 border-indigo-400/30 bg-indigo-400/5',
  Movement: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  Competition: 'text-orange-400 border-orange-400/30 bg-orange-400/5',
  Mentality: 'text-purple-400 border-purple-400/30 bg-purple-400/5',
  'Fitness Support': 'text-lime border-lime/30 bg-lime/5',
  Fitness: 'text-lime border-lime/30 bg-lime/5',
  Recovery: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  Lifestyle: 'text-pink-400 border-pink-400/30 bg-pink-400/5',
}

const STAGE_COLOR: Record<string, string> = {
  red_foundation: 'text-red-400',
  orange_development: 'text-amber-400',
  green_performance: 'text-green-400',
  yellow_competitive: 'text-yellow-300',
  high_performance: 'text-violet-400',
}

// ─── Level summary header ─────────────────────────────────────────────────────

function LevelHeader({
  level,
  gates,
  drills,
  coachLanguage,
  tablesAvailable,
}: {
  level: CurriculumLevel
  gates: CurriculumGate[]
  drills: CurriculumDrill[]
  coachLanguage: CurriculumCoachLanguage[]
  tablesAvailable: boolean
}) {
  const stageColor = STAGE_COLOR[level.stage] ?? 'text-text-secondary'
  const stageLabel = level.stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const stats = [
    ...(tablesAvailable ? [
      { label: 'Exit gates',     value: gates.length },
      { label: 'Drills',         value: drills.length },
      { label: 'Coach language', value: coachLanguage.length },
    ] : []),
    ...(level.advance_min_domains_complete != null
      ? [{ label: 'Min domains', value: level.advance_min_domains_complete }]
      : []),
    ...(level.advance_min_outcomes != null
      ? [{ label: 'Min outcomes', value: level.advance_min_outcomes }]
      : []),
  ]

  return (
    <div className="px-5 py-4 rounded-xl border border-border bg-surface">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-[10px] uppercase tracking-widest font-medium mb-0.5 ${stageColor}`}>
            {stageLabel} · Level {level.level_number}
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

      {stats.length > 0 && (
        <div className="flex flex-wrap gap-5 mt-3 pt-3 border-t border-border">
          {stats.map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] text-text-muted">{label}</p>
              <p className="text-base font-mono font-bold text-text-primary">{value}</p>
            </div>
          ))}
          {level.is_assessment_required && (
            <div>
              <p className="text-[10px] text-text-muted">Assessment</p>
              <p className="text-[11px] text-status-orange font-medium">Required</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Gate row (expandable) ────────────────────────────────────────────────────

function GateRow({ gate }: { gate: CurriculumGate }) {
  const [expanded, setExpanded] = useState(false)
  const isExitGate = gate.to_level_id === null
  const hasDetail = gate.evidence_window || gate.recording_method || gate.notes

  return (
    <div
      className={`rounded-lg border transition-all ${
        expanded ? 'border-lime/20 bg-lime/3' : 'border-border bg-surface-raised'
      }`}
    >
      <button
        onClick={() => hasDetail && setExpanded(!expanded)}
        className={`w-full text-left px-3 py-2.5 flex items-start gap-2 ${hasDetail ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className="shrink-0 mt-0.5 w-3">
          {hasDetail && (
            expanded
              ? <ChevronDown className="w-3 h-3 text-text-muted" />
              : <ChevronRight className="w-3 h-3 text-text-muted" />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span
              className={`text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                gate.gate_type === 'skill'
                  ? 'text-sky-400 border-sky-400/30 bg-sky-400/5'
                  : 'text-orange-400 border-orange-400/30 bg-orange-400/5'
              }`}
            >
              {gate.gate_type}
            </span>
            {isExitGate && (
              <span className="text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded border text-violet-400 border-violet-400/30 bg-violet-400/5">
                final exit
              </span>
            )}
          </div>
          <p className="text-[11px] text-text-secondary leading-snug">{gate.criterion}</p>
          <div className="flex flex-wrap gap-3 mt-1.5">
            {gate.threshold && (
              <span className="text-[10px] text-text-muted">
                Threshold: <span className="text-text-secondary">{gate.threshold}</span>
              </span>
            )}
            {gate.evaluator && (
              <span className="text-[10px] text-text-muted">
                Evaluator: <span className="text-text-secondary">{gate.evaluator}</span>
              </span>
            )}
            {gate.cadence && (
              <span className="text-[10px] text-text-muted">
                Cadence: <span className="text-text-secondary">{gate.cadence}</span>
              </span>
            )}
          </div>
        </div>
      </button>

      {expanded && hasDetail && (
        <div className="px-4 pb-3 pt-2 border-t border-border/40 grid grid-cols-2 gap-2">
          {gate.evidence_window && (
            <div>
              <p className="text-[10px] text-text-muted">Evidence window</p>
              <p className="text-[11px] text-text-secondary">{gate.evidence_window}</p>
            </div>
          )}
          {gate.recording_method && (
            <div>
              <p className="text-[10px] text-text-muted">Recording method</p>
              <p className="text-[11px] text-text-secondary">{gate.recording_method}</p>
            </div>
          )}
          {gate.notes && (
            <div className="col-span-2">
              <p className="text-[10px] text-text-muted">Notes</p>
              <p className="text-[10px] text-text-secondary italic leading-relaxed">{gate.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Gates tab ────────────────────────────────────────────────────────────────

function GatesTab({ gates }: { gates: CurriculumGate[] }) {
  if (gates.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-[11px] text-text-muted">No exit gates defined for this level.</p>
      </div>
    )
  }

  const gatesByDomain = gates.reduce<Record<string, CurriculumGate[]>>((acc, g) => {
    acc[g.domain] = acc[g.domain] ?? []
    acc[g.domain].push(g)
    return acc
  }, {})

  const domainCount = Object.keys(gatesByDomain).length

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-text-muted">
        Level-up requirements — {gates.length} gate{gates.length !== 1 ? 's' : ''} across {domainCount} domain{domainCount !== 1 ? 's' : ''}
      </p>
      {Object.entries(gatesByDomain).map(([domain, domainGates]) => (
        <div key={domain}>
          <div
            className={`inline-flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded border text-[10px] font-semibold ${
              DOMAIN_BADGE[domain] ?? 'text-text-muted border-border bg-surface-raised'
            }`}
          >
            {domain}
            <span className="opacity-60 font-mono">{domainGates.length}</span>
          </div>
          <div className="space-y-1.5">
            {domainGates.map(g => <GateRow key={g.id} gate={g} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Drill row (expandable) ───────────────────────────────────────────────────

function DrillRow({ drill }: { drill: CurriculumDrill }) {
  const [expanded, setExpanded] = useState(false)
  const badgeClass = DOMAIN_BADGE[drill.domain] ?? 'text-text-muted border-border bg-surface-raised'

  const hasCues = drill.coaching_cues != null && Object.keys(drill.coaching_cues).length > 0
  const hasDetail = drill.setup || hasCues || drill.progression_easier || drill.progression_harder || drill.success_criteria

  return (
    <div
      className={`rounded-lg border transition-all ${
        expanded ? 'border-lime/20' : 'border-border'
      } bg-surface-raised`}
    >
      <div className="px-3 py-2.5 flex items-start gap-2">
        {hasDetail ? (
          <button onClick={() => setExpanded(!expanded)} className="shrink-0 mt-0.5">
            {expanded
              ? <ChevronDown className="w-3 h-3 text-text-muted" />
              : <ChevronRight className="w-3 h-3 text-text-muted" />
            }
          </button>
        ) : (
          <span className="shrink-0 w-3 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className={`text-[9px] font-mono uppercase tracking-wide px-1 py-0.5 rounded border ${badgeClass}`}>
              {drill.session_block.slice(0, 3).toUpperCase()}
            </span>
            <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${badgeClass}`}>
              {drill.domain}
            </span>
            {drill.duration_minutes != null && (
              <span className="text-[9px] text-text-muted font-mono">{drill.duration_minutes}min</span>
            )}
            {drill.players_needed != null && (
              <span className="text-[9px] text-text-muted font-mono">{drill.players_needed}p</span>
            )}
          </div>
          <p className="text-[11px] font-medium text-text-primary leading-snug">{drill.name}</p>
          <p className="text-[10px] text-text-secondary leading-snug mt-0.5">{drill.objective}</p>
        </div>
      </div>

      {expanded && hasDetail && (
        <div className="px-4 pb-3 pt-2 border-t border-border/40 space-y-2.5">
          {drill.setup && (
            <div>
              <p className="text-[10px] text-text-muted font-medium mb-0.5">Setup</p>
              <p className="text-[10px] text-text-secondary leading-relaxed">{drill.setup}</p>
            </div>
          )}
          {hasCues && drill.coaching_cues && (
            <div>
              <p className="text-[10px] text-text-muted font-medium mb-1">Coaching cues</p>
              <div className="space-y-1">
                {Object.entries(drill.coaching_cues).map(([key, cue]) => (
                  <div key={key} className="flex items-start gap-2">
                    <span className="text-[9px] text-text-muted shrink-0 font-mono capitalize mt-0.5">{key}:</span>
                    <p className="text-[10px] text-text-secondary leading-snug italic">&ldquo;{cue}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(drill.progression_easier || drill.progression_harder) && (
            <div className="grid grid-cols-2 gap-2">
              {drill.progression_easier && (
                <div>
                  <p className="text-[10px] text-text-muted font-medium mb-0.5">Easier progression</p>
                  <p className="text-[10px] text-text-secondary leading-snug">{drill.progression_easier}</p>
                </div>
              )}
              {drill.progression_harder && (
                <div>
                  <p className="text-[10px] text-text-muted font-medium mb-0.5">Harder progression</p>
                  <p className="text-[10px] text-text-secondary leading-snug">{drill.progression_harder}</p>
                </div>
              )}
            </div>
          )}
          {drill.success_criteria && (
            <div>
              <p className="text-[10px] text-text-muted font-medium mb-0.5">Success criteria</p>
              <p className="text-[10px] text-text-secondary leading-relaxed">{drill.success_criteria}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Drills tab ───────────────────────────────────────────────────────────────

function DrillsTab({ drills }: { drills: CurriculumDrill[] }) {
  const [domainFilter, setDomainFilter] = useState<string>('all')

  if (drills.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-[11px] text-text-muted">No drills available for this level range.</p>
      </div>
    )
  }

  const domains = Array.from(new Set(drills.map(d => d.domain))).sort()
  const filtered = domainFilter === 'all' ? drills : drills.filter(d => d.domain === domainFilter)

  return (
    <div className="space-y-3">
      {/* Domain filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setDomainFilter('all')}
          className={`px-2 py-1 rounded border text-[10px] font-medium transition-all ${
            domainFilter === 'all'
              ? 'border-lime/40 bg-lime/10 text-lime'
              : 'border-border text-text-muted hover:text-text-secondary'
          }`}
        >
          All ({drills.length})
        </button>
        {domains.map(d => {
          const count = drills.filter(x => x.domain === d).length
          const isActive = domainFilter === d
          const color = DOMAIN_COLOR[d] ?? 'text-text-muted'
          return (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              className={`px-2 py-1 rounded border text-[10px] font-medium transition-all ${
                isActive
                  ? `${color} border-current/40 bg-current/5`
                  : 'border-border text-text-muted hover:text-text-secondary'
              }`}
            >
              {d} ({count})
            </button>
          )
        })}
      </div>

      <div className="space-y-1.5">
        {filtered.map(d => <DrillRow key={d.id} drill={d} />)}
      </div>
    </div>
  )
}

// ─── Coach language tab ───────────────────────────────────────────────────────

function CoachLanguageTab({ coachLanguage }: { coachLanguage: CurriculumCoachLanguage[] }) {
  if (coachLanguage.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-[11px] text-text-muted">No coach language defined for this level.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {coachLanguage.map(cl => (
        <div
          key={cl.id}
          className="rounded-lg border border-border bg-surface-raised px-4 py-3"
        >
          <p className={`text-[10px] font-semibold uppercase tracking-wide mb-2.5 ${DOMAIN_COLOR[cl.domain] ?? 'text-text-muted'}`}>
            {cl.domain}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {[
              { label: 'Doing well',    value: cl.doing_well },
              { label: 'Working on',    value: cl.working_on },
              { label: 'Current focus', value: cl.current_focus },
              { label: 'Next step',     value: cl.next_step },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] uppercase tracking-wide text-text-muted mb-0.5">{label}</p>
                <p className="text-[10px] text-text-secondary leading-relaxed italic">&ldquo;{value}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Fitness & competition tab ────────────────────────────────────────────────

function FitnessCompTab({
  competition,
  fitness,
  volume,
}: {
  competition: CurriculumCompetitionTrack | null
  fitness: CurriculumFitnessGuidance | null
  volume: CurriculumVolumeGuidance | null
}) {
  if (!competition && !fitness && !volume) {
    return (
      <div className="py-10 text-center">
        <p className="text-[11px] text-text-muted">No fitness or competition data for this level.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Volume */}
      {volume && (
        <div className="rounded-lg border border-border bg-surface-raised px-4 py-3">
          <p className="label-xs mb-3">Volume & Load</p>
          <div className="grid grid-cols-2 gap-3">
            {volume.weekly_hours_min != null && volume.weekly_hours_max != null && (
              <div>
                <p className="text-[10px] text-text-muted">Weekly hours</p>
                <p className="text-[15px] font-mono font-bold text-lime">
                  {volume.weekly_hours_min}–{volume.weekly_hours_max}h
                </p>
              </div>
            )}
            {volume.sessions_per_week_min != null && volume.sessions_per_week_max != null && (
              <div>
                <p className="text-[10px] text-text-muted">Sessions / week</p>
                <p className="text-[15px] font-mono font-bold text-text-primary">
                  {volume.sessions_per_week_min}–{volume.sessions_per_week_max}
                </p>
              </div>
            )}
            {volume.session_duration_min_minutes != null && volume.session_duration_max_minutes != null && (
              <div>
                <p className="text-[10px] text-text-muted">Session length</p>
                <p className="text-[11px] text-text-secondary font-mono">
                  {volume.session_duration_min_minutes}–{volume.session_duration_max_minutes} min
                </p>
              </div>
            )}
            {volume.typical_stage_months_min != null && volume.typical_stage_months_max != null && (
              <div>
                <p className="text-[10px] text-text-muted">Typical stage duration</p>
                <p className="text-[11px] text-text-secondary font-mono">
                  {volume.typical_stage_months_min}–{volume.typical_stage_months_max} mo
                </p>
              </div>
            )}
            {volume.reassessment_cadence_weeks != null && (
              <div>
                <p className="text-[10px] text-text-muted">Reassessment cadence</p>
                <p className="text-[11px] text-text-secondary">Every {volume.reassessment_cadence_weeks} wk</p>
              </div>
            )}
            {volume.acr_target_range && (
              <div>
                <p className="text-[10px] text-text-muted">ACR target</p>
                <p className="text-[11px] text-text-secondary">{volume.acr_target_range}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fitness */}
      {fitness && (
        <div className="rounded-lg border border-border bg-surface-raised px-4 py-3">
          <p className="label-xs mb-3">Fitness</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-text-muted">Phase</p>
              <p className="text-[11px] text-text-secondary capitalize">
                {fitness.fitness_phase.replace(/_/g, ' ')}
              </p>
            </div>
            {fitness.primary_energy_system && (
              <div>
                <p className="text-[10px] text-text-muted">Primary energy system</p>
                <p className="text-[11px] text-text-secondary">{fitness.primary_energy_system}</p>
              </div>
            )}
            {fitness.strength_band && (
              <div>
                <p className="text-[10px] text-text-muted">Strength band</p>
                <p className="text-[11px] text-text-secondary">{fitness.strength_band}</p>
              </div>
            )}
            {fitness.off_court_sessions_per_week_min != null && (
              <div>
                <p className="text-[10px] text-text-muted">Off-court sessions / week</p>
                <p className="text-[11px] font-mono text-lime">
                  {fitness.off_court_sessions_per_week_min}–{fitness.off_court_sessions_per_week_max}×
                </p>
              </div>
            )}
            {fitness.coaching_notes && (
              <div className="col-span-2">
                <p className="text-[10px] text-text-muted mb-0.5">Coaching notes</p>
                <p className="text-[10px] text-text-secondary leading-relaxed">{fitness.coaching_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Competition */}
      {competition && (
        <div className="rounded-lg border border-border bg-surface-raised px-4 py-3">
          <p className="label-xs mb-3">Competition</p>
          <div className="grid grid-cols-2 gap-3">
            {competition.match_format && (
              <div>
                <p className="text-[10px] text-text-muted">Match format</p>
                <p className="text-[11px] text-text-secondary leading-snug">{competition.match_format}</p>
              </div>
            )}
            {competition.scoring_system && (
              <div>
                <p className="text-[10px] text-text-muted">Scoring</p>
                <p className="text-[11px] text-text-secondary">{competition.scoring_system}</p>
              </div>
            )}
            {competition.opponent_pool && (
              <div>
                <p className="text-[10px] text-text-muted">Opponent pool</p>
                <p className="text-[11px] text-text-secondary leading-snug">{competition.opponent_pool}</p>
              </div>
            )}
            {competition.tournament_cadence && (
              <div>
                <p className="text-[10px] text-text-muted">Tournament cadence</p>
                <p className="text-[11px] text-text-secondary">{competition.tournament_cadence}</p>
              </div>
            )}
            {competition.win_loss_target && (
              <div>
                <p className="text-[10px] text-text-muted">Win / loss target</p>
                <p className="text-[11px] text-text-secondary">{competition.win_loss_target}</p>
              </div>
            )}
            {competition.transition_signal && (
              <div>
                <p className="text-[10px] text-text-muted">Transition signal</p>
                <p className="text-[11px] text-text-secondary leading-snug">{competition.transition_signal}</p>
              </div>
            )}
            {competition.competition_behaviors && (
              <div className="col-span-2">
                <p className="text-[10px] text-text-muted mb-0.5">Competition behaviors</p>
                <p className="text-[10px] text-text-secondary leading-relaxed">{competition.competition_behaviors}</p>
              </div>
            )}
            {competition.coach_role && (
              <div>
                <p className="text-[10px] text-text-muted mb-0.5">Coach role</p>
                <p className="text-[10px] text-text-secondary leading-snug">{competition.coach_role}</p>
              </div>
            )}
            {competition.parent_role && (
              <div>
                <p className="text-[10px] text-text-muted mb-0.5">Parent role</p>
                <p className="text-[10px] text-text-secondary leading-snug">{competition.parent_role}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main exported component ──────────────────────────────────────────────────

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
  return (
    <div className="space-y-3">

      <LevelHeader
        level={level}
        gates={gates}
        drills={drills}
        coachLanguage={coachLanguage}
        tablesAvailable={tablesAvailable}
      />

      {!tablesAvailable && (
        <div className="px-4 py-3 rounded-xl border border-border bg-surface">
          <p className="text-[11px] text-text-muted">
            Gate, drill, and language data require migration 052 to be applied.
          </p>
        </div>
      )}

      {tablesAvailable && (
        <div className="rounded-xl border border-border bg-surface">
          <Tabs defaultValue="gates">
            <TabsList className="px-3 pt-1" scrollable>
              <TabsTrigger value="gates">Gates ({gates.length})</TabsTrigger>
              <TabsTrigger value="drills">Drills ({drills.length})</TabsTrigger>
              <TabsTrigger value="language">Coach Language ({coachLanguage.length})</TabsTrigger>
              <TabsTrigger value="fitness">Fitness &amp; Comp</TabsTrigger>
            </TabsList>

            <div className="px-4 py-4">
              <TabsContent value="gates">
                <GatesTab gates={gates} />
              </TabsContent>
              <TabsContent value="drills">
                <DrillsTab drills={drills} />
              </TabsContent>
              <TabsContent value="language">
                <CoachLanguageTab coachLanguage={coachLanguage} />
              </TabsContent>
              <TabsContent value="fitness">
                <FitnessCompTab competition={competition} fitness={fitness} volume={volume} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}

    </div>
  )
}
