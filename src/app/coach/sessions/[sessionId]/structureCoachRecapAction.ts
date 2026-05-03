'use server'

// Sprint 216 — Coach Recap Command Center
// Rule-based recap structuring for coach session pages.
// Same approach as director structureRecapAction — no external AI, all requires_review: true.

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import type { Json } from '@/lib/supabase/database.types'

export interface StructureCoachRecapResult {
  ok: boolean
  error: string | null
  draftId: string | null
  attendanceMentions: { player_name: string; status: 'absent' | 'late'; requires_review: boolean }[]
  observationCount: number
}

const ABSENCE_PHRASES = [
  'was absent', 'did not show', "didn't show", 'missed the session',
  'not present', 'absent today', 'not here', "wasn't here", 'no show',
  'did not attend', "didn't attend",
]
const LATE_PHRASES = [
  'arrived late', 'came late', 'was late', 'showed up late', 'turned up late',
]
const SKILL_KEYWORDS = [
  'grip', 'preparation', 'forehand', 'backhand', 'serve', 'movement',
  'speed', 'recovery', 'fitness', 'competition', 'focus', 'effort',
  'footwork', 'volley', 'slice', 'topspin', 'positioning', 'consistency',
  'accuracy', 'power', 'endurance',
]
const CHANGE_FROM_PLAN_PHRASES = [
  'changed', 'modified', 'skipped', 'dropped', 'cut short', 'ran out of time',
  'instead of', 'rather than', 'adjusted', 'pivoted', "didn't get to", "didn't have time",
]

function detectSkillKeywords(text: string): string[] {
  const lower = text.toLowerCase()
  return SKILL_KEYWORDS.filter(kw => lower.includes(kw))
}

interface RosterPlayer { playerId: string; fullName: string; firstName: string }

function detectAttendanceForPlayer(text: string, firstName: string): { status: 'absent' | 'late' } | null {
  const sentences = text.split(/[.!?\n]+/)
  for (const sentence of sentences) {
    const sl = sentence.toLowerCase()
    if (!sl.includes(firstName.toLowerCase())) continue
    if (ABSENCE_PHRASES.some(phrase => sl.includes(phrase))) return { status: 'absent' }
    if (LATE_PHRASES.some(phrase => sl.includes(phrase))) return { status: 'late' }
  }
  return null
}

function extractPlayerSentences(text: string, firstName: string): string[] {
  return text.split(/[.!?\n]+/).filter(s => s.trim() && s.toLowerCase().includes(firstName.toLowerCase()))
}

function buildParentSafeDraft(firstName: string, keywords: string[], observationText: string): string {
  const focus = keywords.length > 0 ? keywords.slice(0, 2).join(' and ') : 'their technique'
  const base = `${firstName} worked on ${focus} today.`
  if (!observationText) return base
  const sentence = observationText.trim()
  return `${base} ${sentence.charAt(0).toUpperCase() + sentence.slice(1)}.`
}

function runStructuring(recapText: string, sessionId: string, voiceNoteId: string, roster: RosterPlayer[]) {
  const globalKeywords = detectSkillKeywords(recapText)
  const detectedPlayers: { player_id: string; name: string; evidence: string }[] = []
  const attendanceMentions: { player_name: string; status: 'absent' | 'late'; confidence: string; requires_review: boolean }[] = []
  const playerObservationDrafts: { player_name: string; possible_focus: string[]; observation: string; requires_review: boolean }[] = []
  const parentSafeDraftCandidates: { player_name: string; draft: string; requires_review: boolean }[] = []

  for (const player of roster) {
    const textLower = recapText.toLowerCase()
    const mentioned = textLower.includes(player.firstName.toLowerCase()) || textLower.includes(player.fullName.toLowerCase())
    if (!mentioned) continue

    detectedPlayers.push({ player_id: player.playerId, name: player.fullName, evidence: `"${player.firstName}" appears in recap text.` })

    const attendance = detectAttendanceForPlayer(recapText, player.firstName)
    if (attendance) {
      attendanceMentions.push({ player_name: player.fullName, status: attendance.status, confidence: 'medium', requires_review: true })
    }

    const playerSentences = extractPlayerSentences(recapText, player.firstName)
    const playerKeywords = detectSkillKeywords(playerSentences.join(' '))
    const observationSentences = playerSentences.filter(s => {
      const sl = s.toLowerCase()
      return !ABSENCE_PHRASES.some(p => sl.includes(p)) && !LATE_PHRASES.some(p => sl.includes(p))
    })
    const observationText = observationSentences.join('. ').trim()
    const focusKeywords = playerKeywords.length > 0 ? playerKeywords : globalKeywords.slice(0, 3)

    playerObservationDrafts.push({ player_name: player.fullName, possible_focus: focusKeywords, observation: observationText || 'No specific observations extracted.', requires_review: true })
    parentSafeDraftCandidates.push({ player_name: player.fullName, draft: buildParentSafeDraft(player.firstName, focusKeywords, observationText), requires_review: true })
  }

  const warnings = [
    'Structured Draft V1 — rule-based extraction. No AI was used.',
    'This is a draft. No official records were updated.',
    'All fields require human review before any action is taken.',
  ]
  if (roster.length > 0 && detectedPlayers.length === 0) warnings.push('No player names from the session roster were detected in the recap text.')
  if (roster.length === 0) warnings.push('No roster available — player-level drafts could not be generated.')

  return {
    source: 'voice_note' as const,
    source_voice_note_id: voiceNoteId,
    session_id: sessionId,
    draft_type: 'session_recap_structuring_v1' as const,
    raw_recap: recapText,
    detected_players: detectedPlayers,
    attendance_mentions: attendanceMentions,
    session_actual_draft: {
      changed_from_plan: CHANGE_FROM_PLAN_PHRASES.some(p => recapText.toLowerCase().includes(p)),
      actual_focus: globalKeywords,
      skipped_or_reduced: [],
      requires_review: true,
    },
    player_observation_drafts: playerObservationDrafts,
    director_summary_draft: recapText.length > 400 ? recapText.slice(0, 400).trimEnd() + '…' : recapText,
    parent_safe_draft_candidates: parentSafeDraftCandidates,
    warnings,
  }
}

