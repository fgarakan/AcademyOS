'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, Zap, ChevronRight, ChevronDown } from 'lucide-react'
import type { CurriculumExplorerData, CurriculumLevel } from '@/lib/backend/curriculumExplorer'
import { CurriculumLevelBuilderGrid, type ActivePanel } from './CurriculumLevelBuilderGrid'
import { CurriculumLevelBuilderShell } from './CurriculumLevelBuilderShell'
import { CurriculumDonnaPanel } from './CurriculumDonnaPanel'
import { CurriculumChangeDraftPanel, type ChangeType } from './CurriculumChangeDraftPanel'

// ─── Stage config ─────────────────────────────────────────────────────────────

interface StageInfo {
  goal: string
  intent: string
  evidence: string
  dot: string
}

const STAGE_INFO: Record<string, StageInfo> = {
  red_foundation: {
    goal: 'Build spatial awareness and foundational movement',
    intent: 'Players at this stage need repetition, play, and short feedback loops. The goal is enjoyment and fundamentals.',
    evidence: 'Consistent rally count, hand-eye coordination tasks, basic grip check.',
    dot: '#ef4444',
  },
  orange_development: {
    goal: 'Establish real tennis patterns and stroke consistency',
    intent: 'Players are learning to direct the ball. The goal is controlled groundstrokes and pattern recognition.',
    evidence: 'Rally depth consistency, crosscourt shape, forehand/backhand separation.',
    dot: '#f97316',
  },
  green_performance: {
    goal: 'Develop tactical thinking and serve mechanics',
    intent: 'Players are entering full-court play. The goal is depth, direction, and serve introduction.',
    evidence: 'Serve placement accuracy, rally construction, defensive recovery.',
    dot: '#22c55e',
  },
  yellow_competitive: {
    goal: 'Compete effectively and manage match situations',
    intent: 'Players are tournament-ready. The goal is consistency under pressure, net play, and mental skills.',
    evidence: 'Match win rate, net approach rate, third-ball patterns.',
    dot: '#eab308',
  },
  high_performance: {
    goal: 'Refine technique, compete at high level, develop elite habits',
    intent: 'Players are on a development pathway. The goal is measurable performance improvement and championship mindset.',
    evidence: 'UTR trajectory, match statistics, coach-assessed mental resilience.',
    dot: '#a78bfa',
  },
}

// ─── DONNA action label → ChangeType pre-selection (no DB mutation, no auto-submit) ──

function actionLabelToChangeType(label: string): ChangeType | null {
  switch (label) {
    case 'Add a skill':          return 'add_drill'
    case 'Add a drill':          return 'add_drill'
    case 'Add an assessment gate': return 'add_gate'
    case 'Add a fitness exercise': return 'add_fitness'
    case 'Add a player mission':   return 'add_mission'
    case 'Rewrite this level':     return 'rewrite_level'
    default:                       return null
  }
}

// ─── activePanel → DONNA activeAction mapping ─────────────────────────────────

