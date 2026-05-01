'use server'

import { getSupabaseServer } from '@/lib/supabase/server'

export interface CurriculumOverrideDraftPayload {
  draft_type: 'curriculum_override_v1'
  raw_input: string
  parsed_level: string | null
  parsed_pathway: string | null
  parsed_focus: string[]
  parsed_scope: string | null
  affected_targets_guess: string[]
  proposed_change_summary: string
  clarification_questions: string[]
  warnings: string[]
}

export interface CreateCurriculumOverrideDraftResult {
  ok: boolean
  error: string | null
  proposedActionId: string | null
}

// ──────────────────────────────────────────────
// Deterministic parser V1
// No AI API. Pattern matching only.
// ──────────────────────────────────────────────

const LEVEL_PATTERNS: Array<[RegExp, string]> = [
  [/\borange\s*3\b/i,  'Orange 3 — Construction'],
  [/\borange\s*2\b/i,  'Orange 2 — Direction'],
  [/\borange\s*1\b/i,  'Orange 1 — Rally'],
  [/\bgreen\s*3\b/i,   'Green 3 — Identity'],
  [/\bgreen\s*2\b/i,   'Green 2 — Variety'],
  [/\bgreen\s*1\b/i,   'Green 1 — Pressure'],
  [/\bred\s*3\b/i,     'Red 3 — Consistency'],
  [/\bred\s*2\b/i,     'Red 2 — Contact'],
  [/\bred\s*1\b/i,     'Red 1 — Discovery'],
  [/\byellow\s*3\b/i,  'Yellow 3 — Win'],
  [/\byellow\s*2\b/i,  'Yellow 2 — Construct'],
  [/\byellow\s*1\b/i,  'Yellow 1 — Compete'],
  [/\bhp\s*3\b/i,      'HP 3 — Professional'],
  [/\bhp\s*2\b/i,      'HP 2 — Compete Elite'],
  [/\bhp\s*1\b/i,      'HP 1 — Specialise'],
  [/\borange\s+ball\b/i, 'Orange Ball'],
  [/\bgreen\s+ball\b/i,  'Green Ball'],
  [/\bred\s+ball\b/i,    'Red Ball'],
  [/\byellow\b/i,        'Yellow'],
  [/\borange\b/i,        'Orange'],
  [/\bgreen\b/i,         'Green'],
  [/\bred\b/i,           'Red'],
]

const PATHWAY_PATTERNS: Array<[RegExp, string]> = [
  [/\bcompetition\s+path\b/i,   'competition'],
  [/\bmatch\s+play\b/i,         'competition'],
  [/\bcompetition\b/i,          'competition'],
  [/\bfitness\b/i,              'fitness'],
  [/\bmovement\b/i,             'fitness'],
  [/\bphysical\b/i,             'fitness'],
  [/\btechni(?:que|cal)\b/i,    'skill'],
  [/\bskill\b/i,                'skill'],
]

const FOCUS_KEYWORDS: Array<[RegExp, string]> = [
  [/\breturn[- ]of[- ]serve\b/i,    'return-of-serve'],
  [/\breturn\b/i,                   'return'],
  [/\bserve\b/i,                    'serve'],
  [/\brally\b/i,                    'rally'],
  [/\bdirection\b/i,                'direction'],
  [/\bconstruction\b/i,             'construction'],
  [/\brecovery\b/i,                 'recovery'],
  [/\bpoint[- ]start\b/i,           'point-start'],
  [/\bcross[- ]court\b/i,           'cross-court'],
  [/\bdown[- ]the[- ]line\b/i,      'down-the-line'],
  [/\bfootwork\b/i,                 'footwork'],
  [/\bmovement\b/i,                 'movement'],
  [/\bvolley\b/i,                   'volley'],
  [/\bapproach\b/i,                 'approach'],
  [/\bgroundstroke\b/i,             'groundstroke'],
  [/\bforehand\b/i,                 'forehand'],
  [/\bbackhand\b/i,                 'backhand'],
  [/\btactical\b/i,                 'tactical'],
  [/\baggression\b/i,               'aggression'],
  [/\bconsistency\b/i,              'consistency'],
  [/\bdepth\b/i,                    'depth'],
  [/\btopsin\b/i,                   'topspin'],
  [/\bslice\b/i,                    'slice'],
]

const SCOPE_PATTERNS: Array<[RegExp, string]> = [
  [/\bacademy[- ]wide\b/i,                         'academy'],
  [/\bacademy\s+curriculum\b/i,                    'academy'],
  [/\ball\s+\w+\s+groups?\b/i,                    'academy'],
  [/\bfor\s+all\b/i,                               'academy'],
  [/\bthis\s+group\b/i,                            'group'],
  [/\bone\s+group\b/i,                             'group'],
  [/\bour\s+group\b/i,                             'group'],
  [/\bone\s+session\b/i,                           'session'],
  [/\bthis\s+session\b/i,                          'session'],
  [/\bprogram\b/i,                                 'program'],
]

