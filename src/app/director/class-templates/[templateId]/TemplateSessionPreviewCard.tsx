import { Eye, Clock, AlertTriangle, Layers, GraduationCap, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

// ─── Exported types (consumed by page.tsx) ────────────────────────────────────

export interface PreviewContentItem {
  title: string
  contentType: string
  domain: string | null
  sessionBlockHint: string | null
  durationMin: number | null
  isCoachOnly: boolean
}

export interface PreviewBlock {
  id: string
  name: string
  blockType: string
  durationMin: number | null
  orderIndex: number
  curriculumItems: PreviewContentItem[]
}

interface Props {
  blocks: PreviewBlock[]
  levelName: string | null
}

// ─── Label + color helpers ────────────────────────────────────────────────────

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

const BLOCK_TYPE_LABELS: Record<string, string> = {
  warm_up:     'Warm-Up',
  cool_down:   'Cool-Down',
  technical:   'Technical',
  tactical:    'Tactical',
  movement:    'Movement',
  fitness:     'Fitness',
  competition: 'Competition',
  mental:      'Mental',
  free:        'Free Play',
}

function blockTypeLabel(t: string) {
  return BLOCK_TYPE_LABELS[t] ?? t.replace(/_/g, ' ')
}

function typeLabel(t: string) {
  return TYPE_LABELS[t] ?? t.replace(/_/g, ' ')
}

function typeBadge(t: string) {
  return TYPE_BADGE[t] ?? 'border-border text-text-muted'
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TemplateSessionPreviewCard({ blocks, levelName }: Props) {
  const totalItems = blocks.reduce((sum, b) => sum + b.curriculumItems.length, 0)
  const blocksWithoutContent = blocks.filter(b => b.curriculumItems.length === 0).length
  const hasAnyContent = totalItems > 0

  const blockDurationTotal = blocks.reduce((sum, b) => sum + (b.durationMin ?? 0), 0)
  const contentDurationTotal = blocks.reduce(
    (sum, b) => sum + b.curriculumItems.reduce((s, i) => s + (i.durationMin ?? 0), 0),
    0,
  )

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-lime" />
          <p className="label-xs">Session Preview</p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-status-orange/30 text-status-orange bg-status-orange/5">
          Preview only — no session created
        </span>
      </div>

      {/* Summary card */}
      <Card className="border-lime/10 bg-lime/[0.02] mb-4">
        <CardContent className="py-4 space-y-3">
          <p className="text-[11px] text-text-muted leading-snug">
            This shows how sessions from this template would appear to coaches.
            No live session has been created yet.
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-text-muted shrink-0" />
              <span className="text-[10px] text-text-secondary">
                {blocks.length} block{blocks.length !== 1 ? 's' : ''}
              </span>
            </div>
            {blockDurationTotal > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-text-muted shrink-0" />
                <span className="text-[10px] text-text-secondary">
                  ~{blockDurationTotal} min estimated
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-lime">{totalItems}</span>
              <span className="text-[10px] text-text-secondary">
                curriculum item{totalItems !== 1 ? 's' : ''}
                {contentDurationTotal > 0 && (
                  <span className="text-text-muted"> · ~{contentDurationTotal} min</span>
                )}
              </span>
            </div>
            {levelName && (
              <div className="flex items-center gap-1 ml-auto">
                <GraduationCap className="w-3 h-3 text-text-muted shrink-0" />
                <span className="text-[10px] text-text-muted">{levelName}</span>
              </div>
            )}
          </div>

          {/* Warning banner */}
          {blocksWithoutContent > 0 && (
            <div className="flex items-start gap-1.5 pt-2 border-t border-border/50">
              <AlertTriangle className="w-3 h-3 text-status-orange shrink-0 mt-0.5" />
              <p className="text-[10px] text-status-orange leading-snug">
                {blocksWithoutContent === blocks.length
                  ? 'No curriculum content assigned. Add content to template blocks before generating a session plan.'
                  : `${blocksWithoutContent} block${blocksWithoutContent !== 1 ? 's' : ''} without curriculum content — ${blocksWithoutContent !== 1 ? 'they' : 'it'} will run without a guided focus.`}
              </p>
            </div>
          )}

          {/* No blocks at all */}
          {blocks.length === 0 && (
            <div className="flex items-start gap-1.5 pt-2 border-t border-border/50">
              <AlertTriangle className="w-3 h-3 text-status-orange shrink-0 mt-0.5" />
              <p className="text-[10px] text-status-orange leading-snug">
                This template has no blocks. Add blocks before generating a session.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-block preview */}
      {blocks.length > 0 && (
        <div className="space-y-2">
          {blocks.map((block, i) => (
            <PreviewBlockRow key={block.id} block={block} index={i} hasAnyContent={hasAnyContent} />
          ))}
        </div>
      )}

      {/* Footer */}
      <p className="text-[10px] text-text-muted mt-4 pt-3 border-t border-border">
        Planned Focus shows estimated content for each block. Coaches see this plan when running the session.
        Internal items are not shown to players or parents.
      </p>
    </div>
  )
}

// ─── Per-block row ────────────────────────────────────────────────────────────

function PreviewBlockRow({
  block,
  index,
  hasAnyContent,
}: {
  block: PreviewBlock
  index: number
  hasAnyContent: boolean
}) {
  const hasContent = block.curriculumItems.length > 0

  return (
    <Card>
      <CardContent className="py-3">
        {/* Block header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-text-muted w-5 shrink-0">{index + 1}</span>
            <p className="text-sm font-semibold text-text-primary">{block.name}</p>
            {block.blockType && (
              <span className="text-[10px] uppercase tracking-widest text-text-muted px-1.5 py-0.5 rounded border border-border">
                {blockTypeLabel(block.blockType)}
              </span>
            )}
          </div>
          {block.durationMin != null ? (
            <span className="shrink-0 flex items-center gap-1 text-xs text-text-muted">
              <Clock className="w-3 h-3" />
              {block.durationMin}min
            </span>
          ) : (
            <span className="shrink-0 text-[10px] text-text-muted/40 italic">Duration not set</span>
          )}
        </div>

        {/* Planned Focus label */}
        {hasContent && (
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5 pl-7">
            Planned Focus
          </p>
        )}

        {/* Content items */}
        {!hasContent ? (
          <div className="pl-7 flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 text-text-muted/50 shrink-0 mt-0.5" />
            <p className="text-[11px] text-text-muted italic">
              No curriculum content assigned yet.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5 pl-7">
            {block.curriculumItems.map((item, j) => (
              <li key={j} className="flex items-start gap-2">
                <span className="text-lime/60 text-xs mt-0.5 shrink-0">›</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[11px] font-medium text-text-primary">{item.title}</p>
                    <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${typeBadge(item.contentType)}`}>
                      {typeLabel(item.contentType)}
                    </span>
                    {item.isCoachOnly && (
                      <span className="text-[9px] text-text-muted flex items-center gap-0.5 border border-border px-1.5 py-0.5 rounded">
                        <Lock className="w-2 h-2" /> Internal
                      </span>
                    )}
                    {item.durationMin != null && (
                      <span className="text-[10px] text-text-muted flex items-center gap-0.5 ml-auto shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        {item.durationMin}m
                      </span>
                    )}
                  </div>
                  {(item.domain || item.sessionBlockHint) && (
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {item.domain && (
                        <span className="text-[10px] text-text-muted">{item.domain}</span>
                      )}
                      {item.sessionBlockHint && (
                        <span className="text-[10px] text-text-muted">
                          {item.domain ? '·' : ''} {item.sessionBlockHint}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
