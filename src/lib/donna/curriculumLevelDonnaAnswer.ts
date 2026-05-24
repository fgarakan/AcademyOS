// Sprint 737 -- DONNA Curriculum Level Explanation Engine V1
// Answers curriculum structure, level explanation, content type summary, and gap questions.
// Uses static AcademyOS curriculum knowledge (level names, stages, content types).
// Uses DirectorDonnaContext.curriculumGaps when live data exists.
// Sprint 742C -- Added template coverage gap patterns and answer builder.
// Pure TypeScript -- no DB, no AI, no mutations, no side effects.

import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'
import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import { summarizeCoverageGaps } from '@/lib/donna/curriculumTemplateCoverageGapDetector'

// -- Pattern detection --------------------------------------------------------

const LEVEL_STRUCTURE_PATTERNS =
  /\b(curriculum levels?|what levels? (do i have|are there|exist)|level structure|how many levels?|what stages? (do i|are there)|development stages?)\b/i

const EXPLAIN_LEVEL_PATTERNS =
  /\b(explain|what is|tell me about|describe|what does|what.?s).{0,20}\b(red|orange|yellow|green|high.?perf(ormance)?|level \d+)\b/i

const CONTENT_SUMMARY_PATTERNS =
  /\b(skills?|drills?|gates?|assessments?|missions?|badges?)\b.{0,30}\b(in|at|for|on).{0,20}\b(level|red|orange|yellow|green|stage)\b/i

const CONTENT_EXPLAIN_PATTERNS =
  /\bwhat (are|is) (a |the )?(skill|drill|gate|assessment|mission|badge)s?\b/i

const GAP_PATTERNS =
  /\b(what.{0,20}(missing|gaps?|incomplete|lacking)|gaps? in (my )?curriculum|curriculum.{0,20}(missing|gaps?|issues?|holes?|incomplete|problem)|identify.{0,10}gaps?|find.{0,10}gaps?)\b/i

const HOW_CURRICULUM_PATTERNS =
  /\b(how does.{0,20}(curriculum|level.?system|progression) work|explain.{0,20}(curriculum|level.?system|how levels?)|(curriculum|level).{0,20}(work|structure|system|explained?))\b/i

// Sprint 742C — Template coverage gap patterns
const TEMPLATE_COVERAGE_PATTERNS =
  /\b(levels?.{0,30}no templates?|templates?.{0,30}(missing|gaps?|coverage|which|levels?)|levels?.{0,20}(no|without|missing).{0,10}templates?|what templates?.{0,30}(build|create|need|next|fix|missing)|fix.{0,20}templates?|template.{0,20}(coverage|gaps?|priority)|which levels?.{0,20}(need|missing|no).{0,10}templates?|template.{0,20}fix first)\b/i

export function isCurriculumLevelQuestion(text: string): boolean {
  return (
    LEVEL_STRUCTURE_PATTERNS.test(text) ||
    EXPLAIN_LEVEL_PATTERNS.test(text) ||
    CONTENT_SUMMARY_PATTERNS.test(text) ||
    CONTENT_EXPLAIN_PATTERNS.test(text) ||
    GAP_PATTERNS.test(text) ||
    HOW_CURRICULUM_PATTERNS.test(text) ||
    TEMPLATE_COVERAGE_PATTERNS.test(text)
  )
}

// -- Static curriculum knowledge ----------------------------------------------
// Standard AcademyOS level structure. Academies may customize level names
// in curriculum setup; this represents the standard progression framework.

