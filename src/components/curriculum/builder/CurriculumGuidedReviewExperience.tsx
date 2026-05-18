'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ChevronLeft, ChevronRight, SkipForward,
  Sparkles, Target, Trophy, Dumbbell, Shield, X,
} from 'lucide-react'
import type { CurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { CurriculumProgressRail } from './CurriculumProgressRail'
import { CurriculumJumpToLevelModal } from './CurriculumJumpToLevelModal'
import { CurriculumDonnaPanel } from './CurriculumDonnaPanel'

// ─── DONNA stage tips ─────────────────────────────────────────────────────────

const DONNA_STAGE_TIPS: Record<string, { question: string; why: string }> = {
  red_foundation: {
    question: "Does this level have enough short, playful drills and at least one footwork gate?",
    why: "Red Ball players need repetition and fun to build spatial awareness. Without a footwork gate, coaches have no objective benchmark to advance players.",
  },
  orange_development: {
    question: "Do the gates measure forehand and backhand groundstroke consistency from center court?",
    why: "Orange Ball is the first stage with real tennis patterns. If gates don't measure groundstrokes, coaches can't confirm technical readiness before advancing players.",
  },
  green_performance: {
    question: "Is there at least one gate for rally depth and one for serve introduction?",
    why: "Green Ball is where tactical thinking begins. Serve and depth gates are the minimum needed to confirm a player is ready for full-court yellow ball play.",
  },
  yellow_competitive: {
    question: "Do the drills simulate real match situations — serve, return, net approach?",
    why: "Yellow Ball players are competing in tournaments. Practice that doesn't mirror match reality doesn't prepare them for those moments.",
  },
  high_performance: {
    question: "Are the gates rigorous, measurable, and objective — not just coach feel?",
    why: "High Performance decisions affect player trajectories. Gates need to be defensible to players, parents, and external evaluators.",
  },
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function countStatus(count: number, min: number) {
  if (count >= min) return { color: '#30D158', bg: 'rgba(48,209,88,0.12)',  label: 'Good'    }
  if (count > 0)    return { color: '#FF9500', bg: 'rgba(255,149,0,0.12)', label: 'Partial' }
  return              { color: '#FF3B30', bg: 'rgba(255,59,48,0.12)',  label: 'Empty'   }
}

function boolStatus(has: boolean) {
  if (has) return { color: '#30D158', bg: 'rgba(48,209,88,0.12)',  label: 'Set'   }
  return   { color: '#FF3B30', bg: 'rgba(255,59,48,0.12)',  label: 'Empty' }
}

// ─── Section row ──────────────────────────────────────────────────────────────

interface SectionRowProps {
  icon: React.ReactNode
  label: string
  detail: string
  status: { color: string; bg: string; label: string }
}

function SectionRow({ icon, label, detail, status }: SectionRowProps) {
  return (
    <div
      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <span style={{ color: 'rgba(255,255,255,0.30)' }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-text-secondary">{label}</p>
        <p className="text-[10px] text-text-muted mt-0.5 leading-snug">{detail}</p>
      </div>
      <span
        className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
        style={{ background: status.bg, color: status.color }}
      >
        {status.label}
      </span>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  explorerData: CurriculumExplorerData
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CurriculumGuidedReviewExperience({ explorerData }: Props) {
  const { levels, gates, drills, competitionTrack, fitnessGuidance, tablesAvailable } = explorerData

  const [currentIndex, setCurrentIndex]         = useState(0)
  const [reviewed, setReviewed]                 = useState<Set<number>>(new Set())
  const [skipped, setSkipped]                   = useState<Set<number>>(new Set())
  const [modified, setModified]                 = useState<Set<number>>(new Set())
  const [jumpOpen, setJumpOpen]                 = useState(false)
  const [donnaPanelActive, setDonnaPanelActive] = useState(false)
  const [donnaDismissed, setDonnaDismissed]     = useState<Set<number>>(new Set())

  if (!tablesAvailable || levels.length === 0) {
    return (
      <div className="animate-fade-in p-6">
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="text-sm font-semibold text-text-primary mb-2">Curriculum data not yet available</p>
          <p className="text-xs text-text-secondary">Set up your curriculum spine to start the guided review.</p>
        </div>
      </div>
    )
  }

  const level   = levels[currentIndex]
  const isFirst = currentIndex === 0
  const isLast  = currentIndex === levels.length - 1

  const levelGates  = gates.filter(g => g.from_level_id === level.id)
  const levelDrills = drills.filter(d => d.level_min_id === level.id)
  const competition = competitionTrack.find(ct => ct.level_id === level.id) ?? null
  const fitness     = fitnessGuidance.find(fg => fg.level_id === level.id) ?? null
  const domainCount = new Set(levelDrills.map(d => d.domain).filter(Boolean)).size

  const stageTip     = DONNA_STAGE_TIPS[level.stage ?? ''] ?? null
  const activeAction = donnaPanelActive ? 'Ask DONNA to improve it' : undefined

  const keptCount     = reviewed.size
  const skippedCount  = skipped.size
  const modifiedCount = modified.size
  const decidedSet    = new Set([
    ...Array.from(reviewed),
    ...Array.from(skipped),
    ...Array.from(modified),
  ])
  const decidedCount  = decidedSet.size
  const remaining     = levels.length - decidedCount

  function markReviewed(idx: number) {
    setReviewed(prev => new Set(Array.from(prev).concat(idx)))
  }

  function keepAsIs() {
    markReviewed(currentIndex)
    setDonnaPanelActive(false)
    if (!isLast) setCurrentIndex(i => i + 1)
  }

  function skip() {
    setSkipped(prev => new Set(Array.from(prev).concat(currentIndex)))
    setDonnaPanelActive(false)
    if (!isLast) setCurrentIndex(i => i + 1)
  }

  function goPrev() {
    if (!isFirst) {
      setCurrentIndex(i => i - 1)
      setDonnaPanelActive(false)
    }
  }

  function jumpTo(idx: number) {
    setCurrentIndex(idx)
    setJumpOpen(false)
    setDonnaPanelActive(false)
  }

  return (
    <div className="animate-fade-in flex gap-6 p-4 sm:p-6 items-start overflow-x-hidden">

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/director/curriculum/map"
              className="text-text-muted hover:text-lime transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <p className="page-eyebrow">Curriculum</p>
              <h1 className="page-title">Guided Level Review</h1>
              <p className="text-[11px] text-text-muted mt-0.5">
                Reviewing {level.display_name}
                {' · '}
                {currentIndex + 1} of {levels.length}
              </p>
            </div>
          </div>
          <span className="text-[11px] text-text-muted shrink-0 hidden sm:block">
            <span className="font-mono text-lime">{reviewed.size}</span>/{levels.length} reviewed
          </span>
        </div>

        {/* Progress rail */}
        <CurriculumProgressRail
          levels={levels}
          currentIndex={currentIndex}
          reviewed={reviewed}
          skipped={skipped}
          onJump={() => setJumpOpen(true)}
        />

        {/* Main review card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Card header */}
          <div
            className="flex items-start justify-between gap-4 px-5 py-4 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
                Level {currentIndex + 1} of {levels.length}
              </p>
              <h2 className="text-[18px] font-bold text-text-primary mt-0.5 leading-tight">
                {level.display_name}
              </h2>
            </div>
            {reviewed.has(currentIndex) && (
              <span
                className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                style={{
                  background: 'rgba(48,209,88,0.10)',
                  color: '#30D158',
                  borderColor: 'rgba(48,209,88,0.20)',
                }}
              >
                Reviewed
              </span>
            )}
          </div>

          {/* DONNA inline tip */}
          {stageTip && !donnaDismissed.has(currentIndex) && (
            <div className="mx-5 mt-4">
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(17,217,223,0.04)', border: '1px solid rgba(17,217,223,0.14)' }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: '#11d9df' }} />
                    <p className="text-[11px] font-semibold" style={{ color: '#11d9df' }}>DONNA asks</p>
                  </div>
                  <button
                    onClick={() => setDonnaDismissed(prev => new Set(Array.from(prev).concat(currentIndex)))}
                    className="text-text-muted hover:text-text-secondary transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[12px] font-medium text-text-primary mb-1.5">{stageTip.question}</p>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  <span className="text-text-secondary font-medium">Why this matters: </span>
                  {stageTip.why}
                </p>
              </div>
            </div>
          )}

          {/* Section rows */}
          <div className="px-5 py-4 space-y-2">
            <SectionRow
              icon={<Target className="w-3.5 h-3.5" />}
              label="Skill Focus"
              detail={
                levelDrills.length > 0
                  ? `${levelDrills.length} drill${levelDrills.length !== 1 ? 's' : ''} · ${domainCount} domain${domainCount !== 1 ? 's' : ''}`
                  : "No drills connected yet"
              }
              status={countStatus(levelDrills.length, 3)}
            />
            <SectionRow
              icon={<Trophy className="w-3.5 h-3.5" />}
              label="Competition Focus"
              detail={competition?.match_format ?? "No competition focus set"}
              status={boolStatus(!!competition)}
            />
            <SectionRow
              icon={<Dumbbell className="w-3.5 h-3.5" />}
              label="Fitness Support"
              detail={fitness?.fitness_phase ?? "No fitness guidance set"}
              status={boolStatus(!!fitness)}
            />
            <SectionRow
              icon={<Shield className="w-3.5 h-3.5" />}
              label="Assessment Gates"
              detail={
                levelGates.length > 0
                  ? `${levelGates.length} gate${levelGates.length !== 1 ? 's' : ''} required`
                  : "No gates set"
              }
              status={countStatus(levelGates.length, 2)}
            />
            <SectionRow
              icon={<Sparkles className="w-3.5 h-3.5" />}
              label="Player Missions"
              detail="No missions connected yet"
              status={{ color: '#FF3B30', bg: 'rgba(255,59,48,0.12)', label: 'Empty' }}
            />
          </div>

          {/* Action buttons */}
          <div
            className="px-5 py-4 border-t space-y-3"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}
          >
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
              <Link
                href={`/director/curriculum/level/${level.id}`}
                onClick={() => setModified(prev => new Set(Array.from(prev).concat(currentIndex)))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-medium transition-colors"
                style={{
                  border: modified.has(currentIndex)
                    ? '1px solid rgba(17,217,223,0.45)'
                    : '1px solid rgba(17,217,223,0.25)',
                  color: '#11d9df',
                  background: modified.has(currentIndex)
                    ? 'rgba(17,217,223,0.10)'
                    : 'rgba(17,217,223,0.05)',
                }}
              >
                {modified.has(currentIndex) ? 'Open builder' : 'Modify this level'}
              </Link>
              <button
                onClick={skip}
                disabled={isLast}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-medium border border-border text-text-muted hover:text-text-secondary hover:border-white/20 transition-colors disabled:opacity-40"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Skip this level
              </button>
              <button
                onClick={() => setDonnaPanelActive(v => !v)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-medium transition-colors"
                style={{
                  border: `1px solid ${donnaPanelActive ? 'rgba(17,217,223,0.35)' : 'rgba(17,217,223,0.14)'}`,
                  color: donnaPanelActive ? '#11d9df' : '#8a9ba8',
                  background: donnaPanelActive ? 'rgba(17,217,223,0.08)' : 'transparent',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ask DONNA to improve it
              </button>
            </div>

            {/* Status summary */}
            <div
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[10px]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span style={{ color: '#30D158' }}>
                <span className="font-mono font-semibold">{keptCount}</span> kept
              </span>
              {modifiedCount > 0 && (
                <span style={{ color: '#11d9df' }}>
                  <span className="font-mono font-semibold">{modifiedCount}</span> sent to builder
                </span>
              )}
              {skippedCount > 0 && (
                <span style={{ color: '#FF9500' }}>
                  <span className="font-mono font-semibold">{skippedCount}</span> skipped
                </span>
              )}
              <span className="ml-auto text-text-muted">
                <span className="font-mono">{remaining}</span> remaining
              </span>
            </div>

            {/* Bottom nav */}
            <div className="flex items-center justify-between pt-0.5">
              <button
                onClick={goPrev}
                disabled={isFirst}
                className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <span className="text-[11px] text-text-muted font-mono">
                {currentIndex + 1} / {levels.length}
              </span>
              <button
                onClick={() => setJumpOpen(true)}
                className="text-[11px] text-text-muted hover:text-lime transition-colors"
              >
                Jump to another level
              </button>
            </div>
          </div>
        </div>

        {/* Skipped levels return panel */}
        {skipped.size > 0 && (
          <div
            className="rounded-xl px-5 py-4 space-y-2"
            style={{ background: 'rgba(255,149,0,0.04)', border: '1px solid rgba(255,149,0,0.20)' }}
          >
            <p className="text-[12px] font-semibold text-status-orange">
              {skipped.size} level{skipped.size !== 1 ? 's' : ''} skipped — return when ready
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from(skipped).map(idx => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx)
                    setSkipped(prev => {
                      const s = new Set(Array.from(prev))
                      s.delete(idx)
                      return s
                    })
                  }}
                  className="text-[11px] px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                  style={{ border: '1px solid rgba(255,149,0,0.30)', color: '#FF9500' }}
                >
                  {levels[idx]?.display_name ?? `Level ${idx + 1}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All reviewed banner */}
        {isLast && reviewed.has(currentIndex) && (
          <div
            className="rounded-2xl p-5 text-center space-y-2"
            style={{ background: 'rgba(48,209,88,0.04)', border: '1px solid rgba(48,209,88,0.20)' }}
          >
            <p className="text-[13px] font-semibold text-status-green">
              All {levels.length} levels reviewed
            </p>
            <p className="text-[11px] text-text-muted">
              Your observations help DONNA draft better curriculum changes.
              Use the builder to request edits — they go to the Review Queue for approval.
            </p>
          </div>
        )}
      </div>

      {/* Mobile DONNA hint — visible below lg */}
      <div className="lg:hidden" />

      {/* ── Right DONNA panel — desktop only ─────────────────────────────── */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-6 self-start">
        <CurriculumDonnaPanel
          mode="guided_review"
          levelName={level.display_name}
          activeAction={activeAction}
        />
      </aside>

      {/* Jump modal */}
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
