'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft, Sparkles, GraduationCap, Target, Dumbbell, CheckCircle2, AlertCircle, Plus, X, Zap, Clock } from 'lucide-react'
import { TemplateDonnaPanel } from '@/components/templates/TemplateDonnaPanel'

// demo-only — no writes — no saves — local state only

type Step = 1 | 2 | 3 | 4 | 5

const STEPS = [
  { id: 1, label: 'Level / Group', icon: GraduationCap },
  { id: 2, label: 'Fitness Goal', icon: Target },
  { id: 3, label: 'Load + Duration', icon: Dumbbell },
  { id: 4, label: 'Add Exercises', icon: Zap },
  { id: 5, label: 'Review', icon: CheckCircle2 },
]

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite'] as const
const LOAD_LEVELS = ['Light', 'Moderate', 'High'] as const

const FITNESS_GOALS = [
  { id: 'speed_agility', label: 'Speed & Agility', description: 'First step quickness, lateral movement, change-of-direction' },
  { id: 'strength_power', label: 'Strength & Power', description: 'Rotational power, upper body strength, explosive leg drive' },
  { id: 'mobility_flexibility', label: 'Mobility & Flexibility', description: 'Hip mobility, shoulder health, ankle stability, injury prevention' },
  { id: 'endurance', label: 'Endurance', description: 'Aerobic capacity, point-to-point recovery, match stamina' },
  { id: 'coordination', label: 'Coordination', description: 'Hand-eye coordination, ball tracking, footwork patterns' },
]

const EXERCISES_BY_GOAL: Record<string, { name: string; sets: string; reps: string; tennisTransfer: string }[]> = {
  speed_agility: [
    { name: 'Ladder Footwork — 2-in/2-out', sets: '3', reps: '4 passes', tennisTransfer: 'Court coverage' },
    { name: 'Lateral Cone Sprint', sets: '4', reps: '6 reps each side', tennisTransfer: 'Split-step reaction' },
    { name: 'T-Pattern Drill', sets: '3', reps: '5 reps', tennisTransfer: 'First step acceleration' },
    { name: 'Pro Agility Shuttle', sets: '4', reps: '4 reps', tennisTransfer: 'Change of direction' },
  ],
  strength_power: [
    { name: 'Medicine Ball Rotational Throw', sets: '3', reps: '8 each side', tennisTransfer: 'Forehand/backhand power' },
    { name: 'Single-Leg Squat', sets: '3', reps: '8 each leg', tennisTransfer: 'Low ball stability' },
    { name: 'Band Shoulder External Rotation', sets: '3', reps: '15 reps', tennisTransfer: 'Serve shoulder health' },
    { name: 'Explosive Broad Jump', sets: '3', reps: '5 reps', tennisTransfer: 'Net approach drive' },
  ],
  mobility_flexibility: [
    { name: 'Hip 90/90 Stretch', sets: '2', reps: '60s each side', tennisTransfer: 'Low ball reach' },
    { name: 'Thoracic Rotation with Reach', sets: '2', reps: '10 each side', tennisTransfer: 'Shoulder turn for serve' },
    { name: 'Ankle Circles + Calf Raise', sets: '2', reps: '15 reps', tennisTransfer: 'Split-step landing' },
    { name: 'World Greatest Stretch', sets: '2', reps: '8 each side', tennisTransfer: 'Full body mobility' },
  ],
  endurance: [
    { name: 'Interval Baseline Sprints', sets: '5', reps: '30s on / 15s rest', tennisTransfer: 'Point recovery' },
    { name: 'Aerobic Shadow Footwork', sets: '4', reps: '60s continuous', tennisTransfer: 'Match endurance' },
    { name: 'Suicide Runs', sets: '3', reps: '4 reps', tennisTransfer: 'Court coverage stamina' },
  ],
  coordination: [
    { name: 'Ball Drop Reaction', sets: '3', reps: '10 drops', tennisTransfer: 'Hand-eye coordination' },
    { name: 'Two-Ball Juggling', sets: '3', reps: '30s', tennisTransfer: 'Ball tracking' },
    { name: 'Footwork Ladder — Ickey Shuffle', sets: '3', reps: '4 passes', tennisTransfer: 'Rhythm and timing' },
  ],
}

interface Exercise {
  id: string
  name: string
  sets: string
  reps: string
  tennisTransfer: string
}

