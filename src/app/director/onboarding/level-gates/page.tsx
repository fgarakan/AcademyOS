import Link from 'next/link'
import { ArrowLeft, GitBranch, Info } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { LevelGatesForm } from './LevelGatesForm'

export default async function LevelGatesPage() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Please sign in to access level gate setup.</p>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!profile?.academy_id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (membership?.role !== 'academy_director') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">
          Level gate setup is only available to academy directors.
        </p>
      </div>
    )
  }

  const rawDb = supabase as any
  const { data: academy } = await rawDb
    .from('academies')
    .select('id, name, settings')
    .eq('id', academyId)
    .single()

  if (!academy) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy not found.</p>
      </div>
    )
  }

  const settings = (academy.settings as Record<string, unknown>) ?? {}
  const levelGates = (settings.level_gates as Record<string, unknown>) ?? {}

  const initialApprovalModel = (levelGates.approval_model as string) ?? ''
  const initialEvidenceRequired = Array.isArray(levelGates.evidence_required)
    ? (levelGates.evidence_required as string[])
    : []
  const initialPortalVisibility = (levelGates.portal_visibility as string) ?? ''
  const initialNotes = (levelGates.notes as string) ?? ''

  return (
    <div className="animate-fade-in p-6 space-y-6 max-w-2xl">

      <Link
        href="/director/onboarding"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Onboarding
      </Link>

      {/* ── Page header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <GitBranch className="w-3.5 h-3.5 text-lime" />
          <p className="page-eyebrow">Onboarding · Step 4</p>
        </div>
        <h1 className="page-title">Level Gates + Promotion Rules</h1>
        <p className="page-subtitle">
          Define how players move to the next level.
        </p>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-lime/5 border border-lime/20 text-xs text-text-secondary">
        <Info className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <span>
          This does not move any player yet. It tells Academy OS how level movement should be
          reviewed and approved.
        </span>
      </div>

      <Card>
        <CardContent className="py-6">
          <LevelGatesForm
            initialApprovalModel={initialApprovalModel}
            initialEvidenceRequired={initialEvidenceRequired}
            initialPortalVisibility={initialPortalVisibility}
            initialNotes={initialNotes}
          />
        </CardContent>
      </Card>

    </div>
  )
}
