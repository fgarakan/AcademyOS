// Sprint 434 — Director Alert Queries V1
// Typed query helpers for director alert and signal views.
// Uses the v_player_signal_dashboard view. No select('*'). Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export interface DirectorAlertEntry {
  signalId: string | null
  playerId: string | null
  playerName: string | null
  groupName: string | null
  title: string | null
  description: string | null
  severity: string | null
  domain: Database['public']['Enums']['development_track'] | null
  urgency: string | null
  recommendedAction: string | null
  emittedAt: string | null
  expiresAt: string | null
}

// Fetch active high-priority alerts for the director inbox.
export async function fetchDirectorAlerts(
  db: SupabaseClient<Database>,
  academyId: string,
  limit = 20,
): Promise<DirectorAlertEntry[]> {
  const rawDb = db as ReturnType<typeof db.from> extends never ? never : typeof db

  const { data, error } = await (rawDb as typeof db)
    .from('v_player_signal_dashboard')
    .select('signal_id, player_id, player_name, group_name, title, description, severity, domain, player_urgency, recommended_action, emitted_at, expires_at')
    .eq('academy_id', academyId)
    .in('severity', ['high', 'critical'])
    .order('emitted_at', { ascending: false })
    .limit(limit)

  if (error) return []

  return (data ?? []).map(row => ({
    signalId: row.signal_id,
    playerId: row.player_id,
    playerName: row.player_name,
    groupName: row.group_name,
    title: row.title,
    description: row.description,
    severity: row.severity,
    domain: row.domain,
    urgency: row.player_urgency,
    recommendedAction: row.recommended_action,
    emittedAt: row.emitted_at,
    expiresAt: row.expires_at,
  }))
}

// Fetch the count of unresolved high-priority alerts.
export async function fetchDirectorAlertCount(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<number> {
  const rawDb = db as ReturnType<typeof db.from> extends never ? never : typeof db

  const { count, error } = await (rawDb as typeof db)
    .from('v_player_signal_dashboard')
    .select('signal_id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .in('severity', ['high', 'critical'])

  if (error) return 0
  return count ?? 0
}

// Fetch signals for a specific player.
export async function fetchPlayerSignals(
  db: SupabaseClient<Database>,
  academyId: string,
  playerId: string,
): Promise<DirectorAlertEntry[]> {
  const rawDb = db as ReturnType<typeof db.from> extends never ? never : typeof db

  const { data, error } = await (rawDb as typeof db)
    .from('v_player_signal_dashboard')
    .select('signal_id, player_id, player_name, group_name, title, description, severity, domain, player_urgency, recommended_action, emitted_at, expires_at')
    .eq('academy_id', academyId)
    .eq('player_id', playerId)
    .order('emitted_at', { ascending: false })
    .limit(10)

  if (error) return []

  return (data ?? []).map(row => ({
    signalId: row.signal_id,
    playerId: row.player_id,
    playerName: row.player_name,
    groupName: row.group_name,
    title: row.title,
    description: row.description,
    severity: row.severity,
    domain: row.domain,
    urgency: row.player_urgency,
    recommendedAction: row.recommended_action,
    emittedAt: row.emitted_at,
    expiresAt: row.expires_at,
  }))
}
