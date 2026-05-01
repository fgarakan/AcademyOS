'use client'

import { useState, useTransition, useMemo } from 'react'
import { Search, Loader2, Check, X, RefreshCw } from 'lucide-react'
import { swapExerciseInFitnessBlockAction } from '@/app/director/fitness/fitnessTemplateActions'
import { matchExerciseToFitnessBlock } from '@/lib/fitness/fitnessExerciseMatching'
import { getFitnessBlockLabel } from '@/lib/fitness/fitnessBlockTypes'
import type { FitnessBlockType } from '@/lib/fitness/fitnessBlockTypes'
import type { ExerciseLibraryItem } from './fitnessBuilderTypes'

interface FitnessExerciseSwitcherProps {
  templateId: string
  blockId: string
  tbeId: string
  fitnessBlockType: FitnessBlockType
  exerciseLibrary: ExerciseLibraryItem[]
  onClose: () => void
  onComplete: () => void
}

export function FitnessExerciseSwitcher({
  templateId,
  blockId,
  tbeId,
  fitnessBlockType,
  exerciseLibrary,
  onClose,
  onComplete,
}: FitnessExerciseSwitcherProps) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const blockLabel = getFitnessBlockLabel(fitnessBlockType)

  // Sort: best matches first, then alphabetically
  const sortedExercises = useMemo(() => {
    const matches = exerciseLibrary.filter(ex =>
      matchExerciseToFitnessBlock({ ...ex, tags: ex.tags ?? null }, fitnessBlockType)
    )
    const others = exerciseLibrary.filter(ex =>
      !matchExerciseToFitnessBlock({ ...ex, tags: ex.tags ?? null }, fitnessBlockType)
    )
    return [...matches, ...others]
  }, [exerciseLibrary, fitnessBlockType])

  const filtered = useMemo(() => {
    if (!query.trim()) return sortedExercises
    const q = query.toLowerCase()
    return sortedExercises.filter(ex =>
      ex.name.toLowerCase().includes(q) ||
      ex.category.toLowerCase().includes(q) ||
      (ex.subcategory ?? '').toLowerCase().includes(q)
    )
  }, [sortedExercises, query])

  function handleConfirm() {
    if (!selectedId) return
    setError(null)
    startTransition(async () => {
      const result = await swapExerciseInFitnessBlockAction(templateId, blockId, tbeId, selectedId)
      if (!result.ok) { setError(result.error ?? 'Failed to swap exercise.'); return }
      onComplete()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div>
            <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-lime" />
              Switch Exercise
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">
              Showing {blockLabel} matches first
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search exercises…"
              className="input-base w-full pl-8 text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filtered.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-6">No exercises found.</p>
          ) : (
            filtered.map(ex => {
              const isMatch = matchExerciseToFitnessBlock({ ...ex, tags: ex.tags ?? null }, fitnessBlockType)
              const isSelected = selectedId === ex.id
              return (
                <button
                  key={ex.id}
                  onClick={() => setSelectedId(ex.id)}
                  className={[
                    'w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors',
                    isSelected
                      ? 'bg-lime/10 border-lime/30'
                      : 'border-transparent hover:bg-surface-raised hover:border-border',
                  ].join(' ')}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{ex.name}</p>
                    <p className="text-[10px] text-text-muted">
                      {ex.category}{ex.subcategory ? ` · ${ex.subcategory}` : ''}
                      {ex.duration_min ? ` · ${ex.duration_min}min` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isMatch && (
                      <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-lime/20 text-lime/70">
                        Match
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-lime" />}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border shrink-0 space-y-2">
          {error && <p className="text-xs text-status-red">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={handleConfirm}
              disabled={!selectedId || isPending}
              className="btn-lime text-xs px-4 py-2 disabled:opacity-50"
            >
              <span className="flex items-center gap-1.5">
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Confirm Switch
              </span>
            </button>
            <button onClick={onClose} className="btn-ghost text-xs px-4 py-2">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
