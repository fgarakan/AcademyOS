'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Send, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { VoiceTextInput } from '@/components/voice/VoiceTextInput'
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
          <p className="label-xs">Curriculum Customization</p>
        </div>
        <p className="text-[11px] text-text-muted mt-1">
          Speak or type. The OS creates a draft for review — nothing changes automatically.
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {!hasActiveVersion && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-status-orange/5 border border-status-orange/20 text-[11px] text-status-orange">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
            <span>
              Create an academy curriculum version first before submitting customizations.
            </span>
          </div>
        )}

        <p className="text-[11px] text-text-muted italic">
          Example: &ldquo;For our Orange 2 players, I want more return-of-serve readiness before Orange 3.&rdquo;
        </p>

        <VoiceTextInput
          value={inputText}
          onChange={setInputText}
          placeholder="Describe the curriculum change you want…"
          disabled={isPending || !hasActiveVersion}
          minRows={3}
          helperText="Speak or type. The OS creates a draft for review — nothing changes automatically."
        />

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
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-status-green">
                <CheckCircle className="w-3.5 h-3.5" />
                Draft created.
              </div>
              <Link
                href="/director/review"
                className="flex items-center gap-1 text-xs text-lime hover:opacity-80 transition-opacity font-medium"
              >
                Open Review Queue <ArrowRight className="w-3 h-3" />
              </Link>
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
            No AI is called.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
