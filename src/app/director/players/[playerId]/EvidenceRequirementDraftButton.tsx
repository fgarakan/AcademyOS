'use client'

import { useTransition, useState } from 'react'
import { Link2, CheckCircle, AlertCircle } from 'lucide-react'
import type { EvidenceRequirementDraftResult } from './evidenceRequirementDraftAction'

interface Props {
  onCreateDrafts: () => Promise<EvidenceRequirementDraftResult>
}

export function EvidenceRequirementDraftButton({ onCreateDrafts }: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<EvidenceRequirementDraftResult | null>(null)

  function handleClick() {
    setResult(null)
    startTransition(async () => {
      const res = await onCreateDrafts()
      setResult(res)
    })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="btn-lime flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Link2 className="w-4 h-4" />
        {isPending ? 'Creating drafts…' : 'Create Evidence Link Drafts'}
      </button>

      <p className="text-[11px] text-text-muted">
        Creates draft links between coach observations and requirements. It does not update requirement status.
      </p>

      {result?.ok && (
        <div className="flex items-start gap-2 text-status-green text-xs bg-status-green/10 border border-status-green/30 rounded p-3">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Evidence link draft created with {result.linksCount} proposed{' '}
            {result.linksCount === 1 ? 'link' : 'links'}. Review the draft before applying.
          </span>
        </div>
      )}

      {result && !result.ok && result.error && (
        <div className="flex items-start gap-2 text-status-red text-xs bg-status-red/10 border border-status-red/30 rounded p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{result.error}</span>
        </div>
      )}
    </div>
  )
}
