import { TrendingUp, Lock } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'

interface Props {
  doingWell: string[]
  workingOn: string[]
  currentFocus: string | null
  nextStep: string | null
  isPreviewOnly?: boolean
}

export function ParentSafeProgressPreview({
  doingWell,
  workingOn,
  currentFocus,
  nextStep,
  isPreviewOnly = true,
}: Props) {
  const hasContent = doingWell.length > 0 || workingOn.length > 0 || currentFocus || nextStep

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-lime" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-text-primary text-sm">Child&apos;s Progress</p>
              {isPreviewOnly && (
                <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-border text-text-muted bg-surface-raised">
                  <Lock className="w-2.5 h-2.5" /> Preview only
                </span>
              )}
            </div>
            <p className="text-text-muted text-xs">How your child is advancing</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasContent ? (
          <div className="py-8 text-center space-y-2">
            <TrendingUp className="w-8 h-8 text-text-muted mx-auto" />
            <p className="text-text-secondary text-sm">Progress summaries will appear here after coach/director review.</p>
            <p className="text-text-muted text-xs">Your coaching team adds development notes regularly.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {isPreviewOnly && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border">
                <Lock className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Parent-safe preview — content is reviewed before it is shared with families.
                </p>
              </div>
            )}

            {doingWell.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Doing Well</p>
                <ul className="space-y-1.5">
                  {doingWell.slice(0, 2).map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text-secondary">
                      <span className="text-lime shrink-0 mt-0.5">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {workingOn.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Working On</p>
                <ul className="space-y-1.5">
                  {workingOn.slice(0, 2).map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text-secondary">
                      <span className="text-status-blue shrink-0 mt-0.5">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {currentFocus && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Current Focus</p>
                <p className="text-sm text-text-secondary leading-relaxed">{currentFocus}</p>
              </div>
            )}

            {nextStep && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Next Step</p>
                <p className="text-sm text-text-secondary leading-relaxed">{nextStep}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
