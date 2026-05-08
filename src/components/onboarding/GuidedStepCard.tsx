import { CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  stepNumber: number
  totalSteps?: number
  title: string
  description: string
  status: 'complete' | 'current' | 'upcoming'
  children?: ReactNode
  className?: string
}

export function GuidedStepCard({
  stepNumber,
  totalSteps,
  title,
  description,
  status,
  children,
  className,
}: Props) {
  return (
    <div className={`flex items-start gap-3 ${className ?? ''}`}>
      <div className="shrink-0 mt-0.5">
        {status === 'complete' ? (
          <CheckCircle2 className="w-4 h-4 text-status-green" />
        ) : (
          <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-mono ${
            status === 'current'
              ? 'border-lime text-lime bg-lime/10'
              : 'border-border text-text-muted'
          }`}>
            {stepNumber}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[11px] font-semibold leading-tight ${
          status === 'complete'
            ? 'line-through text-text-muted'
            : status === 'current'
            ? 'text-lime'
            : 'text-text-muted'
        }`}>
          {totalSteps && (
            <span className="font-mono text-[10px] opacity-50 mr-1">{stepNumber}/{totalSteps} —</span>
          )}
          {title}
        </p>
        {status !== 'complete' && (
          <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">{description}</p>
        )}
        {children && status === 'current' && (
          <div className="mt-2">{children}</div>
        )}
      </div>
    </div>
  )
}
