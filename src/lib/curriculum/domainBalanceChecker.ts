// Sprint 520 — Domain Balance Checker
// Checks whether curriculum domains are balanced across levels and stages.
// Identifies over-indexed and under-indexed areas.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { CurriculumStage } from './visualMapModel'
import type { SkillDomain } from './skillHierarchyModel'

export type BalanceStatus = 'balanced' | 'over_indexed' | 'under_indexed' | 'missing'

export interface DomainBalanceEntry {
  domain: SkillDomain
  stage: CurriculumStage
  contentCount: number
  expectedMinimum: number
  expectedMaximum: number
  status: BalanceStatus
  deviation: number
}

export interface DomainBalanceReport {
  entries: DomainBalanceEntry[]
  overIndexedDomains: SkillDomain[]
  underIndexedDomains: SkillDomain[]
  missingDomains: SkillDomain[]
  balancedDomains: SkillDomain[]
  isBalanced: boolean
  balanceSummary: string
}

interface DomainBalanceInput {
  stage: CurriculumStage
  contentCountByDomain: Record<SkillDomain, number>
}

const STAGE_DOMAIN_EXPECTATIONS: Record<CurriculumStage, Record<SkillDomain, { min: number; max: number }>> = {
  'Red Ball': {
    technical: { min: 3, max: 8 },
    tactical: { min: 0, max: 3 },
    footwork: { min: 2, max: 6 },
    serve_return: { min: 1, max: 4 },
    rally: { min: 2, max: 5 },
    net_play: { min: 0, max: 2 },
    competition: { min: 0, max: 2 },
    fitness: { min: 1, max: 4 },
    mental: { min: 1, max: 3 },
  },
  'Orange Ball': {
    technical: { min: 3, max: 10 },
    tactical: { min: 2, max: 6 },
    footwork: { min: 2, max: 6 },
    serve_return: { min: 2, max: 5 },
    rally: { min: 2, max: 6 },
    net_play: { min: 1, max: 4 },
    competition: { min: 1, max: 3 },
    fitness: { min: 1, max: 4 },
    mental: { min: 1, max: 4 },
  },
  'Green Ball': {
    technical: { min: 3, max: 10 },
    tactical: { min: 3, max: 8 },
    footwork: { min: 2, max: 6 },
    serve_return: { min: 2, max: 6 },
    rally: { min: 2, max: 6 },
    net_play: { min: 2, max: 5 },
    competition: { min: 2, max: 5 },
    fitness: { min: 1, max: 4 },
    mental: { min: 2, max: 5 },
  },
  'Yellow Ball': {
    technical: { min: 3, max: 12 },
    tactical: { min: 4, max: 10 },
    footwork: { min: 2, max: 6 },
    serve_return: { min: 3, max: 7 },
    rally: { min: 2, max: 6 },
    net_play: { min: 2, max: 6 },
    competition: { min: 3, max: 7 },
    fitness: { min: 2, max: 5 },
    mental: { min: 2, max: 6 },
  },
  'High Performance': {
    technical: { min: 4, max: 15 },
    tactical: { min: 5, max: 12 },
    footwork: { min: 2, max: 6 },
    serve_return: { min: 3, max: 8 },
    rally: { min: 2, max: 6 },
    net_play: { min: 3, max: 8 },
    competition: { min: 4, max: 10 },
    fitness: { min: 3, max: 7 },
    mental: { min: 3, max: 8 },
  },
}

export function checkDomainBalance(input: DomainBalanceInput): DomainBalanceReport {
  const expectations = STAGE_DOMAIN_EXPECTATIONS[input.stage]
  const entries: DomainBalanceEntry[] = []

  const domains: SkillDomain[] = [
    'technical', 'tactical', 'footwork', 'serve_return', 'rally',
    'net_play', 'competition', 'fitness', 'mental',
  ]

  for (const domain of domains) {
    const count = input.contentCountByDomain[domain] ?? 0
    const { min, max } = expectations[domain]
    let status: BalanceStatus
    let deviation = 0

    if (count === 0 && min > 0) {
      status = 'missing'
      deviation = -min
    } else if (count < min) {
      status = 'under_indexed'
      deviation = count - min
    } else if (count > max) {
      status = 'over_indexed'
      deviation = count - max
    } else {
      status = 'balanced'
      deviation = 0
    }

    entries.push({
      domain,
      stage: input.stage,
      contentCount: count,
      expectedMinimum: min,
      expectedMaximum: max,
      status,
      deviation,
    })
  }

  const overIndexedDomains = entries.filter(e => e.status === 'over_indexed').map(e => e.domain)
  const underIndexedDomains = entries.filter(e => e.status === 'under_indexed').map(e => e.domain)
  const missingDomains = entries.filter(e => e.status === 'missing').map(e => e.domain)
  const balancedDomains = entries.filter(e => e.status === 'balanced').map(e => e.domain)
  const isBalanced = missingDomains.length === 0 && underIndexedDomains.length === 0

  const summaryParts: string[] = []
  if (balancedDomains.length === domains.length) {
    summaryParts.push('All domains balanced.')
  } else {
    if (missingDomains.length > 0) summaryParts.push(`${missingDomains.length} domain${missingDomains.length > 1 ? 's' : ''} missing`)
    if (underIndexedDomains.length > 0) summaryParts.push(`${underIndexedDomains.length} under-indexed`)
    if (overIndexedDomains.length > 0) summaryParts.push(`${overIndexedDomains.length} over-indexed`)
  }

  return {
    entries,
    overIndexedDomains,
    underIndexedDomains,
    missingDomains,
    balancedDomains,
    isBalanced,
    balanceSummary: summaryParts.join(' · ') || 'Coverage checked.',
  }
}

export function getBalanceStatusLabel(status: BalanceStatus): string {
  const labels: Record<BalanceStatus, string> = {
    balanced: 'Balanced',
    over_indexed: 'Over-indexed',
    under_indexed: 'Under-indexed',
    missing: 'Missing',
  }
  return labels[status]
}
