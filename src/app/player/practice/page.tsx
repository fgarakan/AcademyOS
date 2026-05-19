// Player Practice — Sprint 1068 stub. Full content in Sprint 1076.
import { Card, CardContent } from '@/components/ui'
import { Dumbbell } from 'lucide-react'

export default function PlayerPracticePage() {
  return (
    <div className="space-y-4">
      <div className="pt-2">
        <p className="page-eyebrow">Practice</p>
        <h1 className="page-title">At-Home Practice</h1>
        <p className="page-subtitle">Short, focused practice. Quality over quantity.</p>
      </div>
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-text-primary text-sm font-medium">Practice sessions coming soon</p>
          <p className="text-text-muted text-xs leading-relaxed max-w-xs">
            Your at-home practice session, linked to your current mission. Short and focused.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
