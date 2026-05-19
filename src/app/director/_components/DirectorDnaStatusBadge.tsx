import Link from 'next/link'
import { CheckCircle2, Sparkles } from 'lucide-react'

interface Props {
  savedAt?: string | null
}

function formatSavedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch {
    return ''
  }
}

export function DirectorDnaStatusBadge({ savedAt }: Props) {
  const dateLabel = savedAt ? formatSavedDate(savedAt) : null

  return (
    <div className="rounded-xl bg-lime/5 border border-lime/20 px-4 py-3.5 flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-lime/15 border border-lime/30 flex items-center justify-center shrink-0 mt-0.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-lime" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-sm font-semibold text-text-primary">Academy DNA on file</p>
          <span className="text-[9px] font-bold uppercase tracking-widest text-lime bg-lime/10 border border-lime/25 rounded px-1.5 py-0.5">
            Saved
          </span>
          {dateLabel && (
            <span className="text-[10px] text-text-muted">{dateLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-2.5 h-2.5 text-lime shrink-0" />
          <p className="text-[11px] text-text-secondary leading-snug">
            DONNA has your academy foundation. Saved to academy settings.
          </p>
        </div>
        <p className="text-[11px] text-text-muted leading-snug">
          Next: curriculum, templates, players, coaches.
        </p>
      </div>
      <Link
        href="/director/onboarding"
        className="shrink-0 text-[11px] text-text-muted hover:text-lime transition-colors mt-0.5 whitespace-nowrap"
      >
        Review onboarding →
      </Link>
    </div>
  )
}
