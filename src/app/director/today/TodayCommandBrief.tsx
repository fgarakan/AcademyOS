'use client'

// Sprint 512 — Command Brief Live Data Wiring V1
// Sprint 514 — uses shared status helpers from cooDataStatus
// Client wrapper: receives serialized live data from server, provides callbacks.

import { useRouter } from 'next/navigation'
import { DonnaCommandBriefIntegration } from '@/components/assistant/DonnaCommandBriefIntegration'
import type { DonnaCommandBriefData } from '@/components/assistant/DonnaCommandBriefIntegration'
import { getStatusLabel, getStatusDot } from '@/lib/donna/cooDataStatus'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface TodayCommandBriefProps {
  data: DonnaCommandBriefData
  overallStatus: 'live' | 'partial' | 'insufficient_data'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TodayCommandBrief({ data, overallStatus }: TodayCommandBriefProps) {
  const router = useRouter()

  const statusDot = getStatusDot(overallStatus)
  const statusCopy = getStatusLabel(overallStatus)

  return (
    <div className="space-y-2">
      {/* Data status badge */}
      <div className="flex items-center gap-1.5 px-0.5">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot}`} />
        <span className="text-[10px] text-text-muted">
          Data: <span className="font-medium">{statusCopy}</span>
          {overallStatus === 'partial' && ' — some signals not yet available'}
          {overallStatus === 'insufficient_data' && ' — no sessions or data found yet'}
        </span>
      </div>

      <DonnaCommandBriefIntegration
        data={data}
        onOpenReviewQueue={() => router.push('/director/review')}
        onDismiss={() => {}}
      />
    </div>
  )
}
