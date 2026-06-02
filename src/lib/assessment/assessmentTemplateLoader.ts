// Assessment Template Loader
// Loads the academy's assessment template from DB.
// Auto-clones the global template on first use.
// Filters sections/skills by AssessmentView and AssessmentMode.
// Returns a normalized AssessmentFormConfig ready for the form to render.

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AssessmentFormConfig,
  AssessmentMode,
  AssessmentView,
  FormSection,
  FormSkill,
  TemplateSectionRow,
  TemplateSkillRow,
} from './assessmentTemplateTypes'

// ─── Public API ───────────────────────────────────────────────────────────────

export async function loadAssessmentFormConfig(
  supabase: SupabaseClient,
  academyId: string,
  view: AssessmentView,
  mode: AssessmentMode,
): Promise<AssessmentFormConfig> {
  const rawDb = supabase as any

  // 1. Find academy's active template
  const { data: aat } = await rawDb
    .from('academy_assessment_templates')
    .select('template_id, current_version_id')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .maybeSingle()

  let templateId: string
  let versionId: string | null = null
  let isAcademyTemplate = false

  if (aat?.template_id) {
    templateId = aat.template_id
    versionId = aat.current_version_id ?? null
    isAcademyTemplate = true
  } else {
    // No academy template yet — clone global and use it
    templateId = await cloneGlobalTemplate(rawDb, academyId)
    isAcademyTemplate = true
  }

  // 2. Load template metadata
  const { data: templateRow } = await rawDb
    .from('assessment_templates')
    .select('id, name, is_global')
    .eq('id', templateId)
    .single()

  const templateName: string = templateRow?.name ?? 'Core Assessment Template'

  // 3. Load sections
  const { data: sectionsData } = await rawDb
    .from('assessment_template_sections')
    .select([
      'id', 'template_id', 'section_key', 'display_name', 'sort_order',
      'is_visible', 'is_custom', 'pathway_category', 'level_applicability',
      'coach_guidance', 'parent_safe_label', 'player_safe_label',
    ].join(', '))
    .eq('template_id', templateId)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })

  const sections: TemplateSectionRow[] = sectionsData ?? []

  // 4. Load all skills for this template
  const { data: skillsData } = await rawDb
    .from('assessment_template_skills')
    .select([
      'id', 'section_id', 'template_id', 'skill_key', 'display_name', 'sort_order',
      'is_visible', 'is_custom', 'is_required',
      'appears_in_quick', 'appears_in_standard', 'appears_in_deep',
      'scoring_scale', 'level_applicability',
      'pathway_category', 'coach_guidance', 'parent_safe_label', 'player_safe_label',
    ].join(', '))
    .eq('template_id', templateId)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })

  const allSkills: TemplateSkillRow[] = skillsData ?? []

  // 5. Group skills by section, applying view + mode filters
  const skillsBySectionId = new Map<string, FormSkill[]>()
  for (const skill of allSkills) {
    if (!matchesView(skill.level_applicability, view)) continue
    if (!matchesMode(skill, mode)) continue
    if (!skillsBySectionId.has(skill.section_id)) {
      skillsBySectionId.set(skill.section_id, [])
    }
    skillsBySectionId.get(skill.section_id)!.push({
      id:            skill.id,
      skill_key:     skill.skill_key,
      display_name:  skill.display_name,
      sort_order:    skill.sort_order,
      is_required:   skill.is_required,
      scoring_scale: skill.scoring_scale,
      coach_guidance: skill.coach_guidance,
    })
  }

  // 6. Build filtered sections (exclude sections with no visible skills after filtering)
  const formSections: FormSection[] = []
  for (const section of sections) {
    if (!matchesView(section.level_applicability, view)) continue
    const sectionSkills = skillsBySectionId.get(section.id) ?? []
    // In quick mode, only include sections that have at least one quick skill
    if (mode === 'quick' && sectionSkills.length === 0) continue
    // In standard/deep mode, include sections even without skills (section-level score still valid)
    formSections.push({
      id:               section.id,
      section_key:      section.section_key,
      display_name:     section.display_name,
      sort_order:       section.sort_order,
      pathway_category: section.pathway_category,
      coach_guidance:   section.coach_guidance,
      skills:           sectionSkills,
    })
  }

  return {
    templateId,
    templateVersionId: versionId,
    templateName,
    view,
    mode,
    sections: formSections,
    isAcademyTemplate,
  }
}

