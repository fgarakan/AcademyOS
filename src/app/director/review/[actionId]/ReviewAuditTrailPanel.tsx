// Sprint 640 — Review Approval Audit Trail V1
// Sprint 667 — Debug IDs + Action Trace V1 (added action ID chip and player ID chip)
// Server component — reads audit_logs for the current proposed_action.
// Director-only: the parent page already validates academy_director / head_coach role.
// No sensitive data exposed. Shows: action, actor (by ID), timestamp, source_type.
// Uses rawDb for consistency with existing audit_log query pattern (see player profile page).

import { getSupabaseServer } from '@/lib/supabase/server'
import { ShieldCheck, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

function shortId(id: string): string {
  return id.slice(0, 8)
}

interface AuditEntry {
  id: string
  action: string
  actor_id: string | null
  created_at: string
  source_type: string
  target_type: string
  payload: Record<string, unknown> | null
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function actionColor(action: string): string {
  if (action.includes('executed') || action.includes('advanced') || action.includes('applied')) return 'text-status-green'
  if (action.includes('rejected') || action.includes('error')) return 'text-status-red'
  if (action.includes('approved') || action.includes('reviewed')) return 'text-lime'
  if (action.includes('created') || action.includes('drafted') || action.includes('recorded')) return 'text-status-blue'
  return 'text-text-muted'
}

interface Props {
  actionId: string
  academyId: string
  playerId?: string | null
}

export async function ReviewAuditTrailPanel({ actionId, academyId, playerId }: Props) {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // Query audit_logs where target_id matches the proposed_action id OR the player id
  // Limit to 15 most recent entries, scoped to academy_id
  const targetIds = [actionId]
  if (playerId) targetIds.push(playerId)

  const { data: rows } = await rawDb
    .from('audit_logs')
    .select('id, action, actor_id, created_at, source_type, target_type, payload')
    .eq('academy_id', academyId)
    .in('target_id', targetIds)
    .order('created_at', { ascending: false })
    .limit(15)

  const entries: AuditEntry[] = rows ?? []

  const debugChips = (
    <div className="flex flex-wrap gap-1.5 mt-2">
      <span className="font-mono text-[9px] text-text-muted bg-surface-raised border border-border px-1.5 py-0.5 rounded">
        action:{shortId(actionId)}
      </span>
      {playerId && (
        <span className="font-mono text-[9px] text-text-muted bg-surface-raised border border-border px-1.5 py-0.5 rounded">
          player:{shortId(playerId)}
        </span>
      )}
    </div>
  )

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-status-green shrink-0" />
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Audit Trail</p>
          </div>
          {debugChips}
          <p className="text-[11px] text-text-muted mt-3">No audit events recorded for this item yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-status-green shrink-0" />
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Audit Trail</p>
          </div>
          {debugChips}
        </div>

        <div className="space-y-2">
          {entries.map(entry => (
            <div key={entry.id} className="flex items-start gap-2 py-2 border-b border-border last:border-0">
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className={`text-[11px] font-medium ${actionColor(entry.action)}`}>
                  {formatAction(entry.action)}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  <span className="flex items-center gap-1 text-[10px] text-text-muted">
                    <Clock className="w-2.5 h-2.5 shrink-0" />
                    {new Date(entry.created_at).toLocaleString('en-US', {
                      month: 'short', day: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    })}
                  </span>
                  {entry.source_type && (
                    <span className="text-[10px] text-text-muted">{entry.source_type}</span>
                  )}
                  {entry.target_type && (
                    <span className="text-[10px] text-text-muted">{entry.target_type}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-text-muted">
          Showing {entries.length} most recent event{entries.length !== 1 ? 's' : ''}. Audit log is academy-scoped and director-visible only.
        </p>
      </CardContent>
    </Card>
  )
}
