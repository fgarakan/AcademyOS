// Sprint 728 -- DONNA Short Phrase Natural Language Engine V1
// Detects short/vague user input ("help", "confused", "what can you do")
// and produces a helpful direction response instead of the generic fallback.
// Role-aware. No DB. No mutations.

import type { DonnaRole } from '@/lib/donna/donnaRoleBoundaries'

// -- Category -----------------------------------------------------------------

export type ShortPhraseCategory = 'help' | 'confused' | 'capabilities' | 'what_now'

// -- Detection patterns -------------------------------------------------------
// Use only ASCII apostrophes inside regex literals.

const HELP_PATTERN = /^(help|help me|help please|i need help|please help|assist me|assistance)\.?$/i

const CONFUSED_PATTERN = /^(confused|not sure|unsure|i'?m confused|i am confused|i'?m not sure|i am not sure|lost|no idea|clueless|don'?t know what to do|don'?t know where to start|where do i start|where to start)\.?$/i

const CAPABILITIES_PATTERN = /^(what can you do|what do you do|what are you|who are you|what are your capabilities|what can you help with|what do you know|what do you handle|your capabilities|your features|show me what you can do|what is donna|what are you capable of)\.?[?]?$/i

const WHAT_NOW_PATTERN = /^(what now|what next|now what|what should i do|what should i do now|what should i do next|what should i do first|what do i do|what do i do now|what do i do next|what do i do first|where do i go|what is next|what'?s next|next step|next steps|i don'?t know what to do next|what to do|where do i go from here)\.?[?]?$/i

// -- Main detector ------------------------------------------------------------

export function detectShortPhrase(text: string): ShortPhraseCategory | null {
  const t = text.trim()
  if (!t) return null

  // Only fire on short inputs (<= 8 words) to avoid false positives on longer queries
  const wordCount = t.split(/\s+/).length
  if (wordCount > 8) return null

  if (HELP_PATTERN.test(t)) return 'help'
  if (CONFUSED_PATTERN.test(t)) return 'confused'
  if (CAPABILITIES_PATTERN.test(t)) return 'capabilities'
  if (WHAT_NOW_PATTERN.test(t)) return 'what_now'

  return null
}

// -- Answer shape -------------------------------------------------------------

export interface ShortPhraseAnswer {
  text: string
  confidence: 'high'
  sourceNote: string | null
  followUp: string | null
}

// -- Answer builder -----------------------------------------------------------

export function buildShortPhraseAnswer(
  category: ShortPhraseCategory,
  role: DonnaRole,
): ShortPhraseAnswer {
  if (role === 'director') {
    return buildDirectorAnswer(category)
  }
  return buildCoachAnswer(category)
}

// -- Director answers ---------------------------------------------------------

