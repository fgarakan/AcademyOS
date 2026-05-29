// Sprint 920 — DONNA Insight Engine V1
// Renders detected insights on the director DONNA page.
// No raw IDs, no sensitive notes, no official mutations.
// Falls back to nothing if no insights.

import Link from 'next/link'
import { Lightbulb, ArrowRight, ShieldCheck } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import type { DonnaInsight, InsightConfidence } from '@/lib/donna/donnaInsightEngine'

interface Props {
  insights: DonnaInsight[]
}

const CONFIDENCE_STYLE: Record<InsightConfidence, string> = {
  high:   'text-status-orange border-status-orange/20 bg-status-orange/8',
  medium: 'text-lime border-lime/20 bg-lime/8',
  low:    'text-text-muted border-border bg-surface-raised',
}

export function DonnaInsightSection({ insights }: Props) {
  if (insights.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <span className="label-xs flex items-center gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-lime" />
          DONNA Insights
        </span>
        <p className="text-[10px] text-text-muted mt-0.5">
          Patterns detected from academy data. No changes made.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map(insight => (
            <div key={insight.id} className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[9px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded-full border ${CONFIDENCE_STYLE[insight.confidence]}`}>
                  {insight.confidence}
                </span>
                <p className="text-xs font-semibold text-text-primary">{insight.title}</p>
              </div>
              <p className="text-xs text-text-secondary leading-snug">{insight.evidence}</p>
              <p className="text-[11px] text-text-muted leading-snug italic">{insight.recommendation}</p>
              {insight.href && (
                <Link
                  href={insight.href}
                  className="inline-flex items-center gap-1 text-[11px] text-lime/80 hover:text-lime transition-colors"
                >
                  {insight.safeNextStep}
                  <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border">
          <ShieldCheck className="w-3 h-3 text-text-muted shrink-0" />
          <p className="text-[10px] text-text-muted">
            Insights require your review. No action is automatic.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
