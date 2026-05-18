// Template Review Queue Adapter — Sprint 978
// Provides typed read helpers for pending template review requests.
// This adapter shapes TemplateReviewRequestRow data into a format
// suitable for director review queue display.
//
// Review requests are written by saveTemplateDraftAction / updateTemplateDraftAction.
// They are read by this adapter and will be surfaced in the director review queue
// in a future sprint (after the table is confirmed applied in production).
//
// No mutations here. The approve/reject path is in Sprint 979.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { getTemplateReviewRequests } from './templateRepository'
import type { TemplateReviewRequestRow } from './templateRepository'

type DB = SupabaseClient<Database>

// ── Request type display labels ───────────────────────────────────────────

export const TEMPLATE_REQUEST_TYPE_LABELS: Record<string, string> = {
  create_template: 'New Template Draft',
  update_template: 'Template Update',
  archive_template: 'Archive Template',
  duplicate_template: 'Duplicate Template',
}

export const TEMPLATE_REQUEST_TYPE_COLOR: Record<string, string> = {
  create_template: 'text-lime border-lime/20 bg-lime/5',
  update_template: 'text-status-blue border-status-blue/20 bg-status-blue/5',
  archive_template: 'text-status-orange border-status-orange/20 bg-status-orange/5',
  duplicate_template: 'text-status-purple border-status-purple/20 bg-status-purple/5',
}

// ── Enriched review item shape ────────────────────────────────────────────
// Extends TemplateReviewRequestRow with display-ready fields derived from
// the JSONB template_draft snapshot. Avoids re-querying templates table
// since the snapshot is self-contained.

export interface TemplateReviewQueueItem extends TemplateReviewRequestRow {
  // Derived from template_draft JSONB
  draftName: string
  draftType: string
  draftDurationMin: number | null
  draftCurriculumLabel: string | null
  draftGoal: string | null
  draftBlockCount: number
  // Display labels
  requestTypeLabel: string
  requestTypeColor: string
}

function extractDraftFields(request: TemplateReviewRequestRow): Omit<TemplateReviewQueueItem, keyof TemplateReviewRequestRow | 'requestTypeLabel' | 'requestTypeColor'> {
  const draft = request.template_draft as Record<string, unknown> | null ?? {}

  const blocks = Array.isArray(draft['blocks']) ? draft['blocks'] as unknown[] : []

  return {
    draftName: (draft['name'] as string | undefined) ?? 'Untitled Template',
    draftType: (draft['template_type'] as string | undefined) ?? 'unknown',
    draftDurationMin: (draft['total_duration_min'] as number | null | undefined) ?? null,
    draftCurriculumLabel: (draft['curriculum_source_label'] as string | null | undefined) ?? null,
    draftGoal: (draft['template_goal'] as string | null | undefined) ?? (draft['description'] as string | null | undefined) ?? null,
    draftBlockCount: blocks.length,
  }
}

function enrichRequest(request: TemplateReviewRequestRow): TemplateReviewQueueItem {
  const draftFields = extractDraftFields(request)
  return {
    ...request,
    ...draftFields,
    requestTypeLabel: TEMPLATE_REQUEST_TYPE_LABELS[request.request_type] ?? request.request_type,
    requestTypeColor: TEMPLATE_REQUEST_TYPE_COLOR[request.request_type] ?? 'text-text-muted border-border',
  }
}

// ── Query helpers ─────────────────────────────────────────────────────────

export interface TemplateReviewQueueResult {
  items: TemplateReviewQueueItem[]
  pendingCount: number
  error: string | null
  isSchemaMissing: boolean
}

export async function loadPendingTemplateReviewItems(
  db: DB,
  academyId: string
): Promise<TemplateReviewQueueResult> {
  const result = await getTemplateReviewRequests(db, academyId, { status: 'pending', limit: 50 })

  if (result.isSchemaMissing) {
    return { items: [], pendingCount: 0, error: result.error, isSchemaMissing: true }
  }
  if (result.error) {
    return { items: [], pendingCount: 0, error: result.error, isSchemaMissing: false }
  }

  const items = result.data.map(enrichRequest)
  return { items, pendingCount: items.length, error: null, isSchemaMissing: false }
}

export async function loadTemplateReviewHistoryItems(
  db: DB,
  academyId: string
): Promise<TemplateReviewQueueResult> {
  const result = await getTemplateReviewRequests(db, academyId, { limit: 50 })

  if (result.isSchemaMissing) {
    return { items: [], pendingCount: 0, error: result.error, isSchemaMissing: true }
  }
  if (result.error) {
    return { items: [], pendingCount: 0, error: result.error, isSchemaMissing: false }
  }

  const items = result.data.map(enrichRequest)
  const pendingCount = items.filter(i => i.status === 'pending').length
  return { items, pendingCount, error: null, isSchemaMissing: false }
}
