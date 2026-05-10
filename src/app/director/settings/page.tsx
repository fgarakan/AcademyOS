import Link from 'next/link'
import { ArrowLeft, Building2, Info } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { AcademySettingsForm } from './AcademySettingsForm'

export default async function AcademySettingsPage() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Please sign in to access settings.</p>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!profile?.academy_id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  const academyId = profile.academy_id

  // Director-only: check role before rendering
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (membership?.role !== 'academy_director') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">
          Academy settings are only available to academy directors.
        </p>
      </div>
    )
  }

  const rawDb = supabase as any
  const { data: academy } = await rawDb
    .from('academies')
    .select('id, name, country, timezone, settings')
    .eq('id', academyId)
    .single()

  if (!academy) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy not found.</p>
      </div>
    )
  }

  const settings = (academy.settings as Record<string, unknown>) ?? {}
  const initialLogoUrl = (settings.logo_url as string) ?? ''
  const initialWebsite = (settings.website as string) ?? ''
  const initialDescription = (settings.description as string) ?? ''

  return (
    <div className="animate-fade-in p-6 space-y-6 max-w-2xl">

      <Link
        href="/director"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Dashboard
      </Link>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-3.5 h-3.5 text-lime" />
          <p className="page-eyebrow">Settings</p>
        </div>
        <h1 className="page-title">Academy Identity</h1>
        <p className="page-subtitle">
          Configure your academy's name, location, and branding.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-lime/5 border border-lime/20 text-xs text-text-secondary">
        <Info className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <span>
          These details will be used across onboarding, parent-facing materials, player views,
          and future academy reports. Only academy directors can edit this information.
        </span>
      </div>

      <Card>
        <CardContent className="py-6">
          <AcademySettingsForm
            initialName={academy.name ?? ''}
            initialCountry={academy.country ?? ''}
            initialTimezone={academy.timezone ?? ''}
            initialLogoUrl={initialLogoUrl}
            initialWebsite={initialWebsite}
            initialDescription={initialDescription}
          />
        </CardContent>
      </Card>

    </div>
  )
}