// ─── Clone helper ─────────────────────────────────────────────────────────────

async function cloneGlobalTemplate(rawDb: any, academyId: string): Promise<string> {
  // Find the global template
  const { data: globalTemplates } = await rawDb
    .from('assessment_templates')
    .select('id, name')
    .eq('is_global', true)
    .limit(1)

  const global = globalTemplates?.[0]
  if (!global) throw new Error('Global assessment template not found. Run migration 082.')

  // Create academy clone
  const { data: cloneTemplate, error: cloneError } = await rawDb
    .from('assessment_templates')
    .insert({
      academy_id:       academyId,
      name:             global.name,
      is_global:        false,
      platform_version: '1.0',
      description:      'Academy customization. Edit sections and skills below.',
    })
    .select('id')
    .single()

  if (cloneError || !cloneTemplate?.id) throw new Error('Failed to clone assessment template.')
  const cloneId: string = cloneTemplate.id

  // Copy sections
  const { data: globalSections } = await rawDb
    .from('assessment_template_sections')
    .select('*')
    .eq('template_id', global.id)
    .order('sort_order', { ascending: true })

  for (const sec of (globalSections ?? [])) {
    const { data: newSection, error: secError } = await rawDb
      .from('assessment_template_sections')
      .insert({
        template_id:         cloneId,
        section_key:         sec.section_key,
        display_name:        sec.display_name,
        sort_order:          sec.sort_order,
        is_visible:          sec.is_visible,
        is_custom:           false,
        pathway_category:    sec.pathway_category,
        level_applicability: sec.level_applicability,
        coach_guidance:      sec.coach_guidance,
        parent_safe_label:   sec.parent_safe_label,
        player_safe_label:   sec.player_safe_label,
      })
      .select('id')
      .single()

    if (secError || !newSection?.id) continue

    // Copy skills for this section
    const { data: globalSkills } = await rawDb
      .from('assessment_template_skills')
      .select('*')
      .eq('section_id', sec.id)
      .order('sort_order', { ascending: true })

    if ((globalSkills ?? []).length > 0) {
      await rawDb
        .from('assessment_template_skills')
        .insert(
          (globalSkills as any[]).map((sk: any) => ({
            template_id:         cloneId,
            section_id:          newSection.id,
            skill_key:           sk.skill_key,
            display_name:        sk.display_name,
            sort_order:          sk.sort_order,
            is_visible:          sk.is_visible,
            is_custom:           false,
            is_required:         sk.is_required,
            appears_in_quick:    sk.appears_in_quick,
            appears_in_standard: sk.appears_in_standard,
            appears_in_deep:     sk.appears_in_deep,
            scoring_scale:       sk.scoring_scale,
            level_applicability: sk.level_applicability,
            pathway_category:    sk.pathway_category,
            coach_guidance:      sk.coach_guidance,
            parent_safe_label:   sk.parent_safe_label,
            player_safe_label:   sk.player_safe_label,
          }))
        )
    }
  }

  // Register in academy_assessment_templates
  await rawDb
    .from('academy_assessment_templates')
    .insert({
      academy_id:  academyId,
      template_id: cloneId,
      is_active:   true,
    })

  return cloneId
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

function matchesView(levelApplicability: string[], view: AssessmentView): boolean {
  // 'general' view includes all skills
  if (view === 'general') return true
  return levelApplicability.includes(view)
}

function matchesMode(skill: TemplateSkillRow, mode: AssessmentMode): boolean {
  if (mode === 'quick')    return skill.appears_in_quick
  if (mode === 'standard') return skill.appears_in_standard
  if (mode === 'deep')     return skill.appears_in_deep
  return true
}
