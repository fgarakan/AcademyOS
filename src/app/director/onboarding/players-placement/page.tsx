import Link from 'next/link'
import { ArrowLeft, UserPlus, Info } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { PlayersPlacementForm } from './PlayersPlacementForm'

export default async function PlayersPlacementPage() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Please sign in to access players and placement setup.</p>
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
          Players and placement setup is only available to academy directors.
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
  const playersPlacement = (settings.players_placement as Record<string, unknown>) ?? {}

  const initialAddMethod = (playersPlacement.player_add_method as string) ?? ''
  const initialPlacementApproach = (playersPlacement.placement_approach as string) ?? ''
  const initialApprovalModel = (playersPlacement.placement_approval_model as string) ?? ''
  const initialIntakeInformation = Array.isArray(playersPlacement.intake_information)
    ? (playersPlacement.intake_information as string[])
    : []
  const initialNotes = (playersPlacement.notes as string) ?? ''

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
          <UserPlus className="w-3.5 h-3.5 text-lime" />
          <p className="page-eyebrow">Onboarding · Step 7</p>
        </div>
        <h1 className="page-title">Players + Placement</h1>
        <p className="page-subtitle">
          Define how players will be added to your academy and how initial placement should work.
        </p>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-lime/5 border border-lime/20 text-xs text-text-secondary">
        <Info className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <span>
          This does not add any players or run the placement engine yet. It tells Academy OS how
          player onboarding and placement should be handled when you are ready to start.
        </span>
      </div>

      <Card>
        <CardContent className="py-6">
          <PlayersPlacementForm
            initialAddMethod={initialAddMethod}
            initialPlacementApproach={initialPlacementApproach}
            initialApprovalModel={initialApprovalModel}
            initialIntakeInformation={initialIntakeInformation}
            initialNotes={initialNotes}
          />
        </CardContent>
      </Card>

    </div>
  )
}
