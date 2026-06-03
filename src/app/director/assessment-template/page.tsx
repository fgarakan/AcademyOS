// Director Assessment Template Editor + Registry
// Shows the academy's active Core Assessment Template and all global ball-level templates.
// Allows directors to seed ball-level templates and customize the Core Template.

import { notFound } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { Settings2, History, Info, Database, CheckCircle2 } from 'lucide-react'
import { TemplateSectionEditor } from './_components/TemplateSectionEditor'
import type { SectionEditorRow, SkillEditorRow } from './_components/TemplateSectionEditor'
import { loadAssessmentFormConfig } from '@/lib/assessment/assessmentTemplateLoader'
import { SeedBallLevelTemplatesButton } from './_components/SeedBallLevelTemplatesButton'

// ─── Global template registry row ────────────────────────────────────────────

interface GlobalTemplateRow {
  id: string
  name: string
  description: string | null
  platform_version: string
  section_count: number
  skill_count: number
}

export default async function AssessmentTemplatePage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) notFound()

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') notFound()

  const rawDb = supabase as any
  const academyId = profile.academy_id

  // ── Academy Core Template ──────────────────────────────────────────────────
  let templateId: string | null = null
  let templateName = 'Core Assessment Template'
  let versionCount = 0

  try {
    const config = await loadAssessmentFormConfig(supabase, academyId, 'general', 'standard')
    templateId = config.templateId
    templateName = config.templateName
  } catch {
    // Template tables not yet migrated
  }

  // ── Global template registry (all is_global templates) ────────────────────
  let globalTemplates: GlobalTemplateRow[] = []
  try {
    const { data: globalRows } = await rawDb
      .from('assessment_templates')
      .select('id, name, description, platform_version')
      .eq('is_global', true)
      .order('name', { ascending: true })

    if (globalRows && globalRows.length > 0) {
      // Count sections and skills per template
      const { data: secCounts } = await rawDb
        .from('assessment_template_sections')
        .select('template_id')
        .in('template_id', globalRows.map((r: any) => r.id))

      const { data: skillCounts } = await rawDb
        .from('assessment_template_skills')
        .select('template_id')
        .in('template_id', globalRows.map((r: any) => r.id))

      const secByTemplate = new Map<string, number>()
      const skillByTemplate = new Map<string, number>()

      for (const row of (secCounts ?? [])) {
        secByTemplate.set(row.template_id, (secByTemplate.get(row.template_id) ?? 0) + 1)
      }
      for (const row of (skillCounts ?? [])) {
        skillByTemplate.set(row.template_id, (skillByTemplate.get(row.template_id) ?? 0) + 1)
      }

      globalTemplates = (globalRows as any[]).map((r: any) => ({
        id:               r.id,
        name:             r.name,
        description:      r.description,
        platform_version: r.platform_version,
        section_count:    secByTemplate.get(r.id) ?? 0,
        skill_count:      skillByTemplate.get(r.id) ?? 0,
      }))
    }
  } catch {
    // Template tables not yet applied
  }

  // ── Sections + skills for Core Template editor ─────────────────────────────
  let sections: SectionEditorRow[] = []
  let totalSkills = 0
  let visibleSkills = 0

  if (templateId) {
    const { data: sectionsData } = await rawDb
      .from('assessment_template_sections')
      .select('id, section_key, display_name, sort_order, is_visible, is_custom')
      .eq('template_id', templateId)
      .order('sort_order', { ascending: true })

    const { data: skillsData } = await rawDb
      .from('assessment_template_skills')
      .select('id, section_id, skill_key, display_name, sort_order, is_visible, is_custom, is_required')
      .eq('template_id', templateId)
      .order('sort_order', { ascending: true })

    const skillsBySectionId = new Map<string, SkillEditorRow[]>()
    for (const skill of (skillsData ?? [])) {
      if (!skillsBySectionId.has(skill.section_id)) {
        skillsBySectionId.set(skill.section_id, [])
      }
      skillsBySectionId.get(skill.section_id)!.push({
        id:           skill.id,
        skill_key:    skill.skill_key,
        display_name: skill.display_name,
        sort_order:   skill.sort_order,
        is_visible:   skill.is_visible,
        is_custom:    skill.is_custom,
        is_required:  skill.is_required,
      })
    }

    sections = (sectionsData ?? []).map((sec: any) => ({
      id:           sec.id,
      section_key:  sec.section_key,
      display_name: sec.display_name,
      sort_order:   sec.sort_order,
      is_visible:   sec.is_visible,
      is_custom:    sec.is_custom,
      skills:       skillsBySectionId.get(sec.id) ?? [],
    }))

    totalSkills   = (skillsData ?? []).length
    visibleSkills = (skillsData ?? []).filter((s: any) => s.is_visible).length

    const { count: vCount } = await rawDb
      .from('assessment_template_versions')
      .select('*', { count: 'exact', head: true })
      .eq('template_id', templateId)
    versionCount = (vCount as number | null) ?? 0
  }

  // ── Determine which ball-level templates are already seeded ────────────────
  const ballLevelNames = ['Red Ball Assessment', 'Orange Ball Assessment', 'Green Dot Assessment', 'Yellow Ball Assessment']
  const seededNames = new Set(globalTemplates.map(t => t.name))
  const ballLevelSeeded = ballLevelNames.every(n => seededNames.has(n))

  // ── Not migrated fallback ──────────────────────────────────────────────────
  if (!templateId && globalTemplates.length === 0) {
    return (
      <div className="p-6 max-w-2xl">
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <Info className="w-8 h-8 text-text-muted mx-auto" />
            <p className="text-sm font-semibold text-text-primary">Assessment templates not yet set up</p>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              Apply migrations 081 and 082 to enable the Assessment Template Editor.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl animate-fade-in space-y-8">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
          <Settings2 className="w-5 h-5 text-lime" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary">Assessment Templates</h1>
          <p className="text-xs text-text-muted">Global registry · Academy customization</p>
        </div>
      </div>

      {/* ── Global Template Registry ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="label-xs">Global Assessment Registry</p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {globalTemplates.length} global template{globalTemplates.length !== 1 ? 's' : ''} available
            </p>
          </div>
          {!ballLevelSeeded && <SeedBallLevelTemplatesButton />}
          {ballLevelSeeded && (
            <div className="flex items-center gap-1.5 text-[10px] text-status-green">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Ball-level templates seeded
            </div>
          )}
        </div>

        {globalTemplates.length === 0 ? (
          <div className="px-4 py-6 rounded-xl bg-surface border border-border text-center space-y-2">
            <Database className="w-7 h-7 text-text-muted mx-auto" />
            <p className="text-xs font-semibold text-text-primary">No global templates found</p>
            <p className="text-[11px] text-text-muted">Apply migration 082 to seed the Core Assessment Template.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {globalTemplates.map(t => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface border border-border"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">{t.name}</p>
                  {t.description && (
                    <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">{t.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono text-lime">{t.section_count}</p>
                    <p className="text-[9px] text-text-muted">sections</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono text-text-primary">{t.skill_count}</p>
                    <p className="text-[9px] text-text-muted">skills</p>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted bg-surface-raised border border-border rounded px-1.5 py-0.5">
                    v{t.platform_version}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Core Template Editor ── */}
      {templateId && (
        <section className="space-y-4">
          <div>
            <p className="label-xs">Your Academy Template</p>
            <p className="text-[11px] text-text-muted mt-0.5">{templateName} · Customized for your academy</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-lg font-bold font-mono text-text-primary">{sections.length}</p>
                <p className="text-[10px] text-text-muted">Sections</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-lg font-bold font-mono text-lime">{visibleSkills}</p>
                <p className="text-[10px] text-text-muted">Visible skills</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-lg font-bold font-mono text-text-primary">{versionCount}</p>
                <p className="text-[10px] text-text-muted">Versions saved</p>
              </CardContent>
            </Card>
          </div>

          {/* Rules note */}
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-surface border border-border text-xs text-text-muted">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>You are editing your academy's Core Assessment Template — not the global platform template.</p>
              <p>Every change creates a version snapshot. Existing assessments always reference the version they were recorded with.</p>
              <p>V1 supports: rename, hide/show, reorder. More customization in a future release.</p>
            </div>
          </div>

          {/* Section editor */}
          <div className="space-y-2">
            <p className="label-xs">Sections &amp; Skills</p>
            <p className="text-[11px] text-text-muted">
              Click a section to expand. Arrows = reorder. Eye = hide/show. Pencil = rename.
            </p>
          </div>

          <TemplateSectionEditor templateId={templateId} sections={sections} />

          {versionCount > 0 && (
            <div className="flex items-center gap-2 text-[10px] text-text-muted">
              <History className="w-3.5 h-3.5 shrink-0" />
              <span>{versionCount} version snapshot{versionCount !== 1 ? 's' : ''} saved.</span>
            </div>
          )}
        </section>
      )}

    </div>
  )
}
