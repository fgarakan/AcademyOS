// Mega Sprint 1535–1564 — DONNA Today Operating System V1
// Director priorities — top 3 items, sorted by urgency + impact.
// Pure TypeScript — no DB, no React, no side effects.

import type { DirectorAttentionItem } from './directorAttentionEngine'

export interface DirectorPriority {
  rank:        number   // 1–3
  headline:    string
  synthesis:   string
  actionLabel: string
  actionHref:  string
  whyText:     string
  domain:      string
}

export function buildDirectorPriorities(
  attentionItems: DirectorAttentionItem[],
): DirectorPriority[] {
  // Priorities are the top 3 attention items, already sorted by priority tier
  return attentionItems.slice(0, 3).map((item, i) => ({
    rank:        i + 1,
    headline:    item.headline,
    synthesis:   item.synthesis,
    actionLabel: item.actionLabel,
    actionHref:  item.actionHref,
    whyText:     item.whyText,
    domain:      item.domain,
  }))
}
