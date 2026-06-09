// Mega Sprint 1535–1564 — DONNA Today Operating System V1
// Mega Sprint 1565–1594 — DONNA Decision Execution Engine V1 (execution plan added)
// Director priorities — top 3 items, sorted by urgency + impact.
// Each priority now carries a DecisionExecutionPlan for actionable expansion.
// Pure TypeScript — no DB, no React, no side effects.

import type { DirectorAttentionItem } from './directorAttentionEngine'
import { buildExecutionPlanForAttentionItem } from '@/lib/donna/execution/donnaDecisionExecutionEngine'
import type { DecisionExecutionPlan } from '@/lib/donna/execution/donnaDecisionExecutionTypes'

export interface DirectorPriority {
  rank:          number   // 1–3
  headline:      string
  synthesis:     string
  actionLabel:   string
  actionHref:    string
  whyText:       string
  domain:        string
  executionPlan: DecisionExecutionPlan
}

export function buildDirectorPriorities(
  attentionItems: DirectorAttentionItem[],
): DirectorPriority[] {
  return attentionItems.slice(0, 3).map((item, i) => ({
    rank:          i + 1,
    headline:      item.headline,
    synthesis:     item.synthesis,
    actionLabel:   item.actionLabel,
    actionHref:    item.actionHref,
    whyText:       item.whyText,
    domain:        item.domain,
    executionPlan: buildExecutionPlanForAttentionItem(item),
  }))
}
