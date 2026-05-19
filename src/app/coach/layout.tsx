import { BottomTabBar } from '@/components/nav/BottomTabBar'
import { PreviewBanner } from '@/components/platform/PreviewBanner'
import { getSupabaseServer } from '@/lib/supabase/server'
import { FirstRunDeckGate } from '@/components/onboarding/FirstRunDeckGate'
import { DonnaAssistantButton } from '@/components/assistant/DonnaAssistantButton'

const COACH_TABS = [
  { label: 'Home', href: '/coach', iconKey: 'home', exact: true },
  { label: 'Players', href: '/coach/players', iconKey: 'players' },
  { label: 'Sessions', href: '/coach/sessions', iconKey: 'sessions' },
  { label: 'DONNA', href: '/coach/donna', iconKey: 'donna' },
]

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let hasSeenFirstRunDeck = true
  let coachDisplayName: string | undefined
  let coachAcademyId: string | undefined

  if (user) {
    const rawDb = supabase as any
    const { data: profile } = await rawDb
      .from('profiles')
      .select('has_seen_first_run_deck, display_name, academy_id')
      .eq('id', user.id)
      .single()
    hasSeenFirstRunDeck = (profile?.has_seen_first_run_deck ?? true) as boolean
    coachDisplayName = (profile?.display_name as string | null) ?? undefined
    coachAcademyId = (profile?.academy_id as string | null) ?? undefined
  }

  return (
    <div className="min-h-screen pb-24">
      <main className="p-4 max-w-2xl mx-auto">
        <PreviewBanner />
        <FirstRunDeckGate hasSeenDeck={hasSeenFirstRunDeck} role="coach">
          {children}
        </FirstRunDeckGate>
      </main>
      <BottomTabBar items={COACH_TABS} />
      {coachAcademyId && (
        <DonnaAssistantButton
          academyId={coachAcademyId}
          directorName={coachDisplayName}
          role="coach"
        />
      )}
    </div>
  )
}
