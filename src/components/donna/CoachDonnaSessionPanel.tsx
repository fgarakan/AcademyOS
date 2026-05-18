'use client'

// Sprint 1007 — Coach DONNA Session Assistant V1
// Compact DONNA sidebar panel for coach session detail pages.
// Shows session context, curriculum focus, player watch-fors, and quick actions.
// Links to existing CoachSessionVoiceShell for voice/command input.
// No DB writes. All actions draft/local/placeholder unless already safe.

import { useState } from 'react'
import { Sparkles, Target, Users, BookOpen, ChevronDown, ChevronUp, ArrowRight, LayoutTemplate, MessageSquare, Flag, Play, ShieldCheck } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SessionContext {
  sessionName: string
  templateName?: string
  curriculumLevel?: string
  blockCount: number
  playerCount: number
  curriculumFocus?: string
  watchFors?: string[]
}

export interface CoachDonnaSessionPanelProps {
  sessionId: string
  context: SessionContext
  wrapUpHref: string
  executeHref: string
  onCaptureNote?: () => void
}

// ── Quick action definitions ──────────────────────────────────────────────────

function buildQuickActions(wrapUpHref: string, executeHref: string, onCaptureNote?: () => void) {
  return [
    {
      id: 'start_session',
      label: 'Start session',
      icon: <Play className="w-3.5 h-3.5" />,
      href: executeHref,
      kind: 'safe_read' as const,
    },
    {
      id: 'capture_note',
      label: 'Capture a note',
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      onClick: onCaptureNote,
      kind: 'draft_only' as const,
    },
    {
      id: 'flag_concern',
      label: 'Flag a player concern',
      icon: <Flag className="w-3.5 h-3.5" />,
      kind: 'draft_only' as const,
      note: 'Creates a draft — requires director review',
    },
    {
      id: 'wrap_up',
      label: 'Start wrap-up',
      icon: <ArrowRight className="w-3.5 h-3.5" />,
      href: wrapUpHref,
      kind: 'safe_read' as const,
      highlight: true,
    },
  ]
}

// ── Kind badge ────────────────────────────────────────────────────────────────

const KIND_BADGE: Record<string, string> = {
  safe_read:         '',
  draft_only:        'text-status-orange text-[9px]',
  requires_approval: 'text-status-red text-[9px]',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CoachDonnaSessionPanel({
  sessionId: _sessionId,
  context,
  wrapUpHref,
  executeHref,
  onCaptureNote,
}: CoachDonnaSessionPanelProps) {
  const [watchForsExpanded, setWatchForsExpanded] = useState(false)
  const quickActions = buildQuickActions(wrapUpHref, executeHref, onCaptureNote)
  const watchFors = context.watchFors ?? []
  const displayWatchFors = watchForsExpanded ? watchFors : watchFors.slice(0, 2)

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-lime/15 border border-lime/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-lime" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary">DONNA</span>
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold border bg-status-blue/10 text-status-blue border-status-blue/20">Coach</span>
          </div>
          <p className="text-[11px] text-text-muted leading-none mt-0.5">Session assistant</p>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* DONNA greeting */}
        <div className="flex gap-2 items-start">
          <div className="w-6 h-6 rounded-lg bg-lime/15 border border-lime/20 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-3 h-3 text-lime" />
          </div>
          <p className="text-sm text-text-primary leading-relaxed">
            Ready for {context.sessionName}. Here is what to keep in mind today.
          </p>
        </div>

        {/* Session context */}
        <div className="space-y-2">
          {context.curriculumLevel && (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border bg-surface-raised">
              <Target className="w-3.5 h-3.5 text-lime shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Level</p>
                <p className="text-xs font-semibold text-lime">{context.curriculumLevel}</p>
              </div>
            </div>
          )}
          {context.templateName && (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border bg-surface-raised">
              <LayoutTemplate className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Template</p>
                <p className="text-xs font-medium text-text-secondary">{context.templateName}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 px-3 py-2 rounded-xl border border-border bg-surface-raised">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs text-text-secondary">{context.playerCount} players</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs text-text-secondary">{context.blockCount} blocks</span>
            </div>
          </div>
        </div>

        {/* Today's curriculum focus */}
        {context.curriculumFocus && (
          <div className="rounded-xl border border-lime/15 bg-lime/4 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-widest text-lime mb-1">Today&apos;s Focus</p>
            <p className="text-xs text-text-secondary leading-relaxed">{context.curriculumFocus}</p>
          </div>
        )}

        {/* Watch-fors */}
        {watchFors.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Watch for</p>
            <div className="space-y-1">
              {displayWatchFors.map((w) => (
                <div key={w} className="flex items-start gap-2">
                  <span className="text-lime mt-1 shrink-0">·</span>
                  <span className="text-xs text-text-secondary leading-relaxed">{w}</span>
                </div>
              ))}
            </div>
            {watchFors.length > 2 && (
              <button
                type="button"
                onClick={() => setWatchForsExpanded(e => !e)}
                className="mt-1.5 flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
              >
                {watchForsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {watchForsExpanded ? 'Show less' : `Show ${watchFors.length - 2} more`}
              </button>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Quick Actions</p>
          <div className="space-y-1">
            {quickActions.map((action) => {
              const base = `group flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs transition-all duration-100`
              const highlight = action.highlight
                ? `border-lime/20 bg-lime/5 text-lime hover:bg-lime/10`
                : `border-transparent hover:bg-surface-raised hover:border-border text-text-secondary hover:text-text-primary`
              if (action.href) {
                return (
                  <a key={action.id} href={action.href} className={`${base} ${highlight}`}>
                    <span className="flex items-center gap-2">
                      <span className={highlight.includes('lime') ? 'text-lime' : 'text-text-muted group-hover:text-lime transition-colors'}>{action.icon}</span>
                      {action.label}
                    </span>
                    {action.note && <span className={KIND_BADGE[action.kind]}>{action.note}</span>}
                  </a>
                )
              }
              return (
                <button key={action.id} type="button" onClick={action.onClick} className={`${base} ${highlight} w-full text-left`}>
                  <span className="flex items-center gap-2">
                    <span className="text-text-muted group-hover:text-lime transition-colors">{action.icon}</span>
                    {action.label}
                  </span>
                  {action.note && <span className={KIND_BADGE[action.kind]}>{action.note}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Safety footer */}
        <div className="flex items-start gap-2 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-lime/60 shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-muted leading-relaxed">Notes and flags go to the Review Queue as drafts. Nothing applies automatically.</p>
        </div>

      </div>
    </div>
  )
}
