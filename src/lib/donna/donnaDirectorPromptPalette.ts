// Sprint 695 — DONNA Director Command Palette Prompts V1
// Page-aware prompt suggestions for the DONNA panel chip row.
// Pure TS — no DB calls, no API calls, no mutations.
// Falls back to donnaPageContextEngine suggestedPrompts for unspecified routes.

import { getPageCapabilityMap } from './donnaPageContextEngine'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DonnaPromptSuggestion {
  id: string
  /** Short text shown in the chip button */
  label: string
  /** Full prompt string sent to DONNA on click — equal to label unless truncation needed */
  prompt: string
  /** Loose intent hint for analytics; does not affect routing */
  intentHint: 'attention' | 'approval' | 'explanation' | 'draft' | 'diagnostic' | 'general'
}

// ── Per-route palette ─────────────────────────────────────────────────────────

const PALETTE_BY_ROUTE: Record<string, DonnaPromptSuggestion[]> = {
  '/director/onboarding': [
    { id: 'ob_help', label: 'Can you help me with setup?', prompt: 'Can you help me with the onboarding process?', intentHint: 'explanation' },
    { id: 'ob_modes', label: 'What are the setup modes?', prompt: 'What are the setup modes — Fast Start, Guided, Full?', intentHint: 'explanation' },
    { id: 'ob_recommend', label: 'Which setup do you recommend?', prompt: 'Which setup mode do you recommend?', intentHint: 'explanation' },
    { id: 'ob_next', label: 'What do I do next?', prompt: 'What should I do next in setup?', intentHint: 'attention' },
  ],
  '/director': [
    { id: 'd_first', label: 'What should I do first today?', prompt: 'What should I do first today?', intentHint: 'attention' },
    { id: 'd_signal', label: 'Which signal needs attention?', prompt: 'Which academy signal needs attention?', intentHint: 'attention' },
    { id: 'd_approval', label: 'What needs parent approval?', prompt: 'What needs approval before parents see it?', intentHint: 'approval' },
    { id: 'd_kpi', label: 'Explain the KPIs.', prompt: 'Explain the KPIs like I\'m making a director decision.', intentHint: 'explanation' },
  ],
  '/director/donna': [
    { id: 'donna_help', label: 'What can you help me with?', prompt: 'What can you help me with?', intentHint: 'explanation' },
    { id: 'donna_how', label: 'How does DONNA work?', prompt: 'How does DONNA work?', intentHint: 'explanation' },
    { id: 'donna_safe', label: 'What is safe to do from here?', prompt: 'What is safe to do from here?', intentHint: 'approval' },
    { id: 'donna_approve', label: 'How do I approve items?', prompt: 'How do I approve items?', intentHint: 'approval' },
  ],
  '/director/players': [
    { id: 'p_attention', label: 'Which players need attention?', prompt: 'Which players need attention?', intentHint: 'attention' },
    { id: 'p_ready', label: 'Who may be ready to level up?', prompt: 'Who may be ready for the next step?', intentHint: 'attention' },
    { id: 'p_coaches', label: 'What should coaches focus on?', prompt: 'What should coaches focus on this week?', intentHint: 'explanation' },
    { id: 'p_review', label: 'Which profiles need review?', prompt: 'Which player profiles need review?', intentHint: 'approval' },
  ],
  '/director/players/[playerId]': [
    { id: 'pp_summary', label: 'Summarize this player\'s progress.', prompt: 'Summarize this player\'s recent progress.', intentHint: 'explanation' },
    { id: 'pp_ready', label: 'Ready for a level change?', prompt: 'Is this player ready for a level change?', intentHint: 'approval' },
    { id: 'pp_parent', label: 'Draft a parent update.', prompt: 'Draft a parent-safe update for review.', intentHint: 'draft' },
    { id: 'pp_check', label: 'What to review before updating?', prompt: 'What should I review before updating the parent?', intentHint: 'approval' },
  ],
  '/director/review': [
    { id: 'r_first', label: 'What needs approval first?', prompt: 'What needs approval first?', intentHint: 'approval' },
    { id: 'r_risk', label: 'Which items have parent risk?', prompt: 'Which items have parent visibility risk?', intentHint: 'approval' },
    { id: 'r_summary', label: 'Summarize the review queue.', prompt: 'Summarize the review queue.', intentHint: 'explanation' },
    { id: 'r_effect', label: 'What happens after I approve?', prompt: 'What happens after I approve this?', intentHint: 'explanation' },
  ],
  '/director/kpi': [
    { id: 'k_explain', label: 'Explain these KPIs.', prompt: 'Explain these KPIs like I\'m making a director decision.', intentHint: 'explanation' },
    { id: 'k_attention', label: 'Which KPI needs attention?', prompt: 'Which KPI needs attention first?', intentHint: 'attention' },
    { id: 'k_health', label: 'What does this say about health?', prompt: 'What does this tell me about academy health?', intentHint: 'explanation' },
    { id: 'k_next', label: 'What should I investigate next?', prompt: 'What should I investigate next?', intentHint: 'attention' },
  ],
  '/director/curriculum': [
    { id: 'c_gaps', label: 'Where are the curriculum gaps?', prompt: 'Where are the curriculum gaps?', intentHint: 'attention' },
    { id: 'c_before', label: 'What to review before changing?', prompt: 'What should I review before changing this?', intentHint: 'approval' },
    { id: 'c_draft', label: 'Draft a curriculum improvement.', prompt: 'Draft a curriculum improvement for review.', intentHint: 'draft' },
    { id: 'c_connect', label: 'How does this connect to players?', prompt: 'How does this connect to player progress?', intentHint: 'explanation' },
  ],
  '/director/curriculum/builder': [
    { id: 'cb_safe', label: 'What can I safely change here?', prompt: 'What can I safely change here?', intentHint: 'approval' },
    { id: 'cb_review', label: 'What requires review to publish?', prompt: 'What should require review before publishing?', intentHint: 'approval' },
    { id: 'cb_improve', label: 'Help me improve this section.', prompt: 'Help me improve this curriculum section.', intentHint: 'draft' },
    { id: 'cb_effects', label: 'What are the downstream effects?', prompt: 'What are the downstream effects?', intentHint: 'explanation' },
  ],
  '/director/signals': [
    { id: 's_urgent', label: 'Which signal matters most?', prompt: 'Which signal matters most?', intentHint: 'attention' },
    { id: 's_changed', label: 'What changed that needs action?', prompt: 'What changed that needs my attention?', intentHint: 'attention' },
    { id: 's_inspect', label: 'What should I inspect first?', prompt: 'What should I inspect first?', intentHint: 'attention' },
    { id: 's_connected', label: 'Who is connected to this signal?', prompt: 'Which players or groups are connected to this?', intentHint: 'explanation' },
  ],
  '/director/placement': [
    { id: 'pl_pending', label: 'Which placements need review?', prompt: 'Which placements need review?', intentHint: 'approval' },
    { id: 'pl_evidence', label: 'What evidence supports this?', prompt: 'What evidence supports this recommendation?', intentHint: 'explanation' },
    { id: 'pl_before', label: 'What to check before approving?', prompt: 'What should I check before approving placement?', intentHint: 'approval' },
    { id: 'pl_unsafe', label: 'What should not be auto-decided?', prompt: 'What could be unsafe to decide automatically?', intentHint: 'approval' },
  ],
  '/director/level-up': [
    { id: 'lu_ready', label: 'Who may be ready to level up?', prompt: 'Who may be ready to level up?', intentHint: 'attention' },
    { id: 'lu_evidence', label: 'What evidence is missing?', prompt: 'What evidence is missing?', intentHint: 'attention' },
    { id: 'lu_approve', label: 'What should I approve or reject?', prompt: 'What should I approve or reject?', intentHint: 'approval' },
    { id: 'lu_risk', label: 'Explain level movement risk.', prompt: 'Explain level movement risk.', intentHint: 'explanation' },
  ],
  '/director/support-diagnostics': [
    { id: 'sd_failed', label: 'What failed recently?', prompt: 'What failed recently?', intentHint: 'diagnostic' },
    { id: 'sd_trace', label: 'Which trace should I inspect?', prompt: 'Which trace should I inspect first?', intentHint: 'diagnostic' },
    { id: 'sd_error', label: 'Explain this error safely.', prompt: 'Explain this error safely.', intentHint: 'diagnostic' },
    { id: 'sd_private', label: 'What can support see safely?', prompt: 'What can support diagnose without exposing private data?', intentHint: 'diagnostic' },
  ],
}