const CURRICULUM_STAGES = `
**Stage 1 — Red (ages 5-10, mini court)**
Red 1 · Red 2 · Red 3
Focus: Bat-and-ball fundamentals, movement exploration, hand-eye coordination, fun-based learning with mini equipment.

**Stage 2 — Orange (ages 9-12, mid court)**
Orange 1 · Orange 2 · Orange 3
Focus: Groundstroke mechanics, footwork patterns, rally consistency, basic tactical sequences, serve introduction.

**Stage 3 — Yellow (ages 11+, full court)**
Yellow 1 · Yellow 2 · Yellow 3
Focus: Full-court mechanics, competitive rally patterns, match tactics, tournament preparation, mental performance.

**Stage 4 — High Performance (ages 15+, elite)**
HP 1 · HP 2 · HP 3
Focus: Advanced tactical patterns, periodized physical preparation, tournament consistency, professional-level mental skills.
`.trim()

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  red1: 'Red 1 is the entry point for young players aged 5-8. The focus is on bat-and-ball contact, athletic movement, and building a love of tennis through games and mini-court play. Gates at this level check basic coordination and ball-tracking ability. No tactical concepts yet -- pure movement and contact development.',
  red2: 'Red 2 builds on first contact skills. Players begin to develop a forehand and backhand with correct grip awareness, basic rally patterns, and simple court positioning. Gates check consistent ball contact and movement patterns. Sessions are still heavily game-based.',
  red3: 'Red 3 completes the foundation stage. Players can sustain a 4-6 ball rally, understand basic scoring, and are beginning to develop serve mechanics. Assessment at this level determines readiness for orange ball play.',
  orange1: 'Orange 1 is the first full development stage. Players move to a mid-court with orange felt balls. Groundstroke mechanics are the priority -- contact point, swing path, and recovery steps. Gates focus on rally consistency and footwork quality.',
  orange2: 'Orange 2 is the core development level for most junior programs. Players work on rally depth, basic cross-court and down-the-line patterns, serve mechanics, and competitive point play. This is where most coaches focus curriculum building.',
  orange3: 'Orange 3 prepares players for full-court yellow ball play. Tournament introduction is common here. Gates include consistent serve, 10-ball rally, and basic tactical pattern execution under game conditions.',
  yellow1: 'Yellow 1 is the transition to full-court, full-speed tennis. Players develop depth and direction on groundstrokes, serve-and-return patterns, and approach shot basics. Mental performance and competitive mindset work begin at this stage.',
  yellow2: 'Yellow 2 is a high-development performance level. Pattern play, second-ball attack, volley mechanics, and match-specific drills are the focus. Tournament performance and data from competition start to inform curriculum decisions.',
  yellow3: 'Yellow 3 is the final performance stage before elite. Players are tournament-active and work on tactical depth, serve variety, net game, and competitive mental skills. Assessments are performance-based and competition-data informed.',
  hp1: 'High Performance 1 is the pre-elite entry. Physical periodization, advanced patterns, and tactical game plan development are introduced. Players typically compete at national level or higher. Curriculum is heavily individualized.',
  hp2: 'High Performance 2 is elite development. Detailed technical refinement, tactical opposition analysis, and performance tracking are standard. Academy curriculum at this level is co-designed with the player.',
  hp3: 'High Performance 3 is the professional preparation level. Curriculum here is fully individualized and competition-driven. DONNA can help track performance gaps and draft proposed adjustments for director review.',
}

// -- Content type explanations ------------------------------------------------

const CONTENT_TYPE_EXPLANATIONS = `
**Gates** are the pass/fail checkpoints players must meet to advance to the next level. Example: "Can rally 8 consecutive balls cross-court." Gates are assessed by coaches and require director sign-off for level movement.

**Skills** are the technical and tactical competencies a player is expected to develop at each level. Example: "Forehand with correct grip and swing path." Skills define what players are building toward.

**Drills** are the practice exercises coaches run to develop skills. Example: "Cross-court baseline rally with recovery steps." Drills are attached to skills and can be sequenced into session templates.

**Assessments** are formal evaluation moments used to confirm placement and level movement readiness. They combine gate evidence, skill observation, and coach notes.

**Missions** are short-term achievement challenges that keep players engaged. Example: "Complete 3 rally sessions with 10+ ball consistency." Missions are visible to players and create progression momentum.

**Badges** are recognition awarded when a player completes a milestone or skill cluster. They are the visible achievement layer that players and parents can see.
`.trim()

