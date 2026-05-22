// Parent Support Guide — Sprint 125
// Pure static helper. No DB calls. No AI. No side effects.
// Generates parent-safe support guidance based on domain and level stage.
// All language is empathetic and avoids technical coaching cues.

export interface ParentSupportGuide {
  whatToPraise: string
  atHomeSupportIdea: string
  practiceLanguage: string
  avoidOvercoaching: string
  whenToAskCoach: string
}

interface SupportGuideInput {
  domain?: string | null
  levelStage?: string | null
  playerFirstName: string
}

type DomainKey = 'Technical' | 'Tactical' | 'Movement' | 'Mentality' | 'Competition' | 'Fitness' | 'Recovery' | 'Lifestyle' | 'default'

const DOMAIN_GUIDES: Record<DomainKey, Omit<ParentSupportGuide, never>> = {
  Technical: {
    whatToPraise:
      'Praise preparation and effort — "I could see you getting ready early" or "You kept trying even when it was difficult."',
    atHomeSupportIdea:
      'Light ball drops or gentle toss-and-catch exercises at home build hand-eye coordination without adding load.',
    practiceLanguage:
      'After practice, ask "What felt comfortable today?" rather than "Did you make your shots?"',
    avoidOvercoaching:
      'Avoid giving mechanical cues like grip, stance, or swing details — these are your coach\'s job and conflicting messages cause confusion.',
    whenToAskCoach:
      'Ask your coach: "Is there anything specific I can reinforce at home this week?" — then follow their lead exactly.',
  },
  Tactical: {
    whatToPraise:
      'Praise decision-making and awareness — "I saw you choose a safer shot" or "You were thinking out there."',
    atHomeSupportIdea:
      'Watch a few minutes of professional tennis together and ask simple questions: "What do you think they were trying to do there?"',
    practiceLanguage:
      'Ask "What decision did you make when the ball came to you?" — focus on choices, not outcomes.',
    avoidOvercoaching:
      'Avoid telling them which shots to hit or where to aim. Tactical decisions belong on the court with their coach.',
    whenToAskCoach:
      'Ask your coach: "What tactical ideas is my child working on right now?" — it helps you support the right conversations.',
  },
  Movement: {
    whatToPraise:
      'Praise recovery and reset — "You got back to position quickly" or "You kept moving the whole time."',
    atHomeSupportIdea:
      'A simple game of tag, hopscotch, or even dancing builds coordination and agility in a fun way.',
    practiceLanguage:
      'Ask "How did your legs feel during the drills?" — movement takes physical energy and your awareness matters.',
    avoidOvercoaching:
      'Avoid coaching footwork — specific movement patterns are set by the coach and need consistent repetition.',
    whenToAskCoach:
      'Ask your coach: "Is there anything about their movement I should know for warm-up or cool-down at home?"',
  },
  Mentality: {
    whatToPraise:
      'Praise persistence and composure — "You stayed calm after that point" or "You kept going when it was hard."',
    atHomeSupportIdea:
      'Talk about athletes across any sport who bounce back well. Role models build mental frameworks.',
    practiceLanguage:
      'Ask "Was there a moment today where you had to reset your focus?" — this builds self-awareness.',
    avoidOvercoaching:
      'Avoid pressure talk around winning, rankings, or comparison. Mentality grows in safe, low-pressure environments.',
    whenToAskCoach:
      'Ask your coach: "Are there any mental skills I can reinforce through how I talk about tennis at home?"',
  },
  Competition: {
    whatToPraise:
      'Praise effort and sportsmanship — "You competed hard" or "The way you handled that moment was great."',
    atHomeSupportIdea:
      'Review a match result together only to celebrate the positives. Leave the analysis to the coaching team.',
    practiceLanguage:
      'After matches, lead with "How did you feel out there?" before anything about the score.',
    avoidOvercoaching:
      'Avoid detailed match analysis at home — conflicting coaching messages during competition development are harmful.',
    whenToAskCoach:
      'Ask your coach: "What competition goals are you working on with my child right now?"',
  },
  Fitness: {
    whatToPraise:
      'Praise showing up and working hard — "You gave full effort in training today" or "Your consistency is building something real."',
    atHomeSupportIdea:
      'Make sure your child is sleeping well, eating consistently, and staying hydrated — these are the biggest fitness factors you can control.',
    practiceLanguage:
      'Ask "How did your body feel today?" — physical awareness is an important skill in its own right.',
    avoidOvercoaching:
      'Avoid adding extra training sessions or intensity without coach guidance — recovery is part of the program.',
    whenToAskCoach:
      'Ask your coach: "Is there anything about my child\'s energy or recovery I should be aware of?"',
  },
  Recovery: {
    whatToPraise:
      'Praise listening to their body — "It\'s good that you told us when you were tired" or "Rest is part of training."',
    atHomeSupportIdea:
      'Protect sleep above all else — consistent 8–10 hours of sleep for young athletes is one of the biggest performance factors.',
    practiceLanguage:
      'Ask "Are you feeling rested?" — normalise recovery as a positive part of the training process.',
    avoidOvercoaching:
      'Avoid pushing extra training when your child is in a recovery phase — the coaching team manages the load.',
    whenToAskCoach:
      'Ask your coach: "How can I support their recovery at home this week?"',
  },
  Lifestyle: {
    whatToPraise:
      'Praise consistency and commitment — "You keep showing up" or "Your dedication is building your tennis life."',
    atHomeSupportIdea:
      'Help build a simple routine: consistent sleep, meals, and time for school work. Structure supports athletic development.',
    practiceLanguage:
      'Ask "What part of tennis did you enjoy most this week?" — connection to enjoyment keeps athletes in the sport long-term.',
    avoidOvercoaching:
      'Avoid over-scheduling or adding pressure around results — long-term development is built on enjoyment and consistency.',
    whenToAskCoach:
      'Ask your coach: "Are there lifestyle habits I can support that will help my child develop better?"',
  },
  default: {
    whatToPraise:
      'Praise effort and consistency — "I\'m proud of how hard you work" or "You keep showing up and that matters."',
    atHomeSupportIdea:
      'The best thing you can do at home is ensure consistent sleep, nutrition, and a positive attitude toward the sport.',
    practiceLanguage:
      'After every session, ask "What did you enjoy today?" — positive associations with practice build long-term athletes.',
    avoidOvercoaching:
      'Trust the coaching team\'s plan. Consistent messages from home and academy produce the best results.',
    whenToAskCoach:
      'If you have questions about progress or focus, ask your coach directly — they welcome parent conversations.',
  },
}

