'use client'

import { useState, useTransition } from 'react'
import { Download, Loader2, CheckCircle2 } from 'lucide-react'
import { seedBallLevelTemplatesAction } from '../_actions/seedBallLevelTemplatesAction'

export function SeedBallLevelTemplatesButton() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ seeded: string[]; skipped: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSeed() {
    setError(null)
    startTransition(async () => {
      const res = await seedBallLevelTemplatesAction()
      if (!res.ok) {
        setError(res.error ?? 'Unknown error.')
        return
      }
      setResult({ seeded: res.seeded, skipped: res.skipped })
    })
  }

  if (result) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-status-green">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        {result.seeded.length > 0
          ? `Seeded: ${result.seeded.join(', ')}`
          : 'All templates already exist'}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleSeed}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-surface-raised border border-border text-text-secondary hover:border-lime/40 hover:text-text-primary transition-colors disabled:opacity-50"
      >
        {isPending
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Seeding…</>
          : <><Download className="w-3.5 h-3.5" /> Seed Ball-Level Templates</>
        }
      </button>
      {error && <p className="text-[10px] text-status-red">{error}</p>}
    </div>
  )
}
