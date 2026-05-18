'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, SkipForward, Sparkles, X } from 'lucide-react'
import type { CurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { CurriculumLevelDetailPanel } from '@/components/curriculum/CurriculumLevelDetailPanel'
import { CurriculumProgressRail } from './CurriculumProgressRail'
import { CurriculumJumpToLevelModal } from './CurriculumJumpToLevelModal'
import { DonnaSafetyDisclosure } from './DonnaSafetyDisclosure'

const DONNA_STAGE_TIPS: Record<string, string> = {
  red_foundation:     "Red Ball is where players build fundamental movement and spatial awareness. Check that gates test ABC footwork and bounce-turn mechanics. Drills should be short, playful, and repetitive.",
  orange_development: "Orange Ball players are learning real tennis patterns. Gates should include forehand and backhand groundstrokes from center court. Drills should introduce directional consistency.",
  green_performance:  "Green Ball is where tactical thinking begins. Look for gates that test rally depth and serve introduction. Drills should include crosscourt patterns and first-ball offense.",
  yellow_competitive: "Yellow Ball players are competing. Gates should cover serve, return, net approach, and match-play situations. Drills should simulate real match scenarios.",
  high_performance:   "High Performance is elite development. Gates should be rigorous — UTR-referenced, measurable, and objective. Drills should address competitive pressure and technical refinement.",
}

interface Props {
  data: CurriculumExplorerData
}

export function CurriculumGuidedReviewShell({ data }: Props) {
  const { levels, gates, drills, coachLanguage, competitionTrack, fitnessGuidance, volumeGuidance, tablesAvailable } = data
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reviewed, setReviewed] = useState<Set<number>>(new Set())
  const [skipped, setSkipped] = useState<Set<number>>(new Set())
  const [jumpOpen, setJumpOpen] = useState(false)
  const [donnaDismissed, setDonnaDismissed] = useState<Set<number>>(new Set())

  if (!tablesAvailable || levels.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm font-semibold text-text-primary mb-2">Curriculum data not yet available</p>
        <p className="text-xs text-text-secondary">Set up your curriculum spine to start the guided review.</p>
      </div>
    )
  }

  const level = levels[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === levels.length - 1
  const reviewedCount = reviewed.size

  function markReviewed(idx: number) {
    setReviewed(prev => new Set(Array.from(prev).concat(idx)))
  }

  function keepAsIs() {
    markReviewed(currentIndex)
    if (!isLast) setCurrentIndex(i => i + 1)
  }

  function goNext() {
    markReviewed(currentIndex)
    if (!isLast) setCurrentIndex(i => i + 1)
  }

  function goPrev() {
    if (!isFirst) setCurrentIndex(i => i - 1)
  }

  function skip() {
    setSkipped(prev => new Set(Array.from(prev).concat(currentIndex)))
    if (!isLast) setCurrentIndex(i => i + 1)
  }

  function jumpTo(idx: number) {
    setCurrentIndex(idx)
    setJumpOpen(false)
  }

  return (
    <div className="space-y-4">

      <CurriculumProgressRail
        levels={levels}
        currentIndex={currentIndex}
        reviewed={reviewed}
        skipped={skipped}
        onJump={() => setJumpOpen(true)}
      />

      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-raised">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
              Level {currentIndex + 1} of {levels.length}
            </span>
            {reviewed.has(currentIndex) && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-green/10 text-status-green border border-status-green/20 font-semibold">
                Reviewed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-muted">
              {reviewedCount}/{levels.length} reviewed
            </span>
            <button
              onClick={skip}
              disabled={isLast}
              className="flex items-center gap-1 text-[11px] text-text-muted hover:text-lime transition-colors disabled:opacity-40"
            >
              <SkipForward className="w-3 h-3" />
              Skip
            </button>
          </div>
        </div>

        {/* DONNA guidance for this level */}
        {!donnaDismissed.has(currentIndex) && DONNA_STAGE_TIPS[level.stage ?? ''] && (
          <div className="mx-5 mt-4 rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.14)' }}>
            <Sparkles className="w-4 h-4 text-lime shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-lime mb-1">DONNA — What to look for</p>
              <p className="text-[11px] text-text-secondary leading-relaxed">{DONNA_STAGE_TIPS[level.stage ?? '']}</p>
            </div>
            <button
              onClick={() => setDonnaDismissed(prev => new Set(Array.from(prev).concat(currentIndex)))}
              className="text-text-muted hover:text-text-secondary transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="p-5">
          <CurriculumLevelDetailPanel
            level={level}
            gates={gates.filter(g => g.from_level_id === level.id)}
            drills={drills.filter(d => d.level_min_id === level.id)}
            coachLanguage={coachLanguage.filter(cl => cl.level_id === level.id)}
            competition={competitionTrack.find(ct => ct.level_id === level.id) ?? null}
            fitness={fitnessGuidance.find(fg => fg.level_id === level.id) ?? null}
            volume={volumeGuidance.find(vg => vg.level_id === level.id) ?? null}
            tablesAvailable={tablesAvailable}
          />
        </div>

        {/* Action row */}
        <div className="px-5 py-4 border-t border-border bg-surface-raised space-y-3">
          {/* Primary actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={keepAsIs}
              disabled={isLast && reviewed.has(currentIndex)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: '#C8FF00', color: '#0A0A0A' }}
            >
              Keep as-is
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            <a
              href={`/director/curriculum/level/${level.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-medium border border-lime/30 text-lime hover:bg-lime/10 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Modify this level
            </a>
            <button
              onClick={skip}
              disabled={isLast}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-medium border border-border text-text-muted hover:text-text-secondary hover:border-border/80 transition-colors disabled:opacity-40"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Skip
            </button>
          </div>

          {/* Secondary nav */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={goPrev}
              disabled={isFirst}
              className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous level
            </button>
            <button
              onClick={() => setJumpOpen(true)}
              className="text-[11px] text-text-muted hover:text-lime transition-colors"
            >
              Jump to another level
            </button>
          </div>
        </div>
      </div>

      <DonnaSafetyDisclosure context="curriculum_builder" />

      {/* Skipped levels return panel */}
      {skipped.size > 0 && (
        <div className="rounded-xl border border-status-orange/20 bg-status-orange/[0.04] px-5 py-4 space-y-2">
          <p className="text-[12px] font-semibold text-status-orange">{skipped.size} level{skipped.size !== 1 ? 's' : ''} skipped — return when ready</p>
          <div className="flex flex-wrap gap-2">
            {Array.from(skipped).map(idx => (
              <button
                key={idx}
                onClick={() => { setCurrentIndex(idx); setSkipped(prev => { const s = new Set(Array.from(prev)); s.delete(idx); return s }) }}
                className="text-[11px] px-3 py-1.5 rounded-lg border border-status-orange/30 text-status-orange hover:bg-status-orange/10 transition-colors"
              >
                {levels[idx]?.display_name ?? `Level ${idx + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLast && reviewed.has(currentIndex) && (
        <div className="rounded-2xl border border-status-green/20 bg-status-green/[0.04] p-5 text-center space-y-2">
          <p className="text-[13px] font-semibold text-status-green">All {levels.length} levels reviewed</p>
          <p className="text-[11px] text-text-muted">
            Your notes and observations help DONNA draft better curriculum changes.
            Use the builder to request edits — they go to the Review Queue for approval.
          </p>
        </div>
      )}

      {jumpOpen && (
        <CurriculumJumpToLevelModal
          levels={levels}
          currentIndex={currentIndex}
          reviewed={reviewed}
          onJump={jumpTo}
          onClose={() => setJumpOpen(false)}
        />
      )}
    </div>
  )
}
