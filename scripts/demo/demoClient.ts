// Mega Sprint 4291–4320 — Service-role Supabase client for the demo harness.
//
// Standalone Node scripts can't use the cookie-based server client, so we build a
// service-role client straight from env. Service role bypasses RLS — used ONLY by the
// seed/reset scripts, never by the app. Requires NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY (load with `node --env-file=.env.local`).

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function getDemoServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Demo harness needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. ' +
        'Run with: node --env-file=.env.local --import tsx scripts/demo/<seed|reset>.ts',
    )
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

/** Map the demo curriculum stage label to the global curriculum_stage enum. */
export const STAGE_ENUM: Record<string, string> = {
  Red: 'red_foundation',
  Orange: 'orange_development',
  Green: 'green_performance',
  Yellow: 'yellow_competitive',
  HP: 'high_performance',
}
