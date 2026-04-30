'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import type { Json } from '@/lib/supabase/database.types'

// ─────────────────────────────────────────────────────────────
// Domain keyword families
// Maps each requirement domain key to baseline matching terms.
// ─────────────────────────────────────────────────────────────

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  skill: [
    'forehand', 'backhand', 'serve', 'grip', 'preparation', 'contact', 'finish',
    'technique', 'racket', 'rally', 'direction', 'spacing', 'groundstroke',
    'volley', 'swing', 'stroke', 'topspin', 'slice', 'rotation', 'takeback',
  ],
  competition: [
    'point', 'score', 'match', 'compete', 'tournament', 'pressure', 'reset',
    'routine', 'pattern', 'tiebreak', 'opponent', 'game', 'strategy', 'tactics',
    'return', 'approach', 'deuce', 'advantage',
  ],
  fitness: [
    'movement', 'balance', 'recovery', 'agility', 'speed', 'coordination',
    'effort', 'readiness', 'stamina', 'deceleration', 'strength', 'fitness',
    'endurance', 'footwork', 'explosive', 'lateral', 'load', 'fatigue',
    'conditioning', 'athletic',
  ],
}

// ─────────────────────────────────────────────────────────────
// Tokenize text into lowercase words ≥ 4 chars
// ─────────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,.\-_/\\;:!?"'()\[\]{}|@#]+/)
    .filter(w => w.length >= 4)
}

// ─────────────────────────────────────────────────────────────
// Local types — view not yet in database.types.ts
// ─────────────────────────────────────────────────────────────

interface ObsRow {
  id: string
  observation_type: string
  content: string
  tags: string[] | null
  created_at: string
  session_id: string | null
}

interface ReqRow {
  progress_id: string
  requirement_id: string
  requirement_title: string
  requirement_description: string | null
  requirement_domain_key: string
  status: string
}

interface DraftLink {
  coach_observation_id: string
  requirement_progress_id: string
  requirement_id: string
  requirement_title: string
  requirement_domain_key: string
  evidence_type: 'coach_observation'
  evidence_summary: string
  match_reason: string
  confidence: number
  is_parent_safe: false
}

// ─────────────────────────────────────────────────────────────
// Matching logic — deterministic, no AI API
// ─────────────────────────────────────────────────────────────

function matchObservationToRequirement(obs: ObsRow, req: ReqRow): DraftLink | null {
  const domainKeywords = DOMAIN_KEYWORDS[req.requirement_domain_key] ?? []

  const reqKeywords = new Set<string>([
    ...domainKeywords,
    ...tokenize(req.requirement_title),
    ...(req.requirement_description ? tokenize(req.requirement_description) : []),
  ])

  const obsKeywords = [
    ...(obs.tags ?? []).map(t => t.toLowerCase()),
    ...tokenize(obs.content),
  ]

  const matchedWords: string[] = []
  for (const kw of obsKeywords) {
    if (reqKeywords.has(kw) && !matchedWords.includes(kw)) {
      matchedWords.push(kw)
    }
  }

  if (matchedWords.length === 0) return null

  const confidence = Math.round(Math.min(0.3 + (matchedWords.length / 10) * 0.6, 0.9) * 100) / 100

  const tagStr =
    obs.tags && obs.tags.length > 0
      ? `Tags: ${obs.tags.slice(0, 3).join(', ')}. `
      : ''
  const contentPreview =
    obs.content.length > 80 ? obs.content.slice(0, 80) + '…' : obs.content
  const evidence_summary = `${tagStr}${contentPreview}`

  return {
    coach_observation_id: obs.id,
    requirement_progress_id: req.progress_id,
    requirement_id: req.requirement_id,
    requirement_title: req.requirement_title,
    requirement_domain_key: req.requirement_domain_key,
    evidence_type: 'coach_observation',
    evidence_summary,
    match_reason: `Observation keywords overlap with requirement: ${matchedWords.slice(0, 4).join(', ')}.`,
    confidence,
    is_parent_safe: false,
  }
}

// ─────────────────────────────────────────────────────────────
// Result type
// ─────────────────────────────────────────────────────────────

export interface EvidenceRequirementDraftResult {
  ok: boolean
  error: string | null
  draftId: string | null
  linksCount: number
}

// ─────────────────────────────────────────────────────────────
// Server action
// ─────────────────────────────────────────────────────────────

