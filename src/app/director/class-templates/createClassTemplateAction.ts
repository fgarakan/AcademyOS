'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { isPreviewMode } from '@/lib/utils/previewMode'

export interface CreateClassTemplateInput {
  name: string
  description?: string
  track?: string
  totalDurationMin?: number
}

export interface CreateClassTemplateResult {
  ok: boolean
  error: string | null
  templateId: string | null
}

export async function createClassTemplateAction(
  input: CreateClassTemplateInput,
): Promise<CreateClassTemplateResult> {
  if (await isPreviewMode()) {
    return { ok: false, error: 'Writes are disabled in preview mode.', templateId: null }
  }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.', templateId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.', templateId: null }
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
    return { ok: false, error: 'Director or Head Coach access required.', templateId: null }
  }

  const rawDb = supabase as any
  const { data, error } = await rawDb
    .from('templates')
    .insert({
      academy_id: academyId,
      created_by: user.id,
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      track: input.track?.trim() || null,
      total_duration_min: input.totalDurationMin ?? null,
      is_active: true,
      is_default: false,
      tags: [],
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message, templateId: null }

  revalidatePath('/director/class-templates')
  return { ok: true, error: null, templateId: data.id }
}
