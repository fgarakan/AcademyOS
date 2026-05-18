'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, Target, Shield, BookOpen, Activity, Layers } from 'lucide-react'
import Link from 'next/link'
import type { CurriculumExplorerData } from '@/lib/backend/curriculumExplorer'

interface Props {
  data: CurriculumExplorerData
}

type ResultType = 'level' | 'drill' | 'gate' | 'fitness' | 'language'

interface SearchResult {
  type: ResultType
  id: string
  label: string
  sublabel: string
  href: string
}

const TYPE_CONFIG: Record<ResultType, { label: string; Icon: typeof Search; chip: string; chipText: string }> = {
  level:    { label: 'Level',    Icon: Layers,   chip: 'bg-lime/10',               chipText: 'text-lime' },
  drill:    { label: 'Drill',    Icon: Target,   chip: 'bg-status-blue/10',        chipText: 'text-status-blue' },
  gate:     { label: 'Gate',     Icon: Shield,   chip: 'bg-status-orange/10',      chipText: 'text-status-orange' },
  fitness:  { label: 'Fitness',  Icon: Activity, chip: 'bg-violet-400/10',         chipText: 'text-violet-400' },
  language: { label: 'Cue',     Icon: BookOpen,  chip: 'bg-status-green/10',       chipText: 'text-status-green' },
}

const MAX_PER_TYPE = 4

function highlight(text: string, q: string): string {
  if (!q) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return text
  return `${text.slice(0, idx)}<mark>${text.slice(idx, idx + q.length)}</mark>${text.slice(idx + q.length)}`
}

export function CurriculumSearch({ data }: Props) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const q = query.toLowerCase().trim()

  const results: SearchResult[] = q.length < 2 ? [] : [
    ...data.levels
      .filter(l => l.display_name.toLowerCase().includes(q) || (l.stage ?? '').toLowerCase().includes(q))
      .slice(0, MAX_PER_TYPE)
      .map(l => ({
        type: 'level' as const,
        id: l.id,
        label: l.display_name,
        sublabel: (l.stage ?? '').replace(/_/g, ' '),
        href: `/director/curriculum/level/${l.id}`,
      })),
    ...data.drills
      .filter(d => d.name.toLowerCase().includes(q) || (d.domain ?? '').toLowerCase().includes(q) || (d.objective ?? '').toLowerCase().includes(q))
      .slice(0, MAX_PER_TYPE)
      .map(d => ({
        type: 'drill' as const,
        id: d.id,
        label: d.name,
        sublabel: `${d.domain ?? ''} · ${d.session_block ?? ''}`,
        href: d.level_min_id ? `/director/curriculum/level/${d.level_min_id}` : '/director/curriculum/map',
      })),
    ...data.gates
      .filter(g => g.criterion.toLowerCase().includes(q) || g.domain.toLowerCase().includes(q))
      .slice(0, MAX_PER_TYPE)
      .map(g => ({
        type: 'gate' as const,
        id: g.id,
        label: g.criterion,
        sublabel: `${g.domain} · ${g.gate_type}`,
        href: `/director/curriculum/level/${g.from_level_id}`,
      })),
    ...data.fitnessGuidance
      .filter(f => f.fitness_phase.toLowerCase().includes(q) || (f.primary_energy_system ?? '').toLowerCase().includes(q))
      .slice(0, MAX_PER_TYPE)
      .map(f => ({
        type: 'fitness' as const,
        id: f.id,
        label: f.fitness_phase,
        sublabel: f.primary_energy_system ?? 'Fitness guidance',
        href: `/director/curriculum/level/${f.level_id}`,
      })),
    ...data.coachLanguage
      .filter(cl => cl.doing_well.toLowerCase().includes(q) || cl.working_on.toLowerCase().includes(q) || cl.current_focus.toLowerCase().includes(q))
      .slice(0, MAX_PER_TYPE)
      .map(cl => ({
        type: 'language' as const,
        id: cl.id,
        label: cl.current_focus || cl.doing_well,
        sublabel: `Coach cue · ${cl.domain}`,
        href: `/director/curriculum/level/${cl.level_id}`,
      })),
  ]

  const open = focused && (results.length > 0 || q.length >= 2)

  // Click outside closes dropdown
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Escape')    { setFocused(false); setActiveIdx(-1) }
    if (e.key === 'Enter' && activeIdx >= 0) {
      const r = results[activeIdx]
      if (r) { window.location.href = r.href; setQuery(''); setFocused(false) }
    }
  }, [open, results, activeIdx])

  function clear() { setQuery(''); setFocused(false); setActiveIdx(-1); inputRef.current?.focus() }

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className={`flex items-center gap-2 rounded-xl border transition-colors px-3 py-2.5 ${
        focused ? 'border-lime/40 bg-surface' : 'border-border bg-surface'
      }`}>
        <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(-1) }}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search levels, drills, gates, fitness, coach cues…"
          className="flex-1 bg-transparent text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        {query && (
          <button onClick={clear} className="text-text-muted hover:text-text-secondary transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-border bg-surface shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            <>
              {results.map((r, idx) => {
                const cfg = TYPE_CONFIG[r.type]
                const isActive = idx === activeIdx
                return (
                  <Link
                    key={`${r.type}-${r.id}`}
                    href={r.href}
                    onClick={() => { setQuery(''); setFocused(false) }}
                    className={`flex items-start gap-3 px-4 py-2.5 border-b border-border last:border-0 transition-colors ${
                      isActive ? 'bg-surface-raised' : 'hover:bg-surface-raised'
                    }`}
                    onMouseEnter={() => setActiveIdx(idx)}
                  >
                    <span className={`text-[9px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 mt-0.5 shrink-0 ${cfg.chip} ${cfg.chipText}`}>
                      {cfg.label}
                    </span>
                    <div className="min-w-0">
                      <p
                        className="text-[12px] text-text-primary [&_mark]:bg-lime/20 [&_mark]:text-lime [&_mark]:rounded"
                        dangerouslySetInnerHTML={{ __html: highlight(r.label, q) }}
                      />
                      <p className="text-[10px] text-text-muted truncate">{r.sublabel}</p>
                    </div>
                  </Link>
                )
              })}
              <div className="px-4 py-2 border-t border-border">
                <p className="text-[10px] text-text-muted">{results.length} result{results.length !== 1 ? 's' : ''} · ↑↓ to navigate · Enter to go</p>
              </div>
            </>
          ) : (
            <div className="px-4 py-3">
              <p className="text-[12px] text-text-muted">No results for &quot;{query}&quot;</p>
              <p className="text-[10px] text-text-muted mt-0.5">Try level name, drill name, domain, or coaching cue</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
