import { BottomTabBar } from '@/components/nav/BottomTabBar'
import { PreviewBanner } from '@/components/platform/PreviewBanner'

const COACH_TABS = [
  { label: 'Home', href: '/coach', iconKey: 'home', exact: true },
  { label: 'Players', href: '/coach/players', iconKey: 'players' },
  { label: 'Sessions', href: '/coach/sessions', iconKey: 'sessions' },
  { label: 'Voice', href: '/coach/voice', iconKey: 'voice' },
]

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20">
      <main className="p-4 max-w-2xl mx-auto">
        <PreviewBanner />
        {children}
      </main>
      <BottomTabBar items={COACH_TABS} />
    </div>
  )
}
