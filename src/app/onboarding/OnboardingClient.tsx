'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  STAGE_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_SHORT,
  AGE_GROUP_LABELS,
  MODEL_LABELS,
  MODEL_DESCRIPTIONS,
  DONNA_PHASE_OPENERS,
  DONNA_QUESTION_CONTEXT,
  DONNA_STILL_LEARNING,
  DONNA_DEFAULT_RANKINGS,
  DIRECTOR_CHALLENGE_OPTIONS,
  SETUP_CONTEXT_LABELS,
  TRANSPARENCY_DESCRIPTIONS,
  ADVANCEMENT_APPROVAL_LABELS,
  RANK_WEIGHTS,
  rankingToWeights,
  computePathwayWeights,
  inferAcademyModel,
  inferModelFromText,
  detectOnboardingContradiction,
  type AgeGroup,
  type PlayerMix,
  type FamilyPriorities,
  type CurriculumStartingPoint,
  type PriorityEdge,
  type SessionDuration,
  type AdvancementApproval,
  type ParentTransparency,
  type InferredModel,
  type StagePriorityState,
  type SetupContext,
  type DirectorChallenge,
} from '@/lib/donna/onboarding/donnaOnboardingContextPack'
import { saveAcademyOnboarding } from './actions'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props { academyName: string }

// ── Component ─────────────────────────────────────────────────────────────────

