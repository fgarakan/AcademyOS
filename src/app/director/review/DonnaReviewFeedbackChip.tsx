'use client'

// Sprint 916 — DONNA Director UX Integration V1
// Fire-and-forget feedback chip for the DONNA Review Brief "Start here" recommendation.
// Director clicks "Act on this" or "Dismiss" — feedback is logged silently.
// Navigation is never blocked by feedback logging.

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { createAndRecordReviewFeedbackAction } from '@/lib/donna/donnaReviewFeedbackAction'
import type { RecommendationType } from '@/lib/donna/donnaRecommendationFeedback'

interface Props {
  href: string
  recommendationText: string
  recommendationType: RecommendationType
}

export function DonnaReviewFeedbackChip({ href, recommendationText, recommendationType }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  function logAndNavigate(feedbackStatus: 'accepted' | 'rejected') {
    // Fire-and-forget: logging failure must never block navigation
    startTransition(async () => {
      try {
        await createAndRecordReviewFeedbackAction({
          recommendationText,
          recommendationType,
          feedbackStatus,
        })
      } catch {
        // silent
      }
    })
    router.push(href)
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <button
        onClick={() => logAndNavigate('accepted')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-lime/10 border border-lime/20 text-lime hover:bg-lime/20 transition-colors"
      >
        <ArrowRight className="w-3 h-3" />
        Act on this
      </button>
      <button
        onClick={() => logAndNavigate('rejected')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-text-muted border border-border hover:border-lime/20 hover:text-text-secondary transition-colors"
      >
        <X className="w-3 h-3" />
        Dismiss
      </button>
    </div>
  )
}
