'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Loader2, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import {
  updateFitnessTemplateMetaAction,
  duplicateFitnessTemplateAction,
} from '@/app/director/fitness/fitnessTemplateActions'

interface Props {
  templateId: string
  initialName: string
  initialDescription: string | null
  initialDurationMin: number | null
}

export function TemplateMetaEditorCard({
  templateId,
  initialName,
  initialDescription,
  initialDurationMin,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Save Template state
  const [saveOpen, setSaveOpen] = useState(false)
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription ?? '')
  const [durationMin, setDurationMin] = useState(
    initialDurationMin != null ? String(initialDurationMin) : ''
  )
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // Duplicate state
  const [dupOpen, setDupOpen] = useState(false)
  const [dupName, setDupName] = useState(`${initialName} (Copy)`)
  const [dupResult, setDupResult] = useState<{ ok: boolean; msg: string; newId?: string } | null>(null)

  function handleSave() {
    setSaveResult(null)
    startTransition(async () => {
      const dur = durationMin.trim() ? parseInt(durationMin, 10) : null
      const res = await updateFitnessTemplateMetaAction(templateId, {
        name,
        description: description || null,
        totalDurationMin: Number.isNaN(dur ?? NaN) ? null : dur,
      })
      setSaveResult({ ok: res.ok, msg: res.ok ? 'Template saved.' : (res.error ?? 'Save failed.') })
      if (res.ok) {
        setSaveOpen(false)
        router.refresh()
      }
    })
  }

  function handleDuplicate() {
    setDupResult(null)
    startTransition(async () => {
      const res = await duplicateFitnessTemplateAction(templateId, dupName)
      if (res.ok && res.newTemplateId) {
        setDupResult({ ok: true, msg: 'Template duplicated.', newId: res.newTemplateId })
      } else {
        setDupResult({ ok: false, msg: res.error ?? 'Duplicate failed.' })
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <p className="label-xs">Template Settings</p>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">

        {/* Save Template section */}
        <div>
          <button
            onClick={() => { setSaveOpen(v => !v); setSaveResult(null) }}
            className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            {saveOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Edit &amp; Save Template
          </button>

          {saveOpen && (
            <div className="mt-3 space-y-3 border-t border-border pt-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-text-muted block">
                  Name <span className="text-status-red">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={isPending}
                  className="w-full text-sm bg-surface border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-lime/40 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-text-muted block">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={isPending}
                  rows={2}
                  className="w-full text-sm bg-surface border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-lime/40 disabled:opacity-50 resize-none placeholder:text-text-muted"
                  placeholder="Optional description…"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-text-muted block">
                  Total Duration (min)
                </label>
                <input
                  type="number"
                  min={0}
                  max={480}
                  value={durationMin}
                  onChange={e => setDurationMin(e.target.value)}
                  disabled={isPending}
                  className="w-full text-sm bg-surface border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-lime/40 disabled:opacity-50"
                  placeholder="e.g. 90"
                />
              </div>

              {saveResult && (
                <div className={[
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
                  saveResult.ok
                    ? 'bg-status-green/5 border border-status-green/20 text-status-green'
                    : 'bg-status-red/5 border border-status-red/20 text-status-red',
                ].join(' ')}>
                  {saveResult.ok
                    ? <Check className="w-3.5 h-3.5 shrink-0" />
                    : <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  }
                  {saveResult.msg}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={isPending || !name.trim()}
                  className="btn-lime text-xs px-4 py-1.5 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Template
                </button>
                <button
                  onClick={() => setSaveOpen(false)}
                  disabled={isPending}
                  className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-3">
          <button
            onClick={() => { setDupOpen(v => !v); setDupResult(null); setDupName(`${initialName} (Copy)`) }}
            className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            {dupOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <Copy className="w-3.5 h-3.5" />
            Save As New Template
          </button>

          {dupOpen && (
            <div className="mt-3 space-y-3 border-t border-border pt-3">
              <p className="text-[10px] text-text-muted">
                Creates a new template with a full copy of this template&apos;s blocks and exercises. The source template is unchanged.
              </p>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-text-muted block">
                  New Template Name <span className="text-status-red">*</span>
                </label>
                <input
                  type="text"
                  value={dupName}
                  onChange={e => setDupName(e.target.value)}
                  disabled={isPending}
                  className="w-full text-sm bg-surface border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-lime/40 disabled:opacity-50"
                />
              </div>

              {dupResult && (
                <div className={[
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
                  dupResult.ok
                    ? 'bg-status-green/5 border border-status-green/20 text-status-green'
                    : 'bg-status-red/5 border border-status-red/20 text-status-red',
                ].join(' ')}>
                  {dupResult.ok
                    ? <Check className="w-3.5 h-3.5 shrink-0" />
                    : <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  }
                  <span>
                    {dupResult.msg}
                    {dupResult.ok && dupResult.newId && (
                      <a
                        href={`/director/fitness/templates/${dupResult.newId}`}
                        className="ml-2 underline underline-offset-2 text-lime"
                      >
                        Open new template →
                      </a>
                    )}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDuplicate}
                  disabled={isPending || !dupName.trim()}
                  className="btn-lime text-xs px-4 py-1.5 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                  Create Copy
                </button>
                <button
                  onClick={() => { setDupOpen(false); setDupResult(null) }}
                  disabled={isPending}
                  className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
