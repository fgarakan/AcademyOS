// Sprint 919 — extracted from DonnaCommandBriefIntegration.tsx (use client) so
// server-side loaders can safely import this pure helper without crossing the
// server/client module boundary.

export function buildDonnaCommandBriefPrompt(data: {
  itemsPendingDirectorReview: number
  attentionFlags: { urgency: string }[]
  wrapUpsOutstanding: number
}): string {
  if (data.attentionFlags.filter(f => f.urgency === 'high').length > 0) {
    return 'There are high-priority items that need your attention today.'
  }
  if (data.itemsPendingDirectorReview > 0) {
    return `You have ${data.itemsPendingDirectorReview} item${data.itemsPendingDirectorReview > 1 ? 's' : ''} pending review.`
  }
  if (data.wrapUpsOutstanding > 0) {
    return "Some coaches haven't submitted their wrap-ups yet."
  }
  return "Here's what's happening today."
}
