'use client'

import { useRouter } from 'next/navigation'
import { CurriculumRelationshipMap } from './CurriculumRelationshipMap'
import type { CurriculumLevel, CurriculumGate, CurriculumDrill } from '@/lib/backend/curriculumExplorer'

interface Props {
  levels: CurriculumLevel[]
  gates?: CurriculumGate[]
  drills?: CurriculumDrill[]
  activeLevelId?: string
}

export function CurriculumRelationshipMapNav({ levels, gates, drills, activeLevelId }: Props) {
  const router = useRouter()

  function handleLevelClick(levelId: string) {
    router.push(`/director/curriculum/level/${levelId}`)
  }

  return (
    <CurriculumRelationshipMap
      levels={levels}
      gates={gates}
      drills={drills}
      activeLevelId={activeLevelId}
      onLevelClick={handleLevelClick}
    />
  )
}
