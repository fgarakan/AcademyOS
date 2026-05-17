'use client'

import { GitBranch, Clock, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

export interface CurriculumChangeItem {
  id: string
  action_type: string
  description: string
  status: 'pending_review' | 'approved' | 'applied' | 'rejected'
  created_at: string
  confidence?: number
}

interface Props {
  items: CurriculumChangeItem[]
}

const STATUS_CONFIG = {
  pending_review: { label: 'Pending review', color: 'text-status-orange', Icon: Clock },
  approved:       { label: 'Approved',        color: 'text-status-green',  Icon: CheckCircle2 },
  applied:        { label: 'Applied',         color: 'text-lime',          Icon: CheckCircle2 },
  rejected:       { label: 'Rejected',        color: 'text-status-red',    Icon: XCircle },
}

export function CurriculumChangeQueue({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border border-dashed bg-surface p-8 text-center space-y-2">
        <GitBranch className="w-6 h-6 text-text-muted mx-auto" />
        <p className="text-[12px] font-semibold text-text-primary">No pending curriculum changes</p>
        <p className="text-[11px] text-text-muted">
          Ask DONNA to draft a drill, gate, or fitness change to see it here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">
          {items.length} change{items.length !== 1 ? 's' : ''}
        </p>
        <Link href="/director/review" className="text-[11px] text-lime hover:text-lime/80 transition-colors">
          Open Review Queue →
        </Link>
      </div>
      {items.map(item => {
        const cfg = STATUS_CONFIG[item.status]
        return (
          <div key={item.id} className="rounded-xl border border-border bg-surface-raised px-4 py-3 flex items-start gap-3">
            <cfg.Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-text-primary">{item.description}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                <span className="text-[10px] text-text-muted">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
                {item.confidence != null && (
                  <span className="text-[10px] text-text-muted">
                    {Math.round(item.confidence * 100)}% confidence
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
      <p className="text-[10px] text-text-muted text-center pt-1">
        Draft only — nothing is applied until approved in the Review Queue.
      </p>
    </div>
  )
}
