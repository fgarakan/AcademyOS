'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { GitBranch, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { createAcademyCurriculumCloneAction } from '@/lib/actions/academyCurriculumClone'
import Link from 'next/link'

interface AcademyVersionData {
  id: string
  name: string
  status: string
  version_number: number
  cloned_from_global_at: string | null
  activated_at: string | null
  override_count: number
}

interface Props {
  version: AcademyVersionData | null
}

export function AcademyCurriculumVersionCard({ version }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; error: string | null } | null>(null)

  function handleCreate() {
    startTransition(async () => {
      const res = await createAcademyCurriculumCloneAction()
      setResult({ ok: res.ok, error: res.error })
      if (res.ok) router.refresh()
    })
  }

  const statusColor =
    version?.status === 'active' ? 'text-status-green' :
    version?.status === 'archived' ? 'text-text-muted' :
    'text-status-orange'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-lime" />
          <p className="label-xs">Academy Curriculum Version</p>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Your academy has its own curriculum version — a layer on top of the global spine.
          Customizations are stored as overrides and must be approved before taking effect.
        </p>

        {version ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <p className="text-[11px] text-text-muted mb-0.5">Version</p>
                <p className="text-sm font-semibold text-text-primary">{version.name}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-muted mb-0.5">Status</p>
                <p className={`text-sm font-mono font-semibold ${statusColor}`}>
                  {version.status}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-text-muted mb-0.5">Version number</p>
                <p className="text-lg font-mono font-bold text-lime">{version.version_number}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-muted mb-0.5">Active overrides</p>
                <p className="text-lg font-mono font-bold text-lime">{version.override_count}</p>
              </div>
            </div>
            {version.activated_at && (
              <p className="text-[11px] text-text-muted">
                Activated{' '}
                {new Date(version.activated_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </p>
            )}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
              <CheckCircle className="w-3 h-3 text-status-green shrink-0" />
              <span>Your version is separate from the global curriculum. Changes are tracked as overrides.</span>
            </div>
            <Link
              href="/director/curriculum/academy-version"
              className="inline-flex items-center gap-1.5 text-[11px] text-text-muted hover:text-lime transition-colors"
            >
              View version details &amp; overrides <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-status-orange/5 border border-status-orange/20 text-[11px] text-status-orange">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
              <span>
                No academy curriculum version found. Create one to start tracking
                academy-specific customizations.
              </span>
            </div>
            {result?.error && (
              <p className="text-xs text-status-red">{result.error}</p>
            )}
            {result?.ok && (
              <p className="text-xs text-status-green">Version created. Refreshing…</p>
            )}
            <button
              onClick={handleCreate}
              disabled={isPending}
              className="btn-lime text-xs px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Creating…' : 'Create Academy Curriculum Version'}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
