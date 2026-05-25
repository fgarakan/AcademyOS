'use client'

import { useState } from 'react'
import { Sparkles, Send, ChevronRight } from 'lucide-react'
import Link from 'next/link'

// Types

export type CurriculumDonnaPanelMode =
  | 'map'
  | 'level'
  | 'impact'
  | 'add_drill'
  | 'add_fitness'
  | 'guided_review'

export interface CurriculumDonnaPanelAction {
  label: string
  href?: string
}

export interface CurriculumDonnaPanelHealthItem {
  label: string
  count: number
  color: string
}

export interface CurriculumDonnaPanelProps {
  mode: CurriculumDonnaPanelMode
  levelName?: string
  promptTitle?: string
  promptBody?: string
  actions?: CurriculumDonnaPanelAction[]
  healthItems?: CurriculumDonnaPanelHealthItem[]
  activeAction?: string
  inputPlaceholder?: string
  onAction?: (label: string) => void
}

// Default content per mode

const MAP_DEFAULTS = {
  promptTitle: 'Where would you like to start today?',
  promptBody: 'I can guide you level by level, or jump straight to what needs attention.',
  actions: [
    { label: 'Start from Red Ball 1', href: '/director/curriculum/guided' },
    { label: 'Jump to Orange Ball 2', href: '/director/curriculum/map' },
    { label: 'Review only incomplete levels', href: '/director/curriculum/guided' },
    { label: 'Help me customize this curriculum', href: '/director/curriculum/builder' },
  ] as CurriculumDonnaPanelAction[],
}

const LEVEL_DEFAULTS = {
  promptTitle: 'What would you like to change?',
  promptBody: 'Nothing is applied until you approve.',
  actions: [
    { label: 'Add a skill' },
    { label: 'Add a drill' },
    { label: 'Add an assessment gate' },
    { label: 'Add a fitness exercise' },
    { label: 'Add a player mission' },
    { label: 'Rewrite this level' },
    { label: 'Skip to another level' },
  ] as CurriculumDonnaPanelAction[],
}

const GUIDED_DEFAULTS = {
  promptTitle: 'What would you like to do?',
  promptBody: 'You can keep it, modify it, or skip to the next level. Nothing changes until you approve.',
  actions: [
    { label: 'Keep as-is & continue' },
    { label: 'Modify this level' },
    { label: 'Skip this level' },
    { label: 'Ask DONNA to improve it' },
  ] as CurriculumDonnaPanelAction[],
}

const IMPACT_DEFAULTS = {
  promptTitle: "Here's everything this change will touch.",
  promptBody: 'Review carefully before applying.',
  actions: [
    { label: 'Apply to this level only' },
    { label: 'Apply to all Orange Ball 2 groups' },
    { label: 'Apply academy-wide' },
    { label: 'Save as draft' },
  ] as CurriculumDonnaPanelAction[],
}

const ADD_DRILL_DEFAULTS = {
  promptTitle: "Tell me what drill you need and I'll create a draft for your review.",
  promptBody: 'Be specific about the skill, movement, or situation you want to target.',
  actions: [
    { label: 'Forehand recovery drill' },
    { label: 'Backhand approach drill' },
    { label: 'Serve + 1 pattern drill' },
    { label: 'Net approach drill' },
  ] as CurriculumDonnaPanelAction[],
}

const ADD_FITNESS_DEFAULTS = {
  promptTitle: "Describe the fitness need and I'll design an exercise that connects to your curriculum.",
  promptBody: "I'll link it to the right skill needs and levels automatically.",
  actions: [
    { label: 'Low contact mobility exercise' },
    { label: 'Lateral speed & agility' },
    { label: 'Core stability for serve' },
    { label: 'Explosive first-step drill' },
  ] as CurriculumDonnaPanelAction[],
}

function getModeDefaults(mode: CurriculumDonnaPanelMode) {
  switch (mode) {
    case 'map':           return MAP_DEFAULTS
    case 'level':         return LEVEL_DEFAULTS
    case 'guided_review': return GUIDED_DEFAULTS
    case 'impact':        return IMPACT_DEFAULTS
    case 'add_drill':     return ADD_DRILL_DEFAULTS
    case 'add_fitness':   return ADD_FITNESS_DEFAULTS
  }
}

// Component

