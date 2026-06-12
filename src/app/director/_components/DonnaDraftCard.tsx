'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronRight, X, Zap } from 'lucide-react'
import type { DonnaActionDraft } from '@/lib/donna/actions/donnaActionContract'
import { saveDonnaActionMemoryAction } from '@/lib/actions/saveDonnaActionMemoryAction'

interface Props {
  draft: DonnaActionDraft
}

export function DonnaDraftCard({ draft }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [saving,    setSaving]    = useState(false)

  if (dismissed) return null

  async function handleDismiss() {
    setSaving(true)
    await saveDonnaActionMemoryAction({ draft, status: 'dismissed' })
    setDismissed(true)
    setSaving(false)
  }

  return (
    <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 flex items-start gap-3">
      <Zap className="w-3.5 h-3.5 text-lime mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-[12px] font-semibold text-text-primary leading-snug">
          {draft.label}
        </p>
        <p className="text-[11px] text-text-muted leading-snug">
          {draft.description}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={draft.actionTarget.route}
          onClick={() => saveDonnaActionMemoryAction({ draft, status: 'in_progress', outcome: 'Director navigated to action route' })}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-lime hover:underline"
        >
          {draft.approvalRequired ? 'Review' : 'Open'}
          <ChevronRight className="w-3 h-3" />
        </Link>
        <button
          onClick={handleDismiss}
          disabled={saving}
          className="text-text-muted hover:text-text-secondary transition-colors"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

interface DonnaDraftListProps {
  drafts: DonnaActionDraft[]
  label?: string
}

export function DonnaDraftList({ drafts, label }: DonnaDraftListProps) {
  if (drafts.length === 0) return null
  return (
    <div className="space-y-2">
      {label && <p className="label-xs">{label}</p>}
      {drafts.map(d => (
        <DonnaDraftCard key={d.id} draft={d} />
      ))}
    </div>
  )
}
