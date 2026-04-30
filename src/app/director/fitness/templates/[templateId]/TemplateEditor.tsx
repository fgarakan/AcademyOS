'use client'

import { useState, useTransition } from 'react'
import {
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Clock,
  Pencil,
  Check,
  X,
  Loader2,
  Dumbbell,
} from 'lucide-react'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import { saveTemplateEditsAction } from './actions'
import type { BlockUpdate, ExerciseUpdate } from './actions'

export interface EditableExercise {
  id: string         // template_block_exercises.id
  exercise_id: string
  name: string
  category: string
  subcategory: string | null
  duration_min: number | null
  order_index: number
  notes: string | null
}

export interface EditableBlock {
  id: string
  name: string
  type: string
  duration_min: number
  order_index: number
  exercises: EditableExercise[]
}

const BLOCK_TYPE_LABELS: Record<string, string> = {
  warm_up:     'Warm Up',
  technical:   'Technical',
  tactical:    'Tactical',
  movement:    'Movement',
  fitness:     'Fitness',
  competition: 'Competition',
  mental:      'Mental',
  cool_down:   'Cool Down',
  free:        'Free',
}

function deepCopyBlocks(source: EditableBlock[]): EditableBlock[] {
  return source.map(b => ({ ...b, exercises: b.exercises.map(ex => ({ ...ex })) }))
}

interface TemplateEditorProps {
  templateId: string
  initialBlocks: EditableBlock[]
}

export function TemplateEditor({ templateId, initialBlocks }: TemplateEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [confirmedBlocks, setConfirmedBlocks] = useState<EditableBlock[]>(initialBlocks)
  const [editBlocks, setEditBlocks] = useState<EditableBlock[]>(initialBlocks)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function startEdit() {
    setEditBlocks(deepCopyBlocks(confirmedBlocks))
    setSaveError(null)
    setIsEditing(true)
  }

  function cancelEdit() {
    setEditBlocks(deepCopyBlocks(confirmedBlocks))
    setSaveError(null)
    setIsEditing(false)
  }

  function moveBlock(index: number, direction: 'up' | 'down') {
    const next = deepCopyBlocks(editBlocks)
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= next.length) return
    ;[next[index], next[swapIdx]] = [next[swapIdx], next[index]]
    setEditBlocks(next)
  }

  function moveExercise(blockIdx: number, exIdx: number, direction: 'up' | 'down') {
    const next = deepCopyBlocks(editBlocks)
    const exs = next[blockIdx].exercises
    const swapIdx = direction === 'up' ? exIdx - 1 : exIdx + 1
    if (swapIdx < 0 || swapIdx >= exs.length) return
    ;[exs[exIdx], exs[swapIdx]] = [exs[swapIdx], exs[exIdx]]
    setEditBlocks(next)
  }

  function updateBlockDuration(blockIdx: number, value: string) {
    const parsed = parseInt(value, 10)
    if (isNaN(parsed) || parsed < 0) return
    setEditBlocks(prev =>
      prev.map((b, i) => i === blockIdx ? { ...b, duration_min: parsed } : b)
    )
  }

  function updateExerciseDuration(blockIdx: number, exIdx: number, value: string) {
    const trimmed = value.trim()
    const parsed = trimmed === '' ? null : parseInt(trimmed, 10)
    if (parsed !== null && (isNaN(parsed) || parsed < 0)) return
    setEditBlocks(prev =>
      prev.map((b, bi) => {
        if (bi !== blockIdx) return b
        return {
          ...b,
          exercises: b.exercises.map((ex, ei) =>
            ei === exIdx ? { ...ex, duration_min: parsed } : ex
          ),
        }
      })
    )
  }

  function saveEdits() {
    setSaveError(null)

    // Build save payloads — array position becomes the new order_index (0-based)
    const blockPayload: BlockUpdate[] = editBlocks.map((b, i) => ({
      id: b.id,
      duration_min: b.duration_min,
      order_index: i,
    }))
    const exercisePayload: ExerciseUpdate[] = editBlocks.flatMap((b, _bi) =>
      b.exercises.map((ex, i) => ({
        id: ex.id,
        block_id: b.id,
        duration_min: ex.duration_min,
        order_index: i,
      }))
    )

    startTransition(async () => {
      const result = await saveTemplateEditsAction(templateId, blockPayload, exercisePayload)
      if (result.error) {
        setSaveError(result.error)
        return
      }
      // Stamp confirmed order_index values to match what was just written
      const confirmed = editBlocks.map((b, i) => ({
        ...b,
        order_index: i,
        exercises: b.exercises.map((ex, j) => ({ ...ex, order_index: j })),
      }))
      setConfirmedBlocks(confirmed)
      setIsEditing(false)
    })
  }

  const displayBlocks = isEditing ? editBlocks : confirmedBlocks

  return (
    <div className="space-y-4">

      {/* Mode controls */}
      {!isEditing ? (
        <div className="flex justify-end">
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised border border-border text-xs text-text-secondary hover:text-text-primary hover:border-lime/30 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Template
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-raised border border-lime/20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-lime">Edit Mode</span>
            <span className="text-[10px] text-text-muted">
              Use ↑↓ controls to reorder blocks and exercises
            </span>
            {saveError && (
              <span className="text-xs text-status-red">{saveError}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cancelEdit}
              disabled={isPending}
              className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-50"
            >
              <span className="flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" />
                Cancel
              </span>
            </button>
            <button
              onClick={saveEdits}
              disabled={isPending}
              className="btn-lime text-xs px-3 py-1.5 disabled:opacity-50"
            >
              <span className="flex items-center gap-1.5">
                {isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Check className="w-3.5 h-3.5" />
                }
                Save Changes
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Block list */}
      {displayBlocks.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Dumbbell className="w-5 h-5" />}
            title="No blocks found"
            description="This template has no blocks yet."
          />
        </Card>
      ) : (
        displayBlocks.map((block, blockIdx) => (
          <EditableBlockCard
            key={block.id}
            block={block}
            blockIdx={blockIdx}
            totalBlocks={displayBlocks.length}
            isEditing={isEditing}
            onMoveBlock={moveBlock}
            onMoveExercise={moveExercise}
            onUpdateBlockDuration={updateBlockDuration}
            onUpdateExerciseDuration={updateExerciseDuration}
          />
        ))
      )}
    </div>
  )
}

