'use client'

import { useTransition } from 'react'
import { BookOpen } from 'lucide-react'
import { EmptyState } from '@/components/ui'

interface PlayerCurriculumEmptyStateProps {
  onAssign: () => Promise<void>
}

export function PlayerCurriculumEmptyState({ onAssign }: PlayerCurriculumEmptyStateProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <EmptyState
      icon={<BookOpen className="w-5 h-5" />}
      title="No curriculum placement yet"
      description="Assign a starting level to begin tracking this player's skill development."
      action={
        <button
          onClick={() => startTransition(() => { void onAssign() })}
          disabled={isPending}
          className="btn-lime disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Assigning...' : 'Assign Starting Level'}
        </button>
      }
    />
  )
}
