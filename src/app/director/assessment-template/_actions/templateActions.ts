'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

async function getDirectorContext() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return null

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') return null

  return { supabase, user, academyId: profile.academy_id }
}

// ─── Snapshot helper ──────────────────────────────────────────────────────────
async function snapshotVersion(
  rawDb: any,
  templateId: string,
  academyId: string,
  userId: string,
  changeNote: string,
): Promise<string | null> {
  // Build snapshot from current sections + skills
  const { data: sections } = await rawDb
    .from('assessment_template_sections')
    .select('*')
    .eq('template_id', templateId)
    .order('sort_order', { ascending: true })

  const { data: skills } = await rawDb
    .from('assessment_template_skills')
    .select('*')
    .eq('template_id', templateId)
    .order('sort_order', { ascending: true })

  // Get current version number
  const { data: lastVersion } = await rawDb
    .from('assessment_template_versions')
    .select('version_num')
    .eq('template_id', templateId)
    .order('version_num', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextNum = (lastVersion?.version_num ?? 0) + 1

  const { data: newVersion } = await rawDb
    .from('assessment_template_versions')
    .insert({
      template_id:  templateId,
      academy_id:   academyId,
      version_num:  nextNum,
      snapshot:     { sections: sections ?? [], skills: skills ?? [] },
      change_note:  changeNote,
      created_by:   userId,
    })
    .select('id')
    .single()

  if (newVersion?.id) {
    // Update academy_assessment_templates.current_version_id
    await rawDb
      .from('academy_assessment_templates')
      .update({ current_version_id: newVersion.id, updated_at: new Date().toISOString() })
      .eq('template_id', templateId)
      .eq('academy_id', academyId)
  }

  return newVersion?.id ?? null
}

// ─── Rename section ───────────────────────────────────────────────────────────

export async function renameSectionAction(
  sectionId: string,
  newName: string,
): Promise<{ ok: boolean; error: string | null }> {
  await assertNotPreviewMode()
  const ctx = await getDirectorContext()
  if (!ctx) return { ok: false, error: 'Not authorized.' }
  const { supabase, user, academyId } = ctx
  const rawDb = supabase as any

  const trimmed = newName.trim()
  if (!trimmed || trimmed.length > 80) return { ok: false, error: 'Name must be 1–80 characters.' }

  const { data: section, error } = await rawDb
    .from('assessment_template_sections')
    .update({ display_name: trimmed, updated_at: new Date().toISOString() })
    .eq('id', sectionId)
    .select('template_id')
    .single()

  if (error) return { ok: false, error: error.message }

  await snapshotVersion(rawDb, section.template_id, academyId, user.id, `Renamed section to "${trimmed}"`)
  revalidatePath('/director/assessment-template')
  return { ok: true, error: null }
}

// ─── Toggle section visibility ────────────────────────────────────────────────

export async function toggleSectionVisibilityAction(
  sectionId: string,
  isVisible: boolean,
): Promise<{ ok: boolean; error: string | null }> {
  await assertNotPreviewMode()
  const ctx = await getDirectorContext()
  if (!ctx) return { ok: false, error: 'Not authorized.' }
  const { supabase, user, academyId } = ctx
  const rawDb = supabase as any

  const { data: section, error } = await rawDb
    .from('assessment_template_sections')
    .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
    .eq('id', sectionId)
    .select('template_id, display_name')
    .single()

  if (error) return { ok: false, error: error.message }

  await snapshotVersion(rawDb, section.template_id, academyId, user.id, `${isVisible ? 'Showed' : 'Hid'} section "${section.display_name}"`)
  revalidatePath('/director/assessment-template')
  return { ok: true, error: null }
}

// ─── Reorder sections ─────────────────────────────────────────────────────────

export async function reorderSectionsAction(
  templateId: string,
  orderedSectionIds: string[],
): Promise<{ ok: boolean; error: string | null }> {
  await assertNotPreviewMode()
  const ctx = await getDirectorContext()
  if (!ctx) return { ok: false, error: 'Not authorized.' }
  const { supabase, user, academyId } = ctx
  const rawDb = supabase as any

  for (let i = 0; i < orderedSectionIds.length; i++) {
    await rawDb
      .from('assessment_template_sections')
      .update({ sort_order: i + 1, updated_at: new Date().toISOString() })
      .eq('id', orderedSectionIds[i])
      .eq('template_id', templateId)
  }

  await snapshotVersion(rawDb, templateId, academyId, user.id, 'Reordered sections')
  revalidatePath('/director/assessment-template')
  return { ok: true, error: null }
}

// ─── Rename skill ─────────────────────────────────────────────────────────────

export async function renameSkillAction(
  skillId: string,
  newName: string,
): Promise<{ ok: boolean; error: string | null }> {
  await assertNotPreviewMode()
  const ctx = await getDirectorContext()
  if (!ctx) return { ok: false, error: 'Not authorized.' }
  const { supabase, user, academyId } = ctx
  const rawDb = supabase as any

  const trimmed = newName.trim()
  if (!trimmed || trimmed.length > 80) return { ok: false, error: 'Name must be 1–80 characters.' }

  const { data: skill, error } = await rawDb
    .from('assessment_template_skills')
    .update({ display_name: trimmed, updated_at: new Date().toISOString() })
    .eq('id', skillId)
    .select('template_id')
    .single()

  if (error) return { ok: false, error: error.message }

  await snapshotVersion(rawDb, skill.template_id, academyId, user.id, `Renamed skill to "${trimmed}"`)
  revalidatePath('/director/assessment-template')
  return { ok: true, error: null }
}

// ─── Toggle skill visibility ──────────────────────────────────────────────────

export async function toggleSkillVisibilityAction(
  skillId: string,
  isVisible: boolean,
): Promise<{ ok: boolean; error: string | null }> {
  await assertNotPreviewMode()
  const ctx = await getDirectorContext()
  if (!ctx) return { ok: false, error: 'Not authorized.' }
  const { supabase, user, academyId } = ctx
  const rawDb = supabase as any

  const { data: skill, error } = await rawDb
    .from('assessment_template_skills')
    .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
    .eq('id', skillId)
    .select('template_id, display_name')
    .single()

  if (error) return { ok: false, error: error.message }

  await snapshotVersion(rawDb, skill.template_id, academyId, user.id, `${isVisible ? 'Showed' : 'Hid'} skill "${skill.display_name}"`)
  revalidatePath('/director/assessment-template')
  return { ok: true, error: null }
}

// ─── Reorder skills within a section ─────────────────────────────────────────

export async function reorderSkillsAction(
  sectionId: string,
  templateId: string,
  orderedSkillIds: string[],
): Promise<{ ok: boolean; error: string | null }> {
  await assertNotPreviewMode()
  const ctx = await getDirectorContext()
  if (!ctx) return { ok: false, error: 'Not authorized.' }
  const { supabase, user, academyId } = ctx
  const rawDb = supabase as any

  for (let i = 0; i < orderedSkillIds.length; i++) {
    await rawDb
      .from('assessment_template_skills')
      .update({ sort_order: i + 1, updated_at: new Date().toISOString() })
      .eq('id', orderedSkillIds[i])
      .eq('section_id', sectionId)
  }

  await snapshotVersion(rawDb, templateId, academyId, user.id, 'Reordered skills')
  revalidatePath('/director/assessment-template')
  return { ok: true, error: null }
}
