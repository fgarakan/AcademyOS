// Sprint 2261–2290 — DONNA Memory Activation V1
// Tier 1: Cross-session memory — session summary generation and DB persistence.
//
// Responsibilities:
//   - Build a deterministic session summary from conversation messages
//   - Save that summary into donna_conversation_sessions.metadata
//   - Load prior closed session summaries for context injection
//   - Decide when a session is stale (4-hour boundary)
//
// Design rules:
//   - Deterministic only — no LLM, no random, same input → same output
//   - No raw message content in summaries — only safe labels and counts
//   - Non-fatal: all DB operations return ok/error, never throw
//   - No player names in summary text — only entity type labels

import type { DB } from '@/lib/types/db'
import type { PriorSessionContext, PriorSessionEntry } from './donnaMemoryContextTypes'

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSION_STALE_HOURS = 4
const STALE_MS = SESSION_STALE_HOURS * 60 * 60 * 1000
const PRIOR_SESSION_LIMIT = 2

// ── Intent → topic label ──────────────────────────────────────────────────────

const INTENT_TO_TOPIC: Record<string, string> = {
  curriculum_draft:        'curriculum',
  curriculum_overview:     'curriculum',
  player_attention:        'players',
  player_overview:         'players',
  review_queue:            'approvals',
  review_queue_guidance:   'approvals',
  wrap_up_guidance:        'session wrap-ups',
  attendance_exception:    'attendance',
  coach_assignment:        'coach assignments',
  level_advancement:       'player advancement',
  placement_decision:      'player placement',
  parent_communication:    'parent updates',
  daily_brief:             'today\'s brief',
  academy_health:          'academy health',
  templates:               'session templates',
  session_planning:        'session planning',
}

// ── Page path → readable label ────────────────────────────────────────────────

function pagePathToLabel(path: string): string {
  if (!path) return ''
  if (path === '/director' || path === '/director/') return 'Today'
  if (path.startsWith('/director/review')) return 'Review Queue'
  if (path.startsWith('/director/curriculum')) return 'Curriculum'
  if (path.startsWith('/director/players/')) return 'Player Profile'
  if (path.startsWith('/director/players')) return 'Players'
  if (path.startsWith('/director/sessions')) return 'Sessions'
  if (path.startsWith('/director/class-templates')) return 'Templates'
  if (path.startsWith('/director/coaches')) return 'Coaches'
  if (path.startsWith('/director/level-up')) return 'Level Up'
  if (path.startsWith('/director/signals')) return 'Signals'
  if (path.startsWith('/director/placement')) return 'Placement'
  return 'Academy'
}

// ── Entity type → readable label ─────────────────────────────────────────────

function entityTypeToLabel(entityType: string): string {
  const labels: Record<string, string> = {
    player:           'player',
    group:            'group',
    session:          'session',
    curriculum_level: 'curriculum level',
    coach:            'coach',
    template:         'template',
  }
  return labels[entityType] ?? entityType
}

// ── Raw session message shape ─────────────────────────────────────────────────

interface RawSessionMessage {
  role: string
  intent: string | null
  pagePath: string | null
  entityType: string | null
  entityId: string | null
  proposedActionId: string | null
  messageKind: string
  createdAt: string
}

// ── Proposed action summary row ───────────────────────────────────────────────

interface SessionProposedActionRow {
  id: string
  actionLabel: string
  status: string
}

// ── Summary builder ───────────────────────────────────────────────────────────

function buildSummaryText(
  topics: string[],
  pages: string[],
  actionCount: number,
  pendingCount: number,
): string {
  const parts: string[] = []
  if (topics.length > 0) {
    parts.push(`Discussed ${topics.slice(0, 3).join(', ')}`)
  }
  if (pages.length > 1) {
    parts.push(`visited ${pages.slice(0, 2).join(' and ')}`)
  }
  if (actionCount > 0) {
    parts.push(`${actionCount} action${actionCount !== 1 ? 's' : ''} completed`)
  }
  if (pendingCount > 0) {
    parts.push(`${pendingCount} item${pendingCount !== 1 ? 's' : ''} left open`)
  }
  return parts.length > 0 ? parts.join(', ') + '.' : 'Brief session — no major topics recorded.'
}

