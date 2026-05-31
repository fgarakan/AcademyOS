'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronUp, ChevronDown, Plus, Trash2, RefreshCw,
  Clock, MessageSquare, Check, Loader2, X, Activity, AlertCircle,
  ChevronsUpDown,
} from 'lucide-react'
import { Card, CardContent, EmptyState } from '@/components/ui'
import { VoiceTextInput } from '@/components/voice/VoiceTextInput'
import {
  addFitnessBlockAction,
  removeFitnessBlockAction,
  reorderFitnessBlocksAction,
  removeExerciseFromFitnessBlockAction,
  updateFitnessBlockNotesAction,
} from '@/app/director/fitness/fitnessTemplateActions'
import { FitnessExerciseSwitcher } from './FitnessExerciseSwitcher'
import { FitnessExercisePicker } from './FitnessExercisePicker'
import {
  FITNESS_BLOCK_TYPES,
  getFitnessBlockLabel,
  getFitnessBlockAccent,
  getFitnessBlockBorderAccent,
  getFitnessBlockIntent,
} from '@/lib/fitness/fitnessBlockTypes'
import type { FitnessBlockType } from '@/lib/fitness/fitnessBlockTypes'
import type { FitnessBlock, FitnessExercise, ExerciseLibraryItem } from './fitnessBuilderTypes'
import { CollapsibleBlockRow } from '@/components/builder'

interface FitnessTemplateBuilderClientProps {
  templateId: string
  initialBlocks: FitnessBlock[]
  exerciseLibrary: ExerciseLibraryItem[]
  exerciseLibraryCount?: number
  libraryQueryError?: string | null
  totalExercisesInAcademy?: number
  blockExercisesQueryError?: string | null
}

