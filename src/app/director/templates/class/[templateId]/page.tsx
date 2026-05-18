import Link from 'next/link'
import { ChevronRight, LayoutTemplate, BookOpen, GraduationCap, Clock, Users, CheckCircle2, AlertCircle, FileEdit, Edit3, Eye, Sparkles, ArrowRight } from 'lucide-react'
import { TemplateDonnaPanel } from '@/components/templates/TemplateDonnaPanel'
import { DEMO_CLASS_TEMPLATES, DEMO_CLASS_TEMPLATE_BLOCKS } from '@/lib/templates/templateMockData'

// demo-only — not saved — not connected to live data

type Params = { templateId: string }

const STATUS_CONFIG = {
  ready: { label: 'Ready', icon: CheckCircle2, classes: 'text-status-green border-status-green/40 bg-status-green/8' },
  draft: { label: 'Draft', icon: FileEdit, classes: 'text-status-orange border-status-orange/40 bg-status-orange/8' },
  needs_review: { label: 'Needs Review', icon: AlertCircle, classes: 'text-status-red border-status-red/40 bg-status-red/8' },
}

const BLOCK_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  warm_up: { label: 'Warm-Up', color: 'text-status-blue border-status-blue/30 bg-status-blue/8' },
  technical: { label: 'Technical', color: 'text-lime border-lime/30 bg-lime/8' },
  tactical: { label: 'Tactical', color: 'text-status-orange border-status-orange/30 bg-status-orange/8' },
  physical: { label: 'Physical', color: 'text-status-purple border-status-purple/30 bg-status-purple/8' },
  match_play: { label: 'Match Play', color: 'text-status-red border-status-red/30 bg-status-red/8' },
  cool_down: { label: 'Cool-Down', color: 'text-text-secondary border-border bg-surface-raised' },
}

