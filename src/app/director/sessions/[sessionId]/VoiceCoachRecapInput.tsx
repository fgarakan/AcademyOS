'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Save } from 'lucide-react'
import { VoiceTextInput } from '@/components/voice/VoiceTextInput'
import { saveSessionVoiceNoteAction } from './saveSessionVoiceNoteAction'

interface Props {
  sessionId: string
}

export function VoiceCoachRecapInput({ sessionId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [text, setText] = useState('')
  const [result, setResult] = useState<{ ok: boolean; error: string | null } | null>(null)

  function handleSubmit() {
    if (!text.trim()) return
    setResult(null)
    startTransition(async () => {
      const res = await saveSessionVoiceNoteAction(sessionId, text)
      setResult({ ok: res.ok, error: res.error })
      if (res.ok) {
        setText('')
        router.refresh()
      }
    })
  }

  if (result?.ok) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/30 text-xs text-status-green">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Recap saved. Use the &ldquo;Structure Recap&rdquo; button below to create a structured draft for review.</span>
        </div>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
        >
          Add another recap
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-text-muted italic">
        Demo prompt: &ldquo;Everyone was here except Sarah. Mia improved recovery after wide balls. Leo still needs better contact spacing.&rdquo;
      </p>

      <VoiceTextInput
        value={text}
        onChange={setText}
        placeholder="Speak or type your session recap…"
        disabled={isPending}
        minRows={3}
        helperText="Voice creates text. You approve actions — nothing changes automatically."
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !text.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-lime text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-3.5 h-3.5" />
          {isPending ? 'Saving…' : 'Save Recap'}
        </button>

        <p className="text-[11px] text-text-muted">
          Saves to recap history — you can then structure it into a draft.
        </p>
      </div>

      {result?.error && (
        <p className="text-xs text-status-red">{result.error}</p>
      )}
    </div>
  )
}
