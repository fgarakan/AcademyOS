import Link from 'next/link'
import { MessageSquare, CheckCircle2, Clock, Send, ArrowRight, ShieldCheck, Eye } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { DEMO_PARENT_UPDATES } from '@/lib/demo/demoData'
import { DonnaOpenChip } from '@/components/assistant/DonnaOpenChip'
// Sprint 1166-1185: add guardian form
import { AddGuardianForm } from './_components/AddGuardianForm'

// ── Types ─────────────────────────────────────────────────────────────────────

type ParentUpdateStatus = 'draft' | 'reviewed' | 'approved' | 'sent' | 'cancelled'

interface ParentUpdateRow {
  id: string
  player_id: string
  status: ParentUpdateStatus
  subject: string | null
  content: string
  content_draft: string | null
  created_at: string
  approved_at: string | null
  sent_at: string | null
  player_full_name: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusLabel(status: ParentUpdateStatus): string {
  const labels: Record<ParentUpdateStatus, string> = {
    draft: 'Draft',
    reviewed: 'Needs Approval',
    approved: 'Approved',
    sent: 'Sent',
    cancelled: 'Cancelled',
  }
  return labels[status] ?? status
}

function statusColor(status: ParentUpdateStatus): string {
  if (status === 'draft') return 'text-text-muted bg-surface border-border'
  if (status === 'reviewed') return 'text-status-orange bg-status-orange/10 border-status-orange/30'
  if (status === 'approved') return 'text-status-green bg-status-green/10 border-status-green/30'
  if (status === 'sent') return 'text-status-blue bg-status-blue/10 border-status-blue/30'
  return 'text-text-muted bg-surface border-border'
}

function previewContent(row: ParentUpdateRow): string {
  const source = row.content_draft ?? row.content
  return source.length > 120 ? source.slice(0, 120) + '…' : source
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-surface-raised border border-border rounded-xl px-5 py-4">
      <p className={`text-2xl font-mono font-bold ${color}`}>{value}</p>
      <p className="label-xs mt-0.5">{label}</p>
    </div>
  )
}

