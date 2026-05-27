/**
 * CurriculumBuilderChangeQueue — Sprint 903
 *
 * Server component. Queries academy_curriculum_overrides for pending
 * curriculum drafts and passes them to the CurriculumChangeQueue display
 * component.
 *
 * Source: academy_curriculum_overrides (migration 048)
 *   status IN ('pending_review', 'draft')   — review-relevant only
 *   applied / rejected / rolled_back        — excluded from this queue
 *
 * Does NOT call execute_curriculum_override().
 * Does NOT use proposed_actions.
 * Does NOT mutate any rows.
 * Read-only.
 *
 * Related:
 *   src/lib/actions/curriculumDraftActions.ts — writes pending_review rows
 *   supabase/migrations/048_academy_curriculum_clone.sql — table schema
 *   supabase/migrations/069_execute_curriculum_override.sql — execution (Sprint 904+)
 */

import { getSupabaseServer } from '@/lib/supabase/server'
import {
  CurriculumChangeQueue,
  type CurriculumChangeItem,
} from '@/components/curriculum/builder/CurriculumChangeQueue'

// ─── JSONB helper ─────────────────────────────────────────────────────────────

/** Safely extract a non-empty string from an unknown JSONB object by key. */
function jsonString(obj: unknown, key: string): string | null {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return null
  const val = (obj as Record<string, unknown>)[key]
  if (typeof val === 'string' && val.trim()) return val.trim()
  return null
}

// ─── Row shape returned by the query ─────────────────────────────────────────

interface OverrideRow {
  id: string
  target_type: string
  override_type: string
  source: string
  status: string
  created_at: string
  proposed_change: unknown          // JSONB
  raw_input: string | null
}

// ─── Component ───────────────────────────────────────────────────────────────

export async function CurriculumBuilderChangeQueue() {
  const supabase = await getSupabaseServer()

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Resolve academy from authenticated profile — never from client
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return null

  const academyId = profile.academy_id

  // ── Query academy_curriculum_overrides ──────────────────────────────────────
  // academy_curriculum_overrides is not in generated database.types.ts yet
  // (migrations 048/069 applied but types not regenerated).
  // Using rawDb = supabase as any per AI_BACKEND_RULES rule 4 (TS2589 workaround).
  // RLS enforces academy_id scoping server-side; we also filter explicitly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawDb = supabase as any
  const { data: rows, error } = (await rawDb
    .from('academy_curriculum_overrides')
    .select('id,target_type,override_type,source,status,created_at,proposed_change,raw_input')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'draft'])
    .order('created_at', { ascending: false })
    .limit(20)) as { data: OverrideRow[] | null; error: { message: string } | null }

  // Error state — non-null error means query failed
  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">
          Pending Drafts
        </p>
        <CurriculumChangeQueue
          items={[]}
          errorMessage="I couldn't load curriculum drafts yet."
        />
      </div>
    )
  }

  // ── Map rows → CurriculumChangeItem ────────────────────────────────────────
  const items: CurriculumChangeItem[] = (rows ?? []).map((r: OverrideRow) => {
    const pc = r.proposed_change

    // Title: prefer proposed_change.title → truncated raw_input → fallback label
    const title = (() => {
      const fromChange = jsonString(pc, 'title')
      if (fromChange) return fromChange
      if (typeof r.raw_input === 'string' && r.raw_input.trim()) {
        const raw = r.raw_input.trim()
        return raw.length > 60 ? raw.slice(0, 59) + '…' : raw
      }
      return `${r.override_type} ${r.target_type}`
    })()

    // Description: prefer proposed_change.description → null
    const description = jsonString(pc, 'description')

    // Content type from proposed_change
    const contentType = jsonString(pc, 'content_type')

    // Status: only values present in schema
    const validStatuses = [
      'draft',
      'pending_review',
      'approved',
      'applied',
      'rejected',
      'rolled_back',
    ] as const
    const status = (
      validStatuses.includes(r.status as (typeof validStatuses)[number])
        ? r.status
        : 'pending_review'
    ) as CurriculumChangeItem['status']

    return {
      id: r.id,
      title,
      contentType,
      overrideType: r.override_type,
      source: r.source,
      status,
      createdAt: r.created_at,
      description,
    }
  })

  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">
        Pending Drafts
      </p>
      <CurriculumChangeQueue items={items} />
    </div>
  )
}