export function buildSessionSummaryFromMessages(
  messages: RawSessionMessage[],
  proposedActions: SessionProposedActionRow[],
): Omit<PriorSessionEntry, 'startedAt' | 'endedAt'> {
  // Extract topics from intent classifications
  const topicSet = new Set<string>()
  for (const m of messages) {
    if (m.intent && INTENT_TO_TOPIC[m.intent]) {
      topicSet.add(INTENT_TO_TOPIC[m.intent])
    }
  }

  // Extract pages visited from page_path fields (user messages only, deduped)
  const pageSet = new Set<string>()
  for (const m of messages) {
    if (m.role === 'user' && m.pagePath) {
      const label = pagePathToLabel(m.pagePath)
      if (label) pageSet.add(label)
    }
  }

  // Extract entity references (type labels only — no IDs or names)
  const entitySet = new Set<string>()
  for (const m of messages) {
    if (m.entityType && m.entityId) {
      entitySet.add(entityTypeToLabel(m.entityType))
    }
  }

  // Classify proposed actions
  const completed = proposedActions.filter(a =>
    a.status === 'executed' || a.status === 'approved',
  )
  const pending = proposedActions.filter(a => a.status === 'pending_review')

  const topics = Array.from(topicSet)
  const pages = Array.from(pageSet)

  return {
    sessionSummaryText: buildSummaryText(topics, pages, completed.length, pending.length),
    topicsDiscussed:    topics,
    pagesVisited:       pages,
    entitiesReferenced: Array.from(entitySet),
    actionsCompleted:   completed.map(a => a.actionLabel).slice(0, 5),
    actionsPending:     pending.map(a => a.actionLabel).slice(0, 3),
    openItems:          pending.map(a => a.actionLabel).slice(0, 2),
  }
}

// ── Staleness check ───────────────────────────────────────────────────────────

export function isSessionStale(lastMessageAt: string | null): boolean {
  if (!lastMessageAt) return true
  const lastMs = new Date(lastMessageAt).getTime()
  if (isNaN(lastMs)) return true
  return Date.now() - lastMs > STALE_MS
}

// ── DB: save summary to session metadata ──────────────────────────────────────

