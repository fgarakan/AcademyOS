import Link from 'next/link'
import { ArrowLeft, BookOpen, Info } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { CurriculumStarterForm } from './CurriculumStarterForm'

export default async function CurriculumStarterPage() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Please sign in to access curriculum setup.</p>
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
          Curriculum setup is only available to academy directors.
        </p>
      </div>
    )
  }

  const rawDb = supabase as any
  const { data: academy } = await rawDb
    .from('academies')
    .select('id, name, settings')
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
  const curriculumSetup = (settings.curriculum_setup as Record<string, unknown>) ?? {}

  const initialOption = (curriculumSetup.starter_option as string) ?? ''
  const initialNotes = (curriculumSetup.notes as string) ?? ''

  return (
    <div className="animate-fade-in p-6 space-y-6 max-w-2xl">

      <Link
        href="/director/onboarding"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Onboarding
      </Link>

      {/* ── Page header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-3.5 h-3.5 text-lime" />
          <p className="page-eyebrow">Onboarding · Step 3</p>
        </div>
        <h1 className="page-title">Curriculum Starter</h1>
        <p className="page-subtitle">
          Choose how your academy should start its curriculum setup.
        </p>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-lime/5 border border-lime/20 text-xs text-text-secondary">
        <Info className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <span>
          This does not change your curriculum yet. It tells Academy OS what kind of curriculum
          setup experience to prepare next.
        </span>
      </div>

      <Card>
        <CardContent className="py-6">
          <CurriculumStarterForm
            initialOption={initialOption}
            initialNotes={initialNotes}
          />
        </CardContent>
      </Card>

    </div>
  )
}