// -- Level key normalizer -----------------------------------------------------

function normalizeLevelKey(text: string): string | null {
  const t = text.toLowerCase()
  if (/red.?1|r1/.test(t)) return 'red1'
  if (/red.?2|r2/.test(t)) return 'red2'
  if (/red.?3|r3/.test(t)) return 'red3'
  if (/orange.?1|o1/.test(t)) return 'orange1'
  if (/orange.?2|o2/.test(t)) return 'orange2'
  if (/orange.?3|o3/.test(t)) return 'orange3'
  if (/yellow.?1|y1/.test(t)) return 'yellow1'
  if (/yellow.?2|y2/.test(t)) return 'yellow2'
  if (/yellow.?3|y3/.test(t)) return 'yellow3'
  if (/hp.?1|high.?perf.?1|performance.?1/.test(t)) return 'hp1'
  if (/hp.?2|high.?perf.?2|performance.?2/.test(t)) return 'hp2'
  if (/hp.?3|high.?perf.?3|performance.?3/.test(t)) return 'hp3'
  if (/\bred\b/.test(t)) return 'red2'  // generic "red" → mid-point
  if (/\borange\b/.test(t)) return 'orange2'
  if (/\byellow\b/.test(t)) return 'yellow2'
  if (/\bhigh.?perf/.test(t) || /\bhp\b/.test(t)) return 'hp1'
  return null
}

// -- Answer builders ----------------------------------------------------------

function buildLevelStructureAnswer(): DonnaSafeReadAnswer {
  return {
    actionId: 'curriculum_level_structure',
    text: [
      'AcademyOS uses a 4-stage, 12-level curriculum progression:',
      '',
      CURRICULUM_STAGES,
      '',
      'Each level has gates (advancement checkpoints), skills (technical targets), drills (practice exercises), assessments, missions (player challenges), and badges (achievement markers). To see or edit your specific curriculum, go to the Curriculum page.',
    ].join('\n'),
    confidence: 'high',
    sourceNote: 'Standard AcademyOS curriculum structure',
    followUp: 'Take me to Curriculum',
    href: '/director/curriculum',
    isAnswerable: true,
  }
}

function buildLevelExplanationAnswer(levelKey: string): DonnaSafeReadAnswer {
  const description = LEVEL_DESCRIPTIONS[levelKey]
  if (!description) {
    return {
      actionId: 'curriculum_level_explain_fallback',
      text: 'I can explain any specific level -- Red 1 through HP 3. Just say the level name (e.g., "Explain Orange 2" or "What is Yellow 1?") and I\'ll give you a full breakdown.',
      confidence: 'high',
      sourceNote: 'Standard AcademyOS level knowledge',
      followUp: 'Show me the curriculum',
      href: '/director/curriculum',
      isAnswerable: true,
    }
  }

  return {
    actionId: `curriculum_level_explain_${levelKey}`,
    text: description,
    confidence: 'high',
    sourceNote: 'Standard AcademyOS level knowledge',
    followUp: 'Show me the curriculum builder',
    href: '/director/curriculum/builder',
    isAnswerable: true,
  }
}

function buildContentTypeSummaryAnswer(): DonnaSafeReadAnswer {
  return {
    actionId: 'curriculum_content_types',
    text: CONTENT_TYPE_EXPLANATIONS,
    confidence: 'high',
    sourceNote: 'AcademyOS curriculum content type definitions',
    followUp: 'Take me to Curriculum Builder',
    href: '/director/curriculum/builder',
    isAnswerable: true,
  }
}

