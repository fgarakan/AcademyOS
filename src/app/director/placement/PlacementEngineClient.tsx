'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronRight, Check, Loader2, AlertTriangle, Users, Zap, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  createPlacementDraftAction,
  approvePlacementDraftAction,
  activatePlayerAction,
} from './placementDraftAction'
import { buildPlacementDonnaChip } from '@/lib/donna/assessmentDonnaContext'

export interface PendingPlayer {
  id: string
  full_name: string | null
  date_of_birth: string | null
  player_status: string | null
  existing_rec: PlacementRec | null
}

export interface PlacementRec {
  id: string
  status: string
  recommended_group_id: string | null
  recommended_track: string | null
  recommended_level_id: string | null
  recommendation_rationale: string | null
  group_name?: string | null
  level_label?: string | null
}

export interface GroupOption {
  id: string
  name: string
  track: string | null
}

export interface LevelOption {
  id: string
  label: string
  track: string | null
}

const TRACK_LABELS: Record<string, string> = {
  skill: 'Skill',
  competition: 'Competition',
  fitness: 'Fitness',
  combined: 'Combined',
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending_placement:     { label: 'Pending placement', color: 'text-status-orange' },
  placement_in_progress: { label: 'In progress',       color: 'text-lime' },
  pending_approval:      { label: 'Pending approval',  color: 'text-status-blue' },
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function suggestTrack(age: number | null): string {
  if (age === null) return 'skill'
  if (age < 12) return 'skill'
  if (age < 16) return 'skill'
  return 'competition'
}

interface PlayerCardProps {
  player: PendingPlayer
  academyId: string
  groups: GroupOption[]
  levels: LevelOption[]
}

function PlayerPlacementCard({ player, academyId, groups, levels }: PlayerCardProps) {
  const age = calcAge(player.date_of_birth)
  const suggested = suggestTrack(age)
  const rec = player.existing_rec

  const [track, setTrack] = useState(rec?.recommended_track ?? suggested)
  const [groupId, setGroupId] = useState(rec?.recommended_group_id ?? '')
  const [levelId, setLevelId] = useState(rec?.recommended_level_id ?? '')
  const [rationale, setRationale] = useState(rec?.recommendation_rationale ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const statusConf = STATUS_CONFIG[player.player_status ?? ''] ?? { label: player.player_status ?? '—', color: 'text-text-muted' }

  function handleCreate() {
    if (!groupId) { setError('Select a group before creating the draft.'); return }
    setError(null)
    startTransition(async () => {
      const result = await createPlacementDraftAction(
        player.id, academyId, groupId, track, levelId || null, rationale,
      )
      if (result.error) setError(result.error)
    })
  }

  function handleApprove() {
    if (!rec) return
    setError(null)
    startTransition(async () => {
      const result = await approvePlacementDraftAction(rec.id, academyId)
      if (result.error) setError(result.error)
    })
  }

  function handleActivate() {
    if (!rec) return
    setError(null)
    startTransition(async () => {
      const result = await activatePlayerAction(rec.id, academyId)
      if (result.error) setError(result.error)
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar name={player.full_name ?? '?'} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-text-primary text-sm">{player.full_name ?? '—'}</p>
              <span className={`text-[11px] font-medium ${statusConf.color}`}>{statusConf.label}</span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {age !== null ? `Age ${age}` : 'Age unknown'}
              {age !== null && age < 12 ? ' · Recommended track: Skill' : age !== null && age < 16 ? ' · Recommended track: Skill' : age !== null ? ' · Recommended track: Competition' : ''}
            </p>
          </div>
          <Link
            href={`/director/players/${player.id}`}
            className="text-xs text-lime hover:opacity-80 font-medium flex items-center gap-1"
          >
            Profile <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">

        {/* Existing recommendation — show review UI */}
        {rec && (
          <div className={`rounded-xl border p-4 space-y-3 ${
            rec.status === 'approved' ? 'border-status-green/30 bg-status-green/5' :
            rec.status === 'generated' ? 'border-lime/20 bg-lime/3' :
            'border-border bg-surface-raised'
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Placement Draft
              </p>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                rec.status === 'approved'
                  ? 'bg-status-green/10 border-status-green/30 text-status-green'
                  : 'bg-lime/10 border-lime/20 text-lime'
              }`}>
                {rec.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wide">Group</p>
                <p className="text-text-primary font-medium mt-0.5">{rec.group_name ?? rec.recommended_group_id ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wide">Track</p>
                <p className="text-text-primary font-medium mt-0.5">{TRACK_LABELS[rec.recommended_track ?? ''] ?? rec.recommended_track ?? '—'}</p>
              </div>
              {rec.level_label && (
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wide">Level</p>
                  <p className="text-text-primary font-medium mt-0.5">{rec.level_label}</p>
                </div>
              )}
            </div>
            {rec.recommendation_rationale && (
              <p className="text-xs text-text-secondary">{rec.recommendation_rationale}</p>
            )}

            {rec.status === 'generated' && (
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="w-full btn-lime text-sm flex items-center justify-center gap-2"
              >
                {isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Approving…</>
                  : <><Check className="w-4 h-4" /> Approve Recommendation</>}
              </button>
            )}

            {rec.status === 'approved' && (
              <div className="space-y-2">
                <p className="text-[10px] text-text-muted">Activating moves the player from pending to active and writes their group, track, and level assignment. This cannot be undone from this screen — contact support if you need to reverse an activation.</p>
                <button
                  onClick={handleActivate}
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-status-green text-base hover:bg-status-green/90 transition-all"
                >
                  {isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Activating…</>
                    : <><Zap className="w-4 h-4" /> Activate Player</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create form — shown when no existing rec */}
        {!rec && (
          <div className="space-y-3">
            <p className="text-xs text-text-muted">Create a placement draft to review and activate this player.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-xs block mb-1">Track</label>
                <select
                  value={track}
                  onChange={e => setTrack(e.target.value)}
                  disabled={isPending}
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-lime/50 disabled:opacity-50"
                >
                  {Object.entries(TRACK_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-xs block mb-1">Group <span className="text-status-red">*</span></label>
                <select
                  value={groupId}
                  onChange={e => setGroupId(e.target.value)}
                  disabled={isPending}
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-lime/50 disabled:opacity-50"
                >
                  <option value="">— Select group —</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {levels.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="label-xs block mb-1">Level (optional)</label>
                  <select
                    value={levelId}
                    onChange={e => setLevelId(e.target.value)}
                    disabled={isPending}
                    className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-lime/50 disabled:opacity-50"
                  >
                    <option value="">— No level assigned —</option>
                    {levels.map(l => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="label-xs block mb-1">Notes (optional)</label>
                <textarea
                  value={rationale}
                  onChange={e => setRationale(e.target.value)}
                  disabled={isPending}
                  rows={2}
                  placeholder="e.g. Age-appropriate group, strong groundstrokes, suggested by coach assessment."
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-lime/50 disabled:opacity-50 resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={isPending || !groupId}
              className={[
                'w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                groupId && !isPending
                  ? 'bg-lime text-base hover:bg-lime/90'
                  : 'bg-surface-raised text-text-muted border border-border cursor-not-allowed opacity-60',
              ].join(' ')}
            >
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating draft…</>
                : 'Create Placement Draft'}
            </button>
          </div>
        )}

        {error && (
          <p className="text-[11px] text-status-red flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />{error}
          </p>
        )}

      </CardContent>
    </Card>
  )
}

interface Props {
  players: PendingPlayer[]
  academyId: string
  groups: GroupOption[]
  levels: LevelOption[]
}

const placementChip = buildPlacementDonnaChip()

function openDonnaWithPlacementPrompt() {
  window.dispatchEvent(new CustomEvent('donna:open', { detail: { prompt: placementChip.prompt } }))
}

export function PlacementEngineClient({ players, academyId, groups, levels }: Props) {
  if (players.length === 0) {
    return (
      <Card>
        <CardContent className="py-14">
          <div className="flex flex-col items-center gap-3 text-center">
            <Users className="w-8 h-8 text-text-muted" />
            <p className="text-text-primary font-semibold text-sm">No pending placements</p>
            <p className="text-text-muted text-xs max-w-xs">
              Players pending placement will appear here. Import players from the Players directory to begin.
            </p>
            <Link href="/director/players" className="btn-lime text-sm mt-2">
              Go to Players
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 px-0.5">
        <p className="text-xs text-text-muted">
          Review each player and create a placement draft to begin.
        </p>
        <button
          type="button"
          onClick={openDonnaWithPlacementPrompt}
          title={placementChip.safetyNote}
          className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-lime transition-colors shrink-0"
        >
          <Sparkles className="w-3 h-3 shrink-0" />
          Ask DONNA
        </button>
      </div>

      {players.map(player => (
        <PlayerPlacementCard
          key={player.id}
          player={player}
          academyId={academyId}
          groups={groups}
          levels={levels}
        />
      ))}

      <p className="text-[10px] text-text-muted text-right leading-relaxed">
        Drafts require director approval. Activation is irreversible — the player becomes active.
      </p>
    </div>
  )
}
