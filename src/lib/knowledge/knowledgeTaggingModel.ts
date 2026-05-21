// Sprint 532 — Knowledge Tagging Model
// Tag system for knowledge library items — allows filtering, cross-linking,
// and curriculum level association.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { KnowledgeDomain } from './knowledgeTypes'
import type { CurriculumStage } from '@/lib/curriculum/visualMapModel'

export type KnowledgeTagCategory =
  | 'domain'
  | 'stage'
  | 'player_age'
  | 'skill_level'
  | 'evidence_type'
  | 'topic'

export interface KnowledgeTag {
  tagId: string
  label: string
  category: KnowledgeTagCategory
  domain: KnowledgeDomain | null
  stage: CurriculumStage | null
  itemCount: number
}

export interface KnowledgeTaggingContext {
  itemId: string
  currentTags: string[]
  suggestedTags: string[]
  curriculumLevelSuggestions: string[]
  requiresReviewAfterTagChange: true
}

export const SYSTEM_TAG_CATEGORIES: { category: KnowledgeTagCategory; label: string }[] = [
  { category: 'domain', label: 'Domain' },
  { category: 'stage', label: 'Stage' },
  { category: 'player_age', label: 'Player Age' },
  { category: 'skill_level', label: 'Skill Level' },
  { category: 'evidence_type', label: 'Evidence Type' },
  { category: 'topic', label: 'Topic' },
]

const DOMAIN_TAGS: string[] = [
  'technical', 'tactical', 'physical', 'mental', 'competition',
  'nutrition', 'recovery', 'coaching_methodology', 'player_development',
  'parent_education', 'sports_science',
]

const STAGE_TAGS: string[] = [
  'red_ball', 'orange_ball', 'green_ball', 'yellow_ball', 'high_performance',
]

const TOPIC_TAGS: string[] = [
  'forehand', 'backhand', 'serve', 'return', 'volley', 'overhead',
  'footwork', 'movement', 'agility', 'speed', 'strength', 'endurance',
  'focus', 'confidence', 'resilience', 'pressure', 'mindset',
  'match_play', 'tournament', 'point_construction', 'pattern_play',
  'rally_tolerance', 'net_approach', 'baseline_game',
  'hydration', 'sleep', 'warm_up', 'cool_down', 'injury_prevention',
  'periodization', 'load_management', 'peak_performance',
]

export const ALL_KNOWN_TAGS: string[] = [
  ...DOMAIN_TAGS,
  ...STAGE_TAGS,
  ...TOPIC_TAGS,
]

export function suggestTagsFromText(text: string): string[] {
  const lower = text.toLowerCase()
  return ALL_KNOWN_TAGS.filter(tag => lower.includes(tag.replace(/_/g, ' ')) || lower.includes(tag))
}

export function buildTaggingContext(
  itemId: string,
  currentTags: string[],
  title: string,
  summary: string,
  targetLevelIds: string[],
): KnowledgeTaggingContext {
  const combinedText = `${title} ${summary}`
  const suggestedTags = suggestTagsFromText(combinedText).filter(
    t => !currentTags.includes(t),
  )

  return {
    itemId,
    currentTags,
    suggestedTags,
    curriculumLevelSuggestions: targetLevelIds,
    requiresReviewAfterTagChange: true,
  }
}

export function groupTagsByCategory(tags: KnowledgeTag[]): Record<KnowledgeTagCategory, KnowledgeTag[]> {
  const grouped: Record<KnowledgeTagCategory, KnowledgeTag[]> = {
    domain: [],
    stage: [],
    player_age: [],
    skill_level: [],
    evidence_type: [],
    topic: [],
  }
  for (const tag of tags) {
    const list = grouped[tag.category]
    if (list) list.push(tag)
  }
  return grouped
}

export function filterItemsByTag(
  itemIds: string[],
  tagToItems: Record<string, string[]>,
  tag: string,
): string[] {
  const tagged = tagToItems[tag] ?? []
  return itemIds.filter(id => tagged.includes(id))
}

export function getTagCategoryLabel(category: KnowledgeTagCategory): string {
  const labels: Record<KnowledgeTagCategory, string> = {
    domain: 'Domain',
    stage: 'Stage',
    player_age: 'Player Age',
    skill_level: 'Skill Level',
    evidence_type: 'Evidence Type',
    topic: 'Topic',
  }
  return labels[category]
}
