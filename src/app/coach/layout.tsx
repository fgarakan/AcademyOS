import { BottomTabBar } from '@/components/nav/BottomTabBar'
import { Home, Users, Mic, Calendar } from 'lucide-react'

const COACH_TABS = [
  { label: 'Home', href: '/coach', icon: Home, exact: true },
  { label: 'Players', href: '/coach/players', icon: Users },
  { label: 'Sessions', href: '/coach/sessions', icon: Calendar },
  { label: 'Voice', href: '/coach/voice', icon: Mic },
]

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20">
      <main className="p-4 max-w-2xl mx-auto">{children}</main>
      <BottomTabBar items={COACH_TABS} />
    </div>
  )
}