function buildGapAnalysisAnswer(ctx: DirectorDonnaContext | null): DonnaSafeReadAnswer {
  const gaps = ctx?.curriculumGaps ?? []

  if (gaps.length > 0) {
    const gapLines = gaps.map(g => `• ${g}`).join('\n')
    return {
      actionId: 'curriculum_gaps_live',
      text: [
        `I can see ${gaps.length} curriculum gap${gaps.length !== 1 ? 's' : ''} that need attention:`,
        '',
        gapLines,
        '',
        'These represent content areas where players may be stalling or where curriculum coverage is incomplete. Want me to take you to Curriculum to review and draft changes?',
      ].join('\n'),
      confidence: ctx?.isLive ? 'high' : 'partial',
      sourceNote: ctx?.isLive ? 'Live curriculum gap data' : 'Demo data',
      followUp: 'Take me to Curriculum',
      href: '/director/curriculum',
      isAnswerable: true,
    }
  }

  // No gap data available
  if (ctx?.isFirstTimeSetup) {
    return {
      actionId: 'curriculum_gaps_not_setup',
      text: 'Curriculum gap analysis requires your curriculum to be set up first. Once you\'ve defined your levels, gates, and skills, DONNA can identify missing coverage, assessment gaps, and areas where players are stalling. Want me to take you to Curriculum Setup?',
      confidence: 'insufficient',
      sourceNote: 'Curriculum not yet configured',
      followUp: 'Take me to Curriculum Setup',
      href: '/director/onboarding/curriculum',
      isAnswerable: true,
    }
  }

  return {
    actionId: 'curriculum_gaps_no_data',
    text: 'Curriculum gap analysis requires active curriculum data -- levels, gates, and skill coverage. I\'m not seeing gap signals in context right now. The Curriculum page has a built-in gap analysis tool that scans your level structure for missing domains, empty levels, and assessment gaps. Want me to take you there?',
    confidence: 'partial',
    sourceNote: 'Curriculum gap data not available in current context',
    followUp: 'Take me to Curriculum',
    href: '/director/curriculum',
    isAnswerable: true,
  }
}

// Sprint 742C — Template coverage gap answer builder
function buildTemplateCoverageGapAnswer(ctx: DirectorDonnaContext | null): DonnaSafeReadAnswer {
  // No context at all
  if (!ctx) {
    return {
      actionId: 'template_coverage_no_context',
      text: 'I need live data to check template coverage. Make sure your academy is set up and DONNA is connected.',
      confidence: 'insufficient',
      sourceNote: 'No context available',
      followUp: 'Take me to Templates',
      href: '/director/templates',
      isAnswerable: false,
    }
  }

  // Coverage analysis not yet available (context not loaded)
  if (!ctx.templateCoverageContextAvailable) {
    const missingPieces: string[] = []
    if (!ctx.playerProgressContextAvailable) missingPieces.push('player curriculum states')
    if (!ctx.templateContextAvailable) missingPieces.push('template data')

    return {
      actionId: 'template_coverage_unavailable',
      text: missingPieces.length > 0
        ? `Template coverage analysis requires ${missingPieces.join(' and ')} to be available. I\'m not seeing that data yet. Go to Templates to review what\'s built.`
        : 'Template coverage analysis is not yet available. Go to Templates to review what\'s built.',
      confidence: 'insufficient',
      sourceNote: 'Coverage context not loaded',
      followUp: 'Take me to Templates',
      href: '/director/templates',
      isAnswerable: true,
    }
  }

  const gaps = ctx.curriculumTemplateCoverageGaps
  const summary = summarizeCoverageGaps({
    gaps,
    levelsWithPlayers: ctx.playerCurriculumStateCount > 0 ? 1 : 0, // approximate
    levelsWithTemplates: ctx.templateCount,
    unassignedTemplateCount: ctx.templateSummaries.filter(t => !t.curriculumLevelId).length,
    coverageAvailable: ctx.templateCoverageContextAvailable,
  })

  if (gaps.length === 0) {
    return {
      actionId: 'template_coverage_no_gaps',
      text: summary,
      confidence: 'high',
      sourceNote: 'Live template coverage data',
      followUp: 'View all templates',
      href: '/director/templates',
      isAnswerable: true,
    }
  }

  // Gaps found — build prioritised answer
  const topGap = gaps[0]
  const nextAction = `Start with ${topGap.levelDisplayName} — that\'s the highest-priority level (${topGap.playerCountAtLevel} player${topGap.playerCountAtLevel !== 1 ? 's' : ''}, no template). ${topGap.recommendedAction}`

  return {
    actionId: 'template_coverage_gaps_live',
    text: [
      summary,
      '',
      `**Next recommended action:**`,
      nextAction,
    ].join('\n'),
    confidence: 'high',
    sourceNote: 'Live player curriculum states + active templates',
    followUp: 'Take me to Templates',
    href: '/director/templates',
    isAnswerable: true,
  }
}

