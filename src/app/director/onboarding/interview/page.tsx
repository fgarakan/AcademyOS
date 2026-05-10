import Link from 'next/link'
import { ArrowLeft, MessageSquare, Info } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { DirectorInterviewForm } from './DirectorInterviewForm'

export default async function DirectorInterviewPage() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Please sign in to access the director interview.</p>
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
          The director interview is only available to academy directors.
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
  const interview = (settings.director_interview as Record<string, unknown>) ?? {}

  const initialPhilosophy = (interview.philosophy as string) ?? ''
  const initialPlayerFocus = (interview.player_focus as string) ?? ''
  const initialDevelopmentPriorities = (interview.development_priorities as string) ?? ''
  const initialCompetitionApproach = (interview.competition_approach as string) ?? ''
  const initialParentCommunicationStyle = (interview.parent_communication_style as string) ?? ''
  const initialCoachOperatingStyle = (interview.coach_operating_style as string) ?? ''
  const initialNinetyDaySuccess = (interview.ninety_day_success as string) ?? ''

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
          <MessageSquare className="w-3.5 h-3.5 text-lime" />
          <p className="page-eyebrow">Onboarding · Step 2</p>
        </div>
        <h1 className="page-title">Director Interview</h1>
        <p className="page-subtitle">
          Tell Academy OS how your academy works.
        </p>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-lime/5 border border-lime/20 text-xs text-text-secondary">
        <Info className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <span>
          These answers help Academy OS understand how your academy works. Future AI-assisted
          setup will use this context to draft curriculum, groups, communication, and workflows
          for your review.
        </span>
      </div>

      <Card>
        <CardContent className="py-6">
          <DirectorInterviewForm
            initialPhilosophy={initialPhilosophy}
            initialPlayerFocus={initialPlayerFocus}
            initialDevelopmentPriorities={initialDevelopmentPriorities}
            initialCompetitionApproach={initialCompetitionApproach}
            initialParentCommunicationStyle={initialParentCommunicationStyle}
            initialCoachOperatingStyle={initialCoachOperatingStyle}
            initialNinetyDaySuccess={initialNinetyDaySuccess}
          />
        </CardContent>
      </Card>

    </div>
  )
}
