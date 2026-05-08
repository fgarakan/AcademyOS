'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ChevronUp, ChevronDown, X, Sparkles } from 'lucide-react'

const DISMISS_KEY = 'acos_setup_checklist_dismissed'
const COLLAPSE_KEY = 'acos_setup_checklist_collapsed'

interface SetupStep {
  id: string
  title: string
  description: string
  completed: boolean
  ctaLabel: string
  ctaHref: string
  unlocksLabel: string
}

interface Props {
  playersExist: boolean
  curriculumLevelsAssigned: boolean
  templatesExist: boolean
  sessionsExist: boolean
}

export function SetupProgressChecklist({
  playersExist,
  curriculumLevelsAssigned,
  templatesExist,
  sessionsExist,
}: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === 'true')
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === 'true')
    setMounted(true)
  }, [])

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  function toggleCollapse() {
    const next = !collapsed
    localStorage.setItem(COLLAPSE_KEY, String(next))
    setCollapsed(next)
  }

  if (!mounted || dismissed) return null

  const steps: SetupStep[] = [
    {
      id: 'players',
      title: 'Add your first player',
      description: 'Import or manually add players to begin tracking their development.',
      completed: playersExist,
      ctaLabel: 'View Players',
      ctaHref: '/director/players',
      unlocksLabel: 'Player profiles, level tracking, parent and player portals',
    },
    {
      id: 'levels',
      title: 'Assign curriculum levels',
      description: 'Link each player to their current training level. This activates the skill path, progression gates, and player missions.',
      completed: curriculumLevelsAssigned,
      ctaLabel: 'Open Player Profiles',
      ctaHref: '/director/players',
      unlocksLabel: 'Skill path, progression gates, player missions',
    },
    {
      id: 'templates',
      title: 'Build a class template',
      description: 'Class templates define the structure of your training sessions. Each one can carry a curriculum lesson plan.',
      completed: templatesExist,
      ctaLabel: 'Class Templates',
      ctaHref: '/director/class-templates',
      unlocksLabel: 'Reusable session structure, curriculum-linked coaching plans',
    },
    {
      id: 'lesson_plan',
      title: 'Generate and apply a lesson plan',
      description: 'Open a class template, assign a curriculum level, and use the lesson plan generator. Apply the draft to make it live for coaches.',
      completed: false,
      ctaLabel: 'Open Class Templates',
      ctaHref: '/director/class-templates',
      unlocksLabel: 'Curriculum content visible to coaches during sessions',
    },
    {
      id: 'session',
      title: 'Create a session from a template',
      description: 'Generate a session from a class template. Coaches will execute it and record what happened.',
      completed: sessionsExist,
      ctaLabel: 'Sessions',
      ctaHref: '/director/sessions',
      unlocksLabel: 'Live session execution, coach wrap-up, attendance tracking',
    },
    {
      id: 'wrap_up',
      title: 'Review a coach wrap-up',
      description: 'After a session, coaches submit wrap-ups. Review them in the queue to approve observations and apply session notes.',
      completed: false,
      ctaLabel: 'Review Queue',
      ctaHref: '/director/review',
      unlocksLabel: 'Planned vs actual analysis, gate evidence, development tracking',
    },
    {
      id: 'clarity',
      title: 'Preview parent and player clarity',
      description: 'Open a player profile and use the parent/player preview tabs to see what families will see. Everything flows from what you set up here.',
      completed: false,
      ctaLabel: 'Open a Player Profile',
      ctaHref: '/director/players',
      unlocksLabel: 'Development transparency, parent engagement, player missions',
    },
  ]

  const completedCount = steps.filter(s => s.completed).length
  const progressPct = Math.round((completedCount / steps.length) * 100)

  return (
    <div className="rounded-2xl border border-lime/20 bg-surface overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-lime" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-text-primary leading-tight">
              Set up your academy operating system
            </p>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
              Follow these steps to turn your curriculum into coach-ready sessions and parent/player clarity.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Expand setup checklist' : 'Collapse setup checklist'}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-raised transition-all"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss setup checklist"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-raised transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
            <div
              className="h-full bg-lime rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[10px] font-mono text-text-muted shrink-0 tabular-nums">
            {completedCount} / {steps.length}
          </p>
        </div>
      </div>

      {/* Step list */}
      {!collapsed && (
        <div className="border-t border-border">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={[
                'flex items-start gap-3 px-5 py-3 border-b border-border/50 last:border-b-0',
                step.completed ? 'opacity-50' : '',
              ].join(' ')}
            >
              <div className="shrink-0 mt-0.5">
                {step.completed
                  ? <CheckCircle2 className="w-4 h-4 text-status-green" />
                  : <Circle className="w-4 h-4 text-border" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <p className={`text-xs font-medium leading-tight ${step.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                    <span className="text-[10px] font-mono text-text-muted mr-1.5">{idx + 1}.</span>
                    {step.title}
                  </p>
                  {!step.completed && (
                    <Link
                      href={step.ctaHref}
                      className="text-[11px] font-medium text-lime hover:opacity-80 transition-opacity shrink-0 whitespace-nowrap"
                    >
                      {step.ctaLabel} →
                    </Link>
                  )}
                </div>

                {!step.completed && (
                  <>
                    <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">
                      <span className="text-lime/60">Unlocks:</span>{' '}
                      {step.unlocksLabel}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
