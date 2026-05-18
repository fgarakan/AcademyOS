import { Lock, ArrowRight } from 'lucide-react'

type CurriculumRole = 'academy_director' | 'head_coach' | 'coach' | 'player' | 'parent' | null | undefined

interface Props {
  role: CurriculumRole
  children: React.ReactNode
  fallback?: React.ReactNode
}

const ROLE_MESSAGES: Partial<Record<NonNullable<CurriculumRole>, string>> = {
  coach:  'Coaches can view the curriculum but cannot edit it. Use the session wrap-up note to suggest a change to your director.',
  player: 'Players can view curriculum goals but cannot edit curriculum content.',
  parent: 'Parents can view level goals but cannot edit curriculum content.',
}

function canEdit(role: CurriculumRole): boolean {
  return role === 'academy_director' || role === 'head_coach'
}

export function CurriculumEditPermissionGuard({ role, children, fallback }: Props) {
  if (canEdit(role)) return <>{children}</>

  if (fallback) return <>{fallback}</>

  const message =
    ROLE_MESSAGES[role as NonNullable<CurriculumRole>] ??
    'You do not have permission to edit curriculum content.'

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-text-muted shrink-0" />
        <p className="text-[12px] font-semibold text-text-secondary">Read-only access</p>
      </div>
      <p className="text-[11px] text-text-muted leading-relaxed">{message}</p>
      {role === 'coach' && (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-surface-raised px-3 py-2.5">
          <ArrowRight className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-muted">
            To suggest a curriculum change, add a note in your{' '}
            <span className="text-lime font-semibold">session wrap-up</span> — it goes to the director automatically.
          </p>
        </div>
      )}
    </div>
  )
}

export { canEdit as canEditCurriculum }
