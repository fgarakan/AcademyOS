'use client'

// Sprint 223 — Parent Guidance Preview
// Director-side preview only. No emails. No parent portal exposure. No writes.
// Uses curriculum level + coach language only. No raw coach notes.

import { Mail, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { sanitizeParentFacingText } from '@/lib/communications/parentSafeResponseRules'

interface Props {
  playerFirstName: string | null
  currentLevelName: string | null
  nextLevelName: string | null
  currentFocus: string | null
  parentSupportTip: string | null
}

export function ParentGuidancePreviewPanel({
  playerFirstName,
  currentLevelName,
  nextLevelName,
  currentFocus,
  parentSupportTip,
}: Props) {
  const name = playerFirstName ?? 'Your child'
  const safeLevel = currentLevelName ? sanitizeParentFacingText(currentLevelName) : null
  const safeFocus = currentFocus ? sanitizeParentFacingText(currentFocus) : null
  const safeTip = parentSupportTip ? sanitizeParentFacingText(parentSupportTip) : null

  const whatWorkingOn = safeLevel
    ? `${name} is currently working in the ${safeLevel} stage of the academy curriculum.${safeFocus ? ` Right now the focus is: ${safeFocus}.` : ''}`
    : `${name} is developing their tennis skills at the academy.`

  const howToSupport = safeTip
    ?? `The best way to support ${name} is to show interest in what they are working on and let them explain it to you.`

  const whatToSay = [
    `"How did your session go today?" — let them lead the answer.`,
    `"What did you work on?" — focus on the skill, not the result.`,
    `"I noticed you kept trying — that is great." — celebrate effort.`,
  ]

  const whatNotToFocus = [
    'Wins and losses at this stage — development is the goal.',
    'Comparisons to other players or groups.',
    'Rushing to the next level — each stage builds essential foundations.',
  ]

  const pressureNote =
    `Academy progress happens at different paces for different players. ${name}'s coaches are tracking development carefully. Your encouragement and patience are the most powerful support you can give.`

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-text-muted" />
            <p className="label-xs">Parent Guidance Preview</p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-status-blue/30 bg-status-blue/5 text-[9px] font-semibold text-status-blue shrink-0">
            <Shield className="w-2.5 h-2.5" />
            Director preview — not sent
          </span>
        </div>
        <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
          No parent communication is sent from this preview. Uses curriculum level and coach language only.
        </p>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">

        <Section
          label="What your child is working on"
          body={whatWorkingOn}
        />

        {nextLevelName && (
          <Section
            label="Next target"
            body={`${name}'s next curriculum target is ${nextLevelName}. Progress happens through consistent practice — there is no shortcut and no rush.`}
          />
        )}

        <Section
          label="How to support this week"
          body={howToSupport}
        />

        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">What to say after practice</p>
          <ul className="space-y-1.5">
            {whatToSay.map((line, i) => (
              <li key={i} className="flex gap-2 text-[11px] text-text-secondary leading-snug">
                <span className="text-lime shrink-0">·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">What not to over-focus on</p>
          <ul className="space-y-1.5">
            {whatNotToFocus.map((line, i) => (
              <li key={i} className="flex gap-2 text-[11px] text-text-secondary leading-snug">
                <span className="text-status-orange shrink-0">·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3 rounded-xl border border-border bg-surface-raised">
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Pressure-reducing note</p>
          <p className="text-xs text-text-secondary leading-relaxed">{pressureNote}</p>
        </div>

        <p className="text-[9px] text-text-muted leading-relaxed border-t border-border pt-3">
          This preview uses curriculum level and coach language only. No coach observations, assessment scores, or internal notes are included. Nothing is sent to the parent from this screen.
        </p>

      </CardContent>
    </Card>
  )
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">{label}</p>
      <p className="text-xs text-text-secondary leading-relaxed">{body}</p>
    </div>
  )
}
