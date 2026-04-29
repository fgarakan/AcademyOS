import { BottomTabBar } from '@/components/nav/BottomTabBar'
import { PreviewBanner } from '@/components/platform/PreviewBanner'

const PARENT_TABS = [
  { label: 'Home', href: '/parent', iconKey: 'home', exact: true },
  { label: 'Progress', href: '/parent/progress', iconKey: 'progress' },
  { label: 'Wins', href: '/parent/wins', iconKey: 'wins' },
  { label: 'Updates', href: '/parent/updates', iconKey: 'updates' },
]

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20">
      <main className="p-4 max-w-lg mx-auto">
        <PreviewBanner />
        {children}
      </main>
      <BottomTabBar items={PARENT_TABS} />
    </div>
  )
}
