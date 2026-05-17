import { ShieldCheck } from 'lucide-react'

interface Props {
  context: 'curriculum_builder' | 'review_queue' | 'level_edit'
}

const COPY: Record<Props['context'], string> = {
  curriculum_builder:
    'DONNA drafts — directors approve. No curriculum change takes effect until you review and approve it in the Review Queue. DONNA cannot move players, change enrolments, or override coach decisions.',
  review_queue:
    'Every item here was proposed by DONNA and is waiting for your explicit approval. Approving applies the change. Rejecting discards it permanently. DONNA cannot approve her own proposals.',
  level_edit:
    'Edits to this level are drafted only. Nothing is applied to the live curriculum until you approve the draft in the Review Queue. Coaches and players are not affected by drafts.',
}

export function DonnaSafetyDisclosure({ context }: Props) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-lime/10 bg-lime/[0.02] px-3 py-2.5">
      <ShieldCheck className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
      <p className="text-[10px] text-text-muted leading-relaxed">
        <span className="text-lime font-semibold">Safety — </span>
        {COPY[context]}
      </p>
    </div>
  )
}
