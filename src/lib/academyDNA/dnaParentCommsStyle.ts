// Mega Sprint 2801–2830 — DONNA Academy Operating Intelligence V1
// DNA Parent Communication Style: generates DNA-appropriate parent communication guidance.
//
// Parent guidance varies dramatically by DNA model:
//   12U Foundation  → educational, celebratory, long-term development language
//   12+ Performance → accountability, progress-focused, data-supported language
//   College Placement → results-focused, recruiting-aware, transparent
//   Club Growth     → retention-heavy, milestone-based, community-focused
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Deterministic. No AI required.
//   - Does NOT replace donnaParentCommunicationIntelligence.ts.
//     Instead: adds DNA-specific communication style guidance.
//   - Does NOT draft actual messages. Output is guidance only.
//     All parent communications require director approval per operating model.

import type { OperatingModelContext, ParentLanguageStyle } from './operatingModelContext'

// ── Output types ──────────────────────────────────────────────────────────────

export interface DnaParentCommsGuidance {
  languageStyle:        ParentLanguageStyle
  toneDescription:      string
  openingFraming:       string       // how to open a parent communication
  progressFraming:      string       // how to describe player progress
  challengeFraming:     string       // how to describe areas for improvement
  nextStepsFraming:     string       // how to frame what comes next
  avoidTopics:          string[]
  examplePhrases:       string[]
  updateFrequency:      string
  communicationGapNote: string       // what to say if there has been a gap
  portalSummary:        string       // what parents can see on the portal
}

export interface ParentCommOpportunityDna {
  type:           'milestone' | 'assessment_complete' | 'advancement' | 'engagement_positive' | 'outreach'
  headline:       string
  guidanceNote:   string
  draftGuidance:  string    // instruction for drafting the message
  tone:           string
  avoidIn:        string[]  // topics to avoid in this specific message
}

// ── Tone descriptions per language style ─────────────────────────────────────

const TONE_DESCRIPTIONS: Record<ParentLanguageStyle, string> = {
  educational:    'Warm, encouraging, and celebratory. Lead with what the player has mastered. Keep technical language minimal.',
  accountability: 'Clear, direct, and data-supported. Parents expect specifics. Frame honestly — progress and gaps both.',
  retention:      'Welcoming, community-focused, and milestone-based. Make parents feel their player belongs. Lead with belonging.',
  recruiting:     'Results-focused and transparent. Parents are active partners — they need full information to make recruiting decisions.',
}

// ── Opening framing per model ─────────────────────────────────────────────────

const OPENING_FRAMING: Record<string, string> = {
  '12u_foundation':    'Start with what the player enjoyed or achieved this period. "We wanted to share a great update about [Name]\'s progress!"',
  'performance_12plus': 'Start with assessment or milestone data. "Here is [Name]\'s progress update for this assessment period."',
  'college_placement': 'Start with performance context. "Here is [Name]\'s performance summary and what it means for their recruiting profile."',
  'club_growth':       'Start with community connection. "We love having [Name] in the program — here is what they have been up to!"',
}

const PROGRESS_FRAMING: Record<string, string> = {
  '12u_foundation':    'Describe progress in terms of skills developed and enjoyment levels. Avoid comparing to peers. Lead with what they can do now that they could not before.',
  'performance_12plus': 'Use assessment domain scores where available. Be specific: "Technical scores improved from X to Y this period." Name the criterion met.',
  'college_placement': 'Reference UTR, competition results, and court performance. Parents need recruiting-ready language: "Match record", "Rating trend", "Coach observation: [specific]."',
  'club_growth':       'Celebrate milestones and community participation. "Completed their first Orange Ball session," "Showed great sportsmanship last week." Progress is personal, not comparative.',
}

