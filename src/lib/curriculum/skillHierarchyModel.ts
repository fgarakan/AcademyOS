// Sprint 511 — Skill / Sub-Skill Hierarchy Model
// Typed model for skills and sub-skills within curriculum levels.
// Skills provide the readable "what players are developing" layer.
// Sub-skills are granular components coaches observe and track.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { CurriculumStage } from './visualMapModel'

export type SkillDomain =
  | 'technical'
  | 'tactical'
  | 'footwork'
  | 'serve_return'
  | 'rally'
  | 'net_play'
  | 'competition'
  | 'fitness'
  | 'mental'

export interface Skill {
  skillId: string
  levelId: string
  levelName: string
  stage: CurriculumStage
  domain: SkillDomain
  name: string
  playerFacingLabel: string
  coachDescription: string | null
  isPlayerVisible: boolean
  isParentVisible: boolean
  subSkills: SubSkill[]
  displayOrder: number
}

export interface SubSkill {
  subSkillId: string
  skillId: string
  name: string
  coachObservationPrompt: string | null
  isPlayerVisible: boolean
  isObservable: boolean
  displayOrder: number
}

export interface SkillHierarchySummary {
  totalSkills: number
  totalSubSkills: number
  byDomain: Record<SkillDomain, number>
  playerVisibleSkillCount: number
  parentVisibleSkillCount: number
  observableSubSkillCount: number
}

export function buildSkillHierarchySummary(skills: Skill[]): SkillHierarchySummary {
  const byDomain: Record<SkillDomain, number> = {
    technical: 0,
    tactical: 0,
    footwork: 0,
    serve_return: 0,
    rally: 0,
    net_play: 0,
    competition: 0,
    fitness: 0,
    mental: 0,
  }

  for (const skill of skills) {
    byDomain[skill.domain] = (byDomain[skill.domain] ?? 0) + 1
  }

  const totalSubSkills = skills.reduce((sum, s) => sum + s.subSkills.length, 0)
  const observableSubSkillCount = skills.reduce(
    (sum, s) => sum + s.subSkills.filter(ss => ss.isObservable).length,
    0,
  )

  return {
    totalSkills: skills.length,
    totalSubSkills,
    byDomain,
    playerVisibleSkillCount: skills.filter(s => s.isPlayerVisible).length,
    parentVisibleSkillCount: skills.filter(s => s.isParentVisible).length,
    observableSubSkillCount,
  }
}

export function getSkillsForLevel(skills: Skill[], levelId: string): Skill[] {
  return skills.filter(s => s.levelId === levelId).sort((a, b) => a.displayOrder - b.displayOrder)
}

export function getSkillsForDomain(skills: Skill[], domain: SkillDomain): Skill[] {
  return skills.filter(s => s.domain === domain)
}

export function getPlayerVisibleSkills(skills: Skill[]): Skill[] {
  return skills.filter(s => s.isPlayerVisible)
}

export function getParentVisibleSkills(skills: Skill[]): Skill[] {
  return skills.filter(s => s.isParentVisible)
}

export function flattenSkillTree(skills: Skill[]): Array<Skill | (SubSkill & { parentSkill: Skill })> {
  const result: Array<Skill | (SubSkill & { parentSkill: Skill })> = []
  for (const skill of skills) {
    result.push(skill)
    for (const subSkill of skill.subSkills) {
      result.push({ ...subSkill, parentSkill: skill })
    }
  }
  return result
}

export function getSkillDomainLabel(domain: SkillDomain): string {
  const labels: Record<SkillDomain, string> = {
    technical: 'Technical',
    tactical: 'Tactical',
    footwork: 'Footwork / Movement',
    serve_return: 'Serve / Return',
    rally: 'Rally Tolerance',
    net_play: 'Net Play',
    competition: 'Competition',
    fitness: 'Fitness / Athletic',
    mental: 'Mental Skills',
  }
  return labels[domain]
}
