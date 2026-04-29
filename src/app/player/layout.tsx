import { BottomTabBar } from '@/components/nav/BottomTabBar'
import { PreviewBanner } from '@/components/platform/PreviewBanner'

const PLAYER_TABS = [
  { label: 'Home', href: '/player', iconKey: 'home', exact: true },
  { label: 'Progress', href: '/player/progress', iconKey: 'progress' },
  { label: 'Wins', href: '/player/wins', iconKey: 'wins' },
  { label: 'Messages', href: '/player/messages', iconKey: 'messages' },
]

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20">
      <main className="p-4 max-w-lg mx-auto">
        <PreviewBanner />
        {children}
      </main>
      <BottomTabBar items={PLAYER_TABS} />
    </div>
  )
}
