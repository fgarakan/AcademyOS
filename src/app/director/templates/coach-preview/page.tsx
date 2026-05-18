import Link from 'next/link'
import { ChevronRight, Clock, Users, Target, CheckCircle2, AlertCircle, Eye, LayoutTemplate, Sparkles, MessageSquare, ChevronDown, GraduationCap, BookOpen, Database } from 'lucide-react'
import { TemplateDonnaPanel } from '@/components/templates/TemplateDonnaPanel'
import { getCurriculumLevelPreview, getCurriculumStage, getWatchForsForBlock, getCurriculumDrillsForBlock, getFitnessCurriculumPreview } from '@/lib/templates/templateCurriculumPreview'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getTemplateById, getTemplateBlocks } from '@/lib/templates/templateRepository'

interface PageProps {
  searchParams: Promise<{ level?: string; goal?: string; type?: string; templateId?: string }>
}

const DEFAULT_TEMPLATE = {
  name: 'Net Approach & Volley Patterns',
  level: 'Orange Ball 2',
  goal: 'Net approach and first volley',
  durationMin: 75,
  coachesAssigned: ['Marco T.', 'Priya K.'],
  groupSize: 6,
}

const DEMO_BLOCKS = [
  {
    id: 'b1',
    type: 'warm_up',
    displayType: 'Warm-Up',
    title: 'Dynamic Warm-Up',
    durationMin: 10,
    todaysFocus: 'Get players moving and establish rhythm. Focus on split-step timing from the start.',
    steps: [
      'Split-step ladder — 2 sets each direction',
      'Shadow swings (FH + BH) — 3 minutes',
      'Mini cooperative rally — 5 consecutive',
    ],
  },
  {
    id: 'b2',
    type: 'technical',
    displayType: 'Technical',
    title: 'Approach Shot Mechanics',
    durationMin: 20,
    todaysFocus: 'Contact point in front. Swing low-to-high. Eyes on the ball through contact.',
    steps: [
      'Coach feeds mid-court ball — player approaches down the line',
      'Drill: 3 approach shots + hold position',
      'Progress to cross-court approach',
    ],
  },
  {
    id: 'b3',
    type: 'technical',
    displayType: 'Technical',
    title: 'First Volley Pattern',
    durationMin: 20,
    todaysFocus: 'Block the volley — do not swing. Firm wrist, short backswing, punch forward.',
    steps: [
      'Static volley feeds — forehand and backhand',
      'Walk-in and volley — 3-step approach',
      'Combo: approach + 2 volleys + overhead',
    ],
  },
  {
    id: 'b4',
    type: 'tactical',
    displayType: 'Tactical',
    title: 'Approach + Volley Scenarios',
    durationMin: 15,
    todaysFocus: 'Decision-making under pressure. When to approach, when to stay back.',
    steps: [
      'Pattern play: serve + short ball + approach + finish',
      'Live points: first player to net wins if they close',
      'Scoring game: 2 points per won volley',
    ],
  },
  {
    id: 'b5',
    type: 'cool_down',
    displayType: 'Cool-Down',
    title: 'Cool-Down + Debrief',
    durationMin: 10,
    todaysFocus: 'One win per player — what improved today? Set the intention for next session.',
    steps: [
      'Gentle baseline rally — 5 minutes',
      'Partner stretch — 3 minutes',
      'Coach debrief — one-sentence win each player',
    ],
  },
]

const PLAYER_NOTES = [
  { name: 'Carlos M.', note: 'Working on patience at net — tends to rush the volley. Remind: block, do not swing.' },
  { name: 'Aisha R.', note: 'Strong approach but struggles with split-step timing before the first volley.' },
  { name: 'Tommy L.', note: 'New to net play — give extra encouragement. Move him closer to the net for early reps.' },
]

