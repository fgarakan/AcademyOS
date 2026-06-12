// Sprint 914.7 — DONNA Intent Router Unification V1
// Extended: Mega Sprint 1716 — DONNA Curriculum Intelligence Engine V1
//
// Bridges the legacy DonnaCommandCategory classifier and the God Mode
// 34-interceptor pipeline into a single normalized intent classification.
//
// Design: this is an ADDITIVE analysis layer — it classifies intent for
// metadata/logging/future-routing purposes but does NOT replace the existing
// routing pipeline. The 34-interceptor God Mode pipeline continues to be
// the authoritative routing mechanism for Sprint 914.7.
//
// Intent map covers:
//   - God Mode 34-interceptor patterns (page guide, brief, review, onboarding, curriculum)
//   - Legacy DonnaCommandCategory domains (attendance, observation, wrap_up, etc.)
//   - Curriculum mutation intents (1716 — V1 implemented): modify, move, expand, replace, remove
//   - Curriculum read/analysis intents (deferred — V2 LLM-assisted): review, compare, explain, recommend, audit
//
// V1 = Deterministic architect: intent classification and response generation are
//      pure TypeScript — keyword scoring, pattern matching, context inference.
//      No LLM calls. Same context always produces the same output.
//
// V2 = LLM-assisted architect: deferred. The read/analysis intents (curriculum_review,
//      curriculum_compare, curriculum_explain, curriculum_recommend, curriculum_audit)
//      require reasoning over open-ended questions that deterministic logic cannot
//      reliably answer. V2 routes these intents through an LLM call with the
//      CurriculumIntelligenceContext as the grounding payload.
//      Implementation gate: LLM orchestration layer must be production-ready first.
//
// Curriculum draft creation remains on its proven existing path.

// ── Unified intent type ────────────────────────────────────────────────────────

export type DonnaUnifiedIntentType =
  // Read-only / page-aware (God Mode 912.14 + Sprint 919)
  | 'page_guide_explain'
  | 'page_guide_actions'
  | 'page_guide_next_step'
  | 'page_guide_walk_through'
  | 'page_guide_why'
  | 'page_guide_approval'
  | 'page_guide_safety'
  // Operating intelligence (God Mode 912.17-912.19)
  | 'director_brief'
  | 'director_priority'
  | 'review_queue'
  | 'onboarding_guide'
  // Session / context (Sprint 914.x)
  | 'context_debug'
  | 'recall_conversation'
  // Curriculum (God Mode 912.8–912.11, 912.15)
  | 'curriculum_draft_create'
  | 'curriculum_draft_follow_up'
  // Curriculum mutation intents (Mega Sprint 1716 — V1 implemented, deterministic)
  | 'curriculum_modify'    // Change fields of an existing item
  | 'curriculum_move'      // Relocate item to a different level
  | 'curriculum_expand'    // Create a harder or easier variation of an existing item
  | 'curriculum_replace'   // Remove an existing item and add a replacement
  | 'curriculum_remove'    // Delete an existing item
  // Curriculum read/analysis intents (deferred — requires V2 LLM-assisted architect)
  | 'curriculum_review'    // Review the current state of a level or pathway
  | 'curriculum_compare'   // Compare two levels, pathways, or time periods
  | 'curriculum_explain'   // Explain why something is structured as it is
  | 'curriculum_recommend' // Ask DONNA to recommend curriculum additions or changes
  | 'curriculum_audit'     // Full curriculum health audit with gap analysis
  // Legacy / coach domains
  | 'attendance'
  | 'coach_observation'
  | 'coach_wrap_up'
  | 'parent_draft'
  | 'level_readiness'
  | 'academy_health'
  | 'kpi_question'
  | 'unknown'

// ── Route result ───────────────────────────────────────────────────────────────

export interface DonnaIntentRouteResult {
  /** Normalized unified intent type */
  intent: DonnaUnifiedIntentType
  /** Classification confidence */
  confidence: 'high' | 'medium' | 'low'
  /** How this intent was classified */
  source: 'regex_pipeline' | 'intent_classifier' | 'fallback'
  /** Whether this intent requires director approval before execution */
  requiresApproval: boolean
  /** Human-readable explanation of the classification */
  routeReason: string
  /** Legacy DonnaCommandCategory if applicable */
  legacyCategory?: string | null
  // Sprint 917 — Approval gate fields
  /** Approval gate category mapping for this intent (null for read-only intents) */
  approvalGateCategory: string | null
  /** Approval gate requirement for this intent */
  gateRequirement: {
    requiredLevel: string
    isHighRisk: boolean
    canBeProposed: boolean
    approvalRoute: string | null
  } | null
}

// Sprint 917 — Approval gate integration
import { requireDonnaApproval } from '@/lib/donna/donnaApprovalGate'