export default async function ClassTemplateDetailPage({ params }: { params: Promise<Params> }) {
  const { templateId } = await params

  // demo-only: find template from mock data, fall back to first
  const template =
    DEMO_CLASS_TEMPLATES.find(t => t.id === templateId) ?? DEMO_CLASS_TEMPLATES[0]

  const statusCfg = STATUS_CONFIG[template.status]
  const StatusIcon = statusCfg.icon

  return (
    <div className="flex gap-4 lg:gap-6 p-4 lg:p-6 min-h-screen items-start">

      <div className="flex-1 min-w-0 space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] text-text-muted select-none">
          <Link href="/director" className="hover:text-text-secondary transition-colors duration-100">AcademyOS</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <Link href="/director/templates" className="hover:text-text-secondary transition-colors duration-100">Templates</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <Link href="/director/templates/class" className="hover:text-text-secondary transition-colors duration-100">Class Templates</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <span className="text-text-secondary font-medium truncate max-w-[200px]">{template.name}</span>
        </nav>

        {/* Demo notice */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-status-orange/20 bg-status-orange/5 text-[11px] text-status-orange">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Demo view — sample template. Backend wiring coming in a future sprint.</span>
        </div>

        {/* Template overview card */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.classes}`}>
                  <StatusIcon className="w-2.5 h-2.5" />
                  {statusCfg.label}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-lime/20 bg-lime/8 text-lime">
                  <GraduationCap className="w-2.5 h-2.5" />
                  {template.level}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-text-muted">{template.track}</span>
              </div>
              <h1 className="text-xl font-bold text-text-primary leading-tight mb-2">{template.name}</h1>
              <p className="text-sm text-text-secondary leading-relaxed">{template.goal}</p>
            </div>
            <button className="btn-ghost inline-flex items-center gap-2 shrink-0 text-sm">
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-5 pt-2 border-t border-border">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Blocks</p>
              <p className="text-base font-mono font-bold text-lime">{template.blockCount}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Drills</p>
              <p className="text-base font-mono font-bold text-lime">{template.drillCount}</p>
            </div>
            <div className="flex items-end gap-1">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Duration</p>
                <p className="text-base font-mono font-bold text-lime">{template.durationMin}min</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Last Updated</p>
              <p className="text-sm font-medium text-text-secondary">{template.lastUpdated}</p>
            </div>
          </div>
        </div>

        {/* Curriculum connection */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-lime" />
              Curriculum Connection
            </h2>
            <button className="text-[11px] text-lime hover:text-lime/80 transition-colors duration-100">
              Edit connection
            </button>
          </div>

          {template.curriculumConnection ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-lime/5 border border-lime/15">
              <GraduationCap className="w-4 h-4 text-lime shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-primary">{template.curriculumConnection}</p>
                <p className="text-[11px] text-text-muted mt-0.5">This template is linked to curriculum goals and gates at this level.</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-status-green ml-auto shrink-0" />
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-raised border border-border">
              <BookOpen className="w-4 h-4 text-text-muted shrink-0" />
              <div>
                <p className="text-sm text-text-secondary">No curriculum level connected yet.</p>
                <p className="text-[11px] text-text-muted mt-0.5">Connect to a curriculum level to unlock lesson plan generation and gate alignment.</p>
              </div>
              <button className="ml-auto btn-lime text-xs px-3 py-1.5 shrink-0">Connect</button>
            </div>
          )}
        </div>

        {/* Session blocks */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-lime" />
              Session Blocks
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted">
                {DEMO_CLASS_TEMPLATE_BLOCKS.reduce((s, b) => s + b.durationMin, 0)}min total
              </span>
              <button className="text-[11px] text-lime hover:text-lime/80 transition-colors duration-100">
                + Add Block
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {DEMO_CLASS_TEMPLATE_BLOCKS.map((block, i) => {
              const typeCfg = BLOCK_TYPE_CONFIG[block.type] ?? BLOCK_TYPE_CONFIG.technical
              return (
                <div key={block.id} className="rounded-xl border border-border bg-surface-raised p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-text-muted w-5 shrink-0">{i + 1}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border ${typeCfg.color}`}>
                      {typeCfg.label}
                    </span>
                    <span className="text-sm font-semibold text-text-primary">{block.title}</span>
                    <span className="ml-auto flex items-center gap-1 text-[11px] text-text-muted">
                      <Clock className="w-3 h-3" />
                      {block.durationMin}min
                    </span>
                    <button className="text-text-muted hover:text-lime transition-colors duration-100">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-text-secondary pl-8 leading-relaxed">{block.coachingFocus}</p>
                  <div className="flex flex-wrap gap-1.5 pl-8">
                    {block.drills.map(drill => (
                      <span
                        key={drill}
                        className="px-2 py-0.5 rounded-lg text-[10px] border border-border bg-surface text-text-secondary"
                      >
                        {drill}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Coach briefing */}
        {template.coachNotes && (
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Users className="w-4 h-4 text-lime" />
              Coach Briefing Notes
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">{template.coachNotes}</p>
          </div>
        )}

        {/* Draft safety panel */}
        <div className="rounded-2xl border border-lime/15 bg-lime/4 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-lime" />
            <h2 className="text-sm font-bold text-text-primary">Draft Safety</h2>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            This template is in <strong className="text-text-primary">{statusCfg.label}</strong> state.
            {template.status === 'draft' && ' No sessions can be created from it until it is marked Ready.'}
            {template.status === 'needs_review' && ' A director review is required before sessions can be created.'}
            {template.status === 'ready' && ' Coaches can use this template to create sessions.'}
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/director/templates/coach-preview"
              className="btn-ghost inline-flex items-center gap-2 text-sm"
            >
              <Eye className="w-4 h-4" />
              Coach Preview
            </Link>
            <Link
              href="/director/templates/impact-preview"
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-lime/20 bg-lime/5 text-lime hover:bg-lime/10 transition-all duration-100"
            >
              Impact Preview
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      <TemplateDonnaPanel mode="class_detail" />
    </div>
  )
}
