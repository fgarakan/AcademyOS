'use client'

// Sprint 1003 — DONNA Shared Assistant Shell V1
// Presentational layout shell for DONNA panels across Director and Coach portals.
// Does not contain state — callers provide context, messages, and actions.
// The full stateful DonnaAssistantButton lives in src/components/assistant/.

import { Sparkles } from 'lucide-react'
import { DONNA_PERSONALITY } from '@/lib/donna/donnaPersonality'

// ── Types ─────────────────────────────────────────────────────────────────────

export type DonnaAssistantRole = 'director' | 'coach' | 'parent' | 'player' | 'platform'

export type DonnaAssistantMode =
  | 'command'
  | 'briefing'
  | 'wrap_up'
  | 'review'
  | 'support'

export interface DonnaQuickAction {
  label: string
  href?: string
  onClick?: () => void
  disabled?: boolean
  disabledReason?: string
}

export interface DonnaAssistantShellProps {
  role: DonnaAssistantRole
  title?: string
  subtitle?: string
  statusLabel?: string
  contextLabel?: string
  contextItems?: string[]
  quickActions?: DonnaQuickAction[]
  placeholder?: string
  safetyLabel?: string
  mode?: DonnaAssistantMode
  children?: React.ReactNode
  className?: string
}

// ── Role badge colors ─────────────────────────────────────────────────────────

const ROLE_BADGE: Record<DonnaAssistantRole, string> = {
  director:  'bg-lime/10 text-lime border-lime/20',
  coach:     'bg-status-blue/10 text-status-blue border-status-blue/20',
  parent:    'bg-status-orange/10 text-status-orange border-status-orange/20',
  player:    'bg-status-purple/10 text-status-purple border-status-purple/20',
  platform:  'bg-text-muted/10 text-text-muted border-text-muted/20',
}

const ROLE_LABEL: Record<DonnaAssistantRole, string> = {
  director:  'Director',
  coach:     'Coach',
  parent:    'Parent',
  player:    'Player',
  platform:  'Platform',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaAssistantShell({
  role,
  title = DONNA_PERSONALITY.name,
  subtitle,
  statusLabel,
  contextLabel,
  contextItems,
  quickActions,
  safetyLabel,
  children,
  className = '',
}: DonnaAssistantShellProps) {
  return (
    <div className={`rounded-2xl border border-border bg-surface flex flex-col overflow-hidden ${className}`}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
        <div className="w-8 h-8 rounded-xl bg-lime/15 border border-lime/25 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-lime" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-text-primary">{title}</span>
            {statusLabel && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-status-green/10 text-status-green border border-status-green/20">
                <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
                {statusLabel}
              </span>
            )}
            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold border ${ROLE_BADGE[role]}`}>
              {ROLE_LABEL[role]}
            </span>
          </div>
          {subtitle && (
            <p className="text-[11px] text-text-muted leading-none mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Context label + items */}
      {(contextLabel || (contextItems && contextItems.length > 0)) && (
        <div className="px-4 py-2.5 border-b border-border bg-surface-raised">
          {contextLabel && (
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5">{contextLabel}</p>
          )}
          {contextItems && contextItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {contextItems.map((item) => (
                <span key={item} className="px-2 py-0.5 rounded-lg border border-border bg-surface text-[10px] text-text-secondary">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Body — caller-supplied content */}
      {children && (
        <div className="flex-1 p-4">
          {children}
        </div>
      )}

      {/* Quick actions */}
      {quickActions && quickActions.length > 0 && (
        <div className="px-4 py-3 border-t border-border space-y-0.5">
          {quickActions.map((action) => {
            if (action.href && !action.disabled) {
              return (
                <a
                  key={action.label}
                  href={action.href}
                  className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-transparent hover:bg-lime/5 hover:border-lime/15 transition-all duration-100"
                >
                  <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors duration-100">{action.label}</span>
                </a>
              )
            }
            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                title={action.disabledReason}
                className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-transparent hover:bg-lime/5 hover:border-lime/15 transition-all duration-100 w-full text-left disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors duration-100 group-disabled:no-underline">{action.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Safety footer */}
      {safetyLabel && (
        <div className="px-4 pb-3 pt-1">
          <p className="text-[10px] text-text-muted leading-relaxed">{safetyLabel}</p>
        </div>
      )}
    </div>
  )
}
