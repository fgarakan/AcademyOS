'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, Plus, X, Sparkles, AlertTriangle,
  CheckCircle2, Clock, ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  createFitnessTemplateWithBlocksAction,
  type FitnessBlockDraftInput,
} from '../../createFitnessTemplateWithBlocksAction'
import type { FitnessTemplateType } from '../../fitnessTemplateActions'

// ── Fitness block catalog ──────────────────────────────────────
interface FitnessCatalogBlock {
  id: string
  dbType: string
  label: string
  intent: string
  defaultMin: number
  colorClass: string
  badgeClass: string
}

const FITNESS_BLOCK_CATALOG: FitnessCatalogBlock[] = [
  {
    id: 'movement_prep', dbType: 'movement',  label: 'Movement Prep',
    intent: 'Dynamic warm-up, footwork patterns, activation',
    defaultMin: 10, colorClass: 'bg-lime/6 border-lime/20', badgeClass: 'bg-lime/10 text-lime border-lime/25',
  },
  {
    id: 'speed',         dbType: 'fitness',   label: 'Speed',
    intent: 'Acceleration mechanics, short sprints, burst training',
    defaultMin: 12, colorClass: 'bg-status-orange/8 border-status-orange/25', badgeClass: 'bg-status-orange/15 text-status-orange border-status-orange/30',
  },
  {
    id: 'agility',       dbType: 'fitness',   label: 'Agility',
    intent: 'Ladder drills, cone reactions, change of direction',
    defaultMin: 15, colorClass: 'bg-status-blue/8 border-status-blue/25', badgeClass: 'bg-status-blue/15 text-status-blue border-status-blue/30',
  },
  {
    id: 'plyometrics',   dbType: 'fitness',   label: 'Plyometrics',
    intent: 'Jumps, bounds, lateral bounds, and elastic power development.',
    defaultMin: 10, colorClass: 'bg-status-orange/8 border-status-orange/25', badgeClass: 'bg-status-orange/15 text-status-orange border-status-orange/30',
  },
  {
    id: 'coordination',  dbType: 'fitness',   label: 'Coordination',
    intent: 'Rhythm drills, hand-eye tasks, reaction patterns',
    defaultMin: 10, colorClass: 'bg-lime/5 border-lime/15', badgeClass: 'bg-lime/8 text-lime border-lime/20',
  },
  {
    id: 'strength',      dbType: 'fitness',   label: 'Strength Basics',
    intent: 'Bodyweight strength, core stability, lower-body control',
    defaultMin: 15, colorClass: 'bg-status-red/8 border-status-red/25', badgeClass: 'bg-status-red/15 text-status-red border-status-red/30',
  },
  {
    id: 'mobility',      dbType: 'movement',  label: 'Mobility',
    intent: 'Hip, shoulder, and ankle mobility work',
    defaultMin: 8, colorClass: 'bg-status-blue/5 border-status-blue/20', badgeClass: 'bg-status-blue/10 text-status-blue border-status-blue/20',
  },
  {
    id: 'recovery',      dbType: 'cool_down', label: 'Recovery',
    intent: 'Breathing, stretching, cool-down protocols',
    defaultMin: 10, colorClass: 'bg-surface-raised border-border', badgeClass: 'bg-surface-raised text-text-secondary border-border',
  },
  {
    id: 'tennis_transfer', dbType: 'fitness', label: 'Tennis Transfer',
    intent: 'Bridge fitness work to court movement and match situations',
    defaultMin: 10, colorClass: 'bg-status-purple/8 border-status-purple/25', badgeClass: 'bg-status-purple/15 text-status-purple border-status-purple/30',
  },
  {
    id: 'conditioning',  dbType: 'fitness',   label: 'Conditioning',
    intent: 'Aerobic base, endurance circuits, sustained effort',
    defaultMin: 12, colorClass: 'bg-status-orange/5 border-status-orange/20', badgeClass: 'bg-status-orange/10 text-status-orange border-status-orange/20',
  },
  {
    id: 'balance',       dbType: 'fitness',   label: 'Balance',
    intent: 'Single-leg stability, proprioception, body control',
    defaultMin: 8, colorClass: 'bg-lime/4 border-lime/15', badgeClass: 'bg-lime/8 text-lime border-lime/15',
  },
  {
    id: 'footwork',      dbType: 'movement',  label: 'Footwork',
    intent: 'Split step, recovery steps, court coverage patterns',
    defaultMin: 10, colorClass: 'bg-status-green/8 border-status-green/25', badgeClass: 'bg-status-green/15 text-status-green border-status-green/30',
  },
]

