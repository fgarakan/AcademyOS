'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Shield, ChevronRight, ChevronDown, Sparkles } from 'lucide-react'
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

// Sprint 962 — stage sort order for level navigation strip.
// Defines the canonical curriculum progression for prev/next navigation.
const STAGE_ORDER: Record<string, number> = {
  red_foundation:     1,
  orange_development: 2,
  green_performance:  3,
  yellow_competitive: 4,
  high_performance:   5,
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

  // Sprint 962 — level navigation: sort explorerData.levels by stage order,
  // then find prev/next relative to the current level.
  // Uses already-loaded data — no new queries.
  const sortedLevels = [...explorerData.levels].sort((a, b) => {
    const stageA = STAGE_ORDER[a.stage ?? ''] ?? 99
    const stageB = STAGE_ORDER[b.stage ?? ''] ?? 99
    return stageA - stageB
  })
  const currentIndex = sortedLevels.findIndex(l => l.id === level.id)
  const prevLevel: CurriculumLevel | null = currentIndex > 0 ? sortedLevels[currentIndex - 1] : null
  const nextLevel: CurriculumLevel | null = currentIndex < sortedLevels.length - 1 ? sortedLevels[currentIndex + 1] : null
  const totalLevels = sortedLevels.length

  return (
    <div className="animate-fade-in flex gap-6 p-4 sm:p-6 items-start overflow-x-hidden max-w-[1440px]">

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Header — Sprint 962: data-donna-focus-id for DONNA highlight */}
        <div data-donna-focus-id="curriculum-current-level" className="flex items-start justify-between gap-4">
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
              href="/director/curriculum/guided"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-border text-text-muted hover:text-text-secondary transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
              Back to Review
            </Link>
          </div>
        </div>

        {/* Sprint 962 — Level navigation strip: prev/next using sorted explorerData.levels.
            No new queries — uses data already loaded by the server page component.
            Links are read-only navigation — no curriculum mutations. */}
        {totalLevels > 1 && (
          <div className="flex items-center justify-between gap-2 px-1">
            {prevLevel ? (
              <Link
                href={`/director/curriculum/level/${prevLevel.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-[11px] text-text-muted hover:text-text-secondary hover:border-border-strong transition-all truncate max-w-[45%]"
              >
                <ArrowLeft className="w-3 h-3 shrink-0" />
                <span className="truncate">{prevLevel.display_name}</span>
              </Link>
            ) : (
              <div />
            )}

            <span className="text-[10px] text-text-muted/60 tabular-nums whitespace-nowrap shrink-0">
              {currentIndex + 1} / {totalLevels}
            </span>

            {nextLevel ? (
              <Link
                href={`/director/curriculum/level/${nextLevel.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-[11px] text-text-muted hover:text-text-secondary hover:border-border-strong transition-all truncate max-w-[45%]"
              >
                <span className="truncate">{nextLevel.display_name}</span>
                <ArrowRight className="w-3 h-3 shrink-0" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        )}

        {/* Draft mode safety note — compact, not a full banner */}
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <Shield className="w-3 h-3 text-lime shrink-0" />
          <span>
            <span className="text-lime font-semibold">Draft mode — </span>
            all changes go to Pending Modifications. Nothing applies until you approve.
          </span>
        </div>

        {/* ── Health snapshot — N of 4 sections have content ────────────────── */}
        {(() => {
          const filled = [
            levelDrills.length > 0,
            levelGates.length > 0,
            competition !== null,
            fitness !== null,
          ].filter(Boolean).length
          const color = filled === 4 ? '#30D158' : filled >= 2 ? '#FF9500' : '#FF3B30'
          const label = filled === 4 ? 'All sections complete' : `${filled} of 4 sections have content`
          return (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[0,1,2,3].map(i => (
                  <div
                    key={i}
                    className="h-1 w-6 rounded-full"
                    style={{ background: i < filled ? color : 'rgba(255,255,255,0.10)' }}
                  />
                ))}
              </div>
              <span className="text-[10px]" style={{ color }}>{label}</span>
            </div>
          )
        })()}

        {/* ── PRIMARY ACTION: Propose a Change — moved above the grid ──────── */}
        {/* Director should reach the main action without scrolling past 5 cards */}
        <div data-donna-focus-id="curriculum-primary-action">
          <CurriculumChangeDraftPanel
            levelId={level.id}
            levelName={level.display_name}
            externalChangeType={pendingDraftType}
          />
        </div>

        {/* ── Mobile quick DONNA chips (hidden lg+) ─────────────────────────── */}
        {/* On desktop, DONNA chips live in the sidebar. On mobile, show them    */}
        {/* inline so the director doesn't have to scroll to find suggested actions */}
        <div className="flex lg:hidden flex-wrap gap-2">
          {[
            'Add a skill',
            'Add an assessment gate',
            'Rewrite this level',
          ].map(label => (
            <button
              key={label}
              type="button"
              onClick={() => {
                const map: Record<string, ChangeType> = {
                  'Add a skill':              'add_drill',
                  'Add an assessment gate':   'add_gate',
                  'Rewrite this level':       'rewrite_level',
                }
                const ct = map[label]
                if (ct) setPendingDraftType(ct)
                document.getElementById('curriculum-primary-action')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] transition-colors"
              style={{
                background: 'rgba(200,255,0,0.05)',
                border: '1px solid rgba(200,255,0,0.15)',
                color: '#C8FF00',
              }}
            >
              <Sparkles className="w-3 h-3 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Level context — collapsed by default (informational, not operational) */}
        {stageInfo && (
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer list-none select-none px-4 py-2.5 rounded-xl border border-white/[0.07] hover:border-white/[0.12] transition-colors" style={{ background: 'rgba(0,0,0,0.20)' }}>
              <ChevronDown className="w-3.5 h-3.5 text-text-muted transition-transform group-open:rotate-0 -rotate-90" />
              <span className="text-[11px] font-semibold text-text-muted">Level context</span>
              <span className="text-[10px] text-text-muted/60 ml-1">— goal, intent, evidence</span>
            </summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl px-4 py-3.5 space-y-1" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="label-xs">Level Goal</p>
                <p className="text-[11px] text-text-secondary leading-relaxed">{stageInfo.goal}</p>
              </div>
              <div className="rounded-xl px-4 py-3.5 space-y-1" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="label-xs">Development Intent</p>
                <p className="text-[11px] text-text-secondary leading-relaxed">{stageInfo.intent}</p>
              </div>
              <div className="rounded-xl px-4 py-3.5 space-y-1" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="label-xs">Evidence for Level-Up</p>
                <p className="text-[11px] text-text-secondary leading-relaxed">{stageInfo.evidence}</p>
                {level.advance_min_outcomes > 0 && (
                  <p className="text-[10px] text-text-muted mt-1">
                    Min <span className="font-mono text-lime">{level.advance_min_outcomes}</span> outcomes required
                  </p>
                )}
              </div>
            </div>
          </details>
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

        {/* ── Mobile Pending Modifications (hidden lg+) ─────────────────── */}
        {/* On desktop, change queue lives in the sidebar. On mobile it must          */}
        {/* appear here so the director can see + act on drafts without scrolling     */}
        {/* to a hidden panel. Rendered immediately after "Propose a Change".          */}
        {changeQueue && (
          <div id="curriculum-change-queue" className="block lg:hidden scroll-mt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">
                Pending Modifications
              </p>
            </div>
            {/* Constrained height so long queues don't bury the form */}
            <div className="max-h-[480px] overflow-y-auto pr-1 space-y-2">
              {changeQueue}
            </div>
          </div>
        )}

        {/* Detailed Content View — Sprint 962: renamed from "Advanced Editor" to reduce intimidation */}
        <details className="group">
          <summary
            className="flex items-center gap-2 cursor-pointer list-none select-none px-4 py-3 rounded-xl border border-border hover:border-border/80 transition-colors"
            style={{ background: 'rgba(0,0,0,0.20)' }}
          >
            <ChevronDown className="w-3.5 h-3.5 text-text-muted transition-transform group-open:rotate-180" />
            <span className="text-[11px] font-semibold text-text-secondary">Full Content Details</span>
            <span className="text-[10px] text-text-muted ml-1">
              — drills, gates, fitness, competition, and coach language
            </span>
          </summary>
          <div className="mt-4">
            <CurriculumLevelBuilderShell level={level} data={explorerData} />
          </div>
        </details>

      </div>

      {/* ── Right DONNA panel + change queue ─────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 sticky top-6 self-start gap-4">
        <CurriculumDonnaPanel
          mode="level"
          levelName={level.display_name}
          activeAction={activeAction}
          onAction={handleDonnaAction}
        />
        {/* RSC slot — CurriculumBuilderChangeQueue passed from server page.
            Scroll anchor id so "View pending mods" links land here.
            max-h prevents the sidebar from growing taller than the viewport. */}
        <div id="curriculum-change-queue" className="scroll-mt-4 max-h-[calc(100vh-280px)] overflow-y-auto">
          {changeQueue}
        </div>
      </aside>
    </div>
  )
}
