'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import type { Json } from '@/lib/supabase/database.types'

// ─────────────────────────────────────────────────────────────
// Tag → priority category mapping
// ─────────────────────────────────────────────────────────────

const TAG_CATEGORY_MAP: Record<string, string> = {
  forehand:     'technical_skill',
  backhand:     'technical_skill',
  serve:        'technical_skill',
  grip:         'technical_skill',
  preparation:  'technical_skill',
  contact:      'technical_skill',
  finish:       'technical_skill',
  technique:    'technical_skill',
  tactics:      'tactical_skill',
  pattern:      'tactical_skill',
  point:        'tactical_skill',
  crosscourt:   'tactical_skill',
  line:         'tactical_skill',
  decision:     'tactical_skill',
  strategy:     'tactical_skill',
  speed:        'physical_fitness',
  movement:     'physical_fitness',
  recovery:     'physical_fitness',
  deceleration: 'physical_fitness',
  agility:      'physical_fitness',
  fitness:      'physical_fitness',
  strength:     'physical_fitness',
  tournament:   'competition_exposure',
  match:        'competition_exposure',
  compete:      'competition_exposure',
  tiebreak:     'competition_exposure',
  pressure:     'competition_exposure',
  focus:        'behavioral',
  effort:       'behavioral',
  attitude:     'behavioral',
  confidence:   'behavioral',
  behavior:     'behavioral',
  load:         'load_management',
  fatigue:      'load_management',
  soreness:     'load_management',
  reassessment: 'reassessment',
  evaluation:   'reassessment',
  promotion:    'promotion_readiness',
}

// Observation type → category fallback (used when no tag votes exist)
const OBS_TYPE_CATEGORY_MAP: Record<string, string> = {
  technical:         'technical_skill',
  tactical:          'tactical_skill',
  movement:          'physical_fitness',
  competition:       'competition_exposure',
  behavioral:        'behavioral',
  injury_concern:    'load_management',
  positive_highlight:'behavioral',
  general:           'technical_skill',
}

// Tiebreaker order — earlier = higher priority when vote counts are equal
const CATEGORY_PRIORITY_ORDER = [
  'technical_skill',
  'behavioral',
  'tactical_skill',
  'physical_fitness',
  'competition_exposure',
  'load_management',
  'reassessment',
  'promotion_readiness',
]

const CATEGORY_LABELS: Record<string, string> = {
  technical_skill:      'Technical Skill',
  tactical_skill:       'Tactical Skill',
  physical_fitness:     'Physical Fitness',
  competition_exposure: 'Competition Exposure',
  behavioral:           'Behavioral',
  load_management:      'Load Management',
  reassessment:         'Reassessment',
  promotion_readiness:  'Promotion Readiness',
}

// ─────────────────────────────────────────────────────────────
// Deterministic recommendation logic
// ─────────────────────────────────────────────────────────────

function buildRecommendedTitle(category: string, topTags: string[]): string {
  const tagStr = topTags.slice(0, 2).join(' and ')
  switch (category) {
    case 'technical_skill':
      return tagStr ? `Improve ${tagStr}` : 'Develop technical skill'
    case 'tactical_skill':
      return tagStr ? `Strengthen ${tagStr}` : 'Build tactical awareness'
    case 'physical_fitness':
      return tagStr ? `Build ${tagStr}` : 'Develop physical conditioning'
    case 'competition_exposure':
      return tagStr ? `Increase ${tagStr} experience` : 'Increase competition exposure'
    case 'behavioral':
      return tagStr ? `Develop ${tagStr}` : 'Strengthen behavioral focus'
    case 'load_management':
      return tagStr ? `Monitor ${tagStr}` : 'Review training load'
    case 'reassessment':
      return 'Schedule player reassessment'
    case 'promotion_readiness':
      return 'Evaluate promotion readiness'
    default:
      return tagStr ? `Focus on ${tagStr}` : 'Review player development priorities'
  }
}

