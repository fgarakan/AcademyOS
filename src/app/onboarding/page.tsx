import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { OnboardingClient } from './OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  const rawDb = supabase as any

  const { data: profile } = await rawDb
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!profile?.academy_id) redirect('/auth/signin')

  const { data: academy } = await rawDb
    .from('academies')
    .select('name, settings')
    .eq('id', profile.academy_id)
    .single()

  // If onboarding already complete, skip back to director
  const settings = (academy?.settings as Record<string, unknown>) ?? {}
  const onboarding = settings.onboarding as Record<string, unknown> | undefined
  if (typeof onboarding?.onboarding_completed_at === 'string') {
    redirect('/director')
  }

  const academyName = (academy?.name as string | null) ?? 'Your Academy'

  return (
    <main className="min-h-screen bg-base text-text-primary">
      <OnboardingClient academyName={academyName} />
    </main>
  )
}
