// Donna Context Retrieval Types — client-side type definitions only.
// No DB access here — see donnaContextActions.ts for the Server Action that fetches data.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DonnaContextType =
  // ── Existing (11) ──────────────────────────────────────────────────────────
  | 'academy_overview'
  | 'player_collection'
  | 'player_profile'
  | 'coach_profile'
  | 'group_context'
  | 'session_context'
  | 'class_template_collection'
  | 'fitness_template_collection'
  | 'curriculum_context'
  | 'review_queue_context'
  | 'signals_context'
  // ── Sprint 862 — Page Context Registry Foundation ──────────────────────────
  | 'session_detail'           // /director/sessions/<uuid>         — fetch: Sprint 863
  | 'class_template_detail'    // /director/class-templates/<uuid>  — fetch: Sprint 867
  | 'coach_session_context'    // /coach/sessions/<id>              — fetch: Sprint 865
  | 'coach_wrap_up_context'    // /coach/sessions/<id>/wrap-up      — fetch: Sprint 866
  | 'coach_home_context'       // /coach                            — fetch: Sprint 865
  | 'coach_players_context'    // /coach/players                    — fetch: Sprint 865

export interface DonnaContextRequest {
  contextType: DonnaContextType
  params?: {
    playerId?: string
    coachId?: string
    sessionId?: string   // Sprint 862 — session detail + coach session routes
    templateId?: string  // Sprint 862 — template detail route
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
 * Derives a context retrieval request from the current pathname and optional role.
 *
 * Route matching priority (lower number = matched first):
 *   P1  /director/players/<uuid>          → player_profile
 *   P2  /director/coaches/<uuid>          → coach_profile
 *   P3  /director/sessions/<uuid>         → session_detail        (Sprint 862)
 *   P4  /director/class-templates/<uuid>  → class_template_detail (Sprint 862)
 *   P10 /director/players                 → player_collection
 *   P11 /director/sessions                → session_context
 *   P12 /director/class-templates         → class_template_collection
 *   P13 /director/fitness                 → fitness_template_collection
 *   P14 /director/curriculum              → curriculum_context
 *   P15 /director/review                  → review_queue_context
 *   P16 /director/signals                 → signals_context
 *   P17 /director/onboarding              → academy_overview
 *   P20 /coach/sessions/<id>/wrap-up      → coach_wrap_up_context  (Sprint 862, role=coach)
 *   P21 /coach/sessions/<id>             → coach_session_context  (Sprint 862, role=coach)
 *   P22 /coach/players                    → coach_players_context  (Sprint 862, role=coach)
 *   P23 /coach/**                         → coach_home_context     (Sprint 862, role=coach)
 *   P99 fallback                          → academy_overview
 *
 * The role param (Sprint 862) gates coach-route dispatch. Directors navigating
 * to /coach/** still receive the P99 academy_overview fallback.
 * UUID routes (P1–P4) always precede their prefix siblings (P10–P12) so that
 * detail pages are never misidentified as collection pages.
 * UUID validation uses UUID_RE for P1–P4. Coach session IDs (P20–P21) use a
 * non-empty string check — UUID format confirmed in Sprint 863.
 */
export function deriveContextRequest(
  pathname: string,
  role?: 'director' | 'coach',
): DonnaContextRequest {
  // P1 — /director/players/[uuid] → player_profile with playerId
  if (/^\/director\/players\/[^/]+$/.test(pathname)) {
    const lastSegment = pathname.split('/').pop() ?? ''
    if (UUID_RE.test(lastSegment)) {
      return { contextType: 'player_profile', params: { playerId: lastSegment } }
    }
  }

  // P2 — /director/coaches/[uuid] → coach_profile with coachId
  if (/^\/director\/coaches\/[^/]+$/.test(pathname)) {
    const lastSegment = pathname.split('/').pop() ?? ''
    if (UUID_RE.test(lastSegment)) {
      return { contextType: 'coach_profile', params: { coachId: lastSegment } }
    }
  }

  // P3 — /director/sessions/[uuid] → session_detail with sessionId (Sprint 862)
  // Falls through to session_context (P11) when last segment is not a UUID (e.g. /new).
  // fetch function: fetchSessionDetailContext — implemented Sprint 863.
  // Until Sprint 863: falls to default case in fetchDonnaContext → fetchAcademyOverview.
  if (/^\/director\/sessions\/[^/]+$/.test(pathname)) {
    const lastSegment = pathname.split('/').pop() ?? ''
    if (UUID_RE.test(lastSegment)) {
      return { contextType: 'session_detail', params: { sessionId: lastSegment } }
    }
  }

  // P4 — /director/class-templates/[uuid] → class_template_detail with templateId (Sprint 862)
  // Falls through to class_template_collection (P12) when last segment is not a UUID (e.g. /new).
  // fetch function: fetchClassTemplateDetailContext — implemented Sprint 867.
  // Until Sprint 867: falls to default case in fetchDonnaContext → fetchAcademyOverview.
  if (/^\/director\/class-templates\/[^/]+$/.test(pathname)) {
    const lastSegment = pathname.split('/').pop() ?? ''
    if (UUID_RE.test(lastSegment)) {
      return { contextType: 'class_template_detail', params: { templateId: lastSegment } }
    }
  }

  // P10–P17 — Director prefix routes (preserved exactly from pre-862)
  if (pathname.startsWith('/director/players'))         return { contextType: 'player_collection' }
  if (pathname.startsWith('/director/coaches'))         return { contextType: 'academy_overview' }
  if (pathname.startsWith('/director/sessions'))        return { contextType: 'session_context' }
  if (pathname.startsWith('/director/class-templates')) return { contextType: 'class_template_collection' }
  if (pathname.startsWith('/director/fitness'))         return { contextType: 'fitness_template_collection' }
  if (pathname.startsWith('/director/curriculum'))      return { contextType: 'curriculum_context' }
  if (pathname.startsWith('/director/review'))          return { contextType: 'review_queue_context' }
  if (pathname.startsWith('/director/signals'))         return { contextType: 'signals_context' }
  if (pathname.startsWith('/director/onboarding'))      return { contextType: 'academy_overview' }

  // P20–P23 — Coach routes (Sprint 862)
  // Gated by role === 'coach'. Directors navigating /coach/** fall through to P99.
  // fetch functions implemented in Sprint 865 (home/session/players) and Sprint 866 (wrap-up).
  // Until those sprints: falls to default in fetchDonnaContext → fetchAcademyOverview.
  if (role === 'coach') {
    // P20 — /coach/sessions/<id>/wrap-up (must be matched before P21 session)
    const coachWrapUp = pathname.match(/^\/coach\/sessions\/([^/]+)\/wrap-up$/)
    if (coachWrapUp?.[1]) {
      return { contextType: 'coach_wrap_up_context', params: { sessionId: coachWrapUp[1] } }
    }
    // P21 — /coach/sessions/<id>
    const coachSession = pathname.match(/^\/coach\/sessions\/([^/]+)$/)
    if (coachSession?.[1]) {
      return { contextType: 'coach_session_context', params: { sessionId: coachSession[1] } }
    }
    // P22 — /coach/players
    if (pathname.startsWith('/coach/players')) return { contextType: 'coach_players_context' }
    // P23 — /coach (hub + all other coach routes as fallback)
    if (pathname.startsWith('/coach')) return { contextType: 'coach_home_context' }
  }

  // P99 — Default for /director dashboard and any other route
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
