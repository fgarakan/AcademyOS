'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, Plus, X, Sparkles, AlertTriangle,
  CheckCircle2, Clock, ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  createClassTemplateWithBlocksAction,
  type BlockDraftInput,
} from '../createClassTemplateWithBlocksAction'

// ── Block catalog ──────────────────────────────────────────────
type DbBlockType =
  | 'warm_up' | 'technical' | 'tactical' | 'movement'
  | 'fitness' | 'competition' | 'mental' | 'cool_down' | 'free'

interface CatalogBlock {
  id: string
  type: DbBlockType
  label: string
  defaultMin: number
  colorClass: string
  badgeClass: string
}

const BLOCK_CATALOG: CatalogBlock[] = [
  { id: 'warm_up',    type: 'warm_up',     label: 'Warm-Up',               defaultMin: 10, colorClass: 'bg-status-orange/10 border-status-orange/30', badgeClass: 'bg-status-orange/15 text-status-orange border-status-orange/30' },
  { id: 'technical',  type: 'technical',   label: 'Technical Skills',      defaultMin: 15, colorClass: 'bg-status-blue/8  border-status-blue/25',    badgeClass: 'bg-status-blue/15 text-status-blue border-status-blue/30' },
  { id: 'drills',     type: 'technical',   label: 'Drills',                defaultMin: 10, colorClass: 'bg-status-blue/5  border-status-blue/20',    badgeClass: 'bg-status-blue/10 text-status-blue border-status-blue/20' },
  { id: 'tactical',   type: 'tactical',    label: 'Tactical Patterns',     defaultMin: 10, colorClass: 'bg-lime/6 border-lime/20',                   badgeClass: 'bg-lime/10 text-lime border-lime/25' },
  { id: 'games',      type: 'competition', label: 'Games',                 defaultMin: 10, colorClass: 'bg-status-green/8  border-status-green/25',  badgeClass: 'bg-status-green/15 text-status-green border-status-green/30' },
  { id: 'point_play', type: 'competition', label: 'Point Play',            defaultMin: 10, colorClass: 'bg-status-green/10 border-status-green/30',  badgeClass: 'bg-status-green/20 text-status-green border-status-green/35' },
  { id: 'match_play', type: 'competition', label: 'Match Play',            defaultMin: 10, colorClass: 'bg-status-purple/8 border-status-purple/25', badgeClass: 'bg-status-purple/15 text-status-purple border-status-purple/30' },
  { id: 'assessment', type: 'mental',      label: 'Assessment Moment',     defaultMin:  5, colorClass: 'bg-status-red/8    border-status-red/25',    badgeClass: 'bg-status-red/15 text-status-red border-status-red/30' },
  { id: 'cool_down',  type: 'cool_down',   label: 'Reflection / Wrap-Up', defaultMin:  5, colorClass: 'bg-surface-raised border-border',             badgeClass: 'bg-surface-raised text-text-secondary border-border' },
]

// DNA approach ID → display label
const DNA_APPROACH_LABELS: Record<string, string> = {
  'technique-blocks':  'Technique Blocks',
  'live-ball-heavy':   'Live Ball Heavy',
  'constraint-games':  'Constraint Games',
  'point-play':        'Point Play Progression',
  'stations':          'Stations + Rotations',
  'assessment':        'Assessment Moments',
  'fitness-integrated': 'Fitness Integrated',
}

// ── Draft block state ──────────────────────────────────────────
let _uid = 0
function nextUid() { return String(++_uid) }

interface DraftBlock {
  uid: string
  catalogId: string
  type: DbBlockType
  label: string
  durationMin: number
  coachCue: string
  expanded: boolean
}

function makeDraftBlock(cat: CatalogBlock): DraftBlock {
  return {
    uid: nextUid(),
    catalogId: cat.id,
    type: cat.type,
    label: cat.label,
    durationMin: cat.defaultMin,
    coachCue: '',
    expanded: false,
  }
}

function findCatalog(id: string): CatalogBlock | undefined {
  return BLOCK_CATALOG.find(c => c.id === id)
}

