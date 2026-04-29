import { Eye, X } from 'lucide-react'
import { getPreviewContext } from '@/lib/utils/previewMode'
import { exitPreviewModeAction } from '@/lib/actions/platform'

const ROLE_LABELS: Record<string, string> = {
  academy_director: 'Director',
  coach:            'Coach',
  player:           'Player',
  parent:           'Parent',
}

export async function PreviewBanner() {
  const ctx = await getPreviewContext()
  if (!ctx) return null

  const roleLabel = ROLE_LABELS[ctx.role] ?? ctx.role

  return (
    <div className="bg-lime/10 border-b border-lime/30 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-lime/20 text-lime border border-lime/40 shrink-0">
          <Eye className="w-2.5 h-2.5" />
          Preview
        </span>
        <p className="text-sm font-medium text-text-primary truncate">
          Viewing as <span className="text-lime">{roleLabel}</span>
          {' · '}
          <span className="text-text-secondary">{ctx.academy_name}</span>
        </p>
        <p className="text-xs text-text-muted hidden sm:block shrink-0">
          Writes are disabled in preview.
        </p>
      </div>
      <form action={exitPreviewModeAction}>
        <button
          type="submit"
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-lime hover:text-lime/80 border border-lime/40 hover:border-lime/60 rounded-lg px-3 py-1.5 transition-colors bg-lime/5 hover:bg-lime/10"
        >
          <X className="w-3 h-3" />
          Exit Preview
        </button>
      </form>
    </div>
  )
}