function buildDirectorAnswer(category: ShortPhraseCategory): ShortPhraseAnswer {
  switch (category) {
    case 'help':
      return {
        text: `Happy to help. Here are the most useful things to ask me right now:\n\n` +
          `- **"What needs my attention?"** -- pending reviews and urgent items\n` +
          `- **"What's happening today?"** -- today's sessions and activity\n` +
          `- **"Which players need attention?"** -- at-risk and flagged players\n` +
          `- **"What are the current risks?"** -- academy health signals\n\n` +
          `You can also ask about onboarding, curriculum, templates, or wrap-up status. What would you like to start with?`,
        confidence: 'high',
        sourceNote: 'DONNA help menu -- Director',
        followUp: `What needs my attention?`,
      }

    case 'confused':
      return {
        text: `No worries -- I'm DONNA, your AcademyOS COO assistant. I help you run the academy day-to-day: ` +
          `reviewing pending coach submissions, tracking sessions, spotting players who need attention, ` +
          `and guiding you through setup.\n\n` +
          `What's causing the confusion? You can ask me about a specific area -- onboarding, players, sessions, ` +
          `reviews -- or just say "What needs my attention?" and I'll give you a clear starting point.`,
        confidence: 'high',
        sourceNote: 'DONNA orientation -- Director',
        followUp: `What needs my attention?`,
      }

    case 'capabilities':
      return {
        text: `Here's what I can help you with as director:\n\n` +
          `- **Pending reviews** -- see which coach wrap-ups need your approval\n` +
          `- **Today's activity** -- sessions running, attendance status\n` +
          `- **Player attention** -- flagged players, health signals, at-risk indicators\n` +
          `- **Academy health** -- overall risk score and operational gaps\n` +
          `- **Setup guidance** -- onboarding, adding coaches, adding players, curriculum\n` +
          `- **System explanation** -- how any part of AcademyOS works\n\n` +
          `I cannot make changes directly -- all actions go through the review queue so you stay in control. ` +
          `What would you like to explore?`,
        confidence: 'high',
        sourceNote: 'DONNA capabilities -- Director',
        followUp: `What's happening today?`,
      }

    case 'what_now':
      return {
        text: `Good question -- here's how I'd prioritize your next move:\n\n` +
          `1. **Check pending reviews** -- are any coach wrap-ups waiting for your approval?\n` +
          `2. **Look at player attention signals** -- any flagged or at-risk players?\n` +
          `3. **Verify today's sessions** -- are coaches set up for their sessions?\n\n` +
          `If you're just getting started, I'd recommend asking "What needs my attention?" -- ` +
          `that gives you the most actionable summary. Want me to pull that up?`,
        confidence: 'high',
        sourceNote: 'DONNA next-step guidance -- Director',
        followUp: `What needs my attention?`,
      }
  }
}

// -- Coach answers ------------------------------------------------------------

function buildCoachAnswer(category: ShortPhraseCategory): ShortPhraseAnswer {
  switch (category) {
    case 'help':
      return {
        text: `Happy to help. Here's what you can ask me right now:\n\n` +
          `- **"What sessions do I have today?"** -- your schedule\n` +
          `- **"Who is present for my session?"** -- attendance tracking\n` +
          `- **"I want to capture a player note"** -- quick note logging\n` +
          `- **"Do I still need to submit a wrap-up?"** -- wrap-up status\n\n` +
          `What do you need?`,
        confidence: 'high',
        sourceNote: 'DONNA help menu -- Coach',
        followUp: `What sessions do I have today?`,
      }

    case 'confused':
      return {
        text: `No worries -- I'm DONNA, your AcademyOS session assistant. I help you manage your coaching day: ` +
          `your session schedule, attendance, player notes, and wrap-up submissions.\n\n` +
          `What are you trying to do? You can tell me in plain language and I'll help you get there.`,
        confidence: 'high',
        sourceNote: 'DONNA orientation -- Coach',
        followUp: `What sessions do I have today?`,
      }

    case 'capabilities':
      return {
        text: `Here's what I can help you with as a coach:\n\n` +
          `- **Session schedule** -- what's on your plate today\n` +
          `- **Attendance** -- mark who's present for your session\n` +
          `- **Player notes** -- capture observations during or after sessions\n` +
          `- **Wrap-ups** -- check and submit your session wrap-ups\n` +
          `- **Director queue** -- see what's waiting for director approval\n\n` +
          `What would you like to start with?`,
        confidence: 'high',
        sourceNote: 'DONNA capabilities -- Coach',
        followUp: `What sessions do I have today?`,
      }

    case 'what_now':
      return {
        text: `Here's the typical coaching flow:\n\n` +
          `1. **Check your sessions** for today\n` +
          `2. **Mark attendance** when your group arrives\n` +
          `3. **Capture player notes** during or after practice\n` +
          `4. **Submit your wrap-up** before you leave\n\n` +
          `Want me to start with your session schedule?`,
        confidence: 'high',
        sourceNote: 'DONNA next-step guidance -- Coach',
        followUp: `What sessions do I have today?`,
      }
  }
}
