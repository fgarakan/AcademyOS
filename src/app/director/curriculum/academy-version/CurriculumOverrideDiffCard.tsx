import { AlertTriangle, ArrowRight, Layers, Tag, MapPin, Activity } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { RollbackOverrideButton } from './RollbackOverrideButton'

interface OverrideRow {
  id: string
  target_type: string
  override_type: string
  scope: string
  pathway: string | null
  original_snapshot: Record<string, unknown> | null
  proposed_change: Record<string, unknown>
  applied_change: Record<string, unknown> | null
  override_reason: string | null
  source: string
  raw_input: string | null
  status: string
  created_at: string
  applied_at: string | null
  approved_at: string | null
}

interface Props {
  override: OverrideRow
}

const STATUS_COLORS: Record<string, string> = {
  applied:      'text-status-green',
  approved:     'text-lime',
  pending_review: 'text-status-orange',
  rolled_back:  'text-text-muted',
  rejected:     'text-status-red',
  draft:        'text-text-muted',
}

export function CurriculumOverrideDiffCard({ override: ov }: Props) {
  const statusColor = STATUS_COLORS[ov.status] ?? 'text-text-secondary'

  const parsedLevel = ov.proposed_change?.parsed_level as string | null | undefined
  const parsedFocus = Array.isArray(ov.proposed_change?.parsed_focus)
    ? (ov.proposed_change.parsed_focus as string[])
    : []
  const summary = typeof ov.proposed_change?.summary === 'string' ? ov.proposed_change.summary : null

  const hasOriginalSnapshot = ov.original_snapshot && Object.keys(ov.original_snapshot).length > 0

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-[10px] uppercase tracking-widest font-medium ${statusColor}`}>
                {ov.status}
              </p>
              <span className="text-[10px] text-text-muted">·</span>
              <p className="text-[10px] uppercase tracking-widest text-text-muted">
                {ov.override_type} · {ov.target_type} · {ov.scope}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-text-muted mt-1">
              {ov.applied_at && (
                <span>Applied {new Date(ov.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              )}
              {!ov.applied_at && ov.approved_at && (
                <span>Approved {new Date(ov.approved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              )}
              <span>{ov.source}</span>
            </div>
          </div>

          {ov.status === 'applied' && (
            <RollbackOverrideButton overrideId={ov.id} />
          )}
        </div>

        {/* Raw director input */}
        {ov.raw_input && (
          <div className="space-y-1">
            <p className="label-xs">Director input</p>
            <p className="text-xs text-text-primary bg-surface-raised rounded-lg px-3 py-2 border border-border leading-relaxed italic">
              &ldquo;{ov.raw_input}&rdquo;
            </p>
          </div>
        )}

        {/* Parsed fields */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {parsedLevel && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Layers className="w-3 h-3 text-text-muted" />
                <p className="label-xs">Level</p>
              </div>
              <p className="text-xs text-text-primary">{parsedLevel}</p>
            </div>
          )}
          {ov.pathway && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Tag className="w-3 h-3 text-text-muted" />
                <p className="label-xs">Pathway</p>
              </div>
              <p className="text-xs text-text-primary">{ov.pathway}</p>
            </div>
          )}
          {parsedFocus.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Activity className="w-3 h-3 text-text-muted" />
                <p className="label-xs">Focus</p>
              </div>
              <p className="text-xs text-text-primary">{parsedFocus.join(', ')}</p>
            </div>
          )}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-text-muted" />
              <p className="label-xs">Scope</p>
            </div>
            <p className="text-xs text-text-primary">{ov.scope}</p>
          </div>
        </div>

        {/* Before / After diff */}
        <div className="space-y-2">
          <p className="label-xs">Change</p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-start">
            <div className="rounded-lg bg-surface-raised border border-border px-3 py-2 space-y-1">
              <p className="label-xs text-text-muted">Before</p>
              {hasOriginalSnapshot ? (
                <pre className="text-[11px] text-text-secondary whitespace-pre-wrap break-all">
                  {JSON.stringify(ov.original_snapshot, null, 2)}
                </pre>
              ) : (
                <p className="text-[11px] text-text-muted italic">
                  Global default (no snapshot captured at override time)
                </p>
              )}
            </div>
            <div className="flex items-center justify-center py-2">
              <ArrowRight className="w-4 h-4 text-text-muted" />
            </div>
            <div className="rounded-lg bg-surface-raised border border-lime/20 px-3 py-2 space-y-1">
              <p className="label-xs text-lime">After (applied change)</p>
              <p className="text-[11px] text-text-primary leading-relaxed">
                {summary ?? JSON.stringify(ov.applied_change ?? ov.proposed_change, null, 2)}
              </p>
            </div>
          </div>
        </div>

        {/* Downstream impact preview */}
        <div className="space-y-1">
          <p className="label-xs">Downstream impact preview</p>
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
            <span>
              Impact partially inferred. This override affects template block population, coach
              session cues, and player requirement interpretation for{' '}
              {parsedLevel ?? 'the affected level'}
              {parsedFocus.length > 0 ? ` (focus: ${parsedFocus.join(', ')})` : ''}.
              Parent/player-safe summaries are not yet override-aware (V1 limitation).
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
