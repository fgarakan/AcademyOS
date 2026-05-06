'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Check, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { generateSessionFromTemplateAction } from '@/app/director/fitness/templates/[templateId]/generate-session-actions'

interface Template {
  id: string
  name: string
  category: string | null
}

interface Coach {
  id: string
  display_name: string
}

interface Props {
  templates: Template[]
  coaches: Coach[]
  fallbackCoachId: string
}

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

export function SessionFromTemplateForm({ templates, coaches, fallbackCoachId }: Props) {
  const router = useRouter()
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '')
  const [sessionName, setSessionName] = useState(templates[0]?.name ?? '')
  const [date, setDate] = useState(todayIso())
  const [coachId, setCoachId] = useState(coaches[0]?.id ?? fallbackCoachId)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [generatedId, setGeneratedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleTemplateChange(id: string) {
    setTemplateId(id)
    const tmpl = templates.find(t => t.id === id)
    if (tmpl) setSessionName(tmpl.name)
  }

  function handleGenerate() {
    if (!templateId) { setError('Select a template.'); return }
    if (!date) { setError('Session date is required.'); return }
    if (!sessionName.trim()) { setError('Session name is required.'); return }
    setError(null)
    startTransition(async () => {
      const result = await generateSessionFromTemplateAction({
        templateId,
        name: sessionName.trim(),
        scheduledDate: date,
        coachId: coachId || fallbackCoachId,
        sessionNotes: notes.trim() || null,
      })
      if (result.error) {
        setError(result.error)
      } else if (result.sessionId) {
        setGeneratedId(result.sessionId)
      }
    })
  }

  if (generatedId) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-status-green/10 border border-status-green/30 flex items-center justify-center">
            <Check className="w-6 h-6 text-status-green" />
          </div>
          <div className="text-center">
            <p className="text-text-primary font-semibold">Session created</p>
            <p className="text-text-muted text-sm mt-1">Your session is ready. Open it to review blocks and exercises.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/director/sessions/${generatedId}`)}
              className="btn-lime flex items-center gap-1.5 text-sm px-4 py-2"
            >
              Open Session <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push('/director/sessions')}
              className="btn-ghost text-sm px-4 py-2"
            >
              Back to Sessions
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-6 space-y-5">
        <div className="space-y-1.5">
          <label className="label-xs">Template</label>
          <select
            value={templateId}
            onChange={e => handleTemplateChange(e.target.value)}
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-lime/50"
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}{t.category ? ` · ${t.category}` : ''}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-text-muted">
            Session will copy blocks and exercises from the selected template.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="label-xs">Session name</label>
          <input
            type="text"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
            placeholder="Session name"
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="label-xs flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-lime/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="label-xs">Coach</label>
            <select
              value={coachId}
              onChange={e => setCoachId(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-lime/50"
            >
              {coaches.map(c => (
                <option key={c.id} value={c.id}>{c.display_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="label-xs">Session notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any specific focus or instructions for this session…"
            rows={3}
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/50"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-status-red">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isPending || !templateId || !date}
          className="btn-lime flex items-center gap-2 text-sm px-5 py-2.5 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {isPending ? 'Creating session…' : 'Create session'}
        </button>
        <p className="text-[10px] text-text-muted">
          This copies the template&apos;s blocks and exercises into a new session. The template itself is not modified.
        </p>
      </CardContent>
    </Card>
  )
}