export async function createEvidenceRequirementLinkDraftsAction(
  playerId: string
): Promise<EvidenceRequirementDraftResult> {
  const fail = (error: string): EvidenceRequirementDraftResult =>
    ({ ok: false, error, draftId: null, linksCount: 0 })

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
    return fail('You do not have permission to create evidence link drafts.')
  }

  // 4. Verify player belongs to this academy
  const { data: player } = await supabase
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()
  if (!player) return fail('Player not found or access denied.')

  const rawDb = supabase as any

  // 5. Check for existing pending batch draft to prevent duplicates
  const { data: existingDrafts } = await rawDb
    .from('proposed_actions')
    .select('id')
    .eq('academy_id', academyId)
    .eq('target_module', 'requirement_evidence_link')
    .eq('target_object_id', playerId)
    .eq('status', 'pending_review')
    .limit(1)

  if (existingDrafts && existingDrafts.length > 0) {
    return fail(
      'A pending evidence link draft already exists for this player. Review or dismiss the existing draft first.'
    )
  }

  // 6. Fetch recent coach_observations — rawDb avoids TS2589 on JSONB field
  const { data: rawObs } = await rawDb
    .from('coach_observations')
    .select('id, observation_type, content, tags, created_at, session_id')
    .eq('academy_id', academyId)
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(50)

  const observations: ObsRow[] = (rawObs ?? []) as ObsRow[]

  if (observations.length === 0) {
    return fail('No coach observations are available to match yet.')
  }

  // 7. Fetch requirement progress from view — rawDb avoids TS2589
  const { data: rawReqs } = await rawDb
    .from('v_player_requirement_progress_detail')
    .select(
      'progress_id, requirement_id, requirement_title, requirement_description, requirement_domain_key, status'
    )
    .eq('academy_id', academyId)
    .eq('player_id', playerId)

  const requirementRows: ReqRow[] = (rawReqs ?? []) as ReqRow[]

  if (requirementRows.length === 0) {
    return fail('No requirement progress rows are available for this player yet.')
  }

  // 8. Run deterministic matching — no external API, no AI
  const candidates: DraftLink[] = []

  for (const obs of observations) {
    for (const req of requirementRows) {
      const link = matchObservationToRequirement(obs, req)
      if (link) candidates.push(link)
    }
  }

  // Sort by confidence descending, deduplicate per (observation, requirement) pair
  candidates.sort((a, b) => b.confidence - a.confidence)

  const seen = new Set<string>()
  const uniqueLinks: DraftLink[] = []
  for (const link of candidates) {
    const key = `${link.coach_observation_id}:${link.requirement_id}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueLinks.push(link)
    }
  }

  // Cap at 10 proposed links
  const cappedLinks = uniqueLinks.slice(0, 10)

  if (cappedLinks.length === 0) {
    return fail('No strong evidence-to-requirement matches found. No drafts were created.')
  }

  // 9. Build proposed_payload
  const payload = {
    draft_type: 'requirement_evidence_link_v1',
    source: 'coach_observation_requirement_matching',
    player_id: playerId,
    links: cappedLinks,
    warnings: [
      'Draft only. No evidence links were created.',
      'Requirement status was not changed.',
      'Requires staff review before becoming official evidence.',
    ],
  }

  // 10. Create voice_commands relay row — proposed_actions.voice_command_id is NOT NULL
  const { data: voiceCommand, error: vcError } = await supabase
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: memberRole as any,
      input_method: 'typed',
      raw_input: `Evidence requirement link draft requested for player: ${playerId}`,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    return fail(`Failed to create command record: ${vcError?.message ?? 'unknown'}`)
  }

  // 11. Insert proposed_actions — status pending_review
  //     Never writes requirement_evidence_links or player_requirement_progress
  const { data: proposedAction, error: paError } = await supabase
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: user.id,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: 'Evidence Link Draft',
      target_module: 'requirement_evidence_link',
      target_object_id: playerId,
      target_object_type: 'player',
      proposed_payload: payload as unknown as Json,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: [
        'Draft only. No evidence links were created.',
        'No player requirement progress rows were modified.',
        'No coach observations were modified.',
      ],
    })
    .select('id')
    .single()

  if (paError || !proposedAction) {
    return fail(`Failed to save evidence link draft: ${paError?.message ?? 'unknown'}`)
  }

  return { ok: true, error: null, draftId: proposedAction.id, linksCount: cappedLinks.length }
}
