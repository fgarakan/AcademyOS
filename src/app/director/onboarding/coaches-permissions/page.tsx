import Link from 'next/link'
import { ArrowLeft, Users, Info } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { CoachesPermissionsForm } from './CoachesPermissionsForm'

export default async function CoachesPermissionsPage() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Please sign in to access coaches and permissions setup.</p>
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
          Coaches and permissions setup is only available to academy directors.
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
  const coachesPerms = (settings.coaches_permissions as Record<string, unknown>) ?? {}

  const initialTeamStructure = (coachesPerms.coaching_team_structure as string) ?? ''
  const initialAccessLevel = (coachesPerms.coach_access_level as string) ?? ''
  const initialLevelRecommendation = (coachesPerms.level_recommendation_permission as string) ?? ''
  const initialCommunicationPermission = (coachesPerms.communication_permission as string) ?? ''
  const initialNotes = (coachesPerms.notes as string) ?? ''

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
          <Users className="w-3.5 h-3.5 text-lime" />
          <p className="page-eyebrow">Onboarding · Step 6</p>
        </div>
        <h1 className="page-title">Coaches + Permissions</h1>
        <p className="page-subtitle">
          Define how your coaching team operates inside Academy OS.
        </p>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-lime/5 border border-lime/20 text-xs text-text-secondary">
        <Info className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <span>
          This does not invite coaches or change real permissions yet. It tells Academy OS how your
          coaching team should operate when coaches are added in a later step.
        </span>
      </div>

      <Card>
        <CardContent className="py-6">
          <CoachesPermissionsForm
            initialTeamStructure={initialTeamStructure}
            initialAccessLevel={initialAccessLevel}
            initialLevelRecommendation={initialLevelRecommendation}
            initialCommunicationPermission={initialCommunicationPermission}
            initialNotes={initialNotes}
          />
        </CardContent>
      </Card>

    </div>
  )
}
