'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Sparkles, AlertTriangle, Settings } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import type { AIDraftResult } from '@/lib/ai/structureCoachNote'
import type { GenerateDraftResult } from '@/lib/actions/notes'
import type { PlayerDevelopmentSummary } from '@/lib/backend/notes'

interface Props {
  existingSummary: PlayerDevelopmentSummary | null
  onGenerate: (noteText: string) => Promise<GenerateDraftResult>
  onApply: (formData: FormData) => Promise<void>
  initialText?: string
}

const CONFIDENCE_STYLES: Record<AIDraftResult['confidence'], string> = {
  high:   'text-status-green bg-status-green/10 border-status-green/20',
  medium: 'text-status-orange bg-status-orange/10 border-status-orange/20',
  low:    'text-status-red bg-status-red/10 border-status-red/20',
}

function summaryHasContent(s: PlayerDevelopmentSummary | null): boolean {
  if (!s) return false
  return (
    s.current_strengths.length > 0 ||
    s.things_to_work_on.length > 0 ||
    !!s.development_focus ||
    !!s.coach_summary ||
    !!s.student_friendly_summary
  )
}

export function AIDraftPanel({ existingSummary, onGenerate, onApply, initialText }: Props) {
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    if (initialText) setNoteText(initialText)
  }, [initialText])
  const [isGenerating, startGenerate] = useTransition()
  const [isApplying, startApply] = useTransition()
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState(false)
  const [draft, setDraft] = useState<AIDraftResult | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const applyFormRef = useRef<HTMLFormElement>(null)

  const hasExistingContent = summaryHasContent(existingSummary)
  const needsConfirm = hasExistingContent && !confirmed

  function handleGenerate() {
    if (!noteText.trim()) return
    setGenerateError(null)
    setDraft(null)
    setConfirmed(false)
    setApplyError(null)
    setApplySuccess(false)
    startGenerate(async () => {
      const result = await onGenerate(noteText)
      if (result.ok) {
        setDraft(result.draft)
      } else {
        setGenerateError(result.error)
      }
    })
  }

  function handleApply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!draft) return
    setApplyError(null)
    setApplySuccess(false)
    const formData = new FormData(e.currentTarget)
    startApply(async () => {
      try {
        await onApply(formData)
        setApplySuccess(true)
        setDraft(null)
        setNoteText('')
        setConfirmed(false)
      } catch (err) {
        setApplyError(err instanceof Error ? err.message : 'Failed to apply draft.')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-lime" />
          <p className="label-xs">AI Draft</p>
          <span className="text-[10px] text-text-muted uppercase tracking-wide ml-auto">
            Coach review required
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">

        {/* Input */}
        <div>
          <label className="block text-[11px] text-text-muted mb-1.5">
            Note text
            <span className="ml-1 font-normal normal-case">
              (paste an observation, voice transcript, or type a note)
            </span>
          </label>
          <textarea
            rows={5}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Paste a coaching observation or voice transcript to structure into a development summary draft…"
            className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime resize-none"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !noteText.trim()}
          className="btn-lime w-full disabled:opacity-50"
        >
          {isGenerating ? 'Drafting…' : 'Draft with AI'}
        </button>

        {generateError && (
          generateError.toLowerCase().includes('not configured') || generateError.toLowerCase().includes('not available') ? (
            <div className="flex items-start gap-2 rounded border border-status-orange/30 bg-status-orange/5 px-3 py-2.5">
              <Settings className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
              <p className="text-xs text-status-orange leading-relaxed">{generateError}</p>
            </div>
          ) : (
            <p className="text-xs text-status-red">{generateError}</p>
          )
        )}

        {/* Draft preview + apply */}
        {draft && (
          <div className="space-y-4 pt-2 border-t border-border">

            {/* Confidence + warnings */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border font-mono ${CONFIDENCE_STYLES[draft.confidence]}`}>
                {draft.confidence} confidence
              </span>
            </div>

            {draft.warnings.length > 0 && (
              <div className="space-y-1">
                {draft.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-status-orange">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Overwrite warning */}
            {hasExistingContent && !confirmed && (
              <div className="rounded border border-status-orange/30 bg-status-orange/5 px-3 py-3 space-y-2">
                <p className="text-xs text-status-orange leading-relaxed">
                  This will replace the current development summary. Review carefully before applying.
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmed(true)}
                  className="text-xs text-status-orange underline underline-offset-2"
                >
                  I understand — show apply form
                </button>
              </div>
            )}

            {/* Editable draft form */}
            {(!hasExistingContent || confirmed) && (
              <form ref={applyFormRef} onSubmit={handleApply} className="space-y-4">

                {/* Hidden fields for visibility and source */}
                <input type="hidden" name="show_to_student" value="false" />
                <input type="hidden" name="show_to_parent" value="false" />
                <input type="hidden" name="source" value="ai_draft" />

                <div>
                  <label className="block text-[11px] text-text-muted mb-1.5">
                    Current Strengths
                    <span className="ml-1 font-normal normal-case">(one per line)</span>
                  </label>
                  <textarea
                    name="current_strengths"
                    rows={3}
                    defaultValue={draft.current_strengths.join('\n')}
                    className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-text-muted mb-1.5">
                    Things to Work On
                    <span className="ml-1 font-normal normal-case">(one per line)</span>
                  </label>
                  <textarea
                    name="things_to_work_on"
                    rows={3}
                    defaultValue={draft.things_to_work_on.join('\n')}
                    className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-text-muted mb-1.5">Development Focus</label>
                  <textarea
                    name="development_focus"
                    rows={2}
                    defaultValue={draft.development_focus}
                    className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-[11px] text-text-muted">Coach Summary</label>
                    <span className="text-[10px] text-status-orange uppercase tracking-wide">Internal</span>
                  </div>
                  <textarea
                    name="coach_summary"
                    rows={3}
                    defaultValue={draft.coach_summary}
                    className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-[11px] text-text-muted">Student-Friendly Summary</label>
                    <span className="text-[10px] text-text-muted uppercase tracking-wide">
                      Hidden until visibility is enabled
                    </span>
                  </div>
                  <textarea
                    name="student_friendly_summary"
                    rows={3}
                    defaultValue={draft.student_friendly_summary}
                    className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime resize-none"
                  />
                </div>

                {applyError && <p className="text-xs text-status-red">{applyError}</p>}

                <button
                  type="submit"
                  disabled={isApplying}
                  className="btn-lime w-full disabled:opacity-50"
                >
                  {isApplying ? 'Applying…' : 'Apply Draft to Summary'}
                </button>
              </form>
            )}

            {applySuccess && (
              <p className="text-xs text-status-green">Draft applied. Development summary updated.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
