// Player Level Up — Sprint 1068 stub. Full content in Sprint 1075.
import { Card, CardContent } from '@/components/ui'
import { ArrowRight } from 'lucide-react'

export default function PlayerLevelUpPage() {
  return (
    <div className="space-y-4">
      <div className="pt-2">
        <p className="page-eyebrow">Level Up</p>
        <h1 className="page-title">Your Next Unlock</h1>
        <p className="page-subtitle">Here&apos;s what you&apos;re building toward — no pressure, just progress.</p>
      </div>
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-text-primary text-sm font-medium">Level-up view coming soon</p>
          <p className="text-text-muted text-xs leading-relaxed max-w-xs">
            Your current level, next level, and the gate requirements you&apos;re building toward.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
