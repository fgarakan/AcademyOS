'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { updateDirectorInterviewAction } from './updateDirectorInterviewAction'

interface Props {
  initialPhilosophy: string
  initialPlayerFocus: string
  initialDevelopmentPriorities: string
  initialCompetitionApproach: string
  initialParentCommunicationStyle: string
  initialCoachOperatingStyle: string
  initialNinetyDaySuccess: string
}

export function DirectorInterviewForm({
  initialPhilosophy,
  initialPlayerFocus,
  initialDevelopmentPriorities,
  initialCompetitionApproach,
  initialParentCommunicationStyle,
  initialCoachOperatingStyle,
  initialNinetyDaySuccess,
}: Props) {
  const [philosophy, setPhilosophy] = useState(initialPhilosophy)
  const [playerFocus, setPlayerFocus] = useState(initialPlayerFocus)
  const [developmentPriorities, setDevelopmentPriorities] = useState(initialDevelopmentPriorities)
  const [competitionApproach, setCompetitionApproach] = useState(initialCompetitionApproach)
  const [parentCommunicationStyle, setParentCommunicationStyle] = useState(initialParentCommunicationStyle)
  const [coachOperatingStyle, setCoachOperatingStyle] = useState(initialCoachOperatingStyle)
  const [ninetyDaySuccess, setNinetyDaySuccess] = useState(initialNinetyDaySuccess)

  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    setSaved(false)
    setError(null)
    startTransition(async () => {
      const result = await updateDirectorInterviewAction(
        philosophy,
        playerFocus,
        developmentPriorities,
        competitionApproach,
        parentCommunicationStyle,
        coachOperatingStyle,
        ninetyDaySuccess,
      )
      if (result.ok) setSaved(true)
      else setError(result.error)
    })
  }

  const textareaClass =
    'w-full text-sm bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors resize-none'
  const labelClass = 'label-xs'

  const QUESTIONS = [
    {
      key: 'philosophy',
      label: 'Coaching Philosophy',
      prompt: "How would you describe your academy's coaching philosophy?",
      value: philosophy,
      onChange: (v: string) => { setPhilosophy(v); setSaved(false) },
      placeholder: 'e.g. We believe in long-term athlete development over early specialization…',
    },
    {
      key: 'player_focus',
      label: 'Primary Player Focus',
      prompt: 'What ages and levels does your academy primarily serve?',
      value: playerFocus,
      onChange: (v: string) => { setPlayerFocus(v); setSaved(false) },
      placeholder: 'e.g. Ages 8–18, beginner through competitive juniors…',
    },
    {
      key: 'development_priorities',
      label: 'Development Priorities',
      prompt: 'What are the most important development priorities for your players?',
      value: developmentPriorities,
      onChange: (v: string) => { setDevelopmentPriorities(v); setSaved(false) },
      placeholder: 'e.g. Footwork, tactical decision-making, and mental resilience…',
    },
    {
      key: 'competition_approach',
      label: 'Competition Approach',
      prompt: 'How does your academy approach competition and tournaments?',
      value: competitionApproach,
      onChange: (v: string) => { setCompetitionApproach(v); setSaved(false) },
      placeholder: 'e.g. Competition is a tool for learning, not the primary goal at early stages…',
    },
    {
      key: 'parent_communication_style',
      label: 'Parent Communication Style',
      prompt: 'How do you want parents to feel when they receive updates from your academy?',
      value: parentCommunicationStyle,
      onChange: (v: string) => { setParentCommunicationStyle(v); setSaved(false) },
      placeholder: "e.g. Informed and confident in their child's progress, without jargon…",
    },
    {
      key: 'coach_operating_style',
      label: 'Coach Operating Style',
      prompt: 'How do you want coaches to use Academy OS day to day?',
      value: coachOperatingStyle,
      onChange: (v: string) => { setCoachOperatingStyle(v); setSaved(false) },
      placeholder: 'e.g. Quick session prep, clear lesson plans, simple wrap-ups after each session…',
    },
    {
      key: 'ninety_day_success',
      label: 'Success in 90 Days',
      prompt: 'What would make Academy OS feel successful for your academy in the first 90 days?',
      value: ninetyDaySuccess,
      onChange: (v: string) => { setNinetyDaySuccess(v); setSaved(false) },
      placeholder: "e.g. Every coach is using it, parents understand their child's development…",
    },
  ]

  return (
    <div className="space-y-8">

      {QUESTIONS.map((q, idx) => (
        <div key={q.key} className="space-y-1.5">
          <p className="text-[10px] font-mono text-text-muted">
            {idx + 1} / {QUESTIONS.length}
          </p>
          <label className={labelClass}>{q.label}</label>
          <p className="text-xs text-text-secondary leading-relaxed">{q.prompt}</p>
          <textarea
            value={q.value}
            onChange={e => q.onChange(e.target.value)}
            rows={3}
            maxLength={600}
            placeholder={q.placeholder}
            className={textareaClass}
          />
          <p className="text-[10px] text-text-muted text-right">
            {q.value.length} / 600
          </p>
        </div>
      ))}

      {/* ── Save ── */}
      <div className="pt-2 border-t border-border space-y-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-lime text-base font-semibold text-sm hover:bg-lime/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isPending ? 'Saving…' : 'Save Director Interview'}
        </button>

        {saved && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/25">
            <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
            <p className="text-sm text-status-green font-medium">Director interview saved.</p>
          </div>
        )}
        {error && (
          <p className="text-sm text-status-red px-1">{error}</p>
        )}
      </div>

    </div>
  )
}
