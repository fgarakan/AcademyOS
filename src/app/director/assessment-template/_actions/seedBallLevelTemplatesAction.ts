'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { ALL_BALL_LEVEL_TEMPLATES, type BallLevelTemplateSeed } from '@/lib/assessment/ballLevelTemplateSeeds'

export interface SeedResult {
  ok: boolean
  seeded: string[]
  skipped: string[]
  error: string | null
}

export async function seedBallLevelTemplatesAction(): Promise<SeedResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, seeded: [], skipped: [], error: 'Not authenticated.' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (membership?.role !== 'academy_director' && membership?.role !== 'head_coach') {
    return { ok: false, seeded: [], skipped: [], error: 'Director or Head Coach required.' }
  }

  const rawDb = supabase as any
  const seeded: string[] = []
  const skipped: string[] = []

  for (const templateDef of ALL_BALL_LEVEL_TEMPLATES) {
    const result = await seedOneTemplate(rawDb, templateDef)
    if (result === 'seeded') seeded.push(templateDef.name)
    else if (result === 'skipped') skipped.push(templateDef.name)
    else return { ok: false, seeded, skipped, error: `Failed to seed "${templateDef.name}": ${result}` }
  }

  return { ok: true, seeded, skipped, error: null }
}

async function seedOneTemplate(
  rawDb: any,
  def: BallLevelTemplateSeed,
): Promise<'seeded' | 'skipped' | string> {
  // Idempotency: skip if a global template with this exact name already exists
  const { data: existing } = await rawDb
    .from('assessment_templates')
    .select('id')
    .eq('name', def.name)
    .eq('is_global', true)
    .maybeSingle()

  if (existing?.id) return 'skipped'

  // Insert the template (global = no academy_id)
  const { data: tpl, error: tplErr } = await rawDb
    .from('assessment_templates')
    .insert({
      name:             def.name,
      is_global:        true,
      platform_version: def.platform_version,
      description:      def.description,
    })
    .select('id')
    .single()

  if (tplErr || !tpl?.id) return tplErr?.message ?? 'Failed to insert template row'
  const templateId: string = tpl.id

  // Insert sections and skills sequentially
  for (const secDef of def.sections) {
    const { data: sec, error: secErr } = await rawDb
      .from('assessment_template_sections')
      .insert({
        template_id:         templateId,
        section_key:         secDef.section_key,
        display_name:        secDef.display_name,
        sort_order:          secDef.sort_order,
        is_visible:          true,
        is_custom:           false,
        pathway_category:    secDef.pathway_category,
        level_applicability: [],
        coach_guidance:      secDef.coach_guidance,
        parent_safe_label:   null,
        player_safe_label:   null,
      })
      .select('id')
      .single()

    if (secErr || !sec?.id) {
      return secErr?.message ?? `Failed to insert section ${secDef.section_key}`
    }

    for (const skillDef of secDef.skills) {
      const { error: skillErr } = await rawDb
        .from('assessment_template_skills')
        .insert({
          template_id:         templateId,
          section_id:          sec.id,
          skill_key:           skillDef.skill_key,
          display_name:        skillDef.display_name,
          sort_order:          skillDef.sort_order,
          is_visible:          true,
          is_custom:           false,
          is_required:         skillDef.is_required,
          appears_in_quick:    skillDef.appears_in_quick,
          appears_in_standard: skillDef.appears_in_standard,
          appears_in_deep:     skillDef.appears_in_deep,
          scoring_scale:       skillDef.scoring_scale,
          level_applicability: [],
          pathway_category:    secDef.pathway_category,
          coach_guidance:      skillDef.coach_guidance,
          parent_safe_label:   null,
          player_safe_label:   null,
        })

      if (skillErr) return skillErr.message
    }
  }

  return 'seeded'
}
