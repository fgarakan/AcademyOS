import Link from 'next/link'
import { GitBranch, ArrowLeft, CheckCircle, AlertTriangle, BarChart2 } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import { CurriculumOverrideDiffCard } from './CurriculumOverrideDiffCard'

export default async function AcademyCurriculumVersionPage() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  let academyId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single<Pick<Tables<'profiles'>, 'academy_id'>>()
    academyId = profile?.academy_id ?? null
  }

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  const rawDb = supabase as any

  // Fetch active/draft academy curriculum version
  interface VersionRow {
    id: string
    name: string
    description: string | null
    status: string
    version_number: number
    cloned_from_global_at: string | null
    activated_at: string | null
    created_at: string
  }

  const { data: versionRow } = await rawDb
    .from('academy_curriculum_versions')
    .select('id, name, description, status, version_number, cloned_from_global_at, activated_at, created_at')
    .eq('academy_id', academyId)
    .in('status', ['active', 'draft'])
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const version: VersionRow | null = versionRow ?? null

  // Fetch overrides for this version
  interface OverrideRow {
    id: string
    target_type: string
    override_type: string
    scope: string
    pathway: string | null
    original_snapshot: Record<string, unknown> | null
    proposed_change: Record<string, unknown>
    applied_change: Record<string, unknown> | null
    override_reason: string | null
    source: string
    raw_input: string | null
    status: string
    created_at: string
    applied_at: string | null
    approved_at: string | null
  }

  let overrides: OverrideRow[] = []
  if (version?.id) {
    const { data: overrideRows } = await rawDb
      .from('academy_curriculum_overrides')
      .select(
        'id, target_type, override_type, scope, pathway, original_snapshot, proposed_change, applied_change, override_reason, source, raw_input, status, created_at, applied_at, approved_at'
      )
      .eq('academy_id', academyId)
      .eq('curriculum_version_id', version.id)
      .order('created_at', { ascending: false })
      .limit(200)
    overrides = (overrideRows ?? []) as OverrideRow[]
  }

  const appliedOverrides = overrides.filter(o => o.status === 'applied')
  const rolledBackOverrides = overrides.filter(o => o.status === 'rolled_back')
  const otherOverrides = overrides.filter(o => o.status !== 'applied' && o.status !== 'rolled_back')

  // ─── Sprint 79: Curriculum Connection Audit queries ──────────────────────
  // All counts use safe fallback to null on error — never crash the page.

  // Templates with curriculum level set
  let templatesWithLevel = 0
  let templatesWithoutLevel = 0
  const { data: templateAuditRows } = await rawDb
    .from('templates')
    .select('curriculum_level_id')
    .eq('academy_id', academyId)
    .eq('is_active', true)
  if (templateAuditRows) {
    templatesWithLevel = (templateAuditRows as Array<{ curriculum_level_id: string | null }>)
      .filter(t => !!t.curriculum_level_id).length
    templatesWithoutLevel = (templateAuditRows as Array<{ curriculum_level_id: string | null }>)
      .filter(t => !t.curriculum_level_id).length
  }

  // Players with curriculum assignment
  let playersWithAssignment = 0
  let playersWithoutAssignment = 0
  const { data: playerCountRows } = await rawDb
    .from('players')
    .select('id')
    .eq('academy_id', academyId)
    .eq('is_active', true)
  const totalActivePlayers = (playerCountRows as Array<{ id: string }> | null)?.length ?? 0

  if (totalActivePlayers > 0) {
    const playerIds = (playerCountRows as Array<{ id: string }>).map(p => p.id)
    const { data: assignedRows } = await rawDb
      .from('player_curriculum_states')
      .select('player_id')
      .eq('academy_id', academyId)
      .in('player_id', playerIds)
    const assignedIds = new Set(
      ((assignedRows ?? []) as Array<{ player_id: string }>).map(r => r.player_id)
    )
    playersWithAssignment = assignedIds.size
    playersWithoutAssignment = totalActivePlayers - assignedIds.size
  }

  const statusColor =
    version?.status === 'active' ? 'text-status-green' :
    version?.status === 'archived' ? 'text-text-muted' :
    'text-status-orange'

  return (
    <div className="animate-fade-in p-6 space-y-6">
      {/* Back link */}
      <Link
        href="/director/curriculum"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-lime transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Curriculum
      </Link>

      {/* Page header */}
      <div>
        <p className="label-xs mb-1">DIRECTOR</p>
        <div className="flex items-center gap-3 flex-wrap">
          <GitBranch className="w-5 h-5 text-lime" />
          <h1 className="text-2xl font-bold text-text-primary">Academy Curriculum Version</h1>
        </div>
        <p className="text-text-secondary text-sm mt-1">
          Your academy&rsquo;s curriculum version and applied customizations.
        </p>
      </div>

      {/* Global guardrail banner */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-surface-raised border border-border text-[11px] text-text-muted">
        <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-status-green" />
        <span>
          Your academy version is separate from the global curriculum. The global curriculum spine
          is never edited by academy directors — all customizations are stored as overrides on this
          version only.
        </span>
      </div>

      {!version ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<GitBranch className="w-5 h-5" />}
              title="No academy curriculum version"
              description="Create one from the Curriculum page to start tracking academy-specific customizations."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Version summary card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-lime" />
                <p className="label-xs">Version Details</p>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[11px] text-text-muted mb-0.5">Name</p>
                  <p className="text-sm font-semibold text-text-primary">{version.name}</p>
                </div>
                <div>
                  <p className="text-[11px] text-text-muted mb-0.5">Status</p>
                  <p className={`text-sm font-mono font-semibold ${statusColor}`}>
                    {version.status}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-text-muted mb-0.5">Version</p>
                  <p className="text-lg font-mono font-bold text-lime">{version.version_number}</p>
                </div>
                <div>
                  <p className="text-[11px] text-text-muted mb-0.5">Applied overrides</p>
                  <p className="text-lg font-mono font-bold text-lime">{appliedOverrides.length}</p>
                </div>
              </div>
              {version.activated_at && (
                <p className="text-[11px] text-text-muted">
                  Activated{' '}
                  {new Date(version.activated_at).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </p>
              )}
              {version.description && (
                <p className="text-[11px] text-text-secondary">{version.description}</p>
              )}
            </CardContent>
          </Card>

          {/* Applied overrides */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-1 border-b border-border">
              <p className="label-xs">Applied Curriculum Overrides</p>
              {appliedOverrides.length > 0 && (
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-status-green/10 text-status-green border border-status-green/30">
                  {appliedOverrides.length} active
                </span>
              )}
            </div>

            {appliedOverrides.length === 0 ? (
              <Card>
                <CardContent className="py-10">
                  <EmptyState
                    icon={<AlertTriangle className="w-5 h-5" />}
                    title="No applied overrides"
                    description="Submit a voice curriculum customization from the Curriculum page, approve it in the Review Queue, and apply it here."
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {appliedOverrides.map(ov => (
                  <CurriculumOverrideDiffCard key={ov.id} override={ov} />
                ))}
              </div>
            )}
          </div>

          {/* Rolled back overrides */}
          {rolledBackOverrides.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-1 border-b border-border">
                <p className="label-xs text-text-muted">Rolled Back Overrides</p>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-raised text-text-muted border border-border">
                  {rolledBackOverrides.length}
                </span>
              </div>
              <div className="space-y-4">
                {rolledBackOverrides.map(ov => (
                  <CurriculumOverrideDiffCard key={ov.id} override={ov} />
                ))}
              </div>
            </div>
          )}

          {/* Other statuses (draft, pending, approved) */}
          {otherOverrides.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-1 border-b border-border">
                <p className="label-xs text-text-muted">In-Progress Overrides</p>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-raised text-text-muted border border-border">
                  {otherOverrides.length}
                </span>
              </div>
              <div className="space-y-4">
                {otherOverrides.map(ov => (
                  <CurriculumOverrideDiffCard key={ov.id} override={ov} />
                ))}
              </div>
            </div>
          )}

          {/* Sprint 79 — Curriculum Connection Audit */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 pb-1">
              <BarChart2 className="w-4 h-4 text-text-muted" />
              <p className="label-xs">Curriculum Connection Audit</p>
            </div>

            <Card>
              <CardContent className="py-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

                  {/* Academy version */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Academy Version</p>
                    {version ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-status-green" />
                        <p className="text-xs text-status-green font-semibold">Active</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-status-orange" />
                        <p className="text-xs text-status-orange">None</p>
                      </div>
                    )}
                  </div>

                  {/* Applied overrides */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Applied Overrides</p>
                    <p className={`text-lg font-mono font-bold ${appliedOverrides.length > 0 ? 'text-lime' : 'text-text-muted'}`}>
                      {appliedOverrides.length}
                    </p>
                  </div>

                  {/* Rolled back */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Rolled Back</p>
                    <p className="text-lg font-mono font-bold text-text-muted">
                      {rolledBackOverrides.length}
                    </p>
                  </div>

                  {/* Templates with curriculum */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Templates (with level)</p>
                    <p className={`text-lg font-mono font-bold ${templatesWithLevel > 0 ? 'text-lime' : 'text-text-muted'}`}>
                      {templatesWithLevel}
                    </p>
                  </div>

                  {/* Templates without */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Templates (no level)</p>
                    <p className={`text-lg font-mono font-bold ${templatesWithoutLevel > 0 ? 'text-status-orange' : 'text-text-muted'}`}>
                      {templatesWithoutLevel}
                    </p>
                  </div>

                  {/* Players with assignment */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Players (assigned)</p>
                    <p className={`text-lg font-mono font-bold ${playersWithAssignment > 0 ? 'text-lime' : 'text-text-muted'}`}>
                      {playersWithAssignment} / {totalActivePlayers}
                    </p>
                  </div>

                </div>

                {/* Recommendations */}
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">Recommended Actions</p>
                  {templatesWithoutLevel > 0 && (
                    <div className="flex items-start gap-2 text-[11px] text-status-orange">
                      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>{templatesWithoutLevel} template{templatesWithoutLevel > 1 ? 's are' : ' is'} missing a curriculum level. Open each template and select a Curriculum Focus to enable academy-aware block population.</span>
                    </div>
                  )}
                  {playersWithoutAssignment > 0 && (
                    <div className="flex items-start gap-2 text-[11px] text-status-orange">
                      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>{playersWithoutAssignment} active player{playersWithoutAssignment > 1 ? 's have' : ' has'} no curriculum assignment. Assign a curriculum level from each player&rsquo;s Skill Path tab.</span>
                    </div>
                  )}
                  {templatesWithLevel > 0 && appliedOverrides.length === 0 && (
                    <div className="flex items-start gap-2 text-[11px] text-text-muted">
                      <CheckCircle className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>Templates are curriculum-connected. No academy overrides active — sessions use global curriculum defaults.</span>
                    </div>
                  )}
                  {appliedOverrides.length > 0 && (
                    <div className="flex items-start gap-2 text-[11px] text-status-green">
                      <CheckCircle className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>{appliedOverrides.length} academy override{appliedOverrides.length > 1 ? 's are' : ' is'} active. Template block population and session generation will include override context.</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
