'use client'

// Sprint 1681 — DONNA Daily COO Brief Surface V1
// Shows a once-per-day COO briefing card at the top of the director experience.
// Uses localStorage to gate to one showing per calendar day.
// Dismissible. Shows honest empty-state when no directorCtx is available.
// Links to /director/donna for the full interactive brief.
//
// Design rules:
//   - Once per day per device (localStorage key: donna_brief_shown_date).
//   - No fake data. All signals are from buildDailyCOOBriefing() which is honest.
//   - "Show again" button resets the gate for the current session.
//   - Never auto-dismisses. Always gives director control.
//   - No DB writes. Read-only display. All mutations go through proper flow.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, X, ChevronRight, ArrowRight } from 'lucide-react'
import { buildDailyCOOBriefing } from '@/lib/donna/briefing/dailyBriefingEngine'

const BRIEF_DATE_KEY = 'donna_brief_shown_date'

function todayString(): string {
  return new Date().toISOString().slice(0, 10)  // "2026-06-03"
}

function hasBriefBeenShownToday(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(BRIEF_DATE_KEY) === todayString()
  } catch {
    return false
  }
}

function markBriefShownToday(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(BRIEF_DATE_KEY, todayString())
  } catch {
    /* localStorage may be unavailable */
  }
}

function resetBriefShown(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(BRIEF_DATE_KEY)
  } catch {
    /* non-fatal */
  }
}

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface DonnaDailyCOOBriefSurfaceProps {
  directorName?: string | null
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function DonnaDailyCOOBriefSurface({ directorName }: DonnaDailyCOOBriefSurfaceProps) {
  const [visible, setVisible]   = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Mount check — only show if not yet shown today. SSR-safe.
  useEffect(() => {
    if (!hasBriefBeenShownToday()) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  // Build brief with null context — honest empty state when data not loaded
  const brief = buildDailyCOOBriefing(null, directorName)
  const firstName = directorName ? directorName.split(' ')[0] : null

  function dismiss() {
    markBriefShownToday()
    setVisible(false)
  }

  function showAgain() {
    resetBriefShown()
    setVisible(true)
  }

  const URGENCY_COLOR: Record<string, string> = {
    critical:      'text-status-red',
    high:          'text-status-orange',
    medium:        'text-lime',
    informational: 'text-text-secondary',
  }

  return (
    <div
      className="mx-4 mt-3 mb-1 rounded-xl border border-lime/20 bg-surface overflow-hidden"
      role="complementary"
      aria-label="DONNA daily briefing"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-lime">
            DONNA — Daily Brief
          </span>
          {brief.hasCritical && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-status-red/20 text-status-red">
              Action required
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            className="p-1 rounded hover:bg-surface-raised transition-colors text-text-muted hover:text-text-secondary"
            onClick={() => setExpanded(v => !v)}
            aria-label={expanded ? 'Collapse brief' : 'Expand brief'}
          >
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
              aria-hidden
            />
          </button>
          <button
            className="p-1 rounded hover:bg-surface-raised transition-colors text-text-muted hover:text-text-secondary"
            onClick={dismiss}
            aria-label="Dismiss daily brief"
          >
            <X className="w-3.5 h-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {/* ── Opening line ──────────────────────────────────────────────── */}
      <div className="px-4 pb-2 text-[12px] text-text-secondary">
        {brief.openingLine}
        {brief.items.length === 0
          ? ' Your academy has no urgent signals today.'
          : ` Today's ${brief.items.length === 1 ? 'priority' : `top ${Math.min(brief.items.length, 3)} priorities`}:`}
      </div>

      {/* ── Priority list (always visible, top 3) ─────────────────────── */}
      {brief.items.length > 0 && (
        <div className="px-4 pb-2 space-y-1">
          {brief.items.slice(0, 3).map((item, i) => (
            <div key={item.id} className="flex items-start gap-2">
              <span className="text-text-muted text-[11px] mt-0.5 shrink-0">{i + 1}.</span>
              <Link
                href={item.actionHref}
                className={`text-[12px] hover:underline ${URGENCY_COLOR[item.urgency]}`}
              >
                {item.headline}
              </Link>
            </div>
          ))}
          {brief.items.length === 0 && (
            <p className="text-[12px] text-text-muted italic">
              {firstName
                ? `No urgent items, ${firstName}. Academy is operating normally.`
                : 'No urgent items. Academy is operating normally.'}
            </p>
          )}
        </div>
      )}

      {/* ── No data state ─────────────────────────────────────────────── */}
      {brief.items.length === 0 && (
        <div className="px-4 pb-2 text-[12px] text-text-muted italic">
          Academy data will appear once sessions, assessments, and player records are active.
        </div>
      )}

      {/* ── Expanded detail ───────────────────────────────────────────── */}
      {expanded && brief.items.length > 0 && (
        <div className="px-4 pb-3 space-y-2 border-t border-border pt-2">
          {brief.items.map(item => (
            <div key={item.id} className="space-y-0.5">
              <div className={`text-[12px] font-medium ${URGENCY_COLOR[item.urgency]}`}>
                {item.headline}
              </div>
              <div className="text-[11px] text-text-secondary">{item.whyItMatters}</div>
              <div className="text-[11px] text-text-muted">{item.suggestedAction}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-between gap-2">
        <Link
          href="/director/donna"
          className="flex items-center gap-1 text-[11px] text-lime hover:underline"
        >
          Open full brief
          <ArrowRight className="w-3 h-3" aria-hidden />
        </Link>
        <button
          className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
          onClick={dismiss}
        >
          Dismiss for today
        </button>
      </div>
    </div>
  )
}
