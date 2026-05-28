// Sprint 914.2 — DONNA Conversation Persistence V1
// Server-side helpers for reading/writing the donna_conversation_spine tables.
// Does NOT replace donnaChatSessionMemory.ts (in-process singleton).
// These functions provide optional DB persistence layered on top.
//
// Usage pattern: call from server components and server actions that have
// an authenticated Supabase client. Not for client-side use.
//
// All writes are academy-scoped — academy_id is resolved from the authenticated
// user profile, never from the client.
//
// Raw DB errors are caught and returned as { ok: false, error: string }.
// Never throws to callers — callers check { ok } before using data.

import type { DB } from '@/lib/types/db'

// ── Result type ────────────────────────────────────────────────────────────────

export type DonnaPersistenceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string }

// ── Input / output types ───────────────────────────────────────────────────────

export interface CreateSessionInput {
  userId: string
  role: string
  activePage?: string | null
  activeWorkflow?: string | null
  title?: string | null
  currentEntityType?: string | null
  currentEntityId?: string | null
  metadata?: Record<string, unknown>
}

export interface DonnaConversationSession {
  id: string
  academyId: string
  userId: string
  role: string
  title: string | null
  activePage: string | null
  activeWorkflow: string | null
  currentEntityType: string | null
  currentEntityId: string | null
  status: string
  startedAt: string
  lastMessageAt: string | null
  endedAt: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface AppendMessageInput {
  sessionId: string
  role: 'user' | 'donna' | 'system' | 'tool'
  messageText: string
  messageKind?: 'text' | 'voice' | 'system' | 'action_result' | 'error'
  intent?: string | null
  confidence?: string | null
  source?: string | null
  pagePath?: string | null
  entityType?: string | null
  entityId?: string | null
  proposedActionId?: string | null
  metadata?: Record<string, unknown>
}

export interface DonnaConversationMessage {
  id: string
  sessionId: string
  academyId: string
  userId: string | null
  role: string
  messageText: string
  messageKind: string
  intent: string | null
  confidence: string | null
  source: string | null
  pagePath: string | null
  entityType: string | null
  entityId: string | null
  createdAt: string
}

export interface UpsertWorkingMemoryInput {
  sessionId: string
  memoryKey: string
  memoryValue: Record<string, unknown>
  scope?: 'session' | 'workflow' | 'page' | 'entity'
  expiresAt?: string | null
}

export interface DonnaWorkingMemoryEntry {
  id: string
  sessionId: string
  academyId: string
  userId: string
  memoryKey: string
  memoryValue: Record<string, unknown>
  scope: string
  expiresAt: string | null
  updatedAt: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

// Resolves the academy_id from the authenticated user's profile.
// Returns null if the user has no academy (setup incomplete).
async function resolveAcademyId(db: DB, userId: string): Promise<string | null> {
  const { data } = await (db as any)
    .from('profiles')
    .select('academy_id')
    .eq('id', userId)
    .single()
  return (data?.academy_id as string | null) ?? null
}

// ── createDonnaConversationSession ────────────────────────────────────────────

/**
 * Creates a new DONNA conversation session for the given user.
 * The academy_id is resolved server-side from the authenticated user profile.
 */
export async function createDonnaConversationSession(
  db: DB,
  input: CreateSessionInput,
): Promise<DonnaPersistenceResult<DonnaConversationSession>> {
  try {
    const academyId = await resolveAcademyId(db, input.userId)
    if (!academyId) {
      return { ok: false, error: 'Academy context unavailable for this user.', code: 'NO_ACADEMY' }
    }

    const { data, error } = await (db as any)
      .from('donna_conversation_sessions')
      .insert({
        academy_id:           academyId,
        user_id:              input.userId,
        role:                 input.role,
        title:                input.title ?? null,
        active_page:          input.activePage ?? null,
        active_workflow:      input.activeWorkflow ?? null,
        current_entity_type:  input.currentEntityType ?? null,
        current_entity_id:    input.currentEntityId ?? null,
        metadata:             input.metadata ?? {},
      })
      .select('*')
      .single()

    if (error || !data) {
      return { ok: false, error: error?.message ?? 'Failed to create session.', code: 'INSERT_FAILED' }
    }

    return { ok: true, data: mapSession(data) }
  } catch (err) {
    return { ok: false, error: 'Unexpected error creating DONNA session.', code: 'UNEXPECTED' }
  }
}

// ── getOrCreateDonnaConversationSession ───────────────────────────────────────

/**
 * Returns the most recent active session for the user, or creates one.
 * Useful for "continue last session" UX.
 */
export async function getOrCreateDonnaConversationSession(
  db: DB,
  input: CreateSessionInput,
): Promise<DonnaPersistenceResult<DonnaConversationSession>> {
  try {
    const academyId = await resolveAcademyId(db, input.userId)
    if (!academyId) {
      return { ok: false, error: 'Academy context unavailable for this user.', code: 'NO_ACADEMY' }
    }

    // Look for the most recent active session
    const { data: existing } = await (db as any)
      .from('donna_conversation_sessions')
      .select('*')
      .eq('academy_id', academyId)
      .eq('user_id', input.userId)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      // Update active_page and active_workflow if provided
      if (input.activePage !== undefined || input.activeWorkflow !== undefined) {
        await (db as any)
          .from('donna_conversation_sessions')
          .update({
            active_page:      input.activePage ?? existing.active_page,
            active_workflow:  input.activeWorkflow ?? existing.active_workflow,
            updated_at:       new Date().toISOString(),
          })
          .eq('id', existing.id)
      }
      return { ok: true, data: mapSession(existing) }
    }

    return createDonnaConversationSession(db, input)
  } catch (err) {
    return { ok: false, error: 'Unexpected error getting/creating DONNA session.', code: 'UNEXPECTED' }
  }
}

// ── appendDonnaConversationMessage ────────────────────────────────────────────

/**
 * Appends a single message to a DONNA conversation session.
 * Also updates the session's last_message_at timestamp.
 */
export async function appendDonnaConversationMessage(
  db: DB,
  input: AppendMessageInput,
): Promise<DonnaPersistenceResult<DonnaConversationMessage>> {
  try {
    // Resolve academy_id from the session (not the caller — prevents forgery)
    const { data: session } = await (db as any)
      .from('donna_conversation_sessions')
      .select('academy_id, user_id')
      .eq('id', input.sessionId)
      .single()

    if (!session) {
      return { ok: false, error: 'Session not found or access denied.', code: 'SESSION_NOT_FOUND' }
    }

    const { data, error } = await (db as any)
      .from('donna_conversation_messages')
      .insert({
        session_id:          input.sessionId,
        academy_id:          session.academy_id,
        user_id:             input.role === 'user' ? session.user_id : null,
        role:                input.role,
        message_text:        input.messageText,
        message_kind:        input.messageKind ?? 'text',
        intent:              input.intent ?? null,
        confidence:          input.confidence ?? null,
        source:              input.source ?? null,
        page_path:           input.pagePath ?? null,
        entity_type:         input.entityType ?? null,
        entity_id:           input.entityId ?? null,
        proposed_action_id:  input.proposedActionId ?? null,
        metadata:            input.metadata ?? {},
      })
      .select('*')
      .single()

    if (error || !data) {
      return { ok: false, error: error?.message ?? 'Failed to append message.', code: 'INSERT_FAILED' }
    }

    // Update last_message_at on the session (best-effort, non-fatal)
    await (db as any)
      .from('donna_conversation_sessions')
      .update({ last_message_at: data.created_at, updated_at: data.created_at })
      .eq('id', input.sessionId)

    return { ok: true, data: mapMessage(data) }
  } catch (err) {
    return { ok: false, error: 'Unexpected error appending DONNA message.', code: 'UNEXPECTED' }
  }
}

// ── getRecentDonnaConversationMessages ────────────────────────────────────────

/**
 * Returns the most recent N messages from a session, newest-first.
 */
export async function getRecentDonnaConversationMessages(
  db: DB,
  sessionId: string,
  limit = 20,
): Promise<DonnaPersistenceResult<DonnaConversationMessage[]>> {
  try {
    const { data, error } = await (db as any)
      .from('donna_conversation_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { ok: false, error: error.message, code: 'SELECT_FAILED' }
    }

    // Return in chronological order (oldest first) for conversation context
    const messages: DonnaConversationMessage[] = ((data as any[]) ?? [])
      .map(mapMessage)
      .reverse()

    return { ok: true, data: messages }
  } catch (err) {
    return { ok: false, error: 'Unexpected error reading DONNA messages.', code: 'UNEXPECTED' }
  }
}

// ── upsertDonnaWorkingMemory ──────────────────────────────────────────────────

/**
 * Creates or updates a working memory entry for a session.
 * Uses INSERT ... ON CONFLICT (session_id, memory_key) DO UPDATE.
 */
export async function upsertDonnaWorkingMemory(
  db: DB,
  userId: string,
  input: UpsertWorkingMemoryInput,
): Promise<DonnaPersistenceResult<DonnaWorkingMemoryEntry>> {
  try {
    // Resolve from session to get academy_id (security: don't trust caller)
    const { data: session } = await (db as any)
      .from('donna_conversation_sessions')
      .select('academy_id, user_id')
      .eq('id', input.sessionId)
      .single()

    if (!session) {
      return { ok: false, error: 'Session not found or access denied.', code: 'SESSION_NOT_FOUND' }
    }

    const now = new Date().toISOString()

    const { data, error } = await (db as any)
      .from('donna_working_memory')
      .upsert(
        {
          session_id:   input.sessionId,
          academy_id:   session.academy_id,
          user_id:      session.user_id,
          memory_key:   input.memoryKey,
          memory_value: input.memoryValue,
          scope:        input.scope ?? 'session',
          expires_at:   input.expiresAt ?? null,
          updated_at:   now,
        },
        { onConflict: 'session_id,memory_key' },
      )
      .select('*')
      .single()

    if (error || !data) {
      return { ok: false, error: error?.message ?? 'Failed to upsert working memory.', code: 'UPSERT_FAILED' }
    }

    return { ok: true, data: mapWorkingMemory(data) }
  } catch (err) {
    return { ok: false, error: 'Unexpected error upserting DONNA working memory.', code: 'UNEXPECTED' }
  }
}

// ── getDonnaWorkingMemory ─────────────────────────────────────────────────────

/**
 * Returns all non-expired working memory entries for a session
 * as a flat key → value record for easy access in context packets.
 */
export async function getDonnaWorkingMemory(
  db: DB,
  sessionId: string,
): Promise<DonnaPersistenceResult<Record<string, unknown>>> {
  try {
    const now = new Date().toISOString()

    const { data, error } = await (db as any)
      .from('donna_working_memory')
      .select('memory_key, memory_value')
      .eq('session_id', sessionId)
      .or(`expires_at.is.null,expires_at.gt.${now}`)

    if (error) {
      return { ok: false, error: error.message, code: 'SELECT_FAILED' }
    }

    const record: Record<string, unknown> = {}
    for (const row of (data as any[]) ?? []) {
      record[row.memory_key as string] = row.memory_value
    }

    return { ok: true, data: record }
  } catch (err) {
    return { ok: false, error: 'Unexpected error reading DONNA working memory.', code: 'UNEXPECTED' }
  }
}

// ── Row mappers ────────────────────────────────────────────────────────────────

function mapSession(row: any): DonnaConversationSession {
  return {
    id:                 row.id,
    academyId:          row.academy_id,
    userId:             row.user_id,
    role:               row.role,
    title:              row.title ?? null,
    activePage:         row.active_page ?? null,
    activeWorkflow:     row.active_workflow ?? null,
    currentEntityType:  row.current_entity_type ?? null,
    currentEntityId:    row.current_entity_id ?? null,
    status:             row.status,
    startedAt:          row.started_at,
    lastMessageAt:      row.last_message_at ?? null,
    endedAt:            row.ended_at ?? null,
    metadata:           (row.metadata as Record<string, unknown>) ?? {},
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
  }
}

function mapMessage(row: any): DonnaConversationMessage {
  return {
    id:             row.id,
    sessionId:      row.session_id,
    academyId:      row.academy_id,
    userId:         row.user_id ?? null,
    role:           row.role,
    messageText:    row.message_text,
    messageKind:    row.message_kind,
    intent:         row.intent ?? null,
    confidence:     row.confidence ?? null,
    source:         row.source ?? null,
    pagePath:       row.page_path ?? null,
    entityType:     row.entity_type ?? null,
    entityId:       row.entity_id ?? null,
    createdAt:      row.created_at,
  }
}

function mapWorkingMemory(row: any): DonnaWorkingMemoryEntry {
  return {
    id:           row.id,
    sessionId:    row.session_id,
    academyId:    row.academy_id,
    userId:       row.user_id,
    memoryKey:    row.memory_key,
    memoryValue:  (row.memory_value as Record<string, unknown>) ?? {},
    scope:        row.scope,
    expiresAt:    row.expires_at ?? null,
    updatedAt:    row.updated_at,
  }
}
