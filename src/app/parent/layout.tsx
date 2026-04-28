import { BottomTabBar } from '@/components/nav/BottomTabBar'
import { Home, TrendingUp, Trophy, Bell } from 'lucide-react'

const PARENT_TABS = [
  { label: 'Home', href: '/parent', icon: Home, exact: true },
  { label: 'Progress', href: '/parent/progress', icon: TrendingUp },
  { label: 'Wins', href: '/parent/wins', icon: Trophy },
  { label: 'Updates', href: '/parent/updates', icon: Bell },
]

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20">
      <main className="p-4 max-w-lg mx-auto">{children}</main>
      <BottomTabBar items={PARENT_TABS} />
    </div>
  )
}
