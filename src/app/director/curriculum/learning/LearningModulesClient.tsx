'use client'

// Sprint 220 — Curriculum Learning Modules UI
// Director-facing read-only preview. No writes. No AI. No player/parent exposure.

import { useState, useMemo } from 'react'
import { BookOpen, ChevronDown, ChevronUp, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import type { CurriculumLearningModule, LearningModuleDomain } from '@/lib/curriculum/learningModules'

const DOMAIN_BADGE: Record<string, string> = {
  Technical:   'text-sky-400   border-sky-400/30   bg-sky-400/5',
  Tactical:    'text-indigo-400 border-indigo-400/30 bg-indigo-400/5',
  Movement:    'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  Competition: 'text-orange-400 border-orange-400/30 bg-orange-400/5',
  Mentality:   'text-purple-400 border-purple-400/30 bg-purple-400/5',
  Fitness:     'text-lime border-lime/30 bg-lime/5',
  Recovery:    'text-blue-400 border-blue-400/30 bg-blue-400/5',
  Lifestyle:   'text-pink-400 border-pink-400/30 bg-pink-400/5',
}

interface Props {
  modules: CurriculumLearningModule[]
  stages: string[]
  domains: LearningModuleDomain[]
  levelNames: string[]
}

function ModuleCard({ module }: { module: CurriculumLearningModule }) {
  const [expanded, setExpanded] = useState(false)
  const badgeClass = DOMAIN_BADGE[module.domain] ?? 'text-text-muted border-border bg-surface-raised'

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={expanded ? `Collapse ${module.title}` : `Expand ${module.title}`}
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start justify-between gap-3 px-4 py-3 hover:bg-surface transition-colors text-left"
      >
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-semibold shrink-0 ${badgeClass}`}>
              {module.domain}
            </span>
            <span className="text-[11px] text-text-muted font-mono shrink-0">
              {module.related_gate_ids.length}G · {module.related_drill_ids.length}D
            </span>
          </div>
          <p className="text-sm font-semibold text-text-primary leading-snug pr-2">{module.title}</p>
          <p className="text-[11px] text-text-muted leading-snug">{module.player_goal}</p>
        </div>
        <span className="text-text-muted mt-1 shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            <Field label="Why it matters" value={module.why_it_matters} />
            <Field label="Key idea" value={module.key_idea} />
            <Field label="Watch for" value={module.watch_for} />
            <Field label="Try this" value={module.try_this} />
          </div>

          <div className="p-3 rounded-lg border border-lime/20 bg-lime/3 space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-lime font-semibold">Mini challenge</p>
            <p className="text-xs text-text-secondary leading-relaxed">{module.mini_challenge}</p>
          </div>

          <div className="p-3 rounded-lg border border-border bg-surface space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Reflection question</p>
            <p className="text-xs text-text-secondary leading-relaxed italic">&ldquo;{module.reflection_question}&rdquo;</p>
          </div>

          <div className="p-3 rounded-lg border border-border bg-surface space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Parent support tip</p>
            <p className="text-xs text-text-secondary leading-relaxed">{module.parent_support_tip}</p>
          </div>

          {module.source_labels.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {module.source_labels.map(s => (
                <span key={s} className="px-1.5 py-0.5 rounded border border-border bg-surface text-[9px] text-text-muted">{s}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">{label}</p>
      <p className="text-xs text-text-secondary leading-relaxed">{value}</p>
    </div>
  )
}

export function LearningModulesClient({ modules, stages, domains, levelNames }: Props) {
  const [filterStage, setFilterStage] = useState<string>('all')
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [filterLevel, setFilterLevel] = useState<string>('all')

  const filtered = useMemo(() => {
    return modules.filter(m => {
      if (filterStage !== 'all' && m.level_stage !== filterStage) return false
      if (filterDomain !== 'all' && m.domain !== filterDomain) return false
      if (filterLevel !== 'all' && m.level_name !== filterLevel) return false
      return true
    })
  }, [modules, filterStage, filterDomain, filterLevel])

  // Group by level
  const grouped = useMemo(() => {
    const map = new Map<string, CurriculumLearningModule[]>()
    for (const m of filtered) {
      const existing = map.get(m.level_name) ?? []
      existing.push(m)
      map.set(m.level_name, existing)
    }
    return map
  }, [filtered])

  const SelectFilter = ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string
    value: string
    onChange: (v: string) => void
    options: { value: string; label: string }[]
  }) => (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-text-muted shrink-0">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-[11px] bg-surface-raised border border-border rounded-lg px-2 py-1 text-text-secondary focus:outline-none focus:border-lime/50"
      >
        <option value="all">All</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <SelectFilter
              label="Stage"
              value={filterStage}
              onChange={setFilterStage}
              options={stages.map(s => ({
                value: s,
                label: s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              }))}
            />
            <SelectFilter
              label="Domain"
              value={filterDomain}
              onChange={setFilterDomain}
              options={domains.map(d => ({ value: d, label: d }))}
            />
            <SelectFilter
              label="Level"
              value={filterLevel}
              onChange={setFilterLevel}
              options={levelNames.map(n => ({ value: n, label: n }))}
            />
            <span className="text-[10px] text-text-muted ml-auto">
              {filtered.length} module{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Modules grouped by level */}
      {grouped.size === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-6 h-6 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary">No modules match the selected filters.</p>
          </CardContent>
        </Card>
      ) : (
        Array.from(grouped.entries()).map(([levelName, levelModules]) => (
          <Card key={levelName}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <p className="label-xs">{levelName}</p>
                <span className="text-[10px] font-mono text-text-muted">
                  {levelModules.length} domain{levelModules.length !== 1 ? 's' : ''}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {levelModules.map(m => (
                <ModuleCard key={m.module_id} module={m} />
              ))}
            </CardContent>
          </Card>
        ))
      )}

      {/* Guardrail */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border bg-surface-raised text-[11px] text-text-muted">
        <Shield className="w-3.5 h-3.5 shrink-0 text-lime" />
        <span>
          Learning Module Preview — read-only. Generated from curriculum levels, gates, drills, and coach language.
          No personal player data. Not published to players or parents.
        </span>
      </div>

    </div>
  )
}
