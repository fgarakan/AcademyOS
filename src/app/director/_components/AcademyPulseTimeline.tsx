'use client'

// Mega Sprint 2591–2620 — DONNA Proactive COO + Overnight Intelligence V1
// Academy Pulse Timeline — visual Yesterday / Today / Tomorrow
//
// Shows a simple three-column timeline with color-coded status for each window.
// Pure presentational — data already derived by existing engines.

import type { AcademyHealthSignal } from '@/lib/donna/coo/academyDailySnapshot'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PulseTimelineWindow {
  label:     string
  signal:    AcademyHealthSignal
  summary:   string
  itemCount: number
}

export interface AcademyPulseTimelineProps {
  yesterday: PulseTimelineWindow
  today:     PulseTimelineWindow
  tomorrow:  PulseTimelineWindow
}

// ── Signal display ────────────────────────────────────────────────────────────

function signalConfig(signal: AcademyHealthSignal) {
  const cfg = {
    healthy:         { dot: 'bg-status-green',  text: 'text-status-green',  border: 'border-status-green/30',  label: 'Healthy' },
    stable:          { dot: 'bg-status-blue',   text: 'text-status-blue',   border: 'border-status-blue/30',   label: 'Stable' },
    needs_attention: { dot: 'bg-status-orange', text: 'text-status-orange', border: 'border-status-orange/30', label: 'Watch' },
    critical:        { dot: 'bg-status-red',    text: 'text-status-red',    border: 'border-status-red/30',    label: 'Critical' },
    no_data:         { dot: 'bg-text-muted',    text: 'text-text-muted',    border: 'border-border',           label: 'No Data' },
  }
  return cfg[signal] ?? cfg.no_data
}

// ── Single window cell ────────────────────────────────────────────────────────

function TimelineCell({
  window: w,
  isToday,
}: {
  window: PulseTimelineWindow
  isToday: boolean
}) {
  const cfg = signalConfig(w.signal)

  return (
    <div
      className={`
        flex-1 rounded-xl border p-4 transition-colors
        ${isToday
          ? `border-lime/30 bg-lime/5`
          : `border-border bg-surface-raised/50`
        }
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />
        <span className={`text-[11px] font-semibold uppercase tracking-widest ${isToday ? 'text-lime' : 'text-text-muted'}`}>
          {w.label}
        </span>
      </div>

      <p className={`text-[11px] font-medium ${cfg.text} mb-1`}>{cfg.label}</p>
      <p className="text-[11px] text-text-muted leading-snug line-clamp-2">{w.summary}</p>

      {w.itemCount > 0 && (
        <p className="text-[10px] text-text-muted mt-2 font-mono">
          {w.itemCount} item{w.itemCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AcademyPulseTimeline({ yesterday, today, tomorrow }: AcademyPulseTimelineProps) {
  return (
    <div className="space-y-2">
      <p className="label-xs text-text-muted">Academy Pulse Timeline</p>
      <div className="flex gap-3">
        <TimelineCell window={yesterday} isToday={false} />
        <TimelineCell window={today}     isToday={true}  />
        <TimelineCell window={tomorrow}  isToday={false} />
      </div>
    </div>
  )
}