function EditableBlockCard({
  block,
  blockIdx,
  totalBlocks,
  isEditing,
  onMoveBlock,
  onMoveExercise,
  onUpdateBlockDuration,
  onUpdateExerciseDuration,
}: {
  block: EditableBlock
  blockIdx: number
  totalBlocks: number
  isEditing: boolean
  onMoveBlock: (i: number, dir: 'up' | 'down') => void
  onMoveExercise: (bi: number, ei: number, dir: 'up' | 'down') => void
  onUpdateBlockDuration: (bi: number, value: string) => void
  onUpdateExerciseDuration: (bi: number, ei: number, value: string) => void
}) {
  const typeLabel = BLOCK_TYPE_LABELS[block.type] ?? block.type

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">

            {/* Block reorder controls (edit) or position number (read-only) */}
            {isEditing ? (
              <div className="flex flex-col gap-0 shrink-0">
                <button
                  onClick={() => onMoveBlock(blockIdx, 'up')}
                  disabled={blockIdx === 0}
                  className="p-0.5 rounded text-text-muted hover:text-lime disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Move block up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onMoveBlock(blockIdx, 'down')}
                  disabled={blockIdx === totalBlocks - 1}
                  className="p-0.5 rounded text-text-muted hover:text-lime disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Move block down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span className="text-[10px] font-mono text-text-muted w-5 text-right shrink-0">
                {blockIdx + 1}
              </span>
            )}

            <div className="min-w-0">
              <p className="font-semibold text-text-primary">{block.name}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{typeLabel}</p>
            </div>
          </div>

          {/* Block duration */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-text-muted" />
            {isEditing ? (
              <>
                <input
                  type="number"
                  min="0"
                  value={block.duration_min}
                  onChange={e => onUpdateBlockDuration(blockIdx, e.target.value)}
                  className="w-14 text-xs text-right bg-surface border border-border rounded px-1.5 py-0.5 text-text-primary focus:outline-none focus:border-lime/40"
                  title="Block duration in minutes"
                />
                <span className="text-xs text-text-muted">min</span>
              </>
            ) : (
              <span className="text-xs text-text-muted">{block.duration_min} min</span>
            )}
          </div>
        </div>
      </CardHeader>

      {block.exercises.length === 0 ? (
        <CardContent className="pt-0">
          <p className="text-xs text-text-muted italic">No exercises in this block.</p>
        </CardContent>
      ) : (
        <CardContent className="pt-0">
          <div className="space-y-0">
            {block.exercises.map((ex, exIdx) => (
              <EditableExerciseRow
                key={ex.id}
                ex={ex}
                exIdx={exIdx}
                totalExercises={block.exercises.length}
                blockIdx={blockIdx}
                isEditing={isEditing}
                onMoveExercise={onMoveExercise}
                onUpdateDuration={onUpdateExerciseDuration}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function EditableExerciseRow({
  ex,
  exIdx,
  totalExercises,
  blockIdx,
  isEditing,
  onMoveExercise,
  onUpdateDuration,
}: {
  ex: EditableExercise
  exIdx: number
  totalExercises: number
  blockIdx: number
  isEditing: boolean
  onMoveExercise: (bi: number, ei: number, dir: 'up' | 'down') => void
  onUpdateDuration: (bi: number, ei: number, value: string) => void
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-t border-border first:border-0">

      {/* Exercise reorder controls (edit) or position indicator (read-only) */}
      {isEditing ? (
        <div className="flex flex-col gap-0 shrink-0">
          <button
            onClick={() => onMoveExercise(blockIdx, exIdx, 'up')}
            disabled={exIdx === 0}
            className="p-0.5 rounded text-text-muted hover:text-lime disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Move exercise up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveExercise(blockIdx, exIdx, 'down')}
            disabled={exIdx === totalExercises - 1}
            className="p-0.5 rounded text-text-muted hover:text-lime disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Move exercise down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <span className="text-[10px] font-mono text-text-muted w-5 text-right shrink-0">
            {exIdx + 1}
          </span>
          <ChevronRight className="w-3 h-3 text-border shrink-0" />
        </>
      )}

      {/* Exercise name + category */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">{ex.name}</p>
        <p className="text-[10px] text-text-muted mt-0.5">
          {ex.category}
          {ex.subcategory ? ` · ${ex.subcategory}` : ''}
        </p>
      </div>

      {/* Exercise duration */}
      <div className="flex items-center gap-1 shrink-0">
        {isEditing ? (
          <>
            <Clock className="w-3 h-3 text-text-muted" />
            <input
              type="number"
              min="0"
              value={ex.duration_min ?? ''}
              placeholder="—"
              onChange={e => onUpdateDuration(blockIdx, exIdx, e.target.value)}
              className="w-12 text-xs text-right bg-surface border border-border rounded px-1.5 py-0.5 text-text-primary focus:outline-none focus:border-lime/40 placeholder:text-text-muted"
              title="Exercise duration in minutes"
            />
            <span className="text-xs text-text-muted">min</span>
          </>
        ) : (
          ex.duration_min != null && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Clock className="w-3 h-3" />
              {ex.duration_min}min
            </span>
          )
        )}
      </div>

      {/* Notes (read-only only — not editable in V1) */}
      {!isEditing && ex.notes && (
        <p className="text-[10px] text-text-muted shrink-0 max-w-[160px] truncate">{ex.notes}</p>
      )}
    </div>
  )
}