export async function saveSessionSummary(
  db: DB,
  sessionId: string,
  summary: Omit<PriorSessionEntry, 'startedAt' | 'endedAt'>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const rawDb = db as any

    // Fetch current metadata so we don't overwrite other keys
    const { data: session } = await rawDb
      .from('donna_conversation_sessions')
      .select('metadata')
      .eq('id', sessionId)
      .single()

    const existingMeta = (session?.metadata as Record<string, unknown>) ?? {}

    const { error } = await rawDb
      .from('donna_conversation_sessions')
      .update({
        metadata:   { ...existingMeta, summary },
        status:     'ended',
        ended_at:   new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Unexpected error saving session summary.' }
  }
}

// ── DB: load prior session summaries ─────────────────────────────────────────

export async function loadPriorSessionSummaries(
  db: DB,
  userId: string,
  academyId: string,
): Promise<PriorSessionContext> {
  try {
    const rawDb = db as any

    const { data, error } = await rawDb
      .from('donna_conversation_sessions')
      .select('id, started_at, ended_at, metadata')
      .eq('academy_id', academyId)
      .eq('user_id', userId)
      .eq('status', 'ended')
      .not('metadata->summary', 'is', null)
      .order('ended_at', { ascending: false })
      .limit(PRIOR_SESSION_LIMIT)

    if (error || !data) return { sessions: [], mostRecentAt: null }

    const sessions: PriorSessionEntry[] = (data as any[])
      .map(row => {
        const meta = (row.metadata as Record<string, unknown>) ?? {}
        const raw = meta.summary as Record<string, unknown> | null
        if (!raw) return null
        return {
          startedAt:           row.started_at as string,
          endedAt:             (row.ended_at as string | null) ?? null,
          sessionSummaryText:  typeof raw.sessionSummaryText === 'string' ? raw.sessionSummaryText : '',
          topicsDiscussed:     Array.isArray(raw.topicsDiscussed) ? raw.topicsDiscussed as string[] : [],
          pagesVisited:        Array.isArray(raw.pagesVisited) ? raw.pagesVisited as string[] : [],
          entitiesReferenced:  Array.isArray(raw.entitiesReferenced) ? raw.entitiesReferenced as string[] : [],
          actionsCompleted:    Array.isArray(raw.actionsCompleted) ? raw.actionsCompleted as string[] : [],
          actionsPending:      Array.isArray(raw.actionsPending) ? raw.actionsPending as string[] : [],
          openItems:           Array.isArray(raw.openItems) ? raw.openItems as string[] : [],
        } satisfies PriorSessionEntry
      })
      .filter((s): s is PriorSessionEntry => s !== null)

    return {
      sessions,
      mostRecentAt: sessions[0]?.endedAt ?? null,
    }
  } catch {
    return { sessions: [], mostRecentAt: null }
  }
}

// ── DB: finalize a stale session ──────────────────────────────────────────────

export async function finalizeStaleSession(
  db: DB,
  userId: string,
  academyId: string,
): Promise<{ finalized: boolean; sessionId: string | null }> {
  try {
    const rawDb = db as any

    // Find the most recent active session for this user
    const { data: session } = await rawDb
      .from('donna_conversation_sessions')
      .select('id, last_message_at, metadata')
      .eq('academy_id', academyId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()

    if (!session) return { finalized: false, sessionId: null }
    if (!isSessionStale(session.last_message_at)) return { finalized: false, sessionId: session.id as string }

    // Load messages for this session to generate summary
    const { data: messages } = await rawDb
      .from('donna_conversation_messages')
      .select('role, intent, page_path, entity_type, entity_id, proposed_action_id, message_kind, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })
      .limit(50)

    // Load proposed actions linked to this session via donna_conversation_messages.proposed_action_id.
    // The previously used donna_events / review_item_created path was dead code — that event
    // is defined but never emitted. This reads the relationship that already exists in the DB.
    const { data: messagesWithActions } = await rawDb
      .from('donna_conversation_messages')
      .select('proposed_action_id')
      .eq('session_id', session.id)
      .not('proposed_action_id', 'is', null)
      .limit(20)

    const actionIds: string[] = ((messagesWithActions as any[]) ?? [])
      .map(m => m.proposed_action_id as string)
      .filter(Boolean)

    let proposedActions: SessionProposedActionRow[] = []
    if (actionIds.length > 0) {
      const { data: actions } = await rawDb
        .from('proposed_actions')
        .select('id, action_label, status')
        .in('id', actionIds)
        .limit(20)
      proposedActions = ((actions as any[]) ?? []).map(a => ({
        id:          a.id as string,
        actionLabel: a.action_label as string,
        status:      a.status as string,
      }))
    }

    const rawMessages: RawSessionMessage[] = ((messages as any[]) ?? []).map(m => ({
      role:             m.role as string,
      intent:           (m.intent as string | null) ?? null,
      pagePath:         (m.page_path as string | null) ?? null,
      entityType:       (m.entity_type as string | null) ?? null,
      entityId:         (m.entity_id as string | null) ?? null,
      proposedActionId: (m.proposed_action_id as string | null) ?? null,
      messageKind:      (m.message_kind as string) ?? 'text',
      createdAt:        m.created_at as string,
    }))

    const summary = buildSessionSummaryFromMessages(rawMessages, proposedActions)
    await saveSessionSummary(db, session.id as string, summary)

    return { finalized: true, sessionId: session.id as string }
  } catch {
    return { finalized: false, sessionId: null }
  }
}
