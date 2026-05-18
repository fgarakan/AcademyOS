import Link from 'next/link'
import { ChevronRight, Dumbbell, GraduationCap, Clock, CheckCircle2, AlertCircle, FileEdit, Edit3, Eye, Sparkles, ArrowRight, Zap, Activity, BookOpen, Database, History } from 'lucide-react'
import { TemplateDonnaPanel } from '@/components/templates/TemplateDonnaPanel'
import { DEMO_FITNESS_TEMPLATES } from '@/lib/templates/templateMockData'
import type { TemplateStatus } from '@/lib/templates/templateMockData'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getTemplateById, getTemplateBlocks, getTemplateBlockExercises, getTemplateVersionHistory } from '@/lib/templates/templateRepository'
import type { TemplateRow, TemplateBlockExerciseRow, TemplateVersionHistoryRow } from '@/lib/templates/templateRepository'

type Params = { templateId: string }

const CHANGE_TYPE_LABEL: Record<string, string> = {
  create_template: 'Created',
  update_template: 'Updated',
  archive_template: 'Archived',
  duplicate_template: 'Duplicated',
}

const STATUS_CONFIG: Record<TemplateStatus, { label: string; icon: typeof CheckCircle2; classes: string }> = {
  ready: { label: 'Ready', icon: CheckCircle2, classes: 'text-status-green border-status-green/40 bg-status-green/8' },
  draft: { label: 'Draft', icon: FileEdit, classes: 'text-status-orange border-status-orange/40 bg-status-orange/8' },
  needs_review: { label: 'Needs Review', icon: AlertCircle, classes: 'text-status-red border-status-red/40 bg-status-red/8' },
}

const LOAD_COLOR: Record<string, string> = {
  Light: 'text-status-green',
  Moderate: 'text-status-orange',
  High: 'text-status-red',
}

const LEVEL_CLASSES: Record<string, string> = {
  Beginner: 'text-status-blue border-status-blue/30 bg-status-blue/8',
  Intermediate: 'text-lime border-lime/30 bg-lime/8',
  Advanced: 'text-status-orange border-status-orange/30 bg-status-orange/8',
  Elite: 'text-status-purple border-status-purple/30 bg-status-purple/8',
}

const LEVEL_TO_CURRICULUM_STAGE: Record<string, string> = {
  Beginner:     'Red Ball / Orange Ball',
  Intermediate: 'Green Ball',
  Advanced:     'Yellow Ball',
  Elite:        'High Performance',
}

const DEMO_EXERCISES: Record<string, { name: string; sets: string; reps: string; notes?: string }[]> = {
  'ft-001': [
    { name: 'Lateral Cone Sprint', sets: '4', reps: '6 each side', notes: 'Focus on outside foot plant' },
    { name: 'Ladder Footwork — 2-in/2-out', sets: '3', reps: '4 passes', notes: 'Maintain low center of gravity' },
    { name: 'T-Pattern Drill', sets: '3', reps: '5 reps', notes: 'Touch each cone, full deceleration' },
    { name: 'Split-Step Reaction Drill', sets: '4', reps: '10 triggers', notes: 'React on coach command' },
  ],
  'ft-002': [
    { name: 'Medicine Ball Rotational Throw', sets: '3', reps: '8 each side' },
    { name: 'Single-Leg Squat', sets: '3', reps: '8 each leg', notes: 'Knee tracks over second toe' },
    { name: 'Band Shoulder External Rotation', sets: '3', reps: '15 reps' },
    { name: 'Explosive Broad Jump', sets: '3', reps: '5 reps', notes: 'Stick the landing — 2 seconds' },
    { name: 'Pallof Press', sets: '3', reps: '10 each side' },
  ],
  'ft-003': [
    { name: 'Hip 90/90 Stretch', sets: '2', reps: '60s each side' },
    { name: 'Thoracic Rotation with Reach', sets: '2', reps: '10 each side' },
    { name: 'Ankle Circles + Calf Raise', sets: '2', reps: '15 reps' },
    { name: 'World Greatest Stretch', sets: '2', reps: '8 each side' },
    { name: 'Prone Hip IR Stretch', sets: '2', reps: '45s each side' },
  ],
}

function liveExt(t: TemplateRow | null, key: string): unknown {
  if (!t) return undefined
  return (t as unknown as Record<string, unknown>)[key]
}

function exerciseExt(e: TemplateBlockExerciseRow, key: string): unknown {
  return (e as unknown as Record<string, unknown>)[key]
}

