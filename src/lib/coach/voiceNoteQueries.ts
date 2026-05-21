// Sprint 440 — Voice Note Data Layer V1
// Typed query helpers for voice_notes table.
// No select('*'). Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export interface VoiceNoteRecord {
  id: string
  academyId: string
  authorId: string
  sessionId: string | null
  playerId: string | null
  transcript: string | null
  rawInput: string
  processingStatus: string
  audioPath: string | null
  createdAt: string
  parsedObservationId: string | null
}

export type VoiceNoteProcessingStatus = 'pending' | 'processing' | 'structured' | 'failed'

// Fetch a single voice note by ID.
export async function fetchVoiceNoteById(
  db: SupabaseClient<Database>,
  academyId: string,
  voiceNoteId: string,
): Promise<VoiceNoteRecord | null> {
  const { data, error } = await db
    .from('voice_notes')
    .select('id, academy_id, author_id, session_id, player_id, transcript, raw_input, processing_status, audio_path, created_at, parsed_observation_id')
    .eq('id', voiceNoteId)
    .eq('academy_id', academyId)
    .single()

  if (error || !data) return null
  return mapVoiceNoteRow(data)
}

// Fetch all voice notes for a session.
export async function fetchSessionVoiceNotes(
  db: SupabaseClient<Database>,
  academyId: string,
  sessionId: string,
): Promise<VoiceNoteRecord[]> {
  const { data, error } = await db
    .from('voice_notes')
    .select('id, academy_id, author_id, session_id, player_id, transcript, raw_input, processing_status, audio_path, created_at, parsed_observation_id')
    .eq('academy_id', academyId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) return []
  return (data ?? []).map(mapVoiceNoteRow)
}

// Fetch voice notes pending structuring (processing_status = 'pending').
export async function fetchPendingStructuringNotes(
  db: SupabaseClient<Database>,
  academyId: string,
  limit = 20,
): Promise<VoiceNoteRecord[]> {
  const { data, error } = await db
    .from('voice_notes')
    .select('id, academy_id, author_id, session_id, player_id, transcript, raw_input, processing_status, audio_path, created_at, parsed_observation_id')
    .eq('academy_id', academyId)
    .eq('processing_status', 'pending')
    .not('transcript', 'is', null)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) return []
  return (data ?? []).map(mapVoiceNoteRow)
}

// Check whether a voice note has already been structured.
export function isVoiceNoteStructured(voiceNote: VoiceNoteRecord): boolean {
  return voiceNote.processingStatus === 'structured'
}

// Returns whether a voice note has a usable transcript for structuring.
export function hasUsableTranscript(voiceNote: VoiceNoteRecord): boolean {
  return Boolean(voiceNote.transcript) && (voiceNote.transcript?.trim().length ?? 0) >= 20
}

function mapVoiceNoteRow(row: {
  id: string
  academy_id: string
  author_id: string
  session_id: string | null
  player_id: string | null
  transcript: string | null
  raw_input: string
  processing_status: string
  audio_path: string | null
  created_at: string
  parsed_observation_id: string | null
}): VoiceNoteRecord {
  return {
    id: row.id,
    academyId: row.academy_id,
    authorId: row.author_id,
    sessionId: row.session_id,
    playerId: row.player_id,
    transcript: row.transcript,
    rawInput: row.raw_input,
    processingStatus: row.processing_status,
    audioPath: row.audio_path,
    createdAt: row.created_at,
    parsedObservationId: row.parsed_observation_id,
  }
}
