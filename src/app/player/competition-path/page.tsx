// Player Competition Path — Sprint 1068 stub. Full content in Sprint 1073.
import { Card, CardContent } from '@/components/ui'
import { Trophy } from 'lucide-react'

export default function PlayerCompetitionPathPage() {
  return (
    <div className="space-y-4">
      <div className="pt-2">
        <p className="page-eyebrow">Competition Path</p>
        <h1 className="page-title">Match Skills</h1>
        <p className="page-subtitle">How you think and compete — not just how you hit.</p>
      </div>
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-status-orange/10 border border-status-orange/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-status-orange" />
          </div>
          <p className="text-text-primary text-sm font-medium">Competition path coming soon</p>
          <p className="text-text-muted text-xs leading-relaxed max-w-xs">
            Your match skills — Rally Decisions, Target Choice, Scoring Awareness, Pressure Response.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