const BLOCK_TYPE_COLOR: Record<string, string> = {
  warm_up: 'text-status-blue border-status-blue/30 bg-status-blue/8',
  technical: 'text-lime border-lime/30 bg-lime/8',
  tactical: 'text-status-orange border-status-orange/30 bg-status-orange/8',
  physical: 'text-status-purple border-status-purple/30 bg-status-purple/8',
  match_play: 'text-status-red border-status-red/30 bg-status-red/8',
  cool_down: 'text-text-secondary border-border bg-surface-raised',
  movement: 'text-status-blue border-status-blue/30 bg-status-blue/8',
  speed: 'text-lime border-lime/30 bg-lime/8',
  agility: 'text-status-orange border-status-orange/30 bg-status-orange/8',
  strength: 'text-status-purple border-status-purple/30 bg-status-purple/8',
  plyometrics: 'text-status-red border-status-red/30 bg-status-red/8',
  coordination: 'text-status-blue border-status-blue/30 bg-status-blue/8',
  mobility: 'text-text-secondary border-border bg-surface-raised',
  recovery_cool_down: 'text-text-secondary border-border bg-surface-raised',
}

const BLOCK_TYPE_DISPLAY: Record<string, string> = {
  warm_up: 'Warm-Up',
  technical: 'Technical',
  tactical: 'Tactical',
  physical: 'Physical',
  match_play: 'Match Play',
  cool_down: 'Cool-Down',
  movement: 'Movement',
  speed: 'Speed',
  agility: 'Agility',
  strength: 'Strength',
  plyometrics: 'Plyometrics',
  coordination: 'Coordination',
  mobility: 'Mobility',
  recovery_cool_down: 'Recovery',
}

interface DisplayBlock {
  id: string
  type: string
  displayType: string
  title: string
  durationMin: number
  todaysFocus: string
  steps: string[]
}

