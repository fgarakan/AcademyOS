'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateCoachesPermissionsAction } from './updateCoachesPermissionsAction'

// ── Coaching team structure ────────────────────────────────────

const TEAM_STRUCTURE_OPTIONS = [
  {
    value: 'director_led',
    label: 'Director-led coaching team',
    description: 'Director creates the plan and coaches execute assigned sessions.',
  },
  {
    value: 'head_coach_layers',
    label: 'Head coach + assistant coach layers',
    description: 'Head coaches supervise program areas while assistant coaches support sessions.',
  },
  {
    value: 'collaborative_team',
    label: 'Collaborative coaching team',
    description: 'Coaches contribute observations, notes, and planning feedback together.',
  },
  {
    value: 'flexible_staffing',
    label: 'Flexible staffing',
    description: 'Coach assignments change often based on schedule, court space, and attendance.',
  },
] as const

type TeamStructureValue = typeof TEAM_STRUCTURE_OPTIONS[number]['value']

// ── Coach access level ─────────────────────────────────────────

const ACCESS_LEVEL_OPTIONS = [
  {
    value: 'assigned_players_only',
    label: 'Assigned players only',
    description: 'Coaches see only the players, groups, and sessions assigned to them.',
  },
  {
    value: 'assigned_groups_plus_context',
    label: 'Assigned groups + development context',
    description: 'Coaches see assigned groups plus relevant priorities, notes, and curriculum context.',
  },
  {
    value: 'broad_academy_visibility',
    label: 'Broad academy visibility',
    description: 'Coaches can view most academy development context, but director approval still controls official changes.',
  },
] as const

type AccessLevelValue = typeof ACCESS_LEVEL_OPTIONS[number]['value']

// ── Level recommendation permission ───────────────────────────

const LEVEL_REC_OPTIONS = [
  {
    value: 'coach_can_recommend_director_approves',
    label: 'Coach can recommend, director approves',
    description: 'Coaches can suggest level movement, but directors make the final decision.',
  },
  {
    value: 'head_coach_can_approve',
    label: 'Head coach can approve',
    description: 'Head coaches can approve level movement within director-set rules.',
  },
  {
    value: 'director_only',
    label: 'Director only',
    description: 'Only directors can initiate and approve level movement.',
  },
] as const

type LevelRecValue = typeof LEVEL_REC_OPTIONS[number]['value']

// ── Communication permission ───────────────────────────────────

const COMM_OPTIONS = [
  {
    value: 'drafts_only',
    label: 'Coaches draft only',
    description: 'Coaches can draft parent/player updates, but director approval is required before sending.',
  },
  {
    value: 'approved_templates_only',
    label: 'Approved templates only',
    description: 'Coaches can send only director-approved templates.',
  },
  {
    value: 'director_only',
    label: 'Director sends all communication',
    description: 'Coaches do not send parent/player communication.',
  },
] as const

type CommValue = typeof COMM_OPTIONS[number]['value']

// ── Props ──────────────────────────────────────────────────────

interface Props {
  initialTeamStructure: string
  initialAccessLevel: string
  initialLevelRecommendation: string
  initialCommunicationPermission: string
  initialNotes: string
}

// ── Radio section ──────────────────────────────────────────────

function RadioSection<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { value: T; label: string; description: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">{label}</p>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150',
            value === opt.value
              ? 'border-lime/40 bg-lime/5'
              : 'border-border bg-surface-raised hover:border-lime/20',
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              'mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
              value === opt.value ? 'border-lime' : 'border-border',
            )}>
              {value === opt.value && (
                <div className="w-1.5 h-1.5 rounded-full bg-lime" />
              )}
            </div>
            <div className="min-w-0">
              <p className={cn(
                'text-sm font-medium leading-tight',
                value === opt.value ? 'text-text-primary' : 'text-text-secondary',
              )}>
                {opt.label}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                {opt.description}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────