export async function structureCoachRecapAction(
  voiceNoteId: string,
  sessionId: string,
): Promise<StructureCoachRecapResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.', draftId: null, attendanceMentions: [], observationCount: 0 }

  const { data: profile } = await supabase.from('profiles').select('academy_id').eq('id', user.id).single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.', draftId: null, attendanceMentions: [], observationCount: 0 }
  const academyId = profile.academy_id

  const { data: session } = await supabase.from('sessions').select('id, name, coach_id, group_id').eq('id', sessionId).eq('academy_id', academyId).single()
  if (!session) return { ok: false, error: 'Session not found.', draftId: null, attendanceMentions: [], observationCount: 0 }

  const isAssignedCoach = session.coach_id === user.id
  const { data: membership } = await supabase.from('academy_memberships').select('role').eq('academy_id', academyId).eq('profile_id', user.id).eq('is_active', true).single()
  if (!membership && !isAssignedCoach) return { ok: false, error: 'Not authorized.', draftId: null, attendanceMentions: [], observationCount: 0 }

  const membershipRole = membership?.role ?? 'coach'
  if (!['academy_director', 'head_coach', 'coach'].includes(membershipRole) && !isAssignedCoach) {
    return { ok: false, error: 'Not authorized to structure this recap.', draftId: null, attendanceMentions: [], observationCount: 0 }
  }

  const issuerRole: 'academy_director' | 'head_coach' | 'coach' =
    membershipRole === 'academy_director' ? 'academy_director' :
    membershipRole === 'head_coach' ? 'head_coach' : 'coach'

  const { data: voiceNote } = await supabase.from('voice_notes').select('id, raw_input, processing_status').eq('id', voiceNoteId).eq('session_id', sessionId).eq('academy_id', academyId).is('player_id', null).single()
  if (!voiceNote) return { ok: false, error: 'Recap not found or access denied.', draftId: null, attendanceMentions: [], observationCount: 0 }
  if (voiceNote.processing_status === 'structured') return { ok: false, error: 'This recap has already been structured.', draftId: null, attendanceMentions: [], observationCount: 0 }

  // Build roster
  const roster: RosterPlayer[] = []
  if (session.group_id) {
    const { data: memberships } = await supabase.from('group_memberships').select('player_id').eq('group_id', session.group_id).eq('is_current', true).eq('academy_id', academyId)
    const playerIds = (memberships ?? []).map(m => m.player_id)
    if (playerIds.length > 0) {
      const { data: players } = await supabase.from('players').select('id, full_name, first_name, last_name').in('id', playerIds).eq('academy_id', academyId)
      for (const p of players ?? []) {
        roster.push({ playerId: p.id, fullName: p.full_name ?? `${p.first_name} ${p.last_name}`, firstName: p.first_name })
      }
    }
  }

  const payload = runStructuring(voiceNote.raw_input, sessionId, voiceNoteId, roster)

  const rawDb = supabase as any

  const { data: voiceCommand, error: vcError } = await supabase.from('voice_commands').insert({
    academy_id: academyId,
    issuer_id: user.id,
    issuer_role: issuerRole as any,
    input_method: 'typed',
    raw_input: voiceNote.raw_input,
    transcript: voiceNote.raw_input,
    processing_status: 'processed',
  }).select('id').single()

  if (vcError || !voiceCommand) return { ok: false, error: `Failed to create command record: ${vcError?.message ?? 'unknown'}`, draftId: null, attendanceMentions: [], observationCount: 0 }

  const { data: proposedAction, error: paError } = await rawDb.from('proposed_actions').insert({
    academy_id: academyId,
    proposed_by_id: user.id,
    voice_command_id: voiceCommand.id,
    action_type: 'other',
    action_label: `Session Recap Structuring Draft — ${session.name ?? 'Untitled Session'}`,
    target_module: 'session_recap_structuring',
    target_object_id: sessionId,
    target_object_type: 'session',
    proposed_payload: payload as unknown as Json,
    status: 'pending_review',
    risk_level: 'low',
    risk_notes: ['Coach recap draft. No player records, attendance, or priorities were modified.'],
  }).select('id').single()

  if (paError || !proposedAction) return { ok: false, error: `Failed to save draft: ${paError?.message ?? 'unknown'}`, draftId: null, attendanceMentions: [], observationCount: 0 }

  await supabase.from('voice_notes').update({ processing_status: 'structured' }).eq('id', voiceNoteId).eq('academy_id', academyId)

  return {
    ok: true,
    error: null,
    draftId: proposedAction.id,
    attendanceMentions: payload.attendance_mentions,
    observationCount: payload.player_observation_drafts.filter(o => o.observation !== 'No specific observations extracted.').length,
  }
}
