'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Clock, Search, Layers, AlertCircle, CheckCircle } from 'lucide-react'
import { Modal } from '@/components/ui'
import { addBlockContentAction } from './addBlockContentAction'
import { removeBlockContentAction } from './removeBlockContentAction'

// ─── Shared type definitions ───────────────────────────────────────────────────

export interface AssignedItem {
  cctbId: string
  contentItemId: string | null
  drillId: string | null
  title: string
  contentType: string
  domain: string | null
  sessionBlockHint: string | null
  durationMin: number | null
  orderIndex: number
}

export interface AvailableContentItem {
  id: string
  title: string
  contentType: string
  domain: string | null
  sessionBlockHint: string | null
  durationMin: number | null
  isCoachOnly: boolean
}

interface Props {
  blockId: string
  blockName: string
  templateId: string
  initialAssigned: AssignedItem[]
  available: AvailableContentItem[]
}

// ─── Label helpers ─────────────────────────────────────────────────────────────

const CONTENT_TYPE_LABELS: Record<string, string> = {
  drill:                'Drill',
  warmup:               'Warm-Up',
  cooldown:             'Cool-Down',
  game:                 'Game',
  skill:                'Skill',
  tactical:             'Tactical',
  tactical_game:        'Tactical Game',
  situational:          'Situational',
  match_play_theme:     'Match-Play Theme',
  mental_skill:         'Mental Skill',
  competition_behavior: 'Competition',
  coach_cue:            'Coach Cue',
  success_criteria:     'Success Criteria',
  progression:          'Progression',
  regression:           'Regression',
  player_mission:       'Player Mission',
  parent_guidance:      'Parent Guidance',
}

function typeLabel(t: string) {
  return CONTENT_TYPE_LABELS[t] ?? t.replace(/_/g, ' ')
}

const CONTENT_TYPE_COLORS: Record<string, string> = {
  drill:                'border-lime/20 text-lime',
  tactical_game:        'border-status-blue/20 text-status-blue',
  situational:          'border-status-orange/20 text-status-orange',
  match_play_theme:     'border-purple-500/20 text-purple-400',
  mental_skill:         'border-status-green/20 text-status-green',
  competition_behavior: 'border-status-orange/20 text-status-orange',
  warmup:               'border-border text-text-secondary',
  cooldown:             'border-border text-text-secondary',
  coach_cue:            'border-lime/10 text-lime',
  success_criteria:     'border-status-green/10 text-status-green',
  progression:          'border-lime/20 text-lime',
  regression:           'border-border text-text-muted',
  player_mission:       'border-status-blue/10 text-status-blue',
  parent_guidance:      'border-border text-text-muted',
}

