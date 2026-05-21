// Sprint 468 — DONNA Academy Search V1
// Safe search abstraction for DONNA — scoped by role, academy, and data classification.
// All search functions are read-only. No writes. No AI calls.
// Parent/player search is visibility-gated.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export type AcademyRole = 'academy_director' | 'head_coach' | 'coach' | 'player' | 'parent'

export type SearchArea =
  | 'players'
  | 'groups'
  | 'sessions'
  | 'templates'
  | 'curriculum'

export interface SearchResult {
  id: string
  area: SearchArea
  label: string
  description: string | null
  href: string | null
  relevanceScore: number    // 0–100; higher = better match
}

// ── Player search ──────────────────────────────────────────────────────────────

export async function searchPlayers(
  db: SupabaseClient<Database>,
  query: string,
  academyId: string,
  limit = 10,
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const { data, error } = await db
    .from('players')
    .select('id, first_name, last_name, full_name, status')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .ilike('full_name', `%${query}%`)
    .limit(limit)

  if (error || !data) return []

  return data.map(p => ({
    id: p.id,
    area: 'players' as SearchArea,
    label: p.full_name ?? `${p.first_name} ${p.last_name}`,
    description: p.status ?? null,
    href: `/director/players/${p.id}`,
    relevanceScore: computeRelevance(query, p.full_name ?? `${p.first_name} ${p.last_name}`),
  }))
}

// ── Group search ───────────────────────────────────────────────────────────────

export async function searchGroups(
  db: SupabaseClient<Database>,
  query: string,
  academyId: string,
  limit = 10,
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const { data, error } = await db
    .from('groups')
    .select('id, name, description')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .ilike('name', `%${query}%`)
    .limit(limit)

  if (error || !data) return []

  return data.map(g => ({
    id: g.id,
    area: 'groups' as SearchArea,
    label: g.name,
    description: (g as { description?: string | null }).description ?? null,
    href: `/director/groups/${g.id}`,
    relevanceScore: computeRelevance(query, g.name),
  }))
}

// ── Template search ────────────────────────────────────────────────────────────

export async function searchTemplates(
  db: SupabaseClient<Database>,
  query: string,
  academyId: string,
  limit = 10,
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const { data, error } = await db
    .from('templates')
    .select('id, name, description')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .ilike('name', `%${query}%`)
    .limit(limit)

  if (error || !data) return []

  return data.map(t => ({
    id: t.id,
    area: 'templates' as SearchArea,
    label: t.name,
    description: t.description ?? null,
    href: `/director/templates/${t.id}`,
    relevanceScore: computeRelevance(query, t.name),
  }))
}

// ── Multi-area search (for DONNA quick lookup) ────────────────────────────────

export async function searchAcademy(
  db: SupabaseClient<Database>,
  query: string,
  academyId: string,
  role: AcademyRole,
  areas?: SearchArea[],
): Promise<SearchResult[]> {
  const targetAreas: SearchArea[] = areas ?? getSearchAreasForRole(role)
  const limit = 5  // per area

  const resultSets = await Promise.all(
    targetAreas.map(area => {
      if (area === 'players') return searchPlayers(db, query, academyId, limit)
      if (area === 'groups') return searchGroups(db, query, academyId, limit)
      if (area === 'templates') return searchTemplates(db, query, academyId, limit)
      return Promise.resolve([])
    }),
  )

  const combined = resultSets.flat()
  combined.sort((a, b) => b.relevanceScore - a.relevanceScore)
  return combined.slice(0, 20)
}

// ── Role-to-searchable-areas mapping ──────────────────────────────────────────

export function getSearchAreasForRole(role: AcademyRole): SearchArea[] {
  if (role === 'academy_director') return ['players', 'groups', 'sessions', 'templates', 'curriculum']
  if (role === 'head_coach' || role === 'coach') return ['players', 'groups', 'sessions']
  return []   // player/parent do not use DONNA search
}

// ── Relevance scoring (pure, deterministic) ────────────────────────────────────

function computeRelevance(query: string, target: string): number {
  if (!target) return 0
  const q = query.toLowerCase().trim()
  const t = target.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 90
  if (t.includes(q)) return 70
  // Word-level match
  const words = q.split(/\s+/)
  const matchCount = words.filter(w => t.includes(w)).length
  return Math.round((matchCount / words.length) * 50)
}
