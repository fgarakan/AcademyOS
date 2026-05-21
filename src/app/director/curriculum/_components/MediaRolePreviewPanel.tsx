'use client'

import { useState } from 'react'
import { Eye, EyeOff, Shield } from 'lucide-react'
import type { MediaVisibilityLevel } from '@/lib/media/mediaAssetTypes'
import type { ViewerRole } from '@/lib/media/mediaVisibilityRules'
import {
  canRoleViewMedia,
  BLOCKED_REASON_LABELS,
  getVisibilityLabel,
  getMediaVisibilityBadgeClass,
} from '@/lib/media/mediaVisibilityRules'
import type { MediaAsset } from '@/lib/media/mediaAssetTypes'

const ROLES: { role: ViewerRole; label: string }[] = [
  { role: 'director', label: 'Director' },
  { role: 'coach',    label: 'Coach' },
  { role: 'parent',   label: 'Parent' },
  { role: 'player',   label: 'Player' },
]

const PREVIEW_VISIBILITY_OPTIONS: { value: MediaVisibilityLevel; label: string }[] = [
  { value: 'internal_only',           label: 'Internal Only' },
  { value: 'coach_director_only',     label: 'Coach & Director' },
  { value: 'parent_safe',             label: 'Parent Safe' },
  { value: 'player_safe',             label: 'Player Safe' },
  { value: 'parent_player_safe',      label: 'Parent & Player Safe' },
  { value: 'licensed_partner_content', label: 'Licensed Partner' },
]

interface Props {
  levelName: string
}

function makeSampleAsset(visibility: MediaVisibilityLevel): MediaAsset {
  return {
    assetId: 'sample',
    title: 'Sample Video Asset',
    description: null,
    sourceType: 'youtube',
    sourceUrl: 'https://example.com',
    ownerType: 'academy',
    ownerLabel: null,
    licenseStatus: 'academy_licensed',
    licenseNote: null,
    visibilityLevel: visibility,
    reviewStatus: 'approved',
    thumbnailUrl: null,
    durationSeconds: null,
    attributionLabel: null,
    tags: [],
    academyId: null,
    createdAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    approvedBy: null,
  }
}

export function MediaRolePreviewPanel({ levelName }: Props) {
  const [visibility, setVisibility] = useState<MediaVisibilityLevel>('coach_director_only')

  const sampleAsset = makeSampleAsset(visibility)
  const badgeClass = getMediaVisibilityBadgeClass(visibility)

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <div className="flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-text-muted shrink-0" />
        <p className="text-[11px] font-medium text-text-secondary">
          Media Visibility Simulator — {levelName}
        </p>
      </div>

      <p className="text-[11px] text-text-muted leading-relaxed">
        Preview how a video asset with a given visibility setting appears to each role.
        No actual media is created.
      </p>

      {/* Visibility picker */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-text-muted">Visibility Setting</p>
        <div className="flex flex-wrap gap-1.5">
          {PREVIEW_VISIBILITY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setVisibility(value)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                visibility === value
                  ? `${getMediaVisibilityBadgeClass(value)} ring-1 ring-inset ring-lime/20`
                  : 'border-border bg-surface-raised text-text-muted hover:border-lime/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Current setting badge */}
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badgeClass}`}>
          {getVisibilityLabel(visibility)}
        </span>
        <p className="text-[10px] text-text-muted">selected visibility</p>
      </div>

      {/* Role grid */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-text-muted">Access by Role</p>
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {ROLES.map(({ role, label }) => {
            const result = canRoleViewMedia(role, sampleAsset)
            return (
              <div
                key={role}
                className={`flex items-start gap-3 px-4 py-3 ${
                  result.canView ? 'bg-status-green/3' : 'bg-surface'
                }`}
              >
                {result.canView ? (
                  <Eye className="w-3.5 h-3.5 text-status-green shrink-0 mt-0.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-medium ${result.canView ? 'text-text-primary' : 'text-text-muted'}`}>
                    {label}
                  </p>
                  {result.canView ? (
                    <p className="text-[10px] text-status-green">Can view this asset</p>
                  ) : (
                    <p className="text-[10px] text-text-muted leading-snug">
                      {result.reason ? BLOCKED_REASON_LABELS[result.reason] : 'Cannot view'}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
