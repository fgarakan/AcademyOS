// Sprint 668 — Admin Support Diagnostic View V1
// Director-only page. Not in sidebar — accessed by URL for support use.
// Shows academy health, data counts, onboarding status, and system flags.
// No sensitive personal data exposed. IDs shown in abbreviated form only.

import { getSupabaseServer } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { ShieldCheck, Users, Calendar, ClipboardList, Rocket, Terminal, CheckCircle2, Circle } from 'lucide-react'

function shortId(id: string): string {
  return id.slice(0, 8)
}

function StatusDot({ ok }: { ok: boolean }) {
  return ok
    ? <span className="inline-block w-2 h-2 rounded-full bg-status-green shrink-0" />
    : <span className="inline-block w-2 h-2 rounded-full bg-status-orange shrink-0" />
}

export default async function SupportDiagnosticsPage() {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id, display_name')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) notFound()

  const academyId = profile.academy_id

  // Role guard
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') notFound()

  // Academy details
  const { data: academy } = await rawDb
    .from('academies')
    .select('name, settings')
    .eq('id', academyId)
    .single()

  const academyName: string = academy?.name ?? 'Unknown'
  const settings = (academy?.settings as Record<string, unknown>) ?? {}

  const ONBOARDING_KEYS = [
    { key: 'academy_identity_completed', label: 'Academy Identity' },
    { key: 'director_interview_completed', label: 'Director Interview' },
    { key: 'curriculum_setup_completed', label: 'Curriculum Setup' },
    { key: 'level_gates_completed', label: 'Level Gates' },
    { key: 'programs_groups_completed', label: 'Programs & Groups' },
    { key: 'coaches_permissions_completed', label: 'Coaches & Permissions' },
    { key: 'players_placement_completed', label: 'Players & Placement' },
  ]

  // Data counts
  const [
    { count: activePlayers },
    { count: activeCoaches },
    { count: pendingActions },
    { count: totalAuditLogs },
    { count: totalSessions },
  ] = await Promise.all([
    rawDb.from('players').select('id', { count: 'exact', head: true }).eq('academy_id', academyId).eq('is_active', true),
    rawDb.from('academy_memberships').select('id', { count: 'exact', head: true }).eq('academy_id', academyId).eq('is_active', true).in('role', ['coach', 'head_coach']),
    rawDb.from('proposed_actions').select('id', { count: 'exact', head: true }).eq('academy_id', academyId).eq('status', 'pending_review'),
    rawDb.from('audit_logs').select('id', { count: 'exact', head: true }).eq('academy_id', academyId),
    rawDb.from('sessions').select('id', { count: 'exact', head: true }).eq('academy_id', academyId),
  ])

  // Recent audit events (last 5)
  const { data: recentAudit } = await rawDb
    .from('audit_logs')
    .select('id, action, created_at, source_type')
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false })
    .limit(5)

  const generatedAt = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <div className="p-6 space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <p className="page-eyebrow">Support</p>
        <h1 className="page-title">Academy Diagnostics</h1>
        <p className="page-subtitle text-[11px] text-text-muted mt-1">
          Director-visible support view · Generated {generatedAt} · Not shown in main navigation
        </p>
      </div>

      {/* Academy identity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-lime" />
            <p className="text-sm font-semibold text-text-primary">Academy Identity</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between py-1 border-b border-border">
            <span className="text-xs text-text-muted">Name</span>
            <span className="text-xs font-medium text-text-primary">{academyName}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-border">
            <span className="text-xs text-text-muted">Academy ID</span>
            <span className="font-mono text-[10px] text-text-muted">{shortId(academyId)}…</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-border">
            <span className="text-xs text-text-muted">Viewing as</span>
            <span className="text-xs text-text-secondary">{profile.display_name ?? user.email} ({role})</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-text-muted">User ID</span>
            <span className="font-mono text-[10px] text-text-muted">{shortId(user.id)}…</span>
          </div>
        </CardContent>
      </Card>

      {/* Data counts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-text-muted" />
            <p className="text-sm font-semibold text-text-primary">Data Counts</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Active Players', value: activePlayers ?? 0, icon: Users },
              { label: 'Active Coaches', value: activeCoaches ?? 0, icon: Users },
              { label: 'Pending Actions', value: pendingActions ?? 0, icon: ClipboardList },
              { label: 'Total Sessions', value: totalSessions ?? 0, icon: Calendar },
              { label: 'Audit Log Events', value: totalAuditLogs ?? 0, icon: ShieldCheck },
            ].map(({ label, value }) => (
              <div key={label} className="px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">{label}</p>
                <p className="text-xl font-mono font-bold text-text-primary mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Onboarding status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-text-muted" />
            <p className="text-sm font-semibold text-text-primary">Onboarding Checklist</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {ONBOARDING_KEYS.map(({ key, label }) => {
            const done = settings[key] === true
            return (
              <div key={key} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  {done
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
                    : <Circle className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  }
                  <span className="text-xs text-text-secondary">{label}</span>
                </div>
                <span className={`text-[10px] font-medium ${done ? 'text-status-green' : 'text-text-muted'}`}>
                  {done ? 'Done' : 'Pending'}
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Recent audit events */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-text-muted" />
            <p className="text-sm font-semibold text-text-primary">Recent Audit Events</p>
            <span className="text-[10px] text-text-muted">(last 5)</span>
          </div>
        </CardHeader>
        <CardContent>
          {(recentAudit ?? []).length === 0 ? (
            <p className="text-xs text-text-muted">No audit events recorded yet.</p>
          ) : (
            <div className="space-y-1.5">
              {(recentAudit ?? []).map((entry: { id: string; action: string; created_at: string; source_type: string }) => (
                <div key={entry.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0">
                  <span className="text-[11px] font-medium text-text-secondary truncate">
                    {entry.action.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.source_type && (
                      <span className="text-[9px] font-mono text-text-muted bg-surface-raised border border-border px-1 py-0.5 rounded">
                        {entry.source_type}
                      </span>
                    )}
                    <span className="text-[10px] text-text-muted">
                      {new Date(entry.created_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric',
                        hour: 'numeric', minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-[10px] text-text-muted pb-4">
        This page is academy-scoped and director-visible only. IDs are abbreviated for readability. No raw personal data is shown.
      </p>

    </div>
  )
}
