'use client'

import { useState, useTransition } from 'react'
import {
  X,
  Clock,
  Plus,
  RotateCcw,
  Save,
  ChevronRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import type { TemplateDraft, TemplateDraftBlockCategory, TemplateDraftQuestion } from './templateDraftTypes'
import {
  computeMissingQuestions,
  allocateBlockDurations,
  applyAnswerToField,
  isDraftReadyForReview,
  generateBlockId,
} from './templateDraftParser'
import { saveAssistantTemplateDraftAction } from '@/app/director/class-templates/saveAssistantTemplateDraftAction'

// ─── Addable block catalogue ──────────────────────────────────────────────────

const ADDABLE_BLOCKS: Array<{ name: string; category: TemplateDraftBlockCategory }> = [
  { name: 'Standard Warm-Up', category: 'warm_up' },
  { name: 'Dynamic Warm-Up', category: 'dynamic_warm_up' },
  { name: 'Technical Skill Work', category: 'technical' },
  { name: 'Rally Skills', category: 'rally' },
  { name: 'Serve Work', category: 'technical' },
  { name: 'Point Play', category: 'point_play' },
  { name: 'Match Play', category: 'match_play' },
  { name: 'Fitness', category: 'fitness' },
  { name: 'Footwork', category: 'fitness' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface TemplateDraftPanelProps {
  draft: TemplateDraft
  onUpdateDraft: (draft: TemplateDraft) => void
  onCancel: () => void
  fromVoice?: boolean
  onQuestionAnswered?: (nextQuestion: TemplateDraftQuestion | null, updatedDraft: TemplateDraft) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TemplateDraftPanel({
  draft,
  onUpdateDraft,
  onCancel,
  fromVoice,
  onQuestionAnswered,
}: TemplateDraftPanelProps) {
  const [answerInput, setAnswerInput] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(draft.templateName)
  const [addBlockValue, setAddBlockValue] = useState('')
  const [showApproval, setShowApproval] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<{ templateId: string | null } | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const ready = isDraftReadyForReview(draft)
  const currentQuestion = draft.missingQuestions[0] ?? null
  const totalBlockDuration = draft.blocks.reduce(
    (sum, b) => sum + (b.durationMinutes ?? 0),
    0,
  )
  const durationMismatch =
    draft.durationMinutes !== null && totalBlockDuration !== draft.durationMinutes

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleAnswerSubmit() {
    if (!answerInput.trim() || !currentQuestion) return
    const updated = applyAnswerToField(draft, currentQuestion.field, answerInput.trim())
    onUpdateDraft(updated)
    setAnswerInput('')
    const nextQ = updated.missingQuestions[0] ?? null
    onQuestionAnswered?.(nextQ, updated)
  }

  function handleUpdateBlockDuration(blockId: string, value: string) {
    const mins = parseInt(value, 10)
    const newBlocks = draft.blocks.map(b =>
      b.id === blockId
        ? { ...b, durationMinutes: isNaN(mins) || mins < 1 ? null : mins }
        : b,
    )
    onUpdateDraft({ ...draft, blocks: newBlocks })
  }

  function handleRemoveBlock(blockId: string) {
    const newBlocks = draft.blocks
      .filter(b => b.id !== blockId)
      .map((b, i) => ({ ...b, order: i }))
    const missingQuestions = computeMissingQuestions({
      ...draft,
      blocks: newBlocks,
      missingQuestions: [],
    })
    onUpdateDraft({ ...draft, blocks: newBlocks, missingQuestions })
  }

  function handleAddBlock() {
    if (!addBlockValue) return
    const blockDef = ADDABLE_BLOCKS.find(b => b.name === addBlockValue)
    if (!blockDef) return
    const newBlock = {
      id: generateBlockId(),
      name: blockDef.name,
      category: blockDef.category,
      durationMinutes: null,
      order: draft.blocks.length,
    }
    const newBlocks = [...draft.blocks, newBlock]
    const missingQuestions = computeMissingQuestions({
      ...draft,
      blocks: newBlocks,
      missingQuestions: [],
    })
    onUpdateDraft({ ...draft, blocks: newBlocks, missingQuestions })
    setAddBlockValue('')
  }

  function handleRebalance() {
    if (!draft.durationMinutes) return
    const updated = allocateBlockDurations(draft, draft.durationMinutes)
    onUpdateDraft(updated)
  }

  function handleSaveNameEdit() {
    if (nameInput.trim()) {
      onUpdateDraft({ ...draft, templateName: nameInput.trim() })
    }
    setEditingName(false)
  }

  function handleSave() {
    setSaveError(null)
    startTransition(async () => {
      const result = await saveAssistantTemplateDraftAction({
        ...draft,
        status: 'ready_for_review',
      })
      if (result.ok) {
        setSaveSuccess({ templateId: result.templateId })
        onUpdateDraft({ ...draft, status: 'saved' })
      } else {
        setSaveError(result.error ?? 'Failed to save template.')
      }
    })
  }

  // ── Success state ────────────────────────────────────────────────────────────

  if (saveSuccess) {
    return (
      <div
        className="rounded-xl px-3.5 py-4 space-y-2.5"
        style={{ background: 'var(--bg-surface)', border: '1px solid rgba(48,209,88,0.3)' }}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#30D158' }} />
          <p className="text-sm font-semibold text-text-primary">Template saved.</p>
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed">
          {draft.templateName} has been created with {draft.blocks.length} block
          {draft.blocks.length !== 1 ? 's' : ''}.
        </p>
        <Link
          href={
            saveSuccess.templateId
              ? `/director/class-templates/${saveSuccess.templateId}`
              : '/director/class-templates'
          }
          className="inline-flex items-center gap-1 text-xs text-lime underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          Open template
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    )
  }

  // ── Draft panel ──────────────────────────────────────────────────────────────

  // Total guided questions = level + duration + blocks (3 fixed fields from computeMissingQuestions)
  const TOTAL_GUIDED_QUESTIONS = 3
  const answeredCount = Math.min(TOTAL_GUIDED_QUESTIONS - draft.missingQuestions.length, TOTAL_GUIDED_QUESTIONS)
  const remainingCount = draft.missingQuestions.length

  return (
    <div className="space-y-2.5">

      {/* Guided setup status */}
      <div
        className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
        style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)' }}
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted leading-none">
            Guided setup
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
            Create Class Template
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-text-muted whitespace-nowrap">
            {answeredCount} of {TOTAL_GUIDED_QUESTIONS}
          </span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
            style={
              remainingCount === 0
                ? { background: 'rgba(48,209,88,0.1)', color: '#30D158', border: '1px solid rgba(48,209,88,0.25)' }
                : { background: 'rgba(255,149,0,0.08)', color: '#FF9500', border: '1px solid rgba(255,149,0,0.22)' }
            }
          >
            {remainingCount === 0 ? 'Ready' : `${remainingCount} left`}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted">
            Template Draft
          </p>
          <span
            className="inline-block mt-0.5 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border"
            style={{
              borderColor: 'rgba(255,149,0,0.4)',
              color: '#FF9500',
              background: 'rgba(255,149,0,0.06)',
            }}
          >
            Draft only — not saved
          </span>
        </div>
        <button
          onClick={onCancel}
          aria-label="Cancel draft"
          className="w-6 h-6 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-all shrink-0 mt-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Voice capture notice */}
      {fromVoice && (
        <div
          className="rounded-lg px-3 py-2"
          style={{
            background: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.15)',
          }}
        >
          <p className="text-[11px] text-text-secondary leading-snug">
            I captured a template request. Review the draft below before anything is saved.
          </p>
        </div>
      )}

      {/* Current missing question — only the first one */}
      {currentQuestion && (
        <div
          className="rounded-xl px-3.5 py-3 space-y-2.5"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          <div>
            <p
              className="text-[10px] uppercase tracking-widest font-semibold mb-1"
              style={{ color: '#8b5cf6' }}
            >
              Missing info
            </p>
            <p className="text-[12px] text-text-primary font-medium leading-snug">
              {currentQuestion.question}
            </p>
            <p className="text-[10px] text-text-muted mt-1 leading-snug">
              Answer by voice or type below. I&apos;ll ask one question at a time.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={answerInput}
              onChange={e => setAnswerInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnswerSubmit()}
              placeholder={
                currentQuestion.field === 'durationMinutes'
                  ? 'e.g. 90 minutes'
                  : currentQuestion.field === 'level'
                  ? 'e.g. Orange 2'
                  : 'Type your answer…'
              }
              className="flex-1 rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            />
            <button
              onClick={handleAnswerSubmit}
              disabled={!answerInput.trim()}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-40"
              style={{
                background: 'rgba(139,92,246,0.15)',
                color: '#8b5cf6',
                border: '1px solid rgba(139,92,246,0.25)',
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Draft preview */}
      <div
        className="rounded-xl px-3.5 py-3 space-y-3"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {/* Template name */}
        <div>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveNameEdit()}
                className="flex-1 rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(139,92,246,0.3)',
                }}
                autoFocus
              />
              <button
                onClick={handleSaveNameEdit}
                className="text-[10px] font-semibold text-lime shrink-0"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingName(false)
                  setNameInput(draft.templateName)
                }}
                className="text-[10px] text-text-muted shrink-0"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <p className="text-sm font-semibold text-text-primary leading-snug flex-1 min-w-0">
                {draft.templateName}
              </p>
              <button
                onClick={() => {
                  setEditingName(true)
                  setNameInput(draft.templateName)
                }}
                className="text-[10px] text-text-muted underline underline-offset-2 hover:text-text-secondary transition-colors shrink-0 mt-0.5"
              >
                Edit name
              </button>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 text-[11px]">
          {draft.level && (
            <span className="text-text-muted">
              Level:{' '}
              <span className="text-text-secondary font-medium">{draft.level}</span>
            </span>
          )}
          {draft.durationMinutes && (
            <span className="flex items-center gap-1 text-text-muted">
              <Clock className="w-3 h-3 shrink-0" />
              <span className="text-text-secondary font-medium">
                {draft.durationMinutes} min
              </span>
            </span>
          )}
          <span className="text-text-muted">
            Blocks:{' '}
            <span className="text-text-secondary font-medium">{draft.blocks.length}</span>
          </span>
        </div>

        {/* Block list */}
        {draft.blocks.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
              Blocks
            </p>
            {draft.blocks.map((block, idx) => (
              <div key={block.id} className="flex items-center gap-1.5">
                <span className="text-[10px] text-text-muted w-4 text-right shrink-0">
                  {idx + 1}.
                </span>
                <span className="text-[11px] text-text-secondary flex-1 leading-snug min-w-0 truncate">
                  {block.name}
                </span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={block.durationMinutes ?? ''}
                  onChange={e => handleUpdateBlockDuration(block.id, e.target.value)}
                  placeholder="—"
                  className="w-11 rounded px-1 py-0.5 text-[11px] text-center text-text-primary focus:outline-none shrink-0"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                />
                <span className="text-[9px] text-text-muted shrink-0">min</span>
                <button
                  onClick={() => handleRemoveBlock(block.id)}
                  aria-label={`Remove ${block.name}`}
                  className="w-5 h-5 flex items-center justify-center rounded text-text-muted hover:text-status-red transition-colors shrink-0"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}

            {/* Duration total row */}
            {draft.durationMinutes && (
              <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-border">
                <span className="text-[10px] text-text-muted">Total</span>
                <span
                  className={`text-[11px] font-mono font-bold ${
                    durationMismatch ? 'text-status-orange' : 'text-lime'
                  }`}
                >
                  {totalBlockDuration}
                </span>
                <span className="text-[10px] text-text-muted">
                  / {draft.durationMinutes} min
                </span>
                {durationMismatch && (
                  <button
                    onClick={handleRebalance}
                    className="ml-auto flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Rebalance
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add block row */}
        <div className="flex items-center gap-2 pt-0.5">
          <select
            value={addBlockValue}
            onChange={e => setAddBlockValue(e.target.value)}
            className="flex-1 rounded-lg px-2 py-1 text-[11px] text-text-secondary focus:outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <option value="">Add a block…</option>
            {ADDABLE_BLOCKS.map(b => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddBlock}
            disabled={!addBlockValue}
            aria-label="Add block"
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all disabled:opacity-40"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <Plus className="w-3 h-3 text-text-muted" />
          </button>
        </div>
      </div>

      {/* Review to save — shown only when draft is complete and approval not yet requested */}
      {ready && !showApproval && (
        <button
          onClick={() => setShowApproval(true)}
          className="w-full text-left px-3.5 py-2.5 rounded-xl text-[12px] font-semibold text-text-secondary hover:text-text-primary transition-all flex items-center gap-2"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
          Review to save
        </button>
      )}

      {/* Approval summary — only shown after director clicks "Review to save" */}
      {ready && showApproval && !saveSuccess && (
        <div
          className="rounded-xl px-3.5 py-3 space-y-3"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(200,255,0,0.2)',
          }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-lime mb-1.5">
              Ready to review
            </p>
            <p className="text-[12px] text-text-secondary leading-relaxed">
              You&apos;re about to save a class template for{' '}
              <span className="text-text-primary font-medium">{draft.level}</span> with{' '}
              <span className="text-text-primary font-medium">
                {draft.blocks.length} block{draft.blocks.length !== 1 ? 's' : ''}
              </span>{' '}
              and{' '}
              <span className="text-text-primary font-medium">
                {draft.durationMinutes} minutes
              </span>{' '}
              total.
            </p>
          </div>

          {saveError && (
            <p className="text-[11px] text-status-red">{saveError}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="btn-lime text-xs px-3 py-1.5 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              Save Template
            </button>
            <button
              onClick={() => setShowApproval(false)}
              className="btn-ghost text-xs px-3 py-1.5"
            >
              Keep Editing
            </button>
            <button
              onClick={onCancel}
              className="text-[11px] text-text-muted hover:text-status-red transition-colors"
            >
              Cancel Draft
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
