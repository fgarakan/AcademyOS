import { BottomTabBar } from '@/components/nav/BottomTabBar'
import { PreviewBanner } from '@/components/platform/PreviewBanner'
import { getSupabaseServer } from '@/lib/supabase/server'
import { FirstRunDeckGate } from '@/components/onboarding/FirstRunDeckGate'

const PARENT_TABS = [
  { label: 'Home', href: '/parent', iconKey: 'home', exact: true },
  { label: 'Progress', href: '/parent/progress', iconKey: 'progress' },
  { label: 'Wins', href: '/parent/wins', iconKey: 'wins' },
  { label: 'Updates', href: '/parent/updates', iconKey: 'updates' },
]

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
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
      <main className="p-4 max-w-lg mx-auto">
        <PreviewBanner />
        <FirstRunDeckGate hasSeenDeck={hasSeenFirstRunDeck} role="parent">
          {children}
        </FirstRunDeckGate>
      </main>
      <BottomTabBar items={PARENT_TABS} />
    </div>
  )
}
