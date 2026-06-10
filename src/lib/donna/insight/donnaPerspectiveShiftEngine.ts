// Mega Sprint 1655–1684 — DONNA Insight & Perspective Shift Engine V1
// Perspective shift engine: helps directors consider alternative viewpoints.
// Converts learning lessons into current-perspective / alternative-perspective pairs.
//
// Purpose: not to tell the director they are wrong,
// but to surface a frame they may not have considered.

import type { MemoryLearningReport } from '../learning/donnaAcademyLearningTypes'
import type { PerspectiveShift, EvidenceStrength } from './donnaInsightTypes'
import {
  scoreEvidenceStrength,
  fromLearningConfidence,
} from './donnaInsightConfidenceEngine'

// ── Builder ───────────────────────────────────────────────────────────────────

function makeShift(
  currentPerspective:     string,
  alternativePerspective: string,
  evidence:               string[],
  evidenceStrength:       EvidenceStrength,
  suggestedInvestigation: string,
  limitations:            string[],
): PerspectiveShift {
  return {
    id: `shift-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    currentPerspective,
    alternativePerspective,
    evidence,
    evidenceStrength,
    confidence: fromLearningConfidence('low'),
    suggestedInvestigation,
    limitations,
  }
}

// ── Lesson → shift map ────────────────────────────────────────────────────────
// Each lesson headline maps to a perspective shift pair.
// Current perspective reflects the conventional reading of the lesson.
// Alternative perspective offers a reframing — not a contradiction.

function shiftFromLesson(
  headline:  string,
  insight:   string,
  evidence:  string[],
  strength:  EvidenceStrength,
): PerspectiveShift | null {

  if (headline === 'Active advancement period') {
    return makeShift(
      'The academy is successfully advancing players.',
      'Are we advancing quickly enough? This cluster may indicate a period of conservatism that has now released — suggesting eligible players were waiting longer than needed.',
      evidence,
      strength,
      'Review how long each recently promoted player had been at their previous level before promotion.',
      ['This is a reframing, not a criticism — timing context is needed to evaluate.'],
    )
  }

  if (headline === 'Repeated action rejections') {
    return makeShift(
      "DONNA is not understanding our needs.",
      "Our decision criteria may not be fully documented in the system — DONNA cannot learn from reasoning that isn't recorded in reviewer notes.",
      evidence,
      strength,
      'Add reviewer notes to recent rejections explaining the reasoning — this gives DONNA context for future proposals.',
      ["Absence of reviewer notes is not a DONNA failure — it's an input gap."],
    )
  }

  if (headline === 'Frequent DONNA overrides') {
    return makeShift(
      "DONNA needs better proposals.",
      "DONNA's context window may be incomplete. The overrides themselves are valuable feedback — if reviewer notes capture the reasoning, future proposals will improve.",
      evidence,
      strength,
      'Review the most-overridden proposal types and check whether reviewer notes explain the changes.',
      ['This shift is about context quality, not proposal quality.'],
    )
  }

  if (headline === 'Low assessment volume') {
    return makeShift(
      'We need to do more assessments.',
      'Our assessment frequency may be appropriate — the issue may be documentation rather than cadence. Assessments conducted informally are not visible to the system.',
      evidence,
      strength,
      'Verify whether assessments are being conducted but not formally logged, before increasing assessment frequency.',
      ['Documentation gap and assessment gap are different problems with different solutions.'],
    )
  }

  if (headline === 'Curriculum change burst') {
    return makeShift(
      'The curriculum is being over-corrected.',
      'The burst may reflect healthy responsiveness — coaches providing feedback and curriculum adapting quickly. Rapid iteration is not inherently negative.',
      evidence,
      strength,
      'Distinguish between reactive changes (responding to problems) and proactive changes (planned evolution).',
      ['Curriculum change frequency alone cannot indicate quality of changes.'],
    )
  }

  if (headline === 'Multiple coach assignment changes') {
    return makeShift(
      'Coach–player relationships are unstable.',
      'Multiple assignment changes may reflect a deliberate restructuring to better match coaching styles with player needs — not instability.',
      evidence,
      strength,
      'Review the context of each assignment change: was it reactive (problem) or proactive (optimization)?',
      ['Coach assignment changes are neutral without understanding the reason for each change.'],
    )
  }

  if (headline === 'Low parent communication volume') {
    return makeShift(
      'We are under-communicating with families.',
      'Parents may be well-informed through other channels (direct calls, coach messages) not captured in the system. Low recorded updates ≠ low actual communication.',
      evidence,
      strength,
      'Survey a sample of families about communication frequency and satisfaction before increasing update volume.',
      ['System-recorded communication is not the total of actual communication.'],
    )
  }

  if (headline === 'Active onboarding period') {
    return makeShift(
      'We are growing quickly.',
      'High placement velocity may be outpacing onboarding infrastructure — coach capacity, assessment scheduling, and parent communication may need to scale with intake.',
      evidence,
      strength,
      'Compare placement velocity to available coach capacity and assessment scheduling bandwidth.',
      ['Growth pace and infrastructure readiness are different dimensions.'],
    )
  }

  if (headline.startsWith('Decision pace is increasing')) {
    return makeShift(
      'We are handling more decisions — the academy is active.',
      'Accelerating decision pace may indicate backlog clearing rather than genuine operational growth. The quality of each decision matters more than velocity.',
      evidence,
      strength,
      'Review whether the increased decision rate reflects new activity or previously deferred decisions.',
      ['Decision velocity is a count, not a measure of decision quality.'],
    )
  }

  if (headline.startsWith('Override rate is increasing')) {
    return makeShift(
      "DONNA is becoming less aligned with our direction.",
      "Increasing override rate may mean director priorities are evolving faster than the recorded context — not that DONNA is getting worse.",
      evidence,
      strength,
      'Add reviewer notes to the most recent overrides to re-align context.',
      ['Override rate trend is frequency-based — not a quality signal.'],
    )
  }

  return null
}

// ── Generator ─────────────────────────────────────────────────────────────────

export function generatePerspectiveShifts(
  report: MemoryLearningReport,
): PerspectiveShift[] {
  const results: PerspectiveShift[] = []
  const total = report.totalMemoriesAnalyzed

  for (const lesson of report.lessons) {
    if (lesson.confidence === 'insufficient') continue

    const evidence = lesson.limitations  // lessons carry their own evidence context
    const strength = scoreEvidenceStrength(1, total)  // lesson has one source signal

    const shift = shiftFromLesson(lesson.headline, lesson.insight, evidence, strength)
    if (shift) results.push(shift)
  }

  return results
}