/** Maps unified intent types → approval gate action categories */
const INTENT_TO_APPROVAL_CATEGORY: Partial<Record<DonnaUnifiedIntentType, string>> = {
  // Curriculum — all mutation intents require review_queue
  curriculum_draft_create:    'curriculum_draft_create',
  curriculum_draft_follow_up: 'curriculum_draft_create',
  curriculum_modify:          'curriculum_edit',
  curriculum_move:            'curriculum_edit',
  curriculum_expand:          'curriculum_draft_create',
  curriculum_replace:         'curriculum_edit',
  curriculum_remove:          'curriculum_edit',
  // Read/analysis intents: no approval gate (read-only)
  // curriculum_review, curriculum_compare, curriculum_explain,
  // curriculum_recommend, curriculum_audit → null (omitted from map)
  // Other domains
  parent_draft:               'parent_communication',
  level_readiness:            'level_movement',
  attendance:                 'attendance_exception',
  coach_observation:          'recommend',
  coach_wrap_up:              'recommend',
}

// ── Regex patterns (mirror God Mode 34-interceptor patterns) ─────────────────

const PATTERNS = {
  // Page guide (Sprint 912.14 + Sprint 919)
  PAGE_EXPLAIN:    /\b(where am i|what page am i on|what.{0,10}this page|explain this page|describe this page)\b/i,
  PAGE_ACTIONS:    /\b(what can i do here|what can you help (me with )?(here|on this page))\b/i,
  PAGE_NEXT_STEP:  /\b(what should i do (here|on this page)|what.{0,10}most important (task|thing) here|what should i (click|focus on) (next|first))\b/i,
  PAGE_WALK:       /\b(walk me through (this page|here)|give me a (tour|walkthrough)|how does this (page )?work)\b/i,
  PAGE_WHY:        /\b(why does this (page )?matter|why (should|do) i (use|visit|check) (this|here)|what.{0,12}purpose.{0,12}(page|this))\b/i,
  PAGE_APPROVAL:   /\b(what needs (approval|review|approving|reviewing)|what should i (review|approve)|what requires (my )?(approval|review))\b/i,
  PAGE_SAFETY:     /\b(what should i not do|what.{0,10}risky here|what.{0,10}careful with)\b/i,
  // Brief / priority (Sprint 912.17)
  DIRECTOR_BRIEF:  /\b(give me (a |my )?(brief|briefing|status report)|director brief|academy status|what'?s? (pending|in (the )?queue)|academy doing)\b/i,
  DIRECTOR_PRIO:   /\b(what (should|do|can) i (do|focus|start) (first|today|now)|what needs? (my )?attention|most important|biggest priority)\b/i,
  // Review queue (Sprint 912.19)
  REVIEW_QUEUE:    /\b(what.{0,15}review queue|what needs (review|approval)|what curriculum drafts? (are )?(waiting|pending))\b/i,
  // Onboarding (Sprint 912.18)
  ONBOARDING:      /\b(setup checklist|what.{0,12}left.{0,12}(setup|onboarding)|am i (done|ready|finished)|finish(ed)? (the )?setup)\b/i,
  // Context / recall (Sprint 914.4, 914.3)
  CONTEXT_DEBUG:   /\b(what context do you have|what are you using for context)\b/i,
  RECALL:          /\b(what did we (discuss|talk about)|recap (our|this|the) (donna )?(conversation|chat))\b/i,
  // Curriculum creation (Sprint 912.8–912.11)
  CURRICULUM_DRILL:    /\b(add|create)\b.{0,30}\bdrill\b/i,
  CURRICULUM_GATE:     /\b(add|create)\b.{0,40}\b(assessment\s+gate|gate)\b/i,
  CURRICULUM_SKILL:    /\b(add|create)\b.{0,30}\bskill\b/i,
  CURRICULUM_FOLLOW:   /\b(same for|also for|do (that |it )?for|change.{0,10}focus.{0,5}to|actually (use|focus\s+on))\b/i,
  // Curriculum mutation intents (Mega Sprint 1716 — V1 deterministic)
  CURRICULUM_MODIFY:   /\b(change|update|edit|modify)\b.{0,50}\b(skill|drill|item|assessment|content|curriculum|cue|criteria|description|name)\b/i,
  CURRICULUM_MOVE:     /\b(move|relocate|shift)\b.{0,40}\b(to|into|from|level|ball|red|orange|green|yellow)\b/i,
  CURRICULUM_EXPAND:   /\b(expand|add\s+(a\s+)?(harder|easier|progression|regression|variation|advanced|beginner)\s+version)\b/i,
  CURRICULUM_REPLACE:  /\b(replace|swap\s*(out)?)\b.{0,40}\b(with|for)\b/i,
  CURRICULUM_REMOVE:   /\b(remove|delete|take\s+out|get\s+rid\s+of)\b.{0,40}\b(drill|skill|item|assessment|content|from\s+(the\s+)?curriculum)\b/i,
  // Curriculum read/analysis intents (deferred — V2 LLM-assisted)
  CURRICULUM_REVIEW:   /\b(show\s+me|review|what.{0,15}(in|at|for))\b.{0,30}\b(level|curriculum|content|red|orange|green|yellow)\b/i,
  CURRICULUM_COMPARE:  /\bcompare\b.{0,50}\b(level|pathway|curriculum|ball)\b/i,
  CURRICULUM_EXPLAIN:  /\b(why\s+(is|does|was|are|were)|explain)\b.{0,40}\b(curriculum|level|item|skill|drill|structure|placed|here)\b/i,
  CURRICULUM_RECOMMEND: /\b(recommend|suggest|what\s+should\s+i\s+add|what\s+(else\s+)?could\s+i\s+add|what\s+would\s+you\s+(add|suggest))\b.{0,30}\b(curriculum|level|drill|skill|content)\b/i,
  CURRICULUM_AUDIT:    /\b(audit|curriculum\s+audit|curriculum\s+health|what.{0,20}(gaps?|missing|coverage|lacking))\b/i,
  // Legacy domains
  ATTENDANCE:      /\b(attendance|absent|present|late|mark|who showed|who came)\b/i,
  OBSERVATION:     /\b(observation|observed|noticed|note about|player concern|flag|struggling with)\b/i,
  WRAP_UP:         /\b(wrap.?up|submitted|session complete|session done)\b/i,
  PARENT_DRAFT:    /\b(parent (message|update|communication)|draft.*parent|email parent)\b/i,
  LEVEL_READINESS: /\b(ready to (move up|advance|promote)|level (up|change|movement)|advancement)\b/i,
  ACADEMY_HEALTH:  /\b(academy health|how healthy|health score)\b/i,
  KPI:             /\b(kpi|metric|attendance rate|performance|development velocity)\b/i,
}

// ── Main router ────────────────────────────────────────────────────────────────

/**
 * Classifies a DONNA message into a normalized unified intent.
 * Pure function — no DB calls, no side effects, no mutations.
 * Safe to call from both client (via import) and server.
 */
export function routeDonnaIntentV1(
  text: string,
  pathname: string,
): DonnaIntentRouteResult {
  const t = text.toLowerCase().trim()

  // ── Read-only / safe intents first ─────────────────────────────────────────

  if (PATTERNS.CONTEXT_DEBUG.test(t)) return make('context_debug', 'high', false, 'Context debug pattern matched')
  if (PATTERNS.RECALL.test(t))        return make('recall_conversation', 'high', false, 'Recall pattern matched')
  if (PATTERNS.PAGE_EXPLAIN.test(t))  return make('page_guide_explain', 'high', false, 'Page explain pattern matched')
  if (PATTERNS.PAGE_ACTIONS.test(t))  return make('page_guide_actions', 'high', false, 'Page actions pattern matched')
  if (PATTERNS.PAGE_WALK.test(t))     return make('page_guide_walk_through', 'high', false, 'Page walkthrough pattern matched')
  if (PATTERNS.PAGE_WHY.test(t))      return make('page_guide_why', 'high', false, 'Page why pattern matched')
  if (PATTERNS.PAGE_NEXT_STEP.test(t)) return make('page_guide_next_step', 'high', false, 'Page next-step pattern matched')
  if (PATTERNS.PAGE_SAFETY.test(t))   return make('page_guide_safety', 'high', false, 'Page safety pattern matched')
  if (PATTERNS.PAGE_APPROVAL.test(t)) return make('page_guide_approval', 'high', false, 'Page approval pattern matched')
  if (PATTERNS.DIRECTOR_BRIEF.test(t)) return make('director_brief', 'high', false, 'Director brief pattern matched')
  if (PATTERNS.DIRECTOR_PRIO.test(t)) return make('director_priority', 'high', false, 'Director priority pattern matched')
  if (PATTERNS.REVIEW_QUEUE.test(t))  return make('review_queue', 'high', false, 'Review queue pattern matched')
  if (PATTERNS.ONBOARDING.test(t))    return make('onboarding_guide', 'high', false, 'Onboarding guide pattern matched')
  if (PATTERNS.ACADEMY_HEALTH.test(t)) return make('academy_health', 'high', false, 'Academy health pattern matched')
  if (PATTERNS.KPI.test(t))           return make('kpi_question', 'high', false, 'KPI pattern matched')

  // ── Curriculum read/analysis intents — no approval needed (deferred V2) ───
  // Checked before mutation intents: audit/recommend/review are read-only even
  // when phrased as directives ("audit my curriculum").

  if (PATTERNS.CURRICULUM_AUDIT.test(t))     return make('curriculum_audit',     'high',   false, 'Curriculum audit pattern matched')
  if (PATTERNS.CURRICULUM_RECOMMEND.test(t)) return make('curriculum_recommend', 'high',   false, 'Curriculum recommend pattern matched')
  if (PATTERNS.CURRICULUM_COMPARE.test(t))   return make('curriculum_compare',   'high',   false, 'Curriculum compare pattern matched')
  if (PATTERNS.CURRICULUM_EXPLAIN.test(t))   return make('curriculum_explain',   'medium', false, 'Curriculum explain pattern matched')
  if (PATTERNS.CURRICULUM_REVIEW.test(t))    return make('curriculum_review',    'medium', false, 'Curriculum review pattern matched')

  // ── Curriculum mutation intents (require review_queue approval) ────────────

  if (PATTERNS.CURRICULUM_REMOVE.test(t))  return make('curriculum_remove',  'high', true, 'Curriculum remove pattern matched')
  if (PATTERNS.CURRICULUM_REPLACE.test(t)) return make('curriculum_replace', 'high', true, 'Curriculum replace pattern matched')
  if (PATTERNS.CURRICULUM_MOVE.test(t))    return make('curriculum_move',    'high', true, 'Curriculum move pattern matched')
  if (PATTERNS.CURRICULUM_EXPAND.test(t))  return make('curriculum_expand',  'high', true, 'Curriculum expand pattern matched')
  if (PATTERNS.CURRICULUM_MODIFY.test(t))  return make('curriculum_modify',  'high', true, 'Curriculum modify pattern matched')

  // ── Curriculum create intents (require confirmation) ──────────────────────

  if (PATTERNS.CURRICULUM_FOLLOW.test(t)) return make('curriculum_draft_follow_up', 'high', true, 'Curriculum follow-up pattern matched')
  if (PATTERNS.CURRICULUM_DRILL.test(t))  return make('curriculum_draft_create', 'high', true, 'Drill creation pattern matched')
  if (PATTERNS.CURRICULUM_GATE.test(t))   return make('curriculum_draft_create', 'high', true, 'Gate creation pattern matched')
  if (PATTERNS.CURRICULUM_SKILL.test(t))  return make('curriculum_draft_create', 'high', true, 'Skill creation pattern matched')

  // ── Legacy / coach domains (require approval) ──────────────────────────────

  if (PATTERNS.PARENT_DRAFT.test(t))   return make('parent_draft', 'medium', true, 'Parent draft pattern matched')
  if (PATTERNS.LEVEL_READINESS.test(t)) return make('level_readiness', 'medium', true, 'Level readiness pattern matched')
  if (PATTERNS.ATTENDANCE.test(t))     return make('attendance', 'medium', true, 'Attendance pattern matched')
  if (PATTERNS.OBSERVATION.test(t))    return make('coach_observation', 'medium', true, 'Observation pattern matched')
  if (PATTERNS.WRAP_UP.test(t))        return make('coach_wrap_up', 'medium', false, 'Wrap-up pattern matched')

  return make('unknown', 'low', false, 'No pattern matched', 'fallback')
}

// ── Legacy intent map ──────────────────────────────────────────────────────────

/** Maps legacy DonnaCommandCategory → DonnaUnifiedIntentType */
export const LEGACY_CATEGORY_MAP: Record<string, DonnaUnifiedIntentType> = {
  attendance:          'attendance',
  session_actual:      'coach_wrap_up',
  coach_observation:   'coach_observation',
  parent_draft:        'parent_draft',
  level_readiness:     'level_readiness',
  curriculum_override: 'curriculum_draft_create',
  review_queue:        'review_queue',
  academy_health:      'academy_health',
  wrap_up:             'coach_wrap_up',
  unknown:             'unknown',
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function make(
  intent: DonnaUnifiedIntentType,
  confidence: DonnaIntentRouteResult['confidence'],
  requiresApproval: boolean,
  routeReason: string,
  source: DonnaIntentRouteResult['source'] = 'regex_pipeline',
  legacyCategory?: string,
): DonnaIntentRouteResult {
  // Sprint 917: attach approval gate requirement for callers that need it
  const gateCategory = INTENT_TO_APPROVAL_CATEGORY[intent] ?? null
  const gateInfo = gateCategory ? requireDonnaApproval(gateCategory) : null
  return {
    intent, confidence, source, requiresApproval, routeReason,
    legacyCategory: legacyCategory ?? null,
    approvalGateCategory: gateCategory,
    gateRequirement: gateInfo
      ? {
          requiredLevel:  gateInfo.requiredLevel,
          isHighRisk:     gateInfo.isHighRisk,
          canBeProposed:  gateInfo.canBeProposed,
          approvalRoute:  gateInfo.approvalRoute,
        }
      : null,
  }
}
