'use client'

import { Users, Lock, Clock, CheckCircle, XCircle, Mail, ShieldCheck } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

export type ParentSafeDraftStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'sent'

export interface ParentSafeDraftSection {
  label: string
  content: string
}

export interface ParentSafeDraft {
  id: string
  playerName: string
  sessionName: string
  sessionDate: string | null
  status: ParentSafeDraftStatus
  sections: ParentSafeDraftSection[]
  coachNote: string | null
  directorNote: string | null
  generatedAt: string
}

// ── Status pill ────────────────────────────────────────────────

const STATUS_CONFIG: Record<ParentSafeDraftStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft:            { label: 'Draft',            color: 'text-text-muted border-border bg-surface-raised',          icon: <Clock className="w-3 h-3" /> },
  pending_approval: { label: 'Pending Approval', color: 'text-status-orange border-status-orange/30 bg-status-orange/5', icon: <Clock className="w-3 h-3" /> },
  approved:         { label: 'Approved',         color: 'text-status-green border-status-green/30 bg-status-green/5',   icon: <CheckCircle className="w-3 h-3" /> },
  rejected:         { label: 'Rejected',         color: 'text-status-red border-status-red/30 bg-status-red/5',         icon: <XCircle className="w-3 h-3" /> },
  sent:             { label: 'Sent',             color: 'text-status-blue border-status-blue/30 bg-status-blue/5',      icon: <Mail className="w-3 h-3" /> },
}

function StatusPill({ status }: { status: ParentSafeDraftStatus }) {
  const { label, color, icon } = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${color}`}>
      {icon}
      {label}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────

interface Props {
  draft: ParentSafeDraft
}

export function CoachParentSafeDraftCard({ draft }: Props) {
  const isInternal = draft.status === 'draft' || draft.status === 'pending_approval'

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Users className="w-3 h-3 text-text-muted shrink-0" />
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Parent-Safe Summary</p>
          </div>
          <p className="text-sm font-semibold text-text-primary">{draft.playerName}</p>
          <p className="text-[10px] text-text-muted mt-0.5">{draft.sessionName}{draft.sessionDate && ` · ${new Date(draft.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}</p>
        </div>
        <StatusPill status={draft.status} />
      </div>

      {/* Internal-only notice */}
      {isInternal && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-raised border border-border">
          <Lock className="w-3 h-3 text-text-muted shrink-0" />
          <p className="text-[10px] text-text-muted">Internal only — not visible to parent until director approves and sends</p>
        </div>
      )}

      {/* Sections */}
      {draft.sections.length > 0 && (
        <div className="space-y-3">
          {draft.sections.map((section, i) => (
            <div key={i}>
              <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">{section.label}</p>
              <p className="text-xs text-text-secondary leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Coach note */}
      {draft.coachNote && (
        <div>
          <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Coach Note (Internal)</p>
          <p className="text-[10px] text-text-muted leading-snug italic">{draft.coachNote}</p>
        </div>
      )}

      {/* Director note on rejection */}
      {draft.directorNote && draft.status === 'rejected' && (
        <div className="px-3 py-2 rounded-xl bg-status-red/5 border border-status-red/20">
          <p className="text-[9px] uppercase tracking-widest text-status-red mb-1">Director Feedback</p>
          <p className="text-[10px] text-text-secondary leading-snug">{draft.directorNote}</p>
        </div>
      )}

      {/* Director note on approval */}
      {draft.directorNote && draft.status === 'approved' && (
        <div className="px-3 py-2 rounded-xl bg-status-green/5 border border-status-green/20">
          <p className="text-[9px] uppercase tracking-widest text-status-green mb-1">Director Note</p>
          <p className="text-[10px] text-text-secondary leading-snug">{draft.directorNote}</p>
        </div>
      )}

      {/* Safety notice */}
      <div className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-surface-raised border border-border">
        <ShieldCheck className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
        <p className="text-[10px] text-text-muted leading-snug">
          Nothing is sent to parents automatically. Director approves and sends this summary manually. Raw coach notes are never included.
        </p>
      </div>

      {/* Footer */}
      <p className="text-[9px] text-text-muted border-t border-border pt-2">
        Generated {new Date(draft.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} — draft only
      </p>
    </div>
  )
}

// ── Draft list ────────────────────────────────────────────────

interface ListProps {
  drafts: ParentSafeDraft[]
}

export function CoachParentSafeDraftList({ drafts }: ListProps) {
  const pendingCount = drafts.filter(d => d.status === 'pending_approval').length

  if (drafts.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <Users className="w-5 h-5 text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-secondary">No parent-safe summaries yet.</p>
        <p className="text-xs text-text-muted mt-1">
          Summaries generated from wrap-up appear here for director review before any parent communication.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-status-orange/5 border border-status-orange/20">
          <Clock className="w-3.5 h-3.5 text-status-orange shrink-0" />
          <p className="text-[10px] text-text-secondary">
            <span className="font-semibold text-status-orange">{pendingCount}</span> summar{pendingCount !== 1 ? 'ies' : 'y'} pending director approval before sending
          </p>
        </div>
      )}
      {drafts.map(d => (
        <CoachParentSafeDraftCard key={d.id} draft={d} />
      ))}
    </div>
  )
}
