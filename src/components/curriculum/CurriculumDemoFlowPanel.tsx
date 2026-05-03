'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, BookOpen, Users, Calendar, Layers } from 'lucide-react'

const DEMO_STEPS = [
  {
    step: 1,
    title: 'Choose a curriculum level',
    description: 'Select any stage tab (Red, Orange, Green, Yellow, HP) and click a level card on the left. The detail panel opens on the right.',
    cta: null,
    ctaLabel: null,
    icon: <Layers className="w-3.5 h-3.5" />,
  },
  {
    step: 2,
    title: 'Read the exit gates',
    description: 'Open the Gates tab. Each gate shows the criterion, threshold, evaluator type, and cadence. These are the evidence-based requirements a player must meet to advance. Click any gate row to expand full details.',
    cta: null,
    ctaLabel: null,
    icon: <Layers className="w-3.5 h-3.5" />,
  },
  {
    step: 3,
    title: 'Browse the drill library',
    description: 'Open the Drills tab. Filter by domain or session block. Each drill shows the objective, setup, coaching cues, progressions, and success criteria. "Use in session" will connect to session planning in a future sprint.',
    cta: null,
    ctaLabel: null,
    icon: <Layers className="w-3.5 h-3.5" />,
  },
  {
    step: 4,
    title: 'Read coach language',
    description: 'Open the Coach Language tab. Toggle between Coach View (full technical language), Parent-Safe Draft (simplified), and Player-Friendly Draft (mission-focused). All views are read-only.',
    cta: null,
    ctaLabel: null,
    icon: <Layers className="w-3.5 h-3.5" />,
  },
  {
    step: 5,
    title: 'Open a player with a curriculum level',
    description: 'Navigate to any active player profile. The Overview tab sidebar shows the Curriculum card — Skill Track, Competition Track, Fitness Phase, and a link back here. The Skill Path tab shows the requirements to advance.',
    cta: '/director/players',
    ctaLabel: 'Go to Players',
    icon: <Users className="w-3.5 h-3.5" />,
  },
  {
    step: 6,
    title: 'See level-up requirements',
    description: 'In the player\'s Skill Path tab, scroll down to "Requirements to Advance." This lists all gate criteria from the player\'s current level, grouped by domain with thresholds and evaluator types visible.',
    cta: '/director/players',
    ctaLabel: 'Go to Players',
    icon: <Users className="w-3.5 h-3.5" />,
  },
  {
    step: 7,
    title: 'Open a session with curriculum context',
    description: 'Navigate to any session linked to a template with a curriculum level. The session page shows the Curriculum Context panel — top domains, active gates, recommended drills, and coach language cues for that level.',
    cta: '/director/sessions',
    ctaLabel: 'Go to Sessions',
    icon: <Calendar className="w-3.5 h-3.5" />,
  },
]

export function CurriculumDemoFlowPanel() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-2xl border border-border bg-surface-raised">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-lime shrink-0" />
          <div>
            <p className="text-[12px] font-semibold text-text-primary">How to read the curriculum</p>
            <p className="text-[10px] text-text-muted mt-0.5">
              A 7-step demo flow for directors and coaches
            </p>
          </div>
        </div>
        {expanded
          ? <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
          : <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
        }
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          <p className="text-[11px] text-text-muted mb-4 leading-relaxed">
            The curriculum is built around 15 levels across 5 stages. Each level has evidence-based exit gates,
            a drill library, and coaching language — all connected to player profiles and session planning.
            Follow the steps below to see how it fits together.
          </p>

          <ol className="space-y-3">
            {DEMO_STEPS.map(({ step, title, description, cta, ctaLabel }) => (
              <li key={step} className="flex items-start gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center text-[9px] font-mono text-lime mt-0.5">
                  {step}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-text-primary mb-0.5">{title}</p>
                  <p className="text-[10px] text-text-muted leading-relaxed">{description}</p>
                  {cta && (
                    <Link
                      href={cta}
                      className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-lime hover:underline"
                    >
                      {ctaLabel}
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[10px] text-text-muted">
              All curriculum data is read-only. Gates, drills, and coach language are the global spine —
              your academy customizations live in your curriculum version below.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
