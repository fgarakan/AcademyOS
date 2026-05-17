import Link from 'next/link'
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react'

export function CurriculumSetupState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-6 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full border border-lime/20 bg-lime/[0.04] flex items-center justify-center">
        <BookOpen className="w-7 h-7 text-lime" />
      </div>

      <div className="space-y-2">
        <h2 className="text-[18px] font-bold text-text-primary">No curriculum configured yet</h2>
        <p className="text-[13px] text-text-secondary leading-relaxed">
          Your academy&apos;s curriculum spine defines the levels players move through, the drills they practise,
          and the gates they must pass to advance.
        </p>
      </div>

      <div className="rounded-2xl border border-lime/15 bg-lime/[0.02] p-5 text-left space-y-3 w-full">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lime shrink-0" />
          <p className="text-[12px] font-semibold text-text-primary">DONNA can help you start</p>
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Tell DONNA how your academy structures player development — she&apos;ll draft a starting curriculum
          for your review. You approve every decision before anything is saved.
        </p>
        <p className="text-[10px] text-text-muted">
          All drafts go to the Review Queue. Nothing is applied automatically.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <Link href="/director/curriculum/guided" className="btn-lime text-[13px] px-5 py-2.5 flex items-center justify-center gap-2">
          Start guided setup <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/director/curriculum/map" className="btn-ghost text-[12px] px-5 py-2">
          View empty curriculum map
        </Link>
      </div>
    </div>
  )
}
