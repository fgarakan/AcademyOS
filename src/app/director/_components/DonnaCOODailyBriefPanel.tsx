import Link from 'next/link'
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import type { COODailyBrief, COOBriefSection, COOBriefItem, COOBriefUrgency } from '@/lib/donna/dailyBrief/donnaDailyCOOAggregator'

// ── Urgency styling ────────────────────────────────────────────────────────────

const URGENCY_DOT: Record<COOBriefUrgency, string> = {
  critical: 'bg-status-red',
  high:     'bg-status-orange',
  medium:   'bg-yellow-400',
  low:      'bg-text-muted',
}

const STATUS_BADGE: Record<COODailyBrief['overallStatus'], { label: string; classes: string }> = {
  critical:  { label: 'Needs Attention', classes: 'bg-status-red/10 border-status-red/20 text-status-red' },
  attention: { label: 'Items to Review', classes: 'bg-status-orange/10 border-status-orange/20 text-status-orange' },
  on_track:  { label: 'On Track', classes: 'bg-status-green/10 border-status-green/20 text-status-green' },
  no_data:   { label: 'No Data Yet', classes: 'bg-surface-raised border-border text-text-muted' },
}

// ── Item row ───────────────────────────────────────────────────────────────────

function BriefItemRow({ item }: { item: COOBriefItem }) {
  return (
    <div className="flex items-start gap-2.5 py-2.5 group">
      <span className={`w-2 h-2 rounded-full shrink-0 mt-[5px] ${URGENCY_DOT[item.urgency]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-text-primary leading-snug">{item.label}</p>
        {item.detail && (
          <p className="text-[11px] text-text-muted mt-0.5 leading-snug">{item.detail}</p>
        )}
      </div>
      <Link
        href={item.actionHref}
        className="shrink-0 text-[11px] font-semibold text-lime hover:opacity-80 transition-opacity whitespace-nowrap flex items-center gap-0.5"
      >
        {item.actionLabel} <ArrowRight className="w-2.5 h-2.5" />
      </Link>
    </div>
  )
}

// ── Section ────────────────────────────────────────────────────────────────────

function BriefSection({ section }: { section: COOBriefSection }) {
  return (
    <div className="space-y-0.5">
      <p className="label-xs">{section.title}</p>
      {section.items.length === 0 ? (
        <div className="flex items-center gap-2 py-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
          <p className="text-[11px] text-text-muted leading-snug">{section.clearMessage}</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {section.items.map(item => (
            <BriefItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Top 3 actions ──────────────────────────────────────────────────────────────

function Top3Actions({ actions }: { actions: COOBriefItem[] }) {
  if (actions.length === 0) return null

  return (
    <div className="space-y-1.5 pt-0.5">
      <p className="label-xs">Recommended Next Actions</p>
      <div className="space-y-1">
        {actions.map((action, i) => (
          <Link
            key={action.id}
            href={action.actionHref}
            className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-surface-raised px-3 py-2 hover:border-lime/30 hover:bg-lime/[0.03] transition-colors group"
          >
            <span className="font-mono text-[11px] font-bold text-text-muted shrink-0 w-4 text-center">
              {i + 1}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${URGENCY_DOT[action.urgency]}`} />
            <span className="flex-1 text-[12px] text-text-primary leading-snug">{action.label}</span>
            <span className="text-[11px] font-semibold text-lime group-hover:opacity-80 shrink-0 flex items-center gap-0.5 whitespace-nowrap">
              {action.actionLabel} <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Main panel ─────────────────────────────────────────────────────────────────

interface Props {
  brief: COODailyBrief
}

export function DonnaCOODailyBriefPanel({ brief }: Props) {
  const badge = STATUS_BADGE[brief.overallStatus]
  const borderClass = brief.overallStatus === 'critical'
    ? 'border-status-red/20'
    : brief.overallStatus === 'attention'
      ? 'border-lime/15'
      : 'border-border'

  const { sections } = brief
  const allSectionsClear = Object.values(sections).every(s => s.items.length === 0)

  return (
    <div
      className={`rounded-2xl border ${borderClass} bg-surface overflow-hidden`}
      data-donna-focus-id="donna-coo-daily-brief"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
          <span className="text-[10px] uppercase tracking-widest text-lime font-semibold">
            DONNA · Daily Brief
          </span>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.classes}`}>
          {badge.label}
        </span>
      </div>

      {/* Opening statement */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[13px] font-semibold text-text-primary leading-snug">
          {brief.openingStatement}
        </p>
        {brief.totalAttentionItems > 0 && (
          <p className="text-[11px] text-text-muted mt-0.5">
            {brief.totalAttentionItems} item{brief.totalAttentionItems !== 1 ? 's' : ''} across {
              Object.values(sections).filter(s => s.items.length > 0).length
            } {Object.values(sections).filter(s => s.items.length > 0).length === 1 ? 'area' : 'areas'}
          </p>
        )}
      </div>

      {/* Sections — only render non-clear or always-visible ones */}
      {!allSectionsClear ? (
        <div className="px-4 space-y-4 pb-4">
          {/* Always show Today's Priority */}
          <BriefSection section={sections.todayPriority} />

          {/* Watch List — show if has items or no other urgent items */}
          {(sections.watchList.items.length > 0 || sections.todayPriority.items.length === 0) && (
            <BriefSection section={sections.watchList} />
          )}

          {/* Decisions Waiting — show if has items */}
          {sections.decisionsWaiting.items.length > 0 && (
            <BriefSection section={sections.decisionsWaiting} />
          )}

          {/* Parent & Coach Follow-up — show if has items */}
          {sections.parentCoachFollowUp.items.length > 0 && (
            <BriefSection section={sections.parentCoachFollowUp} />
          )}

          {/* Setup & Curriculum — show if has items */}
          {sections.setupCurriculum.items.length > 0 && (
            <BriefSection section={sections.setupCurriculum} />
          )}

          {/* Top 3 Actions */}
          {brief.top3Actions.length > 0 && (
            <Top3Actions actions={brief.top3Actions} />
          )}
        </div>
      ) : (
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
            <p className="text-[12px] text-text-secondary leading-snug">
              All clear. No pending reviews, no development concerns, no setup gaps.
            </p>
          </div>
          {brief.missingDataNotes.length > 0 && (
            <p className="text-[11px] text-text-muted leading-snug">
              {brief.missingDataNotes.join(' ')}
            </p>
          )}
        </div>
      )}

      {/* Missing data disclosure — shown at bottom when relevant */}
      {!allSectionsClear && brief.missingDataNotes.length > 0 && (
        <div className="px-4 pb-3 flex items-start gap-2">
          <AlertTriangle className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-muted leading-relaxed">
            {brief.missingDataNotes.join(' ')}
          </p>
        </div>
      )}
    </div>
  )
}
