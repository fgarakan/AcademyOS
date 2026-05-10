'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { updateAcademySettingsAction } from './updateAcademySettingsAction'

interface Props {
  initialName: string
  initialCountry: string
  initialTimezone: string
  initialLogoUrl: string
  initialWebsite: string
  initialDescription: string
}

export function AcademySettingsForm({
  initialName,
  initialCountry,
  initialTimezone,
  initialLogoUrl,
  initialWebsite,
  initialDescription,
}: Props) {
  const [name, setName] = useState(initialName)
  const [country, setCountry] = useState(initialCountry)
  const [timezone, setTimezone] = useState(initialTimezone)
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl)
  const [website, setWebsite] = useState(initialWebsite)
  const [description, setDescription] = useState(initialDescription)

  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    setSaved(false)
    setError(null)
    startTransition(async () => {
      const result = await updateAcademySettingsAction(
        name, country, timezone, logoUrl, website, description,
      )
      if (result.ok) {
        setSaved(true)
      } else {
        setError(result.error)
      }
    })
  }

  const inputClass = 'w-full text-sm bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors'
  const labelClass = 'label-xs'

  return (
    <div className="space-y-8">

      {/* ── Academy Identity ── */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Academy Identity</p>

        <div className="space-y-1.5">
          <label className={labelClass}>Academy Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setSaved(false) }}
            placeholder="e.g. Angles Tennis Academy"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>Country</label>
            <input
              type="text"
              value={country}
              onChange={e => { setCountry(e.target.value); setSaved(false) }}
              placeholder="e.g. United States"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={e => { setTimezone(e.target.value); setSaved(false) }}
              placeholder="e.g. America/Chicago"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── Branding ── */}
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Branding</p>
          <p className="text-[11px] text-text-muted mt-0.5">
            This identity will be used across onboarding, parent-facing materials, player views, and future reports.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Logo URL</label>
          <input
            type="url"
            value={logoUrl}
            onChange={e => { setLogoUrl(e.target.value); setSaved(false) }}
            placeholder="https://your-cdn.com/logo.png"
            className={inputClass}
          />
          <p className="text-[10px] text-text-muted">
            Logo upload is coming soon. For now, paste a hosted logo URL.
          </p>
          {logoUrl && (
            <div className="mt-2 w-16 h-16 rounded-xl border border-border bg-surface-raised overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Academy logo preview"
                className="max-w-full max-h-full object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Website</label>
          <input
            type="url"
            value={website}
            onChange={e => { setWebsite(e.target.value); setSaved(false) }}
            placeholder="https://your-academy.com"
            className={inputClass}
          />
        </div>
      </div>

      {/* ── Description ── */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Description</p>
        <div className="space-y-1.5">
          <label className={labelClass}>About your academy</label>
          <textarea
            value={description}
            onChange={e => { setDescription(e.target.value); setSaved(false) }}
            rows={3}
            maxLength={500}
            placeholder="A short description of your academy's mission and approach…"
            className={`${inputClass} resize-none`}
          />
          <p className="text-[10px] text-text-muted text-right">
            {description.length} / 500
          </p>
        </div>
      </div>

      {/* ── Save ── */}
      <div className="pt-2 border-t border-border space-y-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !name.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-lime text-base font-semibold text-sm hover:bg-lime/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : null}
          {isPending ? 'Saving…' : 'Save Academy Settings'}
        </button>

        {saved && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/25">
            <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
            <p className="text-sm text-status-green font-medium">Academy settings saved.</p>
          </div>
        )}
        {error && (
          <p className="text-sm text-status-red px-1">{error}</p>
        )}
      </div>

    </div>
  )
}
