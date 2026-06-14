// Sprint 2381–2410 — DONNA Daily Brief + Academy Pulse V1
// Compact pulse status bar rendered in DonnaCommandBrief hero card.

import type { AcademyPulse } from '@/lib/donna/pulse/academyPulseEngine'
import { PULSE_LABELS, PULSE_DOT_CLASS, PULSE_TEXT_CLASS } from '@/lib/donna/pulse/academyPulseEngine'

interface Props {
  pulse: AcademyPulse
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high:   'High confidence',
  medium: 'Medium confidence',
  low:    'Low confidence',
}

export function AcademyPulseBar({ pulse }: Props) {
  const dotCls  = PULSE_DOT_CLASS[pulse.pulseStatus]
  const textCls = PULSE_TEXT_CLASS[pulse.pulseStatus]
  const label   = PULSE_LABELS[pulse.pulseStatus]

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotCls}`} />
      <span className={`text-sm font-semibold ${textCls}`}>
        Academy — {label}
      </span>
      <span className="text-border hidden sm:block">·</span>
      <span className="label-xs text-text-muted hidden sm:block">
        {CONFIDENCE_LABEL[pulse.confidence]}
      </span>
    </div>
  )
}
