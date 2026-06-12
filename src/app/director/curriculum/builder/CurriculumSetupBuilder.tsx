'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Shield, CheckCircle2, ChevronRight, BookOpen, Pencil, X, Settings, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import type { CurriculumSetupState } from '@/lib/curriculum/curriculumSetupTypes'
import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'
import type { CurriculumIntelligenceContext } from '@/lib/donna/curriculum/curriculumIntelligenceContext'
import type { CurriculumModificationIntent } from '@/lib/donna/curriculum/curriculumDraftObject'
import { buildCurriculumRecommendations } from '@/lib/donna/curriculum/curriculumArchitect'
import { DonnaCurriculumPanel } from './DonnaCurriculumPanel'
import { CurriculumRecommendationCard } from './CurriculumRecommendationCard'
import { CurriculumEvolutionPanel } from './CurriculumEvolutionPanel'
import { CurriculumKeyboardHintBar } from '@/components/curriculum/builder/CurriculumKeyboardHintBar'
import { buildCurriculumGapChip } from '@/lib/donna/curriculumBuilderDonnaContext'
import { onGoalSessionCompleted } from '@/lib/donna/pageSync/donnaPageSyncEvents'
import {
  buildWorkflowExecutionPlan,
  buildWorkflowDraftPayload,
  buildWorkflowVerificationResult,
  buildWorkflowCompletionSummary,
  type WorkflowExecutionPlan,
  type WorkflowCompletionSummary,
} from '@/lib/donna/workflows/donnaWorkflowExecutionEngine'
import {
  createCurriculumContentItemDraft,
  type CurriculumContentType,
} from '@/lib/actions/curriculumDraftActions'

interface Props {
  initialState: CurriculumSetupState
  origin: 'onboarding' | 'builder'
  levels?: CurriculumLevel[]
  intelligenceContext?: CurriculumIntelligenceContext
  initialMemory?: import('@/lib/donna/curriculum/curriculumEvolutionMemory').EvolutionMemoryEntry[]
}

const STAGE_COLOR: Record<string, string> = {
  red_foundation:     '#ef4444',
  orange_development: '#f97316',
  green_performance:  '#22c55e',
  yellow_competitive: '#eab308',
  high_performance:   '#11d9df',
}

const PATHWAYS = [
  {
    name: 'Red Ball',
    levels: 3,
    dot: '#ef4444',
    border: 'rgba(239,68,68,0.22)',
    glow: 'rgba(239,68,68,0.06)',
  },
  {
    name: 'Orange Ball',
    levels: 3,
    dot: '#f97316',
    border: 'rgba(249,115,22,0.22)',
    glow: 'rgba(249,115,22,0.06)',
  },
  {
    name: 'Green Ball',
    levels: 3,
    dot: '#22c55e',
    border: 'rgba(34,197,94,0.22)',
    glow: 'rgba(34,197,94,0.06)',
  },
  {
    name: 'Yellow Ball',
    levels: 3,
    dot: '#eab308',
    border: 'rgba(234,179,8,0.22)',
    glow: 'rgba(234,179,8,0.06)',
  },
  {
    name: 'High Performance',
    levels: 3,
    dot: '#11d9df',
    border: 'rgba(17,217,223,0.22)',
    glow: 'rgba(17,217,223,0.06)',
  },
]

const HOW_IT_WORKS = [
  {
    num: '1',
    icon: BookOpen,
    title: 'Review your master curriculum',
    desc: 'DONNA has pre-loaded the standard curriculum for your academy type.',
  },
  {
    num: '2',
    icon: Pencil,
    title: 'Customize each level',
    desc: "Add your academy's drills, exercises, and assessment criteria.",
  },
  {
    num: '3',
    icon: CheckCircle2,
    title: 'Approve changes',
    desc: 'Nothing goes live until you review and approve every change.',
  },
]

const curriculumGapChip = buildCurriculumGapChip()

function openDonnaWithCurriculumGapPrompt() {
  window.dispatchEvent(new CustomEvent('donna:open', { detail: { prompt: curriculumGapChip.prompt } }))
}

