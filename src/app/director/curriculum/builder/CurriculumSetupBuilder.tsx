'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Shield, CheckCircle2, ChevronRight, BookOpen, Pencil, X, Settings } from 'lucide-react'
import type { CurriculumSetupState } from '@/lib/curriculum/curriculumSetupTypes'
import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'
import { CurriculumKeyboardHintBar } from '@/components/curriculum/builder/CurriculumKeyboardHintBar'
import { buildCurriculumGapChip } from '@/lib/donna/curriculumBuilderDonnaContext'

interface Props {
  initialState: CurriculumSetupState
  origin: 'onboarding' | 'builder'
  levels?: CurriculumLevel[]
}

const STAGE_COLOR: Record<string, string> = {
  red_foundation:     '#ef4444',
  orange_development: '#f97316',
  green_performance:  '#22c55e',
  yellow_competitive: '#eab308',
  high_performance:   '#11d9df',
}

const PATHWAYS = [
  {
    name: 'Red Ball',
    levels: 3,
    dot: '#ef4444',
    border: 'rgba(239,68,68,0.22)',
    glow: 'rgba(239,68,68,0.06)',
  },
  {
    name: 'Orange Ball',
    levels: 3,
    dot: '#f97316',
    border: 'rgba(249,115,22,0.22)',
    glow: 'rgba(249,115,22,0.06)',
  },
  {
    name: 'Green Ball',
    levels: 3,
    dot: '#22c55e',
    border: 'rgba(34,197,94,0.22)',
    glow: 'rgba(34,197,94,0.06)',
  },
  {
    name: 'Yellow Ball',
    levels: 3,
    dot: '#eab308',
    border: 'rgba(234,179,8,0.22)',
    glow: 'rgba(234,179,8,0.06)',
  },
  {
    name: 'High Performance',
    levels: 3,
    dot: '#11d9df',
    border: 'rgba(17,217,223,0.22)',
    glow: 'rgba(17,217,223,0.06)',
  },
]

const HOW_IT_WORKS = [
  {
    num: '1',
    icon: BookOpen,
    title: 'Review your master curriculum',
    desc: 'DONNA has pre-loaded the standard curriculum for your academy type.',
  },
  {
    num: '2',
    icon: Pencil,
    title: 'Customize each level',
    desc: "Add your academy's drills, exercises, and assessment criteria.",
  },
  {
    num: '3',
    icon: CheckCircle2,
    title: 'Approve changes',
    desc: 'Nothing goes live until you review and approve every change.',
  },
]

const curriculumGapChip = buildCurriculumGapChip()

function openDonnaWithCurriculumGapPrompt() {
  window.dispatchEvent(new CustomEvent('donna:open', { detail: { prompt: curriculumGapChip.prompt } }))
}

