'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, Trash2, AlertTriangle, CheckCircle, X } from 'lucide-react'
import { archiveClassTemplateAction, deleteClassTemplateAction } from './archiveDeleteTemplateAction'

interface Props {
  templateId: string
  templateName: string
  sessionCount: number
}

type View = 'idle' | 'confirm_archive' | 'confirm_delete'

export function TemplateArchiveDeletePanel({ templateId, templateName, sessionCount }: Props) {
  const router = useRouter()
  const [view, setView] = useState<View>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleArchive() {
    setError(null)
    startTransition(async () => {
      const result = await archiveClassTemplateAction(templateId)
      if (result.ok) {
        router.push('/director/class-templates')
      } else {
        setError(result.error)
        setView('idle')
      }
    })
  }

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteClassTemplateAction(templateId)
      if (result.ok) {
        router.push('/director/class-templates')
      } else {
        setError(result.error)
        setView('idle')
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="label-xs">Template Actions</p>
        {sessionCount > 0 && (
          <span className="text-[10px] text-text-muted font-mono">
            Used in {sessionCount} session{sessionCount === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-status-red/5 border border-status-red/20 text-xs text-status-red">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {view === 'idle' && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setView('confirm_archive')}
            className="btn-ghost inline-flex items-center gap-1.5 text-xs px-3 py-1.5"
            disabled={isPending}
          >
            <Archive className="w-3.5 h-3.5" />
            Archive Template
          </button>
          {sessionCount === 0 ? (
            <button
              onClick={() => setView('confirm_delete')}
              className="btn-danger inline-flex items-center gap-1.5 text-xs px-3 py-1.5"
              disabled={isPending}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Template
            </button>
          ) : (
            <span className="text-[11px] text-text-muted">
              Delete unavailable — archive instead to preserve session history.
            </span>
          )}
        </div>
      )}

      {view === 'confirm_archive' && (
        <div className="rounded-lg border border-border bg-surface-raised px-4 py-3 space-y-3">
          <div className="flex items-start gap-2">
            <Archive className="w-3.5 h-3.5 text-text-secondary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-text-primary">Archive "{templateName}"?</p>
              {sessionCount > 0 ? (
                <p className="text-[11px] text-text-secondary">
                  This template has been used in {sessionCount} session{sessionCount === 1 ? '' : 's'}.
                  Archiving preserves all history, sessions, and reports. The template will no longer appear as active.
                </p>
              ) : (
                <p className="text-[11px] text-text-secondary">
                  This template has no sessions. Archiving marks it inactive while preserving the template definition.
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleArchive}
              disabled={isPending}
              className="btn-ghost inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border-border"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {isPending ? 'Archiving…' : 'Yes, Archive'}
            </button>
            <button
              onClick={() => setView('idle')}
              disabled={isPending}
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary px-2 py-1.5 transition-colors"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {view === 'confirm_delete' && (
        <div className="rounded-lg border border-status-red/20 bg-status-red/5 px-4 py-3 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-status-red shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-status-red">Delete "{templateName}"?</p>
              <p className="text-[11px] text-status-red/80">
                This permanently removes the template and all its blocks. This cannot be undone.
                Only allowed because this template has no sessions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="btn-danger inline-flex items-center gap-1.5 text-xs px-3 py-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isPending ? 'Deleting…' : 'Yes, Delete Permanently'}
            </button>
            <button
              onClick={() => setView('idle')}
              disabled={isPending}
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary px-2 py-1.5 transition-colors"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
