'use client'

import { X, Video } from 'lucide-react'

export const CLASS_BLOCKS = [
  {
    id: 'warm-up',
    label: 'Warm-Up',
    desc: 'Dynamic movement, rally warm-up, and mental focus priming.',
    defaultDuration: 10,
    coachCue: 'Watch movement quality and energy level entering the session.',
    playerWatchFor: 'Consistent footwork patterns and ready position.',
    evidenceOpp: 'Note movement quality and engagement on arrival.',
    curriculumConnection: 'Movement Foundation, Session Readiness',
  },
  {
    id: 'drills',
    label: 'Drills',
    desc: 'Structured repetition for technical development and pattern building.',
    defaultDuration: 20,
    coachCue: 'Provide specific technical feedback on contact point and swing path.',
    playerWatchFor: 'Consistent ball toss, grip, and follow-through.',
    evidenceOpp: 'Record error type and correction response rate.',
    curriculumConnection: 'Technical Foundation, Stroke Development',
  },
  {
    id: 'skills',
    label: 'Skills',
    desc: 'Applied skill development in semi-open environments.',
    defaultDuration: 20,
    coachCue: 'Introduce decision points — where, when, and why.',
    playerWatchFor: 'Pattern recognition and shot selection under mild pressure.',
    evidenceOpp: 'Note consistency under increasing pressure or added variables.',
    curriculumConnection: 'Tactical Application, Skill Transfer',
  },
  {
    id: 'tactics',
    label: 'Tactics',
    desc: 'Game patterns, court positioning, and strategic awareness.',
    defaultDuration: 20,
    coachCue: 'Use questions: "What opened that up? What would you do differently?"',
    playerWatchFor: 'Pattern execution in live-ball situations.',
    evidenceOpp: 'Observe pattern recognition and decision timing.',
    curriculumConnection: 'Tactical IQ, Pattern Library',
  },
  {
    id: 'games',
    label: 'Games',
    desc: 'Constraint games and scoring formats that teach through play.',
    defaultDuration: 20,
    coachCue: 'Set the constraint clearly. Let the game do the teaching.',
    playerWatchFor: 'Adapting tactics to scoring rules and court conditions.',
    evidenceOpp: 'Track which constraints produce the desired behaviors.',
    curriculumConnection: 'Game Intelligence, Competitive Application',
  },
  {
    id: 'point-play',
    label: 'Point Play',
    desc: 'Competitive point play with coaching check-ins between points.',
    defaultDuration: 15,
    coachCue: 'Brief between-point interventions only. Let them compete.',
    playerWatchFor: 'Execution of practiced patterns under competitive pressure.',
    evidenceOpp: 'Observe pattern breakdown and pressure-response behavior.',
    curriculumConnection: 'Competitive Development, Mental Toughness',
  },
  {
    id: 'match-play',
    label: 'Match Play',
    desc: 'Supervised match play with match analysis and coaching debrief.',
    defaultDuration: 20,
    coachCue: 'Observe silently. Save coaching for the debrief.',
    playerWatchFor: 'Self-management, game plan execution, resilience.',
    evidenceOpp: 'Note match behaviors, error patterns, and emotional responses.',
    curriculumConnection: 'Match Readiness, Performance Assessment',
  },
  {
    id: 'assessment-moment',
    label: 'Assessment Moment',
    desc: 'Structured observation window for evidence-based progress tracking.',
    defaultDuration: 10,
    coachCue: 'Use the DONNA assessment protocol. Record observations now.',
    playerWatchFor: 'Demonstration of targeted skill or behavior.',
    evidenceOpp: 'Capture evidence for player profile and progress report.',
    curriculumConnection: 'Assessment, Player Development Record',
  },
  {
    id: 'reflection',
    label: 'Reflection / Wrap-Up',
    desc: 'Session debrief, key wins, one-word challenge, and next session preview.',
    defaultDuration: 5,
    coachCue: 'Ask one question: "What was your biggest win today?"',
    playerWatchFor: 'Self-awareness and ability to articulate learning.',
    evidenceOpp: 'Note self-reflection quality and coachability indicators.',
    curriculumConnection: 'Metacognition, Player Ownership',
  },
] as const

type ClassBlock = (typeof CLASS_BLOCKS)[number]

interface Props {
  selectedBlocks: string[]
  blockDurations: Record<string, number>
  onToggle: (id: string) => void
  onDurationChange: (id: string, minutes: number) => void
}

export function ClassTemplateBlockSelector({ selectedBlocks, blockDurations, onToggle, onDurationChange }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {(CLASS_BLOCKS as readonly ClassBlock[]).map(block => {
        const isSelected = selectedBlocks.includes(block.id)
        const duration = blockDurations[block.id] ?? block.defaultDuration

        return (
          <div
            key={block.id}
            className={[
              'rounded-xl border transition-all overflow-hidden',
              isSelected
                ? 'bg-lime/5 border-lime/30'
                : 'bg-surface border-border',
            ].join(' ')}
          >
            {isSelected && <span className="block h-0.5 bg-lime w-full" />}
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <p className={[
                  'text-sm font-semibold flex-1 leading-tight',
                  isSelected ? 'text-text-primary' : 'text-text-secondary',
                ].join(' ')}>
                  {block.label}
                </p>
                {isSelected ? (
                  <button
                    onClick={() => onToggle(block.id)}
                    className="shrink-0 flex items-center gap-1 text-[10px] text-lime hover:text-text-primary transition-colors px-2 py-0.5 rounded-md bg-lime/8 border border-lime/20 hover:bg-surface-raised"
                  >
                    <X className="w-2.5 h-2.5" />
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={() => onToggle(block.id)}
                    className="shrink-0 text-[10px] font-medium text-text-muted hover:text-lime transition-colors px-2 py-0.5 rounded-md border border-border hover:border-lime/30 hover:bg-lime/5"
                  >
                    Add
                  </button>
                )}
              </div>

              {isSelected ? (
                <div className="space-y-2">
                  {/* Duration control */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted uppercase tracking-wide font-bold">Duration</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDurationChange(block.id, Math.max(5, duration - 5))}
                        className="w-5 h-5 rounded bg-surface-raised border border-border text-text-muted hover:text-text-primary hover:border-border-strong text-xs flex items-center justify-center transition-all"
                      >
                        -
                      </button>
                      <span className="text-[11px] font-mono text-lime w-12 text-center">{duration} min</span>
                      <button
                        onClick={() => onDurationChange(block.id, Math.min(60, duration + 5))}
                        className="w-5 h-5 rounded bg-surface-raised border border-border text-text-muted hover:text-text-primary hover:border-border-strong text-xs flex items-center justify-center transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Coach cue */}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-0.5">Coach Cue</p>
                    <p className="text-[11px] text-text-secondary leading-relaxed">{block.coachCue}</p>
                  </div>

                  {/* Player watch-for */}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-0.5">Player Watch-For</p>
                    <p className="text-[11px] text-text-secondary leading-relaxed">{block.playerWatchFor}</p>
                  </div>

                  {/* Evidence + curriculum connection */}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-0.5">Evidence Opportunity</p>
                    <p className="text-[11px] text-text-secondary leading-relaxed">{block.evidenceOpp}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center bg-surface-raised border border-border rounded-md px-2 py-0.5 text-[9px] text-text-muted">
                      {block.curriculumConnection}
                    </span>
                  </div>

                  {/* Video placeholder */}
                  <button className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-lime transition-colors">
                    <Video className="w-3 h-3" />
                    Add video later
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-text-muted leading-relaxed">{block.desc}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
