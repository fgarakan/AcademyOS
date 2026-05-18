'use client'

import Link from 'next/link'
import { ArrowLeft, Zap, CheckCircle, AlertCircle, Clock, Minus } from 'lucide-react'
import { CurriculumDonnaPanel } from './CurriculumDonnaPanel'

// ─── Impact card status types ─────────────────────────────────────────────────

type ImpactStatus = 'will_update' | 'needs_review' | 'not_affected' | 'future'

interface ImpactItem {
  label: string
  detail: string
  status: ImpactStatus
}

const STATUS_CONFIG: Record<ImpactStatus, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle }> = {
  will_update:  { label: 'Will Update',    color: '#11d9df', bg: 'rgba(17,217,223,0.10)',  border: 'rgba(17,217,223,0.25)', icon: Zap          },
  needs_review: { label: 'Needs Review',   color: '#FF9500', bg: 'rgba(255,149,0,0.10)',   border: 'rgba(255,149,0,0.25)',  icon: AlertCircle   },
  not_affected: { label: 'Not Affected',   color: '#555',    bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', icon: Minus        },
  future:       { label: 'Future',         color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.20)', icon: Clock        },
}

const IMPACT_ITEMS: ImpactItem[] = [
  {
    label: 'Orange Ball 2 Curriculum',
    detail: 'Drill added to skill path. Domain coverage updated. Level readiness score recalculated.',
    status: 'will_update',
  },
  {
    label: 'Session Templates',
    detail: 'Coaches can optionally include this drill in session templates. No automatic change to existing templates.',
    status: 'needs_review',
  },
  {
    label: 'Lesson Plans',
    detail: 'Existing lesson plans are unaffected. New plans can include this drill once approved.',
    status: 'needs_review',
  },
  {
    label: 'Coach Session Context',
    detail: 'Drill appears in the coaching context panel for Orange Ball 2 sessions after approval.',
    status: 'will_update',
  },
  {
    label: 'Player Profile Requirements',
    detail: 'Player advancement requirements are unchanged — this drill does not create a mandatory gate.',
    status: 'not_affected',
  },
  {
    label: 'Assessment Gates',
    detail: 'No gates are modified by this drill addition. Gates remain at their current requirements.',
    status: 'not_affected',
  },
  {
    label: 'Player Missions',
    detail: 'Player missions are not currently connected to drills. No change.',
    status: 'not_affected',
  },
  {
    label: 'Parent/Player Summaries',
    detail: 'Drill names may appear in future parent development updates when connected to player sessions.',
    status: 'future',
  },
  {
    label: 'Orange Ball 3 Curriculum',
    detail: 'May be eligible for inclusion if level_min_id is broadened. Not applied automatically.',
    status: 'future',
  },
]

// ─── Counter card ─────────────────────────────────────────────────────────────

function CounterCard({ status, count }: { status: ImpactStatus; count: number }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <div
      className="flex flex-col items-center gap-1.5 rounded-xl px-4 py-3"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <Icon className="w-4 h-4" style={{ color: cfg.color }} />
      <p className="text-[18px] font-bold font-mono" style={{ color: cfg.color }}>{count}</p>
      <p className="text-[9px] uppercase tracking-widest font-semibold text-center" style={{ color: cfg.color + 'bb' }}>
        {cfg.label}
      </p>
    </div>
  )
}

// ─── Impact row ───────────────────────────────────────────────────────────────

function ImpactRow({ item }: { item: ImpactItem }) {
  const cfg = STATUS_CONFIG[item.status]
  const Icon = cfg.icon
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)` }}
    >
      <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: cfg.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-text-primary">{item.label}</p>
        <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">{item.detail}</p>
      </div>
      <span
        className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
      >
        {cfg.label}
      </span>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CurriculumImpactPreviewExperience() {
  const willUpdate   = IMPACT_ITEMS.filter(i => i.status === 'will_update').length
  const needsReview  = IMPACT_ITEMS.filter(i => i.status === 'needs_review').length
  const notAffected  = IMPACT_ITEMS.filter(i => i.status === 'not_affected').length
  const future       = IMPACT_ITEMS.filter(i => i.status === 'future').length

  return (
    <div className="animate-fade-in flex gap-6 p-6 items-start">

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Header */}
        <div className="flex items-start gap-3">
          <Link
            href="/director/curriculum/builder/add-drill"
            className="text-text-muted hover:text-lime transition-colors mt-1 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <p className="page-eyebrow">Curriculum Builder</p>
            <h1 className="page-title">Impact Preview</h1>
            <p className="text-[12px] text-text-secondary mt-1">
              Review what will change before anything is applied
            </p>
          </div>
        </div>

        {/* Change summary card */}
        <div
          className="rounded-2xl p-4 flex items-start gap-4"
          style={{ background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(17,217,223,0.12)', border: '1px solid rgba(17,217,223,0.25)' }}
          >
            <Zap className="w-4 h-4" style={{ color: '#11d9df' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[13px] font-bold text-text-primary">Wide Ball Recovery Builder</p>
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(255,149,0,0.12)', color: '#FF9500', border: '1px solid rgba(255,149,0,0.25)' }}
              >
                Draft
              </span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">New drill · Orange Ball 2</p>
          </div>
          <p className="text-[10px] text-text-muted shrink-0">Pending approval</p>
        </div>

        {/* Impact counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <CounterCard status="will_update"  count={willUpdate}  />
          <CounterCard status="needs_review" count={needsReview} />
          <CounterCard status="not_affected" count={notAffected} />
          <CounterCard status="future"       count={future}      />
        </div>

        {/* Impact cards */}
        <div className="space-y-2">
          {IMPACT_ITEMS.map(item => (
            <ImpactRow key={item.label} item={item} />
          ))}
        </div>

        {/* Safe note */}
        <div
          className="rounded-xl flex items-center gap-2.5 px-4 py-3"
          style={{ background: 'rgba(200,255,0,0.02)', border: '1px solid rgba(200,255,0,0.10)' }}
        >
          <AlertCircle className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-[10px] text-text-muted leading-relaxed">
            <span className="text-lime font-semibold">Nothing is applied yet — </span>
            This is a preview only. Use the scope controls below to choose what changes, then approve in the Review Queue.
          </p>
        </div>
      </div>

      {/* ── Right DONNA panel ────────────────────────────────────────────── */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-6 self-start">
        <CurriculumDonnaPanel mode="impact" />
      </aside>
    </div>
  )
}
