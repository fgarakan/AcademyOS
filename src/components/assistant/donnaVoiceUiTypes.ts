// Donna Voice UI Types — Sprint 289
// Pure TypeScript only. No DB, no Supabase, no async, no AI.

/** Live status of the voice interaction surface. */
export type DonnaVoiceUiStatus =
  | 'idle'
  | 'unsupported'
  | 'listening'
  | 'speaking'
  | 'pending_review' // transcript captured, awaiting director confirmation before routing

/** Holds a captured voice transcript that the director may edit before committing. */
export interface DonnaVoiceTranscriptState {
  /** The raw text returned by SpeechRecognition. */
  raw: string
  /** The (possibly edited) text the director will confirm. Starts equal to raw. */
  editedText: string
  /** True if editedText differs from raw. */
  isEdited: boolean
}
