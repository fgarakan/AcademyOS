'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getPlatformRole } from '@/lib/backend/platform'
import { PREVIEW_COOKIE, type PreviewRole, type PreviewContext } from '@/lib/utils/previewMode'

const VALID_ROLES: PreviewRole[] = ['academy_director', 'coach', 'player', 'parent']

const ROLE_ROUTES: Record<PreviewRole, string> = {
  academy_director: '/director',
  coach:            '/coach',
  player:           '/player',
  parent:           '/parent',
}

export async function enterPreviewModeAction(
  academyId: string,
  role: PreviewRole,
): Promise<void> {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const platformRole = await getPlatformRole(supabase, user.id)
  if (!platformRole) throw new Error('Platform access required')

  if (!VALID_ROLES.includes(role)) throw new Error('Invalid preview role')

  // rawDb cast — platform_roles and academy narrow-select not yet in database.types.ts
  const rawDb = supabase as any
  const { data: academy, error } = await rawDb
    .from('academies')
    .select('id, name')
    .eq('id', academyId)
    .single()

  if (error || !academy) throw new Error('Academy not found')

  const ctx: PreviewContext = {
    role,
    academy_id: academyId,
    academy_name: (academy as { id: string; name: string }).name,
    started_at: new Date().toISOString(),
  }

  const cookieStore = await cookies()
  cookieStore.set(PREVIEW_COOKIE, JSON.stringify(ctx), {
    httpOnly: true,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 60 * 60 * 8,
    secure: process.env.NODE_ENV === 'production',
  })

  redirect(ROLE_ROUTES[role])
}

export async function exitPreviewModeAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(PREVIEW_COOKIE)
  redirect('/platform')
}
