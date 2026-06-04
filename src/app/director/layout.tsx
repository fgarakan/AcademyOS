import { Suspense } from 'react'
import { SidebarNav } from '@/components/nav/SidebarNav'
import { DirectorMobileNav } from '@/components/nav/DirectorMobileNav'
import { getSupabaseServer } from '@/lib/supabase/server'
import { PreviewBanner } from '@/components/platform/PreviewBanner'
import { DonnaAssistantButton } from '@/components/assistant/DonnaAssistantButton'
import { DonnaWakeWordLayer } from '@/components/donna/DonnaWakeWordLayer'
import { DonnaProactiveBriefCard } from '@/components/donna/DonnaProactiveBriefCard'
import { FirstRunDeckGate } from '@/components/onboarding/FirstRunDeckGate'
import { DemoModeBanner } from '@/components/demo/DemoModeBanner'
import { DonnaSessionContextProvider } from '@/components/donna/DonnaSessionContextProvider'
import { DonnaHighlightBanner } from '@/components/donna/DonnaHighlightBanner'
import { DonnaCOOStatusWrapper } from '@/components/donna/DonnaCOOStatusWrapper'
import { DonnaDailyCOOBriefSurface } from '@/components/donna/DonnaDailyCOOBriefSurface'

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
    <DonnaSessionContextProvider>
      <div className="flex min-h-screen" style={{ background: 'var(--bg-app)' }}>
        <SidebarNav
          academyName={academyName}
          pendingCount={pendingCount}
          userEmail={userEmail}
          userDisplayName={userDisplayName}
          onboardingIncomplete={onboardingIncomplete}
        />
        <main className="flex-1 lg:ml-60 min-h-screen pb-16 lg:pb-0">
          <PreviewBanner />
          <Suspense>
            <DemoModeBanner />
          </Suspense>
          {/* Sprint 1681 — DONNA COO Status Bar (site-wide, dismissible) */}
          {academyId && (
            <DonnaCOOStatusWrapper
              pendingCount={pendingCount}
              directorName={userDisplayName || null}
            />
          )}
          {/* Sprint 1681 — DONNA Daily COO Brief Surface (once per day, dismissible) */}
          {academyId && (
            <DonnaDailyCOOBriefSurface
              directorName={userDisplayName || null}
            />
          )}
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
        {/* Sprint 1791 — Hey Donna wake word layer (desktop only, opt-in) */}
        {academyId && <DonnaWakeWordLayer />}
        {/* Sprint 1801 — DONNA proactive pilot guide (desktop only, once per route/session) */}
        {academyId && <DonnaProactiveBriefCard pendingCount={pendingCount} />}
        <DirectorMobileNav pendingCount={pendingCount} />
        {/* Sprint 817 — DONNA guided highlight banner, mounted at layout level */}
        <DonnaHighlightBanner />
      </div>
    </DonnaSessionContextProvider>
  )
}
