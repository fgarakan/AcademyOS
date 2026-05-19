// Player Skill Path — Sprint 1068 stub. Full content in Sprint 1072.
import { Card, CardContent } from '@/components/ui'
import { Zap } from 'lucide-react'

export default function PlayerSkillPathPage() {
  return (
    <div className="space-y-4">
      <div className="pt-2">
        <p className="page-eyebrow">Skill Path</p>
        <h1 className="page-title">Technical Development</h1>
        <p className="page-subtitle">Your technical skills — not grades, just your current journey.</p>
      </div>
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-lime" />
          </div>
          <p className="text-text-primary text-sm font-medium">Skill path coming soon</p>
          <p className="text-text-muted text-xs leading-relaxed max-w-xs">
            Your technical skill areas — Forehand, Backhand, Serve, Volley, Movement, Preparation.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