function WorkflowStep({ step, label, active }: { step: number; label: string; active?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 ${active ? '' : 'opacity-50'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-bold border ${
        active ? 'bg-lime/10 border-lime text-lime' : 'bg-surface-raised border-border text-text-muted'
      }`}>
        {step}
      </div>
      <p className="text-[9px] uppercase tracking-widest text-text-muted text-center max-w-[64px] leading-tight">{label}</p>
    </div>
  )
}

function UpdateCard({ row }: { row: ParentUpdateRow }) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-surface-raised border border-border">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {row.player_full_name && (
              <Link
                href={`/director/players/${row.player_id}`}
                className="text-sm font-semibold text-text-primary hover:text-lime transition-colors"
              >
                {row.player_full_name}
              </Link>
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColor(row.status)}`}>
              {statusLabel(row.status)}
            </span>
          </div>
          {row.subject && (
            <p className="text-[11px] text-text-secondary mt-0.5">{row.subject}</p>
          )}
          <p className="text-[10px] text-text-muted mt-0.5">Created {formatDate(row.created_at)}</p>
        </div>
        {row.approved_at && (
          <div className="text-right shrink-0">
            <p className="text-[9px] uppercase tracking-widest text-status-green">Approved</p>
            <p className="text-[10px] text-text-muted">{formatDate(row.approved_at)}</p>
          </div>
        )}
      </div>

      {/* Parent-safe content preview */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-surface border border-border">
        <Eye className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
        <p className="text-[11px] text-text-secondary leading-relaxed">{previewContent(row)}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-status-green shrink-0" />
          <p className="text-[10px] text-text-muted">Parent-safe preview — internal notes not shown</p>
        </div>
        {row.status === 'draft' || row.status === 'reviewed' ? (
          <Link
            href="/director/review"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border text-[11px] text-text-secondary hover:border-lime/40 hover:text-text-primary transition-colors"
          >
            Review in queue <ArrowRight className="w-3 h-3" />
          </Link>
        ) : null}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ParentCommunicationCenterPage({
  searchParams,
}: {
  searchParams: { demo?: string }
}) {
  const isDemoMode = searchParams.demo === '1'
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">No session. Please sign in.</p>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  const academyId = profile?.academy_id ?? null

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  // ── Active players for guardian form ────────────────────────────────────────
  const { data: activePlayers } = await supabase
    .from('players')
    .select('id, full_name, first_name, last_name')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('full_name', { ascending: true })
    .limit(50)

  const playerOptions = (activePlayers ?? []).map(p => ({
    id: p.id,
    fullName: p.full_name ?? (`${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Unknown'),
  }))

  // ── Data source ────────────────────────────────────────────────────────────
  // Demo mode: use local static fixtures. Normal mode: query Supabase.

  let updates: ParentUpdateRow[]

  if (isDemoMode) {
    updates = DEMO_PARENT_UPDATES as ParentUpdateRow[]
  } else {
    // Query parent_updates with player name
    const { data: rawUpdates } = await supabase
      .from('parent_updates')
      .select('id, player_id, status, subject, content, content_draft, created_at, approved_at, sent_at, players(full_name)')
      .eq('academy_id', academyId)
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(50)

    updates = (rawUpdates ?? []).map(r => ({
      id: r.id,
      player_id: r.player_id,
      status: r.status as ParentUpdateStatus,
      subject: r.subject,
      content: r.content,
      content_draft: r.content_draft,
      created_at: r.created_at,
      approved_at: r.approved_at,
      sent_at: r.sent_at,
      player_full_name: (r.players as { full_name: string | null } | null)?.full_name ?? null,
    }))
  }

  const needsApproval = updates.filter(u => u.status === 'draft' || u.status === 'reviewed')
  const approved = updates.filter(u => u.status === 'approved')
  const sent = updates.filter(u => u.status === 'sent')

  return (
    <div className="animate-fade-in p-6 space-y-6">

      {/* Header */}
      <div>
        <p className="page-eyebrow">Communications</p>
        <h1 className="page-title">Parent Communication Center</h1>
        <p className="text-sm text-text-secondary mt-1">
          Review and approve parent-safe updates before they leave the system.
        </p>
      </div>

      {/* Workflow banner */}
      <div className="px-5 py-4 rounded-xl bg-surface-raised border border-border">
        <p className="text-[9px] uppercase tracking-widest text-text-muted mb-4">How communications flow</p>
        <div className="flex items-start justify-between gap-2">
          <WorkflowStep step={1} label="Coach Recap" active />
          <div className="flex-1 flex items-center justify-center mt-3">
            <div className="h-px bg-border flex-1" />
            <ArrowRight className="w-3 h-3 text-text-muted mx-1 shrink-0" />
            <div className="h-px bg-border flex-1" />
          </div>
          <WorkflowStep step={2} label="DONNA Drafts" active />
          <div className="flex-1 flex items-center justify-center mt-3">
            <div className="h-px bg-border flex-1" />
            <ArrowRight className="w-3 h-3 text-text-muted mx-1 shrink-0" />
            <div className="h-px bg-border flex-1" />
          </div>
          <WorkflowStep step={3} label="Director Reviews" active />
          <div className="flex-1 flex items-center justify-center mt-3">
            <div className="h-px bg-border flex-1" />
            <ArrowRight className="w-3 h-3 text-text-muted mx-1 shrink-0" />
            <div className="h-px bg-border flex-1" />
          </div>
          <WorkflowStep step={4} label="Parent Receives" />
        </div>
        <p className="text-[10px] text-text-muted mt-4">
          External delivery is not yet active — approved messages are staged and ready for when the delivery pipeline is enabled.
        </p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard value={updates.length} label="Total" color="text-lime" />
        <StatCard value={needsApproval.length} label="Needs Approval" color="text-status-orange" />
        <StatCard value={approved.length} label="Approved" color="text-status-green" />
        <StatCard value={sent.length} label="Sent" color="text-status-blue" />
      </div>

      {/* DONNA Intelligence */}
      <div className="px-4 py-3 rounded-xl bg-surface border border-border">
        <p className="text-[9px] uppercase tracking-widest text-text-muted mb-2.5">Ask DONNA</p>
        <div className="flex flex-wrap gap-2">
          {[
            'Who needs a parent update?',
            'Draft a parent-safe update.',
            'Show pending parent drafts.',
            'What updates are waiting for approval?',
          ].map((prompt) => (
            <DonnaOpenChip key={prompt} prompt={prompt} />
          ))}
        </div>
      </div>

      {/* Sprint 1166-1185: Add Guardian form */}
      <AddGuardianForm players={playerOptions} />

      {/* Needs approval */}
      {needsApproval.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-status-orange" />
            <p className="label-xs">Needs Approval</p>
            <span className="text-[10px] font-mono font-bold text-status-orange">{needsApproval.length}</span>
          </div>
          <div className="space-y-3">
            {needsApproval.map(row => <UpdateCard key={row.id} row={row} />)}
          </div>
        </div>
      )}

      {/* Approved */}
      {approved.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-status-green" />
            <p className="label-xs">Approved — Staged for Delivery</p>
            <span className="text-[10px] font-mono font-bold text-status-green">{approved.length}</span>
          </div>
          <div className="space-y-3">
            {approved.map(row => <UpdateCard key={row.id} row={row} />)}
          </div>
        </div>
      )}

      {/* Sent */}
      {sent.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-4 h-4 text-status-blue" />
            <p className="label-xs">Sent</p>
            <span className="text-[10px] font-mono font-bold text-status-blue">{sent.length}</span>
          </div>
          <div className="space-y-3">
            {sent.map(row => <UpdateCard key={row.id} row={row} />)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {updates.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<MessageSquare className="w-8 h-8 text-text-muted" />}
              title="No parent communications yet"
              description="Parent updates are drafted by DONNA from coach recaps and submitted for your review before anything is sent."
            />
          </CardContent>
        </Card>
      )}

    </div>
  )
}