export function CurriculumDonnaPanel({
  mode,
  levelName,
  promptTitle,
  promptBody,
  actions,
  healthItems,
  activeAction,
  inputPlaceholder,
  onAction,
}: CurriculumDonnaPanelProps) {
  const [inputValue, setInputValue] = useState('')

  const defaults = getModeDefaults(mode)

  const resolvedTitle = promptTitle ?? (
    levelName && (mode === 'level' || mode === 'guided_review')
      ? `You're ${mode === 'level' ? 'editing' : 'reviewing'} ${levelName}. ${defaults.promptTitle}`
      : defaults.promptTitle
  )
  const resolvedBody        = promptBody        ?? defaults.promptBody
  const resolvedActions     = actions           ?? defaults.actions
  const resolvedPlaceholder = inputPlaceholder  ?? 'Ask DONNA anything…'

  function handleActionClick(action: CurriculumDonnaPanelAction) {
    onAction?.(action.label)
  }

  function handleSend() {
    if (!inputValue.trim()) return
    setInputValue('')
  }

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: '#060f0d',
        border: '1px solid rgba(200,255,0,0.16)',
        borderTop: '2px solid rgba(200,255,0,0.55)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 border-b"
        style={{ borderColor: 'rgba(200,255,0,0.10)' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold"
          style={{
            background: 'rgba(200,255,0,0.10)',
            border: '1px solid rgba(200,255,0,0.28)',
            color: '#C8FF00',
          }}
        >
          D
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-text-primary leading-none">
              DONNA
            </p>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
              style={{
                background: 'rgba(200,255,0,0.12)',
                border: '1px solid rgba(200,255,0,0.22)',
                color: '#C8FF00',
              }}
            >
              Active
            </span>
          </div>
          <p className="text-[10px] text-text-muted mt-0.5 leading-none">
            AI Curriculum Assistant
          </p>
        </div>
        <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: '#C8FF00' }} />
      </div>

      {/* Prompt card */}
      <div className="px-4 pt-4 pb-3">
        <div
          className="rounded-xl px-3.5 py-3 space-y-1.5"
          style={{
            background: 'rgba(200,255,0,0.05)',
            border: '1px solid rgba(200,255,0,0.12)',
          }}
        >
          <p className="text-[12px] font-semibold text-text-primary leading-snug">
            {resolvedTitle}
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: '#8a9ba8' }}>
            {resolvedBody}
          </p>
        </div>
      </div>

      {/* Action chips */}
      <div className="px-4 pb-3 space-y-1.5">
        {resolvedActions.map((action) => {
          const isActive = activeAction === action.label
          const chipStyle: React.CSSProperties = {
            background: isActive ? 'rgba(200,255,0,0.10)' : 'rgba(200,255,0,0.03)',
            border: `1px solid ${isActive ? 'rgba(200,255,0,0.30)' : 'rgba(200,255,0,0.08)'}`,
            color: isActive ? '#C8FF00' : '#9aa5b1',
          }
          const inner = (
            <>
              <ChevronRight
                className="w-3 h-3 shrink-0 mt-px"
                style={{ color: isActive ? '#C8FF00' : '#4a5568' }}
              />
              <span className="text-[11px] leading-snug flex-1">{action.label}</span>
            </>
          )

          if (action.href) {
            return (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-start gap-2 w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:opacity-80"
                style={chipStyle}
              >
                {inner}
              </Link>
            )
          }

          return (
            <button
              key={action.label}
              onClick={() => handleActionClick(action)}
              className="flex items-start gap-2 w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:opacity-80"
              style={chipStyle}
            >
              {inner}
            </button>
          )
        })}
      </div>

      {/* Health / status section */}
      {healthItems && healthItems.length > 0 && (
        <div
          className="mx-4 mb-3 rounded-xl overflow-hidden"
          style={{ border: '1px solid rgba(200,255,0,0.08)' }}
        >
          <div
            className="px-3 py-2 border-b"
            style={{ borderColor: 'rgba(200,255,0,0.08)' }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(200,255,0,0.55)' }}
            >
              Curriculum Health
            </p>
          </div>
          {healthItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
              style={{ borderColor: 'rgba(200,255,0,0.06)' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: item.color }}
                />
                <span className="text-[11px]" style={{ color: '#7a8a96' }}>
                  {item.label}
                </span>
              </div>
              <span
                className="text-[12px] font-mono font-semibold"
                style={{ color: item.color }}
              >
                {item.count}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom input */}
      <div
        className="px-4 py-3 mt-auto border-t"
        style={{ borderColor: 'rgba(200,255,0,0.10)' }}
      >
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{
            background: 'rgba(200,255,0,0.04)',
            border: '1px solid rgba(200,255,0,0.12)',
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
            placeholder={resolvedPlaceholder}
            className="flex-1 bg-transparent text-[11px] text-text-primary placeholder:text-text-muted outline-none min-w-0"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="shrink-0 transition-opacity disabled:opacity-30 hover:opacity-70"
            aria-label="Send"
          >
            <Send className="w-3.5 h-3.5" style={{ color: '#C8FF00' }} />
          </button>
        </div>
        <p
          className="text-[10px] text-center mt-1.5"
          style={{ color: 'rgba(200,255,0,0.30)' }}
        >
          Drafts only · nothing applies without your approval
        </p>
      </div>
    </div>
  )
}
