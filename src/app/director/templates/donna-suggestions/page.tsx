'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Sparkles, AlertCircle, LayoutTemplate, Dumbbell, Users, BookOpen, Zap, X, Plus, ChevronDown } from 'lucide-react'
import { TemplateDonnaPanel } from '@/components/templates/TemplateDonnaPanel'
import { DEMO_DONNA_SUGGESTIONS } from '@/lib/templates/templateMockData'
import type { MockDonnaSuggestion } from '@/lib/templates/templateMockData'

// demo-only — not saved — not applied — local-only
// Create Draft and Dismiss are local-only state changes

const USEFULNESS_COLOR: Record<string, string> = {
  High: 'text-status-green border-status-green/30 bg-status-green/8',
  Medium: 'text-status-orange border-status-orange/30 bg-status-orange/8',
  Low: 'text-text-muted border-border bg-surface-raised',
}

function SuggestionCard({
  suggestion,
  onDismiss,
  onDraft,
  isDrafted,
  isDismissed,
}: {
  suggestion: MockDonnaSuggestion
  onDismiss: (id: string) => void
  onDraft: (id: string) => void
  isDrafted: boolean
  isDismissed: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const isClass = suggestion.type === 'class'
  const Icon = isClass ? LayoutTemplate : Dumbbell
  const accentCls = isClass ? 'text-lime border-lime/20 bg-lime/8' : 'text-status-purple border-status-purple/20 bg-status-purple/8'
  const usefulnessCls = USEFULNESS_COLOR[suggestion.estimatedUsefulness] ?? ''

  if (isDismissed) return null

  return (
    <div className={[
      'rounded-2xl border bg-surface p-5 space-y-4 transition-all duration-200',
      isDrafted ? 'border-status-green/25 bg-status-green/4' : 'border-border',
    ].join(' ')}>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${accentCls}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${accentCls}`}>
              {isClass ? 'Class Template' : 'Fitness Template'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-text-muted/20 text-text-muted">
              {suggestion.level}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${usefulnessCls}`}>
              {suggestion.estimatedUsefulness} usefulness
            </span>
            {isDrafted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-status-green/30 bg-status-green/8 text-status-green">
                Draft created
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-text-primary">{suggestion.title}</h3>
        </div>
        <button
          onClick={() => onDismiss(suggestion.id)}
          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-status-red hover:border-status-red/30 transition-all duration-100 shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Why suggested */}
      <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl border border-border bg-surface-raised">
        <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Why DONNA suggests this</p>
          <p className="text-xs text-text-secondary leading-relaxed">{suggestion.reason}</p>
        </div>
      </div>

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 text-[11px] text-text-muted hover:text-text-secondary transition-colors duration-100"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`} />
        {expanded ? 'Show less' : 'Show details'}
      </button>

      {expanded && (
        <div className="space-y-4 pt-1">
          {/* Curriculum connection */}
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl border border-lime/15 bg-lime/4">
            <BookOpen className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-lime mb-1">Curriculum Connection</p>
              <p className="text-xs text-text-primary font-medium">{suggestion.curriculumConnection}</p>
            </div>
          </div>

          {/* Players / groups */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-border bg-surface-raised">
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="w-3.5 h-3.5 text-text-muted" />
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Players Affected</p>
              </div>
              <p className="text-xl font-mono font-bold text-text-primary">{suggestion.playersAffected}</p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-surface-raised">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-text-muted" />
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Groups</p>
              </div>
              <div className="space-y-1">
                {suggestion.groupsAffected.map(g => (
                  <p key={g} className="text-xs text-text-secondary">{g}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Suggested goal */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Suggested Goal</p>
            <p className="text-xs text-text-secondary leading-relaxed">{suggestion.suggestedGoal}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      {!isDrafted ? (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onDraft(suggestion.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-100 ${
              isClass
                ? 'border-lime/25 bg-lime/8 text-lime hover:bg-lime/15'
                : 'border-status-purple/25 bg-status-purple/8 text-status-purple hover:bg-status-purple/15'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Draft
          </button>
          <button
            onClick={() => onDismiss(suggestion.id)}
            className="btn-ghost inline-flex items-center gap-2 text-xs"
          >
            Dismiss
          </button>
          <span className="ml-auto text-[10px] text-text-muted">demo-only — no data saved</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-status-green/20 bg-status-green/5 text-[11px] text-status-green">
          <Sparkles className="w-3 h-3" />
          Draft marked locally — no data has been saved. Backend wiring coming in a future sprint.
        </div>
      )}
    </div>
  )
}

export default function DonnaSuggestionsPage() {
  const [drafted, setDrafted] = useState<Set<string>>(new Set())
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  function handleDraft(id: string) {
    setDrafted(prev => { const s = new Set(prev); s.add(id); return s })
  }

  function handleDismiss(id: string) {
    setDismissed(prev => { const s = new Set(prev); s.add(id); return s })
  }

  const visible = DEMO_DONNA_SUGGESTIONS.filter(s => !dismissed.has(s.id))
  const highUsefulness = DEMO_DONNA_SUGGESTIONS.filter(s => s.estimatedUsefulness === 'High')

  return (
    <div className="flex gap-4 lg:gap-6 p-4 lg:p-6 min-h-screen items-start">

      <div className="flex-1 min-w-0 space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] text-text-muted select-none">
          <Link href="/director" className="hover:text-text-secondary transition-colors duration-100">AcademyOS</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <Link href="/director/templates" className="hover:text-text-secondary transition-colors duration-100">Templates</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <span className="text-text-secondary font-medium">DONNA Suggestions</span>
        </nav>

        {/* Header */}
        <div>
          <p className="page-eyebrow">Templates</p>
          <h1 className="page-title">DONNA Suggestions</h1>
          <p className="page-subtitle">Templates your academy could benefit from, based on your curriculum and player mix.</p>
        </div>

        {/* DONNA intro card */}
        <div
          className="relative overflow-hidden rounded-2xl border border-lime/20 p-5"
          style={{ background: 'linear-gradient(135deg, rgba(200,255,0,0.07) 0%, transparent 60%)' }}
        >
          <div className="relative flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime/15 border border-lime/25 flex items-center justify-center shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-lime" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-text-primary">DONNA</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-lime/10 text-lime border border-lime/20">
                  AI Template Assistant
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                I found <span className="font-semibold text-text-primary">{DEMO_DONNA_SUGGESTIONS.length} templates</span> your academy could benefit from.
                {' '}<span className="text-lime font-medium">{highUsefulness.length} are high priority</span> based on curriculum gaps and active player groups.
              </p>
            </div>
          </div>
        </div>

        {/* Demo notice */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-status-orange/20 bg-status-orange/5 text-[11px] text-status-orange">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Demo suggestions — rule-based recommendations. Backend wiring and real signal data coming in a future sprint.</span>
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap gap-5 px-4 py-3 rounded-xl bg-surface-raised border border-border">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Total Suggestions</p>
            <p className="text-sm font-mono font-bold text-lime">{DEMO_DONNA_SUGGESTIONS.length}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">High Priority</p>
            <p className="text-sm font-mono font-bold text-status-green">{highUsefulness.length}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Drafted</p>
            <p className="text-sm font-mono font-bold text-status-green">{drafted.size}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Dismissed</p>
            <p className="text-sm font-mono font-bold text-text-muted">{dismissed.size}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Remaining</p>
            <p className="text-sm font-mono font-bold text-text-secondary">{visible.length}</p>
          </div>
        </div>

        {/* Suggestions */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <Sparkles className="w-10 h-10 text-lime/30" />
            <div>
              <p className="text-sm font-semibold text-text-primary mb-1">All suggestions reviewed</p>
              <p className="text-xs text-text-muted">You have drafted or dismissed all current suggestions. DONNA will generate new ones when new signals are detected.</p>
            </div>
            <Link href="/director/templates" className="btn-lime inline-flex items-center gap-2 text-sm">
              Back to Templates
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {DEMO_DONNA_SUGGESTIONS.map(suggestion => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onDismiss={handleDismiss}
                onDraft={handleDraft}
                isDrafted={drafted.has(suggestion.id)}
                isDismissed={dismissed.has(suggestion.id)}
              />
            ))}
          </div>
        )}

      </div>

      <TemplateDonnaPanel mode="suggestions" />
    </div>
  )
}
