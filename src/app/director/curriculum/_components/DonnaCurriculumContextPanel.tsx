// DONNA Curriculum Context Panel V1
// Server RSC rendered when ?improve=[levelKey] is in the URL.
// Shows DONNA's context-first analysis: current curriculum state + evidence signals + improvement suggestions.
// Director approves suggestions before anything is applied.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import { getPlayerEvidenceRecords } from '@/lib/evidence/playerEvidenceAggregator'
import { calculateLevelReadiness } from '@/lib/evidence/levelReadinessEngine'
import { calculateDevelopmentPriorities } from '@/lib/evidence/developmentPrioritiesEngine'
import { analyzeCurriculumImprovements, type CurriculumImprovementSuggestion } from '@/lib/donna/curriculumImprovementEngine'
import { buildContextFirstSummary } from '@/lib/donna/curriculumBuilderOperator'
import { DonnaCurriculumImproveDraftButton } from './DonnaCurriculumImproveDraftButton'

// ─── Level key → label map ────────────────────────────────────────────────────
// Keys match the LevelKey type in levelInsightMap.ts (e.g. 'orange2', 'hp1').

const LEVEL_LABELS: Record<string, string> = {
  red1:    'Red Ball 1',
  red2:    'Red Ball 2',
  red3:    'Red Ball 3',
  orange1: 'Orange Ball 1',
  orange2: 'Orange Ball 2',
  orange3: 'Orange Ball 3',
  green1:  'Green Ball 1',
  green2:  'Green Ball 2',
  green3:  'Green Ball 3',
  yellow1: 'Yellow Ball 1',
  yellow2: 'Yellow Ball 2',
  yellow3: 'Yellow Ball 3',
  hp1:     'High Performance 1',
  hp2:     'High Performance 2',
  hp3:     'High Performance 3',
}

const CONFIDENCE_COLORS = {
  HIGH:   'text-status-green bg-status-green/10 border-status-green/30',
  MEDIUM: 'text-lime bg-lime/10 border-lime/30',
  LOW:    'text-status-orange bg-status-orange/10 border-status-orange/30',
}

