import Link from 'next/link'
import { ChevronRight, Dumbbell, Plus, Clock, Zap, GraduationCap, AlertCircle, CheckCircle2, FileEdit, Filter, ArrowRight } from 'lucide-react'
import { TemplateDonnaPanel } from '@/components/templates/TemplateDonnaPanel'
import { DEMO_FITNESS_TEMPLATES } from '@/lib/templates/templateMockData'
import type { MockFitnessTemplate, TemplateStatus, LoadLevel } from '@/lib/templates/templateMockData'

// demo-only — not saved — not connected to live data

const STATUS_CONFIG: Record<TemplateStatus, { label: string; classes: string }> = {
  ready: { label: 'Ready', classes: 'text-status-green border-status-green/40 bg-status-green/8' },
  draft: { label: 'Draft', classes: 'text-status-orange border-status-orange/40 bg-status-orange/8' },
  needs_review: { label: 'Needs Review', classes: 'text-status-red border-status-red/40 bg-status-red/8' },
}

const LOAD_CONFIG: Record<LoadLevel, { classes: string; dot: string }> = {
  Light: { classes: 'text-status-green', dot: 'bg-status-green' },
  Moderate: { classes: 'text-status-orange', dot: 'bg-status-orange' },
  High: { classes: 'text-status-red', dot: 'bg-status-red' },
}

const LEVEL_CLASSES: Record<string, string> = {
  Beginner: 'text-status-blue border-status-blue/30 bg-status-blue/8',
  Intermediate: 'text-lime border-lime/30 bg-lime/8',
  Advanced: 'text-status-orange border-status-orange/30 bg-status-orange/8',
  Elite: 'text-status-purple border-status-purple/30 bg-status-purple/8',
}

function FitnessTemplateCard({ template }: { template: MockFitnessTemplate }) {
  const status = STATUS_CONFIG[template.status]
  const load = LOAD_CONFIG[template.load]
  const levelCls = LEVEL_CLASSES[template.level] ?? 'text-text-muted border-border'

  return (
    <Link href={`/director/templates/fitness/${template.id}`}>
      <div className="group relative flex flex-col gap-4 p-5 rounded-2xl border border-border bg-surface hover:border-status-purple/20 hover:bg-surface-raised transition-all duration-150">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${levelCls}`}>
                <GraduationCap className="w-2.5 h-2.5 mr-1" />
                {template.level}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.classes}`}>
                {template.status === 'ready' && <CheckCircle2 className="w-2.5 h-2.5 mr-1" />}
                {template.status === 'needs_review' && <AlertCircle className="w-2.5 h-2.5 mr-1" />}
                {template.status === 'draft' && <FileEdit className="w-2.5 h-2.5 mr-1" />}
                {status.label}
              </span>
            </div>
            <h3 className="text-sm font-bold text-text-primary leading-snug">{template.name}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Zap className="w-3 h-3 text-status-purple" />
              <span className="text-xs text-text-secondary">{template.fitnessGoal}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-status-purple transition-colors duration-150 shrink-0 mt-1" />
        </div>

        {/* Tennis transfer tags */}
        <div className="flex flex-wrap gap-1.5">
          {template.tennisTransfer.map(transfer => (
            <span
              key={transfer}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] text-status-purple border border-status-purple/20 bg-status-purple/5"
            >
              {transfer}
            </span>
          ))}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-[11px] text-text-muted">
          <span className="flex items-center gap-1">
            <Dumbbell className="w-3 h-3" />
            {template.exerciseCount} exercises
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {template.durationMin}min
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${load.dot}`} />
            <span className={load.classes}>{template.load} load</span>
          </span>
          <span className="ml-auto text-[10px]">Updated {template.lastUpdated}</span>
        </div>
      </div>
    </Link>
  )
}

export default function FitnessTemplatesLibraryPage() {
  const ready = DEMO_FITNESS_TEMPLATES.filter(t => t.status === 'ready')
  const draft = DEMO_FITNESS_TEMPLATES.filter(t => t.status === 'draft')
  const review = DEMO_FITNESS_TEMPLATES.filter(t => t.status === 'needs_review')

  return (
    <div className="flex gap-4 lg:gap-6 p-4 lg:p-6 min-h-screen items-start">

      <div className="flex-1 min-w-0 space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] text-text-muted select-none">
          <Link href="/director" className="hover:text-text-secondary transition-colors duration-100">AcademyOS</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <Link href="/director/templates" className="hover:text-text-secondary transition-colors duration-100">Templates</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <span className="text-text-secondary font-medium">Fitness Templates</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="page-eyebrow">Templates</p>
            <h1 className="page-title">Fitness Templates</h1>
            <p className="page-subtitle">Physical training blocks that support speed, strength, mobility, and tennis transfer.</p>
          </div>
          <Link
            href="/director/templates/fitness/create"
            className="inline-flex items-center gap-2 shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-status-purple border border-status-purple/30 bg-status-purple/10 hover:bg-status-purple/15 active:scale-95 transition-all duration-100"
          >
            <Plus className="w-4 h-4" />
            New Template
          </Link>
        </div>

        {/* Demo notice */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-status-orange/20 bg-status-orange/5 text-[11px] text-status-orange">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Demo view — sample templates. Backend wiring coming in a future sprint.</span>
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap gap-5 px-4 py-3 rounded-xl bg-surface-raised border border-border">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Total</p>
            <p className="text-sm font-mono font-bold text-status-purple">{DEMO_FITNESS_TEMPLATES.length}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Ready</p>
            <p className="text-sm font-mono font-bold text-status-green">{ready.length}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Draft</p>
            <p className="text-sm font-mono font-bold text-status-orange">{draft.length}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Needs Review</p>
            <p className="text-sm font-mono font-bold text-status-red">{review.length}</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-status-purple/20 bg-status-purple/5 text-xs font-medium text-status-purple">
            <Filter className="w-3 h-3" />
            All Goals
          </button>
          {(['Speed & Agility', 'Strength & Power', 'Mobility & Flexibility', 'Endurance', 'Coordination'] as const).map(goal => (
            <button key={goal} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface text-xs text-text-muted hover:border-status-purple/20 hover:text-text-secondary transition-all duration-100">
              {goal}
            </button>
          ))}
        </div>

        {/* Cross-link to class templates */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Dumbbell className="w-3.5 h-3.5" />
            Looking for class templates?
          </div>
          <Link
            href="/director/templates/class"
            className="inline-flex items-center gap-1.5 text-xs text-lime hover:text-lime/80 transition-colors duration-100"
          >
            Class Templates
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {DEMO_FITNESS_TEMPLATES.map(template => (
            <FitnessTemplateCard key={template.id} template={template} />
          ))}
        </div>

      </div>

      <TemplateDonnaPanel mode="fitness_library" />
    </div>
  )
}
