'use client'
import { BottomTabBar } from '@/components/nav/BottomTabBar'
import { Home, TrendingUp, Trophy, MessageCircle } from 'lucide-react'

const PLAYER_TABS = [
  { label: 'Home', href: '/player', icon: Home, exact: true },
  { label: 'Progress', href: '/player/progress', icon: TrendingUp },
  { label: 'Wins', href: '/player/wins', icon: Trophy },
  { label: 'Messages', href: '/player/messages', icon: MessageCircle },
]

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20">
      <main className="p-4 max-w-lg mx-auto">{children}</main>
      <BottomTabBar items={PLAYER_TABS} />
    </div>
  )
}