export function CurriculumSetupBuilder({ levels = [] }: Props) {
  const router = useRouter()
  const [jumpOpen, setJumpOpen] = useState(false)

  function handleJump(levelId: string) {
    setJumpOpen(false)
    router.push(`/director/curriculum/level/${levelId}`)
  }

  return (
    <div className="min-h-screen" style={{ background: '#050b09' }}>
      <div className="max-w-[1180px] mx-auto px-6 pt-10 pb-20">

        {/* ── Header ───────────────────────────────────── */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-text-primary leading-tight">
            Welcome to Curriculum Builder
          </h1>
          <p className="text-sm text-text-muted mt-1.5">
            Powered by DONNA · Your academy starts with the master curriculum
          </p>
        </div>

        {/* ── DONNA Hero Card ───────────────────────────── */}
        <div
          className="relative rounded-2xl overflow-hidden mb-8"
          style={{
            background: '#060f0d',
            border: '1px solid rgba(17,217,223,0.18)',
          }}
        >
          {/* Radial teal glow behind avatar/left */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 55% 85% at 15% 50%, rgba(17,217,223,0.07) 0%, transparent 70%)',
            }}
          />

          <div className="relative p-8 md:p-10">

            {/* Top row: avatar + name + badge */}
            <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: 'rgba(17,217,223,0.10)',
                    border: '1px solid rgba(17,217,223,0.24)',
                  }}
                >
                  <Sparkles className="w-6 h-6 text-lime" />
                </div>
                <div>
                  <p className="text-base font-bold text-text-primary leading-tight tracking-tight">
                    DONNA
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    AI Curriculum Assistant · Ready
                  </p>
                </div>
              </div>
              <span
                className="text-[11px] font-semibold px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(17,217,223,0.10)',
                  border: '1px solid rgba(17,217,223,0.20)',
                  color: '#11d9df',
                }}
              >
                AI-Powered
              </span>
            </div>

            {/* Headline */}
            <div className="mb-5">
              <p className="text-2xl md:text-3xl font-bold text-text-primary leading-snug">
                Your academy starts with the master curriculum.
              </p>
              <p className="text-2xl md:text-3xl font-bold text-lime leading-snug mt-1">
                DONNA will help you review and customize it.
              </p>
            </div>

            {/* Body */}
            <p className="text-sm text-text-secondary leading-relaxed mb-8 max-w-2xl">
              I'll guide you one level at a time. You can skip anything and come back later.
              Nothing changes until you approve.
            </p>

            {/* Buttons — row 1 */}
            <div className="flex flex-wrap gap-3 mb-3">
              <button
                type="button"
                onClick={() => router.push('/director/curriculum/guided')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: '#11d9df', color: '#03100d' }}
              >
                <Sparkles className="w-4 h-4" />
                Start Guided Review
              </button>
              <button
                type="button"
                onClick={() => router.push('/director/curriculum/map')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  background: 'rgba(17,217,223,0.05)',
                  border: '1px solid rgba(17,217,223,0.15)',
                  color: '#a3aab4',
                }}
              >
                Review Incomplete Levels
              </button>
              <button
                type="button"
                onClick={() => setJumpOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  background: 'rgba(17,217,223,0.05)',
                  border: '1px solid rgba(17,217,223,0.15)',
                  color: '#a3aab4',
                }}
              >
                Jump to a Level
              </button>
            </div>

            {/* Buttons — row 2 */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openDonnaWithCurriculumGapPrompt}
                title={curriculumGapChip.safetyNote}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  background: 'rgba(17,217,223,0.04)',
                  border: '1px solid rgba(17,217,223,0.12)',
                  color: '#a3aab4',
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-lime" />
                Ask DONNA to Suggest Priorities
              </button>
              <button
                type="button"
                onClick={() => router.push('/director/curriculum')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  background: 'rgba(17,217,223,0.02)',
                  border: '1px solid rgba(17,217,223,0.08)',
                  color: '#555',
                }}
              >
                <Settings className="w-3.5 h-3.5" />
                Advanced Settings
              </button>
            </div>

          </div>
        </div>

        {/* ── How It Works ──────────────────────────────── */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-4">
            How It Works
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {HOW_IT_WORKS.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.num}
                  className="rounded-xl p-5"
                  style={{
                    background: '#060f0d',
                    border: '1px solid rgba(17,217,223,0.09)',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center mb-4"
                    style={{
                      background: 'rgba(17,217,223,0.08)',
                      border: '1px solid rgba(17,217,223,0.18)',
                    }}
                  >
                    <span className="text-[11px] font-bold text-lime leading-none">{item.num}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <p className="text-sm font-semibold text-text-primary leading-tight">
                      {item.title}
                    </p>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed pl-5">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Master Curriculum Overview ─────────────────── */}
        <div
          className="rounded-2xl p-6 mb-10"
          style={{
            background: '#060f0d',
            border: '1px solid rgba(17,217,223,0.09)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold text-text-primary">Master Curriculum Overview</p>
            <button
              type="button"
              onClick={() => router.push('/director/curriculum/map')}
              className="flex items-center gap-1 text-xs text-lime hover:opacity-75 transition-opacity"
            >
              View full map
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {PATHWAYS.map((p) => (
              <div
                key={p.name}
                className="rounded-xl p-4"
                style={{
                  background: p.glow,
                  border: `1px solid ${p.border}`,
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full mb-3"
                  style={{ background: p.dot }}
                />
                <p className="text-xs font-semibold text-text-primary leading-tight mb-1">
                  {p.name}
                </p>
                <p className="text-[11px] text-text-muted">{p.levels} levels</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Keyboard shortcuts (desktop only) ─────────── */}
        <div className="mb-6">
          <CurriculumKeyboardHintBar onJumpToLevel={() => setJumpOpen(true)} />
        </div>

        {/* ── Safety Footer ─────────────────────────────── */}
        <div className="flex items-center justify-center gap-2">
          <Shield
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: 'rgba(17,217,223,0.45)' }}
          />
          <p
            className="text-xs text-center"
            style={{ color: 'rgba(17,217,223,0.45)' }}
          >
            Nothing changes until you review and approve. Your curriculum is safe.
          </p>
        </div>

      </div>

      {/* ── Jump to Level Modal ─────────────────────── */}
      {jumpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#060f0d', border: '1px solid rgba(17,217,223,0.18)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(17,217,223,0.12)' }}>
              <p className="text-[13px] font-semibold text-text-primary">Jump to level</p>
              <button onClick={() => setJumpOpen(false)} className="text-text-muted hover:text-lime transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {levels.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-xs text-text-muted">Curriculum data not yet loaded.</p>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-80">
                {levels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => handleJump(level.id)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-b last:border-b-0 hover:bg-white/[0.03]"
                    style={{ borderColor: 'rgba(17,217,223,0.07)' }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: STAGE_COLOR[level.stage ?? ''] ?? '#555' }}
                    />
                    <span className="flex-1 text-[12px] text-text-primary">{level.display_name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
