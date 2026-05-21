// Sprint 428 — Director Template Query Layer V1
// Typed query helpers for the template management view.
// Complementary to templateRepository.ts (read operations) — focused on director use cases.
// No select('*') — only needed columns. Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type TemplateStatus = 'draft' | 'published' | 'archived'

export interface TemplateSummary {
  id: string
  name: string
  status: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
  academy_id: string
}

export interface TemplateWithBlockCount extends TemplateSummary {
  blockCount: number
}

// Fetch published templates for a director overview.
export async function fetchPublishedTemplates(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<TemplateSummary[]> {
  const { data, error } = await db
    .from('templates')
    .select('id, name, status, description, is_active, created_at, updated_at, academy_id')
    .eq('academy_id', academyId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return []
  return data ?? []
}

// Fetch all templates by status for the template management view.
export async function fetchTemplatesByStatus(
  db: SupabaseClient<Database>,
  academyId: string,
  status: TemplateStatus,
): Promise<TemplateSummary[]> {
  const { data, error } = await db
    .from('templates')
    .select('id, name, status, description, is_active, created_at, updated_at, academy_id')
    .eq('academy_id', academyId)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

// Fetch template count summary for the director dashboard.
export async function fetchTemplateCounts(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<{ published: number; draft: number; archived: number }> {
  const [publishedResult, draftResult, archivedResult] = await Promise.all([
    db.from('templates').select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId).eq('status', 'published'),
    db.from('templates').select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId).eq('status', 'draft'),
    db.from('templates').select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId).eq('status', 'archived'),
  ])

  return {
    published: publishedResult.count ?? 0,
    draft: draftResult.count ?? 0,
    archived: archivedResult.count ?? 0,
  }
}

// Fetch templates that have been used in recent sessions.
export interface TemplateUsageRecord {
  templateId: string
  templateName: string
  usageCount: number
  lastUsedAt: string
}

export async function fetchRecentlyUsedTemplates(
  db: SupabaseClient<Database>,
  academyId: string,
  limitDays = 30,
  limit = 10,
): Promise<TemplateUsageRecord[]> {
  const since = new Date(Date.now() - limitDays * 86_400_000).toISOString()

  const { data, error } = await db
    .from('sessions')
    .select('template_id, scheduled_date, templates(id, name)')
    .eq('academy_id', academyId)
    .not('template_id', 'is', null)
    .gte('scheduled_date', since)
    .order('scheduled_date', { ascending: false })

  if (error || !data) return []

  // Aggregate by template_id
  const usageMap = new Map<string, { name: string; count: number; lastDate: string }>()
  for (const row of data) {
    if (!row.template_id) continue
    const template = Array.isArray(row.templates) ? row.templates[0] : row.templates
    const name = (template as { name?: string } | null)?.name ?? 'Unknown'
    const existing = usageMap.get(row.template_id)
    if (existing) {
      existing.count += 1
      if (row.scheduled_date > existing.lastDate) existing.lastDate = row.scheduled_date
    } else {
      usageMap.set(row.template_id, { name, count: 1, lastDate: row.scheduled_date })
    }
  }

  return Array.from(usageMap.entries())
    .map(([templateId, { name, count, lastDate }]) => ({
      templateId,
      templateName: name,
      usageCount: count,
      lastUsedAt: lastDate,
    }))
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit)
}
