// Director Assessment Template Editor
// Allows directors to rename, hide/show, and reorder sections and skills.
// Academy clone is created automatically on first visit.
// Historical assessments are unaffected — each links to a template version snapshot.

import { notFound } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { Settings2, History, Info } from 'lucide-react'
import { TemplateSectionEditor } from './_components/TemplateSectionEditor'
import type { SectionEditorRow, SkillEditorRow } from './_components/TemplateSectionEditor'
import { loadAssessmentFormConfig } from '@/lib/assessment/assessmentTemplateLoader'
import { autoSuggestView } from '@/lib/assessment/assessmentTemplateTypes'

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

  // Ensure academy template exists (triggers clone if needed)
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

  if (!templateId) {
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

  // Load all sections with their skills for this template
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

  // Build skills-by-section map
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

  const sections: SectionEditorRow[] = (sectionsData ?? []).map((sec: any) => ({
    id:           sec.id,
    section_key:  sec.section_key,
    display_name: sec.display_name,
    sort_order:   sec.sort_order,
    is_visible:   sec.is_visible,
    is_custom:    sec.is_custom,
    skills:       skillsBySectionId.get(sec.id) ?? [],
  }))

  // Version count for the info strip
  const { count: vCount } = await rawDb
    .from('assessment_template_versions')
    .select('*', { count: 'exact', head: true })
    .eq('template_id', templateId)
  versionCount = (vCount as number | null) ?? 0

  // Totals
  const totalSkills   = (skillsData ?? []).length
  const visibleSkills = (skillsData ?? []).filter((s: any) => s.is_visible).length

  return (
    <div className="p-4 sm:p-6 max-w-3xl animate-fade-in">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
          <Settings2 className="w-5 h-5 text-lime" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary">Assessment Template</h1>
          <p className="text-xs text-text-muted">{templateName} · Academy customization</p>
        </div>
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
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
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-surface border border-border mb-6 text-xs text-text-muted">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p>You are editing your academy&apos;s assessment template — not the global platform template.</p>
          <p>Every change creates a version snapshot. Existing assessments always reference the version they were recorded with — historical accuracy is preserved.</p>
          <p>V1 supports: rename, hide/show, reorder. More customization options in a future release.</p>
        </div>
      </div>

      {/* Section editor */}
      <div className="space-y-2 mb-4">
        <p className="label-xs">Sections &amp; Skills</p>
        <p className="text-[11px] text-text-muted">
          Click a section to expand and edit its skills. Expand = see skills. Arrows = reorder. Eye = hide/show. Pencil = rename.
        </p>
      </div>

      <TemplateSectionEditor templateId={templateId} sections={sections} />

      {/* Version history note */}
      {versionCount > 0 && (
        <div className="mt-8 flex items-center gap-2 text-[10px] text-text-muted">
          <History className="w-3.5 h-3.5 shrink-0" />
          <span>{versionCount} version snapshot{versionCount !== 1 ? 's' : ''} saved. Each assessment links to the version active at the time it was recorded.</span>
        </div>
      )}

    </div>
  )
}