export default async function TemplateCoachPreviewPage({ searchParams }: PageProps) {
  const params = await searchParams
  const levelParam = params.level ?? DEFAULT_TEMPLATE.level
  const goalParam = params.goal ?? DEFAULT_TEMPLATE.goal
  const typeParam = params.type ?? 'class'

  const preview = getCurriculumLevelPreview(levelParam)
  const stage = getCurriculumStage(levelParam)
  const fitnessPreview = typeParam === 'fitness' && stage ? getFitnessCurriculumPreview(stage) : null

  const templateName = goalParam
    ? `${goalParam} — ${levelParam}`
    : DEFAULT_TEMPLATE.name

  const templateIdParam = params.templateId ?? null
  let liveTemplateName: string | null = null
  let liveLevel: string | null = null
  let displayBlocks: DisplayBlock[] = DEMO_BLOCKS
  let dataSource: 'live' | 'demo' = 'demo'

  if (templateIdParam) {
    try {
      const db = await getSupabaseServer()
      const { data: { user } } = await db.auth.getUser()
      if (user) {
        const rawDb = db as any
        const { data: profile } = await rawDb
          .from('profiles')
          .select('academy_id')
          .eq('id', user.id)
          .single()
        if (profile?.academy_id) {
          const tResult = await getTemplateById(db, templateIdParam, profile.academy_id)
          if (tResult.data && !tResult.isSchemaMissing) {
            liveTemplateName = tResult.data.name
            liveLevel = (tResult.data as any).curriculum_level_key ?? null
            const bResult = await getTemplateBlocks(db, templateIdParam)
            if (!bResult.isSchemaMissing && bResult.data.length > 0) {
              displayBlocks = bResult.data
                .slice()
                .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                .map(b => ({
                  id: b.id,
                  type: b.type,
                  displayType: BLOCK_TYPE_DISPLAY[b.type] ?? b.type,
                  title: b.name,
                  durationMin: b.duration_min,
                  todaysFocus: b.notes ?? '',
                  steps: [] as string[],
                }))
            }
            dataSource = 'live'
          }
        }
      }
    } catch { /* fall through to demo */ }
  }

  const effectiveLevel = liveLevel ?? levelParam
  const effectiveName = liveTemplateName ?? templateName

  return (
    <div className="flex gap-4 lg:gap-6 p-4 lg:p-6 min-h-screen items-start">

      <div className="flex-1 min-w-0 space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] text-text-muted select-none">
          <Link href="/director" className="hover:text-text-secondary transition-colors duration-100">AcademyOS</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <Link href="/director/templates" className="hover:text-text-secondary transition-colors duration-100">Templates</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <span className="text-text-secondary font-medium">Coach Preview</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="page-eyebrow">Templates</p>
            <h1 className="page-title">Coach Preview</h1>
            <p className="page-subtitle">This is what your coaches will see during the session. Low friction, clear, and actionable.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-lime/20 bg-lime/5 text-xs font-medium text-lime">
              <Eye className="w-3.5 h-3.5" />
              Director Preview Mode
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs text-text-muted">
              {typeParam === 'fitness' ? 'Fitness Template' : 'Class Template'}
            </div>
          </div>
        </div>

        {/* Source banner */}
        {dataSource === 'live' ? (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-status-green/20 bg-status-green/5 text-[11px] text-status-green">
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>Showing live template data from your academy. Curriculum enrichment derived from {effectiveLevel}.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-status-orange/20 bg-status-orange/5 text-[11px] text-status-orange">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Demo view — sample template. Curriculum level and goal carried from create flow via URL params.</span>
          </div>
        )}

        {/* Curriculum source banner */}
        {preview && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-lime/15 bg-lime/4">
            <GraduationCap className="w-4 h-4 text-lime shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-widest text-text-muted">Curriculum Source — </span>
              <span className="text-sm font-semibold text-lime">{effectiveLevel}</span>
              {goalParam && (
                <span className="ml-2 text-xs text-text-secondary">· Goal: {goalParam}</span>
              )}
            </div>
          </div>
        )}

        {/* Fitness curriculum context — shown when type=fitness */}
        {fitnessPreview && (
          <div className="rounded-2xl border border-status-purple/15 bg-status-purple/4 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-status-purple" />
              <span className="text-sm font-bold text-text-primary">Fitness Curriculum Context</span>
              <span className="ml-auto text-[10px] text-text-muted">curriculum-derived — not saved</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Physical Development Need</p>
                <p className="text-xs text-text-secondary leading-relaxed">{fitnessPreview.physicalDevelopmentNeed}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Tennis Technical Transfer</p>
                <p className="text-xs text-text-secondary leading-relaxed">{fitnessPreview.tennisTechnicalTransfer}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Recommended Focus</p>
                <p className="text-xs font-semibold text-status-purple">{fitnessPreview.recommendedFitnessFocus}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Load Guidance</p>
                <p className="text-xs text-text-secondary">{fitnessPreview.loadGuidance}</p>
              </div>
            </div>
            <div className="pt-1 border-t border-border">
              <p className="text-[10px] text-text-muted">{fitnessPreview.ageFitNote}</p>
            </div>
          </div>
        )}

        {/* Session brief card */}
        <div className="rounded-2xl border border-lime/20 bg-lime/4 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-lime" />
            <span className="text-sm font-bold text-text-primary">Today&apos;s Session Brief</span>
            <span className="ml-auto text-[10px] text-text-muted">coach-facing view</span>
          </div>

          <div>
            <h2 className="text-lg font-bold text-text-primary">{effectiveName}</h2>
            {preview && (
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">{preview.skillPathwayFocus}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Clock className="w-3.5 h-3.5" />
              <span>{displayBlocks.reduce((s, b) => s + b.durationMin, 0)}min</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Users className="w-3.5 h-3.5" />
              <span>{DEFAULT_TEMPLATE.groupSize} players</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Target className="w-3.5 h-3.5" />
              <span>{effectiveLevel}</span>
            </div>
          </div>

          {/* Block timeline */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {displayBlocks.map((block, i) => {
              const total = displayBlocks.reduce((s, b) => s + b.durationMin, 0)
              const widthPct = Math.round((block.durationMin / total) * 100)
              const color = BLOCK_TYPE_COLOR[block.type] ?? ''
              return (
                <div key={block.id} className="flex items-center gap-1 shrink-0" style={{ flexBasis: `${widthPct}%`, minWidth: '60px' }}>
                  <div className={`flex-1 px-2 py-1.5 rounded-lg border text-center ${color}`}>
                    <p className="text-[9px] font-bold truncate">{block.displayType}</p>
                    <p className="text-[9px] text-text-muted">{block.durationMin}m</p>
                  </div>
                  {i < displayBlocks.length - 1 && <ChevronRight className="w-3 h-3 text-text-muted/30 shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Block cards */}
        <div className="space-y-3">
          {displayBlocks.map((block, i) => {
            const color = BLOCK_TYPE_COLOR[block.type] ?? ''
            const watchFors = stage ? getWatchForsForBlock(stage, block.type) : []
            const curriculumDrills = stage ? getCurriculumDrillsForBlock(stage, block.type) : []
            return (
              <div key={block.id} className="rounded-2xl border border-border bg-surface p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-text-muted w-5 shrink-0">{i + 1}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border ${color}`}>{block.displayType}</span>
                  <span className="text-sm font-bold text-text-primary">{block.title}</span>
                  <span className="ml-auto flex items-center gap-1 text-[11px] text-text-muted">
                    <Clock className="w-3 h-3" />
                    {block.durationMin}min
                  </span>
                </div>

                <div className="pl-8 space-y-3">
                  {block.todaysFocus && (
                    <p className="text-sm text-text-primary font-medium leading-relaxed">{block.todaysFocus}</p>
                  )}

                  {block.steps.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Steps</p>
                      <div className="space-y-1.5">
                        {block.steps.map(s => (
                          <div key={s} className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center shrink-0 mt-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-text-muted/30" />
                            </div>
                            <span className="text-xs text-text-secondary leading-relaxed">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Curriculum drills */}
                  {curriculumDrills.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-lime/70 mb-1.5 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3" />
                        Drills — {effectiveLevel} curriculum
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {curriculumDrills.slice(0, 3).map(d => (
                          <span key={d} className="px-2 py-0.5 rounded-lg border border-lime/15 bg-lime/5 text-[10px] text-lime/80">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Watch-fors from curriculum */}
                  {watchFors.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-lime mb-1.5">Watch for</p>
                      <div className="space-y-1.5">
                        {watchFors.map(w => (
                          <div key={w} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-lime/60 shrink-0 mt-0.5" />
                            <span className="text-xs text-text-secondary leading-relaxed">{w}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Player notes */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Users className="w-4 h-4 text-lime" />
            Player Notes to Consider
          </h2>
          <div className="space-y-3">
            {PLAYER_NOTES.map(p => (
              <div key={p.name} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-surface-raised">
                <div className="w-7 h-7 rounded-full bg-lime/15 border border-lime/20 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-lime">{p.name[0]}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">{p.name}</p>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{p.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wrap-up prompt — curriculum-tied */}
        <div className="rounded-2xl border border-lime/15 bg-lime/4 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-lime" />
            <h2 className="text-sm font-bold text-text-primary">DONNA Quick Actions for Coaches</h2>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            After the session, coaches can submit a wrap-up. DONNA will structure it and send to the Review Queue.
            {preview && <span className="ml-1 text-lime/70">Wrap-up prompt reflects {levelParam} curriculum goals.</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'Log attendance',
              'Submit wrap-up',
              'Flag a player concern',
              'Note a highlight',
            ].map(action => (
              <button
                key={action}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-lime/20 bg-lime/5 text-xs text-lime hover:bg-lime/10 transition-all duration-100"
                onClick={() => {}}
              >
                <LayoutTemplate className="w-3 h-3" />
                {action}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-text-muted">Coach-facing DONNA quick actions — director review required before any changes apply.</p>
        </div>

        {/* Director nav */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/director/templates/class" className="btn-ghost inline-flex items-center gap-2 text-sm">
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Templates
          </Link>
          <Link
            href="/director/templates/impact-preview"
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-lime/20 bg-lime/5 text-lime hover:bg-lime/10 transition-all duration-100"
          >
            Impact Preview
            <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
          </Link>
        </div>

      </div>

      <TemplateDonnaPanel mode="coach_preview" />
    </div>
  )
}