const TEMPLATE_TYPES: { value: FitnessTemplateType; label: string }[] = [
  { value: 'standard',        label: 'Standard' },
  { value: 'pre_tournament',  label: 'Pre-Tournament' },
  { value: 'post_tournament', label: 'Post-Tournament' },
  { value: 'high_intensity',  label: 'High-Intensity' },
  { value: 'low_load',        label: 'Low-Load' },
  { value: 'assessment',      label: 'Assessment' },
  { value: 'recovery',        label: 'Recovery' },
]

// Standard structure suggestions by template type
const STANDARD_STRUCTURES: Record<FitnessTemplateType, string[]> = {
  standard:        ['movement_prep', 'agility', 'plyometrics', 'speed', 'strength', 'tennis_transfer', 'recovery'],
  pre_tournament:  ['movement_prep', 'agility', 'coordination', 'footwork', 'tennis_transfer', 'recovery'],
  post_tournament: ['movement_prep', 'mobility', 'recovery'],
  high_intensity:  ['movement_prep', 'speed', 'agility', 'plyometrics', 'conditioning', 'strength', 'recovery'],
  low_load:        ['movement_prep', 'coordination', 'balance', 'mobility', 'recovery'],
  assessment:      ['movement_prep', 'speed', 'agility', 'plyometrics', 'strength', 'balance', 'recovery'],
  recovery:        ['movement_prep', 'mobility', 'recovery'],
}

// ── Draft block state ──────────────────────────────────────────
let _uid = 0
function nextUid() { return String(++_uid) }

interface DraftBlock {
  uid: string
  catalogId: string
  dbType: string
  label: string
  durationMin: number
  coachCue: string
  tennisTransferNote: string
  expanded: boolean
}

function makeDraftBlock(cat: FitnessCatalogBlock): DraftBlock {
  return {
    uid: nextUid(),
    catalogId: cat.id,
    dbType: cat.dbType,
    label: cat.label,
    durationMin: cat.defaultMin,
    coachCue: '',
    tennisTransferNote: '',
    expanded: false,
  }
}

// ── Props ──────────────────────────────────────────────────────
interface Props {
  hasDna: boolean
  dnaDevelopmentPriorities: string[]
}