const CHALLENGE_FRAMING: Record<string, string> = {
  '12u_foundation':    'Frame challenges as the exciting next step. "The next thing we are working on together is..." Never use deficit language with 12U families.',
  'performance_12plus': 'Name the specific gap clearly and the plan to close it. "Technical execution under pressure is the area we are targeting this period. Here is what the coaching plan looks like."',
  'college_placement': 'Frame gaps in recruiting terms. "There is a gap in match tactics that we are addressing directly — here is how it affects the recruiting timeline and what we are doing about it."',
  'club_growth':       'Keep challenge language light and motivational. "There are always new skills to discover — [Name] is working on..." Avoid any language that might discourage continued enrollment.',
}

const NEXT_STEPS_FRAMING: Record<string, string> = {
  '12u_foundation':    'Frame the next period as an adventure. "Next, [Name] will be working toward [milestone] — we will update you when they get there!"',
  'performance_12plus': 'Frame next steps as a structured plan. "Over the next [cadence] period, we will be focusing on [specific criterion]. Assessment is scheduled for [date]."',
  'college_placement': 'Frame next steps in recruiting terms. "The next tournament entry is [date]. The plan is to [specific goal] to improve the recruiting profile."',
  'club_growth':       'Frame next steps as community events and milestones. "Coming up: [event/milestone]. We will see [Name] at [session time] — looking forward to it!"',
}

const EXAMPLE_PHRASES: Record<string, string[]> = {
  '12u_foundation': [
    '"We love having [Name] in the program."',
    '"They showed great enthusiasm this month."',
    '"Their movement and coordination have really developed."',
    '"We are celebrating a milestone — they have completed [level]."',
    '"Tennis is becoming something they look forward to — and that is everything at this stage."',
  ],
  'performance_12plus': [
    '"Assessment results for this period show..."',
    '"The coaching team has identified [criterion] as the current focus area."',
    '"[Name] is on track / ahead of / behind the advancement timeline."',
    '"We recommend scheduling an assessment by [date] to confirm advancement eligibility."',
    '"Technical execution is at [score] — the next target is [criterion]."',
  ],
  'college_placement': [
    '"UTR trend this quarter: [direction and numbers]."',
    '"Match record: [W/L] in the last [period]."',
    '"College coach conversations: [status]."',
    '"The next tournament window is [date] — we recommend entering [event]."',
    '"Mental performance observations from coach: [specific note]."',
  ],
  'club_growth': [
    '"[Name] is a great part of our community."',
    '"We want to share a milestone — [achievement]."',
    '"The [group name] group has been such a great fit for [Name]."',
    '"We are looking forward to the upcoming [event/program]."',
    '"[Name] has been showing real confidence on court — love to see it."',
  ],
}

const COMMUNICATION_GAP_NOTES: Record<string, string> = {
  '12u_foundation':    'If there has been a communication gap, open with warmth and something positive: "We realise it has been a while — here is a quick update!"',
  'performance_12plus': 'If there has been a communication gap, acknowledge it directly and lead with current data: "We are overdue for an update — here is where things stand."',
  'college_placement': 'Communication gaps in a college placement model are notable. Open with context: "We want to make sure you have the most current recruiting picture — here is the update."',
  'club_growth':       'For a club growth academy, re-engage warmly: "We missed connecting! Here is what [Name] has been up to."',
}

// ── Guidance builder ──────────────────────────────────────────────────────────

/**
 * Build DNA-appropriate parent communication guidance for this academy's operating model.
 * Returns actionable guidance — not a drafted message.
 * All actual messages require director review and approval.
 */