function parseOverrideInput(raw: string): Omit<CurriculumOverrideDraftPayload, 'draft_type' | 'raw_input' | 'affected_targets_guess' | 'proposed_change_summary' | 'clarification_questions' | 'warnings'> {
  let parsedLevel: string | null = null
  for (const [pattern, label] of LEVEL_PATTERNS) {
    if (pattern.test(raw)) {
      parsedLevel = label
      break
    }
  }

  let parsedPathway: string | null = null
  for (const [pattern, label] of PATHWAY_PATTERNS) {
    if (pattern.test(raw)) {
      parsedPathway = label
      break
    }
  }

  const parsedFocus: string[] = []
  for (const [pattern, keyword] of FOCUS_KEYWORDS) {
    if (pattern.test(raw) && !parsedFocus.includes(keyword)) {
      parsedFocus.push(keyword)
    }
  }

  let parsedScope: string | null = null
  for (const [pattern, scope] of SCOPE_PATTERNS) {
    if (pattern.test(raw)) {
      parsedScope = scope
      break
    }
  }

  return { parsed_level: parsedLevel, parsed_pathway: parsedPathway, parsed_focus: parsedFocus, parsed_scope: parsedScope }
}

function buildChangeContext(
  parsedLevel: string | null,
  parsedPathway: string | null,
  parsedFocus: string[],
  parsedScope: string | null,
  raw: string,
): {
  affected_targets_guess: string[]
  proposed_change_summary: string
  clarification_questions: string[]
  warnings: string[]
} {
  const warnings: string[] = []
  const clarification_questions: string[] = []
  const affected: string[] = []

  if (!parsedLevel) {
    warnings.push('Could not detect a specific curriculum level from your input.')
    clarification_questions.push('Which curriculum level does this apply to? (e.g., Orange 1, Orange 2, Green 1)')
  } else {
    affected.push(`Curriculum level: ${parsedLevel}`)
    affected.push('Track requirements for this level')
    affected.push('Template block population for this level')
    affected.push('Coach session cues for this level')
    affected.push('Player level-up requirements')
  }

  if (!parsedScope) {
    clarification_questions.push('What scope should this apply to? (one session / this group / all groups at this level / academy curriculum)')
  }

  if (parsedFocus.length === 0) {
    warnings.push('Could not detect specific content focus area from your input.')
    clarification_questions.push('What skill or content area should be emphasized? (e.g., return-of-serve, serve, rally direction)')
  }

  const focusStr = parsedFocus.length > 0 ? parsedFocus.join(', ') : 'unspecified focus'
  const levelStr = parsedLevel ?? 'unspecified level'
  const pathwayStr = parsedPathway ? ` (${parsedPathway} pathway)` : ''
  const scopeStr = parsedScope ? ` — scope: ${parsedScope}` : ''

  const proposed_change_summary =
    `Increase emphasis on ${focusStr} at ${levelStr}${pathwayStr}${scopeStr}. ` +
    `This override would adjust content weighting, template population, and coaching cues for the affected level. ` +
    (clarification_questions.length > 0 ? 'Review clarification questions before approving.' : 'No open questions detected.')

  return {
    affected_targets_guess: affected,
    proposed_change_summary,
    clarification_questions,
    warnings,
  }
}

export async function createCurriculumOverrideDraftAction(
  rawInput: string,
): Promise<CreateCurriculumOverrideDraftResult> {
  const fail = (error: string): CreateCurriculumOverrideDraftResult =>
    ({ ok: false, error, proposedActionId: null })

  if (!rawInput?.trim()) return fail('Input is required.')
  if (rawInput.length > 2000) return fail('Input must be 2000 characters or fewer.')

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')

  // 2. Resolve academy_id from authenticated profile — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return fail('Academy context unavailable.')
  const academyId = profile.academy_id

  // 3. Verify active academy membership — director or head_coach only
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return fail('You do not have permission to create curriculum override drafts.')
  }

  const rawDb = supabase as any

  // 4. Resolve active academy curriculum version
  const { data: activeVersion } = await rawDb
    .from('academy_curriculum_versions')
    .select('id')
    .eq('academy_id', academyId)
    .eq('status', 'active')
    .limit(1)
    .single()

  if (!activeVersion) {
    return fail('No active academy curriculum version found. Create one first from the Curriculum page.')
  }

  // 5. Parse the input deterministically — no AI
  const raw = rawInput.trim()
  const { parsed_level, parsed_pathway, parsed_focus, parsed_scope } = parseOverrideInput(raw)
  const { affected_targets_guess, proposed_change_summary, clarification_questions, warnings } =
    buildChangeContext(parsed_level, parsed_pathway, parsed_focus, parsed_scope, raw)

  // 6. Build proposed_actions payload
  const payload: CurriculumOverrideDraftPayload = {
    draft_type: 'curriculum_override_v1',
    raw_input: raw,
    parsed_level,
    parsed_pathway,
    parsed_focus,
    parsed_scope,
    affected_targets_guess,
    proposed_change_summary,
    clarification_questions,
    warnings,
  }

  // 7. Insert proposed_actions row — never touches curriculum tables
  const { data: created, error: insertError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      target_module: 'curriculum_override',
      target_object_type: 'academy_curriculum_version',
      target_object_id: activeVersion.id,
      status: 'pending_review',
      proposed_by_id: user.id,
      proposed_payload: payload,
    })
    .select('id')
    .single()

  if (insertError || !created) {
    return fail(`Failed to create curriculum override draft: ${insertError?.message ?? 'unknown error'}`)
  }

  return { ok: true, error: null, proposedActionId: created.id }
}
