'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowRight, Calendar, Check, X, Loader2, Zap, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { generateSessionFromTemplateAction } from './generate-session-actions'

export interface CoachOption {
  id: string
  display_name: string
}

interface GenerateSessionPanelProps {
  templateId: string
  templateName: string
  hasBlocks: boolean
  coaches: CoachOption[]
  fallbackCoachId: string
  fallbackCoachName: string
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
}: GenerateSessionPanelProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(templateName)
  const [date, setDate] = useState(todayIso)
  const [coachId, setCoachId] = useState(
    coaches.length > 0 ? coaches[0].id : fallbackCoachId
  )
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formWarning, setFormWarning] = useState<string | null>(null)
  const [generatedId, setGeneratedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openPanel() {
    setName(templateName)
    setDate(todayIso())
    setCoachId(coaches.length > 0 ? coaches[0].id : fallbackCoachId)
    setNotes('')
    setFormError(null)
    setFormWarning(null)
    setGeneratedId(null)
    setOpen(true)
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
        coachId,
        sessionNotes: notes.trim() || null,
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

          {/* Session date */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-text-muted block">
              Session date <span className="text-status-red">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              disabled={isPending}
              className="w-full text-sm bg-surface border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-lime/40 disabled:opacity-50"
            />
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
