// Sprint 964 — DONNA Page Chip Registry
// Defines page-aware chips shown in the DONNA side panel per route.
// Chips either trigger a highlight on a data-donna-focus-id target,
// or send a pre-written prompt into the DONNA conversation.
// No DB. No mutations. Pure configuration — safe to import anywhere.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Sprint 966 — added 'brief' to trigger handleFetchDailyBrief via onBrief prop.
// No new API, no new voice path, no new DONNA surface.
export type DonnaChipActionType = 'highlight' | 'prompt' | 'brief'

export interface DonnaPageChip {
  /** Unique identifier for this chip within its route */
  id: string
  /** Text shown on the chip button */
  label: string
  /** What happens when the chip is clicked */
  actionType: DonnaChipActionType
  /**
   * For 'highlight' chips: the data-donna-focus-id attribute value to target.
   * If the element is not present on the page, the highlight fails gracefully (no error).
   */
  targetId?: string
  /**
   * For 'prompt' chips: the text sent into the DONNA conversation.
   * Use clear, director-facing language. Never include player names or sensitive data.
   */
  prompt?: string
}

interface DonnaPageChipSet {
  /**
   * Route pattern. Supports:
   * - Exact match: '/director/curriculum'
   * - Prefix match: '/director/class-templates/' (note trailing slash)
   * - Exact pattern with startsWith semantics when used by getChipsForRoute
   */
  routePattern: string
  /** Whether to use startsWith (true) or exact equality (false) for matching */
  matchPrefix: boolean
  chips: DonnaPageChip[]
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const PAGE_CHIP_REGISTRY: DonnaPageChipSet[] = [
  // ── Director Dashboard (/director) ────────────────────────────────────────
  {
    routePattern: '/director',
    matchPrefix: false,
    chips: [
      {
        id: 'dir-pulse',
        label: "Highlight today's pulse",
        actionType: 'highlight',
        targetId: 'todays-pulse',
      },
      {
        id: 'dir-review',
        label: 'Highlight review queue',
        actionType: 'highlight',
        targetId: 'review-queue-card',
      },
      {
        id: 'dir-metrics',
        label: 'Highlight academy metrics',
        actionType: 'highlight',
        targetId: 'academy-metrics-section',
      },
      // Sprint 966 — brief chips: reuse existing /api/donna/brief + handleFetchDailyBrief
      {
        id: 'dir-brief-walk',
        label: 'Walk me through academy priorities',
        actionType: 'brief',
      },
      {
        id: 'dir-brief-attention',
        label: 'What needs my attention?',
        actionType: 'brief',
      },
      // Sprint 968 — Director Next Action Engine chip
      {
        id: 'dir-what-next',
        label: 'What should I do next?',
        actionType: 'prompt',
        prompt: 'What should I do next?',
      },
    ],
  },

  // ── Curriculum (/director/curriculum) ─────────────────────────────────────
  {
    routePattern: '/director/curriculum',
    matchPrefix: false,
    chips: [
      {
        id: 'cur-status',
        label: 'Highlight curriculum status',
        actionType: 'highlight',
        targetId: 'curriculum-status',
      },
      {
        id: 'cur-draft',
        label: 'Highlight review draft',
        actionType: 'highlight',
        targetId: 'curriculum-review-draft',
      },
      {
        id: 'cur-levels',
        label: 'Highlight level tree',
        actionType: 'highlight',
        targetId: 'curriculum-level-tree',
      },
      {
        id: 'cur-next',
        label: 'What should I do next?',
        actionType: 'prompt',
        prompt: 'What should I do next on the curriculum page?',
      },
    ],
  },

  // ── Class Template Detail (/director/class-templates/[templateId]) ─────────
  // Matched as prefix so the dynamic [templateId] segment is covered.
  // Must appear before the class-templates list entry to take priority for detail URLs.
  {
    routePattern: '/director/class-templates/',
    matchPrefix: true,
    chips: [
      {
        id: 'tpl-primary',
        label: 'Highlight primary action',
        actionType: 'highlight',
        targetId: 'class-template-primary-action',
      },
      {
        id: 'tpl-blocks',
        label: 'Highlight block list',
        actionType: 'highlight',
        targetId: 'class-template-block-list',
      },
      {
        id: 'tpl-draft',
        label: 'Highlight review draft',
        actionType: 'highlight',
        targetId: 'class-template-review-draft',
      },
      {
        id: 'tpl-next',
        label: 'What should I do next?',
        actionType: 'prompt',
        prompt: 'What should I do next on this class template?',
      },
    ],
  },

  // ── Class Template List (/director/class-templates) ────────────────────────
  {
    routePattern: '/director/class-templates',
    matchPrefix: false,
    chips: [
      {
        id: 'tpl-list-create',
        label: 'Highlight create button',
        actionType: 'highlight',
        targetId: 'create-template-button',
      },
      {
        id: 'tpl-list-all',
        label: 'Highlight template list',
        actionType: 'highlight',
        targetId: 'template-list',
      },
    ],
  },

  // ── Templates Impact Preview (/director/templates/impact-preview) ──────────
  {
    routePattern: '/director/templates/impact-preview',
    matchPrefix: false,
    chips: [
      {
        id: 'imp-explain',
        label: 'Explain impact preview',
        actionType: 'prompt',
        prompt: 'Explain what this impact preview page shows me.',
      },
      {
        id: 'imp-safe',
        label: 'What is safe here?',
        actionType: 'prompt',
        prompt: 'What is safe to do on the impact preview page?',
      },
      {
        id: 'imp-review',
        label: 'Open review queue',
        actionType: 'prompt',
        prompt: 'Take me to the review queue.',
      },
    ],
  },

  // ── Director Review Queue (/director/review) ───────────────────────────────
  {
    routePattern: '/director/review',
    matchPrefix: false,
    chips: [
      {
        id: 'rev-approve',
        label: 'What needs approval?',
        actionType: 'prompt',
        prompt: 'What items need my approval right now?',
      },
      {
        id: 'rev-explain',
        label: 'Explain this queue',
        actionType: 'prompt',
        prompt: 'Explain how the director review queue works.',
      },
      // Sprint 966 — brief chip
      {
        id: 'rev-brief',
        label: 'Show daily brief',
        actionType: 'brief',
      },
    ],
  },

  // ── Onboarding (/director/onboarding) ─────────────────────────────────────
  {
    routePattern: '/director/onboarding',
    matchPrefix: true,
    chips: [
      {
        id: 'onb-next',
        label: 'What should I do next?',
        actionType: 'prompt',
        prompt: 'What should I do next in the onboarding flow?',
      },
      {
        id: 'onb-explain',
        label: 'Explain this step',
        actionType: 'prompt',
        prompt: 'Explain what this onboarding step is asking me to do.',
      },
    ],
  },

  // ── Player Directory (/director/players — exact, not prefix) ─────────────
  {
    routePattern: '/director/players',
    matchPrefix: false,
    chips: [
      {
        id: 'plist-list',
        label: 'Highlight player list',
        actionType: 'highlight',
        targetId: 'player-list',
      },
      // Sprint 966 — brief chip
      {
        id: 'plist-brief',
        label: 'Show daily brief',
        actionType: 'brief',
      },
    ],
  },

  // ── Player Profile (/director/players/[playerId]) ─────────────────────────
  {
    routePattern: '/director/players/',
    matchPrefix: true,
    chips: [
      {
        id: 'pp-priorities',
        label: 'Highlight priorities',
        actionType: 'highlight',
        targetId: 'player-active-priorities',
      },
      {
        id: 'pp-evidence',
        label: 'Highlight evidence hub',
        actionType: 'highlight',
        targetId: 'player-evidence-hub',
      },
      {
        id: 'pp-next',
        label: 'What should I do next?',
        actionType: 'prompt',
        prompt: 'What should I do next for this player?',
      },
    ],
  },

  // ── Sessions (/director/sessions) ─────────────────────────────────────────
  {
    routePattern: '/director/sessions',
    matchPrefix: true,
    chips: [
      {
        id: 'ses-next',
        label: 'What needs attention?',
        actionType: 'prompt',
        prompt: 'Which sessions need my attention right now?',
      },
      // Sprint 966 — brief chip
      {
        id: 'ses-brief',
        label: 'Show daily brief',
        actionType: 'brief',
      },
    ],
  },

  // ── DONNA page (/director/donna) ──────────────────────────────────────────
  // The DONNA full-page command center is a valid separate surface.
  // Chips here are meta/informational only.
  {
    routePattern: '/director/donna',
    matchPrefix: false,
    chips: [
      {
        id: 'donna-explain',
        label: 'What can DONNA do?',
        actionType: 'prompt',
        prompt: 'What can DONNA help me with as a director?',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

/**
 * Returns the chips to show for the given pathname.
 * Prefix patterns are checked before exact patterns to prioritise detail pages.
 * Returns [] when no chips are registered for the route.
 */
export function getChipsForRoute(pathname: string): DonnaPageChip[] {
  // First pass: exact match
  const exact = PAGE_CHIP_REGISTRY.find(
    set => !set.matchPrefix && set.routePattern === pathname,
  )
  if (exact) return exact.chips

  // Second pass: prefix match — pick the longest matching prefix
  const prefixMatches = PAGE_CHIP_REGISTRY.filter(
    set => set.matchPrefix && pathname.startsWith(set.routePattern),
  )
  if (prefixMatches.length === 0) return []

  // Longest prefix wins (most specific)
  prefixMatches.sort((a, b) => b.routePattern.length - a.routePattern.length)
  return prefixMatches[0].chips
}
