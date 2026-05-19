// Player Fitness Path — Sprint 1068 stub. Full content in Sprint 1074.
import { Card, CardContent } from '@/components/ui'
import { Activity } from 'lucide-react'

export default function PlayerFitnessPathPage() {
  return (
    <div className="space-y-4">
      <div className="pt-2">
        <p className="page-eyebrow">Fitness Path</p>
        <h1 className="page-title">Body Development</h1>
        <p className="page-subtitle">Building the athletic foundation for your tennis game.</p>
      </div>
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-status-blue/10 border border-status-blue/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-status-blue" />
          </div>
          <p className="text-text-primary text-sm font-medium">Fitness path coming soon</p>
          <p className="text-text-muted text-xs leading-relaxed max-w-xs">
            Your fitness areas — Mobility, Coordination, Speed, Agility, Strength, Recovery, Tennis Transfer.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
