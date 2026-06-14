'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

export interface TemplateActionResult {
  ok: boolean
  error: string | null
}

async function resolveAcademyAndRole(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof getSupabaseServer>>; userId: string; academyId: string; role: UserRole }
  | { ok: false; error: string }
> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false, error: 'Director or Head Coach access required.' }
  }

  return { ok: true, supabase, userId: user.id, academyId, role: role as UserRole }
}

/**
 * Archive a class template.
 * Sets is_active=false and archived_at=now(). Preserves all history and sessions.
 * The template remains visible in the list with "Inactive" status.
 */
export async function archiveClassTemplateAction(
  templateId: string,
): Promise<TemplateActionResult> {
  if (!templateId) return { ok: false, error: 'Template ID required.' }

  const auth = await resolveAcademyAndRole()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase, userId, academyId, role } = auth

  const rawDb = supabase as any

  // Verify template belongs to this academy
  const { data: tmpl, error: fetchErr } = await rawDb
    .from('templates')
    .select('id, name, is_active')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()

  if (fetchErr || !tmpl) return { ok: false, error: 'Template not found.' }
  if (!tmpl.is_active) return { ok: false, error: 'Template is already archived.' }

  const { error: updateErr } = await rawDb
    .from('templates')
    .update({
      is_active: false,
      archived_at: new Date().toISOString(),
      status: 'archived',
    })
    .eq('id', templateId)
    .eq('academy_id', academyId)

  if (updateErr) return { ok: false, error: `Archive failed: ${updateErr.message}` }

  await writeAuditLog({
    db: supabase,
    academyId,
    actorId: userId,
    actorRole: role,
    action: 'class_template_archived',
    targetType: 'templates',
    targetId: templateId,
    targetLabel: tmpl.name,
    sourceType: 'ui',
  })

  revalidatePath('/director/class-templates')
  revalidatePath(`/director/class-templates/${templateId}`)
  return { ok: true, error: null }
}

/**
 * Delete a class template.
 * Only allowed when the template has no sessions referencing it.
 * Cascade-deletes template_block_exercises, curriculum_class_template_blocks, template_blocks,
 * then the template itself. Writes audit log.
 */
export async function deleteClassTemplateAction(
  templateId: string,
): Promise<TemplateActionResult> {
  if (!templateId) return { ok: false, error: 'Template ID required.' }

  const auth = await resolveAcademyAndRole()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase, userId, academyId, role } = auth

  const rawDb = supabase as any

  // Verify template belongs to this academy
  const { data: tmpl, error: fetchErr } = await rawDb
    .from('templates')
    .select('id, name')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()

  if (fetchErr || !tmpl) return { ok: false, error: 'Template not found.' }

  // Block delete if sessions exist — archive instead
  const { count: sessionCount } = await rawDb
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('template_id', templateId)
    .eq('academy_id', academyId)

  if ((sessionCount ?? 0) > 0) {
    return {
      ok: false,
      error: `Cannot delete: template has been used in ${sessionCount} session${sessionCount === 1 ? '' : 's'}. Archive it instead to preserve history.`,
    }
  }

  // Get all block IDs to cascade-delete related rows
  const { data: blocks } = await rawDb
    .from('template_blocks')
    .select('id')
    .eq('template_id', templateId)

  const blockIds: string[] = (blocks ?? []).map((b: { id: string }) => b.id)

  // Cascade: delete template_block_exercises
  if (blockIds.length > 0) {
    await rawDb
      .from('template_block_exercises')
      .delete()
      .in('block_id', blockIds)

    // Cascade: delete curriculum_class_template_blocks
    await rawDb
      .from('curriculum_class_template_blocks')
      .delete()
      .in('block_id', blockIds)
  }

  // Delete template_blocks
  await rawDb
    .from('template_blocks')
    .delete()
    .eq('template_id', templateId)

  // Delete the template itself
  const { error: deleteErr } = await rawDb
    .from('templates')
    .delete()
    .eq('id', templateId)
    .eq('academy_id', academyId)

  if (deleteErr) return { ok: false, error: `Delete failed: ${deleteErr.message}` }

  await writeAuditLog({
    db: supabase,
    academyId,
    actorId: userId,
    actorRole: role,
    action: 'class_template_deleted',
    targetType: 'templates',
    targetId: templateId,
    targetLabel: tmpl.name,
    payload: { session_count_at_delete: 0 },
    sourceType: 'ui',
  })

  revalidatePath('/director/class-templates')
  return { ok: true, error: null }
}
