// Server-side utility — requires Supabase client with active auth session.
// Resolves curriculum context for class templates.
//
// Model:
//   templates.curriculum_level_id → curriculum_levels.id
//   curriculum_levels.id → curriculum_content_items (gate requirements, coach cues, drills)
//
// curriculum_level_id is NOT in database.types.ts (added in migration 045);
// all queries use rawDb = supabase as any.

import type { SupabaseClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface CurriculumLevelMeta {
  id: string
  display_name: string
  stage: string
  sort_order: number
}

export interface CurriculumContentItem {
  id: string
  level_id: string
  section: string
  item_key: string
  content: string
}

export interface TemplateCurriculumContext {
  levelId: string
  levelName: string
  stage: string
  contentItems: CurriculumContentItem[]
  sessionNotesSummary: string
}

// ─────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────

/**
 * Resolves the curriculum level assigned to a class template.
 * Returns null if no level is assigned or the template does not exist.
 * Scopes by academy_id to prevent cross-academy reads.
 */
export async function getCurriculumLevelForTemplate(
  templateId: string,
  academyId: string,
  supabase: SupabaseClient,
): Promise<CurriculumLevelMeta | null> {
  const rawDb = supabase as any

  const { data: template } = await rawDb
    .from('templates')
    .select('curriculum_level_id')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()

  if (!template?.curriculum_level_id) return null

  const { data: level } = await rawDb
    .from('curriculum_levels')
    .select('id, display_name, stage, sort_order')
    .eq('id', template.curriculum_level_id)
    .single()

  return level ?? null
}

/**
 * Returns curriculum content items for a given level.
 * Optionally filter by section (e.g. 'curriculum_gates', 'curriculum_coach_language').
 */
export async function getCurriculumContentForLevel(
  levelId: string,
  supabase: SupabaseClient,
  sections?: string[],
): Promise<CurriculumContentItem[]> {
  const rawDb = supabase as any

  let query = rawDb
    .from('curriculum_content_items')
    .select('id, level_id, section, item_key, content')
    .eq('level_id', levelId)
    .order('section')
    .order('item_key')

  if (sections && sections.length > 0) {
    query = query.in('section', sections)
  }

  const { data } = await query
  return (data ?? []) as CurriculumContentItem[]
}

/**
 * Returns full curriculum context for a template: level metadata + content items.
 * Returns null if the template has no curriculum level assigned.
 */
export async function getTemplateCurriculumContext(
  templateId: string,
  academyId: string,
  supabase: SupabaseClient,
): Promise<TemplateCurriculumContext | null> {
  const level = await getCurriculumLevelForTemplate(templateId, academyId, supabase)
  if (!level) return null

  const contentItems = await getCurriculumContentForLevel(level.id, supabase)

  return {
    levelId: level.id,
    levelName: level.display_name,
    stage: level.stage,
    contentItems,
    sessionNotesSummary: formatCurriculumContextText(level, contentItems),
  }
}

// ─────────────────────────────────────────────────────────────
// Formatting helpers — pure functions, no DB
// ─────────────────────────────────────────────────────────────

/**
 * Returns a compact text summary of curriculum context suitable for
 * embedding in session_notes when a session is generated from a template.
 */
export function formatCurriculumContextText(
  level: CurriculumLevelMeta,
  contentItems: CurriculumContentItem[],
): string {
  const lines: string[] = [`[Curriculum: ${level.display_name}]`]

  const coachLang = contentItems
    .filter(i => i.section === 'curriculum_coach_language')
    .slice(0, 3)
    .map(i => i.content)

  if (coachLang.length > 0) {
    lines.push(`Focus cues: ${coachLang.join(' · ')}`)
  }

  const gates = contentItems
    .filter(i => i.section === 'curriculum_gates')
    .slice(0, 2)
    .map(i => i.content)

  if (gates.length > 0) {
    lines.push(`Gates: ${gates.join(' · ')}`)
  }

  return lines.join('\n')
}

/**
 * Returns a short one-line curriculum badge text for display in session cards.
 * E.g. "Orange 2 — Intermediate"
 */
export function getCurriculumBadgeText(level: CurriculumLevelMeta): string {
  return level.display_name
}

/**
 * Returns all available curriculum levels ordered by sort_order.
 * Used to power curriculum pickers across templates and sessions.
 */
export async function getAllCurriculumLevels(
  supabase: SupabaseClient,
): Promise<CurriculumLevelMeta[]> {
  const rawDb = supabase as any
  const { data } = await rawDb
    .from('curriculum_levels')
    .select('id, display_name, stage, sort_order')
    .order('sort_order', { ascending: true })
  return (data ?? []) as CurriculumLevelMeta[]
}
