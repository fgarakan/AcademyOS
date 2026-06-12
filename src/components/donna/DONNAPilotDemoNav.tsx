'use client'

// Sprint 635 — Pilot Navigation Polish V1
// Compact navigation card showing the recommended pilot demo flow steps.
// Helps Brian follow the demo route during the pilot.
// Display only — no DB writes.

import { CheckCircle2, Circle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { DONNA_PUBLIC_NAME } from '@/components/assistant/donnaAssistantCopy'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PilotDemoStep {
  id: string
  label: string
  href: string
  description: string
  isComplete?: boolean
  isActive?: boolean
}

export interface DONNAPilotDemoNavProps {
  steps?: PilotDemoStep[]
  compact?: boolean
  className?: string
}

// ── Default pilot flow ─────────────────────────────────────────────────────────

const DEFAULT_PILOT_STEPS: PilotDemoStep[] = [
  {
    id: 'dashboard',
    label: 'Director dashboard',
    href: '/director',
    description: 'Academy health overview and today\'s summary',
  },
  {
    id: 'review',
    label: 'Review queue',
    href: '/director/review',
    description: 'Approve, clarify, or reject pending items',
  },
  {
    id: 'players',
    label: 'Player profiles',
    href: '/director/players',
    description: 'View player development and risk signals',
  },
  {
    id: 'command',
    label: `${DONNA_PUBLIC_NAME} command center`,
    href: '/director/command-center',
    description: `Ask ${DONNA_PUBLIC_NAME} a question or give a voice command`,
  },
  {
    id: 'coo',
    label: 'COO intelligence',
    href: '/director',
    description: `Full ${DONNA_PUBLIC_NAME} COO academy view`,
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNAPilotDemoNav({
  steps = DEFAULT_PILOT_STEPS,
  compact = false,
  className = '',
}: DONNAPilotDemoNavProps) {
  const completedCount = steps.filter(s => s.isComplete).length
  const activeIndex = steps.findIndex(s => s.isActive)

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`w-1.5 h-1.5 rounded-full ${
                step.isComplete
                  ? 'bg-status-green'
                  : step.isActive
                  ? 'bg-lime'
                  : 'bg-surface-raised border border-border'
              }`}
            />
          ))}
        </div>
        <span className="text-[10px] text-text-muted">
          Pilot: {completedCount}/{steps.length}
        </span>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-text-primary">Pilot demo flow</p>
        <span className="text-[10px] text-text-muted font-mono">
          {completedCount}/{steps.length} steps
        </span>
      </div>

      {/* Steps */}
      <div className="divide-y divide-border/40">
        {steps.map((step, i) => {
          const isActive = step.isActive || (activeIndex === -1 && i === 0 && !step.isComplete)
          return (
            <Link
              key={step.id}
              href={step.href}
              className={`flex items-center gap-3 px-4 py-2.5 hover:bg-surface-raised transition-colors ${
                isActive ? 'bg-lime/5' : ''
              }`}
            >
              {/* Status icon */}
              <div className="shrink-0">
                {step.isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-status-green" />
                ) : (
                  <Circle className={`w-4 h-4 ${isActive ? 'text-lime' : 'text-text-muted'}`} />
                )}
              </div>

              {/* Label and description */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${
                  step.isComplete
                    ? 'text-text-muted line-through'
                    : isActive
                    ? 'text-text-primary'
                    : 'text-text-secondary'
                }`}>
                  {step.label}
                </p>
                {!compact && (
                  <p className="text-[10px] text-text-muted truncate">{step.description}</p>
                )}
              </div>

              {/* Arrow */}
              <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${
                isActive ? 'text-lime' : 'text-text-muted'
              }`} />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