// ── Selects ────────────────────────────────────────────────────
const TEMPLATE_TYPES = [
  'Weekly Class', 'Private Lesson', 'Camp',
  'Match Play', 'Tournament Prep', 'Assessment Day', 'Custom',
]
const BALL_LEVELS = [
  'Red Ball', 'Orange Ball', 'Green Ball',
  'Yellow Ball', 'High Performance', 'Mixed Level',
]
const GROUP_TYPES = [
  'Beginner', 'Intermediate', 'Advanced',
  'Competitive', 'Performance', 'Adult', 'Custom',
]

// ── Props ──────────────────────────────────────────────────────
interface Props {
  dnaSessionBlocks: string[]
  dnaDevelopmentPriorities: string[]
  hasDna: boolean
}

// ── Component ──────────────────────────────────────────────────
export function NewClassTemplateForm({ dnaSessionBlocks, dnaDevelopmentPriorities, hasDna }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Template basics
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [templateType, setTemplateType] = useState('')
  const [ballLevel, setBallLevel]     = useState('')
  const [groupType, setGroupType]     = useState('')
  const [totalMin, setTotalMin]       = useState<string>('60')

  // Block builder
  const [blocks, setBlocks]           = useState<DraftBlock[]>([])
  const [showCatalog, setShowCatalog] = useState(false)

  // ── Derived ──────────────────────────────────────────────────
  const totalMinNum   = parseInt(totalMin, 10) || 0
  const usedMin       = blocks.reduce((sum, b) => sum + b.durationMin, 0)
  const remaining     = totalMinNum - usedMin
  const overBudget    = totalMinNum > 0 && remaining < 0

  // ── Block actions ─────────────────────────────────────────────
  function addBlock(cat: CatalogBlock) {
    setBlocks(prev => [...prev, makeDraftBlock(cat)])
    setShowCatalog(false)
  }

  function removeBlock(uid: string) {
    setBlocks(prev => prev.filter(b => b.uid !== uid))
  }

  function updateBlock(uid: string, patch: Partial<DraftBlock>) {
    setBlocks(prev => prev.map(b => b.uid === uid ? { ...b, ...patch } : b))
  }

  function applyStandardStructure() {
    const duration = parseInt(totalMin, 10) || 60
    const standard60 = ['warm_up', 'technical', 'tactical', 'games', 'cool_down']
    const standard90 = ['warm_up', 'technical', 'drills', 'tactical', 'games', 'point_play', 'cool_down']
    const ids = duration >= 90 ? standard90 : standard60
    setBlocks(ids.map(id => {
      const cat = findCatalog(id)
      return makeDraftBlock(cat ?? BLOCK_CATALOG[0])
    }))
    setShowCatalog(false)
  }

  // ── Submit ────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Template name is required.'); return }
    setError(null)

    const blockInputs: BlockDraftInput[] = blocks.map(b => ({
      label: b.label,
      type:  b.type,
      durationMin: b.durationMin,
      coachCue: b.coachCue,
    }))

    startTransition(async () => {
      const result = await createClassTemplateWithBlocksAction({
        name:            name.trim(),
        description:     description.trim(),
        templateType,
        ballLevel,
        groupType,
        totalDurationMin: totalMinNum,
        blocks:          blockInputs,
      })

      if (!result.ok || !result.templateId) {
        setError(result.error ?? 'Failed to save draft.')
        return
      }

      router.push(`/director/class-templates/${result.templateId}`)
    })
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── DONNA Guidance Card ─────────────────────────────── */}
      <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-lime/15 border border-lime/30 flex items-center justify-center shrink-0 mt-0.5">
            <span className="font-bold text-lime text-[13px] leading-none select-none">D</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-semibold text-text-primary">DONNA</span>
              <Sparkles className="w-2.5 h-2.5 text-lime" />
            </div>
            {hasDna && dnaSessionBlocks.length > 0 ? (
              <>
                <p className="text-[12px] text-text-secondary leading-relaxed mb-2">
                  Your Academy DNA shows your preferred session approach. Use the block structure below to match it.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {dnaSessionBlocks.map(id => (
                    <span key={id} className="pill-cyan text-[10px]">
                      {DNA_APPROACH_LABELS[id] ?? id}
                    </span>
                  ))}
                </div>
                {dnaDevelopmentPriorities.length > 0 && (
                  <p className="text-[11px] text-text-muted">
                    Development focus: {dnaDevelopmentPriorities.slice(0, 3).join(', ')}
                    {dnaDevelopmentPriorities.length > 3 ? ' + more' : ''}
                  </p>
                )}
              </>
            ) : (
              <p className="text-[12px] text-text-secondary leading-relaxed">
                {hasDna
                  ? 'Your Academy DNA is saved. Add blocks below to define your class structure.'
                  : 'Once your Academy DNA is saved, I can show your session design preferences here.'}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-lime/15">
          <button
            type="button"
            onClick={applyStandardStructure}
            className="text-[11px] font-medium text-lime hover:text-lime/80 transition-colors"
          >
            Apply standard session structure
            {totalMin ? ` (${totalMin} min)` : ''}
            {' '}→
          </button>
          <span className="text-[11px] text-text-muted ml-2">Warm-Up · Technical · Tactical · Games · Wrap-Up</span>
        </div>
      </div>

      {/* ── Template Basics ──────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
          Template Basics
        </p>

        <div className="space-y-1.5">
          <label className="label-xs">Template Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Junior Intermediate Group Session"
            maxLength={100}
            disabled={isPending}
            className="input-base w-full"
          />
        </div>

        <div className="space-y-1.5">
          <label className="label-xs">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Briefly describe this template's purpose..."
            rows={2}
            maxLength={300}
            disabled={isPending}
            className="input-base w-full resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="label-xs">Template Type</label>
            <select value={templateType} onChange={e => setTemplateType(e.target.value)} disabled={isPending} className="input-base w-full">
              <option value="">Select type...</option>
              {TEMPLATE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="label-xs">Ball / Level Focus</label>
            <select value={ballLevel} onChange={e => setBallLevel(e.target.value)} disabled={isPending} className="input-base w-full">
              <option value="">Select level...</option>
              {BALL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="label-xs">Group Type</label>
            <select value={groupType} onChange={e => setGroupType(e.target.value)} disabled={isPending} className="input-base w-full">
              <option value="">Select group...</option>
              {GROUP_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="label-xs">Session Length (minutes)</label>
            <input
              type="number"
              min="0"
              max="240"
              value={totalMin}
              onChange={e => setTotalMin(e.target.value)}
              placeholder="e.g. 60"
              disabled={isPending}
              className="input-base w-full"
            />
          </div>
        </div>
      </div>

      {/* ── Block Builder ────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
              Session Block Structure
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Build the parts of your class. Coaches follow this on court.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Duration indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-raised border border-border">
              <Clock className="w-3 h-3 text-text-muted shrink-0" />
              <span className={`text-[11px] font-mono font-medium ${overBudget ? 'text-status-orange' : 'text-text-secondary'}`}>
                {usedMin} / {totalMinNum > 0 ? totalMinNum : '—'} min
              </span>
            </div>
          </div>
        </div>

        {overBudget && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-orange/8 border border-status-orange/25">
            <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0" />
            <p className="text-[11px] text-status-orange">
              Block total ({usedMin} min) exceeds session length ({totalMinNum} min) by {usedMin - totalMinNum} min.
            </p>
          </div>
        )}

        {/* Selected blocks */}
        {blocks.length > 0 && (
          <div className="space-y-2">
            {blocks.map((block, idx) => {
              const cat = findCatalog(block.catalogId)
              return (
                <div key={block.uid} className={`rounded-xl border px-3 py-3 ${cat?.colorClass ?? 'bg-surface-raised border-border'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-text-muted shrink-0 w-4 text-right">{idx + 1}</span>
                    <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 border ${cat?.badgeClass ?? ''}`}>
                      {block.type.replace('_', ' ')}
                    </span>
                    <span className="flex-1 min-w-0 text-xs font-semibold text-text-primary">
                      {block.label}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={block.durationMin}
                        onChange={e => updateBlock(block.uid, { durationMin: parseInt(e.target.value, 10) || 0 })}
                        disabled={isPending}
                        className="w-14 text-center text-xs bg-surface border border-border rounded-lg px-2 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-lime/30"
                      />
                      <span className="text-[10px] text-text-muted">min</span>
                      <button
                        type="button"
                        onClick={() => updateBlock(block.uid, { expanded: !block.expanded })}
                        className="p-1 rounded text-text-muted hover:text-text-secondary transition-colors"
                        aria-label={block.expanded ? 'Collapse' : 'Add coach cue'}
                      >
                        {block.expanded
                          ? <ChevronUp className="w-3.5 h-3.5" />
                          : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(block.uid)}
                        disabled={isPending}
                        className="p-1 rounded text-text-muted hover:text-status-red transition-colors"
                        aria-label="Remove block"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {block.expanded && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-2">
                      <div className="space-y-1">
                        <label className="label-xs">Coach Cue</label>
                        <input
                          type="text"
                          value={block.coachCue}
                          onChange={e => updateBlock(block.uid, { coachCue: e.target.value })}
                          placeholder="What should the coach focus on or say during this block?"
                          maxLength={200}
                          disabled={isPending}
                          className="input-base w-full text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add block */}
        {!showCatalog ? (
          <button
            type="button"
            onClick={() => setShowCatalog(true)}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-border hover:border-border-strong px-4 py-3 text-xs text-text-muted hover:text-text-secondary transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Block
          </button>
        ) : (
          <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Choose a block</p>
              <button type="button" onClick={() => setShowCatalog(false)} className="text-text-muted hover:text-text-secondary transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2">
              {BLOCK_CATALOG.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => addBlock(cat)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-surface transition-colors group"
                >
                  <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 border ${cat.badgeClass}`}>
                    {cat.type.replace('_', ' ')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary">{cat.label}</p>
                    <p className="text-[10px] text-text-muted">{cat.defaultMin} min default</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Coach Preview ─────────────────────────────────────── */}
      {blocks.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
            Coach View — Session Plan
          </p>
          <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <p className="text-xs font-semibold text-text-primary">
                {name.trim() || 'Untitled Template'}
              </p>
              <p className="text-[11px] font-mono text-text-muted">
                {usedMin} min total
              </p>
            </div>
            <div className="divide-y divide-border/50">
              {blocks.map((block, idx) => {
                const cat = findCatalog(block.catalogId)
                return (
                  <div key={block.uid} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-[10px] font-mono text-text-muted shrink-0 w-4 mt-0.5">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-text-primary">{block.label}</p>
                        <span className={`text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 border ${cat?.badgeClass ?? ''}`}>
                          {block.durationMin} min
                        </span>
                      </div>
                      {block.coachCue && (
                        <p className="text-[11px] text-text-secondary leading-snug">
                          <span className="text-text-muted">Cue: </span>{block.coachCue}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Draft Safety Notice ───────────────────────────────── */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
        <CheckCircle2 className="w-3.5 h-3.5 text-text-muted shrink-0 mt-px" />
        <p className="text-[11px] text-text-muted leading-snug">
          <span className="font-semibold text-text-secondary">Draft only.</span>{' '}
          Nothing is published to coaches yet. After saving you can refine blocks, connect curriculum, and generate your first session.
        </p>
      </div>

      {error && (
        <p className="text-xs text-status-red">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="btn-lime text-xs px-4 py-2 disabled:opacity-50"
        >
          <span className="flex items-center gap-1.5">
            {isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <CheckCircle2 className="w-3.5 h-3.5" />}
            Save Draft Template
          </span>
        </button>
        <a href="/director/class-templates" className="btn-ghost text-xs px-4 py-2">
          Cancel
        </a>
      </div>

    </form>
  )
}
