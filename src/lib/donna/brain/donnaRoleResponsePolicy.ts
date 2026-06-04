// Sprint 1911–1960 — DONNA Unified Conversation Brain V1
// Per-role response policy and ChatGPT-like response formatter.
//
// Defines what each role can see, what DONNA must never share,
// and how responses should be formatted for a given role.
//
// Also exports the ChatGPT-like response formatter:
//   Answer → Reason → Next best action → Follow-up question
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Parent/player safety is non-negotiable — hardcoded, never weakened.
//   - Approval language is always preserved for mutation-adjacent responses.

// ── Role types ────────────────────────────────────────────────────────────────

export type DonnaResponseRole = 'director' | 'coach' | 'parent' | 'player'

// ── Allowed data scopes ───────────────────────────────────────────────────────

export type DataScope =
  | 'academy_wide'       // full academy signals, all players, all coaches
  | 'assigned_sessions'  // coach's own sessions and assigned players only
  | 'own_child_progress' // parent's linked child only, safe summaries
  | 'own_development'    // player's own missions, level, progress only

const ROLE_DATA_SCOPE: Record<DonnaResponseRole, DataScope> = {
  director: 'academy_wide',
  coach:    'assigned_sessions',
  parent:   'own_child_progress',
  player:   'own_development',
}

// ── Blocked content categories (never surface to this role) ──────────────────

const ROLE_BLOCKED_CATEGORIES: Record<DonnaResponseRole, string[]> = {
  director: [],
  coach: [
    'other_coaches_private_notes',
    'raw_director_strategy',
    'player_data_outside_assigned_groups',
  ],
  parent: [
    'raw_coach_session_notes',
    'internal_assessment_scores',
    'coach_observations_verbatim',
    'other_player_data',
    'internal_director_decisions',
    'financial_information',
  ],
  player: [
    'coach_observations_verbatim',
    'internal_assessment_scores',
    'other_player_data',
    'parent_guardian_communications',
    'financial_information',
  ],
}

// ── Required framing for mutation-adjacent responses ─────────────────────────

const APPROVAL_FRAMING: Record<DonnaResponseRole, string> = {
  director: 'Your approval is required before anything changes.',
  coach:    'This will be sent to your director for review before any changes apply.',
  parent:   "All changes to your child's program require director approval.",
  player:   'Your coach and director make all program decisions.',
}

// ── Role policy ───────────────────────────────────────────────────────────────

export interface RolePolicy {
  role: DonnaResponseRole
  dataScope: DataScope
  blockedCategories: string[]
  approvalFraming: string
  maxResponseLength: number
  useFirstPerson: boolean
  /** True when this role sees parent/player-safe language only */
  isSafeLanguageRequired: boolean
}

export function getRolePolicy(role: DonnaResponseRole): RolePolicy {
  return {
    role,
    dataScope: ROLE_DATA_SCOPE[role],
    blockedCategories: ROLE_BLOCKED_CATEGORIES[role],
    approvalFraming: APPROVAL_FRAMING[role],
    maxResponseLength: role === 'director' ? 600 : 300,
    useFirstPerson: true,
    isSafeLanguageRequired: role === 'parent' || role === 'player',
  }
}

export function applyRolePolicy(response: string, role: DonnaResponseRole): string {
  const policy = getRolePolicy(role)
  // Truncate if needed (TTS + display budget)
  if (response.length > policy.maxResponseLength) {
    const truncated = response.slice(0, policy.maxResponseLength)
    const lastSentence = Math.max(
      truncated.lastIndexOf('. '),
      truncated.lastIndexOf('? '),
      truncated.lastIndexOf('! '),
    )
    return lastSentence > policy.maxResponseLength * 0.6
      ? truncated.slice(0, lastSentence + 1)
      : truncated.slice(0, policy.maxResponseLength - 1) + '…'
  }
  return response
}

// ── ChatGPT-like response formatter ──────────────────────────────────────────
// Every DONNA response should follow: Answer → Reason → Next → Follow-up
//
// This formatter enforces the structure. Each section is optional
// (will be omitted if null/empty), but Answer is always required.

export interface ChatGptLikeResponseInput {
  answer: string
  reason?: string | null
  nextBestAction?: string | null
  followUpQuestion?: string | null
  requiresApproval?: boolean
  role?: DonnaResponseRole
}

export interface FormattedDonnaResponse {
  /** Full markdown-formatted response for display */
  display: string
  /** TTS-safe version — markdown stripped, max 200 chars */
  spoken: string
}

export function buildChatGptLikeResponse(input: ChatGptLikeResponseInput): FormattedDonnaResponse {
  const sections: string[] = [input.answer]

  if (input.reason?.trim()) {
    sections.push(`\n**Reason:**\n${input.reason}`)
  }

  if (input.requiresApproval && input.role) {
    const framing = APPROVAL_FRAMING[input.role]
    sections.push(`\n*${framing}*`)
  }

  if (input.nextBestAction?.trim()) {
    sections.push(`\n**Next:**\n${input.nextBestAction}`)
  }

  if (input.followUpQuestion?.trim()) {
    sections.push(`\n${input.followUpQuestion}`)
  }

  const display = sections.join('')

  // TTS: strip markdown, collapse whitespace, cap at 200 chars
  let spoken = display
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  if (spoken.length > 200) {
    const candidate = spoken.slice(0, 200)
    const sentEnd = Math.max(candidate.lastIndexOf('. '), candidate.lastIndexOf('? '))
    spoken = sentEnd > 120 ? candidate.slice(0, sentEnd + 1) : candidate.slice(0, 197) + '…'
  }

  return { display, spoken }
}

// ── Safety validator ──────────────────────────────────────────────────────────

/** Returns true when a response is safe to surface to the given role. */
export function isResponseSafeForRole(responseText: string, role: DonnaResponseRole): boolean {
  if (role !== 'parent' && role !== 'player') return true
  const lower = responseText.toLowerCase()
  const unsafePatterns = [
    'coach note', 'session note', 'observation', 'assessment score',
    'internal', 'raw transcript', 'confidential',
  ]
  return !unsafePatterns.some(p => lower.includes(p))
}
