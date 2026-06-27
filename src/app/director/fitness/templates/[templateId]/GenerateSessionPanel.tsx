'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowRight, Calendar, Check, X, Loader2, Zap, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { generateSessionFromTemplateAction } from './generate-session-actions'

export interface CoachOption {
  id: string
  display_name: string
}

export interface GroupOption {
  id: string
  name: string
}

export interface GateOption {
  id: string
  domain: string
  criterion: string
  threshold: string
}

export interface LessonPlanBlock {
  id: string
  name: string
  duration_min: number | null
  notes: string | null
  exerciseNames: string[]
}

interface GenerateSessionPanelProps {
  templateId: string
  templateName: string
  hasBlocks: boolean
  coaches: CoachOption[]
  fallbackCoachId: string
  fallbackCoachName: string
  focusGates?: GateOption[]
  blocks?: LessonPlanBlock[]
  /** Groups the director can assign as the session roster. Empty = no group set up yet. */
  groups?: GroupOption[]
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

export function GenerateSessionPanel({
  templateId,
  templateName,
  hasBlocks,
  coaches,
  fallbackCoachId,
  fallbackCoachName,
  focusGates = [],
  blocks = [],
  groups = [],
}: GenerateSessionPanelProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(templateName)
  const [date, setDate] = useState(todayIso)
  const [time, setTime] = useState('')
  const [coachId, setCoachId] = useState(
    coaches.length > 0 ? coaches[0].id : fallbackCoachId
  )
  const [groupId, setGroupId] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedGateIds, setSelectedGateIds] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formWarning, setFormWarning] = useState<string | null>(null)
  const [generatedId, setGeneratedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openPanel() {
    setName(templateName)
    setDate(todayIso())
    setTime('')
    setCoachId(coaches.length > 0 ? coaches[0].id : fallbackCoachId)
    setGroupId('')
    setNotes('')
    setSelectedGateIds([])
    setFormError(null)
    setFormWarning(null)
    setGeneratedId(null)
    setOpen(true)
  }

  function toggleGate(id: string) {
    setSelectedGateIds(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
  }

  function closePanel() {
    setOpen(false)
    setFormError(null)
    setGeneratedId(null)
  }

  function handleGenerate() {
    if (!date) {
      setFormError('Session date is required.')
      return
    }
    if (!name.trim()) {
      setFormError('Session name is required.')
      return
    }
    setFormError(null)

    startTransition(async () => {
      const result = await generateSessionFromTemplateAction({
        templateId,
        name: name.trim(),
        scheduledDate: date,
        scheduledTime: time.trim() || null,
        coachId,
        groupId: groupId || null,
        sessionNotes: notes.trim() || null,
        focusGateIds: selectedGateIds,
      })

      if (result.sessionId) {
        setGeneratedId(result.sessionId)
        if (result.error) setFormWarning(result.error)
      } else if (result.error) {
        setFormError(result.error)
      }
    })
  }

  // --- Trigger button (closed state) ---
  if (!open) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={openPanel}
          disabled={!hasBlocks}
          title={!hasBlocks ? 'Add blocks to this template before generating a session.' : undefined}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-lime text-xs disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Zap className="w-3.5 h-3.5" />
          Generate Session
        </button>
        {!hasBlocks && (
          <span className="text-[10px] text-text-muted">
            Template has no blocks — add blocks before generating.
          </span>
        )}
      </div>
    )
  }

  // --- Success state (may include exercise warning if migration 056 not applied) ---
  if (generatedId) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-status-green shrink-0" />
                <span className="text-sm font-semibold text-status-green">Session generated</span>
              </div>
              <p className="text-xs text-text-secondary">
                A planned session snapshot was created from this template. The master template is unchanged.
              </p>
              {formWarning && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-orange/10 border border-status-orange/30">
                  <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
                  <p className="text-[11px] text-status-orange">{formWarning}</p>
                </div>
              )}
              <Link
                href={`/director/sessions/${generatedId}`}
                className="flex items-center gap-1.5 text-xs text-lime hover:opacity-80 transition-opacity font-medium"
              >
                Open session →
                <ArrowRight className="w-3 h-3" />
              </Link>
              <Link
                href="/director/sessions"
                className="text-[10px] text-text-muted hover:text-text-secondary transition-colors underline underline-offset-2"
              >
                View all sessions
              </Link>
              <p className="text-[10px] text-text-muted">
                Coach changes to the session will be saved as session overrides and will not affect this master template.
              </p>
            </div>
            <button
              onClick={closePanel}
              className="shrink-0 p-1 rounded text-text-muted hover:text-text-primary transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // --- Form panel (open state) ---
  return (
    <Card>
      <CardContent className="py-4">
        <div className="space-y-4">

          {/* Panel header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-lime shrink-0" />
              <span className="text-sm font-semibold text-text-primary">Generate Planned Session</span>
            </div>
            <button
              onClick={closePanel}
              disabled={isPending}
              className="p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-50 transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Planned session notice */}
          <p className="text-[10px] text-text-muted border border-border rounded px-2 py-1.5">
            Generated sessions are planned lesson plans — a snapshot of this template at this moment.
            Coach live-session changes are saved later as session overrides and will not change the master template.
          </p>

          {/* Session name */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-text-muted block">
              Session name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isPending}
              className="w-full text-sm bg-surface border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-lime/40 disabled:opacity-50"
              placeholder="Session name"
            />
          </div>

          {/* Session date + time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-text-muted block">
                Date <span className="text-status-red">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                disabled={isPending}
                className="w-full text-sm bg-surface border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-lime/40 disabled:opacity-50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-text-muted block">
                Start time
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                disabled={isPending}
                className="w-full text-sm bg-surface border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-lime/40 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Coach selection */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-text-muted block">
              Assigned coach
            </label>
            {coaches.length > 0 ? (
              <select
                value={coachId}
                onChange={e => setCoachId(e.target.value)}
                disabled={isPending}
                className="w-full text-sm bg-surface border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-lime/40 disabled:opacity-50"
              >
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>{c.display_name}</option>
                ))}
              </select>
            ) : (
              <div className="text-[10px] text-text-muted border border-border rounded px-3 py-2 bg-surface-raised">
                No coaches found — session will be assigned to{' '}
                <span className="text-text-secondary">{fallbackCoachName}</span> (you).
              </div>
            )}
          </div>

          {/* Group / roster selection — drives the coach's player roster, attendance, wrap-up */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-text-muted block">
              Group <span className="text-text-muted">(roster)</span>
            </label>
            {groups.length > 0 ? (
              <select
                value={groupId}
                onChange={e => setGroupId(e.target.value)}
                disabled={isPending}
                className="w-full text-sm bg-surface border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-lime/40 disabled:opacity-50"
              >
                <option value="">No group — coach will have no roster</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            ) : (
              <div className="text-[10px] text-text-muted border border-border rounded px-3 py-2 bg-surface-raised">
                No groups exist yet — the coach will have no player roster, and attendance and wrap-up will be unavailable for this session.
              </div>
            )}
            {groups.length > 0 && !groupId && (
              <p className="text-[10px] text-status-orange">
                Without a group the coach cannot mark attendance or complete wrap-up.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-text-muted block">
              Notes <span className="text-text-muted">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={isPending}
              rows={2}
              placeholder="Any session-specific context or notes for the coach…"
              className="w-full text-sm bg-surface border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-lime/40 disabled:opacity-50 resize-none placeholder:text-text-muted"
            />
          </div>

          {/* Today's focus gates */}
          {focusGates.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-widest text-text-muted block">
                  Today's focus gates <span className="text-text-muted">(optional)</span>
                </label>
                {selectedGateIds.length > 0 && (
                  <span className="text-[10px] font-mono text-lime">{selectedGateIds.length} selected</span>
                )}
              </div>
              <p className="text-[10px] text-text-muted">
                Selected gates appear in session notes as coaching context. This does not record evidence.
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {focusGates.map(g => (
                  <label
                    key={g.id}
                    className={[
                      'flex items-start gap-2.5 cursor-pointer rounded-lg px-2.5 py-1.5 border transition-colors',
                      selectedGateIds.includes(g.id)
                        ? 'border-lime/30 bg-lime/5'
                        : 'border-border bg-surface-raised',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGateIds.includes(g.id)}
                      onChange={() => toggleGate(g.id)}
                      disabled={isPending}
                      className="mt-0.5 accent-lime shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] text-text-secondary leading-snug">{g.criterion}</p>
                      <p className="text-[9px] text-text-muted mt-0.5">
                        <span className="font-semibold">{g.domain}</span>
                        {g.threshold ? ` · ${g.threshold}` : ''}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Lesson plan preview toggle */}
          {blocks.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowPreview(v => !v)}
                className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPreview
                  ? <EyeOff className="w-3 h-3" />
                  : <Eye className="w-3 h-3" />
                }
                {showPreview ? 'Hide preview' : 'Preview tentative lesson plan'}
              </button>

              {showPreview && (
                <div className="mt-2 rounded-xl border border-border bg-surface-raised p-3 space-y-2">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-text-muted">
                    Tentative Lesson Plan — Preview only. Session is created after you confirm.
                  </p>

                  {/* Header meta */}
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-text-primary font-medium">{name || '(unnamed session)'}</p>
                    <p className="text-[10px] text-text-muted">
                      {date || '—'}
                      {time ? ` · ${time}` : ''}
                      {' · '}
                      {coaches.find(c => c.id === coachId)?.display_name ?? fallbackCoachName}
                    </p>
                    <p className="text-[10px] text-text-muted">Template: <span className="text-text-secondary">{templateName}</span></p>
                  </div>

                  {/* Selected focus gates */}
                  {selectedGateIds.length > 0 && (
                    <div className="pt-1 border-t border-border">
                      <p className="text-[9px] font-semibold uppercase tracking-widest text-lime/70 mb-1">Today's Focus Gates</p>
                      {focusGates
                        .filter(g => selectedGateIds.includes(g.id))
                        .map(g => (
                          <p key={g.id} className="text-[10px] text-text-secondary leading-snug">
                            <span className="text-text-muted">[{g.domain}]</span> {g.criterion}
                          </p>
                        ))
                      }
                    </div>
                  )}

                  {/* Blocks */}
                  <div className="pt-1 border-t border-border space-y-2">
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-text-muted">Blocks</p>
                    {blocks.map((b, i) => (
                      <div key={b.id} className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-text-muted w-4 shrink-0">{i + 1}.</span>
                          <span className="text-[10px] text-text-primary font-medium">{b.name}</span>
                          {b.duration_min != null && (
                            <span className="text-[9px] font-mono text-text-muted ml-auto shrink-0">{b.duration_min} min</span>
                          )}
                        </div>
                        {b.notes && (
                          <p className="text-[10px] text-text-muted leading-snug pl-6 whitespace-pre-line line-clamp-3">
                            {b.notes}
                          </p>
                        )}
                        {b.exerciseNames.length > 0 && (
                          <p className="text-[10px] text-text-muted/70 pl-6">
                            {b.exerciseNames.slice(0, 4).join(' · ')}
                            {b.exerciseNames.length > 4 ? ` +${b.exerciseNames.length - 4} more` : ''}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {formError && (
            <div className="flex items-start gap-2 text-xs text-status-red">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={closePanel}
              disabled={isPending}
              className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isPending || !date}
              className="btn-lime text-xs px-3 py-1.5 disabled:opacity-50"
            >
              <span className="flex items-center gap-1.5">
                {isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Zap className="w-3.5 h-3.5" />
                }
                {isPending ? 'Generating…' : 'Generate Session'}
              </span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
