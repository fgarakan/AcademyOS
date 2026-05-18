import { ShieldCheck, ArrowRight } from 'lucide-react'
import { SAFETY_NOTES } from '@/lib/curriculum/approvalCopy'

interface Props {
  context: 'curriculum_builder' | 'review_queue' | 'level_edit'
  showNextStep?: boolean
}

const COPY: Record<Props['context'], { body: string; nextStep?: string }> = {
  curriculum_builder: {
    body:
      'DONNA drafts — directors approve. No curriculum change takes effect until you review and approve it in the Review Queue. DONNA cannot move players, change enrolments, or override coach decisions.',
    nextStep:
      'Go to the Review Queue to approve or reject pending curriculum drafts.',
  },
  review_queue: {
    body:
      'Every item here was proposed by DONNA and is waiting for your explicit approval. Approving queues the change for application. Rejecting discards it permanently. ' + SAFETY_NOTES.donnaCannotApprove,
    nextStep:
      'Approve to queue application. Reject to discard. Either action is permanent.',
  },
  level_edit: {
    body:
      'Edits to this level are drafted only. ' + SAFETY_NOTES.draftOnly + ' ' + SAFETY_NOTES.noPlayerImpact,
    nextStep:
      'Find this draft in the Review Queue when you are ready to approve it.',
  },
}

export function DonnaSafetyDisclosure({ context, showNextStep = false }: Props) {
  const { body, nextStep } = COPY[context]

  return (
    <div className="rounded-xl border border-lime/10 bg-lime/[0.02] px-3 py-2.5 space-y-1.5">
      <div className="flex items-start gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <p className="text-[10px] text-text-muted leading-relaxed">
          <span className="text-lime font-semibold">Safety — </span>
          {body}
        </p>
      </div>
      {showNextStep && nextStep && (
        <div className="flex items-start gap-2 pl-5">
          <ArrowRight className="w-3 h-3 text-lime/60 shrink-0 mt-0.5" />
          <p className="text-[10px] text-lime/70 leading-relaxed">{nextStep}</p>
        </div>
      )}
    </div>
  )
}