// Maps DONNA's free-text object_type answer to the DB content_type.
// Preserves all distinct types from migration 061 taxonomy.
// Subskill → 'skill': skillHierarchyModel.ts has Skill→SubSkill hierarchy
// but backing DB tables do not exist yet (Sprint 511 limitation).
function mapObjectTypeToContentType(raw: string): CurriculumContentType {
  const t = raw.toLowerCase()
  if (t.includes('mental') || t.includes('mindset') || t.includes('focus') || t.includes('emotion')) return 'mental_skill'
  if (t.includes('progression') || t.includes('pathway'))  return 'progression'
  if (t.includes('tactical') || t.includes('tactic') || t.includes('strategy')) return 'tactical'
  if (t.includes('drill') || t.includes('activity') || t.includes('exercise'))  return 'drill'
  if (t.includes('skill') || t.includes('subskill') || t.includes('sub-skill') || t.includes('technique')) return 'skill'
  return 'drill'
}

function inferDomain(objectType: string): string | undefined {
  const t = objectType.toLowerCase()
  if (t.includes('mental') || t.includes('mindset') || t.includes('focus') || t.includes('emotion')) return 'Mentality'
  if (t.includes('tactical') || t.includes('tactic') || t.includes('strategy')) return 'Tactical'
  if (t.includes('skill') || t.includes('subskill') || t.includes('technique')) return 'Technical'
  return undefined
}

function parseCoachCues(raw: string): string[] {
  return raw.split(/[,;]+/).map(s => s.trim()).filter(Boolean).slice(0, 5)
}

