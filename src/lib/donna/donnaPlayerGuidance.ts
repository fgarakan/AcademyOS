// Sprint 950 — Player Mission DONNA Guidance V1
// Mission-focused, encouraging DONNA guidance for players.
// Connected to unified DONNA personality (donnaPersonality.ts).
// Pure TypeScript — no DB calls, no React, no API calls, no mutations.
//
// Safety invariants:
//   - No sensitive director assessments
//   - No coach concerns or frustrations
//   - No rankings or pressure-inducing comparisons
//   - Mission-based framing only
//   - Encouraging and simple language

import { DONNA_PERSONALITY } from './donnaPersonality'

// ── Player context ────────────────────────────────────────────────────────────

export interface PlayerSafeDonnaContext {
  /** Player's first name */
  playerFirstName: string | null
  /** Current curriculum level display name */
  currentLevelName: string | null
  /** Next level (for advancement framing) */
  nextLevelName: string | null
  /** Active mission title */
  missionTitle: string | null
  /** Active mission category */
  missionCategory: string | null
}

// ── Guidance categories ───────────────────────────────────────────────────────

export type PlayerGuidanceCategory =
  | 'current_mission'      // What is the player currently working toward
  | 'practice_today'       // What to practice at home today
  | 'how_to_level_up'      // How to advance to the next level
  | 'how_am_i_doing'       // Honest answer about progress without pressure
  | 'feel_stuck'           // What to do when feeling stuck
  | 'before_match'         // Pre-match preparation
  | 'after_loss'           // After a tough loss
  | 'stay_focused'         // How to stay focused in practice

export interface PlayerGuidanceResponse {
  category: PlayerGuidanceCategory
  text: string
  sourceNote: string
  tone: 'encouraging' | 'calm' | 'practical'
}

// ── Practice tips by category ─────────────────────────────────────────────────

const PRACTICE_TIPS: Record<string, string> = {
  technical:   'shadow swings, wall rallies, and slow deliberate reps',
  tactical:    'mental rehearsal, pattern visualization, and reviewing your last match',
  fitness:     'dynamic warm-up, court movement drills, and core stability work',
  competition: 'pre-match routines, breathing exercises, and mental rehearsal',
  behavioral:  'your between-point reset routine, journaling, and setting one session goal',
  mental:      'box breathing, focus exercises, and positive self-talk practice',
}

const DEFAULT_PRACTICE = 'consistent repetition and focused practice'

// ── Guidance builder ──────────────────────────────────────────────────────────

export function buildPlayerGuidance(
  category: PlayerGuidanceCategory,
  ctx: PlayerSafeDonnaContext,
): PlayerGuidanceResponse {
  const name = ctx.playerFirstName ?? 'you'
  const practiceTip = ctx.missionCategory ? (PRACTICE_TIPS[ctx.missionCategory] ?? DEFAULT_PRACTICE) : DEFAULT_PRACTICE

  switch (category) {
    case 'current_mission':
      return {
        category,
        text: ctx.missionTitle
          ? `Your current mission is **"${ctx.missionTitle}"**. ${DONNA_PERSONALITY.playerSafeLanguage.missionFocus} Every session where you stay present and intentional is a step forward.`
          : `Ask your coach to assign you an active mission — that is the clearest signal of what matters most right now.`,
        sourceNote: 'Active mission from player priorities',
        tone: 'encouraging',
      }

    case 'practice_today':
      return {
        category,
        text: `For your current mission, great at-home practice includes **${practiceTip}**. ${DONNA_PERSONALITY.playerSafeLanguage.practiceGuidance} Check the Practice page for a full drill set.`,
        sourceNote: 'Mission-category practice guidance',
        tone: 'practical',
      }

    case 'how_to_level_up':
      return {
        category,
        text: ctx.currentLevelName
          ? `You are currently at **${ctx.currentLevelName}**. ${
              ctx.nextLevelName
                ? `To advance to ${ctx.nextLevelName}, your coach and director need to confirm you have met the advancement requirements. Check your Level Up page to see what is left.`
                : 'Check your Level Up page for your current advancement requirements.'
            } Advancement is earned through consistent work — it is never automatic.`
          : `Your director has not yet assigned your curriculum level. Check back after your next session, or ask your coach.`,
        sourceNote: 'Curriculum level state',
        tone: 'practical',
      }

    case 'how_am_i_doing':
      return {
        category,
        text: `Your coach and director track your progress through observations at practice. The best way to know how you are doing is to keep showing up, asking good questions, and staying focused during sessions. Your Missions page shows exactly what is being built right now.`,
        sourceNote: 'Progress tracking guidance',
        tone: 'encouraging',
      }

    case 'feel_stuck':
      return {
        category,
        text: DONNA_PERSONALITY.playerSafeLanguage.noShame + ` Keep doing the reps even when it does not feel like progress. Be honest with your coach at your next session about what feels hard. That is how real development happens.`,
        sourceNote: 'Plateau guidance',
        tone: 'calm',
      }

    case 'before_match':
      return {
        category,
        text: `The night before: rest, hydrate, and do not think too much about tactics. Morning of: a short dynamic warm-up, your go-to mental reset routine, and one clear intention for the match (e.g. "stay first strike"). Do not try to change anything major — play what is trained.`,
        sourceNote: 'Pre-match preparation guidance',
        tone: 'practical',
      }

    case 'after_loss':
      return {
        category,
        text: DONNA_PERSONALITY.playerSafeLanguage.afterLoss + ` After that, ask: what was one thing I controlled well, and one thing I want to do differently? Write it down. Bring it to your next session — that is when coaches can help you use it.`,
        sourceNote: 'Post-loss resilience guidance',
        tone: 'calm',
      }

    case 'stay_focused':
      return {
        category,
        text: `Focus is a skill, not a given. Try setting one specific intention at the start of each drill — not "play well" but something you can observe, like "watch the ball all the way to contact." When your mind wanders, use the between-point reset your coach has given you.`,
        sourceNote: 'Focus technique guidance',
        tone: 'practical',
      }

    default: {
      const exhaustive: never = category
      return {
        category: exhaustive,
        text: DONNA_PERSONALITY.playerSafeLanguage.missionFocus,
        sourceNote: 'General player guidance',
        tone: 'encouraging',
      }
    }
  }
}

export function buildAllPlayerGuidance(ctx: PlayerSafeDonnaContext): PlayerGuidanceResponse[] {
  const categories: PlayerGuidanceCategory[] = [
    'current_mission',
    'practice_today',
    'how_to_level_up',
    'how_am_i_doing',
    'feel_stuck',
    'before_match',
    'after_loss',
    'stay_focused',
  ]
  return categories.map(cat => buildPlayerGuidance(cat, ctx))
}
