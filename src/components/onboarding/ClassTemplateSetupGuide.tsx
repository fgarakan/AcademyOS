import { CheckCircle2, Circle } from 'lucide-react'

const STEPS = [
  {
    num: 1,
    title: 'Confirm curriculum level',
    body: 'Choose the level this class is designed for. This tells the OS which curriculum goals, gates, and teaching content to use.',
  },
  {
    num: 2,
    title: 'Generate lesson plan draft',
    body: 'The OS builds a suggested lesson plan from curriculum content. It is only a draft until you apply it.',
  },
  {
    num: 3,
    title: 'Apply to template',
    body: 'Applying writes the lesson plan to this reusable class template so future sessions can carry it.',
  },
  {
    num: 4,
    title: 'Create session for coaches',
    body: 'Once a session is created from this template, coaches can see what to coach, why it matters, and what to watch for.',
  },
]

const DEFINITIONS = [
  {
    term: 'Curriculum content',
    def: 'What the academy wants taught — goals, drills, and coach cues linked to a development level.',
  },
  {
    term: 'Lesson plan draft',
    def: 'A suggested plan built from curriculum content, not yet saved to the template.',
  },
  {
    term: 'Applied lesson plan',
    def: 'The lesson plan this template now carries into every session created from it.',
  },
  {
    term: 'Session',
    def: 'A dated class coaches run on court, generated from this template.',
  },
]

interface Props {
  hasCurriculumLevel: boolean
  hasCurriculumContent: boolean
  hasSessionsFromTemplate?: boolean
  className?: string
}

export function ClassTemplateSetupGuide({
  hasCurriculumLevel,
  hasCurriculumContent,
  hasSessionsFromTemplate,
  className,
}: Props) {
  // Step 2 and 3 both resolve from hasCurriculumContent:
  // generating + applying are both prerequisites for content existing in the DB.
  const step1Done = hasCurriculumLevel
  const step23Done = hasCurriculumContent
  const step4Done = hasSessionsFromTemplate === true

  const stepStates = [step1Done, step23Done, step23Done, step4Done]
  const currentStepIdx = stepStates.findIndex(s => !s)

  let statusMsg: string
  if (!step1Done) {
    statusMsg = 'Start here: assign a curriculum level above.'
  } else if (!step23Done) {
    statusMsg = 'Curriculum level set. Next: generate a lesson plan draft below.'
  } else if (!step4Done) {
    statusMsg = hasSessionsFromTemplate === undefined
      ? 'Lesson plan applied. Create a session from this template so coaches can run it.'
      : 'Lesson plan applied. Next: create a session from this template.'
  } else {
    statusMsg = 'This template is active in the coach workflow.'
  }

  return (
    <div className={`space-y-3 ${className ?? ''}`}>

      {/* Status summary pill */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface-raised border border-border">
        <div className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />
        <p className="text-[11px] text-text-secondary leading-relaxed">{statusMsg}</p>
      </div>

      {/* Step list */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border/60">
        {STEPS.map(({ num, title, body }, idx) => {
          const done = stepStates[idx]
          const current = currentStepIdx !== -1 && idx === currentStepIdx
          return (
            <div key={num} className={`flex items-start gap-3 px-4 py-3 ${done ? 'opacity-55' : ''}`}>
              <div className="shrink-0 mt-0.5">
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-status-green" />
                  : <Circle className={`w-4 h-4 ${current ? 'text-lime' : 'text-border'}`} />}
              </div>
              <div className="min-w-0">
                <p className={`text-[11px] font-semibold leading-tight ${
                  done ? 'line-through text-text-muted' :
                  current ? 'text-lime' :
                  'text-text-primary'
                }`}>
                  <span className="font-mono text-[10px] mr-1 opacity-50">{num}.</span>
                  {title}
                </p>
                {!done && (
                  <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">{body}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Plain-language term definitions */}
      <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Key terms</p>
        <div className="space-y-1.5">
          {DEFINITIONS.map(({ term, def }) => (
            <p key={term} className="text-[10px] text-text-muted leading-relaxed">
              <span className="text-text-secondary font-medium">{term}</span> — {def}
            </p>
          ))}
        </div>
      </div>

    </div>
  )
}
