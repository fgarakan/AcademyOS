import { SidebarNav } from '@/components/nav/SidebarNav'
import { getSupabaseServer } from '@/lib/supabase/server'
import { PreviewBanner } from '@/components/platform/PreviewBanner'
import { DonnaAssistantButton } from '@/components/assistant/DonnaAssistantButton'
import { FirstRunDeckGate } from '@/components/onboarding/FirstRunDeckGate'

export default async function DirectorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await getSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let academyName = ''
  let academyId = ''
  let pendingCount = 0
  let userEmail = ''
  let userDisplayName = ''
  let hasSeenFirstRunDeck = true
  let onboardingIncomplete = false

  if (user) {
    userEmail = user.email ?? ''

    // has_seen_first_run_deck is not in database.types.ts yet — rawDb cast required.
    const rawDb = supabase as any
    const { data: profile } = await rawDb
      .from('profiles')
      .select('academy_id, display_name, has_seen_first_run_deck')
      .eq('id', user.id)
      .single()

    hasSeenFirstRunDeck = (profile?.has_seen_first_run_deck ?? true) as boolean

    if (profile?.display_name) {
      userDisplayName = profile.display_name
    }

    if (profile?.academy_id) {
      academyId = profile.academy_id

      const { data: academy } = await rawDb
        .from('academies')
        .select('name, settings')
        .eq('id', profile.academy_id)
        .single()

      if (academy?.name) {
        academyName = academy.name
      }

      const onboardingSettings = (academy?.settings as Record<string, unknown>) ?? {}
      onboardingIncomplete = [
        'academy_identity_completed',
        'director_interview_completed',
        'curriculum_setup_completed',
        'level_gates_completed',
        'programs_groups_completed',
        'coaches_permissions_completed',
        'players_placement_completed',
      ].some(k => onboardingSettings[k] !== true)

      // Real pending count — all proposed_actions pending review for this academy
      const { count } = await rawDb
        .from('proposed_actions')
        .select('id', { count: 'exact', head: true })
        .eq('academy_id', profile.academy_id)
        .eq('status', 'pending_review')

      pendingCount = count ?? 0
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <SidebarNav
        academyName={academyName}
        pendingCount={pendingCount}
        userEmail={userEmail}
        userDisplayName={userDisplayName}
        onboardingIncomplete={onboardingIncomplete}
      />
      <main className="flex-1 ml-60 min-h-screen">
        <PreviewBanner />
        <FirstRunDeckGate hasSeenDeck={hasSeenFirstRunDeck} role="director">
          {children}
        </FirstRunDeckGate>
      </main>
      {academyId && (
        <DonnaAssistantButton
          academyId={academyId}
          directorName={userDisplayName || undefined}
        />
      )}
    </div>
  )
}
