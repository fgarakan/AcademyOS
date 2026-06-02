'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { isPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import type { FitnessTemplateType } from './fitnessTemplateActions'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

type DbBlockType =
  | 'warm_up' | 'technical' | 'tactical' | 'movement'
  | 'fitness' | 'competition' | 'mental' | 'cool_down' | 'free'

const VALID_BLOCK_TYPES = new Set<string>([
  'warm_up', 'technical', 'tactical', 'movement',
  'fitness', 'competition', 'mental', 'cool_down', 'free',
])

function safeDbBlockType(t: string): DbBlockType {
  return VALID_BLOCK_TYPES.has(t) ? (t as DbBlockType) : 'fitness'
}

export interface FitnessBlockDraftInput {
  label: string
  dbType: string
  durationMin: number
  coachCue: string
  tennisTransferNote: string
}

export interface CreateFitnessTemplateWithBlocksInput {
  name: string
  description: string
  templateType: FitnessTemplateType
  totalDurationMin: number
  blocks: FitnessBlockDraftInput[]
}

export interface CreateFitnessTemplateWithBlocksResult {
  ok: boolean
  error: string | null
  templateId: string | null
}

export async function createFitnessTemplateWithBlocksAction(
  input: CreateFitnessTemplateWithBlocksInput,
): Promise<CreateFitnessTemplateWithBlocksResult> {
  if (await isPreviewMode()) {
    return { ok: false, error: 'Writes are disabled in preview mode.', templateId: null }
  }

  const name = typeof input.name === 'string' ? input.name.trim() : ''
  if (!name) return { ok: false, error: 'Template name is required.', templateId: null }

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

  const templateType = input.templateType ?? 'standard'
  const tags = ['fitness_template:true', `template_type:${templateType}`, 'source:builder_v1', 'status:draft']

  const { data: templateRow, error: templateError } = await rawDb
    .from('templates')
    .insert({
      academy_id:        academyId,
      created_by:        user.id,
      name,
      description:       typeof input.description === 'string' ? input.description.trim() || null : null,
      track:             'fitness',
      total_duration_min: Number.isFinite(input.totalDurationMin) && input.totalDurationMin > 0
        ? Math.floor(input.totalDurationMin)
        : null,
      is_active:  true,
      is_default: false,
      tags,
    })
    .select('id')
    .single()

  if (templateError || !templateRow?.id) {
    return {
      ok: false,
      error: templateError?.message ?? 'Failed to create fitness template.',
      templateId: null,
    }
  }

  const templateId: string = templateRow.id

  if (Array.isArray(input.blocks) && input.blocks.length > 0) {
    const blockRows = input.blocks.map((block, idx) => ({
      template_id:  templateId,
      name:         typeof block.label === 'string' ? block.label.trim() || 'Block' : 'Block',
      type:         safeDbBlockType(typeof block.dbType === 'string' ? block.dbType : 'fitness'),
      duration_min: Number.isFinite(block.durationMin) ? Math.max(0, Math.floor(block.durationMin)) : 0,
      order_index:  idx,
      notes:        JSON.stringify({
        coach_cue:            typeof block.coachCue === 'string'           ? block.coachCue.trim()           : '',
        tennis_transfer_note: typeof block.tennisTransferNote === 'string' ? block.tennisTransferNote.trim() : '',
      }),
    }))

    await rawDb.from('template_blocks').insert(blockRows)
  }

  await writeAuditLog({
    db: supabase,
    academyId,
    actorId: user.id,
    actorRole: role as UserRole,
    action: 'fitness_template_created',
    targetType: 'templates',
    targetId: templateId,
    targetLabel: name,
    payload: {
      template_type: input.templateType ?? 'standard',
      block_count: Array.isArray(input.blocks) ? input.blocks.length : 0,
      total_duration_min: input.totalDurationMin ?? null,
    },
    sourceType: 'ui',
  })

  revalidatePath('/director/fitness/templates')
  return { ok: true, error: null, templateId }
}