export function buildDnaParentCommsGuidance(ctx: OperatingModelContext): DnaParentCommsGuidance {
  const { parentStandards, dnaModelId } = ctx

  const portalParts: string[] = []
  if (parentStandards.portalVisibility.domainScores)         portalParts.push('domain scores')
  if (parentStandards.portalVisibility.competitionHistory)   portalParts.push('competition history')
  if (parentStandards.portalVisibility.donnaRecommendations) portalParts.push('DONNA recommendations')
  if (parentStandards.portalVisibility.rawCoachNotes)        portalParts.push('coach notes')
  if (parentStandards.portalVisibility.rankings)             portalParts.push('rankings')
  const portalSummary = portalParts.length > 0
    ? `Parents can see: ${portalParts.join(', ')}.`
    : 'Parent portal is set to minimal visibility for this model.'

  return {
    languageStyle:        parentStandards.languageStyle,
    toneDescription:      TONE_DESCRIPTIONS[parentStandards.languageStyle],
    openingFraming:       OPENING_FRAMING[dnaModelId]          ?? 'Open with a positive progress note.',
    progressFraming:      PROGRESS_FRAMING[dnaModelId]         ?? 'Describe progress clearly and specifically.',
    challengeFraming:     CHALLENGE_FRAMING[dnaModelId]        ?? 'Frame challenges constructively with a next step.',
    nextStepsFraming:     NEXT_STEPS_FRAMING[dnaModelId]       ?? 'Outline the plan for the next period.',
    avoidTopics:          parentStandards.avoidTopics,
    examplePhrases:       EXAMPLE_PHRASES[dnaModelId]          ?? [],
    updateFrequency:      parentStandards.updateFrequency,
    communicationGapNote: COMMUNICATION_GAP_NOTES[dnaModelId]  ?? 'Re-engage warmly with a current update.',
    portalSummary,
  }
}

// ── Opportunity classifier ────────────────────────────────────────────────────

/**
 * Given a communication trigger type, return DNA-appropriate guidance for this message.
 */
export function buildParentCommOpportunityGuidance(
  type: ParentCommOpportunityDna['type'],
  ctx:  OperatingModelContext,
  playerName: string,
): ParentCommOpportunityDna {
  const guidance = buildDnaParentCommsGuidance(ctx)

  const configs: Record<ParentCommOpportunityDna['type'], Omit<ParentCommOpportunityDna, 'type'>> = {
    milestone: {
      headline:       `Milestone reached — share with ${playerName}'s family`,
      guidanceNote:   'Use the milestone as the primary headline. This is a celebration moment.',
      draftGuidance:  `${guidance.openingFraming} Lead with the milestone. ${guidance.nextStepsFraming}`,
      tone:           guidance.toneDescription,
      avoidIn:        guidance.avoidTopics,
    },
    assessment_complete: {
      headline:       `Assessment complete — update ready for ${playerName}'s family`,
      guidanceNote:   'Assessment updates should include the outcome and what comes next.',
      draftGuidance:  `${guidance.progressFraming} Include any areas of focus. ${guidance.nextStepsFraming}`,
      tone:           guidance.toneDescription,
      avoidIn:        guidance.avoidTopics,
    },
    advancement: {
      headline:       `${playerName} is ready to advance — notify family`,
      guidanceNote:   'Advancement is a major milestone. Frame it per DNA model language.',
      draftGuidance:  `${guidance.openingFraming} Describe the advancement. ${guidance.nextStepsFraming}`,
      tone:           guidance.toneDescription,
      avoidIn:        guidance.avoidTopics,
    },
    engagement_positive: {
      headline:       `Positive engagement signal — good time for an outreach`,
      guidanceNote:   'Positive signals are relationship-building opportunities. Keep it brief and warm.',
      draftGuidance:  `${guidance.openingFraming} Share the positive observation. Keep it to 2–3 sentences.`,
      tone:           guidance.toneDescription,
      avoidIn:        [...guidance.avoidTopics, 'assessment data', 'advancement timeline'],
    },
    outreach: {
      headline:       `Communication gap detected — reach out to ${playerName}'s family`,
      guidanceNote:   'Re-engagement message. Acknowledge the gap if appropriate, then lead with something positive.',
      draftGuidance:  guidance.communicationGapNote,
      tone:           guidance.toneDescription,
      avoidIn:        guidance.avoidTopics,
    },
  }

  return { type, ...configs[type] }
}
