// Pure utility — no DB access.
// Parses template tags and provides source traceability for templates and session blocks.
//
// Source model:
//   Template origin is tracked via tags on the `templates` table:
//     - `import_batch:<id>`     — created by Airtable import
//     - `airtable_id:<id>`      — maps to originating Airtable record
//     - `fitness_template:true` — Fitness OS template (vs class/session template)
//     - `template_type:<type>`  — e.g. 'standard', 'pre_tournament', etc.
//
//   Curriculum linkage is tracked via templates.curriculum_level_id (not in generated types)
//
//   Session → template chain: session_blocks.template_block_id → template_blocks.id
//   Allows auditing which template block a session block was generated from.

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type TemplateOrigin = 'imported' | 'fitness' | 'manual' | 'curriculum_seeded'

export interface TemplateParsedTags {
  isFitnessTemplate: boolean
  importBatchId: string | null
  airtableId: string | null
  templateType: string | null
  origin: TemplateOrigin
}

export interface TemplateSourceInfo {
  templateId: string
  templateName: string
  origin: TemplateOrigin
  importBatchId: string | null
  airtableId: string | null
  templateType: string | null
  curriculumLevelId: string | null
  curriculumLevelName: string | null
}

export interface SessionBlockTrace {
  sessionBlockId: string
  sessionId: string
  templateBlockId: string | null
  templateId: string | null
  templateName: string | null
  curriculumLevelName: string | null
}

// ─────────────────────────────────────────────────────────────
// Tag parsing
// ─────────────────────────────────────────────────────────────

/**
 * Parses structured source information out of a template's tags array.
 */
export function parseTemplateTags(tags: string[] | null): TemplateParsedTags {
  const tagList = tags ?? []

  const isFitnessTemplate = tagList.includes('fitness_template:true')
  const importBatchTag = tagList.find(t => t.startsWith('import_batch:'))
  const airtableIdTag = tagList.find(t => t.startsWith('airtable_id:'))
  const templateTypeTag = tagList.find(t => t.startsWith('template_type:'))

  const importBatchId = importBatchTag ? importBatchTag.slice('import_batch:'.length) : null
  const airtableId = airtableIdTag ? airtableIdTag.slice('airtable_id:'.length) : null
  const templateType = templateTypeTag ? templateTypeTag.slice('template_type:'.length) : null

  let origin: TemplateOrigin = 'manual'
  if (importBatchId || airtableId) origin = 'imported'
  else if (isFitnessTemplate) origin = 'fitness'

  return { isFitnessTemplate, importBatchId, airtableId, templateType, origin }
}

/**
 * Builds a TemplateSourceInfo from template data.
 * curriculumLevelName should be pre-resolved; pass null if not available.
 */
export function buildTemplateSourceInfo(
  templateId: string,
  templateName: string,
  tags: string[] | null,
  curriculumLevelId: string | null,
  curriculumLevelName: string | null,
): TemplateSourceInfo {
  const parsed = parseTemplateTags(tags)

  let origin = parsed.origin
  if (curriculumLevelId && origin === 'manual') {
    origin = 'curriculum_seeded'
  }

  return {
    templateId,
    templateName,
    origin,
    importBatchId: parsed.importBatchId,
    airtableId: parsed.airtableId,
    templateType: parsed.templateType,
    curriculumLevelId,
    curriculumLevelName,
  }
}

// ─────────────────────────────────────────────────────────────
// Display helpers
// ─────────────────────────────────────────────────────────────

const ORIGIN_LABELS: Record<TemplateOrigin, string> = {
  imported: 'Imported',
  fitness: 'Fitness OS',
  manual: 'Manual',
  curriculum_seeded: 'Curriculum-Linked',
}

/**
 * Returns a short badge label for display next to a template name.
 */
export function formatTemplateOriginBadge(origin: TemplateOrigin): string {
  return ORIGIN_LABELS[origin]
}

/**
 * Returns a human-readable one-line source description.
 * E.g. "Imported from Airtable (batch: 2024-01-15)" or "Curriculum-Linked: Orange 2"
 */
export function formatTemplateSourceDescription(info: TemplateSourceInfo): string {
  if (info.origin === 'imported') {
    const parts: string[] = ['Imported']
    if (info.airtableId) parts.push(`Airtable ID: ${info.airtableId}`)
    if (info.importBatchId) parts.push(`batch: ${info.importBatchId}`)
    if (info.curriculumLevelName) parts.push(`• ${info.curriculumLevelName}`)
    return parts.join(' · ')
  }
  if (info.origin === 'curriculum_seeded' && info.curriculumLevelName) {
    return `Curriculum-Linked: ${info.curriculumLevelName}`
  }
  if (info.origin === 'fitness') {
    const typeLabel = info.templateType
      ? info.templateType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'Standard'
    return `Fitness OS — ${typeLabel}`
  }
  return 'Manual template'
}

// ─────────────────────────────────────────────────────────────
// Session block → template traceability
// ─────────────────────────────────────────────────────────────

/**
 * Checks whether a session block has a traceable template source.
 */
export function sessionBlockIsTraceable(templateBlockId: string | null): boolean {
  return templateBlockId !== null && templateBlockId !== ''
}

/**
 * Returns a display label for a session block's source.
 * Pass resolved template name and curriculum level name (from DB queries upstream).
 */
export function formatSessionBlockSourceLabel(
  templateBlockId: string | null,
  templateName: string | null,
  curriculumLevelName: string | null,
): string {
  if (!templateBlockId) return 'Manually added'
  const parts: string[] = ['From template']
  if (templateName) parts.push(templateName)
  if (curriculumLevelName) parts.push(`(${curriculumLevelName})`)
  return parts.join(': ')
}

/**
 * Returns a short provenance string for rendering in session views.
 * E.g. "Orange 2 template" or "Fitness: Standard"
 */
export function formatSessionBlockProvenance(
  templateName: string | null,
  curriculumLevelName: string | null,
  isFitnessTemplate: boolean,
): string {
  if (!templateName) return 'Manual'
  if (curriculumLevelName) return `${curriculumLevelName} template`
  if (isFitnessTemplate) return `Fitness: ${templateName}`
  return `Template: ${templateName}`
}
