// Assessment Comparison Engine — pure TypeScript, no DB calls.
// Compares current vs previous assessment, returns deltas and recommendations.

import type {
  AssessmentComparison,
  BlueprintRecommendation,
  DeltaStatus,
  DomainDelta,
  PreviousAssessmentData,
  ScoresDetail,
  SkillDelta,
} from './assessmentTemplateTypes'

function toDeltaStatus(delta: number | null, prev: number | null): DeltaStatus {
  if (prev === null) return 'new'
  if (delta === null) return 'unchanged'
  if (delta > 0.4)  return 'improved'
  if (delta < -0.4) return 'declined'
  return 'unchanged'
}

const DOMAIN_MAP: Array<{ domain: string; label: string; key: keyof PreviousAssessmentData }> = [
  { domain: 'technical',   label: 'Technical',   key: 'technical_score' },
  { domain: 'tactical',    label: 'Tactical',    key: 'tactical_score' },
  { domain: 'movement',    label: 'Movement',    key: 'movement_score' },
  { domain: 'competition', label: 'Competition', key: 'competition_score' },
  { domain: 'mental',      label: 'Mental',      key: 'behavioral_score' },
]

export function compareAssessments(
  current: PreviousAssessmentData,
  previous: PreviousAssessmentData | null,
): AssessmentComparison {

  // ── Domain-level comparison ───────────────────────────────────────────────
  const domainDeltas: DomainDelta[] = DOMAIN_MAP.map(({ domain, label, key }) => {
    const curr = current[key] as number | null
    const prev = previous ? (previous[key] as number | null) : null
    const delta = curr !== null && prev !== null ? parseFloat((curr - prev).toFixed(1)) : null
    return { domain, label, current: curr, previous: prev, delta, status: toDeltaStatus(delta, prev) }
  })

  // ── Skill-level comparison (from scores_detail) ───────────────────────────
  const currentDetail: ScoresDetail | null = current.scores_detail
  const previousDetail: ScoresDetail | null = previous?.scores_detail ?? null

  const skillDeltas: SkillDelta[] = []

  if (currentDetail?.sections) {
    for (const [sectionKey, sectionData] of Object.entries(currentDetail.sections)) {
      if (!sectionData.skills) continue
      const prevSection = previousDetail?.sections?.[sectionKey]
      for (const [skillKey, skillData] of Object.entries(sectionData.skills)) {
        if (skillData.not_assessed || skillData.score === null) continue
        const currScore = skillData.score
        const prevSkill = prevSection?.skills?.[skillKey]
        const prevScore = prevSkill?.not_assessed ? null : (prevSkill?.score ?? null)
        const delta = currScore !== null && prevScore !== null
          ? parseFloat((currScore - prevScore).toFixed(1))
          : null
        skillDeltas.push({
          section_key: sectionKey,
          skill_key:   skillKey,
          label:       skillKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          current:     currScore,
          previous:    prevScore,
          delta,
          status:      toDeltaStatus(delta, prevScore),
        })
      }
    }
  }

  const topImprovements = skillDeltas
    .filter(d => d.delta !== null && d.delta > 0)
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
    .slice(0, 5)

  const topDeclines = skillDeltas
    .filter(d => d.delta !== null && d.delta < 0)
    .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))
    .slice(0, 5)

  const overallCurr = current.overall_score
  const overallPrev = previous?.overall_score ?? null
  const overallDelta = overallCurr !== null && overallPrev !== null
    ? parseFloat((overallCurr - overallPrev).toFixed(1))
    : null
  const overallStatus = toDeltaStatus(overallDelta, overallPrev)

  // ── Recommendations ───────────────────────────────────────────────────────
  const recommendations: BlueprintRecommendation[] = []
  const reasons: string[] = []

  if (!previous) {
    recommendations.push('update_blueprint')
    reasons.push('First assessment — establish baseline blueprint')
  } else {
    const improvedCount = domainDeltas.filter(d => d.status === 'improved').length
    const declinedCount = domainDeltas.filter(d => d.status === 'declined').length

    if (improvedCount >= 3) {
      recommendations.push('update_blueprint')
      reasons.push(`${improvedCount} domains improved — blueprint may need updating`)
    } else {
      recommendations.push('keep_blueprint')
      reasons.push('Scores stable — current blueprint is appropriate')
    }

    if (declinedCount >= 2) {
      recommendations.push('assign_mission')
      reasons.push(`${declinedCount} domains declined — consider a targeted mission`)
    }

    if (overallCurr !== null && overallCurr >= 7.5) {
      recommendations.push('trigger_level_readiness_review')
      reasons.push('Overall score ≥ 7.5 — eligible for level readiness review')
    }

    if (overallDelta !== null && overallDelta >= 0.5) {
      recommendations.push('generate_parent_draft')
      reasons.push(`Overall improved by ${overallDelta} — consider sending a parent update`)
    }
  }

  return {
    domainDeltas,
    topImprovements,
    topDeclines,
    overallDelta,
    overallStatus,
    recommendations,
    recommendationReasons: reasons,
  }
}

// Derives domain scores from a ScoresDetail object (used when submitting)
export function deriveDomainScores(detail: ScoresDetail): {
  technical_score: number | null
  tactical_score: number | null
  movement_score: number | null
  competition_score: number | null
  behavioral_score: number | null
  overall_score: number | null
} {
  function sectionScore(key: string): number | null {
    const s = detail.sections[key]
    if (!s || s.not_assessed) return null
    if (s.section_score !== null) return s.section_score
    // Derive from skill average if no section score set
    const scores = Object.values(s.skills)
      .filter(sk => !sk.not_assessed && sk.score !== null)
      .map(sk => sk.score as number)
    return scores.length > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : null
  }

  const fh = sectionScore('forehand')
  const bh = sectionScore('backhand')
  const sv = sectionScore('serve')
  const techScores = [fh, bh, sv].filter(s => s !== null) as number[]
  const technical_score = techScores.length > 0
    ? parseFloat((techScores.reduce((a, b) => a + b, 0) / techScores.length).toFixed(1))
    : null

  const tactical_score   = sectionScore('return_rally_competition')
  const movement_score   = sectionScore('fitness_movement')
  const behavioral_score = sectionScore('mental_performance')

  // Competition score: from universal_foundations competition_readiness skill
  const uf = detail.sections['universal_foundations']
  const compSkill = uf?.skills?.['competition_readiness']
  const competition_score = compSkill && !compSkill.not_assessed ? compSkill.score : null

  const domainScores = [technical_score, tactical_score, movement_score, competition_score, behavioral_score]
    .filter(s => s !== null) as number[]
  const overall_score = domainScores.length > 0
    ? parseFloat((domainScores.reduce((a, b) => a + b, 0) / domainScores.length).toFixed(1))
    : null

  return { technical_score, tactical_score, movement_score, competition_score, behavioral_score, overall_score }
}