function typeBadge(t: string) {
  return CONTENT_TYPE_COLORS[t] ?? 'border-border text-text-muted'
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function BlockContentPickerCard({
  blockId,
  blockName,
  templateId,
  initialAssigned,
  available,
}: Props) {
  const router = useRouter()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterDomain, setFilterDomain] = useState('')
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const [lastAdded, setLastAdded] = useState<string | null>(null)

  // Build set of already-assigned content item IDs for duplicate prevention
  const assignedContentIds = useMemo(
    () => new Set(initialAssigned.map(a => a.contentItemId).filter(Boolean) as string[]),
    [initialAssigned],
  )

  // Unique values for filter dropdowns
  const allTypes = useMemo(
    () => Array.from(new Set(available.map(i => i.contentType))).sort(),
    [available],
  )
  const allDomains = useMemo(
    () => Array.from(new Set(available.map(i => i.domain).filter(Boolean) as string[])).sort(),
    [available],
  )

  // Filtered available items
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return available.filter(item => {
      if (assignedContentIds.has(item.id)) return false
      if (filterType && item.contentType !== filterType) return false
      if (filterDomain && item.domain !== filterDomain) return false
      if (q && !item.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [available, assignedContentIds, filterType, filterDomain, search])

  function handleAdd(contentItemId: string, title: string) {
    setActionError(null)
    startTransition(async () => {
      const res = await addBlockContentAction(templateId, blockId, contentItemId)
      if (!res.ok) {
        setActionError(res.error ?? 'Failed to add content')
      } else {
        setLastAdded(title)
        router.refresh()
      }
    })
  }

  function handleRemove(cctbId: string) {
    setActionError(null)
    setLastAdded(null)
    startTransition(async () => {
      const res = await removeBlockContentAction(cctbId, templateId)
      if (!res.ok) {
        setActionError(res.error ?? 'Failed to remove content')
      } else {
        router.refresh()
      }
    })
  }

  function openPicker() {
    setSearch('')
    setFilterType('')
    setFilterDomain('')
    setActionError(null)
    setLastAdded(null)
    setPickerOpen(true)
  }

  return (
    <div className="space-y-2">
      {/* Assigned content list */}
      {initialAssigned.length === 0 ? (
        <p className="text-[11px] text-text-muted italic pl-7">
          No curriculum content assigned yet. Add a drill, game, cue, or focus item to guide this block.
        </p>
      ) : (
        <ul className="space-y-1.5 pl-7">
          {initialAssigned
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map(item => (
              <li
                key={item.cctbId}
                className="flex items-center gap-2 group"
              >
                <span className="text-[10px] font-mono text-text-muted w-4 text-right shrink-0">
                  {item.orderIndex}.
                </span>
                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                  <p className="text-[11px] font-medium text-text-primary truncate">
                    {item.title}
                  </p>
                  <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${typeBadge(item.contentType)}`}>
                    {typeLabel(item.contentType)}
                  </span>
                  {item.domain && (
                    <span className="text-[10px] text-text-muted">{item.domain}</span>
                  )}
                  {item.durationMin != null && (
                    <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />{item.durationMin}m
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(item.cctbId)}
                  disabled={isPending}
                  title="Remove"
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-status-red/10 text-text-muted hover:text-status-red disabled:opacity-30"
                >
                  <X className="w-3 h-3" />
                </button>
              </li>
            ))}
        </ul>
      )}

      {/* Action error */}
      {actionError && (
        <div className="pl-7 flex items-start gap-1.5">
          <AlertCircle className="w-3 h-3 text-status-red shrink-0 mt-0.5" />
          <p className="text-[10px] text-status-red leading-snug">{actionError}</p>
        </div>
      )}

      {/* Last added confirmation */}
      {lastAdded && !actionError && (
        <div className="pl-7 flex items-start gap-1.5">
          <CheckCircle className="w-3 h-3 text-status-green shrink-0 mt-0.5" />
          <p className="text-[10px] text-status-green leading-snug">
            &ldquo;{lastAdded}&rdquo; added.
          </p>
        </div>
      )}

      {/* Add Content button */}
      <div className="pl-7">
        <button
          onClick={openPicker}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-[10px] text-text-muted hover:text-lime border border-dashed border-border hover:border-lime/30 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40"
        >
          <Plus className="w-3 h-3" />
          Add Content
        </button>
      </div>

      {/* Picker modal */}
      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={`Add Content — ${blockName}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title…"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/30 transition-colors"
              />
            </div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="text-xs bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-text-secondary focus:outline-none focus:border-lime/30 transition-colors"
            >
              <option value="">All types</option>
              {allTypes.map(t => (
                <option key={t} value={t}>{typeLabel(t)}</option>
              ))}
            </select>
            <select
              value={filterDomain}
              onChange={e => setFilterDomain(e.target.value)}
              className="text-xs bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-text-secondary focus:outline-none focus:border-lime/30 transition-colors"
            >
              <option value="">All domains</option>
              {allDomains.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Count */}
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-text-muted" />
            <p className="text-[10px] text-text-muted">
              {filtered.length} item{filtered.length !== 1 ? 's' : ''}
              {(search || filterType || filterDomain) ? ' matching' : ' available'}
            </p>
          </div>

          {/* Content list */}
          {filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-text-secondary">No content matches your filters.</p>
              <p className="text-xs text-text-muted mt-1">Try clearing the search or filters.</p>
            </div>
          ) : (
            <ul className="space-y-1.5 max-h-[400px] overflow-y-auto -mx-1 px-1">
              {filtered.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => handleAdd(item.id, item.title)}
                    disabled={isPending}
                    className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border hover:border-lime/30 hover:bg-surface-raised transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <Plus className="w-3.5 h-3.5 text-text-muted group-hover:text-lime shrink-0 mt-0.5 transition-colors" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-medium text-text-primary">{item.title}</p>
                        <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${typeBadge(item.contentType)}`}>
                          {typeLabel(item.contentType)}
                        </span>
                        {item.isCoachOnly && (
                          <span className="text-[9px] text-text-muted border border-border px-1.5 py-0.5 rounded">
                            Coach only
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {item.domain && (
                          <span className="text-[10px] text-text-muted">{item.domain}</span>
                        )}
                        {item.sessionBlockHint && (
                          <span className="text-[10px] text-text-muted">· {item.sessionBlockHint}</span>
                        )}
                        {item.durationMin != null && (
                          <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                            · <Clock className="w-2.5 h-2.5 ml-0.5" />{item.durationMin}m
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="text-[10px] text-text-muted pt-2 border-t border-border">
            Content items are internal and not visible to players or parents until explicitly published.
          </p>
        </div>
      </Modal>
    </div>
  )
}