// ── Default fallback suggestions ──────────────────────────────────────────────

const DEFAULT_SUGGESTIONS: DonnaPromptSuggestion[] = [
  { id: 'def_attention', label: 'What needs attention?', prompt: 'What needs attention?', intentHint: 'attention' },
  { id: 'def_review', label: 'Review queue', prompt: 'Show the review queue.', intentHint: 'approval' },
  { id: 'def_parent', label: 'Draft parent update', prompt: 'Draft a parent update.', intentHint: 'draft' },
  { id: 'def_template', label: 'Create class template', prompt: 'Create a class template.', intentHint: 'general' },
]

// ── Lookup ─────────────────────────────────────────────────────────────────────

export function getDonnaPromptSuggestions(pathname: string): DonnaPromptSuggestion[] {
  // Exact match
  if (PALETTE_BY_ROUTE[pathname]) return PALETTE_BY_ROUTE[pathname]

  // Player profile — parameterized route
  if (pathname.startsWith('/director/players/') && pathname.split('/').length >= 4) {
    return PALETTE_BY_ROUTE['/director/players/[playerId]'] ?? DEFAULT_SUGGESTIONS
  }

  // Prefix match (longest prefix wins)
  const sortedKeys = Object.keys(PALETTE_BY_ROUTE).sort((a, b) => b.length - a.length)
  const prefixMatch = sortedKeys.find(k => pathname.startsWith(k))
  if (prefixMatch) return PALETTE_BY_ROUTE[prefixMatch]

  // Fallback: use page capability map suggestedPrompts if available
  const capMap = getPageCapabilityMap(pathname)
  if (capMap.suggestedPrompts.length > 0) {
    return capMap.suggestedPrompts.slice(0, 4).map((p, i) => ({
      id: `cap_${i}`,
      label: p.length > 40 ? `${p.slice(0, 38)}…` : p,
      prompt: p,
      intentHint: 'general' as const,
    }))
  }

  return DEFAULT_SUGGESTIONS
}

export function getDefaultDonnaPromptSuggestions(): DonnaPromptSuggestion[] {
  return DEFAULT_SUGGESTIONS
}

export function getPromptCategoryLabel(pathname: string): string {
  if (pathname.startsWith('/director/players/') && pathname.split('/').length >= 4) {
    return 'Player actions'
  }
  const capMap = getPageCapabilityMap(pathname)
  if (capMap.route !== '*') return `${capMap.pageLabel} actions`
  return 'Quick actions'
}
