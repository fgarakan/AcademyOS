'use server'

import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

export interface CreatePlayerResult {
  ok: false
  error: string
}

export async function createPlayerAction(formData: FormData): Promise<CreatePlayerResult | void> {
  await assertNotPreviewMode()
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (membership?.role !== 'academy_director' && membership?.role !== 'head_coach') {
    return { ok: false, error: 'Not authorised' }
  }

  const academyId = profile.academy_id

  const firstName = (formData.get('first_name') as string | null)?.trim()
  const lastName = (formData.get('last_name') as string | null)?.trim()
  const dateOfBirth = (formData.get('date_of_birth') as string | null)?.trim()
  const gender = (formData.get('gender') as string | null)?.trim() || null
  const notes = (formData.get('notes') as string | null)?.trim() || null

  if (!firstName) return { ok: false, error: 'First name is required' }
  if (!lastName) return { ok: false, error: 'Last name is required' }
  if (!dateOfBirth) return { ok: false, error: 'Date of birth is required' }

  const fullName = `${firstName} ${lastName}`
  const today = new Date().toISOString().slice(0, 10)

  const { data: inserted, error: insertError } = await supabase
    .from('players')
    .insert({
      academy_id: academyId,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      date_of_birth: dateOfBirth,
      join_date: today,
      gender,
      notes,
      status: 'pending_placement',
      is_active: true,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    return { ok: false, error: insertError?.message ?? 'Failed to create player' }
  }

  await writeAuditLog({
    db: supabase,
    academyId,
    actorId: user.id,
    actorRole: membership.role as UserRole,
    action: 'player_created',
    targetType: 'players',
    targetId: inserted.id,
    targetLabel: fullName,
    payload: {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      gender,
      status: 'pending_placement',
    },
    sourceType: 'ui',
  })

  redirect(`/director/players/${inserted.id}/onboard`)
}
