'use client'

// Sprint 512 — Command Brief Live Data Wiring V1
// Client wrapper: receives serialized live data from server, provides callbacks.

import { useRouter } from 'next/navigation'
import { DonnaCommandBriefIntegration } from '@/components/assistant/DonnaCommandBriefIntegration'
import type { DonnaCommandBriefData } from '@/components/assistant/DonnaCommandBriefIntegration'
import type { COOFieldStatus } from '@/lib/donna/commandBriefLiveLoader'

// ── Status display ────────────────────────────────────────────────────────────

const STATUS_COPY: Record<COOFieldStatus, string> = {
  live: 'Live',
  partial: 'Partial',
  insufficient_data: 'No data yet',
  blocked_by_rls: 'Blocked',
  blocked_by_schema: 'Schema gap',
}

const STATUS_DOT: Record<COOFieldStatus, string> = {
  live: 'bg-status-green',
  partial: 'bg-status-orange',
  insufficient_data: 'bg-text-muted',
  blocked_by_rls: 'bg-status-red',
  blocked_by_schema: 'bg-status-red',
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface TodayCommandBriefProps {
  data: DonnaCommandBriefData
  overallStatus: 'live' | 'partial' | 'insufficient_data'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TodayCommandBrief({ data, overallStatus }: TodayCommandBriefProps) {
  const router = useRouter()

  const statusDot = STATUS_DOT[overallStatus]
  const statusCopy = STATUS_COPY[overallStatus]

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
