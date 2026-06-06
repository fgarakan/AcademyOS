// Mega Sprint 2341–2370 — DONNA Academy Relationship Intelligence V1
// Relationship intelligence intent detector.
//
// Detects complex relationship queries that require the relationship engine:
//   - Multi-hop:    "who else is in that group?"
//   - Aggregate:    "which players share the same bottleneck?"
//   - Demonstrative: "how is that group doing?"
//   - Comparative:  "which coach has the most players needing attention?"
//   - Insight:      "state of the academy", "academy health"
//   - COO reasoning: "why does Jake need attention?"
//
// Distinct from donnaEntityIntentRouter.ts (simple single-entity navigation)
// and donnaRelationshipGraph.ts (basic named-entity relationships).
// Pure TypeScript — no DB, no React, no side effects.

// ── Intent kinds ──────────────────────────────────────────────────────────────

export type RelationshipIntelligenceKind =
  | 'co_group_members'           // "who else is in that group?" / "same group as Jake"
  | 'shared_bottleneck'          // "which players share the same bottleneck?"
  | 'players_needing_attention'  // "which players need attention?" / "who needs attention?"
  | 'stalled_players'            // "which players are stalled?" / "who is stuck?"
  | 'level_health'               // "which level causes the most issues?"
  | 'group_health'               // "how is that group doing?"
  | 'coach_load'                 // "which coach has the most players?"
  | 'academy_insight'            // "state of the academy" / "academy health"
  | 'coo_reasoning'              // "why does Jake need attention?" / "who else is affected?"
  | 'player_full_context'        // "full picture of Jake's situation"
  | 'players_without_assessment' // "which players haven't been assessed?"
  | 'advancing_players'          // "which players are ready to advance?"

export interface RelationshipIntelligenceIntent {
  kind:          RelationshipIntelligenceKind
  subjectPhrase: string | null  // named entity in the query, if any
  rawText:       string
}

// ── Pattern tables ────────────────────────────────────────────────────────────

interface RelPattern {
  kind:    RelationshipIntelligenceKind
  re:      RegExp
  subject: number | null  // capture group index for subject phrase (1-based), or null
}

