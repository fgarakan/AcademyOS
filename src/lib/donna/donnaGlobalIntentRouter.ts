// DONNA Global Intent Router V1
//
// Classifies natural language questions into structured intents.
// Deterministic pattern matching — no LLM required for classification.
// The LLM is invoked only for freeform questions that don't match a known intent.
//
// Design:
//   - 30+ intents across 8 categories
//   - Each intent has: keywords, patterns, requiredData, pageContext hints
//   - Returns { intent, confidence, category, requiredData }
//   - Falls back to 'freeform_question' for unknown inputs
//
// Pure TypeScript — no DB, no API, no mutations, no side effects.

// ── Intent taxonomy ───────────────────────────────────────────────────────────

export type IntentCategory =
  | 'player_status'
  | 'assessment'
  | 'placement'
  | 'level_readiness'
  | 'coach_workflow'
  | 'parent_communication'
  | 'academy_health'
  | 'navigation_action'
  | 'freeform'

export type DonnaIntent =
  // Player status
  | 'summarize_player'
  | 'player_readiness'
  | 'player_blockers'
  | 'player_progress'
  | 'player_missions'
  | 'player_parent_summary'
  | 'players_needing_attention'
  | 'stalled_players'
  // Assessment
  | 'due_assessments'
  | 'overdue_assessments'
  | 'submitted_assessments'
  | 'start_assessment'
  | 'compare_assessments'
  // Placement
  | 'explain_placement_recommendation'
  | 'pending_placements'
  | 'placement_overrides'
  // Level readiness
  | 'level_review_candidates'
  | 'explain_level_blockers'
  | 'create_level_readiness_review'
  // Coach workflow
  | 'today_sessions'
  | 'coach_watch_fors'
  | 'missing_wrapups'
  | 'coach_assessment_submissions'
  // Parent communication
  | 'pending_parent_updates'
  | 'draft_parent_update'
  | 'explain_parent_progress'
  // Academy health
  | 'academy_attention_today'
  | 'overloaded_groups'
  | 'curriculum_gaps'
  | 'missing_data'
  // Navigation / action
  | 'go_to_player'
  | 'go_to_approvals'
  | 'go_to_assessments'
  | 'assign_mission'
  | 'add_player'
  | 'resume_onboarding'
  // Freeform
  | 'freeform_question'

export type DataRequirement =
  | 'player_profile'          // single player context
  | 'player_list'             // all players in academy
  | 'blueprint'               // player development blueprint
  | 'missions'                // player missions
  | 'assessments'             // assessment history
  | 'assessment_events'       // scheduled/completed assessment events
  | 'curriculum_gates'        // level gate status
  | 'placement_recommendation'// DONNA placement recommendation
  | 'coach_sessions'          // today's sessions (coach context)
  | 'proposed_actions'        // pending review items
  | 'parent_summary'          // parent-safe development summary
  | 'academy_health'          // academy-level signals
  | 'groups'                  // group capacity/membership
  | 'none'                    // no data needed (navigation only)

export interface IntentClassification {
  intent: DonnaIntent
  category: IntentCategory
  /** 0–100: how confident the router is in this classification */
  confidence: number
  /** Data sources needed to answer this question */
  requiredData: DataRequirement[]
  /** Extracted entity — player name or "all" */
  playerNameHint: string | null
  /** Whether this intent can be answered on the current page alone */
  requiresGlobalData: boolean
  /** Original normalized question */
  normalizedQuestion: string
}

// ── Pattern definitions ────────────────────────────────────────────────────────

interface IntentPattern {
  intent: DonnaIntent
  category: IntentCategory
  patterns: RegExp[]
  keywords: string[]
  requiredData: DataRequirement[]
  requiresGlobalData: boolean
}

