// Mega Sprint 4111–4140 — DONNA Executive Action Loop V1
// Part 2 — The single Executive Event Bus.
//
// ONE centralized place that turns raw client UI activity into the canonical operating
// events DONNA reasons over. It captures only MEANINGFUL operating events (navigation,
// save, create, update, delete, approval, assignment, workflow completion, validation
// failure) and discards cosmetic noise (hover, scroll, focus, mousemove, keypress…).
//
// Architecture contract:
//   • Single bus, one publish path — no page-specific implementations.
//   • Deterministic + pure normalization (createExecutiveEventBus holds only an
//     in-memory queue; the same raw input always normalizes to the same events).
//   • Fail-open: a malformed raw event is dropped, never thrown.
//
// No new route, no new OpenAI call, no new memory store — the bus is a pure pipeline
// plus an optional in-memory queue the operating layer drains each turn.

import type { UIEvent, UIEventKind } from './donnaExecutiveActionLoop'

// ── Raw client event (loose shape from the UI) ──────────────────────────────────

export interface RawUIEvent {
  /** The raw client event type, e.g. 'click' | 'save' | 'route_change' | 'scroll'. */
  type: string
  /** Canonical target if the client already knows it, e.g. 'assign_coach'. */
  target?: string
  /** Human label of the control, e.g. "Assign Coach" — slugified to a target. */
  label?: string
  route?: string
  ok?: boolean
  detail?: string
  seq?: number
}

// Cosmetic event types that carry no operating meaning — always ignored.
const COSMETIC = new Set([
  'hover', 'mouseover', 'mouseout', 'mousemove', 'mouseenter', 'mouseleave',
  'scroll', 'focus', 'blur', 'keydown', 'keyup', 'keypress', 'resize',
  'pointermove', 'pointerover', 'tooltip', 'animationend', 'transitionend',
  'select', 'selectstart', 'drag', 'dragover', 'wheel', 'load', 'render',
])

// Raw type → canonical operating kind. Anything not here (and not cosmetic) is dropped.
const TYPE_MAP: Record<string, UIEventKind> = {
  navigate: 'navigation', navigation: 'navigation',
  route_change: 'page_change', page_view: 'page_change', page_change: 'page_change', pageview: 'page_change',
  click: 'click', tap: 'click',
  submit: 'form_submit', form_submit: 'form_submit',
  save: 'save', saved: 'save',
  create: 'create', created: 'create', add: 'create', new: 'create',
  update: 'update', updated: 'update', edit: 'update', change: 'update',
  delete: 'delete', deleted: 'delete', remove: 'delete', removed: 'delete', archive: 'delete',
  approve: 'approval', approval: 'approval', approved: 'approval',
  assign: 'assignment', assignment: 'assignment', assigned: 'assignment',
  complete: 'workflow_complete', completed: 'workflow_complete', workflow_complete: 'workflow_complete', finish: 'workflow_complete', finished: 'workflow_complete', publish: 'workflow_complete', published: 'workflow_complete',
  validation_error: 'validation_error', validation_failed: 'validation_error', error: 'validation_error', invalid: 'validation_error',
  cancel: 'cancel', cancelled: 'cancel', canceled: 'cancel', dismiss: 'cancel', abort: 'cancel',
}

/** True when a raw event carries operating meaning (not cosmetic / not unknown). */
export function isMeaningfulEvent(raw: RawUIEvent): boolean {
  if (!raw || typeof raw.type !== 'string') return false
  const t = raw.type.toLowerCase().trim()
  if (COSMETIC.has(t)) return false
  return t in TYPE_MAP
}

/** Slugify a control label into a canonical target ("Assign Coach" → "assign_coach"). */
export function slugifyTarget(label: string): string {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

/**
 * Normalize + filter raw client events into canonical operating events. Drops cosmetic
 * and unknown events, maps the kind, resolves the target (explicit, else slugified
 * label), assigns sequence numbers in order when absent, and de-duplicates identical
 * (kind,target,seq) triples. Pure + deterministic.
 */
export function normalizeEvents(raw: RawUIEvent[], startSeq = 0): UIEvent[] {
  const out: UIEvent[] = []
  const seen = new Set<string>()
  let auto = startSeq
  for (const r of raw) {
    if (!isMeaningfulEvent(r)) continue
    const kind = TYPE_MAP[r.type.toLowerCase().trim()]
    const target = (r.target && r.target.trim()) ? r.target.trim() : (r.label ? slugifyTarget(r.label) : undefined)
    const seq = typeof r.seq === 'number' ? r.seq : ++auto
    const key = `${kind}:${target ?? ''}:${seq}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ kind, target, route: r.route, ok: r.ok, detail: r.detail, seq })
  }
  return out.sort((a, b) => a.seq - b.seq)
}

// ── The bus instance (single, in-memory, drained per turn) ──────────────────────

export type EventBusListener = (events: UIEvent[]) => void

export interface ExecutiveEventBus {
  /** Publish one raw event — normalized + filtered before it enters the queue. */
  publish(raw: RawUIEvent): void
  /** Publish many raw events at once. */
  publishMany(raw: RawUIEvent[]): void
  /** Return + clear the queued meaningful events (the operating layer drains here). */
  drain(): UIEvent[]
  /** Inspect the queue without clearing it. */
  peek(): UIEvent[]
  clear(): void
  /** Subscribe to publishes (deduped — the same fn is never registered twice). */
  subscribe(fn: EventBusListener): () => void
}

/**
 * Create the single Executive Event Bus. One publish path, one queue. Listeners are
 * deduped so there are never duplicate handlers for the same function. Deterministic:
 * a sequence number is assigned in publish order when the client omits one.
 */
export function createExecutiveEventBus(): ExecutiveEventBus {
  let queue: UIEvent[] = []
  let seq = 0
  const listeners: EventBusListener[] = []

  const enqueue = (raw: RawUIEvent[]): UIEvent[] => {
    const normalized = normalizeEvents(raw, seq)
    if (normalized.length) seq = normalized[normalized.length - 1].seq
    queue.push(...normalized)
    if (normalized.length) for (const fn of listeners) fn(normalized)
    return normalized
  }

  return {
    publish(raw) { enqueue([raw]) },
    publishMany(raw) { enqueue(raw) },
    drain() { const out = queue; queue = []; return out },
    peek() { return [...queue] },
    clear() { queue = [] },
    subscribe(fn) {
      if (!listeners.includes(fn)) listeners.push(fn) // no duplicate listeners
      return () => {
        const i = listeners.indexOf(fn)
        if (i >= 0) listeners.splice(i, 1)
      }
    },
  }
}