const PATTERNS: RelPattern[] = [
  // ── Co-group members ───────────────────────────────────────────────────────
  { kind: 'co_group_members', re: /\bwho\s+else\s+is\s+in\b/i,                            subject: null },
  { kind: 'co_group_members', re: /\bother\s+players?\s+in\s+(?:that|this|the)\s+group\b/i, subject: null },
  { kind: 'co_group_members', re: /\bsame\s+group\s+as\s+(\w+)\b/i,                       subject: 1 },
  { kind: 'co_group_members', re: /\bwho\s+(?:also\s+)?(?:trains|plays)\s+(?:at|in)\s+(?:that|this)\s+(?:group|level)\b/i, subject: null },
  { kind: 'co_group_members', re: /\bwho\s+else\s+is\s+at\s+(?:that|this|the)\s+level\b/i, subject: null },

  // ── Shared bottleneck ─────────────────────────────────────────────────────
  { kind: 'shared_bottleneck', re: /\bsame\s+bottleneck\b/i,                              subject: null },
  { kind: 'shared_bottleneck', re: /\bshare\s+(?:the\s+same|a)\s+(?:bottleneck|issue|problem|block)\b/i, subject: null },
  { kind: 'shared_bottleneck', re: /\bblocked\s+by\s+the\s+same\b/i,                      subject: null },
  { kind: 'shared_bottleneck', re: /\baffected\s+by\s+(?:the\s+same|this)\s+(?:curriculum|bottleneck|requirement)\b/i, subject: null },

  // ── Players needing attention ─────────────────────────────────────────────
  { kind: 'players_needing_attention', re: /\bplayers?\s+(?:need(?:ing)?|requiring)\s+attention\b/i, subject: null },
  { kind: 'players_needing_attention', re: /\bwho\s+needs?\s+(?:my\s+)?attention\b/i,               subject: null },
  { kind: 'players_needing_attention', re: /\bplayers?\s+(?:at\s+risk|struggling|falling\s+behind)\b/i, subject: null },
  { kind: 'players_needing_attention', re: /\bshow\s+(?:me\s+)?(?:all\s+)?players?\s+(?:behind|struggling|at.risk)\b/i, subject: null },
  { kind: 'players_needing_attention', re: /\ball\s+players?\s+(?:who\s+are\s+)?(?:behind|struggling|at.risk)\b/i, subject: null },
  { kind: 'players_needing_attention', re: /\bplayers?\s+behind\s+on\s+(.{2,40})\b/i,              subject: 1 },

  // ── Stalled / stuck players ────────────────────────────────────────────────
  { kind: 'stalled_players', re: /\bstalled\s+players?\b/i,                              subject: null },
  { kind: 'stalled_players', re: /\bplayers?\s+(?:who\s+are\s+)?stalled\b/i,             subject: null },
  { kind: 'stalled_players', re: /\bplayers?\s+(?:who\s+are\s+)?stuck\b/i,               subject: null },
  { kind: 'stalled_players', re: /\bplayers?\s+not\s+(?:advancing|progressing|moving)\b/i, subject: null },
  { kind: 'stalled_players', re: /\bno\s+(?:progress|advancement)\b/i,                   subject: null },

  // ── Level health ─────────────────────────────────────────────────────────
  { kind: 'level_health', re: /\bwhich\s+(?:curriculum\s+)?level\s+(?:causes?|has|is)\s+(?:the\s+)?most\b/i, subject: null },
  { kind: 'level_health', re: /\bmost\s+(?:problematic|blocked|difficult)\s+(?:level|stage)\b/i, subject: null },
  { kind: 'level_health', re: /\bcurriculum\s+(?:bottleneck|hotspot|impact\s+zone)\b/i,  subject: null },
  { kind: 'level_health', re: /\bwhich\s+level\s+(?:blocks?|affects?)\s+(?:the\s+)?most\s+players?\b/i, subject: null },
  { kind: 'level_health', re: /\bwhere\s+(?:are\s+we\s+)?losing\s+progress\b/i,         subject: null },

  // ── Group health (demonstrative) ────────────────────────────────────────
  { kind: 'group_health', re: /\bhow\s+is\s+that\s+group\b/i,                            subject: null },
  { kind: 'group_health', re: /\bhow\s+(?:is|are)\s+(?:that|this|the)\s+group\s+doing\b/i, subject: null },
  { kind: 'group_health', re: /\bstatus\s+of\s+that\s+group\b/i,                         subject: null },
  { kind: 'group_health', re: /\bthat\s+group.?s\s+(?:health|status|progress|performance)\b/i, subject: null },

  // ── Coach load ────────────────────────────────────────────────────────────
  { kind: 'coach_load', re: /\bwhich\s+coach\s+has\s+the\s+most\b/i,                     subject: null },
  { kind: 'coach_load', re: /\bmost\s+(?:loaded|busy)\s+coach\b/i,                       subject: null },
  { kind: 'coach_load', re: /\bcoach\s+(?:with|who\s+has)\s+(?:the\s+)?most\s+players?\b/i, subject: null },
  { kind: 'coach_load', re: /\bwhich\s+coach\s+needs?\s+support\b/i,                     subject: null },
  { kind: 'coach_load', re: /\bhighest\s+(?:assessment\s+)?completion\s+(?:rate\s+)?(?:by|per)\s+coach\b/i, subject: null },

  // ── Academy insight ───────────────────────────────────────────────────────
  { kind: 'academy_insight', re: /\bstate\s+of\s+(?:the\s+)?academy\b/i,                 subject: null },
  { kind: 'academy_insight', re: /\bacademy\s+(?:health|overview|status|summary|snapshot)\b/i, subject: null },
  { kind: 'academy_insight', re: /\bhow\s+is\s+(?:the\s+)?academy\s+doing\b/i,           subject: null },
  { kind: 'academy_insight', re: /\bwhere\s+are\s+we\s+struggling\b/i,                   subject: null },
  { kind: 'academy_insight', re: /\bbig\s+picture\b/i,                                   subject: null },

  // ── COO reasoning ─────────────────────────────────────────────────────────
  { kind: 'coo_reasoning', re: /\bwhy\s+does\s+(\w+)\s+need\s+attention\b/i,             subject: 1 },
  { kind: 'coo_reasoning', re: /\bwhat.?s\s+(?:causing|affecting)\s+(\w+)\b/i,           subject: 1 },
  { kind: 'coo_reasoning', re: /\broot\s+cause\b/i,                                      subject: null },
  { kind: 'coo_reasoning', re: /\bwho\s+else\s+is\s+affected\b/i,                        subject: null },
  { kind: 'coo_reasoning', re: /\bwhat\s+(?:is\s+)?the\s+(?:root\s+)?cause\b/i,          subject: null },
  { kind: 'coo_reasoning', re: /\bwhat\s+should\s+(?:we|i)\s+do\s+(?:about|for)\s+(\w+)\b/i, subject: 1 },

  // ── Player full context ───────────────────────────────────────────────────
  { kind: 'player_full_context', re: /\beverything\s+about\s+(\w+).?s\s+situation\b/i,   subject: 1 },
  { kind: 'player_full_context', re: /\bfull\s+(?:picture|context|breakdown)\s+(?:of|for)\s+(\w+)\b/i, subject: 1 },
  { kind: 'player_full_context', re: /\bwhat.?s\s+happening\s+with\s+(\w+)\b/i,          subject: 1 },
  { kind: 'player_full_context', re: /\btell\s+me\s+everything\s+about\s+(\w+)\b/i,      subject: 1 },

  // ── Players without assessment ────────────────────────────────────────────
  { kind: 'players_without_assessment', re: /\bplayers?\s+(?:who\s+haven.?t|without|missing)\s+(?:a\s+)?(?:recent\s+)?assessment\b/i, subject: null },
  { kind: 'players_without_assessment', re: /\bno\s+(?:recent\s+)?assessment\b/i,        subject: null },
  { kind: 'players_without_assessment', re: /\bmissing\s+(?:their\s+)?assessment\b/i,    subject: null },

  // ── Advancing players ─────────────────────────────────────────────────────
  { kind: 'advancing_players', re: /\bplayers?\s+(?:ready|eligible)\s+to\s+advance\b/i,  subject: null },
  { kind: 'advancing_players', re: /\badvancement\s+(?:ready|eligible)\s+players?\b/i,   subject: null },
  { kind: 'advancing_players', re: /\bwhich\s+players?\s+(?:can|should)\s+(?:move\s+up|advance|be\s+promoted)\b/i, subject: null },
]

// ── Main detector ─────────────────────────────────────────────────────────────

/**
 * Returns a RelationshipIntelligenceIntent if the text is a complex/aggregate/
 * demonstrative/multi-hop relationship query. Returns null for simple entity
 * lookups ("show me Jake", "who coaches Jake?") that are handled by entity
 * intelligence (Step 10.5).
 */
export function detectRelationshipIntelligenceIntent(
  text: string,
): RelationshipIntelligenceIntent | null {
  if (!text.trim()) return null

  for (const { kind, re, subject } of PATTERNS) {
    const m = re.exec(text)
    if (!m) continue
    const subjectPhrase = (subject !== null && m[subject])
      ? m[subject].trim()
      : null
    return { kind, subjectPhrase, rawText: text }
  }
  return null
}
