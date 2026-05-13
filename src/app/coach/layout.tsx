import { BottomTabBar } from '@/components/nav/BottomTabBar'
import { PreviewBanner } from '@/components/platform/PreviewBanner'
import { getSupabaseServer } from '@/lib/supabase/server'
import { FirstRunDeckGate } from '@/components/onboarding/FirstRunDeckGate'

const COACH_TABS = [
  { label: 'Home', href: '/coach', iconKey: 'home', exact: true },
  { label: 'Players', href: '/coach/players', iconKey: 'players' },
  { label: 'Sessions', href: '/coach/sessions', iconKey: 'sessions' },
]

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let hasSeenFirstRunDeck = true
  if (user) {
    const rawDb = supabase as any
    const { data: profile } = await rawDb
      .from('profiles')
      .select('has_seen_first_run_deck')
      .eq('id', user.id)
      .single()
    hasSeenFirstRunDeck = (profile?.has_seen_first_run_deck ?? true) as boolean
  }

  return (
    <div className="min-h-screen pb-20">
      <main className="p-4 max-w-2xl mx-auto">
        <PreviewBanner />
        <FirstRunDeckGate hasSeenDeck={hasSeenFirstRunDeck} role="coach">
          {children}
        </FirstRunDeckGate>
      </main>
      <BottomTabBar items={COACH_TABS} />
    </div>
  )
}