function buildHowCurriculumWorksAnswer(): DonnaSafeReadAnswer {
  return {
    actionId: 'curriculum_how_it_works',
    text: [
      'The AcademyOS curriculum is built around a level progression framework:',
      '',
      '**How it works:**',
      '• Players are placed into a level based on assessment results',
      '• Each level has gates -- checkpoints they must meet to advance',
      '• Coaches deliver drills that build the skills tied to those gates',
      '• When gate evidence is strong, a level movement proposal goes to you for director review',
      '• You approve, and the system updates the player\'s level',
      '',
      '**What DONNA can help you build:**',
      '• Explain any level in detail (just ask "What is Orange 2?")',
      '• Identify curriculum gaps in coverage',
      '• Draft curriculum changes as proposed edits for your review',
      '• Build class templates matched to curriculum levels',
      '',
      'Nothing in the curriculum changes until you approve it. All edits go through the Review Center.',
    ].join('\n'),
    confidence: 'high',
    sourceNote: 'AcademyOS curriculum architecture',
    followUp: 'Take me to Curriculum',
    href: '/director/curriculum',
    isAnswerable: true,
  }
}

// -- Main entry point ---------------------------------------------------------
// Called from DonnaVoiceReadyShell dispatch chain (Sprint 737).
// Returns null if the text is not a curriculum-level question.

export function tryAnswerCurriculumLevelQuestion(
  text: string,
  ctx: DirectorDonnaContext | null,
): DonnaSafeReadAnswer | null {
  if (!isCurriculumLevelQuestion(text)) return null

  // Template coverage gap questions — checked first among gap-type questions
  // so "which levels have no templates" does not fall through to the general GAP_PATTERNS path.
  if (TEMPLATE_COVERAGE_PATTERNS.test(text)) {
    return buildTemplateCoverageGapAnswer(ctx)
  }

  // Curriculum content gap analysis (missing gates / drills per level)
  if (GAP_PATTERNS.test(text)) {
    return buildGapAnalysisAnswer(ctx)
  }

  // How the curriculum works
  if (HOW_CURRICULUM_PATTERNS.test(text)) {
    return buildHowCurriculumWorksAnswer()
  }

  // Explain a specific level
  if (EXPLAIN_LEVEL_PATTERNS.test(text)) {
    const levelKey = normalizeLevelKey(text)
    return buildLevelExplanationAnswer(levelKey ?? '')
  }

  // Content type summary (what are skills, drills, gates, etc.)
  if (CONTENT_EXPLAIN_PATTERNS.test(text)) {
    return buildContentTypeSummaryAnswer()
  }

  // Content types in a specific level
  if (CONTENT_SUMMARY_PATTERNS.test(text)) {
    return buildContentTypeSummaryAnswer()
  }

  // Level structure overview
  if (LEVEL_STRUCTURE_PATTERNS.test(text)) {
    return buildLevelStructureAnswer()
  }

  // Fallback for anything else that matched isCurriculumLevelQuestion
  return buildLevelStructureAnswer()
}
