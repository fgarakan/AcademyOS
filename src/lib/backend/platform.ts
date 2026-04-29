import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

export interface PlatformRoleRow {
  user_id: string
  role: 'platform_owner' | 'platform_admin'
  is_active: boolean
}

// Safe subset of academy columns shown in the platform tenant list.
// Excludes settings (JSONB) and updated_at — not needed for the list view.
export type AcademyListItem = Pick<
  Tables<'academies'>,
  'id' | 'name' | 'slug' | 'country' | 'timezone' | 'is_active' | 'created_at'
>

// platform_roles is not yet in database.types.ts — rawDb cast required.
// Regenerate types after applying migration 040.
export async function getPlatformRole(
  db: DB,
  userId: string
): Promise<PlatformRoleRow | null> {
  const rawDb = db as any
  const { data, error } = await rawDb
    .from('platform_roles')
    .select('user_id, role, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (error?.code === 'PGRST116') return null
  if (error) throw error
  return (data as PlatformRoleRow) ?? null
}

// Queries all academies visible to the current user.
// Requires the "Platform roles see all academies" policy from
// migration 040 to be active. Regular anon key is sufficient.
// rawDb cast used to avoid Supabase partial-select inference issues.
export async function getAllAcademies(db: DB): Promise<AcademyListItem[]> {
  const rawDb = db as any
  const { data, error } = await rawDb
    .from('academies')
    .select('id, name, slug, country, timezone, is_active, created_at')
    .order('name')

  if (error) throw error
  return (data as AcademyListItem[]) ?? []
}
