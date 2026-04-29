import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import {
  Shield, Building2, Users, CreditCard, BookOpen,
  CheckCircle2, XCircle, Eye,
} from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getPlatformRole, getAllAcademies } from '@/lib/backend/platform'
import { enterPreviewModeAction } from '@/lib/actions/platform'
import { Card, CardContent, EmptyState } from '@/components/ui'
import type { PreviewRole } from '@/lib/utils/previewMode'

const PREVIEW_ROLES: { role: PreviewRole; label: string }[] = [
  { role: 'academy_director', label: 'Director' },
  { role: 'coach',            label: 'Coach' },
  { role: 'player',           label: 'Player' },
  { role: 'parent',           label: 'Parent' },
]

export default async function PlatformDashboard() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Sequential queries per AI_BACKEND_RULES rule #5
  const platformRole = await getPlatformRole(supabase, user.id)
  if (!platformRole) redirect('/login')

  const academies = await getAllAcademies(supabase)

  const roleLabel =
    platformRole.role === 'platform_owner' ? 'Platform Owner' : 'Platform Admin'

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="p-6 space-y-8 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-3.5 h-3.5 text-lime" />
          <p className="label-xs">Angles Platform</p>
          <span className="ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-lime/10 text-lime border border-lime/20">
            {roleLabel}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-text-primary mt-1">
          Platform Command Center
        </h1>
        <p className="text-text-secondary text-sm mt-1">{today}</p>
      </div>

      {/* ── Academy Tenants ─────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <p className="label-xs">Academy Tenants</p>
          <span className="font-mono text-lime text-sm font-bold leading-none">
            {academies.length}
          </span>
        </div>

        {academies.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Building2 className="w-5 h-5" />}
              title="No academies yet"
              description="Academy tenants will appear here once they are created."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {academies.map(academy => (
              <Card key={academy.id}>
                <CardContent className="py-4 space-y-3">

                  {/* Name + status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary leading-snug truncate">
                        {academy.name}
                      </p>
                      <p className="text-[11px] text-text-muted font-mono mt-0.5 truncate">
                        {academy.slug}
                      </p>
                    </div>
                    <div className="shrink-0 pt-0.5">
                      {academy.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-status-green/10 text-status-green border border-status-green/20">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-surface-raised text-text-muted border border-border">
                          <XCircle className="w-2.5 h-2.5" />
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta fields */}
                  <div className="space-y-1.5 pt-1 border-t border-border">
                    {academy.country && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-text-muted">Country</span>
                        <span className="text-xs text-text-secondary">{academy.country}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-text-muted">Timezone</span>
                      <span className="text-xs text-text-secondary font-mono">
                        {academy.timezone}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-text-muted">Created</span>
                      <span className="text-xs text-text-secondary">
                        {new Date(academy.created_at).toLocaleDateString('en-GB', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Preview controls */}
                  <div className="pt-2 border-t border-border space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3 h-3 text-text-muted" />
                      <p className="text-[10px] uppercase tracking-widest text-text-muted">
                        Preview Portal — reads only · writes disabled
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PREVIEW_ROLES.map(({ role, label }) => {
                        const action = enterPreviewModeAction.bind(null, academy.id, role)
                        return (
                          <form key={role} action={action}>
                            <button
                              type="submit"
                              className="w-full text-xs font-medium text-text-secondary hover:text-text-primary border border-border hover:border-lime/40 rounded-lg py-1.5 px-2 bg-surface hover:bg-surface-raised transition-colors"
                            >
                              {label}
                            </button>
                          </form>
                        )
                      })}
                    </div>
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Platform Modules (coming soon) ──────────────────── */}
      <div>
        <p className="label-xs mb-4">Platform Modules</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ComingSoonCard icon={<Building2 className="w-4 h-4" />} title="Tenant Management" />
          <ComingSoonCard icon={<Users className="w-4 h-4" />}     title="Consultant Access" />
          <ComingSoonCard icon={<CreditCard className="w-4 h-4" />} title="Billing" />
          <ComingSoonCard icon={<BookOpen className="w-4 h-4" />}   title="Global Templates" />
        </div>
      </div>

    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────

function ComingSoonCard({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 opacity-50">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-text-muted">
          {icon}
        </div>
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-surface-raised text-text-muted border border-border">
          Soon
        </span>
      </div>
      <p className="font-semibold text-text-primary">{title}</p>
      <p className="text-xs text-text-muted mt-1">Coming in a future release</p>
    </div>
  )
}