export function FitnessTemplateBuilderClient({
  templateId,
  initialBlocks,
  exerciseLibrary,
  exerciseLibraryCount,
  libraryQueryError,
  totalExercisesInAcademy = 0,
  blockExercisesQueryError,
}: FitnessTemplateBuilderClientProps) {
  const router = useRouter()
  const libraryCount = exerciseLibraryCount ?? exerciseLibrary.length
  const [blocks, setBlocks] = useState<FitnessBlock[]>(initialBlocks)

  // Collapse state — one block open at a time; auto-expand first block
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(
    initialBlocks[0]?.id ?? null
  )
  const [expandAll, setExpandAll] = useState(false)

  // Sync client state when server delivers new data after router.refresh()
  useEffect(() => {
    setBlocks(initialBlocks)
    // Keep expanded block open across refreshes; if it was removed, fall back to first
    setExpandedBlockId(prev => {
      if (prev && initialBlocks.some(b => b.id === prev)) return prev
      return initialBlocks[0]?.id ?? null
    })
  }, [initialBlocks])

  const [isPending, startTransition] = useTransition()
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [addingBlock, setAddingBlock] = useState(false)
  const [switcherTarget, setSwitcherTarget] = useState<{
    blockId: string
    tbeId: string
    fitnessBlockType: FitnessBlockType
  } | null>(null)
  const [pickerTarget, setPickerTarget] = useState<{
    blockId: string
    blockName: string
    fitnessBlockType: FitnessBlockType | null
  } | null>(null)
  const [observationBlockId, setObservationBlockId] = useState<string | null>(null)
  const [observationDraft, setObservationDraft] = useState('')

  function showStatus(type: 'ok' | 'error', text: string) {
    setStatusMsg({ type, text })
    setTimeout(() => setStatusMsg(null), 4000)
  }

  function toggleBlock(blockId: string) {
    if (expandAll) {
      // Exit expand-all mode; collapse all except the tapped block
      setExpandAll(false)
      setExpandedBlockId(blockId)
    } else {
      setExpandedBlockId(prev => prev === blockId ? null : blockId)
    }
  }

  function handleAddBlock(blockType: FitnessBlockType) {
    setAddingBlock(false)
    startTransition(async () => {
      const result = await addFitnessBlockAction(templateId, blockType, true)
      if (!result.ok) { showStatus('error', result.error ?? 'Failed to add block.'); return }
      router.refresh()
    })
  }

  function handleRemoveBlock(blockId: string) {
    if (!confirm('Remove this block and all its exercises?')) return
    startTransition(async () => {
      const result = await removeFitnessBlockAction(templateId, blockId)
      if (!result.ok) { showStatus('error', result.error ?? 'Failed to remove block.'); return }
      setBlocks(prev => prev.filter(b => b.id !== blockId))
      showStatus('ok', 'Block removed.')
    })
  }

  function handleMoveBlock(blockId: string, direction: 'up' | 'down') {
    const idx = blocks.findIndex(b => b.id === blockId)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= blocks.length) return

    const newBlocks = [...blocks]
    ;[newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]]
    setBlocks(newBlocks)

    startTransition(async () => {
      const payload = newBlocks.map((b, i) => ({ id: b.id, order_index: i }))
      const result = await reorderFitnessBlocksAction(templateId, payload)
      if (!result.ok) showStatus('error', result.error ?? 'Failed to reorder.')
    })
  }

  function handleRemoveExercise(blockId: string, tbeId: string) {
    startTransition(async () => {
      const result = await removeExerciseFromFitnessBlockAction(templateId, blockId, tbeId)
      if (!result.ok) { showStatus('error', result.error ?? 'Failed to remove exercise.'); return }
      setBlocks(prev => prev.map(b =>
        b.id === blockId
          ? { ...b, exercises: b.exercises.filter(ex => ex.id !== tbeId) }
          : b
      ))
    })
  }

  function openSwitcher(blockId: string, tbeId: string, fitnessBlockType: FitnessBlockType) {
    setSwitcherTarget({ blockId, tbeId, fitnessBlockType })
  }

  function handleSwitchComplete() {
    setSwitcherTarget(null)
    router.refresh()
  }

  function openPicker(blockId: string, blockName: string, fitnessBlockType: FitnessBlockType | null) {
    setPickerTarget({ blockId, blockName, fitnessBlockType })
  }

  function handlePickComplete() {
    setPickerTarget(null)
    router.refresh()
  }

  function openObservation(blockId: string, currentNotes: string | null) {
    setObservationBlockId(blockId)
    setObservationDraft(currentNotes ?? '')
  }

  function handleSaveObservation() {
    if (!observationBlockId) return
    const blockId = observationBlockId
    const draft = observationDraft
    startTransition(async () => {
      const result = await updateFitnessBlockNotesAction(templateId, blockId, draft)
      if (!result.ok) { showStatus('error', result.error ?? 'Failed to save observation.'); return }
      setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, notes: draft || null } : b))
      setObservationBlockId(null)
      setObservationDraft('')
      showStatus('ok', 'Observation saved.')
    })
  }

  return (
    <div className="space-y-4">

      {/* Status banner */}
      {statusMsg && (
        <div className={[
          'flex items-center justify-between px-4 py-3 rounded-xl border text-sm',
          statusMsg.type === 'ok'
            ? 'bg-status-green/5 border-status-green/20 text-status-green'
            : 'bg-status-red/5 border-status-red/20 text-status-red',
        ].join(' ')}>
          <span>{statusMsg.text}</span>
          <button type="button" onClick={() => setStatusMsg(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Exercise library diagnostic banner */}
      {(libraryCount === 0 || !!libraryQueryError) && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-status-orange/20 bg-status-orange/5 text-xs text-status-orange">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            {libraryQueryError
              ? `Exercise library query error: ${libraryQueryError}`
              : totalExercisesInAcademy > 0
                ? `${totalExercisesInAcademy} exercise${totalExercisesInAcademy !== 1 ? 's' : ''} found but none are active. Update exercise is_active status to enable auto-population.`
                : 'Exercise library is empty for this academy. Blocks will be created without exercises. Use the "Auto-Populate Exercises" button above once exercises are imported.'
            }
          </span>
        </div>
      )}

      {!!blockExercisesQueryError && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-status-orange/20 bg-status-orange/5 text-xs text-status-orange">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Block exercise data unavailable: {blockExercisesQueryError}. Contact your admin — a database policy may be missing.
          </span>
        </div>
      )}

      {/* Block list header with Expand All control */}
      {blocks.length >= 2 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] text-text-muted">
            {blocks.length} block{blocks.length !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={() => setExpandAll(v => !v)}
            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
          >
            <ChevronsUpDown className="w-3 h-3" />
            {expandAll ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      )}

      {/* Block list */}
      {blocks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<Activity className="w-5 h-5" />}
              title="No blocks yet"
              description="Add a fitness block to start building this template."
            />
          </CardContent>
        </Card>
      ) : (
        blocks.map((block, blockIdx) => {
          const isExpanded = expandAll || expandedBlockId === block.id
          return (
            <FitnessBlockCard
              key={block.id}
              block={block}
              blockIdx={blockIdx}
              totalBlocks={blocks.length}
              isPending={isPending}
              isExpanded={isExpanded}
              onToggle={() => toggleBlock(block.id)}
              onMoveBlock={handleMoveBlock}
              onRemoveBlock={handleRemoveBlock}
              onRemoveExercise={handleRemoveExercise}
              onOpenSwitcher={openSwitcher}
              onOpenPicker={openPicker}
              onOpenObservation={openObservation}
              templateId={templateId}
              exerciseLibrary={exerciseLibrary}
            />
          )
        })
      )}

      {/* Add Block */}
      {!addingBlock ? (
        <button
          onClick={() => setAddingBlock(true)}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border hover:border-lime/30 text-xs text-text-muted hover:text-text-secondary transition-colors disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Fitness Block
        </button>
      ) : (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="label-xs">Choose Block Type</p>
              <button type="button" onClick={() => setAddingBlock(false)} className="text-text-muted hover:text-text-secondary">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {FITNESS_BLOCK_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => handleAddBlock(type)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-surface-raised border border-border hover:border-lime/30 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {getFitnessBlockLabel(type)}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observation panel */}
      {observationBlockId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">Block Observation</p>
              <button type="button" onClick={() => setObservationBlockId(null)} className="text-text-muted hover:text-text-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <VoiceTextInput
              value={observationDraft}
              onChange={setObservationDraft}
              placeholder="e.g. This group struggled with lateral balance after speed work…"
              helperText="Observations are internal only. They do not modify templates automatically or send communications."
              minRows={3}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveObservation}
                disabled={isPending}
                className="btn-lime text-xs px-4 py-2 disabled:opacity-50"
              >
                <span className="flex items-center gap-1.5">
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Observation
                </span>
              </button>
              <button
                onClick={() => setObservationBlockId(null)}
                className="btn-ghost text-xs px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise switcher modal */}
      {switcherTarget && (
        <FitnessExerciseSwitcher
          templateId={templateId}
          blockId={switcherTarget.blockId}
          tbeId={switcherTarget.tbeId}
          fitnessBlockType={switcherTarget.fitnessBlockType}
          exerciseLibrary={exerciseLibrary}
          onClose={() => setSwitcherTarget(null)}
          onComplete={handleSwitchComplete}
        />
      )}

      {/* Exercise picker modal */}
      {pickerTarget && (
        <FitnessExercisePicker
          templateId={templateId}
          blockId={pickerTarget.blockId}
          blockName={pickerTarget.blockName}
          fitnessBlockType={pickerTarget.fitnessBlockType}
          exerciseLibrary={exerciseLibrary}
          onClose={() => setPickerTarget(null)}
          onComplete={handlePickComplete}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FitnessBlockCard
// ─────────────────────────────────────────────────────────────

function FitnessBlockCard({
  block,
  blockIdx,
  totalBlocks,
  isPending,
  isExpanded,
  onToggle,
  onMoveBlock,
  onRemoveBlock,
  onRemoveExercise,
  onOpenSwitcher,
  onOpenPicker,
  onOpenObservation,
  templateId: _templateId,
  exerciseLibrary,
}: {
  block: FitnessBlock
  blockIdx: number
  totalBlocks: number
  isPending: boolean
  isExpanded: boolean
  onToggle: () => void
  onMoveBlock: (blockId: string, dir: 'up' | 'down') => void
  onRemoveBlock: (blockId: string) => void
  onRemoveExercise: (blockId: string, tbeId: string) => void
  onOpenSwitcher: (blockId: string, tbeId: string, ft: FitnessBlockType) => void
  onOpenPicker: (blockId: string, blockName: string, ft: FitnessBlockType | null) => void
  onOpenObservation: (blockId: string, notes: string | null) => void
  templateId: string
  exerciseLibrary: ExerciseLibraryItem[]
}) {
  const fitnessType = block.fitnessBlockType
  const accentClass = fitnessType ? getFitnessBlockAccent(fitnessType) : 'text-lime'
  const borderClass = fitnessType ? getFitnessBlockBorderAccent(fitnessType) : 'border-border'
  const intentText = fitnessType ? getFitnessBlockIntent(fitnessType) : null
  const isComplete = block.exercises.length > 0

  // Short intent hint for collapsed row — first comma-separated phrase
  const shortIntent = intentText
    ? intentText.split(',')[0].trim()
    : null

  return (
    <CollapsibleBlockRow
      index={blockIdx}
      name={block.name}
      accentClass={accentClass}
      borderAccentClass={borderClass}
      durationMin={block.duration_min}
      itemCount={block.exercises.length}
      itemLabel="exercise"
      isComplete={isComplete}
      intentHint={shortIntent}
      isExpanded={isExpanded}
      onToggle={onToggle}
      quickActionLabel="Add"
      onQuickAction={() => onOpenPicker(block.id, block.name, block.fitnessBlockType)}
      quickActionDisabled={isPending || exerciseLibrary.length === 0}
    >
      {/* Expanded content */}
      <div className="px-4 py-3 space-y-3">
        {/* Secondary controls row: reorder + observe + delete */}
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onMoveBlock(block.id, 'up')}
              disabled={blockIdx === 0 || isPending}
              title="Move block up"
              className="p-1 rounded text-text-muted hover:text-lime disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => onMoveBlock(block.id, 'down')}
              disabled={blockIdx === totalBlocks - 1 || isPending}
              title="Move block down"
              className="p-1 rounded text-text-muted hover:text-lime disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            {block.duration_min != null && (
              <span className="flex items-center gap-1 text-xs text-text-muted ml-2">
                <Clock className="w-3.5 h-3.5" />
                {block.duration_min}min
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenObservation(block.id, block.notes)}
              disabled={isPending}
              title="Add observation"
              className={[
                'p-1.5 rounded-lg border text-xs transition-colors',
                block.notes
                  ? 'border-lime/20 text-lime bg-lime/5'
                  : 'border-border text-text-muted hover:border-lime/20 hover:text-lime',
              ].join(' ')}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onRemoveBlock(block.id)}
              disabled={isPending}
              title="Remove block"
              className="p-1.5 rounded-lg border border-border text-text-muted hover:border-status-red/30 hover:text-status-red transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Block observation note (if any) */}
        {block.notes && (
          <div className="px-3 py-2 rounded-lg bg-lime/5 border border-lime/10 text-[11px] text-text-secondary">
            <span className="text-lime text-[10px] uppercase tracking-widest font-semibold mr-2">Observation</span>
            {block.notes}
          </div>
        )}

        {/* Exercise list */}
        {block.exercises.length === 0 ? (
          <p className="text-xs text-text-muted italic py-1">
            No exercises in this block.
            {exerciseLibrary.length === 0
              ? ' Exercise library is empty — import exercises and use Auto-Populate above.'
              : ' Use Auto-Populate above or add exercises manually.'
            }
          </p>
        ) : (
          <div className="space-y-0">
            {block.exercises.map((ex, exIdx) => (
              <ExerciseRow
                key={ex.id}
                ex={ex}
                exIdx={exIdx}
                blockId={block.id}
                fitnessBlockType={block.fitnessBlockType}
                isPending={isPending}
                onRemove={onRemoveExercise}
                onSwitch={onOpenSwitcher}
              />
            ))}
          </div>
        )}

        {/* Add exercise button */}
        {exerciseLibrary.length > 0 && (
          <button
            onClick={() => onOpenPicker(block.id, block.name, block.fitnessBlockType)}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border hover:border-lime/30 text-[11px] text-text-muted hover:text-lime transition-colors disabled:opacity-50"
          >
            <Plus className="w-3 h-3" />
            Add Exercise
          </button>
        )}
      </div>
    </CollapsibleBlockRow>
  )
}

function ExerciseRow({
  ex,
  exIdx,
  blockId,
  fitnessBlockType,
  isPending,
  onRemove,
  onSwitch,
}: {
  ex: FitnessExercise
  exIdx: number
  blockId: string
  fitnessBlockType: FitnessBlockType | null
  isPending: boolean
  onRemove: (blockId: string, tbeId: string) => void
  onSwitch: (blockId: string, tbeId: string, ft: FitnessBlockType) => void
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-t border-border first:border-0">
      <span className="text-[10px] font-mono text-text-muted w-5 text-right shrink-0">{exIdx + 1}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">{ex.name}</p>
        <p className="text-[10px] text-text-muted mt-0.5">
          {ex.category}{ex.subcategory ? ` · ${ex.subcategory}` : ''}
        </p>
      </div>

      {ex.duration_min != null && (
        <span className="flex items-center gap-1 text-xs text-text-muted shrink-0">
          <Clock className="w-3 h-3" />
          {ex.duration_min}min
        </span>
      )}

      <div className="flex items-center gap-1 shrink-0">
        {fitnessBlockType && (
          <button
            onClick={() => onSwitch(blockId, ex.id, fitnessBlockType)}
            disabled={isPending}
            title="Switch exercise"
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-[10px] text-text-muted hover:border-lime/20 hover:text-lime transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-3 h-3" />
            Switch
          </button>
        )}
        <button
          onClick={() => onRemove(blockId, ex.id)}
          disabled={isPending}
          title="Remove exercise"
          className="p-1 rounded-lg border border-border text-text-muted hover:border-status-red/30 hover:text-status-red transition-colors disabled:opacity-50"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
