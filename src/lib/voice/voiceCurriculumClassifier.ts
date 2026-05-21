// Sprint 497 — Voice-to-Curriculum Intent Classifier V1
// Detects curriculum-related intent in voice/text input and extracts structured fields.
// Does NOT modify voiceIntakeTypes.ts (locked module).
// Extends the voice intake pattern with curriculum-specific extraction.
// Pure TypeScript — no DB calls, no AI API calls. Deterministic keyword matching.

import type { CurriculumDomain } from '@/lib/curriculum/inbox'

export type CurriculumIntentType =
  | 'add_curriculum_idea'
  | 'flag_curriculum_gap'
  | 'request_curriculum_change'
  | 'comment_on_exercise'
  | 'suggest_drill'
  | 'flag_level_mismatch'
  | 'unknown_curriculum'

export interface CurriculumIntentClassification {
  intentType: CurriculumIntentType
  confidence: 'high' | 'medium' | 'low'
  extractedIdea: string | null
  extractedDomain: CurriculumDomain | null
  extractedLevel: string | null
  rationale: string
}

const ADD_KEYWORDS = [
  'add', 'include', 'introduce', 'teach', 'incorporate', 'we should', 'let\'s add',
  'new drill', 'new exercise', 'new requirement', 'curriculum idea',
]

const GAP_KEYWORDS = [
  'gap', 'missing', 'not covering', 'skipping', 'forgot', 'lacking', 'weak area',
  'not enough', 'no coverage', 'need more',
]

const CHANGE_KEYWORDS = [
  'change', 'update', 'modify', 'replace', 'remove', 'drop', 'adjust curriculum',
  'revise', 'fix curriculum', 'update curriculum',
]

const DRILL_KEYWORDS = [
  'drill', 'exercise', 'activity', 'game', 'practice', 'warm up', 'cool down',
]

const LEVEL_KEYWORDS: string[] = ['red', 'orange', 'green', 'yellow', 'beginner', 'intermediate', 'advanced', 'foundation', 'development', 'performance']

const DOMAIN_KEYWORD_MAP: Record<string, CurriculumDomain> = {
  forehand: 'technical',
  backhand: 'technical',
  serve: 'technical',
  volley: 'technical',
  slice: 'technical',
  technique: 'technical',
  technical: 'technical',
  tactic: 'tactical',
  tactical: 'tactical',
  strategy: 'tactical',
  pattern: 'tactical',
  positioning: 'tactical',
  fitness: 'physical',
  physical: 'physical',
  agility: 'physical',
  speed: 'physical',
  strength: 'physical',
  stamina: 'physical',
  endurance: 'physical',
  mental: 'mental',
  focus: 'mental',
  confidence: 'mental',
  mindset: 'mental',
  pressure: 'mental',
  resilience: 'mental',
  competition: 'competition',
  match: 'competition',
  tournament: 'competition',
  game: 'competition',
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 1)
}

function hasKeyword(tokens: string[], keywords: string[]): boolean {
  return keywords.some(kw => tokens.join(' ').includes(kw.toLowerCase()))
}

function extractDomain(tokens: string[]): CurriculumDomain | null {
  for (const token of tokens) {
    if (DOMAIN_KEYWORD_MAP[token]) return DOMAIN_KEYWORD_MAP[token]
  }
  const text = tokens.join(' ')
  for (const [keyword, domain] of Object.entries(DOMAIN_KEYWORD_MAP)) {
    if (text.includes(keyword)) return domain
  }
  return null
}

function extractLevel(tokens: string[]): string | null {
  const text = tokens.join(' ')
  for (const level of LEVEL_KEYWORDS) {
    if (text.includes(level)) return level
  }
  return null
}

function classifyIntentType(tokens: string[]): CurriculumIntentType {
  if (hasKeyword(tokens, GAP_KEYWORDS)) return 'flag_curriculum_gap'
  if (hasKeyword(tokens, CHANGE_KEYWORDS)) return 'request_curriculum_change'
  if (hasKeyword(tokens, DRILL_KEYWORDS)) return 'suggest_drill'
  if (hasKeyword(tokens, ADD_KEYWORDS)) return 'add_curriculum_idea'
  if (tokens.includes('mismatch') || tokens.includes('wrong') || tokens.includes('level')) return 'flag_level_mismatch'
  return 'unknown_curriculum'
}

function computeConfidence(
  intentType: CurriculumIntentType,
  domain: CurriculumDomain | null,
  idea: string | null,
): 'high' | 'medium' | 'low' {
  if (intentType === 'unknown_curriculum') return 'low'
  if (domain !== null && idea !== null && idea.length > 15) return 'high'
  return 'medium'
}

// Checks whether text is plausibly curriculum-related before full classification.
export function isCurriculumRelated(text: string): boolean {
  const tokens = tokenize(text)
  const allKeywords = [
    ...ADD_KEYWORDS,
    ...GAP_KEYWORDS,
    ...CHANGE_KEYWORDS,
    ...DRILL_KEYWORDS,
    'curriculum',
    'level',
    'requirement',
    'domain',
    ...Object.keys(DOMAIN_KEYWORD_MAP),
  ]
  return hasKeyword(tokens, allKeywords)
}

export function classifyCurriculumIntent(text: string): CurriculumIntentClassification {
  const tokens = tokenize(text)
  const intentType = classifyIntentType(tokens)
  const domain = extractDomain(tokens)
  const level = extractLevel(tokens)

  const idea = text.trim().length >= 10 ? text.trim() : null
  const confidence = computeConfidence(intentType, domain, idea)

  return {
    intentType,
    confidence,
    extractedIdea: idea,
    extractedDomain: domain,
    extractedLevel: level,
    rationale:
      intentType === 'unknown_curriculum'
        ? 'No clear curriculum intent detected'
        : `Detected ${intentType.replace(/_/g, ' ')}${domain ? ` in ${domain} domain` : ''}`,
  }
}
