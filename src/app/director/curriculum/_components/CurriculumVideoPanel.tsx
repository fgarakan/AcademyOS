'use client'

import { useState } from 'react'
import { Video, AlertTriangle, ExternalLink } from 'lucide-react'
import type { MediaVisibilityLevel, MediaSourceType } from '@/lib/media/mediaAssetTypes'
import { SOURCE_TYPE_LABELS } from '@/lib/media/mediaAssetTypes'
import { getVisibilityLabel, getMediaVisibilityBadgeClass } from '@/lib/media/mediaVisibilityRules'

interface Props {
  levelId: string
  levelName: string
}

const VISIBILITY_OPTIONS: MediaVisibilityLevel[] = [
  'coach_director_only',
  'parent_safe',
  'player_safe',
  'parent_player_safe',
  'internal_only',
]

const SOURCE_OPTIONS: MediaSourceType[] = [
  'youtube',
  'vimeo',
  'external_url',
  'academy_recorded',
]

export function CurriculumVideoPanel({ levelName }: Props) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [sourceType, setSourceType] = useState<MediaSourceType>('youtube')
  const [visibility, setVisibility] = useState<MediaVisibilityLevel>('coach_director_only')
  const [licenseNote, setLicenseNote] = useState('')
  const [drafted, setDrafted] = useState(false)

  const isValid = title.trim().length > 0 && url.trim().length > 0

  function handleReset() {
    setTitle('')
    setUrl('')
    setDescription('')
    setSourceType('youtube')
    setVisibility('coach_director_only')
    setLicenseNote('')
    setDrafted(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Video className="w-4 h-4 text-text-muted shrink-0" />
        <p className="text-[12px] font-medium text-text-secondary">
          Attach Video to {levelName}
        </p>
      </div>

      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-status-orange/5 border border-status-orange/20">
        <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
        <p className="text-[11px] text-text-muted leading-relaxed">
          <span className="text-status-orange font-medium">External link draft only.</span>{' '}
          No upload storage is connected yet. This draft requires director approval
          before appearing in any curriculum view. Parent/player access is controlled
          by the visibility setting below.
        </p>
      </div>

      {!drafted ? (
        <div className="space-y-3">
          {/* Source type */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Source</p>
            <div className="flex flex-wrap gap-1.5">
              {SOURCE_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setSourceType(s)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
                    sourceType === s
                      ? 'bg-lime/10 border-lime/30 text-lime'
                      : 'border-border bg-surface-raised text-text-muted hover:border-lime/20'
                  }`}
                >
                  {SOURCE_TYPE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Video URL *</p>
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=…"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors"
            />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Title *</p>
            <input
              type="text"
              placeholder="e.g. Crosscourt forehand drill — beginner"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Description</p>
            <textarea
              placeholder="What this video shows and when to use it…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors"
            />
          </div>

          {/* Visibility */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Visibility</p>
            <div className="flex flex-wrap gap-1.5">
              {VISIBILITY_OPTIONS.map(v => {
                const badgeClass = getMediaVisibilityBadgeClass(v)
                return (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                      visibility === v
                        ? `${badgeClass} ring-1 ring-inset ring-lime/20`
                        : 'border-border bg-surface-raised text-text-muted hover:border-lime/20'
                    }`}
                  >
                    {getVisibilityLabel(v)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* License note */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">
              License / Attribution
            </p>
            <input
              type="text"
              placeholder="e.g. © ITF 2024, used with permission"
              value={licenseNote}
              onChange={e => setLicenseNote(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors"
            />
          </div>

          <button
            onClick={() => isValid && setDrafted(true)}
            disabled={!isValid}
            className="btn-lime w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Video Draft
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <Video className="w-3.5 h-3.5 text-lime shrink-0" />
              <p className="text-[11px] font-medium text-lime">Video draft saved</p>
              <span className={`ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded border ${getMediaVisibilityBadgeClass(visibility)}`}>
                {getVisibilityLabel(visibility)}
              </span>
            </div>
            <p className="text-[12px] font-semibold text-text-primary">{title}</p>
            {description && (
              <p className="text-[11px] text-text-secondary leading-relaxed">{description}</p>
            )}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-lime hover:opacity-80 transition-opacity"
            >
              <ExternalLink className="w-3 h-3" />
              {SOURCE_TYPE_LABELS[sourceType]} link
            </a>
            {licenseNote && (
              <p className="text-[10px] text-text-muted/70 border-t border-lime/10 pt-1.5">
                {licenseNote}
              </p>
            )}
            <div className="flex items-start gap-1.5 pt-1.5 border-t border-lime/10">
              <AlertTriangle className="w-3 h-3 text-status-orange shrink-0 mt-0.5" />
              <p className="text-[10px] text-text-muted leading-relaxed">
                Requires director approval before appearing in any curriculum or player view.
              </p>
            </div>
          </div>
          <button onClick={handleReset} className="btn-ghost w-full">
            Add Another Video
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface-raised px-3 py-2.5">
        <p className="text-[10px] text-text-muted/60 leading-relaxed">
          <span className="text-text-muted">Future:</span>{' '}
          When a media_assets table and storage bucket are added, internal uploads
          will be supported here without changing this interface.
        </p>
      </div>
    </div>
  )
}
