import { BookOpen, Clock, Lock } from 'lucide-react'

export interface CurriculumItem {
  title: string
  contentType: string
  domain: string | null
  sessionBlockHint: string | null
  durationMin: number | null
  isCoachOnly: boolean
  description: string | null
}

interface Props {
  items: CurriculumItem[]
  hasTemplateSource: boolean
}

// ─── Label + badge helpers ────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  drill:                'Drill',
  warmup:               'Warm-Up',
  cooldown:             'Cool-Down',
  game:                 'Game',
  skill:                'Skill',
  tactical:             'Tactical',
  tactical_game:        'Tactical Game',
  situational:          'Situational',
  match_play_theme:     'Match-Play Theme',
  mental_skill:         'Mental Skill',
  competition_behavior: 'Competition',
  coach_cue:            'Coach Cue',
  success_criteria:     'Success Criteria',
  progression:          'Progression',
  regression:           'Regression',
  player_mission:       'Player Mission',
  parent_guidance:      'Parent Guidance',
}

const TYPE_BADGE: Record<string, string> = {
  drill:                'border-lime/20 text-lime',
  tactical_game:        'border-status-blue/20 text-status-blue',
  situational:          'border-status-orange/20 text-status-orange',
  match_play_theme:     'border-purple-500/20 text-purple-400',
  mental_skill:         'border-status-green/20 text-status-green',
  competition_behavior: 'border-status-orange/20 text-status-orange',
  warmup:               'border-border text-text-secondary',
  cooldown:             'border-border text-text-secondary',
  coach_cue:            'border-lime/10 text-lime',
  success_criteria:     'border-status-green/10 text-status-green',
  progression:          'border-lime/20 text-lime',
  regression:           'border-border text-text-muted',
  player_mission:       'border-status-blue/10 text-status-blue',
  parent_guidance:      'border-border text-text-muted',
}

function typeLabel(t: string) {
  return TYPE_LABELS[t] ?? t.replace(/_/g, ' ')
}

function typeBadge(t: string) {
  return TYPE_BADGE[t] ?? 'border-border text-text-muted'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SessionBlockCurriculumContent({ items, hasTemplateSource }: Props) {
  // Section header — always shown
  const header = (
    <div className="flex items-center gap-1.5 mb-2 mt-3 pt-3 border-t border-border/60">
      <BookOpen className="w-3 h-3 text-lime shrink-0" />
      <p className="text-[10px] uppercase tracking-widest text-text-muted">Planned Focus</p>
    </div>
  )

  // No template source — session not generated from a class template
  if (!hasTemplateSource) {
    return (
      <>
        {header}
        <p className="text-[11px] text-text-muted italic pl-1">
          Session was not generated from a class template — no inherited curriculum content.
        </p>
      </>
    )
  }

  // Template source exists but no content for this block
  if (items.length === 0) {
    return (
      <>
        {header}
        <p className="text-[11px] text-text-muted italic pl-1">
          No curriculum content assigned to this block.
        </p>
      </>
    )
  }

  // Content items
  return (
    <>
      {header}
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-lime/60 text-xs mt-0.5 shrink-0">›</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[11px] font-medium text-text-primary">{item.title}</p>
                <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${typeBadge(item.contentType)}`}>
                  {typeLabel(item.contentType)}
                </span>
                {item.isCoachOnly && (
                  <span className="text-[9px] text-text-muted flex items-center gap-0.5 border border-border px-1.5 py-0.5 rounded">
                    <Lock className="w-2 h-2" />
                    Internal
                  </span>
                )}
                {item.durationMin != null && (
                  <span className="text-[10px] text-text-muted flex items-center gap-0.5 ml-auto shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    {item.durationMin}min
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                {item.domain && (
                  <span className="text-[10px] text-text-muted">{item.domain}</span>
                )}
                {item.sessionBlockHint && (
                  <span className="text-[10px] text-text-muted">
                    {item.domain ? '·' : ''} {item.sessionBlockHint}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-[10px] text-text-muted/80 mt-0.5 leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
