// Player Mission Map — Sprint 1068 stub. Full content in Sprint 1070.
import { Card, CardContent } from '@/components/ui'
import { Map } from 'lucide-react'

export default function PlayerMissionsPage() {
  return (
    <div className="space-y-4">
      <div className="pt-2">
        <p className="page-eyebrow">Missions</p>
        <h1 className="page-title">My Missions</h1>
        <p className="page-subtitle">Your development journey, one mission at a time.</p>
      </div>
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center">
            <Map className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-text-primary text-sm font-medium">Missions coming soon</p>
          <p className="text-text-muted text-xs leading-relaxed max-w-xs">
            Your mission map will show your active, next, and completed development missions.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
