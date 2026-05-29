// Sprint 923 — Director Review Queue 10/10 V1
// Per-tab DONNA guidance for the Review Queue.
// Explains what each tab contains, what to prioritize, and the approval safety model.
// Read-only — no mutations, no approval logic.

import { Sparkles, ShieldCheck } from 'lucide-react'

type ReviewTab = 'needs_approval' | 'player_updates' | 'curriculum_session' | 'completed'

interface TabGuideConfig {
  headline: string
  what: string
  priority: string
  safety: string
}

const TAB_GUIDES: Record<ReviewTab, TabGuideConfig> = {
  needs_approval: {
    headline: 'For Your Review',
    what: 'Coach wrap-ups, attendance exceptions, placement decisions, voice intake drafts, and parent communication drafts.',
    priority: 'Start with coach wrap-ups and attendance exceptions — these affect the accuracy of today\'s session records.',
    safety: 'Approval marks an item as reviewed. Apply completes the action. Reject removes it from the queue. Nothing changes without your explicit step.',
  },
  player_updates: {
    headline: 'Player Signals',
    what: 'Player observation drafts, development summaries, priority recommendations, evidence links, and placement assessments.',
    priority: 'High-priority observation drafts and advancement recommendations come first. Apply carefully — these become part of the player\'s permanent record.',
    safety: 'Player level changes and priority updates require your approval before anything is applied. Rejecting a draft removes it permanently.',
  },
  curriculum_session: {
    headline: 'Curriculum + Session',
    what: 'Session recap drafts, curriculum override proposals, DONNA intelligence drafts, and coach curriculum suggestions.',
    priority: 'Session recaps inform future session planning. Curriculum overrides change what coaches teach — review evidence carefully before approving.',
    safety: 'Curriculum draft creation is always pending_review only. No curriculum change takes effect until you approve and apply it.',
  },
  completed: {
    headline: 'Completed',
    what: 'Items you have approved, rejected, or applied. This is your decision record for the current period.',
    priority: 'This tab is for audit and reference. Approved items can be applied from here if not yet executed.',
    safety: 'Completed items cannot be reversed from this view. Contact your platform admin if a completed action needs investigation.',
  },
}

interface Props {
  tab: ReviewTab
  pendingCount?: number
}

export function DonnaReviewTabGuide({ tab, pendingCount }: Props) {
  const guide = TAB_GUIDES[tab]
  if (!guide) return null

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-surface-raised border border-border text-xs text-text-secondary">
      <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-lime">DONNA</p>
          <p className="font-semibold text-text-primary">{guide.headline}</p>
          {pendingCount !== undefined && pendingCount > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 tabular-nums">
              {pendingCount} pending
            </span>
          )}
        </div>
        <p><span className="font-medium text-text-secondary">What's here:</span> {guide.what}</p>
        <p><span className="font-medium text-text-secondary">Priority:</span> {guide.priority}</p>
        <div className="flex items-start gap-1.5 mt-1">
          <ShieldCheck className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
          <p className="text-text-muted">{guide.safety}</p>
        </div>
      </div>
    </div>
  )
}
