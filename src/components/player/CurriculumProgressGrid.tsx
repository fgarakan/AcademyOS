import type { Tables } from '@/lib/supabase/database.types'
import { SkillDomainCard } from './SkillDomainCard'

type DomainRow = Tables<'v_player_curriculum_detail'>

const DOMAIN_ORDER = [
  'preparation',
  'downswing',
  'contact',
  'finish',
  'transition',
  'movement',
  'decision_making',
  'competition_behavior',
] as const

interface CurriculumProgressGridProps {
  rows: DomainRow[]
}

export function CurriculumProgressGrid({ rows }: CurriculumProgressGridProps) {
  const byDomain = new Map(rows.map(r => [r.domain, r]))

  return (
    <div className="grid grid-cols-2 gap-3">
      {DOMAIN_ORDER.map(domain => {
        const row = byDomain.get(domain)
        if (!row) return null
        return <SkillDomainCard key={domain} row={row} />
      })}
    </div>
  )
}
