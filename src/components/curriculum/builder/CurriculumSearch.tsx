'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import Link from 'next/link'
import type { CurriculumExplorerData, CurriculumLevel } from '@/lib/backend/curriculumExplorer'

interface Props {
  data: CurriculumExplorerData
}

interface SearchResult {
  type: 'level' | 'drill' | 'gate'
  id: string
  label: string
  sublabel: string
  levelId?: string
}

export function CurriculumSearch({ data }: Props) {
  const [query, setQuery] = useState('')

  const q = query.toLowerCase().trim()

  const results: SearchResult[] = q.length < 2 ? [] : [
    ...data.levels
      .filter(l => l.display_name.toLowerCase().includes(q) || (l.stage ?? '').toLowerCase().includes(q))
      .map(l => ({ type: 'level' as const, id: l.id, label: l.display_name, sublabel: (l.stage ?? '').replace(/_/g, ' ') })),
    ...data.drills
      .filter(d => d.name.toLowerCase().includes(q) || (d.domain ?? '').toLowerCase().includes(q))
      .slice(0, 5)
      .map(d => ({ type: 'drill' as const, id: d.id, label: d.name, sublabel: `${d.domain ?? ''} · ${d.session_block ?? ''}`, levelId: d.level_min_id ?? undefined })),
    ...data.gates
      .filter(g => g.criterion.toLowerCase().includes(q) || g.domain.toLowerCase().includes(q))
      .slice(0, 5)
      .map(g => ({ type: 'gate' as const, id: g.id, label: g.criterion, sublabel: `Gate · ${g.domain}`, levelId: g.from_level_id })),
  ]

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
        <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search levels, drills, gates..."
          className="flex-1 bg-transparent text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-text-muted hover:text-text-secondary">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-surface shadow-lg z-50 overflow-hidden">
          {results.map(r => (
            <Link
              key={`${r.type}-${r.id}`}
              href={r.type === 'level' ? `/director/curriculum/level/${r.id}` : `/director/curriculum/level/${r.levelId}`}
              onClick={() => setQuery('')}
              className="flex items-start gap-3 px-4 py-2.5 hover:bg-surface-raised transition-colors border-b border-border last:border-0"
            >
              <span className={`text-[9px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 mt-0.5 ${
                r.type === 'level' ? 'bg-lime/10 text-lime' :
                r.type === 'drill' ? 'bg-status-blue/10 text-status-blue' :
                                     'bg-status-orange/10 text-status-orange'
              }`}>{r.type}</span>
              <div>
                <p className="text-[12px] text-text-primary">{r.label}</p>
                <p className="text-[10px] text-text-muted">{r.sublabel}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {q.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-surface px-4 py-3">
          <p className="text-[12px] text-text-muted">No results for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  )
}