function buildDescription(
  category: string,
  topTags: string[],
  observationCount: number
): string {
  const tagStr = topTags.slice(0, 3).join(', ')
  const categoryLabel = CATEGORY_LABELS[category] ?? category
  const evidenceNote = observationCount === 1
    ? '1 recent coach observation'
    : `${observationCount} recent coach observations`

  if (tagStr) {
    return `${evidenceNote} mention ${tagStr} as recurring themes. Consider making ${categoryLabel} a focused priority for the next training block.`
  }
  return `${evidenceNote} suggest ${categoryLabel} as a development area. Consider making this an active priority for the next training block.`
}

interface ObsRow {
  observation_type: string
  tags: string[] | null
  is_private: boolean
  ai_entities: Record<string, unknown> | null
  created_at: string
  session_id: string | null
}

interface PriorityRow {
  id: string
  title: string
  category: string
}

function generateRecommendation(
  observations: ObsRow[],
  activePriorities: PriorityRow[]
): {
  category: string
  title: string
  description: string
  topTags: string[]
  topObsTypes: string[]
  overlapWarning: string | null
} {
  // Build tag frequency map
  const tagCounts: Record<string, number> = {}
  for (const obs of observations) {
    for (const tag of obs.tags ?? []) {
      const key = tag.toLowerCase()
      tagCounts[key] = (tagCounts[key] ?? 0) + 1
    }
  }

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag)

  // Map tags → category votes
  const categoryCounts: Record<string, number> = {}
  for (const [tag, count] of Object.entries(tagCounts)) {
    const cat = TAG_CATEGORY_MAP[tag]
    if (cat) {
      categoryCounts[cat] = (categoryCounts[cat] ?? 0) + count
    }
  }

  // Observation type frequency
  const typeCounts: Record<string, number> = {}
  for (const obs of observations) {
    typeCounts[obs.observation_type] = (typeCounts[obs.observation_type] ?? 0) + 1
  }
  const topObsTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type)

  // Fallback to observation types when no tag votes exist
  const totalTagVotes = Object.values(categoryCounts).reduce((a, b) => a + b, 0)
  if (totalTagVotes === 0) {
    for (const [type, count] of Object.entries(typeCounts)) {
      const cat = OBS_TYPE_CATEGORY_MAP[type]
      if (cat) {
        categoryCounts[cat] = (categoryCounts[cat] ?? 0) + count
      }
    }
  }

  // Resolve category: highest votes, tiebreaker by CATEGORY_PRIORITY_ORDER
  let resolvedCategory = 'technical_skill'
  let maxVotes = -1
  for (const cat of CATEGORY_PRIORITY_ORDER) {
    const votes = categoryCounts[cat] ?? 0
    if (votes > maxVotes) {
      maxVotes = votes
      resolvedCategory = cat
    }
  }

  const title = buildRecommendedTitle(resolvedCategory, topTags)
  const description = buildDescription(resolvedCategory, topTags, observations.length)

  // Overlap check: active priority shares a top tag with the recommendation
  let overlapWarning: string | null = null
  if (activePriorities.length > 0 && topTags.length > 0) {
    for (const ap of activePriorities) {
      const titleLower = ap.title.toLowerCase()
      const hasOverlap = topTags.some(tag => titleLower.includes(tag))
      if (hasOverlap) {
        overlapWarning = `Possible overlap with existing active priority: "${ap.title}"`
        break
      }
    }
  }

  return { category: resolvedCategory, title, description, topTags, topObsTypes, overlapWarning }
}

// ─────────────────────────────────────────────────────────────
// Server action
// ─────────────────────────────────────────────────────────────

export interface PriorityRecommendationDraftResult {
  ok: boolean
  error: string | null
  draftId: string | null
}