export function OnboardingClient({ academyName: initialAcademyName }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // ── Wizard phase ──────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1)
  const [donnaHelp, setDonnaHelp] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [contradictionWarning, setContradictionWarning] = useState<{ message: string; details: string } | null>(null)

  // ── Phase 1 state ─────────────────────────────────────────────────────────
  const [academyName, setAcademyName] = useState(initialAcademyName)

  const [introText, setIntroText] = useState('')
  const [introSubmitted, setIntroSubmitted] = useState(false)
  const [introInferred, setIntroInferred] = useState<{
    playerMix:           PlayerMix
    familyPriorities:    FamilyPriorities
    confidence:          'high' | 'medium' | 'low'
    themes:              string[]
    hasDualTrackSignals: boolean
  } | null>(null)

  // Player mix + family priorities — set by inference, adjustable via dropdowns
  const [playerMix, setPlayerMix] = useState<PlayerMix>('mixed')
  const [familyPriorities, setFamilyPriorities] = useState<FamilyPriorities>('development_enjoyment')

  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([])
  const [setupContext, setSetupContext] = useState<SetupContext>('fresh_setup')

  // ── Phase 2 state ─────────────────────────────────────────────────────────
  const [curriculumStartingPoint, setCurriculumStartingPoint] = useState<CurriculumStartingPoint>('academyos_curriculum')
  const [stagePriorities, setStagePriorities] = useState<Record<string, StagePriorityState>>({})
  const [summaryConfirmed, setSummaryConfirmed] = useState(false)
  const [customizing, setCustomizing] = useState<string | null>(null)
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<SessionDuration>(60)
  const [advancementApproval, setAdvancementApproval] = useState<AdvancementApproval>('donna_flags_director_confirms')

  // ── Phase 3 state ─────────────────────────────────────────────────────────
  const [parentTransparency, setParentTransparency] = useState<ParentTransparency>('standard')
  const [groups, setGroups] = useState<{ name: string; track: string }[]>([])
  const [coachesInvited, setCoachesInvited] = useState(false)
  const [directorChallenge, setDirectorChallenge] = useState<DirectorChallenge>('not_sure_yet')

  // ── Phase 4 state ─────────────────────────────────────────────────────────
  const [priorityEdge, setPriorityEdge] = useState<PriorityEdge>('coach_judgment')

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeLevels = ageGroups.filter((g): g is Exclude<AgeGroup, 'adult'> => g !== 'adult')
  const inferredModel: InferredModel = inferAcademyModel(playerMix, familyPriorities, ageGroups)

  // ── Phase 1 helpers ───────────────────────────────────────────────────────

  function handleIntroSubmit() {
    const result = inferModelFromText(introText)
    setIntroInferred(result)
    const newPlayerMix         = result?.playerMix         ?? playerMix
    const newFamilyPriorities  = result?.familyPriorities  ?? familyPriorities
    if (result) {
      setPlayerMix(newPlayerMix)
      setFamilyPriorities(newFamilyPriorities)
    }
    const contradiction = detectOnboardingContradiction(introText, newPlayerMix, newFamilyPriorities, ageGroups)
    setContradictionWarning(contradiction)
    setIntroSubmitted(true)
  }

  function toggleAgeGroup(g: AgeGroup) {
    setAgeGroups(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    )
  }

  // ── Phase 2 helpers ───────────────────────────────────────────────────────

  function enterPhase2() {
    const defaults = DONNA_DEFAULT_RANKINGS[inferredModel]
    const newPriorities: Record<string, StagePriorityState> = {}
    const levels = ageGroups.filter(g => g !== 'adult') as Exclude<AgeGroup, 'adult'>[]
    for (const level of levels) {
      const defaultRanking = defaults[level] ?? STAGE_CATEGORIES
      newPriorities[level] = {
        ranking:          defaultRanking,
        weights:          rankingToWeights(defaultRanking),
        manuallyAdjusted: false,
        confirmed:        true,
      }
    }
    setStagePriorities(newPriorities)
    setSummaryConfirmed(false)
    setCustomizing(null)
    setPhase(2)
  }

  function enterPhase3() {
    const levels = ageGroups.filter(g => g !== 'adult') as AgeGroup[]
    const autoGroups = levels.map(level => ({
      name:  (AGE_GROUP_LABELS[level] ?? level).replace(/\s*\(.*\)/, '') + ' Group',
      track: level,
    }))
    setGroups(autoGroups)
    setPhase(3)
  }

  function moveCategory(stage: string, index: number, dir: -1 | 1) {
    const target = index + dir
    const current = stagePriorities[stage]
    if (!current) return
    const ranking = [...current.ranking]
    if (target < 0 || target >= ranking.length) return
    ;[ranking[index], ranking[target]] = [ranking[target], ranking[index]]
    const weights = rankingToWeights(ranking)
    setStagePriorities(prev => ({
      ...prev,
      [stage]: { ranking, weights, manuallyAdjusted: true, confirmed: true },
    }))
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  function handleSave() {
    setSaveError(null)
    startTransition(async () => {
      const result = await saveAcademyOnboarding({
        introText:               introText || undefined,
        setupContext,
        academyName,
        playerMix,
        familyPriorities,
        ageGroups,
        curriculumStartingPoint,
        stagePriorities,
        sessionDurationMinutes,
        advancementApproval,
        parentTransparency,
        groups,
        coachesInvited,
        directorChallenge,
        priorityEdge,
      })
      if (result.ok) {
        router.replace('/director')
      } else {
        setSaveError(result.error ?? 'Failed to save. Please try again.')
      }
    })
  }

  // ── Progress header ───────────────────────────────────────────────────────

  const PHASE_LABELS = ['Your Academy', 'Your Program', 'Your Team', 'Meet Your Academy']
  const progress = ((phase - 1) / 3) * 100

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-base text-text-primary flex flex-col">
      {/* Progress header */}
      <div className="border-b border-border px-6 py-4 flex items-center gap-6">
        <div className="text-text-muted text-[11px] uppercase tracking-widest font-mono flex-shrink-0">
          AcademyOS Setup
        </div>
        <div className="flex-1 flex gap-2 items-center overflow-x-auto">
          {PHASE_LABELS.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-shrink-0">
              <div className={`text-[11px] uppercase tracking-widest ${
                i + 1 === phase ? 'text-lime' :
                i + 1 < phase  ? 'text-text-secondary' :
                                  'text-text-muted'
              }`}>
                {i + 1 < phase ? '✓ ' : ''}{label}
              </div>
              {i < 3 && <div className="text-text-muted text-[11px]">→</div>}
            </div>
          ))}
        </div>
        <div
          className="h-1 w-32 bg-surface-raised rounded-full overflow-hidden flex-shrink-0"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-lime transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">

        {/* ── PHASE 1 — Your Academy ──────────────────────────────────────── */}
        {phase === 1 && (
          <div className="space-y-8">
            <DonnaOpener text={DONNA_PHASE_OPENERS[1]} />

            {/* 1. Academy name — first */}
            <Section
              label="What is your academy called?"
              contextKey="Q1"
              donnaHelp={donnaHelp}
              setDonnaHelp={setDonnaHelp}
            >
              <input
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime text-sm"
                placeholder="e.g. Riverside Tennis Academy"
                value={academyName}
                onChange={e => setAcademyName(e.target.value)}
                maxLength={200}
              />
            </Section>

            {/* 2. Tell me about your academy — replaces Q2 + Q3 */}
            <Section
              label="Tell me about your academy and what you're trying to build."
              subtitle="Describe it naturally. I'll propose a starting model — you confirm or adjust."
              contextKey="Q_INTRO"
              donnaHelp={donnaHelp}
              setDonnaHelp={setDonnaHelp}
            >
              <textarea
                className="w-full h-28 bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime text-sm"
                placeholder="e.g. We run mostly competitive juniors aged 9–16 who play USTA tournaments. Families care about results and rankings. We have about 60 players across four levels…"
                value={introText}
                onChange={e => {
                  setIntroText(e.target.value)
                  // Reset submission if they edit after submitting
                  if (introSubmitted) setIntroSubmitted(false)
                }}
              />
              {!introSubmitted && (
                <button
                  className="btn-lime mt-2"
                  onClick={handleIntroSubmit}
                >
                  Let DONNA read this →
                </button>
              )}
              {introSubmitted && (
                <InferenceResult
                  inferred={introInferred}
                  playerMix={playerMix}
                  familyPriorities={familyPriorities}
                  onPlayerMixChange={setPlayerMix}
                  onFamilyPrioritiesChange={setFamilyPriorities}
                  onEdit={() => { setIntroSubmitted(false); setContradictionWarning(null) }}
                  contradiction={contradictionWarning}
                  onDismissContradiction={() => setContradictionWarning(null)}
                  hasDualTrackSignals={introInferred?.hasDualTrackSignals ?? false}
                  hasAdultSelected={ageGroups.includes('adult')}
                />
              )}
            </Section>

            {/* 3. Active levels */}
            <Section
              label="Which levels are active in your program?"
              subtitle="Select all age groups you currently run or plan to run."
              contextKey="Q4"
              donnaHelp={donnaHelp}
              setDonnaHelp={setDonnaHelp}
            >
              <div className="grid grid-cols-3 gap-3">
                {(['red_ball', 'orange_ball', 'green_ball', 'yellow_ball', 'high_performance', 'adult'] as AgeGroup[]).map(g => (
                  <OptionCard
                    key={g}
                    selected={ageGroups.includes(g)}
                    onClick={() => toggleAgeGroup(g)}
                    label={AGE_GROUP_LABELS[g]}
                    multi
                  />
                ))}
              </div>
            </Section>

            {/* 4. New or migrating — last */}
            <Section
              label="Are you setting up a new academy or moving from another system?"
              contextKey="Q_SETUP_CONTEXT"
              donnaHelp={donnaHelp}
              setDonnaHelp={setDonnaHelp}
            >
              <div className="grid grid-cols-2 gap-3">
                {(['fresh_setup', 'migrating'] as SetupContext[]).map(ctx => (
                  <OptionCard
                    key={ctx}
                    selected={setupContext === ctx}
                    onClick={() => setSetupContext(ctx)}
                    label={SETUP_CONTEXT_LABELS[ctx]}
                    description={
                      ctx === 'fresh_setup'
                        ? 'Starting fresh — no existing players or data.'
                        : 'Bringing existing players and workflows over.'
                    }
                  />
                ))}
              </div>
            </Section>

            <div className="pt-2">
              <button
                className="btn-lime w-full"
                disabled={!academyName.trim() || ageGroups.length === 0 || !introSubmitted}
                onClick={enterPhase2}
              >
                Continue to Your Program →
              </button>
              {!introSubmitted && academyName.trim() && ageGroups.length > 0 && (
                <p className="text-center text-text-muted text-xs mt-2">
                  Click "Let DONNA read this →" above before continuing.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── PHASE 2 — Your Program ──────────────────────────────────────── */}
        {phase === 2 && (
          <div className="space-y-8">
            <DonnaOpener text={DONNA_PHASE_OPENERS[2]} />

            {/* Stage priorities — summary table */}
            <Section
              label="Your stage priorities"
              subtitle={`Based on your ${MODEL_LABELS[inferredModel]} profile, here are DONNA's recommended priorities for each level.`}
              contextKey="Q6"
              donnaHelp={donnaHelp}
              setDonnaHelp={setDonnaHelp}
            >
              <StageSummaryTable
                stagePriorities={stagePriorities}
                activeLevels={activeLevels}
                summaryConfirmed={summaryConfirmed}
                customizing={customizing}
                onConfirm={() => setSummaryConfirmed(true)}
                onCustomize={(stage) => {
                  setSummaryConfirmed(false)
                  setCustomizing(stage)
                }}
                onDoneCustomizing={() => {
                  setSummaryConfirmed(true)
                  setCustomizing(null)
                }}
                onMoveCategory={moveCategory}
              />
            </Section>

            {/* Curriculum */}
            <Section
              label="How do you want to start your curriculum?"
              contextKey="Q5"
              donnaHelp={donnaHelp}
              setDonnaHelp={setDonnaHelp}
            >
              <div className="grid grid-cols-2 gap-3">
                <OptionCard
                  selected={curriculumStartingPoint === 'academyos_curriculum'}
                  onClick={() => setCurriculumStartingPoint('academyos_curriculum')}
                  label="Start with AcademyOS Curriculum"
                  description="Pre-built curriculum for all active levels on day one."
                />
                <OptionCard
                  selected={curriculumStartingPoint === 'import_curriculum'}
                  onClick={() => setCurriculumStartingPoint('import_curriculum')}
                  label="Import My Curriculum"
                  description="Structure is ready — you bring your own content."
                />
              </div>
            </Section>

            {/* Session duration */}
            <Section
              label="How long are your typical sessions?"
              contextKey="Q8"
              donnaHelp={donnaHelp}
              setDonnaHelp={setDonnaHelp}
            >
              <div className="flex gap-3 flex-wrap">
                {([45, 60, 75, 90, 120] as SessionDuration[]).map(d => (
                  <button
                    key={d}
                    className={`px-5 py-2 rounded-lg border text-sm font-mono transition-colors ${
                      sessionDurationMinutes === d
                        ? 'border-lime text-lime bg-surface-raised'
                        : 'border-border text-text-secondary hover:border-text-muted'
                    }`}
                    onClick={() => setSessionDurationMinutes(d)}
                  >
                    {d === 120 ? '2 hrs' : `${d} min`}
                  </button>
                ))}
              </div>
            </Section>

            {/* Advancement */}
            <Section
              label="When a player is ready to move up, who makes the call?"
              contextKey="Q9"
              donnaHelp={donnaHelp}
              setDonnaHelp={setDonnaHelp}
            >
              <div className="grid grid-cols-2 gap-3">
                {(['director_only', 'donna_flags_director_confirms', 'coach_recommends_notified', 'assessment_driven'] as AdvancementApproval[]).map(v => (
                  <OptionCard
                    key={v}
                    selected={advancementApproval === v}
                    onClick={() => setAdvancementApproval(v)}
                    label={ADVANCEMENT_APPROVAL_LABELS[v]}
                  />
                ))}
              </div>
            </Section>

            <div className="flex gap-3 pt-2">
              <button className="btn-ghost flex-1" onClick={() => setPhase(1)}>← Back</button>
              <button
                className="btn-lime"
                style={{ flex: 2 }}
                disabled={!summaryConfirmed}
                onClick={enterPhase3}
              >
                Continue to Your Team →
              </button>
            </div>
            {!summaryConfirmed && (
              <p className="text-center text-text-muted text-xs -mt-2">
                Confirm your stage priorities above before continuing.
              </p>
            )}
          </div>
        )}

        {/* ── PHASE 3 — Your Team ─────────────────────────────────────────── */}
        {phase === 3 && (
          <div className="space-y-8">
            <DonnaOpener text={DONNA_PHASE_OPENERS[3]} />

            {/* Parent transparency */}
            <Section
              label="How transparent do you want to be with parents?"
              contextKey="Q10"
              donnaHelp={donnaHelp}
              setDonnaHelp={setDonnaHelp}
            >
              <div className="grid grid-cols-3 gap-3">
                {(['minimal', 'standard', 'transparent'] as ParentTransparency[]).map(v => (
                  <OptionCard
                    key={v}
                    selected={parentTransparency === v}
                    onClick={() => setParentTransparency(v)}
                    label={v.charAt(0).toUpperCase() + v.slice(1)}
                    description={TRANSPARENCY_DESCRIPTIONS[v]}
                  />
                ))}
              </div>
            </Section>

            {/* Training groups — auto-generated, renameable */}
            <Section
              label="Your training groups"
              subtitle="Auto-generated from your active levels. Rename any group to match how your academy refers to it."
            >
              <div className="space-y-2">
                {groups.map((g, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[11px] uppercase tracking-widest text-text-muted w-28 font-mono flex-shrink-0">
                      {(AGE_GROUP_LABELS[g.track as AgeGroup] ?? g.track).replace(/\s*\(.*\)/, '')}
                    </span>
                    <input
                      className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-lime"
                      value={g.name}
                      onChange={e => {
                        const updated = [...groups]
                        updated[i] = { ...updated[i], name: e.target.value }
                        setGroups(updated)
                      }}
                      maxLength={100}
                    />
                  </div>
                ))}
                <button
                  className="btn-ghost text-sm mt-1"
                  onClick={() => setGroups([...groups, { name: 'New Group', track: 'yellow_ball' }])}
                >
                  + Add group
                </button>
              </div>
            </Section>

            {/* Coaches */}
            <Section label="Your coaching team">
              <button
                className={`w-full text-left border rounded-xl px-4 py-3 transition-colors ${
                  coachesInvited
                    ? 'border-lime bg-surface-raised'
                    : 'border-border hover:border-text-muted'
                }`}
                onClick={() => setCoachesInvited(!coachesInvited)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    coachesInvited ? 'border-lime bg-lime' : 'border-border'
                  }`}>
                    {coachesInvited && <span className="text-base text-[10px] font-bold">✓</span>}
                  </div>
                  <div>
                    <div className="text-sm text-text-primary">Invite coaches after setup</div>
                    <div className="text-xs text-text-muted mt-0.5">
                      I'll walk you through adding your coaching team once the academy is live.
                    </div>
                  </div>
                </div>
              </button>
            </Section>

            {/* Director challenge */}
            <Section
              label="What's the biggest challenge you want DONNA to help solve?"
              contextKey="Q_CHALLENGE"
              donnaHelp={donnaHelp}
              setDonnaHelp={setDonnaHelp}
            >
              <div className="space-y-2">
                {DIRECTOR_CHALLENGE_OPTIONS.map(opt => (
                  <OptionCard
                    key={opt.value}
                    selected={directorChallenge === opt.value}
                    onClick={() => setDirectorChallenge(opt.value)}
                    label={opt.label}
                    description={opt.description}
                    horizontal
                  />
                ))}
              </div>
            </Section>

            <div className="flex gap-3 pt-2">
              <button className="btn-ghost flex-1" onClick={() => setPhase(2)}>← Back</button>
              <button
                className="btn-lime"
                style={{ flex: 2 }}
                onClick={() => setPhase(4)}
              >
                Continue to Meet Your Academy →
              </button>
            </div>
          </div>
        )}

        {/* ── PHASE 4 — Meet Your Academy ─────────────────────────────────── */}
        {phase === 4 && (
          <div className="space-y-8">
            <DonnaOpener text={DONNA_PHASE_OPENERS[4]} />

            {/* Priority edge — scenario-based coaching question */}
            <Section
              label="Last 5 minutes of a session. A 12-year-old has a broken forehand loop and keeps making the wrong call at the net. What does your coach work on first?"
              subtitle="There is no right answer. This tells me how to frame conflicting recommendations."
              contextKey="Q_PRIORITY_EDGE"
              donnaHelp={donnaHelp}
              setDonnaHelp={setDonnaHelp}
            >
              <div className="space-y-2">
                {([
                  ['technical_first', 'Fix the forehand.',        "You can't execute tactics with a broken stroke. Mechanics come first."],
                  ['tactical_first',  'Work the net decision.',   'Technique improves through match repetition. The tactical error costs more points.'],
                  ['coach_judgment',  "The coach's call.",        'Different players need different priorities. Leave it to whoever is on court.'],
                ] as const).map(([value, label, desc]) => (
                  <OptionCard
                    key={value}
                    selected={priorityEdge === value}
                    onClick={() => setPriorityEdge(value)}
                    label={label}
                    description={desc}
                    horizontal
                  />
                ))}
              </div>
            </Section>

            {/* Academy summary */}
            <div className="rounded-xl bg-surface-raised border border-border p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="text-text-muted text-[11px] uppercase tracking-widest">
                  DONNA understands your academy
                </div>
                <div className="text-lime text-[11px] uppercase tracking-widest font-mono">
                  {MODEL_LABELS[inferredModel]}
                </div>
              </div>

              <p className="text-text-secondary text-sm leading-relaxed">
                {MODEL_DESCRIPTIONS[inferredModel]}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <AcademySummaryItem
                  label="Academy identity"
                  value={academyName}
                />
                <AcademySummaryItem
                  label="Active levels"
                  value={
                    activeLevels.length > 0
                      ? activeLevels.map(l => (AGE_GROUP_LABELS[l] ?? l).replace(/\s*\(.*\)/, '')).join(', ')
                      : '—'
                  }
                />
                <AcademySummaryItem
                  label="What matters most"
                  value={{
                    results_rankings:      'Results and rankings',
                    development_enjoyment: 'Development and enjoyment',
                    fitness_fun:           'Fitness and fun',
                    individual_attention:  'Individual attention',
                  }[familyPriorities]}
                />
                <AcademySummaryItem
                  label="Curriculum approach"
                  value={curriculumStartingPoint === 'academyos_curriculum' ? 'AcademyOS Curriculum' : 'Custom import'}
                />
                <AcademySummaryItem
                  label="How players move up"
                  value={ADVANCEMENT_APPROVAL_LABELS[advancementApproval]}
                />
                <AcademySummaryItem
                  label="Typical session"
                  value={`${sessionDurationMinutes === 120 ? '2 hours' : `${sessionDurationMinutes} min`}`}
                />
                <AcademySummaryItem
                  label="Parent communication"
                  value={{
                    minimal:     'Minimal — basics only',
                    standard:    'Standard — progress updates',
                    transparent: 'Transparent — full detail',
                  }[parentTransparency]}
                />
                <AcademySummaryItem
                  label="When technique meets tactics"
                  value={{
                    technical_first: 'Fix the stroke first',
                    tactical_first:  'Work the decision first',
                    coach_judgment:  "Coach's call",
                  }[priorityEdge]}
                />
              </div>

              <PathwayWeightsBar stagePriorities={stagePriorities} />
            </div>

            {/* What DONNA now knows */}
            <div className="rounded-xl bg-surface border border-border p-5 space-y-3">
              <div className="text-text-muted text-[11px] uppercase tracking-widest">
                What DONNA now knows
              </div>
              <div className="space-y-1.5">
                {[
                  'Academy model and identity confirmed',
                  'Active curriculum levels set',
                  'Stage priorities configured for each level',
                  'Session templates sized correctly',
                  'Advancement approval gates configured',
                  'Parent portal visibility rules set',
                  'Coaching philosophy recorded',
                  'Top challenge noted for first-day brief',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-status-green text-xs">✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* What I still don't know */}
            <div className="rounded-xl bg-surface border border-border p-5 space-y-3">
              <div className="text-text-muted text-[11px] uppercase tracking-widest">
                What I still don&apos;t know
              </div>
              <p className="text-text-muted text-xs italic">
                This is expected. DONNA's model improves with every session your coaches complete.
              </p>
              <div className="space-y-1.5">
                {DONNA_STILL_LEARNING.map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm text-text-muted">
                    <span className="text-text-muted text-xs">○</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {saveError && (
              <div className="rounded-xl bg-status-red/10 border border-status-red/30 px-4 py-3 text-status-red text-sm">
                {saveError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button className="btn-ghost flex-1" onClick={() => setPhase(3)}>← Back</button>
              <button
                className="btn-lime"
                style={{ flex: 2 }}
                disabled={isPending}
                onClick={handleSave}
              >
                {isPending ? 'Launching…' : `Launch ${academyName} →`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function DonnaOpener({ text }: { text: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-lime text-xs font-mono font-bold">D</span>
      </div>
      <p className="text-text-secondary text-sm leading-relaxed pt-1">{text}</p>
    </div>
  )
}

interface SectionProps {
  label:         string
  subtitle?:     string
  contextKey?:   string
  donnaHelp?:    string | null
  setDonnaHelp?: (key: string | null) => void
  children:      React.ReactNode
}

function Section({ label, subtitle, contextKey, donnaHelp, setDonnaHelp, children }: SectionProps) {
  const ctx    = contextKey ? DONNA_QUESTION_CONTEXT[contextKey] : null
  const isOpen = donnaHelp === contextKey

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-text-primary font-medium text-sm">{label}</div>
          {subtitle && <div className="text-text-muted text-xs mt-0.5">{subtitle}</div>}
        </div>
        {ctx && setDonnaHelp && contextKey && (
          <button
            className="text-text-muted text-[11px] uppercase tracking-widest hover:text-lime transition-colors flex-shrink-0 mt-0.5"
            onClick={() => setDonnaHelp(isOpen ? null : contextKey)}
          >
            {isOpen ? 'Hide' : 'Why?'}
          </button>
        )}
      </div>

      {isOpen && ctx && (
        <div className="border-l-2 border-lime/30 pl-4 space-y-2 py-1">
          <p className="text-text-muted text-xs">{ctx.whyAsking}</p>
          <p className="text-text-muted text-xs">
            <span className="text-text-secondary">What changes: </span>
            {ctx.whatChanges}
          </p>
          <p className="text-text-muted text-xs">
            <span className="text-text-secondary">Change later: </span>
            {ctx.canChangeLater}
          </p>
        </div>
      )}

      {children}
    </div>
  )
}

interface OptionCardProps {
  selected:     boolean
  onClick:      () => void
  label:        string
  description?: string
  multi?:       boolean
  horizontal?:  boolean
}

function OptionCard({ selected, onClick, label, description, multi, horizontal }: OptionCardProps) {
  return (
    <button
      className={`text-left rounded-xl border px-4 py-3 transition-colors w-full ${
        selected
          ? 'border-lime bg-surface-raised text-text-primary'
          : 'border-border hover:border-text-muted text-text-secondary'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        {multi && (
          <div className={`w-4 h-4 rounded border-2 mt-0.5 flex-shrink-0 flex items-center justify-center ${
            selected ? 'border-lime bg-lime' : 'border-border'
          }`}>
            {selected && <span className="text-base text-[10px] font-bold">✓</span>}
          </div>
        )}
        <div>
          <div className={`text-sm font-medium ${selected ? 'text-text-primary' : 'text-text-secondary'}`}>
            {label}
          </div>
          {description && (
            <div className="text-xs text-text-muted mt-0.5">{description}</div>
          )}
        </div>
      </div>
    </button>
  )
}

// Shown after director submits intro text — always rendered, handles null inference gracefully
interface InferenceResultProps {
  inferred:                 { playerMix: PlayerMix; familyPriorities: FamilyPriorities; confidence: 'high' | 'medium' | 'low'; themes: string[]; hasDualTrackSignals: boolean } | null
  playerMix:                PlayerMix
  familyPriorities:         FamilyPriorities
  onPlayerMixChange:        (v: PlayerMix) => void
  onFamilyPrioritiesChange: (v: FamilyPriorities) => void
  onEdit:                   () => void
  contradiction:            { message: string; details: string } | null
  onDismissContradiction:   () => void
  hasDualTrackSignals:      boolean
  hasAdultSelected:         boolean
}

function InferenceResult({
  inferred, playerMix, familyPriorities, onPlayerMixChange, onFamilyPrioritiesChange, onEdit,
  contradiction, onDismissContradiction, hasDualTrackSignals, hasAdultSelected,
}: InferenceResultProps) {
  const inferredModel = inferAcademyModel(playerMix, familyPriorities, [])

  const confidenceColor =
    !inferred || inferred.confidence === 'low'
      ? 'text-text-muted'
      : inferred.confidence === 'medium'
      ? 'text-status-orange'
      : 'text-status-green'

  const headerText = !inferred
    ? "I couldn't determine a clear profile from this — please set it directly below."
    : inferred.confidence === 'low'
    ? `I made a best guess — ${MODEL_LABELS[inferredModel]}. Please check these are right.`
    : `I read this as a ${Model_LABELS_safe(inferredModel)} — ${inferred.confidence} confidence.`

  return (
    <div className="mt-3 rounded-xl bg-surface border border-lime/20 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-lime text-[10px] font-mono font-bold">D</span>
          </div>
          <p className={`text-xs leading-relaxed ${confidenceColor}`}>{headerText}</p>
        </div>
        <button
          className="text-text-muted text-[11px] uppercase tracking-widest hover:text-text-secondary transition-colors flex-shrink-0"
          onClick={onEdit}
        >
          Edit
        </button>
      </div>

      {inferred && inferred.themes.length > 0 && (
        <div className="flex gap-1.5 flex-wrap pl-8">
          {inferred.themes.map(t => (
            <span key={t} className="text-[11px] bg-surface-raised border border-border rounded px-2 py-0.5 text-text-muted">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-text-muted mb-1.5">Player mix</div>
          <select
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-lime"
            value={playerMix}
            onChange={e => onPlayerMixChange(e.target.value as PlayerMix)}
          >
            <option value="competitive_juniors">Competitive juniors</option>
            <option value="mixed">Mixed</option>
            <option value="recreational_adult">Recreational / adult</option>
            <option value="private_small_group">Private / small group</option>
          </select>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-widest text-text-muted mb-1.5">Family priorities</div>
          <select
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-lime"
            value={familyPriorities}
            onChange={e => onFamilyPrioritiesChange(e.target.value as FamilyPriorities)}
          >
            <option value="results_rankings">Results and rankings</option>
            <option value="development_enjoyment">Development and enjoyment</option>
            <option value="fitness_fun">Fitness and fun</option>
            <option value="individual_attention">Individual attention</option>
          </select>
        </div>
      </div>

      <div className="pl-0 pt-1">
        <div className="text-[11px] uppercase tracking-widest text-text-muted">Starting model</div>
        <div className="text-lime font-mono text-sm mt-0.5">{MODEL_LABELS[inferredModel]}</div>
      </div>

      {/* Dual-track hint — only shown when dual-track language detected but adult level not yet selected */}
      {hasDualTrackSignals && !hasAdultSelected && (
        <div className="flex items-start gap-2 pt-3 border-t border-border mt-1">
          <div className="w-6 h-6 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-lime text-[10px] font-mono font-bold">D</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            I noticed language suggesting both competitive and recreational tracks. If you run adult programs, select <span className="text-text-secondary">Adult</span> in your active levels above.
          </p>
        </div>
      )}

      {/* Contradiction warning */}
      {contradiction && (
        <div className="mt-3 border border-status-orange/30 bg-status-orange/5 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-status-orange/10 border border-status-orange/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-status-orange text-[10px] font-mono font-bold">D</span>
            </div>
            <div className="space-y-1">
              <p className="text-status-orange text-xs font-medium">{contradiction.message}</p>
              <p className="text-text-muted text-xs leading-relaxed">{contradiction.details}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 pl-8">
            <button
              className="text-left text-xs text-text-secondary hover:text-text-primary transition-colors py-0.5"
              onClick={onDismissContradiction}
            >
              → Keep my current configuration
            </button>
            <button
              className="text-left text-xs text-text-secondary hover:text-text-primary transition-colors py-0.5"
              onClick={onDismissContradiction}
            >
              → Revise my selections below
            </button>
            <button
              className="text-left text-xs text-text-secondary hover:text-text-primary transition-colors py-0.5"
              onClick={onEdit}
            >
              → Revise my academy description
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Safe label helper (avoids direct bracket access on computed key)
function Model_LABELS_safe(model: string): string {
  return MODEL_LABELS[model as InferredModel] ?? model
}

interface StageSummaryTableProps {
  stagePriorities:   Record<string, StagePriorityState>
  activeLevels:      string[]
  summaryConfirmed:  boolean
  customizing:       string | null
  onConfirm:         () => void
  onCustomize:       (stage: string) => void
  onDoneCustomizing: () => void
  onMoveCategory:    (stage: string, index: number, dir: -1 | 1) => void
}

function StageSummaryTable({
  stagePriorities, activeLevels, summaryConfirmed, customizing,
  onConfirm, onCustomize, onDoneCustomizing, onMoveCategory,
}: StageSummaryTableProps) {
  if (activeLevels.length === 0) {
    return <p className="text-text-muted text-sm">No levels selected.</p>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-surface border border-border overflow-hidden">
        <div
          className="grid text-[11px] uppercase tracking-widest text-text-muted bg-surface-raised px-4 py-2"
          style={{ gridTemplateColumns: '110px repeat(7, 1fr)' }}
        >
          <div>Level</div>
          {STAGE_CATEGORIES.map(c => (
            <div key={c} className="text-center">{CATEGORY_SHORT[c]}</div>
          ))}
        </div>
        {activeLevels.map(level => {
          const p = stagePriorities[level]
          if (!p) return null
          return (
            <div
              key={level}
              className="grid px-4 py-3 border-t border-border items-center"
              style={{ gridTemplateColumns: '110px repeat(7, 1fr)' }}
            >
              <div className="text-text-secondary text-sm">
                {(AGE_GROUP_LABELS[level as AgeGroup] ?? level).replace(/\s*\(.*\)/, '')}
              </div>
              {STAGE_CATEGORIES.map(cat => {
                const rank   = p.ranking.indexOf(cat)
                const weight = RANK_WEIGHTS[rank] ?? 6
                return (
                  <div key={cat} className="text-center">
                    <div className={`text-xs font-mono ${rank <= 1 ? 'text-lime' : rank <= 3 ? 'text-text-secondary' : 'text-text-muted'}`}>
                      {weight}%
                    </div>
                    <div className="text-[9px] text-text-muted mt-0.5">#{rank + 1}</div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {customizing && stagePriorities[customizing] && (
        <StageRanker
          stage={customizing}
          priorities={stagePriorities[customizing]}
          onMove={(i, dir) => onMoveCategory(customizing, i, dir)}
          onDone={onDoneCustomizing}
        />
      )}

      {!customizing && (
        <div className="flex gap-3">
          {!summaryConfirmed ? (
            <>
              <button className="btn-lime flex-1" onClick={onConfirm}>
                This Looks Right →
              </button>
              <div className="relative group">
                <button className="btn-ghost" onClick={() => onCustomize(activeLevels[0])}>
                  Customize
                </button>
                {activeLevels.length > 1 && (
                  <div className="absolute top-full left-0 mt-1 bg-surface-raised border border-border rounded-lg py-1 z-10 hidden group-hover:block min-w-[160px]">
                    {activeLevels.map(level => (
                      <button
                        key={level}
                        className="block w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                        onClick={() => onCustomize(level)}
                      >
                        {(AGE_GROUP_LABELS[level as AgeGroup] ?? level).replace(/\s*\(.*\)/, '')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-status-green text-sm">
              <span>✓</span>
              <span>Stage priorities confirmed</span>
              <button
                className="text-text-muted text-xs ml-3 hover:text-text-secondary transition-colors"
                onClick={() => onCustomize(activeLevels[0])}
              >
                Edit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StageRanker({
  stage, priorities, onMove, onDone,
}: {
  stage:      string
  priorities: StagePriorityState
  onMove:     (i: number, dir: -1 | 1) => void
  onDone:     () => void
}) {
  const stageLabel = (AGE_GROUP_LABELS[stage as AgeGroup] ?? stage).replace(/\s*\(.*\)/, '')

  return (
    <div className="rounded-xl bg-surface-raised border border-lime/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-text-primary text-sm font-medium">{stageLabel} — adjust priorities</div>
        <button className="btn-lime text-sm" onClick={onDone}>Done</button>
      </div>
      <div className="space-y-1.5">
        {priorities.ranking.map((cat, i) => (
          <div key={cat} className="flex items-center gap-3 bg-surface rounded-lg px-3 py-2">
            <div className="text-text-muted text-[11px] font-mono w-5 text-right">#{i + 1}</div>
            <div className={`flex-1 text-sm ${i <= 1 ? 'text-text-primary' : 'text-text-secondary'}`}>
              {CATEGORY_LABELS[cat]}
            </div>
            <div className="text-lime text-[11px] font-mono w-10 text-right">{RANK_WEIGHTS[i]}%</div>
            <div className="flex gap-1">
              <button
                className="w-6 h-6 rounded bg-surface-raised text-text-muted hover:text-text-primary text-xs disabled:opacity-30 transition-colors"
                disabled={i === 0}
                onClick={() => onMove(i, -1)}
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                className="w-6 h-6 rounded bg-surface-raised text-text-muted hover:text-text-primary text-xs disabled:opacity-30 transition-colors"
                disabled={i === priorities.ranking.length - 1}
                onClick={() => onMove(i, 1)}
                aria-label="Move down"
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PathwayWeightsBar({ stagePriorities }: { stagePriorities: Record<string, StagePriorityState> }) {
  const weights = computePathwayWeights(stagePriorities)
  if (Object.keys(weights).length === 0) return null

  return (
    <div className="space-y-2 pt-2">
      <div className="text-[11px] uppercase tracking-widest text-text-muted">
        Composite pathway weights
      </div>
      <div className="flex gap-0.5 h-3 rounded-full overflow-hidden bg-surface">
        {STAGE_CATEGORIES.map(cat => {
          const w = weights[cat] ?? 0
          if (w === 0) return null
          return (
            <div
              key={cat}
              className="h-full bg-lime/40"
              style={{ width: `${w}%` }}
              title={`${CATEGORY_LABELS[cat]}: ${w}%`}
            />
          )
        })}
      </div>
      <div className="flex gap-4 flex-wrap">
        {STAGE_CATEGORIES.map(cat => {
          const w = weights[cat] ?? 0
          return (
            <div key={cat} className="flex items-center gap-1">
              <div className="text-[11px] text-text-muted">{CATEGORY_SHORT[cat]}</div>
              <div className="text-[11px] font-mono text-lime">{w}%</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AcademySummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-text-muted">{label}</div>
      <div className="text-text-primary text-sm mt-0.5">{value}</div>
    </div>
  )
}
