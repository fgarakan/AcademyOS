'use client'

import { useTransition } from 'react'
import { Zap } from 'lucide-react'

interface EvaluateAdvancementButtonProps {
  onEvaluate: () => Promise<boolean>
}

export function EvaluateAdvancementButton({ onEvaluate }: EvaluateAdvancementButtonProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => { void onEvaluate() })}
      disabled={isPending}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-border-strong text-sm font-medium transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Zap className="w-4 h-4 shrink-0" />
      {isPending ? 'Evaluating...' : 'Evaluate Advancement'}
    </button>
  )
}
