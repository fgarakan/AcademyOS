import { Zap, Star, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'

interface Props {
  strength: string | null
  mission: string | null
  nextWin: string | null
  currentLevel: string | null
}

export function PlayerMissionPreview({ strength, mission, nextWin, currentLevel }: Props) {
  const hasContent = strength || mission || nextWin

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-lime" />
          </div>
          <div>
            <p className="font-semibold text-text-primary text-sm">Today&apos;s Mission</p>
            <p className="text-text-muted text-xs">What your coach has set for you</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasContent ? (
          <div className="py-8 text-center space-y-2">
            <Zap className="w-8 h-8 text-text-muted mx-auto" />
            <p className="text-text-secondary text-sm">Your next mission will appear after your coach reviews your progress.</p>
            <p className="text-text-muted text-xs">Keep showing up — your coach is watching your progress.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {strength && (
              <div className="flex items-start gap-3 px-3 py-3 rounded-xl bg-status-green/5 border border-status-green/20">
                <Star className="w-4 h-4 text-status-green shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-status-green mb-0.5">Your Strength</p>
                  <p className="text-sm text-text-primary leading-relaxed">{strength}</p>
                </div>
              </div>
            )}

            {mission && (
              <div className="flex items-start gap-3 px-3 py-3 rounded-xl bg-lime/5 border border-lime/20">
                <Zap className="w-4 h-4 text-lime shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-lime mb-0.5">Your Mission</p>
                  <p className="text-sm text-text-primary leading-relaxed">{mission}</p>
                </div>
              </div>
            )}

            {nextWin && (
              <div className="flex items-start gap-3 px-3 py-3 rounded-xl bg-surface-raised border border-border">
                <ArrowRight className="w-4 h-4 text-status-orange shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-status-orange mb-0.5">Next Win</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{nextWin}</p>
                </div>
              </div>
            )}

            {currentLevel && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-raised border border-border">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Current Level</p>
                <span className="text-xs font-semibold text-text-primary">{currentLevel}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