export default function CreateFitnessTemplatePage() {
  const [step, setStep] = useState<Step>(1)
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedGoal, setSelectedGoal] = useState<string>('')
  const [load, setLoad] = useState<string>('Moderate')
  const [durationMin, setDurationMin] = useState<number>(30)
  const [exercises, setExercises] = useState<Exercise[]>([])

  function addExercise(ex: { name: string; sets: string; reps: string; tennisTransfer: string }) {
    if (exercises.find(e => e.name === ex.name)) return
    setExercises(prev => [...prev, { id: `ex-${Date.now()}`, ...ex }])
  }

  function removeExercise(id: string) {
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  const goalInfo = FITNESS_GOALS.find(g => g.id === selectedGoal)
  const exerciseSuggestions = EXERCISES_BY_GOAL[selectedGoal] ?? []

  return (
    <div className="flex gap-6 p-6 min-h-screen items-start">

      <div className="flex-1 min-w-0 space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] text-text-muted select-none">
          <Link href="/director" className="hover:text-text-secondary transition-colors duration-100">AcademyOS</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <Link href="/director/templates" className="hover:text-text-secondary transition-colors duration-100">Templates</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <Link href="/director/templates/fitness" className="hover:text-text-secondary transition-colors duration-100">Fitness Templates</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <span className="text-text-secondary font-medium">Create</span>
        </nav>

        {/* Header */}
        <div>
          <p className="page-eyebrow">Templates</p>
          <h1 className="page-title">Create Fitness Template</h1>
          <p className="page-subtitle">Build a physical training block step by step.</p>
        </div>

        {/* Demo notice */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-status-orange/20 bg-status-orange/5 text-[11px] text-status-orange">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Demo flow — no data is saved. Backend wiring coming in a future sprint.</span>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = step === s.id
            const isDone = step > s.id
            return (
              <div key={s.id} className="flex items-center gap-1 shrink-0">
                <div className={[
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium',
                  isActive
                    ? 'bg-status-purple/10 border border-status-purple/25 text-status-purple'
                    : isDone
                      ? 'bg-surface-raised border border-border text-text-secondary'
                      : 'bg-surface border border-border text-text-muted',
                ].join(' ')}>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-status-purple' : 'text-text-muted'}`} />
                  )}
                  {s.label}
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-text-muted/30 shrink-0" />
                )}
              </div>
            )
          })}
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-border bg-surface p-6">

          {/* Step 1 — Level */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-text-primary mb-1">Choose Level / Player Group</h2>
                <p className="text-sm text-text-secondary">Match the physical demands to the right player group.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LEVELS.map(level => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={[
                      'flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all duration-150',
                      selectedLevel === level
                        ? 'border-status-purple/30 bg-status-purple/8'
                        : 'border-border bg-surface-raised hover:border-status-purple/20',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text-primary">{level}</span>
                      {selectedLevel === level && <CheckCircle2 className="w-4 h-4 text-status-purple" />}
                    </div>
                    <p className="text-xs text-text-secondary">
                      {level === 'Beginner' && 'Light load, coordination focus, injury prevention priority'}
                      {level === 'Intermediate' && 'Moderate load, speed and agility development'}
                      {level === 'Advanced' && 'Higher load, power and match-specific conditioning'}
                      {level === 'Elite' && 'High-performance training, tournament prep load'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Fitness Goal */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-text-primary mb-1">Choose Fitness Goal</h2>
                <p className="text-sm text-text-secondary">
                  What physical outcome are you training for?
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-status-purple/20 bg-status-purple/8 text-status-purple">{selectedLevel}</span>
                </p>
              </div>
              <div className="space-y-2">
                {FITNESS_GOALS.map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={[
                      'w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-150',
                      selectedGoal === goal.id
                        ? 'border-status-purple/30 bg-status-purple/8'
                        : 'border-border bg-surface-raised hover:border-status-purple/20',
                    ].join(' ')}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${selectedGoal === goal.id ? 'border-status-purple bg-status-purple' : 'border-border'}`}>
                      {selectedGoal === goal.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{goal.label}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{goal.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Load + Duration */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-text-primary mb-1">Set Load + Duration</h2>
                <p className="text-sm text-text-secondary">Define the intensity and length of this fitness block.</p>
              </div>

              {/* Load */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Training Load</p>
                <div className="grid grid-cols-3 gap-3">
                  {LOAD_LEVELS.map(level => {
                    const color = level === 'Light' ? 'status-green' : level === 'Moderate' ? 'status-orange' : 'status-red'
                    const isSelected = load === level
                    return (
                      <button
                        key={level}
                        onClick={() => setLoad(level)}
                        className={[
                          'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-150',
                          isSelected
                            ? `border-${color}/30 bg-${color}/8`
                            : 'border-border bg-surface-raised hover:border-border/60',
                        ].join(' ')}
                      >
                        <div className={`w-3 h-3 rounded-full bg-${color} ${isSelected ? 'shadow-[0_0_8px] shadow-current' : 'opacity-40'}`} />
                        <span className={`text-sm font-semibold ${isSelected ? `text-${color}` : 'text-text-muted'}`}>{level}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Duration</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setDurationMin(d => Math.max(10, d - 5))}
                    className="w-10 h-10 rounded-xl border border-border bg-surface-raised flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-status-purple/20 transition-all duration-100 text-lg font-bold"
                  >
                    -
                  </button>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-mono font-bold text-text-primary">{durationMin}</span>
                    <span className="text-sm text-text-muted mb-1">min</span>
                  </div>
                  <button
                    onClick={() => setDurationMin(d => Math.min(90, d + 5))}
                    className="w-10 h-10 rounded-xl border border-border bg-surface-raised flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-status-purple/20 transition-all duration-100 text-lg font-bold"
                  >
                    +
                  </button>
                  <span className="text-xs text-text-muted ml-2">5-minute increments · 10–90min</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Exercises */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-text-primary mb-1">Add Exercises</h2>
                <p className="text-sm text-text-secondary">
                  Select exercises for{' '}
                  <span className="font-semibold text-text-primary">{goalInfo?.label}</span>.
                </p>
              </div>

              {/* Suggestions */}
              {exerciseSuggestions.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Suggested Exercises</p>
                  <div className="space-y-2">
                    {exerciseSuggestions.map(ex => {
                      const isAdded = exercises.some(e => e.name === ex.name)
                      return (
                        <div key={ex.name} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface-raised">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary">{ex.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[10px] text-text-muted">{ex.sets} sets · {ex.reps}</span>
                              <span className="text-[10px] text-status-purple">{ex.tennisTransfer}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => isAdded ? removeExercise(exercises.find(e => e.name === ex.name)!.id) : addExercise(ex)}
                            className={[
                              'w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-100 shrink-0',
                              isAdded
                                ? 'border-status-green/30 bg-status-green/10 text-status-green'
                                : 'border-border bg-surface text-text-muted hover:border-status-purple/20 hover:text-status-purple',
                            ].join(' ')}
                          >
                            {isAdded ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Added exercises */}
              {exercises.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">
                    Added — {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-2">
                    {exercises.map(ex => (
                      <div key={ex.id} className="flex items-center gap-3 p-3 rounded-xl border border-status-purple/15 bg-status-purple/5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">{ex.name}</p>
                          <span className="text-[10px] text-text-muted">{ex.sets} sets · {ex.reps}</span>
                        </div>
                        <button
                          onClick={() => removeExercise(ex.id)}
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-status-red transition-colors duration-100 shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {exercises.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Dumbbell className="w-8 h-8 text-text-muted/30" />
                  <p className="text-sm text-text-muted">No exercises added yet. Select from the suggestions above.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 5 — Review */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-text-primary mb-1">Review Fitness Template</h2>
                <p className="text-sm text-text-secondary">Check everything before saving as a draft.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border">
                  <GraduationCap className="w-4 h-4 text-status-purple shrink-0" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Level</p>
                    <p className="text-sm font-semibold text-text-primary">{selectedLevel || 'Not selected'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border">
                  <Target className="w-4 h-4 text-status-purple shrink-0" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Fitness Goal</p>
                    <p className="text-sm font-semibold text-text-primary">{goalInfo?.label || 'Not selected'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border">
                  <Dumbbell className="w-4 h-4 text-status-purple shrink-0" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Load + Duration</p>
                    <p className="text-sm font-semibold text-text-primary">{load} load — {durationMin}min</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border">
                  <Clock className="w-4 h-4 text-status-purple shrink-0" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Exercises</p>
                    <p className="text-sm font-semibold text-text-primary">{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="p-4 rounded-xl border border-status-orange/20 bg-status-orange/5 text-[11px] text-status-orange mb-4">
                  <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
                  Demo mode — clicking Save Draft does not persist anything. Backend wiring coming in a future sprint.
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => alert('Demo only — no data saved.')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-status-purple border border-status-purple/30 bg-status-purple/10 hover:bg-status-purple/15 active:scale-95 transition-all duration-100"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Save as Draft
                  </button>
                  <Link href="/director/templates/fitness" className="btn-ghost inline-flex items-center gap-2">
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(prev => Math.max(1, prev - 1) as Step)}
            disabled={step === 1}
            className="btn-ghost inline-flex items-center gap-2 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          {step < 5 && (
            <button
              onClick={() => {
                if (step === 1 && !selectedLevel) return
                if (step === 2 && !selectedGoal) return
                setStep(prev => Math.min(5, prev + 1) as Step)
              }}
              disabled={(step === 1 && !selectedLevel) || (step === 2 && !selectedGoal)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-status-purple border border-status-purple/30 bg-status-purple/10 hover:bg-status-purple/15 transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* DONNA tip */}
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-status-purple/15 bg-status-purple/4">
          <Sparkles className="w-4 h-4 text-status-purple shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">DONNA tip: </span>
            {step === 1 && 'Match the load expectations to the player group. Beginners need lighter loads and more coordination work. Elite players need high-intensity conditioning.'}
            {step === 2 && 'Choose the fitness goal that best supports your curriculum focus this training block. Speed and agility templates are most commonly missing for Intermediate groups.'}
            {step === 3 && 'A 20–30min block works well at the start of a session. A 30–45min block works as a standalone fitness session. Keep High load for advanced groups only.'}
            {step === 4 && 'Aim for 4–6 exercises per block. Include at least one tennis-specific transfer drill to keep the training sport-relevant.'}
            {step === 5 && 'Review before saving. Once saved as a draft, you can add pathway connections and notes from the detail view.'}
          </p>
        </div>

      </div>

      <TemplateDonnaPanel mode="fitness_create" />
    </div>
  )
}