const INTENT_PATTERNS: IntentPattern[] = [
  // ── Player status ───────────────────────────────────────────────────────────
  {
    intent: 'summarize_player',
    category: 'player_status',
    patterns: [/summarize\s+(\w+)/i, /tell me about\s+(\w+)/i, /who is\s+(\w+)/i, /show me\s+(\w+)/i],
    keywords: ['summarize', 'summary', 'overview', 'profile', 'tell me about'],
    requiredData: ['player_profile', 'blueprint', 'missions', 'assessments'],
    requiresGlobalData: false,
  },
  {
    intent: 'player_readiness',
    category: 'player_status',
    patterns: [/is\s+(\w+)\s+ready/i, /readiness\s+for\s+(\w+)/i, /ready for (next|orange|red|green|yellow|level)/i],
    keywords: ['ready', 'readiness', 'level up', 'advance', 'promotion'],
    requiredData: ['player_profile', 'curriculum_gates', 'assessments', 'missions'],
    requiresGlobalData: false,
  },
  {
    intent: 'player_blockers',
    category: 'player_status',
    patterns: [/why.+(not|isn't|isnt)\s+ready/i, /what.+block(ing|s)/i, /what.+stop(ping|s)/i, /what.+prevent(ing|s)/i],
    keywords: ['blocking', 'blocker', 'not ready', "isn't ready", 'preventing', 'stopping', 'why not'],
    requiredData: ['player_profile', 'curriculum_gates', 'assessments', 'missions'],
    requiresGlobalData: false,
  },
  {
    intent: 'player_progress',
    category: 'player_status',
    patterns: [/what.+(changed|improved|progress)/i, /how.+(doing|progressing)/i, /progress\s+(for|of|on)/i],
    keywords: ['progress', 'improved', 'changed', 'how doing', 'development', 'growth'],
    requiredData: ['player_profile', 'blueprint', 'assessments'],
    requiresGlobalData: false,
  },
  {
    intent: 'player_missions',
    category: 'player_status',
    patterns: [/mission(s)?\s+for\s+(\w+)/i, /what.+miss?ions?/i, /active miss?ions?/i],
    keywords: ['missions', 'mission', 'active mission'],
    requiredData: ['missions', 'player_profile'],
    requiresGlobalData: false,
  },
  {
    intent: 'player_parent_summary',
    category: 'player_status',
    patterns: [/what.+tell.+(parent|mom|dad|family)/i, /parent.+(know|update|summary)/i, /parent.+message/i],
    keywords: ['parent', 'tell parent', 'parent summary', 'parent update', 'family'],
    requiredData: ['parent_summary', 'player_profile'],
    requiresGlobalData: false,
  },
  {
    intent: 'players_needing_attention',
    category: 'player_status',
    patterns: [/who.+(need(s)?\s+attention|need(s)?\s+help)/i, /players?\s+need(ing)?\s+attention/i, /who\s+needs?\s+review/i],
    keywords: ['needs attention', 'need attention', 'who needs', 'attention today', 'needs help'],
    requiredData: ['player_list', 'academy_health'],
    requiresGlobalData: true,
  },
  {
    intent: 'stalled_players',
    category: 'player_status',
    patterns: [/stall(ed|ing)\s+player/i, /not\s+progressing/i, /no\s+progress/i, /stuck/i],
    keywords: ['stalled', 'stuck', 'not progressing', 'no progress', 'behind'],
    requiredData: ['player_list', 'academy_health'],
    requiresGlobalData: true,
  },

  // ── Assessment ──────────────────────────────────────────────────────────────
  {
    intent: 'overdue_assessments',
    category: 'assessment',
    patterns: [/overdue\s+assessment/i, /assessment(s)?\s+overdue/i, /who.+overdue/i, /overdue\s+reasses?sment/i],
    keywords: ['overdue assessment', 'overdue', 'past due', 'overdue reassessment'],
    requiredData: ['player_list', 'assessment_events'],
    requiresGlobalData: true,
  },
  {
    intent: 'due_assessments',
    category: 'assessment',
    patterns: [/due\s+for\s+reasses?sment/i, /assessment(s)?\s+due/i, /who.+due\s+for/i, /upcoming\s+assessment/i],
    keywords: ['due for reassessment', 'assessment due', 'upcoming assessment', 'needs reassessment'],
    requiredData: ['player_list', 'assessment_events'],
    requiresGlobalData: true,
  },
  {
    intent: 'submitted_assessments',
    category: 'assessment',
    patterns: [/assessment(s)?\s+submit/i, /submitted\s+assessment/i, /recent\s+assessment/i, /completed\s+assessment/i],
    keywords: ['submitted assessment', 'recent assessment', 'completed assessment'],
    requiredData: ['assessment_events'],
    requiresGlobalData: true,
  },
  {
    intent: 'start_assessment',
    category: 'assessment',
    patterns: [/start\s+assessment/i, /new\s+assessment/i, /create\s+assessment/i, /run\s+assessment/i],
    keywords: ['start assessment', 'new assessment', 'create assessment', 'begin assessment'],
    requiredData: ['player_profile'],
    requiresGlobalData: false,
  },
  {
    intent: 'compare_assessments',
    category: 'assessment',
    patterns: [/compar(e|ing)\s+assessment/i, /what.+changed\s+since/i, /before\s+and\s+after/i, /improvement\s+since/i],
    keywords: ['compare assessment', 'changed since', 'before after', 'improvement since'],
    requiredData: ['assessments'],
    requiresGlobalData: false,
  },

  // ── Placement ───────────────────────────────────────────────────────────────
  {
    intent: 'explain_placement_recommendation',
    category: 'placement',
    patterns: [/why.+(recommend|place(d)?).+(orange|red|green|yellow|level|group)/i, /explain.+placement/i, /why.+orange\s*\d/i, /why.+placed/i],
    keywords: ['explain placement', 'why recommended', 'why placed', 'placement reason', 'why orange', 'why red'],
    requiredData: ['placement_recommendation', 'assessments'],
    requiresGlobalData: false,
  },
  {
    intent: 'pending_placements',
    category: 'placement',
    patterns: [/pending\s+placement/i, /placement(s)?\s+pending/i, /need(s)?\s+placement/i, /waiting\s+for\s+placement/i],
    keywords: ['pending placement', 'needs placement', 'waiting placement', 'unplaced'],
    requiredData: ['player_list', 'proposed_actions'],
    requiresGlobalData: true,
  },

  // ── Level readiness ─────────────────────────────────────────────────────────
  {
    intent: 'level_review_candidates',
    category: 'level_readiness',
    patterns: [/ready\s+for\s+(level|advancement|next level)/i, /level\s+up\s+candidates?/i, /who.+ready\s+to\s+advance/i, /advancement\s+candidates?/i],
    keywords: ['ready for level', 'level up candidates', 'ready to advance', 'advancement candidates'],
    requiredData: ['player_list', 'curriculum_gates'],
    requiresGlobalData: true,
  },
  {
    intent: 'explain_level_blockers',
    category: 'level_readiness',
    patterns: [/what.+block(ing|s).+level/i, /why.+not.+(advance|move up)/i, /level.+block(er|ing)/i],
    keywords: ['blocking level', 'level blocker', 'not advancing', 'cannot advance'],
    requiredData: ['player_profile', 'curriculum_gates', 'assessments', 'missions'],
    requiresGlobalData: false,
  },
  {
    intent: 'create_level_readiness_review',
    category: 'level_readiness',
    patterns: [/create\s+level\s+review/i, /start\s+level\s+(review|readiness)/i, /initiate\s+level\s+review/i],
    keywords: ['create level review', 'start level review', 'level readiness review'],
    requiredData: ['player_profile', 'curriculum_gates'],
    requiresGlobalData: false,
  },

  // ── Coach workflow ──────────────────────────────────────────────────────────
  {
    intent: 'today_sessions',
    category: 'coach_workflow',
    patterns: [/today.+(session|class)/i, /session(s)?\s+today/i, /what.+today/i, /what.+schedule/i],
    keywords: ['today session', 'sessions today', 'what today', 'schedule', "today's class"],
    requiredData: ['coach_sessions'],
    requiresGlobalData: false,
  },
  {
    intent: 'coach_watch_fors',
    category: 'coach_workflow',
    patterns: [/watch\s+for/i, /what.+observe/i, /what.+look\s+for/i, /focus\s+(on|today)/i],
    keywords: ['watch for', 'observe', 'look for', 'focus today', 'what to watch'],
    requiredData: ['player_profile', 'blueprint', 'missions'],
    requiresGlobalData: false,
  },
  {
    intent: 'missing_wrapups',
    category: 'coach_workflow',
    patterns: [/missing\s+wrap.?up/i, /overdue\s+wrap.?up/i, /wrap.?up(s)?\s+(missing|needed|overdue)/i, /haven.t\s+submit/i],
    keywords: ['missing wrapup', 'overdue wrapup', 'wrap-up needed', 'missing wrap-up', 'submit wrap-up'],
    requiredData: ['proposed_actions'],
    requiresGlobalData: true,
  },

  // ── Parent communication ────────────────────────────────────────────────────
  {
    intent: 'pending_parent_updates',
    category: 'parent_communication',
    patterns: [/pending\s+parent\s+update/i, /parent\s+update(s)?\s+pending/i, /parent\s+communication(s)?\s+pending/i, /parent\s+message(s)?\s+to\s+review/i],
    keywords: ['pending parent update', 'parent updates', 'parent communication pending'],
    requiredData: ['proposed_actions'],
    requiresGlobalData: true,
  },
  {
    intent: 'draft_parent_update',
    category: 'parent_communication',
    patterns: [/draft\s+(a\s+)?parent\s+update/i, /write\s+(a\s+)?parent\s+(update|message)/i, /create\s+(a\s+)?parent\s+(update|message)/i],
    keywords: ['draft parent update', 'write parent update', 'create parent message'],
    requiredData: ['player_profile', 'parent_summary', 'blueprint'],
    requiresGlobalData: false,
  },

  // ── Academy health ──────────────────────────────────────────────────────────
  {
    intent: 'academy_attention_today',
    category: 'academy_health',
    patterns: [/what.+(needs?|need(s)?)\s+attention/i, /attention\s+today/i, /what.+do\s+first/i, /what.+most\s+urgent/i, /today.+priorities/i],
    keywords: ['needs attention', 'what first', 'most urgent', 'attention today', "today's priorities"],
    requiredData: ['academy_health', 'proposed_actions'],
    requiresGlobalData: true,
  },
  {
    intent: 'missing_data',
    category: 'academy_health',
    patterns: [/missing\s+data/i, /no\s+assessment/i, /no\s+curriculum\s+level/i, /incomplete\s+(profile|data)/i],
    keywords: ['missing data', 'no assessment', 'no curriculum level', 'incomplete profile'],
    requiredData: ['player_list', 'academy_health'],
    requiresGlobalData: true,
  },
  {
    intent: 'curriculum_gaps',
    category: 'academy_health',
    patterns: [/curriculum\s+gap/i, /gap(s)?\s+in\s+curriculum/i, /curriculum\s+coverage/i, /missing\s+curriculum/i],
    keywords: ['curriculum gaps', 'curriculum coverage', 'curriculum missing'],
    requiredData: ['academy_health'],
    requiresGlobalData: true,
  },

  // ── Navigation / action ─────────────────────────────────────────────────────
  {
    intent: 'go_to_approvals',
    category: 'navigation_action',
    patterns: [/go\s+to\s+approval/i, /open\s+approval/i, /show\s+(me\s+)?approval/i, /review\s+queue/i],
    keywords: ['go to approvals', 'open approvals', 'show approvals', 'review queue'],
    requiredData: ['none'],
    requiresGlobalData: false,
  },
  {
    intent: 'go_to_assessments',
    category: 'navigation_action',
    patterns: [/go\s+to\s+assessment/i, /open\s+assessment/i, /show\s+(me\s+)?assessment/i],
    keywords: ['go to assessments', 'open assessments', 'show assessments'],
    requiredData: ['none'],
    requiresGlobalData: false,
  },
  {
    intent: 'assign_mission',
    category: 'navigation_action',
    patterns: [/assign\s+(a\s+)?mission/i, /add\s+(a\s+)?mission/i, /create\s+(a\s+)?mission/i, /give\s+(\w+)\s+(a\s+)?mission/i],
    keywords: ['assign mission', 'add mission', 'create mission', 'give mission'],
    requiredData: ['player_profile', 'blueprint'],
    requiresGlobalData: false,
  },
  {
    intent: 'draft_parent_update',
    category: 'parent_communication',
    patterns: [/draft\s+(a\s+)?parent/i, /parent\s+update\s+for/i],
    keywords: ['draft parent', 'parent update for'],
    requiredData: ['player_profile', 'parent_summary'],
    requiresGlobalData: false,
  },
  // ── Resume onboarding ───────────────────────────────────────────────────────
  {
    intent: 'resume_onboarding',
    category: 'navigation_action',
    patterns: [
      /resume\s+onboarding/i,
      /who.+(still|hasn.t|needs to).+(onboard|be placed|be activated)/i,
      /pending\s+(player|onboard|placement)/i,
      /players?\s+(waiting|not\s+yet|still\s+pending)/i,
      /finish\s+(onboarding|placing)\s+(\w+)/i,
      /continue\s+onboarding/i,
    ],
    keywords: [
      'resume onboarding', 'continue onboarding', 'pending players',
      'pending placement', 'who needs to be placed', 'still onboarding',
      'not yet activated', 'waiting for placement',
    ],
    requiredData: ['player_list'],
    requiresGlobalData: true,
  },
  // ── Add player ──────────────────────────────────────────────────────────────
  {
    intent: 'add_player',
    category: 'navigation_action',
    patterns: [
      /add\s+(a\s+)?new\s+player/i,
      /add\s+(a\s+)?player/i,
      /create\s+(a\s+)?player/i,
      /onboard\s+(a\s+)?player/i,
      /new\s+student/i,
      /register\s+(a\s+)?player/i,
    ],
    keywords: ['add player', 'new player', 'create player', 'onboard player', 'new student', 'add a player', 'add a new player'],
    requiredData: ['none'],
    requiresGlobalData: false,
  },
]

// ── Player name extraction ────────────────────────────────────────────────────

function extractPlayerName(question: string): string | null {
  // Common patterns: "for Jamie", "about Jamie", "summarize Jamie", "Jamie's"
  const patterns = [
    /\bfor\s+([A-Z][a-z]+)\b/,
    /\babout\s+([A-Z][a-z]+)\b/,
    /\bsummarize\s+([A-Z][a-z]+)\b/,
    /\bwhy\s+is\s+([A-Z][a-z]+)\b/,
    /\bwhy\s+isn't\s+([A-Z][a-z]+)\b/,
    /\bwhy\s+isnt\s+([A-Z][a-z]+)\b/,
    /\bwhat\s+should\s+([A-Z][a-z]+)\b/,
    /\bis\s+([A-Z][a-z]+)\s+ready\b/,
    /\b([A-Z][a-z]+)'s\s+(readiness|progress|mission|level)/,
    /\bgive\s+([A-Z][a-z]+)\b/,
    /\bassign\s+([A-Z][a-z]+)\b/,
  ]

  for (const p of patterns) {
    const m = question.match(p)
    if (m?.[1]) return m[1]
  }
  return null
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function scoreIntent(question: string, pattern: IntentPattern): number {
  const q = question.toLowerCase()
  let score = 0

  // Pattern matches → high confidence
  for (const rx of pattern.patterns) {
    if (rx.test(question)) {
      score += 60
      break
    }
  }

  // Keyword matches → medium confidence
  let keywordHits = 0
  for (const kw of pattern.keywords) {
    if (q.includes(kw.toLowerCase())) {
      keywordHits++
    }
  }
  score += Math.min(keywordHits * 15, 40)

  return Math.min(score, 100)
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Classify a natural language question into a structured DONNA intent.
 * Deterministic — no LLM, no DB calls, no side effects.
 *
 * @param question The user's question or command
 * @param pageContext Optional page context to resolve ambiguous questions
 */
export function classifyDonnaIntent(
  question: string,
  pageContext?: { route?: string; hasPlayerContext?: boolean },
): IntentClassification {
  const normalized = question.trim()
  const playerNameHint = extractPlayerName(normalized)

  let bestMatch: { pattern: IntentPattern; score: number } | null = null

  for (const pattern of INTENT_PATTERNS) {
    const score = scoreIntent(normalized, pattern)
    if (score > 0 && (bestMatch === null || score > bestMatch.score)) {
      bestMatch = { pattern, score }
    }
  }

  // Page-context disambiguation for short/ambiguous questions
  if (bestMatch === null || bestMatch.score < 30) {
    const q = normalized.toLowerCase()

    if (pageContext?.hasPlayerContext) {
      if (q === 'why?' || q === 'why') {
        return {
          intent: 'explain_placement_recommendation',
          category: 'placement',
          confidence: 75,
          requiredData: ['placement_recommendation', 'assessments', 'curriculum_gates'],
          playerNameHint,
          requiresGlobalData: false,
          normalizedQuestion: normalized,
        }
      }
      if (q.includes('ready') || q.includes('level')) {
        return {
          intent: 'player_readiness',
          category: 'player_status',
          confidence: 75,
          requiredData: ['curriculum_gates', 'assessments', 'missions'],
          playerNameHint,
          requiresGlobalData: false,
          normalizedQuestion: normalized,
        }
      }
    }

    if (pageContext?.route?.includes('/approvals') || pageContext?.route?.includes('/review')) {
      if (q.includes('first') || q.includes('urgent') || q.includes('start')) {
        return {
          intent: 'academy_attention_today',
          category: 'academy_health',
          confidence: 70,
          requiredData: ['proposed_actions', 'academy_health'],
          playerNameHint: null,
          requiresGlobalData: true,
          normalizedQuestion: normalized,
        }
      }
    }

    // Freeform fallback
    return {
      intent: 'freeform_question',
      category: 'freeform',
      confidence: 0,
      requiredData: ['academy_health'],
      playerNameHint,
      requiresGlobalData: false,
      normalizedQuestion: normalized,
    }
  }

  return {
    intent: bestMatch.pattern.intent,
    category: bestMatch.pattern.category,
    confidence: bestMatch.score,
    requiredData: bestMatch.pattern.requiredData,
    playerNameHint,
    requiresGlobalData: bestMatch.pattern.requiresGlobalData,
    normalizedQuestion: normalized,
  }
}
