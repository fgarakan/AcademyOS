// Sprint 949 — Parent-Safe DONNA Guidance V1
// Defines the parent-safe DONNA context and guidance builder.
// Connected to unified DONNA personality (donnaPersonality.ts).
// Pure TypeScript — no DB calls, no React, no API calls, no mutations.
//
// Safety invariants:
//   - No raw coach notes in any output
//   - No rankings or peer comparisons
//   - No sensitive assessment scores
//   - No automatic communications
//   - All content is coach-approved summaries only

import { DONNA_PERSONALITY } from './donnaPersonality'

// ── Parent context ────────────────────────────────────────────────────────────

export interface ParentSafeDonnaContext {
  /** Child's first name (never full name + surname in display) */
  childFirstName: string | null
  /** Current curriculum level display name */
  currentLevelName: string | null
  /** Next curriculum level (for advancement context) */
  nextLevelName: string | null
  /** Active focus category (technical/tactical/fitness/competition/mental) */
  focusCategory: string | null
  /** Coach-approved "doing well" summary (pre-sanitized) */
  doingWell: string | null
  /** Active mission title (from player_priorities) */
  missionTitle: string | null
}

// ── Guidance categories ───────────────────────────────────────────────────────

export type ParentGuidanceCategory =
  | 'current_focus'       // What the child is working on right now
  | 'why_it_matters'      // Why this development area matters
  | 'support_at_home'     // What the parent can do
  | 'after_practice'      // What to say after practice
  | 'when_worried'        // How to handle concern without creating pressure
  | 'when_to_contact'     // When to reach out to the coach
  | 'progress_context'    // How to understand development pace

export interface ParentGuidanceResponse {
  category: ParentGuidanceCategory
  text: string
  sourceNote: string
  safetyNote: string
}

// ── Category labels ───────────────────────────────────────────────────────────

const FOCUS_LABELS: Record<string, string> = {
  technical:   'Technical skill development',
  tactical:    'Tactical pattern recognition',
  fitness:     'Fitness and movement',
  competition: 'Competition preparation',
  behavioral:  'Behavioral and attitude',
  mental:      'Mental performance',
}

const SUPPORT_AT_HOME: Record<string, string> = {
  technical:   'Short shadow-swing sessions or wall rallies — 10 minutes of quality beats 45 minutes on autopilot.',
  tactical:    'Ask them to explain one tactic they worked on this week. Teaching it reinforces the learning.',
  fitness:     'Support a regular sleep schedule and hydration habits. Most fitness progress happens away from the court.',
  competition: 'Keep the home environment calm before and after match days. Avoid debriefs immediately after a loss.',
  behavioral:  'Praise the process: "I noticed you stayed composed in that situation." Effort and attitude, not just results.',
  mental:      'Give space after tough sessions. Let them decompress before asking questions.',
}

const AFTER_PRACTICE_QUESTIONS: Record<string, string> = {
  technical:   "What are you working on with your strokes right now?",
  tactical:    "Did anything click for you in today's practice?",
  fitness:     "How does your body feel after today?",
  competition: "Is there a match situation you want to handle better?",
  behavioral:  "What's one thing you did well that had nothing to do with technique?",
  mental:      "What was going through your mind during the toughest moment today?",
}

const DEFAULT_SUPPORT = 'The best support is calm, consistent encouragement and letting the coaching team lead the technical work.'
const DEFAULT_AFTER_PRACTICE = 'The most powerful thing you can say after practice is simply: "I love watching you play."'

// ── Guidance builder ──────────────────────────────────────────────────────────