export function CurriculumSetupBuilder({ levels = [], intelligenceContext, initialMemory = [] }: Props) {
  const router = useRouter()
  const [jumpOpen, setJumpOpen] = useState(false)

  // Intelligence panel state
  const [panelLevelId, setPanelLevelId] = useState<string | undefined>(undefined)
  const [panelIntent, setPanelIntent]   = useState<CurriculumModificationIntent | undefined>(undefined)
  const [intelligenceTab, setIntelligenceTab] = useState<'architect' | 'evolution'>('architect')

  const recommendations = intelligenceContext
    ? buildCurriculumRecommendations(intelligenceContext)
    : []

  function handleSelectRecommendation(levelId: string, intent: CurriculumModificationIntent) {
    setPanelLevelId(levelId)
    setPanelIntent(intent)
    // Scroll to panel
    document.getElementById('donna-curriculum-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const [donnaPlan,       setDonnaPlan]       = useState<WorkflowExecutionPlan | null>(null)
  const [donnaSubmitting, setDonnaSubmitting] = useState(false)
  const [donnaError,      setDonnaError]      = useState<string | null>(null)
  const [donnaCompletion, setDonnaCompletion] = useState<WorkflowCompletionSummary | null>(null)

  useEffect(() => {
    return onGoalSessionCompleted(detail => {
      if (detail.workflowId !== 'curriculum_builder_completion') return
      const plan = buildWorkflowExecutionPlan(detail)
      if (plan) setDonnaPlan(plan)
    })
  }, [])

  async function handleDonnaConfirm() {
    if (!donnaPlan) return
    const payload = buildWorkflowDraftPayload(donnaPlan)
    if (!payload) return

    setDonnaSubmitting(true)
    setDonnaError(null)

    const ans = payload.answers
    const objectTypeRaw = ans['object_type'] ?? 'drill'
    const contentType   = mapObjectTypeToContentType(objectTypeRaw)
    const domain        = inferDomain(objectTypeRaw)
    const title         = ans['item_name']?.trim() ?? 'Untitled'
    const levelName     = ans['curriculum_level']?.trim()
    const description   = ans['item_description']?.trim()
    const coachCues     = ans['coaching_cues'] ? parseCoachCues(ans['coaching_cues']) : undefined
    const regressions   = ans['common_mistakes']?.trim() ? [ans['common_mistakes'].trim()] : undefined
    const progressions  = ans['progression_relationship']?.trim() ? [ans['progression_relationship'].trim()] : undefined

    const draftResult = await createCurriculumContentItemDraft({
      contentType,
      title,
      levelName,
      description,
      coachCues,
      regressions,
      progressions,
      ...(domain ? { pathway: 'skill' as const } : {}),
      source: 'voice',
      rawInput: `DONNA curriculum draft: ${title} (${objectTypeRaw})${levelName ? ` · ${levelName}` : ''}`,
      overrideReason: `DONNA-assisted draft — object type: ${objectTypeRaw}`,
    })

    const submitResult = {
      ok:         draftResult.ok,
      entityId:   draftResult.ok ? draftResult.draftId : null,
      entityType: 'curriculum_override',
      redirectTo: '/director/curriculum/builder',
      error:      draftResult.ok ? null : draftResult.error,
    }

    const verification = buildWorkflowVerificationResult(submitResult, title)

    if (verification.verified) {
      const summary = buildWorkflowCompletionSummary('curriculum_builder_completion', verification, ans)
      setDonnaCompletion(summary)
      setDonnaPlan(null)
    } else {
      setDonnaError(verification.failureReason ?? (!draftResult.ok ? draftResult.error : null) ?? 'Failed to save curriculum draft.')
    }
    setDonnaSubmitting(false)
  }

  function handleJump(levelId: string) {
    setJumpOpen(false)
    router.push(`/director/curriculum/level/${levelId}`)
  }

  return (
    <div className="min-h-screen" style={{ background: '#050b09' }}>
      <div className="max-w-[1180px] mx-auto px-6 pt-10 pb-20">

        {/* ── DONNA completion banner ─────────────────── */}
        {donnaCompletion && (
          <div className="mb-6 rounded-xl border border-status-green/30 bg-status-green/5 p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
              <p className="text-sm font-semibold text-status-green">Curriculum item draft queued for review</p>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{donnaCompletion.donnaMessage}</p>
            <button
              type="button"
              onClick={() => setDonnaCompletion(null)}
              className="text-[11px] text-text-muted underline underline-offset-2 hover:text-text-secondary mt-1"
            >
              Create another item
            </button>
          </div>
        )}

        {/* ── DONNA review banner ─────────────────────── */}
        {donnaPlan && (
          <div className="mb-6 rounded-xl border border-lime/25 bg-lime/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-lime/15 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
              <p className="text-xs font-semibold text-lime">DONNA collected these answers — review before saving</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              {donnaPlan.fields.filter(f => f.filled).map(field => (
                <div key={field.fieldId} className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 text-lime shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-xs text-text-muted">{field.displayLabel}: </span>
                    <span className="text-xs text-text-primary">{field.value}</span>
                  </div>
                </div>
              ))}
            </div>
            {donnaError && (
              <div className="px-4 py-2 border-t border-status-red/20 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-status-red shrink-0" />
                <p className="text-xs text-status-red">{donnaError}</p>
              </div>
            )}
            <div className="px-4 py-3 border-t border-lime/15 flex items-center gap-2">
              <button
                type="button"
                onClick={handleDonnaConfirm}
                disabled={!donnaPlan.readyToSubmit || donnaSubmitting}
                className="btn-lime text-xs px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {donnaSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {donnaSubmitting ? 'Saving…' : 'Confirm & Save Curriculum Draft'}
              </button>
              <button
                type="button"
                onClick={() => { setDonnaPlan(null); setDonnaError(null) }}
                disabled={donnaSubmitting}
                className="btn-ghost text-xs px-3 py-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ── Breadcrumb ──────────────────────────────── */}
        <Link
          href="/director/curriculum"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-lime transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Curriculum Command Center
        </Link>

        {/* ── Header ───────────────────────────────────── */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-text-primary leading-tight">
            Curriculum Builder
          </h1>
          <p className="text-sm text-text-muted mt-1.5">
            Powered by DONNA · Customize your academy's development spine one level at a time
          </p>
        </div>

        {/* ── DONNA Intelligence — Architect | Evolution tabs ──────── */}
        {intelligenceContext && (
          <div id="donna-curriculum-panel" className="mb-6">
            {/* Tab bar */}
            <div className="flex items-center gap-1 mb-4 border-b border-border pb-0">
              <button
                onClick={() => setIntelligenceTab('architect')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
                  intelligenceTab === 'architect'
                    ? 'text-lime border-lime'
                    : 'text-text-muted border-transparent hover:text-text-secondary'
                }`}
              >
                Architect
              </button>
              <button
                onClick={() => setIntelligenceTab('evolution')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
                  intelligenceTab === 'evolution'
                    ? 'text-lime border-lime'
                    : 'text-text-muted border-transparent hover:text-text-secondary'
                }`}
              >
                Evolution
              </button>
            </div>

            {/* Tab content */}
            {intelligenceTab === 'architect' && (
              <div className="flex flex-col gap-4">
                {recommendations.length > 0 && (
                  <CurriculumRecommendationCard
                    recommendations={recommendations}
                    onSelectRecommendation={handleSelectRecommendation}
                  />
                )}
                <DonnaCurriculumPanel
                  context={intelligenceContext}
                  initialIntent={panelIntent}
                  initialLevelId={panelLevelId}
                />
              </div>
            )}

            {intelligenceTab === 'evolution' && (
              <CurriculumEvolutionPanel intelligenceContext={intelligenceContext} initialMemory={initialMemory} />
            )}
          </div>
        )}

        {/* ── DONNA Hero Card ───────────────────────────── */}
        <div
          className="relative rounded-2xl overflow-hidden mb-8"
          style={{
            background: '#060f0d',
            border: '1px solid rgba(200,255,0,0.15)',
          }}
        >
          {/* Radial lime glow behind avatar/left */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 55% 85% at 15% 50%, rgba(200,255,0,0.06) 0%, transparent 70%)',
            }}
          />

          <div className="relative p-8 md:p-10">

            {/* Top row: avatar + name + badge */}
            <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: 'rgba(200,255,0,0.08)',
                    border: '1px solid rgba(200,255,0,0.20)',
                  }}
                >
                  <Sparkles className="w-6 h-6 text-lime" />
                </div>
                <div>
                  <p className="text-base font-bold text-text-primary leading-tight tracking-tight">
                    DONNA
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    AI Curriculum Assistant · Ready
                  </p>
                </div>
              </div>
              <span
                className="text-[11px] font-semibold px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(200,255,0,0.10)',
                  border: '1px solid rgba(200,255,0,0.20)',
                  color: '#C8FF00',
                }}
              >
                AI-Powered
              </span>
            </div>

            {/* Headline */}
            <div className="mb-5">
              <p className="text-2xl md:text-3xl font-bold text-text-primary leading-snug">
                Your academy starts with the master curriculum.
              </p>
              <p className="text-2xl md:text-3xl font-bold text-lime leading-snug mt-1">
                DONNA will help you review and customize it.
              </p>
            </div>

            {/* Body */}
            <p className="text-sm text-text-secondary leading-relaxed mb-8 max-w-2xl">
              I'll guide you one level at a time. You can skip anything and come back later.
              Nothing changes until you approve.
            </p>

            {/* Buttons — row 1 */}
            <div className="flex flex-wrap gap-3 mb-3">
              <button
                type="button"
                onClick={() => router.push('/director/curriculum/guided')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: '#C8FF00', color: '#0A0A0A' }}
              >
                <Sparkles className="w-4 h-4" />
                Start Guided Review
              </button>
              <button
                type="button"
                onClick={() => router.push('/director/curriculum/map')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  background: 'rgba(200,255,0,0.05)',
                  border: '1px solid rgba(200,255,0,0.12)',
                  color: '#a3aab4',
                }}
              >
                Review Incomplete Levels
              </button>
              <button
                type="button"
                onClick={() => setJumpOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  background: 'rgba(200,255,0,0.05)',
                  border: '1px solid rgba(200,255,0,0.12)',
                  color: '#a3aab4',
                }}
              >
                Jump to a Level
              </button>
            </div>

            {/* Buttons — row 2 */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openDonnaWithCurriculumGapPrompt}
                title={curriculumGapChip.safetyNote}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  background: 'rgba(200,255,0,0.04)',
                  border: '1px solid rgba(200,255,0,0.10)',
                  color: '#a3aab4',
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-lime" />
                Ask DONNA to Suggest Priorities
              </button>
              <button
                type="button"
                onClick={() => router.push('/director/curriculum')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  background: 'rgba(200,255,0,0.02)',
                  border: '1px solid rgba(200,255,0,0.06)',
                  color: '#555',
                }}
              >
                <Settings className="w-3.5 h-3.5" />
                Advanced Settings
              </button>
            </div>

          </div>
        </div>

        {/* ── How It Works — collapsed by default (tutorial content, not operational) */}
        <details className="group mb-6">
          <summary className="flex items-center gap-2 cursor-pointer list-none select-none px-4 py-2.5 rounded-xl border border-white/[0.07] hover:border-white/[0.12] transition-colors" style={{ background: 'rgba(0,0,0,0.20)' }}>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted transition-transform group-open:rotate-90" />
            <span className="text-[11px] font-semibold text-text-muted">How it works</span>
            <span className="text-[10px] text-text-muted/60 ml-1">— first-time guide</span>
          </summary>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            {HOW_IT_WORKS.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.num}
                  className="rounded-xl p-5"
                  style={{
                    background: '#060f0d',
                    border: '1px solid rgba(200,255,0,0.09)',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center mb-4"
                    style={{
                      background: 'rgba(200,255,0,0.08)',
                      border: '1px solid rgba(200,255,0,0.18)',
                    }}
                  >
                    <span className="text-[11px] font-bold text-lime leading-none">{item.num}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <p className="text-sm font-semibold text-text-primary leading-tight">
                      {item.title}
                    </p>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed pl-5">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </details>

        {/* ── Curriculum Map — collapsed by default (pathway overview, not operational) */}
        <details className="group mb-8">
          <summary className="flex items-center gap-2 cursor-pointer list-none select-none px-4 py-2.5 rounded-xl border border-white/[0.07] hover:border-white/[0.12] transition-colors" style={{ background: 'rgba(0,0,0,0.20)' }}>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted transition-transform group-open:rotate-90" />
            <span className="text-[11px] font-semibold text-text-muted">Curriculum map</span>
            <span className="text-[10px] text-text-muted/60 ml-1">— 5 pathways, 15 levels</span>
            <button
              type="button"
              onClick={e => { e.preventDefault(); router.push('/director/curriculum/map') }}
              className="ml-auto text-[10px] text-lime hover:opacity-75 transition-opacity flex items-center gap-0.5"
            >
              Full map <ChevronRight className="w-3 h-3" />
            </button>
          </summary>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3">
            {PATHWAYS.map((p) => (
              <div
                key={p.name}
                className="rounded-xl p-4"
                style={{
                  background: p.glow,
                  border: `1px solid ${p.border}`,
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full mb-3" style={{ background: p.dot }} />
                <p className="text-xs font-semibold text-text-primary leading-tight mb-1">{p.name}</p>
                <p className="text-[11px] text-text-muted">{p.levels} levels</p>
              </div>
            ))}
          </div>
        </details>

        {/* ── Safety Footer ─────────────────────────────── */}
        <div className="flex items-center justify-center gap-2">
          <Shield
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: 'rgba(200,255,0,0.55)' }}
          />
          <p
            className="text-xs text-center"
            style={{ color: 'rgba(200,255,0,0.55)' }}
          >
            Nothing changes until you review and approve. Your curriculum is safe.
          </p>
        </div>

      </div>

      {/* ── Jump to Level Modal ─────────────────────── */}
      {jumpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#060f0d', border: '1px solid rgba(200,255,0,0.15)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(200,255,0,0.10)' }}>
              <p className="text-[13px] font-semibold text-text-primary">Jump to level</p>
              <button onClick={() => setJumpOpen(false)} className="text-text-muted hover:text-lime transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {levels.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-xs text-text-muted">Curriculum data not yet loaded.</p>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-80">
                {levels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => handleJump(level.id)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-b last:border-b-0 hover:bg-white/[0.03]"
                    style={{ borderColor: 'rgba(200,255,0,0.07)' }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: STAGE_COLOR[level.stage ?? ''] ?? '#555' }}
                    />
                    <span className="flex-1 text-[12px] text-text-primary">{level.display_name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
