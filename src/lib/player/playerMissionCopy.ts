// Player Mission Copy — Sprint 126
// Pure static helper. No DB calls. No AI. No side effects.
// Generates player-safe mission language based on domain and level stage.
// All language is motivating, mission-based, and avoids grade/fail framing.

export interface PlayerMissionCopy {
  whyItMatters: string
  tryThisNext: string
  coachIsWatchingFor: string
}

interface MissionCopyInput {
  domain?: string | null
  levelStage?: string | null
  currentLevel?: string | null
}

type DomainKey = 'Technical' | 'Tactical' | 'Movement' | 'Mentality' | 'Competition' | 'Fitness' | 'Recovery' | 'Lifestyle' | 'default'

const DOMAIN_COPY: Record<DomainKey, PlayerMissionCopy> = {
  Technical: {
    whyItMatters:
      'Solid technique is the foundation everything else is built on. The way you hit the ball now shapes how you play for years.',
    tryThisNext:
      'Focus on your preparation — get your racket back early before every shot.',
    coachIsWatchingFor:
      'Consistent preparation and clean contact, especially under pressure.',
  },
  Tactical: {
    whyItMatters:
      'Tennis is a thinking sport. The player who makes better decisions wins more — not just the one who hits harder.',
    tryThisNext:
      'Pick one target before each rally starts. Aim crosscourt with control.',
    coachIsWatchingFor:
      'Decision quality — choosing the right shot for the situation, not just the flashy one.',
  },
  Movement: {
    whyItMatters:
      'Great movement gets you to the ball early — and early means in control.',
    tryThisNext:
      'After every shot, reset your position. Think "recover first, then ready."',
    coachIsWatchingFor:
      'Recovery speed and split step timing — getting back into position before the next ball arrives.',
  },
  Mentality: {
    whyItMatters:
      'How you handle pressure is a skill you can train — just like a backhand or a serve.',
    tryThisNext:
      'When a point goes wrong, take one breath and reset. Focus only on the next ball.',
    coachIsWatchingFor:
      'Staying composed between points and resetting after mistakes.',
  },
  Competition: {
    whyItMatters:
      'Competing well is a skill. The more you compete, the better you handle big moments.',
    tryThisNext:
      'Focus on your game, not your opponent. Play your patterns and stay in the moment.',
    coachIsWatchingFor:
      'Competing hard in every point, sportsmanship, and how you respond to adversity.',
  },
  Fitness: {
    whyItMatters:
      'A fitter player can run longer, concentrate longer, and play better tennis later in a match.',
    tryThisNext:
      'Push your effort level in conditioning drills — even when it feels uncomfortable.',
    coachIsWatchingFor:
      'Effort and consistency in fitness work, and recovery habits between sessions.',
  },
  Recovery: {
    whyItMatters:
      'Your body builds strength during rest — not during training. Recovery is part of the program.',
    tryThisNext:
      'Prioritise sleep this week. 8–10 hours makes your training sessions better.',
    coachIsWatchingFor:
      'How your energy levels are during practice — and whether you communicate when something feels off.',
  },
  Lifestyle: {
    whyItMatters:
      'The best players in the world take care of their bodies, minds, and schedules. Habits built now last a lifetime.',
    tryThisNext:
      'Show up on time, bring water, and be ready to work. Consistency in the small things matters.',
    coachIsWatchingFor:
      'Professionalism — how you arrive, how you engage, and how you treat your training environment.',
  },
  default: {
    whyItMatters:
      'Every session you show up is a session you grow. The work you put in now pays off later.',
    tryThisNext:
      'Stay focused on what your coach is asking. Do it well, do it again, and it becomes yours.',
    coachIsWatchingFor:
      'Effort, focus, and the willingness to try even when it is difficult.',
  },
}

const STAGE_TRY_NEXT: Record<string, string> = {
  beginner: 'Keep it simple — do one thing well each session instead of trying everything at once.',
  intermediate: 'Push your consistency — make five of the same shot before moving to variations.',
  advanced: 'Add pressure to your practice — do the drill when it is uncomfortable, not just when it is easy.',
}

export function buildPlayerMissionCopy(input: MissionCopyInput): PlayerMissionCopy {
  const { domain, levelStage } = input

  const domainKey = (domain as DomainKey) ?? 'default'
  const copy = DOMAIN_COPY[domainKey] ?? DOMAIN_COPY.default

  const stageBoost = levelStage ? (STAGE_TRY_NEXT[levelStage] ?? null) : null

  const tryThisNext = stageBoost
    ? `${copy.tryThisNext} ${stageBoost}`
    : copy.tryThisNext

  return {
    whyItMatters: copy.whyItMatters,
    tryThisNext,
    coachIsWatchingFor: copy.coachIsWatchingFor,
  }
}
