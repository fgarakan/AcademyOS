'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, CheckCircle2, X, ArrowRight } from 'lucide-react'

const DRAFT_KEY    = 'academyos_onboarding_draft_v2'
const DISMISS_KEY  = 'academyos_continue_setup_dismissed'

interface TaskCard {
  id: string
  label: string
  desc: string
  href: string
  isFirst: boolean
}

const TASKS: TaskCard[] = [
  {
    id: 'curriculum',
    label: 'Review Curriculum',
    desc: 'Review level structure and skill paths.',
    href: '/director/curriculum',
    isFirst: true,
  },
  {
    id: 'class-template',
    label: 'Create First Class Template',
    desc: 'Build a default on-court session template.',
    href: '/director/class-templates/new',
    isFirst: false,
  },
  {
    id: 'fitness',
    label: 'Create Fitness Template',
    desc: 'Add a physical prep session template.',
    href: '/director/fitness/templates/new',
    isFirst: false,
  },
  {
    id: 'players',
    label: 'Upload Players',
    desc: 'Import your player roster to start tracking.',
    href: '/director/players',
    isFirst: false,
  },
  {
    id: 'coaches',
    label: 'Add Coaches',
    desc: 'Add coaching staff and assign roles.',
    href: '/director/coaches',
    isFirst: false,
  },
  {
    id: 'portals',
    label: 'Preview Portals',
    desc: 'See how coach, player, and parent portals look. Preview only until connected to backend.',
    href: '/director',
    isFirst: false,
  },
]

export function DirectorContinueSetupPanel() {
  const [visible, setVisible]     = useState(false)
  const [academyName, setAcademyName] = useState('')

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === 'true') return
      const stored = localStorage.getItem(DRAFT_KEY)
      if (!stored) return
      const draft = JSON.parse(stored) as Record<string, unknown>
      const name = typeof draft?.academyName === 'string' ? draft.academyName.trim() : ''
      if (name) {
        setAcademyName(name)
        setVisible(true)
      }
    } catch {
      // localStorage unavailable or draft corrupted — fail silently
    }
  }, [])

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, 'true') } catch { /* ignore */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="rounded-2xl bg-surface border border-lime/20 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-lime/5 border-b border-lime/15">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-lime/20 border border-lime/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3 h-3 text-lime" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text-primary">Continue Setup</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-lime bg-lime/10 border border-lime/25 rounded px-1.5 py-0.5">
              Academy DNA Ready
            </span>
            {academyName && (
              <span className="text-[11px] text-text-muted">— {academyName}</span>
            )}
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 p-1 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-raised transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* DONNA message */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-lime/10 border border-lime/25 flex items-center justify-center shrink-0 mt-0.5">
            <span className="font-bold text-lime text-[13px] leading-none select-none">D</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-semibold text-text-primary">DONNA</span>
              <Sparkles className="w-2.5 h-2.5 text-lime" />
            </div>
            <p className="text-[12px] text-text-secondary leading-relaxed">
              Your Academy DNA is ready. Next, finish the setup pieces that turn your DNA into an operating system.
            </p>
          </div>
        </div>
      </div>

      {/* Task cards */}
      <div className="px-5 py-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-3">
          Next setup tasks
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {TASKS.map(task => (
            <Link
              key={task.id}
              href={task.href}
              className={[
                'group block rounded-xl border px-4 py-3 transition-all',
                task.isFirst
                  ? 'bg-lime/5 border-lime/25 hover:bg-lime/8 hover:border-lime/40'
                  : 'bg-surface-raised border-border hover:border-border-strong hover:bg-surface',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className={[
                  'text-xs font-semibold leading-tight',
                  task.isFirst ? 'text-text-primary' : 'text-text-secondary',
                ].join(' ')}>
                  {task.label}
                </p>
                {task.isFirst && (
                  <span className="shrink-0 text-[8px] font-bold uppercase tracking-wide text-lime bg-lime/10 border border-lime/25 rounded px-1.5 py-0.5 whitespace-nowrap">
                    Ready next
                  </span>
                )}
              </div>
              <p className="text-[10px] text-text-muted leading-snug mb-2">
                {task.desc}
              </p>
              <span className={[
                'inline-flex items-center gap-1 text-[10px] font-medium transition-colors',
                task.isFirst
                  ? 'text-lime group-hover:text-lime/80'
                  : 'text-text-muted group-hover:text-text-secondary',
              ].join(' ')}>
                Open
                <ArrowRight className="w-2.5 h-2.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