const STAGE_ADDENDUM: Record<string, string> = {
  beginner: 'At the beginner stage, enjoyment and comfort matter most. Keep tennis fun and pressure-free at home.',
  beginner_early: 'In the earliest stage of development, playfulness and curiosity are the goals. Let the coaching team set the structure.',
  intermediate: 'At the intermediate stage, consistency and repetition are building habits. Patience with the process is everything.',
  advanced: 'At the advanced stage, mental resilience and recovery quality become critical. Support those areas at home.',
  competition: 'During competition development, staying calm about results and focusing on process is the most powerful support you can give.',
  mental_development: 'When mental skills are a focus, your language at home matters enormously. Neutral, calm energy after sessions is the best support.',
}

export function buildParentSupportGuide(input: SupportGuideInput): ParentSupportGuide {
  const { domain, levelStage, playerFirstName } = input

  const domainKey = (domain as DomainKey) ?? 'default'
  const guide = DOMAIN_GUIDES[domainKey] ?? DOMAIN_GUIDES.default

  const stageNote = levelStage ? (STAGE_ADDENDUM[levelStage] ?? null) : null

  const atHomeSupportIdea = stageNote
    ? `${guide.atHomeSupportIdea} ${stageNote}`
    : guide.atHomeSupportIdea

  return {
    whatToPraise: guide.whatToPraise.replace(/your child/g, playerFirstName),
    atHomeSupportIdea: atHomeSupportIdea.replace(/your child/g, playerFirstName),
    practiceLanguage: guide.practiceLanguage,
    avoidOvercoaching: guide.avoidOvercoaching,
    whenToAskCoach: guide.whenToAskCoach.replace(/my child/g, playerFirstName),
  }
}
