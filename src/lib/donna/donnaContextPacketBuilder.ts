// Sprint 914.2 — DONNA Context Packet Builder V1
// Assembles a structured context packet before DONNA answer generation.
// Read-only assembly — no DB writes, no mutations, no AI inference.
// Accepts data from multiple sources (persisted messages, working memory,
// directorCtx, page context) and combines them into a single typed packet.
//
// V1 scope: uses persisted conversation messages + working memory when
// a sessionId is provided, falls back to empty context otherwise.
// Full context wiring (directorCtx, page context, entity context) is done
// in Sprint 914.3 when the God Mode shell is updated.

import type { DB } from '@/lib/types/db'
import {
  getRecentDonnaConversationMessages,
  getDonnaWorkingMemory,
  type DonnaConversationMessage,
} from '@/lib/donna/donnaConversationPersistence'

// ── Context packet type ────────────────────────────────────────────────────────

export interface DonnaContextEntity {
  type: string
  id: string
}

export interface DonnaContextMessageSummary {
  role: string
  messageText: string
  createdAt: string
  intent: string | null
  confidence: string | null
}

export interface DonnaContextPacket {
  userMessage: string
  academyId: string
  userId: string
  role: string

  // Session context (from donna_conversation_sessions)
  sessionId: string | null
  activePage: string | null
  activeWorkflow: string | null
  currentEntity: DonnaContextEntity | null

  // Persisted conversation history (from donna_conversation_messages)
  recentConversation: DonnaContextMessageSummary[]

  // Durable working memory (from donna_working_memory)
  workingMemory: Record<string, unknown>

  // Optional director context (from directorDonnaContext.ts — passed by caller)
  // Typed as unknown to avoid coupling to DirectorDonnaContext in this module.
  directorContext: unknown | null

  // Allowed actions — populated from action registry in future sprint
  allowedActions: string[]

  // Pending approvals — populated from proposed_actions in future sprint
  pendingApprovals: unknown[]

  // Extensible metadata
  metadata: Record<string, unknown>
}

// ── Builder input ──────────────────────────────────────────────────────────────

export interface BuildDonnaContextPacketInput {
  userMessage: string
  academyId: string
  userId: string
  role: string
  sessionId?: string | null
  activePage?: string | null
  activeWorkflow?: string | null
  currentEntityType?: string | null
  currentEntityId?: string | null
  directorContext?: unknown | null
  allowedActions?: string[]
  pendingApprovals?: unknown[]
  recentMessageLimit?: number
  metadata?: Record<string, unknown>
}

// ── Builder function ───────────────────────────────────────────────────────────

/**
 * Builds a DonnaContextPacket for use in DONNA answer generation.
 * When a sessionId is provided, loads persisted messages and working memory.
 * Falls back gracefully to empty context when session data is unavailable.
 *
 * This is V1 wiring — the packet will be extended in Sprint 914.3 with
 * curriculum, template, and player context from directorDonnaContext.ts.
 *
 * @param db - Authenticated Supabase server client
 * @param input - Context assembly inputs
 * @returns A fully assembled DonnaContextPacket (never throws)
 */
export async function buildDonnaContextPacket(
  db: DB,
  input: BuildDonnaContextPacketInput,
): Promise<DonnaContextPacket> {
  let recentConversation: DonnaContextMessageSummary[] = []
  let workingMemory: Record<string, unknown> = {}

  // Load persisted conversation history if sessionId provided
  if (input.sessionId) {
    const messagesResult = await getRecentDonnaConversationMessages(
      db,
      input.sessionId,
      input.recentMessageLimit ?? 20,
    )
    if (messagesResult.ok) {
      recentConversation = messagesResult.data.map(toMessageSummary)
    }
    // Non-fatal: if message load fails, proceed with empty history

    const memoryResult = await getDonnaWorkingMemory(db, input.sessionId)
    if (memoryResult.ok) {
      workingMemory = memoryResult.data
    }
    // Non-fatal: if memory load fails, proceed with empty working memory
  }

  const currentEntity: DonnaContextEntity | null =
    input.currentEntityType && input.currentEntityId
      ? { type: input.currentEntityType, id: input.currentEntityId }
      : null

  return {
    userMessage:        input.userMessage,
    academyId:          input.academyId,
    userId:             input.userId,
    role:               input.role,
    sessionId:          input.sessionId ?? null,
    activePage:         input.activePage ?? null,
    activeWorkflow:     input.activeWorkflow ?? null,
    currentEntity,
    recentConversation,
    workingMemory,
    directorContext:    input.directorContext ?? null,
    allowedActions:     input.allowedActions ?? [],
    pendingApprovals:   input.pendingApprovals ?? [],
    metadata:           input.metadata ?? {},
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function toMessageSummary(msg: DonnaConversationMessage): DonnaContextMessageSummary {
  return {
    role:        msg.role,
    messageText: msg.messageText,
    createdAt:   msg.createdAt,
    intent:      msg.intent,
    confidence:  msg.confidence,
  }
}
