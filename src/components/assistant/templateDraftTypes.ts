// Local draft types — all state is client-side only until the director explicitly approves and saves.
// No DB writes happen until saveAssistantTemplateDraftAction is called.

export type TemplateDraftBlockCategory =
  | 'warm_up'
  | 'dynamic_warm_up'
  | 'technical'
  | 'rally'
  | 'point_play'
  | 'match_play'
  | 'fitness'
  | 'other'

export type TemplateDraftQuestionField =
  | 'durationMinutes'
  | 'level'
  | 'goal'
  | 'blockDurations'
  | 'templateName'

export interface TemplateDraftQuestion {
  id: string
  question: string
  field: TemplateDraftQuestionField
}

export interface TemplateDraftBlock {
  id: string
  name: string
  category: TemplateDraftBlockCategory
  durationMinutes: number | null
  order: number
  notes?: string
}

export type TemplateDraftStatus = 'draft' | 'ready_for_review' | 'saved'

export interface TemplateDraft {
  templateName: string
  level: string | null
  durationMinutes: number | null
  goal: string | null
  status: TemplateDraftStatus
  blocks: TemplateDraftBlock[]
  missingQuestions: TemplateDraftQuestion[]
  source: 'assistant'
}
