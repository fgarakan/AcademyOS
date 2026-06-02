'use server'

// Mega Sprint 1101-1110 — DONNA Friction Summary Action V1
//
// Director/head_coach only. Returns a structured summary of open friction reports.
// Deterministic — no external AI call.
// Table: friction_reports (migration 077, not in generated types)

import { getSupabaseServer } from '@/lib/supabase/server'

export interface FrictionTypeCount {
  frictionType: string
  count: number
}

export interface FrictionReportPreview {
  id: string
  reporterRole: string
  pagePath: string
  frictionType: string
  severity: string
  comment: string | null
  createdAt: string
}

export interface FrictionSummaryResult {
  ok: boolean
  error: string | null
  totalOpen: number
  blockerCount: number
  highCount: number
  topTypes: FrictionTypeCount[]
  recentReports: FrictionReportPreview[]
  summaryText: string
}

export async function donnaFrictionSummaryAction(): Promise<FrictionSummaryResult> {
  const empty = (error: string): FrictionSummaryResult => ({
    ok: false, error, totalOpen: 0, blockerCount: 0, highCount: 0, topTypes: [], recentReports: [], summaryText: '',
  })

  try {
    const supabase = await getSupabaseServer()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return empty('Not authenticated')

    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()
    if (!profile?.academy_id) return empty('Academy context unavailable')
    const academyId = profile.academy_id

    // Director or head_coach only
    const { data: membership } = await supabase
      .from('academy_memberships')
      .select('role')
      .eq('academy_id', academyId)
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .single()

    const role = membership?.role
    if (role !== 'academy_director' && role !== 'head_coach') {
      return empty('Only directors and head coaches can view friction summaries')
    }

    const rawDb = supabase as any

    const { data: openReports, error: fetchError } = await rawDb
      .from('friction_reports')
      .select('id, reporter_role, page_path, friction_type, severity, comment, created_at')
      .eq('academy_id', academyId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (fetchError) {
      if (fetchError.code === '42P01' || fetchError.message?.includes('does not exist')) {
        return empty('Migration 077 has not been applied. Apply friction_reports migration first.')
      }
      return empty('Failed to load friction reports')
    }

    const reports = (openReports ?? []) as Array<{
      id: string; reporter_role: string; page_path: string; friction_type: string
      severity: string; comment: string | null; created_at: string
    }>

    const totalOpen = reports.length
    const blockerCount = reports.filter(r => r.severity === 'blocker').length
    const highCount = reports.filter(r => r.severity === 'high').length

    const typeCounts: Record<string, number> = {}
    for (const r of reports) {
      typeCounts[r.friction_type] = (typeCounts[r.friction_type] ?? 0) + 1
    }

    const topTypes: FrictionTypeCount[] = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([frictionType, count]) => ({ frictionType, count }))

    const recentReports: FrictionReportPreview[] = reports.slice(0, 10).map(r => ({
      id: r.id,
      reporterRole: r.reporter_role,
      pagePath: r.page_path,
      frictionType: r.friction_type,
      severity: r.severity,
      comment: r.comment,
      createdAt: r.created_at,
    }))

    const summaryText = buildSummaryText({ totalOpen, blockerCount, highCount, topTypes })

    return { ok: true, error: null, totalOpen, blockerCount, highCount, topTypes, recentReports, summaryText }
  } catch {
    return empty('An unexpected error occurred.')
  }
}

function buildSummaryText({ totalOpen, blockerCount, highCount, topTypes }: {
  totalOpen: number; blockerCount: number; highCount: number; topTypes: FrictionTypeCount[]
}): string {
  if (totalOpen === 0) {
    return 'No open friction reports. The pilot is running smoothly — no issues have been flagged.'
  }

  const urgency: string[] = []
  if (blockerCount > 0) urgency.push(`${blockerCount} blocker${blockerCount > 1 ? 's' : ''}`)
  if (highCount > 0) urgency.push(`${highCount} high-severity issue${highCount > 1 ? 's' : ''}`)

  const urgencyLine = urgency.length > 0 ? ` Including ${urgency.join(' and ')}.` : ''

  const topLine = topTypes.length > 0
    ? ` Most common: ${topTypes.slice(0, 3).map(t => `${t.frictionType} (${t.count})`).join(', ')}.`
    : ''

  return `${totalOpen} open friction report${totalOpen > 1 ? 's' : ''}.${urgencyLine}${topLine} Review in the Friction Reports queue.`
}
