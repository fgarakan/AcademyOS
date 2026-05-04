'use client'

import { useState, useTransition } from 'react'
import { Terminal, Clock, ChevronRight, Loader2, ArrowRight, ShieldCheck, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { submitDirectorCommandAction } from './submitDirectorCommandAction'
import type { ParsedCommandResult } from '@/lib/commands/parseAcademyCommand'
import {
  intentRequiresApproval,
  getSafeResponseBoundary,
  getRoleDisplayName,
  canRoleUseIntent,
} from '@/lib/commands/roleGuardrails'
import { VoiceIntakePanel } from '@/components/voice/VoiceIntakePanel'

interface RecentCommand {
  id: string
  raw_input: string
  processing_status: string
  created_at: string
}

interface CurriculumLevel {
  id: string
  display_name: string
  stage: string
}

interface RecentDraft {
  id: string
  status: string
  target_module: string
  proposed_payload: Record<string, unknown> | null
  created_at: string
}

interface Props {
  recentCommands: RecentCommand[]
  curriculumLevels: CurriculumLevel[]
  recentDrafts: RecentDraft[]
}

const EXAMPLE_COMMANDS = [
  'Show players missing curriculum levels',
  'Who is ready to advance?',
  'What are the requirements for Orange 2?',
  'Create a session draft for Orange 2 focused on movement',
  'Create a group draft for competitive Red 3 players',
  'Show curriculum gap suggestions',
  'Summarize players due for reassessment',
  'Record a note: review group sizes before Saturday',
]

const INTENT_LABELS: Record<string, string> = {
  show_players_missing_curriculum_level: 'Show players missing curriculum',
  show_curriculum_gap_suggestions: 'Show curriculum gap suggestions',
  create_session_draft: 'Create session draft',
  create_group_draft: 'Create group draft',
  record_director_note: 'Record director note',
  ask_curriculum_level_requirements: 'Look up curriculum level requirements',
  summarize_reassessment_pipeline: 'Summarize reassessment pipeline',
  show_advancement_eligible: 'Show advancement-eligible players',
  unknown: 'Unknown command',
}

export function CommandCenterClient({ recentCommands, curriculumLevels, recentDrafts }: Props) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ParsedCommandResult | null>(null)
  const [draftCreated, setDraftCreated] = useState<{ id: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isParsing, startParseTransition] = useTransition()
  const [isCreatingDraft, startDraftTransition] = useTransition()

  function handleExample(example: string) {
    setInput(example)
    setResult(null)
    setDraftCreated(null)
    setError(null)
  }

  function handleParse(text?: string) {
    const commandText = (text ?? input).trim()
    if (!commandText) return
    setResult(null)
    setDraftCreated(null)
    setError(null)

    startParseTransition(async () => {
      const res = await submitDirectorCommandAction(commandText, 'parse_only')
      if (res.error) {
        setError(res.error)
      } else if (res.parsed) {
        setResult(res.parsed)
      }
    })
  }

  function handleCreateDraft() {
    if (!result || !input.trim()) return
    startDraftTransition(async () => {
      const res = await submitDirectorCommandAction(input.trim(), 'create_draft')
      if (res.error) {
        setError(res.error)
      } else if (res.draftId) {
        setDraftCreated({ id: res.draftId })
      }
    })
  }

  const canCreateDraft =
    result &&
    result.intent_type !== 'unknown' &&
    result.requires_confirmation &&
    !result.will_not_do?.includes('query_only')

  const isQueryOnly =
    result &&
    (result.intent_type === 'show_players_missing_curriculum_level' ||
      result.intent_type === 'show_curriculum_gap_suggestions' ||
      result.intent_type === 'ask_curriculum_level_requirements' ||
      result.intent_type === 'show_advancement_eligible' ||
      result.intent_type === 'summarize_reassessment_pipeline')

  return (
    <div className="space-y-6">

      {/* Command input — VoiceIntakePanel */}
      <VoiceIntakePanel
        role="academy_director"
        contextLabel="Director Command Center"
        value={input}
        onChange={v => { setInput(v); setResult(null); setDraftCreated(null); setError(null) }}
        onSubmit={text => { setInput(text); handleParse(text) }}
        placeholder="Speak or type what you want done… e.g. 'Create a session draft for Orange 2 focused on movement'"
        submitLabel={isParsing ? 'Parsing…' : 'Parse Command'}
        disabled={isParsing || isCreatingDraft}
      />

      {isParsing && (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-lime" />
          Parsing command…
        </div>
      )}

      {error && (
        <p className="text-xs text-status-red">{error}</p>
      )}

      {/* Parsed result */}
      {result && (
        <Card>
          <CardHeader>
            <p className="label-xs">Parsed Intent</p>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">

            {/* Intent + confidence */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className={[
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border',
                result.intent_type === 'unknown'
                  ? 'border-status-orange/30 bg-status-orange/5 text-status-orange'
                  : 'border-lime/30 bg-lime/5 text-lime',
              ].join(' ')}>
                <Terminal className="w-3 h-3" />
                {INTENT_LABELS[result.intent_type] ?? result.intent_type}
              </span>
              <span className={[
                'text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border',
                result.confidence === 'high' ? 'border-status-green/30 text-status-green' :
                result.confidence === 'medium' ? 'border-status-orange/30 text-status-orange' :
                'border-border text-text-muted',
              ].join(' ')}>
                {result.confidence} confidence
              </span>
              {isQueryOnly && (
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-status-blue/30 text-status-blue">
                  Query — no action taken
                </span>
              )}
            </div>

            {/* Extracted entities */}
            {Object.keys(result.extracted_entities ?? {}).length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Extracted</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.extracted_entities ?? {}).map(([key, value]) => (
                    <span key={key} className="px-2 py-1 rounded-lg bg-surface-raised border border-border text-xs text-text-secondary">
                      <span className="text-text-muted">{key}:</span>{' '}
                      <span className="font-medium">{String(value)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing information */}
            {(result.missing_information ?? []).length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Missing Information</p>
                <ul className="space-y-0.5">
                  {result.missing_information!.map((item, i) => (
                    <li key={i} className="text-xs text-status-orange flex gap-1.5">
                      <span className="shrink-0">·</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What would happen */}
            {result.suggested_next_step && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">What Would Happen</p>
                <p className="text-xs text-text-secondary leading-relaxed">{result.suggested_next_step}</p>
              </div>
            )}

            {/* What will NOT happen */}
            {(result.will_not_do ?? []).length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Will Not Do</p>
                <ul className="space-y-0.5">
                  {result.will_not_do!.map((item, i) => (
                    <li key={i} className="text-xs text-text-muted flex gap-1.5">
                      <span className="shrink-0 text-status-red">✕</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Query result / direct answer for query intents */}
            {result.query_result && (
              <div className="px-4 py-3 rounded-xl border border-border bg-surface-raised">
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Result</p>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{result.query_result}</p>
              </div>
            )}

            {/* Guardrail block */}
            <div className="space-y-2 pt-1">
              {/* Role allowed badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-status-green/30 bg-status-green/5 text-[10px] text-status-green">
                  <ShieldCheck className="w-3 h-3" />
                  {getRoleDisplayName('academy_director')} — {canRoleUseIntent('academy_director', result.intent_type) ? 'allowed' : 'blocked'}
                </div>
                {intentRequiresApproval(result.intent_type) ? (
                  <span className="px-2 py-1 rounded-lg border border-status-orange/30 bg-status-orange/5 text-[10px] text-status-orange">
                    Creates review draft only — requires your approval
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-lg border border-status-blue/30 bg-status-blue/5 text-[10px] text-status-blue">
                    Query only — no draft created
                  </span>
                )}
              </div>
              <p className="text-[10px] text-text-muted leading-relaxed">
                {getSafeResponseBoundary('academy_director')}
              </p>
            </div>

            {/* Draft creation — only for non-query action intents */}
            {canCreateDraft && !isQueryOnly && !draftCreated && (
              <div className="pt-3 border-t border-border">
                <button
                  onClick={handleCreateDraft}
                  disabled={isCreatingDraft}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg btn-lime text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingDraft
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <ArrowRight className="w-3.5 h-3.5" />
                  }
                  {isCreatingDraft ? 'Creating draft…' : 'Create Review Draft'}
                </button>
                <p className="text-[10px] text-text-muted mt-1.5">
                  Creates a draft in the Review Queue. Nothing happens until you approve it there.
                </p>
              </div>
            )}

            {draftCreated && (
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-green/10 border border-status-green/30 text-xs text-status-green">
                  ✓ Draft created in review queue
                </div>
                <a href="/director/review" className="text-xs text-lime hover:underline flex items-center gap-1">
                  View Review Queue <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {/* Example commands */}
      <Card>
        <CardHeader>
          <p className="label-xs">Example Commands</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {EXAMPLE_COMMANDS.map(example => (
              <button
                key={example}
                onClick={() => handleExample(example)}
                className="w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border hover:border-lime/30 hover:bg-lime/3 transition-colors group"
              >
                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                  {example}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-lime transition-colors shrink-0" />
              </button>
            ))}
          </div>

          {curriculumLevels.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Available Curriculum Levels</p>
              <div className="flex flex-wrap gap-1.5">
                {curriculumLevels.map(l => (
                  <span key={l.id} className="px-2 py-0.5 rounded text-[10px] border border-border text-text-muted">
                    {l.display_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent command history */}
      {recentCommands.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-text-muted" />
              <p className="label-xs">Recent Commands</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {recentCommands.map(cmd => (
              <button
                key={cmd.id}
                onClick={() => handleExample(cmd.raw_input)}
                className="w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border hover:border-border/80 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-secondary truncate">{cmd.raw_input}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {new Date(cmd.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <ChevronRight className="w-3 h-3 text-text-muted shrink-0" />
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent command-created drafts */}
      <RecentDraftsPanel drafts={recentDrafts} />

      {/* Guardrail */}
      <p className="text-[10px] text-text-muted leading-relaxed border-t border-border pt-3">
        The Command Center is read-only for query intents. For action intents, it creates a pending draft in the Review Queue.
        Nothing is applied automatically. All drafts require director approval before any change is made.
      </p>
    </div>
  )
}

const DRAFT_STATUS_COLORS: Record<string, string> = {
  pending_review: 'text-status-orange border-status-orange/30 bg-status-orange/5',
  approved:       'text-status-green border-status-green/30 bg-status-green/5',
  rejected:       'text-status-red border-status-red/30 bg-status-red/5',
}

function RecentDraftsPanel({ drafts }: { drafts: RecentDraft[] }) {
  if (drafts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-text-muted" />
            <p className="label-xs">Command-Created Drafts</p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-[11px] text-text-muted">
            No command-created drafts yet. Action intents (session draft, group draft, director note) create a draft here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-text-muted" />
            <p className="label-xs">Command-Created Drafts</p>
          </div>
          <a href="/director/review" className="text-[10px] text-lime hover:underline flex items-center gap-1">
            View Review Queue <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {drafts.map(draft => {
          const payload = draft.proposed_payload
          const intentType = typeof payload?.intent_type === 'string' ? payload.intent_type : null
          const commandText = typeof payload?.command_text === 'string' ? payload.command_text : null
          const willNotDo: string[] = Array.isArray(payload?.will_not_do) ? (payload.will_not_do as string[]) : []
          const nextStep = typeof payload?.suggested_next_step === 'string' ? payload.suggested_next_step : null
          const statusClass = DRAFT_STATUS_COLORS[draft.status] ?? 'text-text-muted border-border bg-surface-raised'

          return (
            <div key={draft.id} className="rounded-xl border border-border bg-surface-raised p-3 space-y-2">
              {/* Status + intent + time */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-semibold ${statusClass}`}>
                  {draft.status.replace(/_/g, ' ')}
                </span>
                {intentType && (
                  <span className="text-[10px] text-text-muted font-mono">
                    {INTENT_LABELS[intentType] ?? intentType}
                  </span>
                )}
                <span className="text-[10px] text-text-muted ml-auto shrink-0">
                  {new Date(draft.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Command text */}
              {commandText && (
                <p className="text-xs text-text-secondary leading-snug line-clamp-2">{commandText}</p>
              )}

              {/* What would happen */}
              {nextStep && (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-text-muted mb-0.5">What would happen</p>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{nextStep}</p>
                </div>
              )}

              {/* What will not happen */}
              {willNotDo.filter(w => w !== 'query_only').length > 0 && (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-text-muted mb-0.5">Will not do</p>
                  <ul className="space-y-0.5">
                    {willNotDo.filter(w => w !== 'query_only').map((item, i) => (
                      <li key={i} className="text-[10px] text-text-muted flex gap-1">
                        <span className="text-status-red shrink-0">✕</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {draft.status === 'pending_review' && (
                <a
                  href="/director/review"
                  className="inline-flex items-center gap-1 text-[10px] text-lime hover:underline"
                >
                  Review in queue <ArrowRight className="w-3 h-3" />
                </a>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
