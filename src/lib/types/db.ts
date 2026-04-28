import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

/**
 * The ONLY valid DB type in the system
 */
export type DB = SupabaseClient<Database>