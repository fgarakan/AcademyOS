'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, Send, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { createCurriculumOverrideDraftAction } from '@/lib/actions/curriculumOverrideDraft'

interface Props {
  hasActiveVersion: boolean
}

export function VoiceOverrideInputPanel({ hasActiveVersion }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<{ ok: boolean; error: string | null } | null>(null)

  function handleSubmit() {
    if (!inputText.trim()) return
    startTransition(async () => {
      const res = await createCurriculumOverrideDraftAction(inputText)
      setResult({ ok: res.ok, error: res.error })
      if (res.ok) {
        setInputText('')
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-lime" />
          <p className="label-xs">Voice Curriculum Customization</p>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Tell the OS what you want to change in your academy curriculum. The OS will parse your
          intent and create a draft for your review. Nothing changes until you approve.
        </p>

        {!hasActiveVersion && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-status-orange/5 border border-status-orange/20 text-[11px] text-status-orange">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
            <span>
              Create an academy curriculum version first before submitting customizations.
            </span>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-[11px] text-text-muted italic">
            Example: &ldquo;For our Orange 2 kids, I want more return-of-serve work before they move to Orange 3.&rdquo;
          </p>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={isPending || !hasActiveVersion}
            rows={3}
            maxLength={2000}
            placeholder="Describe the curriculum change you want…"
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 disabled:opacity-50"
          />
          {inputText.length > 1600 && (
            <p className="text-[10px] text-text-muted text-right">{inputText.length}/2000</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={isPending || !inputText.trim() || !hasActiveVersion}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium btn-lime disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            {isPending ? 'Creating draft…' : 'Create Override Draft'}
          </button>

          {result?.ok && (
            <div className="flex items-center gap-1.5 text-xs text-status-green">
              <CheckCircle className="w-3.5 h-3.5" />
              Draft created — check Review Queue.
            </div>
          )}
        </div>

        {result?.error && (
          <p className="text-xs text-status-red">{result.error}</p>
        )}

        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
          <span>
            Draft only. Nothing is applied until you review and approve in the Review Queue.
            Voice parsing is deterministic — no AI is called.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