function resolveStatus(live: TemplateRow | null, fallback: TemplateStatus): TemplateStatus {
  const s = liveExt(live, 'status') as string | undefined
  if (s === 'ready' || s === 'draft' || s === 'needs_review') return s
  if (live) return live.is_active ? 'ready' : 'draft'
  return fallback
}

export default async function FitnessTemplateDetailPage({ params }: { params: Promise<Params> }) {
  const { templateId } = await params

  // ── Repository fetch ──────────────────────────────────────────────────────
  let liveTemplate: TemplateRow | null = null
  let liveExercises: TemplateBlockExerciseRow[] = []
  let dataSource: 'live' | 'demo' = 'demo'
  let versionHistory: TemplateVersionHistoryRow[] = []
  let versionHistorySchemaMissing = false

  try {
    const db = await getSupabaseServer()
    const { data: { user } } = await db.auth.getUser()
    if (user) {
      const { data: profile } = await db
        .from('profiles')
        .select('academy_id')
        .eq('id', user.id)
        .single()
      if (profile?.academy_id) {
        const tResult = await getTemplateById(db, templateId, profile.academy_id)
        if (tResult.data && !tResult.isSchemaMissing) {
          liveTemplate = tResult.data
          const exResult = await getTemplateBlockExercises(db, templateId)
          if (!exResult.isSchemaMissing) liveExercises = exResult.data
          dataSource = 'live'
          const vResult = await getTemplateVersionHistory(db, templateId, profile.academy_id)
          if (vResult.isSchemaMissing) {
            versionHistorySchemaMissing = true
          } else {
            versionHistory = vResult.data
          }
        }
      }
    }
  } catch {
    // fall through to demo
  }

  // ── Demo fallback ─────────────────────────────────────────────────────────
  const demoTemplate =
    DEMO_FITNESS_TEMPLATES.find(t => t.id === templateId) ?? DEMO_FITNESS_TEMPLATES[0]

  // ── Unified display values ────────────────────────────────────────────────
  const displayName = liveTemplate?.name ?? demoTemplate.name
  const displayStatus = resolveStatus(liveTemplate, demoTemplate.status)
  const displayLevel = (liveExt(liveTemplate, 'curriculum_level_key') as string | undefined) ?? demoTemplate.level
  const displayFitnessGoal = (liveExt(liveTemplate, 'template_goal') as string | undefined) ?? liveTemplate?.description ?? demoTemplate.fitnessGoal
  const displayDurationMin = liveTemplate?.total_duration_min ?? demoTemplate.durationMin
  const displayLoad = demoTemplate.load // always demo — no live equivalent in base schema
  const displayUpdated = liveTemplate ? (liveTemplate.updated_at?.slice(0, 10) ?? '') : demoTemplate.lastUpdated
  const displayCurriculumStage = LEVEL_TO_CURRICULUM_STAGE[displayLevel]

  // Tennis transfer: use live template tags as proxy if available
  const liveTags = liveTemplate?.tags ?? []
  const displayTennisTransfer = liveTags.length > 0 ? liveTags : demoTemplate.tennisTransfer

  // Exercises: use live if found, else demo
  type DisplayExercise = { key: string; name: string; sets: string; reps: string; notes?: string }
  const displayExercises: DisplayExercise[] = liveExercises.length > 0
    ? liveExercises.map((e, i) => ({
        key: e.id,
        name: (exerciseExt(e, 'exercise_label') as string | undefined) ?? `Exercise ${i + 1}`,
        sets: (exerciseExt(e, 'sets_reps_duration') as string | undefined) ?? '—',
        reps: '',
        notes: e.notes ?? undefined,
      }))
    : (DEMO_EXERCISES[templateId] ?? DEMO_EXERCISES['ft-001']).map((ex, i) => ({
        key: `${templateId}-ex-${i}`,
        ...ex,
      }))

  const displayExerciseCount = liveExercises.length > 0 ? liveExercises.length : demoTemplate.exerciseCount

  const statusCfg = STATUS_CONFIG[displayStatus]
  const StatusIcon = statusCfg.icon
  const levelCls = LEVEL_CLASSES[displayLevel] ?? 'text-text-muted border-border'
  const loadColor = LOAD_COLOR[displayLoad] ?? 'text-text-secondary'

  return (
    <div className="flex gap-4 lg:gap-6 p-4 lg:p-6 min-h-screen items-start">

      <div className="flex-1 min-w-0 space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] text-text-muted select-none">
          <Link href="/director" className="hover:text-text-secondary transition-colors duration-100">AcademyOS</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <Link href="/director/templates" className="hover:text-text-secondary transition-colors duration-100">Templates</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <Link href="/director/templates/fitness" className="hover:text-text-secondary transition-colors duration-100">Fitness Templates</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <span className="text-text-secondary font-medium truncate max-w-[200px]">{displayName}</span>
        </nav>

        {/* Source banner */}
        {dataSource === 'live' ? (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-status-green/20 bg-status-green/5 text-[11px] text-status-green">
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>Live saved template.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-status-orange/20 bg-status-orange/5 text-[11px] text-status-orange">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Demo template preview.</span>
          </div>
        )}

        {/* Template overview */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.classes}`}>
                  <StatusIcon className="w-2.5 h-2.5" />
                  {statusCfg.label}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${levelCls}`}>
                  <GraduationCap className="w-2.5 h-2.5" />
                  {displayLevel}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-status-purple/20 bg-status-purple/8 text-status-purple">
                  <Zap className="w-2.5 h-2.5" />
                  {displayFitnessGoal}
                </span>
              </div>
              <h1 className="text-xl font-bold text-text-primary leading-tight mb-2">{displayName}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <Link
                href={`/director/templates/coach-preview?level=${encodeURIComponent(displayLevel)}&goal=${encodeURIComponent(displayFitnessGoal ?? '')}&type=fitness&templateId=${encodeURIComponent(templateId)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-text-secondary hover:border-status-purple/20 hover:text-text-primary transition-all duration-100"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </Link>
              <Link
                href={`/director/templates/fitness/create`}
                className="btn-ghost inline-flex items-center gap-1.5 text-sm"
              >
                <Edit3 className="w-4 h-4" />
                Edit Draft
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-5 pt-2 border-t border-border">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Exercises</p>
              <p className="text-base font-mono font-bold text-status-purple">{displayExerciseCount}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Duration</p>
              <p className="text-base font-mono font-bold text-status-purple">{displayDurationMin}min</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Load</p>
              <p className={`text-base font-mono font-bold ${loadColor}`}>{displayLoad}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Last Updated</p>
              <p className="text-sm font-medium text-text-secondary">{displayUpdated}</p>
            </div>
          </div>
        </div>

        {/* Curriculum connection */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-lime" />
            Curriculum Connection
          </h2>
          {displayCurriculumStage ? (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-lime/15 bg-lime/5">
              <GraduationCap className="w-4 h-4 text-lime shrink-0" />
              <div>
                <p className="text-sm font-semibold text-lime">{displayCurriculumStage}</p>
                <p className="text-[11px] text-text-muted mt-0.5">This template targets the physical development needs of the {displayCurriculumStage} curriculum stage.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-surface-raised">
              <BookOpen className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-text-secondary">No curriculum stage connected yet.</p>
                <p className="text-[11px] text-text-muted mt-0.5">Connect to a curriculum level to unlock stage-specific physical development alignment.</p>
              </div>
            </div>
          )}
        </div>

        {/* Exercises list */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-status-purple" />
              Exercises
            </h2>
            <button className="text-[11px] text-status-purple hover:text-status-purple/80 transition-colors duration-100">
              + Add Exercise
            </button>
          </div>
          <div className="space-y-3">
            {displayExercises.map((ex, i) => (
              <div key={ex.key} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-surface-raised">
                <span className="text-[10px] font-mono text-text-muted w-5 shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{ex.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-text-muted">
                      {ex.reps ? `${ex.sets} sets · ${ex.reps}` : ex.sets}
                    </span>
                  </div>
                  {ex.notes && (
                    <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">{ex.notes}</p>
                  )}
                </div>
                <button className="text-text-muted hover:text-status-purple transition-colors duration-100 shrink-0">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tennis transfer */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-status-purple" />
            Tennis Transfer
          </h2>
          <div className="flex flex-wrap gap-2">
            {displayTennisTransfer.map(transfer => (
              <span
                key={transfer}
                className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium border border-status-purple/20 bg-status-purple/8 text-status-purple"
              >
                <Zap className="w-3 h-3 mr-1.5" />
                {transfer}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            These tennis skills are directly developed through the exercise selection in this template.
          </p>
        </div>

        {/* Curriculum / Pathway connection */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-status-purple" />
              Curriculum Pathway Connection
            </h2>
            <button className="text-[11px] text-status-purple hover:text-status-purple/80 transition-colors duration-100">
              Connect pathway
            </button>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-raised border border-border">
            <GraduationCap className="w-4 h-4 text-text-muted shrink-0" />
            <div>
              <p className="text-sm text-text-secondary">No curriculum pathway connected yet.</p>
              <p className="text-[11px] text-text-muted mt-0.5">Connect to a physical development pathway to see which curriculum milestones this template supports.</p>
            </div>
          </div>
        </div>

        {/* Coach notes (demo only) */}
        {dataSource === 'demo' && demoTemplate.coachNotes && (
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-status-purple" />
              Coach Notes
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">{demoTemplate.coachNotes}</p>
          </div>
        )}

        {/* Review queue handoff preview */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-status-purple" />
            Review Queue Handoff
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            When submitted for review, this fitness template enters the Director Review Queue. Load management and tennis transfer alignment are verified before approval.
          </p>
          <div className="space-y-2">
            {[
              { step: '1', label: 'Submit for Review', desc: 'Template locked — exercises and load reviewed', color: 'text-status-purple border-status-purple/20 bg-status-purple/5' },
              { step: '2', label: 'Director Reviews', desc: `${displayName} · ${displayLoad} load · ${displayDurationMin}min`, color: 'text-status-orange border-status-orange/20 bg-status-orange/5' },
              { step: '3', label: 'Approved → Ready', desc: 'Template available in coach session builder', color: 'text-status-green border-status-green/20 bg-status-green/5' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-surface-raised">
                <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 ${item.color}`}>
                  {item.step}
                </span>
                <div>
                  <p className="text-xs font-semibold text-text-primary">{item.label}</p>
                  <p className="text-[11px] text-text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-text-muted">Review queue backend wiring coming in Sprint 978.</p>
        </div>

        {/* Version History */}
        {dataSource === 'live' ? (
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-text-muted" />
              <h2 className="text-sm font-bold text-text-primary">Version History</h2>
              {versionHistory.length > 0 && (
                <span className="ml-auto text-[10px] text-text-muted">{versionHistory.length} record{versionHistory.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            {versionHistorySchemaMissing ? (
              <p className="text-[11px] text-text-muted">Version history unavailable until backend migration is applied.</p>
            ) : versionHistory.length === 0 ? (
              <p className="text-[11px] text-text-muted">No version history yet.</p>
            ) : (
              <div className="space-y-1.5">
                {versionHistory.slice(0, 3).map(v => (
                  <div key={v.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-surface-raised">
                    <span className="text-[10px] font-mono text-lime w-6 shrink-0">v{v.version_number}</span>
                    <span className="text-[10px] text-text-secondary flex-1 min-w-0 truncate">{CHANGE_TYPE_LABEL[v.change_type] ?? v.change_type}</span>
                    <span className="text-[10px] text-text-muted font-mono shrink-0">{v.created_at.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-3 rounded-xl border border-border bg-surface-raised">
            <p className="text-[11px] text-text-muted">Version history appears for saved templates.</p>
          </div>
        )}

        {/* Draft safety panel */}
        <div className="rounded-2xl border border-status-purple/15 bg-status-purple/4 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-status-purple" />
            <h2 className="text-sm font-bold text-text-primary">Draft Safety</h2>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            This template is <strong className="text-text-primary">{statusCfg.label}</strong>.
            {displayStatus === 'draft' && ' Coaches cannot use this template until it is marked Ready.'}
            {displayStatus === 'needs_review' && ' Director approval required before coaches can use this template.'}
            {displayStatus === 'ready' && ' Coaches can include this template in their session plans.'}
          </p>
          <div className="flex items-center gap-3">
            <Link href="/director/templates/coach-preview" className="btn-ghost inline-flex items-center gap-2 text-sm">
              <Eye className="w-4 h-4" />
              Coach Preview
            </Link>
            <Link
              href={`/director/templates/impact-preview?name=${encodeURIComponent(displayName)}&level=${encodeURIComponent(displayLevel)}&type=fitness`}
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-status-purple/20 bg-status-purple/5 text-status-purple hover:bg-status-purple/10 transition-all duration-100"
            >
              Impact Preview
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      <TemplateDonnaPanel
        mode="fitness_detail"
        context={{
          templateName: displayName,
          templateLevel: displayLevel,
          templateType: 'fitness',
          durationMin: displayDurationMin,
          status: displayStatus,
        }}
      />
    </div>
  )
}
