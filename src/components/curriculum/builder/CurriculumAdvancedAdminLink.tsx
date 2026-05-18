import Link from 'next/link'
import { Settings, ExternalLink, Lock } from 'lucide-react'

interface Props {
  isDirector?: boolean
}

export function CurriculumAdvancedAdminLink({ isDirector = true }: Props) {
  if (!isDirector) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
        <Lock className="w-3.5 h-3.5 text-text-muted shrink-0" />
        <p className="text-[11px] text-text-muted">Advanced curriculum tools are director-only.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-text-muted shrink-0" />
        <p className="text-[12px] font-semibold text-text-primary">Advanced tools</p>
      </div>
      <p className="text-[11px] text-text-muted leading-relaxed">
        Direct database access for bulk curriculum edits, migrations, and data imports. Use with care — changes bypass the draft/review workflow.
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-raised px-3 py-2">
          <p className="text-[11px] text-text-secondary">Supabase Studio</p>
          <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-raised px-3 py-2">
          <p className="text-[11px] text-text-secondary">Curriculum CSV import</p>
          <span className="text-[10px] text-text-muted">V2</span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-raised px-3 py-2">
          <p className="text-[11px] text-text-secondary">Version management</p>
          <span className="text-[10px] text-text-muted">V2</span>
        </div>
      </div>
      <p className="text-[10px] text-text-muted">
        Direct edits via Supabase Studio bypass the review queue and audit log. Use only for initial setup or bulk corrections. All regular changes should go through the builder.
      </p>
    </div>
  )
}
