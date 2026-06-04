'use client'

// Sprint 1801–1810 — DONNA Proactive Pilot Guide V1
// Page-aware guide card that appears once per route per session.
// Helps a first-time director know what a page is for and what to do next.
//
// Design rules:
//   - One card per canonical route per browser session (sessionStorage-gated)
//   - Dismissible — director is always in control
//   - Desktop-only (hidden on mobile — BottomTabBar is the mobile nav)
//   - Fixed above the DONNA assistant button (bottom-24 right-6 z-40)
//   - "Ask DONNA" dispatches donna:open with the suggested question
//   - No DB calls, no mutations, no approvals, no fake data

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Sparkles, X, ArrowRight } from 'lucide-react'
import { useDonnaSessionContext } from '@/lib/donna/donnaSessionContext'
import {
  generateProactivePageBrief,
  canonicalizeBriefRoute,
  type ProactivePageBrief,
} from '@/lib/donna/proactive/proactivePageBriefEngine'

// ── Session cooldown ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'donna_pilot_routes_seen_v1'

function getSeenRoutes(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function markRouteSeen(routeKey: string): void {
  if (typeof window === 'undefined') return
  try {
    const seen = getSeenRoutes()
    seen.add(routeKey)
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(seen)))
  } catch {
    /* non-fatal */
  }
}

// ── donna:open dispatcher ─────────────────────────────────────────────────────

function askDonna(question: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('donna:open', {
      detail: { prompt: question, autoSubmit: true },
    }),
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

function BriefCard({
  brief,
  onDismiss,
}: {
  brief: ProactivePageBrief
  onDismiss: () => void
}) {
  return (
    <div
      className="w-72 rounded-xl shadow-xl overflow-hidden"
      style={{
        background: 'rgba(17,17,17,0.97)',
        border: '1px solid rgba(200,255,0,0.20)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(200,255,0,0.06)',
      }}
      role="complementary"
      aria-label={`DONNA guide: ${brief.pageLabel}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-lime shrink-0" aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-lime">
            DONNA — {brief.pageLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="p-0.5 rounded text-text-muted hover:text-text-secondary transition-colors"
          aria-label="Dismiss guide"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-3.5 pb-3 space-y-2.5">
        {/* What is this page? */}
        <p className="text-[11px] text-text-secondary leading-snug">
          {brief.whatIsThis}
        </p>

        {/* Look first + do next */}
        <div className="space-y-1.5 rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Look first
            </span>
            <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
              {brief.lookFirst}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Do next
            </span>
            <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
              {brief.doNext}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              askDonna(brief.suggestedQuestion)
              onDismiss()
            }}
            className="flex items-center gap-1 text-[11px] font-medium text-lime hover:underline shrink-0"
          >
            <Sparkles className="w-3 h-3 shrink-0" aria-hidden />
            Ask DONNA
          </button>

          {brief.ctaHref && brief.ctaLabel && (
            <a
              href={brief.ctaHref}
              className="ml-auto flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors shrink-0"
            >
              {brief.ctaLabel}
              <ArrowRight className="w-3 h-3" aria-hidden />
            </a>
          )}
        </div>

        {/* Suggested question chip */}
        <button
          type="button"
          onClick={() => {
            askDonna(brief.suggestedQuestion)
            onDismiss()
          }}
          className="w-full text-left text-[11px] text-text-muted px-2.5 py-1.5 rounded-lg border transition-colors hover:text-text-secondary hover:border-lime/20"
          style={{ borderColor: 'rgba(34,34,34,0.8)', background: 'rgba(255,255,255,0.02)' }}
        >
          "{brief.suggestedQuestion}"
        </button>
      </div>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DonnaProactiveBriefCardProps {
  /** Live pending review count from the director layout server query */
  pendingCount: number
  /** Live missing wrap-up count (optional — layout may not have this) */
  missingWrapUps?: number
  /** Live today's session count (optional) */
  todaySessions?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaProactiveBriefCard({
  pendingCount,
  missingWrapUps,
  todaySessions,
}: DonnaProactiveBriefCardProps) {
  const pathname = usePathname() ?? '/director'
  const { session } = useDonnaSessionContext()
  const [brief, setBrief] = useState<ProactivePageBrief | null>(null)
  const [visible, setVisible] = useState(false)

  // Evaluate brief on route change
  useEffect(() => {
    const routeKey = canonicalizeBriefRoute(pathname)
    if (!routeKey) {
      setVisible(false)
      return
    }

    const seen = getSeenRoutes()
    if (seen.has(routeKey)) {
      setVisible(false)
      return
    }

    const generated = generateProactivePageBrief(pathname, {
      pendingReviews: pendingCount,
      missingWrapUps,
      todaySessions,
      playerProfileCtx: session.playerProfileContext,
    })

    if (!generated) {
      setVisible(false)
      return
    }

    setBrief(generated)
    setVisible(true)
  // pathname + pendingCount are the signals — playerProfileContext may update asynchronously
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, pendingCount])

  const dismiss = useCallback(() => {
    const routeKey = canonicalizeBriefRoute(pathname)
    if (routeKey) markRouteSeen(routeKey)
    setVisible(false)
  }, [pathname])

  if (!visible || !brief) return null

  return (
    // Desktop-only, fixed above the DONNA assistant button (bottom-6 right-6, button is w-12 h-12)
    <div className="fixed bottom-24 right-6 z-40 hidden lg:block">
      <BriefCard brief={brief} onDismiss={dismiss} />
    </div>
  )
}
