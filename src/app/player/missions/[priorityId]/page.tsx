// Player Mission Detail — Sprint 1068 stub. Full content in Sprint 1071.
import { Card, CardContent } from '@/components/ui'
import { Target } from 'lucide-react'
import Link from 'next/link'

export default function PlayerMissionDetailPage() {
  return (
    <div className="space-y-4">
      <Link href="/player/missions" className="text-xs text-text-muted hover:text-text-secondary flex items-center gap-1 pt-2">
        ← Back to Missions
      </Link>
      <div>
        <p className="page-eyebrow">Mission Detail</p>
        <h1 className="page-title">Current Mission</h1>
        <p className="page-subtitle">Your goal, what to do, and how to know you improved.</p>
      </div>
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center">
            <Target className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-text-primary text-sm font-medium">Mission detail coming soon</p>
          <p className="text-text-muted text-xs leading-relaxed max-w-xs">
            Full mission detail — goal, why it matters, what to do, and evidence needed.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