export function buildParentGuidance(
  category: ParentGuidanceCategory,
  ctx: ParentSafeDonnaContext,
): ParentGuidanceResponse {
  const name = ctx.childFirstName ?? 'your child'
  const focusLabel = ctx.focusCategory ? (FOCUS_LABELS[ctx.focusCategory] ?? ctx.focusCategory) : 'their current focus area'
  const supportTip = ctx.focusCategory ? (SUPPORT_AT_HOME[ctx.focusCategory] ?? DEFAULT_SUPPORT) : DEFAULT_SUPPORT
  const afterPractice = ctx.focusCategory ? (AFTER_PRACTICE_QUESTIONS[ctx.focusCategory] ?? DEFAULT_AFTER_PRACTICE) : DEFAULT_AFTER_PRACTICE
  const safetyNote = DONNA_PERSONALITY.parentSafeLanguage.noRawNotes

  switch (category) {
    case 'current_focus':
      return {
        category,
        text: ctx.currentLevelName
          ? `${name} is currently working at the **${ctx.currentLevelName}** level, focused on ${focusLabel}. ${ctx.doingWell ? `Your coaching team has noted strength in: ${ctx.doingWell}.` : ''} Development takes time — the most important indicator is consistent attendance and positive engagement.`
          : `${name}'s development is being tracked by the coaching team. Check the Progress tab for their current level and advancement journey.`,
        sourceNote: 'Current level + coach-approved priority category',
        safetyNote,
      }

    case 'why_it_matters':
      return {
        category,
        text: ctx.focusCategory
          ? `**${focusLabel}** is a foundational pillar of tennis development at ${name}'s current stage. Building this now creates the platform for more advanced skills later. It is not about perfection — it is about building reliable habits under pressure.`
          : `Every focus area in the academy curriculum is selected by the coaching team based on ${name}'s current development needs and the overall progression path.`,
        sourceNote: 'Curriculum stage context',
        safetyNote,
      }

    case 'support_at_home':
      return {
        category,
        text: `For ${name}'s focus on ${focusLabel}: **${supportTip}** Avoid technical coaching at home — that is the coaching team's job. Your role is calm, consistent support.`,
        sourceNote: 'Home support guidance for focus category',
        safetyNote,
      }

    case 'after_practice':
      return {
        category,
        text: `The most powerful thing you can say after practice is: **"I love watching you play."** If you want to start a conversation, try: **"${afterPractice}"** — then listen without advising.`,
        sourceNote: 'Post-practice communication guidance',
        safetyNote,
      }

    case 'when_worried':
      return {
        category,
        text: `Most development happens in invisible ways — a player can look like they are plateauing and then jump forward in a few weeks. If you have a specific concern, the best first step is a conversation with the coaching team. ${DONNA_PERSONALITY.parentSafeLanguage.noRawNotes}`,
        sourceNote: 'Parental concern guidance',
        safetyNote,
      }

    case 'when_to_contact':
      return {
        category,
        text: DONNA_PERSONALITY.parentSafeLanguage.whenToContact +
          ` For ${name}: reach out when something at home might be affecting their focus (injury, big life event), or when they have expressed something specific they are struggling with that they want help communicating.`,
        sourceNote: 'Coach contact guidance',
        safetyNote,
      }

    case 'progress_context':
      return {
        category,
        text: ctx.nextLevelName
          ? `${name} is on the path toward **${ctx.nextLevelName}**. Advancement is earned through consistent work — it is never automatic and always requires coaching team confirmation. The most valuable thing you can do is support their enjoyment of the process.`
          : `${name}'s progress is being reviewed by the coaching team. Advancement decisions take into account many factors — not just technique, but also attitude, consistency, and readiness.`,
        sourceNote: 'Development trajectory context',
        safetyNote,
      }

    default: {
      const exhaustive: never = category
      return {
        category: exhaustive,
        text: DONNA_PERSONALITY.parentSafeLanguage.progressSummary,
        sourceNote: 'General parent guidance',
        safetyNote,
      }
    }
  }
}

// ── All guidance for a parent ────────────────────────────────────────────────

export function buildAllParentGuidance(ctx: ParentSafeDonnaContext): ParentGuidanceResponse[] {
  const categories: ParentGuidanceCategory[] = [
    'current_focus',
    'support_at_home',
    'after_practice',
    'when_worried',
    'when_to_contact',
    'progress_context',
  ]
  return categories.map(cat => buildParentGuidance(cat, ctx))
}
