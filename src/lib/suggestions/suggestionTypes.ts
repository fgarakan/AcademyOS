// Suggestion system types — Sprint 178
// Pure TypeScript types only. No imports, no DB calls.

export type AcademySuggestionType =
  | 'player_focus_update'
  | 'session_adjustment'
  | 'curriculum_gap'
  | 'fitness_adjustment'
  | 'parent_safe_update_draft'
  | 'private_lesson_opportunity'
  | 'level_readiness_review'
  | 'attendance_exception_followup'
  | 'coach_note_followup'

export type AcademySuggestionPriority = 'low' | 'medium' | 'high'
export type AcademySuggestionConfidence = 'low' | 'medium' | 'high'
export type AcademySuggestionStatus = 'pending' | 'accepted' | 'denied' | 'deferred' | 'applied' | 'failed'

export interface SuggestionEvidenceItem {
  type: string
  description: string
  date?: string
}

export interface SuggestionImpactPreview {
  if_accepted: string[]
  next_step?: string
}

export interface AcademySuggestionDraft {
  suggestion_type: AcademySuggestionType
  title: string
  summary: string
  priority: AcademySuggestionPriority
  confidence: AcademySuggestionConfidence
  entity_type: string | null
  entity_id: string | null
  evidence: SuggestionEvidenceItem[]
  impact_preview: SuggestionImpactPreview
  proposed_changes: Record<string, unknown>
  will_not_change: string[]
}

// Row shape returned from DB (academy_suggestions table)
// Note: table not yet in database.types.ts — use rawDb queries
export interface AcademySuggestionRow {
  id: string
  academy_id: string
  suggestion_type: AcademySuggestionType
  title: string
  summary: string | null
  priority: AcademySuggestionPriority
  confidence: AcademySuggestionConfidence
  status: AcademySuggestionStatus
  source: string
  entity_type: string | null
  entity_id: string | null
  evidence: SuggestionEvidenceItem[]
  impact_preview: SuggestionImpactPreview
  proposed_changes: Record<string, unknown>
  will_not_change: string[]
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  created_at: string
  updated_at: string
}

// UI display helpers
export const SUGGESTION_TYPE_LABELS: Record<AcademySuggestionType, string> = {
  player_focus_update: 'Player Focus',
  session_adjustment: 'Session',
  curriculum_gap: 'Curriculum',
  fitness_adjustment: 'Fitness',
  parent_safe_update_draft: 'Parent Preview',
  private_lesson_opportunity: 'Private Lesson',
  level_readiness_review: 'Level Review',
  attendance_exception_followup: 'Attendance',
  coach_note_followup: 'Coach Note',
}

export const PRIORITY_LABEL: Record<AcademySuggestionPriority, string> = {
  high:   'High',
  medium: 'Medium',
  low:    'Low',
}

export const PRIORITY_CLASSES: Record<AcademySuggestionPriority, string> = {
  high:   'bg-status-red/10 text-status-red border-status-red/25',
  medium: 'bg-status-orange/10 text-status-orange border-status-orange/25',
  low:    'bg-surface-raised text-text-muted border-border',
}

export const CONFIDENCE_LABEL: Record<AcademySuggestionConfidence, string> = {
  high:   'High confidence',
  medium: 'Medium confidence',
  low:    'Low confidence',
}

export const CONFIDENCE_CLASSES: Record<AcademySuggestionConfidence, string> = {
  high:   'text-status-green',
  medium: 'text-status-blue',
  low:    'text-text-muted',
}
