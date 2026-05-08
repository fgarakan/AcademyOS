'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'

const STEPS = [
  {
    num: 1,
    title: 'Choose your teaching philosophy',
    body: 'Tell the system what your academy values most: technical foundation, game-based learning, competition readiness, movement, mentality, or balanced development.',
  },
  {
    num: 2,
    title: 'Pick a level',
    body: 'Start with one level — for example Orange 1 — instead of trying to customize the whole academy at once.',
  },
  {
    num: 3,
    title: 'Review goals and gates',
    body: 'See what players are expected to learn and what evidence shows they are ready to advance.',
  },
  {
    num: 4,
    title: 'Review drills, games, and situationals',
    body: 'See the teaching content that supports the level and how it connects to the gates.',
  },
  {
    num: 5,
    title: 'Preview downstream impact',
    body: 'Understand what coaches, players, and parents would see before anything is saved.',
  },
]

const LAYERS = [
  {
    label: 'Global curriculum',
    desc: 'Academy OS default development spine. Read-only. 15 levels, evidence-based gates, 152 drills, and coach language.',
    accent: 'border-border',
    labelColor: 'text-text-muted',
  },
  {
    label: 'Academy version',
    desc: "Your academy's approved customization. A layer on top of the global spine that does not affect other academies.",
    accent: 'border-lime/20',
    labelColor: 'text-lime',
  },
  {
    label: 'Session plan',
    desc: 'What coaches run on court. Generated from a class template linked to a curriculum level.',
    accent: 'border-status-blue/20',
    labelColor: 'text-status-blue',
  },
]

const GLOSSARY: Array<{ term: string; def: string }> = [
  {
    term: 'Curriculum level',
    def: 'A named stage of development — e.g. Orange 1. Each level has goals, exit gates, drills, and coach language.',
  },
  {
    term: 'Gate',
    def: 'An evidence-based requirement a player must meet before advancing. Evaluated by a coach, assessment score, or match data.',
  },
  {
    term: 'Domain',
    def: 'The category of tennis skill — Technical, Tactical, Movement, Competition, Mentality, or Fitness.',
  },
  {
    term: 'Drill',
    def: 'A structured practice activity with a defined setup, coaching cues, progressions, and success criteria.',
  },
  {
    term: 'Game',
    def: 'A modified match or competition format designed to reinforce a specific domain or tactical concept under pressure.',
  },
  {
    term: 'Situational',
    def: 'A decision-making exercise where players choose the right shot, pattern, or tactic under a defined constraint.',
  },
  {
    term: 'Match-play theme',
    def: 'A tactical focal point carried across a session — e.g. construction, transition, or pressure from the baseline.',
  },
  {
    term: 'Academy override',
    def: "Your academy's approved adjustment to the global curriculum. Stored as a draft, approved by the director, and never applied automatically.",
  },
]

export function CurriculumCustomizationAssistant() {
  const [glossaryOpen, setGlossaryOpen] = useState(false)

  return (
    <div className="space-y-4">

      {/* Section label + V1 badge */}
      <div className="flex items-center gap-3">
        <p className="label-xs">Curriculum Customization Guide</p>
        <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-border text-text-muted">
          Preview — V1
        </span>
      </div>

      {/* Three-layer distinction */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LAYERS.map(({ label, desc, accent, labelColor }) => (
          <div key={label} className={`rounded-xl border ${accent} bg-surface-raised px-4 py-3`}>
            <p className={`text-[10px] uppercase tracking-widest mb-1 font-medium ${labelColor}`}>{label}</p>
            <p className="text-[11px] text-text-secondary leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* 5-step process */}
      <div className="rounded-2xl border border-border bg-surface px-5 py-4">
        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-3">
          How Customization Works — 5 Steps
        </p>
        <ol className="space-y-3">
          {STEPS.map(({ num, title, body }) => (
            <li key={num} className="flex items-start gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full border border-border bg-surface-raised flex items-center justify-center text-[9px] font-mono text-lime mt-0.5">
                {num}
              </span>
              <div>
                <p className="text-[11px] font-semibold text-text-primary">{title}</p>
                <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[10px] text-text-muted italic">
            Preview only — curriculum override saving is not yet available.
          </p>
          <Link
            href="#curriculum-explorer"
            className="text-[11px] font-medium text-lime hover:opacity-80 transition-opacity shrink-0"
          >
            Start customization preview ↓
          </Link>
        </div>
      </div>

      {/* Glossary — collapsible */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <button
          onClick={() => setGlossaryOpen(o => !o)}
          className="w-full flex items-center justify-between gap-4 px-5 py-3 text-left hover:bg-surface-raised transition-colors"
          aria-expanded={glossaryOpen}
        >
          <p className="text-[11px] font-medium text-text-primary">Plain-language glossary</p>
          {glossaryOpen
            ? <ChevronUp className="w-4 h-4 text-text-muted shrink-0" />
            : <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />}
        </button>
        {glossaryOpen && (
          <div className="border-t border-border px-5 pt-3 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {GLOSSARY.map(({ term, def }) => (
                <div key={term}>
                  <p className="text-[10px] font-semibold text-lime">{term}</p>
                  <p className="text-[10px] text-text-muted leading-relaxed mt-0.5">{def}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
