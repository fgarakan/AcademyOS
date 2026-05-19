// Player Celebration — Sprint 1068 stub. Not yet triggered by any flow.
import { Card, CardContent } from '@/components/ui'
import { Star } from 'lucide-react'
import Link from 'next/link'

export default function PlayerCelebrationPage() {
  return (
    <div className="space-y-4">
      <div className="pt-2">
        <p className="page-eyebrow">Achievement</p>
        <h1 className="page-title">Mission Complete</h1>
        <p className="page-subtitle">You did the work. Here&apos;s what you unlocked.</p>
      </div>
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center">
            <Star className="w-5 h-5 text-lime" />
          </div>
          <p className="text-text-primary text-sm font-medium">Celebration view coming soon</p>
          <p className="text-text-muted text-xs leading-relaxed max-w-xs">
            When your director confirms a mission complete, your badge and next mission will appear here.
          </p>
        </CardContent>
      </Card>
      <Link href="/player" className="text-xs text-text-muted hover:text-text-secondary block text-center">
        ← Back to Home
      </Link>
    </div>
  )
}
