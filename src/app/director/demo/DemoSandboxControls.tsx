'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Trash2, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { createOrResetDemoSandboxAction, resetDemoSandboxAction } from './demoSandboxActions'
import type { DemoSandboxStatus } from './demoSandboxActions'

interface Props {
  status: DemoSandboxStatus | null
}

type Phase = 'idle' | 'seeding' | 'resetting' | 'done_seed' | 'done_reset' | 'error'

export function DemoSandboxControls({ status }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  const sandboxExists = status && (status.playerCount > 0 || status.groupExists || status.sessionExists)

  async function handleCreate() {
    setPhase('seeding')
    setMessage(null)
    setWarnings([])
    const result = await createOrResetDemoSandboxAction()
    if (!result.ok) {
      setPhase('error')
      setMessage(result.error ?? 'Failed to create demo sandbox.')
      return
    }
    const c = result.created!
    const parts = []
    if (c.players > 0) parts.push(`${c.players} player${c.players !== 1 ? 's' : ''} created`)
    if (c.group) parts.push('group created')
    if (c.template) parts.push('template created')
    if (c.session) parts.push('session created')
    if (c.devProfiles > 0) parts.push(`${c.devProfiles} dev profiles created`)
    if (c.priorities > 0) parts.push(`${c.priorities} priorities created`)
    if (c.curriculumVersion) parts.push('curriculum version created')
    setMessage(parts.length > 0 ? parts.join(' · ') : 'Demo sandbox already up to date.')
    setWarnings(result.warnings ?? [])
    setPhase('done_seed')
    setTimeout(() => router.refresh(), 1800)
  }

  async function handleDelete() {
    if (!deleteConfirmed) return
    setPhase('resetting')
    setMessage(null)
    setWarnings([])
    const result = await resetDemoSandboxAction(true)
    if (!result.ok) {
      setPhase('error')
      setMessage(result.error ?? 'Failed to delete demo data.')
      return
    }
    const d = result.deleted!
    const parts = []
    if (d.players > 0) parts.push(`${d.players} player${d.players !== 1 ? 's' : ''} deleted`)
    if (d.groups > 0) parts.push(`${d.groups} group${d.groups !== 1 ? 's' : ''} deleted`)
    if (d.templates > 0) parts.push(`${d.templates} template${d.templates !== 1 ? 's' : ''} deleted`)
    if (d.sessions > 0) parts.push(`${d.sessions} session${d.sessions !== 1 ? 's' : ''} deleted`)
    if (d.curriculumVersions > 0) parts.push(`${d.curriculumVersions} curriculum version${d.curriculumVersions !== 1 ? 's' : ''} deleted`)
    if (d.suggestions > 0) parts.push(`${d.suggestions} suggestion${d.suggestions !== 1 ? 's' : ''} deleted`)
    setMessage(parts.length > 0 ? parts.join(' · ') : 'No demo records found to delete.')
    setDeleteConfirmed(false)
    setPhase('done_reset')
    setTimeout(() => router.refresh(), 1800)
  }

  return (
    <Card>
      <CardContent className="py-5 space-y-4">
        <p className="label-xs">Sandbox Controls</p>

        {/* Create / Reset */}
        <div className="flex items-start gap-3 flex-wrap">
          <button
            onClick={handleCreate}
            disabled={phase === 'seeding' || phase === 'resetting'}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-lime text-base font-semibold hover:bg-lime/90 transition-colors disabled:opacity-50"
          >
            {phase === 'seeding' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : sandboxExists ? (
              <RefreshCw className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {sandboxExists ? 'Reset Demo Sandbox' : 'Create Demo Sandbox'}
          </button>

          {sandboxExists && (
            <button
              onClick={handleDelete}
              disabled={!deleteConfirmed || phase === 'seeding' || phase === 'resetting'}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-status-red/40 text-status-red hover:bg-status-red/10 transition-colors disabled:opacity-40"
            >
              {phase === 'resetting' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete Demo Data
            </button>
          )}
        </div>

        {/* Confirmation checkbox (only when sandbox exists) */}
        {sandboxExists && (
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={deleteConfirmed}
              onChange={e => setDeleteConfirmed(e.target.checked)}
              className="mt-0.5 accent-status-red"
            />
            <span className="text-xs text-text-muted leading-relaxed">
              I understand this only deletes records labeled as demo/sample data. Real player records will not be affected.
            </span>
          </label>
        )}

        {/* Result message */}
        {message && (
          <div className={`flex items-start gap-2 text-xs px-3 py-2.5 rounded-lg border ${
            phase === 'error'
              ? 'bg-status-red/10 border-status-red/30 text-status-red'
              : phase === 'done_reset'
              ? 'bg-surface-raised border-border text-text-secondary'
              : 'bg-status-green/10 border-status-green/30 text-status-green'
          }`}>
            {phase === 'error'
              ? <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              : <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
            <span>{message}</span>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-1.5">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg bg-status-orange/10 border border-status-orange/30 text-status-orange">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-text-muted">
          Demo records are labeled <code className="text-lime/80 font-mono">[DEMO]</code> and visible in sessions, players, and templates lists.
          Delete removes only demo-tagged records — real academy data is never affected.
        </p>
      </CardContent>
    </Card>
  )
}