export async function createPriorityRecommendationDraftAction(
  playerId: string
): Promise<PriorityRecommendationDraftResult> {
  const fail = (error: string): PriorityRecommendationDraftResult =>
    ({ ok: false, error, draftId: null })

  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')
  if (!playerId) return fail('Missing player ID.')

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
  const memberRole = membership?.role
  if (memberRole !== 'academy_director' && memberRole !== 'head_coach') {
    return fail('You do not have permission to create priority recommendation drafts.')
  }

  // 4. Verify player belongs to this academy
  const { data: player } = await supabase
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()
  if (!player) return fail('Player not found or access denied.')

  // 5. Fetch coach_observations for this player — rawDb to avoid TS2589 on JSONB field
  const rawDb = supabase as any

  const { data: rawObs } = await rawDb
    .from('coach_observations')
    .select('observation_type, tags, is_private, ai_entities, created_at, session_id')
    .eq('academy_id', academyId)
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(50)

  const observations: ObsRow[] = (rawObs ?? []) as ObsRow[]

  if (observations.length === 0) {
    return fail('No coach observations found for this player. Add observations first before generating a recommendation draft.')
  }

  // 6. Fetch active player_priorities for overlap check — rawDb avoids TS2589
  const { data: rawPriorities } = await rawDb
    .from('player_priorities')
    .select('id, title, category')
    .eq('academy_id', academyId)
    .eq('player_id', playerId)
    .eq('is_active', true)

  const activePriorities: PriorityRow[] = (rawPriorities ?? []) as PriorityRow[]

  // 7. Generate deterministic recommendation — no external API, no AI
  const rec = generateRecommendation(observations, activePriorities)

  // 8. Compute evidence metrics for payload
  const tagCounts: Record<string, number> = {}
  for (const obs of observations) {
    for (const tag of obs.tags ?? []) {
      const key = tag.toLowerCase()
      tagCounts[key] = (tagCounts[key] ?? 0) + 1
    }
  }
  const topTagsForEvidence = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag)

  const fromRecapCount = observations.filter(
    o => (o.ai_entities as Record<string, unknown> | null)?.source === 'session_recap_draft'
  ).length

  const sessionLinkedCount = observations.filter(o => o.session_id !== null).length
  const mostRecentAt = observations[0]?.created_at ?? null

  // 9. Build proposed_payload
  const payload = {
    draft_type: 'priority_recommendation_v1',
    source: 'player_evidence_summary',
    player_id: playerId,
    recommended_priority: {
      title: rec.title,
      description: rec.description,
      category: rec.category,
      priority_level: 'medium',
      urgency: 'normal',
      suggested_status: 'recommended',
      requires_review: true,
    },
    evidence: {
      observation_count: observations.length,
      top_tags: topTagsForEvidence,
      top_observation_types: rec.topObsTypes,
      from_recap_count: fromRecapCount,
      session_linked_count: sessionLinkedCount,
      most_recent_observation_at: mostRecentAt,
    },
    active_priority_overlap_warning: rec.overlapWarning ?? null,
    warnings: [
      'Draft only. No priority was created or changed.',
      'Requires director approval before becoming an active player priority.',
    ],
  }

  // 10. Create voice_commands relay row — proposed_actions.voice_command_id is NOT NULL
  const issuerRole = memberRole as 'academy_director' | 'head_coach'
  const { data: voiceCommand, error: vcError } = await supabase
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: issuerRole as any,
      input_method: 'typed',
      raw_input: `Priority recommendation draft requested for player: ${playerId}`,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    return fail(`Failed to create command record: ${vcError?.message ?? 'unknown'}`)
  }

  // 11. Insert proposed_actions — status pending_review, never writes player_priorities
  const { data: proposedAction, error: paError } = await supabase
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: user.id,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: `Priority Recommendation Draft`,
      target_module: 'priority_recommendation',
      target_object_id: playerId,
      target_object_type: 'player',
      proposed_payload: payload as unknown as Json,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: ['Draft only. No player priorities, profiles, or observations were modified.'],
    })
    .select('id')
    .single()

  if (paError || !proposedAction) {
    return fail(`Failed to save recommendation draft: ${paError?.message ?? 'unknown'}`)
  }

  return { ok: true, error: null, draftId: proposedAction.id }
}