function SuggestionCard({ suggestion }: { suggestion: CurriculumImprovementSuggestion }) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary leading-snug">{suggestion.recommendation}</p>
        </div>
        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${CONFIDENCE_COLORS[suggestion.confidence]}`}>
          {suggestion.confidence}
        </span>
      </div>

      {/* Evidence stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center px-2 py-1.5 rounded-lg bg-surface-raised border border-border">
          <p className="text-sm font-bold font-mono text-lime">{suggestion.confidenceScore}%</p>
          <p className="text-[9px] text-text-muted">Confidence</p>
        </div>
        <div className="text-center px-2 py-1.5 rounded-lg bg-surface-raised border border-border">
          <p className="text-sm font-bold font-mono text-text-primary">{suggestion.evidenceCount}</p>
          <p className="text-[9px] text-text-muted">Evidence</p>
        </div>
        <div className="text-center px-2 py-1.5 rounded-lg bg-surface-raised border border-border">
          <p className="text-sm font-bold font-mono text-text-primary">~{suggestion.affectedPlayers}</p>
          <p className="text-[9px] text-text-muted">Players</p>
        </div>
      </div>

      {/* Supporting signals */}
      {suggestion.supportingSignals.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Supporting Signals</p>
          {suggestion.supportingSignals.slice(0, 4).map((sig, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-lime text-xs mt-0.5 shrink-0">·</span>
              <p className="text-xs text-text-secondary leading-snug">{sig}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reasoning */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-text-muted">Reasoning</p>
        <p className="text-xs text-text-secondary leading-relaxed">{suggestion.reasoning}</p>
      </div>

      {/* Impact preview */}
      <details className="group">
        <summary className="text-[10px] uppercase tracking-widest text-text-muted cursor-pointer list-none flex items-center gap-1">
          <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
          Show Downstream Impact
        </summary>
        <div className="mt-2 space-y-2">
          <div className="space-y-1">
            <p className="text-[10px] text-text-muted font-medium">Will happen if approved:</p>
            {suggestion.impactLines.map((l, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-status-green shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary leading-snug">{l}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-text-muted font-medium">Will NOT happen:</p>
            {suggestion.wontHappenLines.slice(0, 3).map((l, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <AlertCircle className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
                <p className="text-xs text-text-muted leading-snug">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </details>

      {/* Draft CTA */}
      <DonnaCurriculumImproveDraftButton suggestion={suggestion} />
    </div>
  )
}

interface Props {
  levelKey: string
  academyId: string
}

export async function DonnaCurriculumContextPanel({ levelKey, academyId }: Props) {
  const levelLabel = LEVEL_LABELS[levelKey] ?? levelKey.replace(/_/g, ' ')
  const supabase = await getSupabaseServer()

  // Get all evidence records for this academy (academy-wide, not player-specific)
  // We aggregate across all players to detect curriculum-level patterns
  const { records: allRecords } = await getPlayerEvidenceRecords(supabase, '', academyId, {
    limit: 200,
    visibleToRole: 'director',
  })

  // For curriculum-level analysis, use only records with curriculum_level_name matching this level
  const levelKeyNormalized = levelKey.toLowerCase().replace(/_/g, ' ')
  const levelRecords = allRecords.filter(r => {
    if (!r.curriculum_level_name) return false
    return r.curriculum_level_name.toLowerCase().includes(levelKeyNormalized) ||
           r.curriculum_level_name.toLowerCase().replace(/\s+/g, '_') === levelKey
  })

  // If no level-specific records, use all records as a proxy (smaller academies)
  const evidenceForAnalysis = levelRecords.length >= 3 ? levelRecords : allRecords.slice(0, 50)

  // Compute readiness and priorities from available evidence
  const readiness = calculateLevelReadiness({
    evidenceRecords:  evidenceForAnalysis,
    currentLevelName: levelLabel,
    targetLevelName:  null,
    playerFirstName:  null,
  })

  const priorities = calculateDevelopmentPriorities({
    evidenceRecords:  evidenceForAnalysis,
    readinessResult:  readiness,
    playerFirstName:  null,
    currentLevelName: levelLabel,
  })

  // Run improvement analysis
  const analysis = analyzeCurriculumImprovements({
    levelKey,
    levelLabel,
    evidenceRecords: evidenceForAnalysis,
    readiness,
    priorities,
    playerCount: Math.max(5, Math.ceil(evidenceForAnalysis.length / 3)),
  })

  // Load curriculum level data (gate/skill counts)
  const rawDb = supabase as any
  let gateCount = 0
  let skillCount = 0
  let levelGoal: string | null = null

  try {
    const { data: levels } = await rawDb
      .from('curriculum_levels')
      .select('id, display_name, stage_goal')
      .eq('academy_id', academyId)
      .ilike('display_name', `%${levelLabel.split(' ')[0]}%`)
      .limit(3)

    if (levels && levels.length > 0) {
      const matchingLevel = levels.find((l: any) =>
        l.display_name?.toLowerCase().includes(levelLabel.toLowerCase().split(' ')[0])
      ) ?? levels[0]

      levelGoal = matchingLevel?.stage_goal ?? null

      try {
        const { count: gCount } = await rawDb
          .from('curriculum_gates')
          .select('*', { count: 'exact', head: true })
          .eq('level_id', matchingLevel.id)
        gateCount = (gCount as number | null) ?? 0
      } catch { /* gates table may not exist */ }

      try {
        const { count: sCount } = await rawDb
          .from('curriculum_skills')
          .select('*', { count: 'exact', head: true })
          .eq('level_id', matchingLevel.id)
        skillCount = (sCount as number | null) ?? 0
      } catch { /* skills table may not exist */ }
    }
  } catch { /* curriculum tables may not be applied */ }

  const summary = buildContextFirstSummary(
    { key: levelKey, label: levelLabel },
    levelGoal,
    gateCount,
    skillCount,
    analysis,
  )

  return (
    <div
      id="donna-curriculum-context"
      data-donna-focus-id="donna-curriculum-context"
      className="space-y-4 rounded-2xl border border-lime/20 bg-lime/3 p-4"
    >
      {/* DONNA header */}
      <div className="flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-lime shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-lime mb-1">DONNA — Curriculum Analysis</p>
          <p className="text-xs font-semibold text-text-primary">
            {levelLabel} — {analysis.suggestions.length} improvement suggestion{analysis.suggestions.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Context-first summary */}
      <div className="space-y-2 text-xs text-text-secondary leading-relaxed">
        <p>{summary.currentState}</p>
        <p className="text-text-muted">{summary.evidenceLine}</p>
      </div>

      {/* Evidence signal badges */}
      {(readiness.totalEvidenceCount > 0 || priorities.topPriorities.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {readiness.totalEvidenceCount > 0 && (
            <span className="text-[10px] px-2 py-1 rounded-lg bg-surface border border-border text-text-muted">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              {readiness.totalEvidenceCount} evidence records · {readiness.readinessStatus.replace(/_/g, ' ')}
            </span>
          )}
          {priorities.topPriorities.length > 0 && (
            <span className="text-[10px] px-2 py-1 rounded-lg bg-surface border border-border text-text-muted">
              {priorities.topPriorities.length} priority gap{priorities.topPriorities.length !== 1 ? 's' : ''}: {priorities.topPriorities.map(p => p.label).join(', ')}
            </span>
          )}
        </div>
      )}

      {/* Suggestions */}
      {analysis.suggestions.length === 0 ? (
        <div className="px-4 py-5 rounded-xl bg-surface border border-border text-center space-y-2">
          <p className="text-xs font-semibold text-text-primary">No high-confidence suggestions yet</p>
          <p className="text-[11px] text-text-muted">
            {analysis.analysisNote}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="label-xs">{analysis.analysisNote}</p>
          {analysis.suggestions.slice(0, 3).map(s => (
            <SuggestionCard key={s.id} suggestion={s} />
          ))}
        </div>
      )}

      {/* DONNA question */}
      <div className="pt-2 border-t border-lime/15">
        <p className="text-xs text-lime leading-relaxed">{summary.focusQuestion}</p>
      </div>
    </div>
  )
}
