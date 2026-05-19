import { Lock, Eye, MessageSquare, Link2, Shield, BarChart2, Flag, FileText } from 'lucide-react'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import type { EvidenceTimelineItem } from '@/lib/players/playerEvidenceRepository'
import { formatDate } from '@/lib/utils'

interface Props {
  items: EvidenceTimelineItem[]
  isSchemaMissing?: boolean
}

const TYPE_ICON: Record<EvidenceTimelineItem['type'], React.ElementType> = {
  coach_observation:    MessageSquare,
  requirement_evidence: Link2,
  gate_update:          Shield,
  assessment:           BarChart2,
  priority_added:       Flag,
  dev_summary_updated:  FileText,
}

const TYPE_COLOR: Record<EvidenceTimelineItem['type'], string> = {
  coach_observation:    'text-text-muted',
  requirement_evidence: 'text-status-blue',
  gate_update:          'text-lime',
  assessment:           'text-status-orange',
  priority_added:       'text-status-green',
  dev_summary_updated:  'text-text-muted',
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  return `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function InternalPill() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-border text-text-muted bg-surface-raised">
      <Lock className="w-2.5 h-2.5" /> Internal
    </span>
  )
}

function ParentSafePill() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-status-blue/20 text-status-blue bg-status-blue/5">
      <Eye className="w-2.5 h-2.5" /> Parent-safe
    </span>
  )
}

function TimelineRow({ item }: { item: EvidenceTimelineItem }) {
  const Icon = TYPE_ICON[item.type] ?? MessageSquare
  const iconColor = TYPE_COLOR[item.type] ?? 'text-text-muted'

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className={`mt-0.5 shrink-0 ${iconColor}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
          <span className="text-sm text-text-primary font-medium leading-snug">{item.label}</span>
          {item.isInternalOnly && <InternalPill />}
          {item.isParentSafe && !item.isInternalOnly && <ParentSafePill />}
        </div>
        {item.detail && (
          <p className="text-[11px] text-text-muted leading-relaxed">{item.detail}</p>
        )}
        <p className="text-[10px] text-text-muted mt-0.5">{formatDate(item.date)}</p>
      </div>
      <span className="text-[10px] text-text-muted shrink-0 mt-0.5">{item.sourceLabel}</span>
    </div>
  )
}

function WeekGroup({ label, items }: { label: string; items: EvidenceTimelineItem[] }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1 pt-2 first:pt-0">{label}</p>
      {items.map(item => <TimelineRow key={item.id} item={item} />)}
    </div>
  )
}

export function PlayerEvidenceTimeline({ items, isSchemaMissing }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <p className="label-xs">Evidence Timeline</p>
          <span className="text-[10px] text-text-muted">
            {items.length} event{items.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-[10px] text-text-muted mt-0.5">
          Multi-source evidence record — observations, requirement links, gate updates, assessments.
          Director-only view.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {isSchemaMissing && (
          <p className="text-[11px] text-status-orange">
            Some evidence tables are not yet fully migrated. Partial data may be shown.
          </p>
        )}
        {items.length === 0 && !isSchemaMissing ? (
          <EmptyState
            icon={<Shield className="w-5 h-5" />}
            title="No evidence recorded yet"
            description="Observations, requirement links, gate updates, and assessments will appear here as they are added."
            className="py-8"
          />
        ) : items.length >= 10 ? (
          (() => {
            const grouped = new Map<string, EvidenceTimelineItem[]>()
            for (const item of items) {
              const label = getWeekLabel(item.date)
              if (!grouped.has(label)) grouped.set(label, [])
              grouped.get(label)!.push(item)
            }
            return (
              <div>
                {Array.from(grouped.entries()).map(([label, groupItems]) => (
                  <WeekGroup key={label} label={label} items={groupItems} />
                ))}
              </div>
            )
          })()
        ) : (
          <div>
            {items.map(item => <TimelineRow key={item.id} item={item} />)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
