// Donna Context Retrieval Types — client-side type definitions only.
// No DB access here — see donnaContextActions.ts for the Server Action that fetches data.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DonnaContextType =
  | 'academy_overview'
  | 'player_collection'
  | 'player_profile'
  | 'group_context'
  | 'session_context'
  | 'class_template_collection'
  | 'fitness_template_collection'
  | 'curriculum_context'
  | 'review_queue_context'
  | 'signals_context'

export interface DonnaContextRequest {
  contextType: DonnaContextType
  params?: {
    playerId?: string
  }
}

export interface DonnaContextSummary {
  contextType: DonnaContextType
  title: string
  summary: string
  keyFacts: string[]
  openQuestions: string[]
  suggestedNextSteps: string[]
  dataUsed: string[]
  missingData: string[]
  safetyNotes: string[]
  /** Inputs available for future Donna predictions — Phase 9 readiness */
  recommendationInputsAvailable: string[]
  recommendationInputsMissing: string[]
  /** Which Donna suggestion types could apply to this context — not active yet */
  possibleSuggestionTypes: string[]
  fetchedAt: string
}

// ---------------------------------------------------------------------------
// Route → context type mapping
// ---------------------------------------------------------------------------

// UUID pattern — used to distinguish /players/[uuid] from /players/import, /players/new, etc.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Derives a context retrieval request from the current pathname.
 * Used by DonnaAssistantButton to know which context to fetch on "Ask about this page."
 */
export function deriveContextRequest(pathname: string): DonnaContextRequest {
  // /director/players/[uuid] → player_profile with playerId
  if (/^\/director\/players\/[^/]+$/.test(pathname)) {
    const lastSegment = pathname.split('/').pop() ?? ''
    if (UUID_RE.test(lastSegment)) {
      return { contextType: 'player_profile', params: { playerId: lastSegment } }
    }
  }

  if (pathname.startsWith('/director/players'))         return { contextType: 'player_collection' }
  if (pathname.startsWith('/director/sessions'))        return { contextType: 'session_context' }
  if (pathname.startsWith('/director/class-templates')) return { contextType: 'class_template_collection' }
  if (pathname.startsWith('/director/fitness'))         return { contextType: 'fitness_template_collection' }
  if (pathname.startsWith('/director/curriculum'))      return { contextType: 'curriculum_context' }
  if (pathname.startsWith('/director/review'))          return { contextType: 'review_queue_context' }
  if (pathname.startsWith('/director/signals'))         return { contextType: 'signals_context' }
  if (pathname.startsWith('/director/onboarding'))      return { contextType: 'academy_overview' }

  // Default for /director dashboard and any other route
  return { contextType: 'academy_overview' }
}

// ---------------------------------------------------------------------------
// Helper — build an honest fallback summary when data cannot be retrieved
// ---------------------------------------------------------------------------

export function makeFallbackSummary(
  contextType: DonnaContextType,
  reason: string,
): DonnaContextSummary {
  return {
    contextType,
    title: 'Context unavailable',
    summary: reason,
    keyFacts: [],
    openQuestions: [],
    suggestedNextSteps: ['Sign in and return to this page to try again.'],
    dataUsed: [],
    missingData: ['Session or academy context could not be resolved.'],
    safetyNotes: ['No data was read or returned.'],
    recommendationInputsAvailable: [],
    recommendationInputsMissing: ['academy_id', 'auth_session'],
    possibleSuggestionTypes: [],
    fetchedAt: new Date().toISOString(),
  }
}