// ── Component ──────────────────────────────────────────────────
export function NewFitnessTemplateForm({ hasDna, dnaDevelopmentPriorities }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [templateType, setTemplateType] = useState<FitnessTemplateType>('standard')
  const [totalMin, setTotalMin]       = useState<string>('60')

  const [blocks, setBlocks]           = useState<DraftBlock[]>([])
  const [showCatalog, setShowCatalog] = useState(false)

  const totalMinNum = parseInt(totalMin, 10) || 0
  const usedMin     = blocks.reduce((sum, b) => sum + b.durationMin, 0)
  const overBudget  = totalMinNum > 0 && usedMin > totalMinNum

  function addBlock(cat: FitnessCatalogBlock) {
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
    const ids = STANDARD_STRUCTURES[templateType] ?? STANDARD_STRUCTURES.standard
    setBlocks(ids.map(id => {
      const cat = FITNESS_BLOCK_CATALOG.find(c => c.id === id)
      return makeDraftBlock(cat ?? FITNESS_BLOCK_CATALOG[0])
    }))
    setShowCatalog(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Template name is required.'); return }
    setError(null)

    const blockInputs: FitnessBlockDraftInput[] = blocks.map(b => ({
      label:              b.label,
      dbType:             b.dbType,
      durationMin:        b.durationMin,
      coachCue:           b.coachCue,
      tennisTransferNote: b.tennisTransferNote,
    }))

    startTransition(async () => {
      const result = await createFitnessTemplateWithBlocksAction({
        name:            name.trim(),
        description:     description.trim(),
        templateType,
        totalDurationMin: totalMinNum,
        blocks:          blockInputs,
      })

      // Guard: Server Action can resolve to undefined under build skew (stale bundle).
      if (!result || !result.ok || !result.templateId) {
        setError(result?.error ?? 'Failed to save draft.')
        return
      }

      router.push(`/director/fitness/templates/${result.templateId}`)
    })
  }

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
            {hasDna && dnaDevelopmentPriorities.length > 0 ? (
              <>
                <p className="text-[12px] text-text-secondary leading-relaxed mb-2">
                  Your Academy DNA development priorities inform what fitness qualities matter most for your players.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {dnaDevelopmentPriorities.slice(0, 4).map((p, i) => (
                    <span key={i} className="pill-cyan text-[10px]">{p}</span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-[12px] text-text-secondary leading-relaxed">
                {hasDna
                  ? 'Your Academy DNA is saved. Select a template type and build your fitness block structure below.'
                  : 'Once your Academy DNA is saved, I can show development priorities to guide your fitness structure.'}
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
            Apply standard {templateType.replace('_', '-')} structure →
          </button>
          <span className="text-[11px] text-text-muted ml-2">
            {(STANDARD_STRUCTURES[templateType] ?? []).map(id => FITNESS_BLOCK_CATALOG.find(c => c.id === id)?.label).filter(Boolean).join(' · ')}
          </span>
        </div>
      </div>

      {/* ── Template Basics ──────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
          Fitness Template Basics
        </p>

        <div className="space-y-1.5">
          <label className="label-xs">Template Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Junior Pre-Season Fitness Protocol"
            maxLength={100}
            disabled={isPending}
            className="input-base w-full"
          />
        </div>

        <div className="space-y-1.5">
          <label className="label-xs">Template Type</label>
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                disabled={isPending}
                onClick={() => setTemplateType(value)}
                className={[
                  'text-xs px-3 py-1.5 rounded-lg border transition-colors',
                  templateType === value
                    ? 'bg-lime/10 border-lime/30 text-lime'
                    : 'bg-surface-raised border-border text-text-muted hover:text-text-secondary hover:border-lime/20',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="label-xs">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Briefly describe this protocol's purpose..."
            rows={2}
            maxLength={300}
            disabled={isPending}
            className="input-base w-full resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="label-xs">Session Length (minutes)</label>
          <input
            type="number"
            min="0"
            max="180"
            value={totalMin}
            onChange={e => setTotalMin(e.target.value)}
            placeholder="e.g. 60"
            disabled={isPending}
            className="input-base w-32"
          />
        </div>
      </div>

      {/* ── Block Builder ────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
              Fitness Block Structure
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Build the physical training sequence coaches will run.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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

        {blocks.length > 0 && (
          <div className="space-y-2">
            {blocks.map((block, idx) => {
              const cat = FITNESS_BLOCK_CATALOG.find(c => c.id === block.catalogId)
              return (
                <div key={block.uid} className={`rounded-xl border px-3 py-3 ${cat?.colorClass ?? 'bg-surface-raised border-border'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-text-muted shrink-0 w-4 text-right">{idx + 1}</span>
                    <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 border ${cat?.badgeClass ?? ''}`}>
                      {block.dbType.replace('_', ' ')}
                    </span>
                    <span className="flex-1 min-w-0 text-xs font-semibold text-text-primary">
                      {block.label}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="60"
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
                        aria-label={block.expanded ? 'Collapse' : 'Add cues'}
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

                  {cat && (
                    <p className="text-[10px] text-text-muted mt-1 ml-7">{cat.intent}</p>
                  )}

                  {block.expanded && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-2 ml-7">
                      <div className="space-y-1">
                        <label className="label-xs">Coach Cue</label>
                        <input
                          type="text"
                          value={block.coachCue}
                          onChange={e => updateBlock(block.uid, { coachCue: e.target.value })}
                          placeholder="What should the coach focus on or say?"
                          maxLength={200}
                          disabled={isPending}
                          className="input-base w-full text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="label-xs">Tennis Transfer Note</label>
                        <input
                          type="text"
                          value={block.tennisTransferNote}
                          onChange={e => updateBlock(block.uid, { tennisTransferNote: e.target.value })}
                          placeholder="How does this connect back to the court?"
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
              {FITNESS_BLOCK_CATALOG.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => addBlock(cat)}
                  className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-surface transition-colors"
                >
                  <span className={`shrink-0 mt-0.5 text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 border ${cat.badgeClass}`}>
                    {cat.dbType.replace('_', ' ')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary">{cat.label}</p>
                    <p className="text-[10px] text-text-muted leading-snug">{cat.intent}</p>
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
            Coach View — Fitness Plan
          </p>
          <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <p className="text-xs font-semibold text-text-primary">
                {name.trim() || 'Untitled Fitness Template'}
              </p>
              <p className="text-[11px] font-mono text-text-muted">{usedMin} min total</p>
            </div>
            <div className="divide-y divide-border/50">
              {blocks.map((block, idx) => {
                const cat = FITNESS_BLOCK_CATALOG.find(c => c.id === block.catalogId)
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
                      {cat && <p className="text-[10px] text-text-muted">{cat.intent}</p>}
                      {block.coachCue && (
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          <span className="text-text-muted">Cue: </span>{block.coachCue}
                        </p>
                      )}
                      {block.tennisTransferNote && (
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          <span className="text-text-muted">Transfer: </span>{block.tennisTransferNote}
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
          Nothing is published to coaches yet. After saving you can add exercises, link to curriculum, and generate your first fitness session.
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
            Save Draft Fitness Template
          </span>
        </button>
        <a href="/director/fitness/templates" className="btn-ghost text-xs px-4 py-2">
          Cancel
        </a>
      </div>

    </form>
  )
}
