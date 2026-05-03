import Link from 'next/link'
import { ChevronRight, BookOpen } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import {
  buildLearningModulePreviews,
  ALL_LEARNING_DOMAINS,
  type LearningModuleDomain,
} from '@/lib/curriculum/learningModules'
import { LearningModulesClient } from './LearningModulesClient'

export default async function CurriculumLearningPage() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  let academyId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()
    academyId = profile?.academy_id ?? null
  }

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  const rawDb = supabase as any

  // Fetch all curriculum levels
  const { data: levelsData } = await rawDb
    .from('curriculum_levels')
    .select('id, display_name, stage')
    .order('sort_order', { ascending: true })
  const levels: { id: string; display_name: string; stage: string }[] = levelsData ?? []

  // Fetch all active gates with from_level_id + domain + criterion + threshold
  const { data: gatesData } = await rawDb
    .from('curriculum_gates')
    .select('id, from_level_id, domain, criterion, threshold')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  const gates: { id: string; from_level_id: string; domain: string; criterion: string; threshold: string }[] =
    gatesData ?? []

  // Fetch active drills with level_min_id + domain + name + objective
  const { data: drillsData } = await rawDb
    .from('curriculum_drills')
    .select('id, level_min_id, domain, name, objective')
    .eq('is_active', true)
    .order('name', { ascending: true })
  const drills: { id: string; level_min_id: string | null; domain: string; name: string; objective: string }[] =
    drillsData ?? []

  // Fetch all coach language rows
  const { data: clData } = await rawDb
    .from('curriculum_coach_language')
    .select('level_id, domain, doing_well, working_on, current_focus, next_step')
  const coachLanguage: {
    level_id: string
    domain: string
    doing_well: string
    working_on: string
    current_focus: string
    next_step: string
  }[] = clData ?? []

  // Build all learning modules deterministically
  const modules = buildLearningModulePreviews({ levels, gates, drills, coachLanguage })

  // Derive filter options
  const stages = Array.from(new Set(levels.map(l => l.stage))).filter(Boolean)
  const domains = ALL_LEARNING_DOMAINS.filter(d =>
    modules.some(m => m.domain === d)
  ) as LearningModuleDomain[]
  const levelNames = levels.map(l => l.display_name).filter(n => modules.some(m => m.level_name === n))

  return (
    <div className="animate-fade-in p-6 space-y-8 max-w-4xl">

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <Link href="/director/curriculum" className="hover:text-lime transition-colors">
            Curriculum
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-text-secondary">Learning Modules</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="page-eyebrow">Director</p>
            <h1 className="page-title flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-lime" />
              Learning Modules
            </h1>
            <p className="page-subtitle max-w-xl">
              Curriculum content organized for players and parents — generated from levels,
              gates, drills, and coach language. Director preview only.
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-lime/30 bg-lime/5 text-[10px] font-semibold text-lime">
            <BookOpen className="w-3 h-3" />
            Learning Module Preview — read-only
          </span>
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-text-muted">
          <span><span className="font-mono text-text-secondary">{modules.length}</span> modules generated</span>
          <span><span className="font-mono text-text-secondary">{levels.length}</span> levels</span>
          <span><span className="font-mono text-text-secondary">{domains.length}</span> domains</span>
          <span><span className="font-mono text-text-secondary">{gates.length}</span> active gates</span>
          <span><span className="font-mono text-text-secondary">{drills.length}</span> active drills</span>
        </div>
      </div>

      {/* Interactive module explorer */}
      <LearningModulesClient
        modules={modules}
        stages={stages}
        domains={domains}
        levelNames={levelNames}
      />

    </div>
  )
}