function panelToAction(panel: ActivePanel): string | undefined {
  switch (panel) {
    case 'skillDrill':  return 'Add a drill'
    case 'competition': return 'Rewrite this level'
    case 'fitness':     return 'Add a fitness exercise'
    case 'gate':        return 'Add an assessment gate'
    case 'missions':    return 'Add a player mission'
    default:            return undefined
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  level: CurriculumLevel
  explorerData: CurriculumExplorerData
  /**
   * RSC slot — passed from the server page component.
   * Used to embed CurriculumBuilderChangeQueue (a server component)
   * inside this client component without breaking RSC rules.
   * Read-only display; no mutations performed here.
   */
  changeQueue?: React.ReactNode
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CurriculumLevelBuilderExperience({ level, explorerData, changeQueue }: Props) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  /** Pre-selects a change type in the DraftPanel when a DONNA chip is clicked.
   *  Local state only — no DB mutation, no auto-submit. User must still type and submit. */
  const [pendingDraftType, setPendingDraftType] = useState<ChangeType | null>(null)

  function handleDonnaAction(label: string) {
    const ct = actionLabelToChangeType(label)
    if (ct) setPendingDraftType(ct)
  }

  const stageKey  = level.stage ?? ''
  const stageInfo = STAGE_INFO[stageKey] ?? null
  const stageDot  = stageInfo?.dot ?? '#555'
  const stageLabel = stageKey.replace(/_/g, ' ')

  const levelGates    = explorerData.gates.filter(g => g.from_level_id === level.id)
  const levelDrills   = explorerData.drills.filter(d => d.level_min_id === level.id)
  const competition   = explorerData.competitionTrack.find(ct => ct.level_id === level.id) ?? null
  const fitness       = explorerData.fitnessGuidance.find(fg => fg.level_id === level.id) ?? null

  const activeAction  = panelToAction(activePanel)

  return (
    <div className="animate-fade-in flex gap-6 p-4 sm:p-6 items-start overflow-x-hidden max-w-[1440px]">

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Link
              href="/director/curriculum/map"
              className="text-text-muted hover:text-lime transition-colors mt-1 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: stageDot }} />
                <p className="page-eyebrow capitalize">{stageLabel}</p>
              </div>
              <h1 className="page-title">{level.display_name}</h1>
              <p className="text-[12px] text-text-secondary mt-1">
                Level Builder{stageInfo ? ` · ${stageInfo.goal}` : ''}
              </p>
            </div>
          </div>

          {/* Top action buttons */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Link
              href={`/director/curriculum/level/${level.id}/impact`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors"
              style={{ border: '1px solid rgba(200,255,0,0.20)', color: '#C8FF00', background: 'rgba(200,255,0,0.05)' }}
            >
              <Zap className="w-3 h-3" />
              Preview Impact
            </Link>
            <Link
              href="/director/curriculum/guided"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-border text-text-muted hover:text-text-secondary transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
              Back to Review
            </Link>
          </div>
        </div>

        {/* Draft mode banner */}
        <div className="rounded-xl border border-lime/10 bg-lime/[0.02] flex items-center gap-2.5 px-4 py-3">
          <Shield className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-[11px] text-text-muted">
            <span className="text-lime font-semibold">Draft mode — </span>
            All changes create a draft in the Review Queue. Nothing is applied until you approve it there.
          </p>
        </div>

        {/* ── Mobile DONNA context card (hidden on lg+, shown on small screens) */}
        <div className="block lg:hidden rounded-xl border border-border bg-surface px-4 py-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: stageDot }} />
              <p className="text-[11px] font-semibold text-text-secondary capitalize">{stageLabel}</p>
            </div>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: 'rgba(200,255,0,0.08)',
                border: '1px solid rgba(200,255,0,0.16)',
                color: '#C8FF00',
              }}
            >
              DONNA Active
            </span>
          </div>
          {stageInfo && (
            <p className="text-[11px] text-text-muted leading-relaxed">{stageInfo.goal}</p>
          )}
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Use <span className="text-lime font-medium">Propose a Change</span> below to draft
            curriculum changes. Nothing is applied until you approve in the Review Queue.
          </p>
        </div>

        {/* Summary row — 3 info cards */}
        {stageInfo && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              className="rounded-xl px-4 py-3.5 space-y-1"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="label-xs">Level Goal</p>
              <p className="text-[11px] text-text-secondary leading-relaxed">{stageInfo.goal}</p>
            </div>
            <div
              className="rounded-xl px-4 py-3.5 space-y-1"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="label-xs">Development Intent</p>
              <p className="text-[11px] text-text-secondary leading-relaxed">{stageInfo.intent}</p>
            </div>
            <div
              className="rounded-xl px-4 py-3.5 space-y-1"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="label-xs">Evidence for Level-Up</p>
              <p className="text-[11px] text-text-secondary leading-relaxed">{stageInfo.evidence}</p>
              {level.advance_min_outcomes > 0 && (
                <p className="text-[10px] text-text-muted mt-1">
                  Min <span className="font-mono text-lime">{level.advance_min_outcomes}</span> outcomes required
                </p>
              )}
            </div>
          </div>
        )}

        {/* 5-card section grid — controlled mode, synced with DONNA panel */}
        <CurriculumLevelBuilderGrid
          level={level}
          levelGates={levelGates}
          levelDrills={levelDrills}
          competition={competition}
          fitness={fitness}
          activePanel={activePanel}
          onActivePanelChange={setActivePanel}
        />

        {/* ── Propose a Change panel ───────────────────────────────── */}
        <CurriculumChangeDraftPanel
          levelId={level.id}
          levelName={level.display_name}
          externalChangeType={pendingDraftType}
        />

        {/* Advanced editor — collapsible */}
        <details className="group">
          <summary
            className="flex items-center gap-2 cursor-pointer list-none select-none px-4 py-3 rounded-xl border border-border hover:border-border/80 transition-colors"
            style={{ background: 'rgba(0,0,0,0.20)' }}
          >
            <ChevronDown className="w-3.5 h-3.5 text-text-muted transition-transform group-open:rotate-180" />
            <span className="text-[11px] font-semibold text-text-secondary">Advanced Editor</span>
            <span className="text-[10px] text-text-muted ml-1">
              — detailed tab view: drills, gates, fitness, competition, language
            </span>
          </summary>
          <div className="mt-4">
            <CurriculumLevelBuilderShell level={level} data={explorerData} />
          </div>
        </details>

      </div>

      {/* ── Right DONNA panel + change queue ─────────────────────────── */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-6 self-start space-y-4">
        <CurriculumDonnaPanel
          mode="level"
          levelName={level.display_name}
          activeAction={activeAction}
          onAction={handleDonnaAction}
        />
        {/* RSC slot — CurriculumBuilderChangeQueue passed from server page */}
        {changeQueue}
      </aside>
    </div>
  )
}