export function CoachesPermissionsForm({
  initialTeamStructure,
  initialAccessLevel,
  initialLevelRecommendation,
  initialCommunicationPermission,
  initialNotes,
}: Props) {
  const defaultTeam: TeamStructureValue =
    TEAM_STRUCTURE_OPTIONS.some(o => o.value === initialTeamStructure)
      ? (initialTeamStructure as TeamStructureValue)
      : 'director_led'

  const defaultAccess: AccessLevelValue =
    ACCESS_LEVEL_OPTIONS.some(o => o.value === initialAccessLevel)
      ? (initialAccessLevel as AccessLevelValue)
      : 'assigned_groups_plus_context'

  const defaultLevelRec: LevelRecValue =
    LEVEL_REC_OPTIONS.some(o => o.value === initialLevelRecommendation)
      ? (initialLevelRecommendation as LevelRecValue)
      : 'coach_can_recommend_director_approves'

  const defaultComm: CommValue =
    COMM_OPTIONS.some(o => o.value === initialCommunicationPermission)
      ? (initialCommunicationPermission as CommValue)
      : 'drafts_only'

  const [teamStructure, setTeamStructure] = useState<TeamStructureValue>(defaultTeam)
  const [accessLevel, setAccessLevel] = useState<AccessLevelValue>(defaultAccess)
  const [levelRec, setLevelRec] = useState<LevelRecValue>(defaultLevelRec)
  const [commPermission, setCommPermission] = useState<CommValue>(defaultComm)
  const [notes, setNotes] = useState(initialNotes)

  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    setSaved(false)
    setError(null)
    startTransition(async () => {
      const result = await updateCoachesPermissionsAction(
        teamStructure,
        accessLevel,
        levelRec,
        commPermission,
        notes,
      )
      if (result.ok) setSaved(true)
      else setError(result.error)
    })
  }

  return (
    <div className="space-y-8">

      <RadioSection
        label="How is your coaching team structured?"
        options={TEAM_STRUCTURE_OPTIONS}
        value={teamStructure}
        onChange={v => { setTeamStructure(v); setSaved(false) }}
      />

      <RadioSection
        label="What can coaches access?"
        options={ACCESS_LEVEL_OPTIONS}
        value={accessLevel}
        onChange={v => { setAccessLevel(v); setSaved(false) }}
      />

      <RadioSection
        label="Who can recommend or approve level movement?"
        options={LEVEL_REC_OPTIONS}
        value={levelRec}
        onChange={v => { setLevelRec(v); setSaved(false) }}
      />

      <RadioSection
        label="Who can send parent and player communication?"
        options={COMM_OPTIONS}
        value={commPermission}
        onChange={v => { setCommPermission(v); setSaved(false) }}
      />

      {/* ── Notes ── */}
      <div className="space-y-1.5">
        <label className="label-xs">Coach Workflow Notes</label>
        <p className="text-xs text-text-secondary leading-relaxed">
          What should Academy OS know about how your coaches work, what they should see, and what should require director approval?
        </p>
        <textarea
          value={notes}
          onChange={e => { setNotes(e.target.value); setSaved(false) }}
          rows={3}
          maxLength={600}
          placeholder="e.g. Head coaches manage their own groups but all parent communication comes through the director. Assistants can view player notes but not edit…"
          className="w-full text-sm bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors resize-none"
        />
        <p className="text-[10px] text-text-muted text-right">{notes.length} / 600</p>
      </div>

      {/* ── Save ── */}
      <div className="pt-2 border-t border-border space-y-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-lime text-base font-semibold text-sm hover:bg-lime/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isPending ? 'Saving…' : 'Save Coaches + Permissions Setup'}
        </button>

        {saved && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/25">
            <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
            <p className="text-sm text-status-green font-medium">Coaches and permissions setup saved.</p>
          </div>
        )}
        {error && (
          <p className="text-sm text-status-red px-1">{error}</p>
        )}
      </div>

    </div>
  )
}
