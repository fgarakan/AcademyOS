import Link from 'next/link'
import { ChevronRight, Dumbbell, GraduationCap, Clock, CheckCircle2, AlertCircle, FileEdit, Edit3, Eye, Sparkles, ArrowRight, Zap, Activity } from 'lucide-react'
import { TemplateDonnaPanel } from '@/components/templates/TemplateDonnaPanel'
import { DEMO_FITNESS_TEMPLATES } from '@/lib/templates/templateMockData'
import type { TemplateStatus } from '@/lib/templates/templateMockData'

// demo-only — not saved — not connected to live data

type Params = { templateId: string }

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

// Demo exercise data per fitness template
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

export default async function FitnessTemplateDetailPage({ params }: { params: Promise<Params> }) {
  const { templateId } = await params

  const template =
    DEMO_FITNESS_TEMPLATES.find(t => t.id === templateId) ?? DEMO_FITNESS_TEMPLATES[0]

  const statusCfg = STATUS_CONFIG[template.status]
  const StatusIcon = statusCfg.icon
  const levelCls = LEVEL_CLASSES[template.level] ?? 'text-text-muted border-border'
  const loadColor = LOAD_COLOR[template.load] ?? 'text-text-secondary'
  const exercises = DEMO_EXERCISES[template.id] ?? DEMO_EXERCISES['ft-001']

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
          <span className="text-text-secondary font-medium truncate max-w-[200px]">{template.name}</span>
        </nav>

        {/* Demo notice */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-status-orange/20 bg-status-orange/5 text-[11px] text-status-orange">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Demo view — sample template. Backend wiring coming in a future sprint.</span>
        </div>

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
                  {template.level}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-status-purple/20 bg-status-purple/8 text-status-purple">
                  <Zap className="w-2.5 h-2.5" />
                  {template.fitnessGoal}
                </span>
              </div>
              <h1 className="text-xl font-bold text-text-primary leading-tight mb-2">{template.name}</h1>
            </div>
            <button className="btn-ghost inline-flex items-center gap-2 shrink-0 text-sm">
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          </div>

          <div className="flex flex-wrap gap-5 pt-2 border-t border-border">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Exercises</p>
              <p className="text-base font-mono font-bold text-status-purple">{template.exerciseCount}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Duration</p>
              <p className="text-base font-mono font-bold text-status-purple">{template.durationMin}min</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Load</p>
              <p className={`text-base font-mono font-bold ${loadColor}`}>{template.load}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Last Updated</p>
              <p className="text-sm font-medium text-text-secondary">{template.lastUpdated}</p>
            </div>
          </div>
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
            {exercises.map((ex, i) => (
              <div key={ex.name} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-surface-raised">
                <span className="text-[10px] font-mono text-text-muted w-5 shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{ex.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-text-muted">{ex.sets} sets · {ex.reps}</span>
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
            {template.tennisTransfer.map(transfer => (
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

        {/* Coach notes */}
        {template.coachNotes && (
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-status-purple" />
              Coach Notes
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">{template.coachNotes}</p>
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
            {template.status === 'draft' && ' Coaches cannot use this template until it is marked Ready.'}
            {template.status === 'needs_review' && ' Director approval required before coaches can use this template.'}
            {template.status === 'ready' && ' Coaches can include this template in their session plans.'}
          </p>
          <div className="flex items-center gap-3">
            <Link href="/director/templates/coach-preview" className="btn-ghost inline-flex items-center gap-2 text-sm">
              <Eye className="w-4 h-4" />
              Coach Preview
            </Link>
            <Link
              href="/director/templates/impact-preview"
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-status-purple/20 bg-status-purple/5 text-status-purple hover:bg-status-purple/10 transition-all duration-100"
            >
              Impact Preview
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      <TemplateDonnaPanel mode="fitness_detail" />
    </div>
  )
}
