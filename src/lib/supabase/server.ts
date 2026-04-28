import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

type CookieToSet = {
  name: string
  value: string
  options: CookieOptions
}

export async function getSupabaseServer(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const cookiesToSet: CookieToSet[] = []

  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookiesToSet.push({ name, value, options })
      },
      remove(name: string, options: CookieOptions) {
        cookiesToSet.push({ name, value: '', options })
      },
    },
  })

  cookiesToSet.forEach(({ name, value, options }) => {
    cookieStore.set(name, value, options)
  })

  // 🔥 CRITICAL FIX — align Supabase SSR typing with your backend DB type
  return client as unknown as SupabaseClient<Database>
}

export function getSupabaseAdmin(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const client = createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      get() {
        return undefined
      },
      set() {},
      remove() {},
    },
  })

  // 🔥 Same fix here
  return client as unknown as SupabaseClient<Database>
}