import { SidebarNav } from '@/components/nav/SidebarNav'
import { getSupabaseServer } from '@/lib/supabase/server'
import { PreviewBanner } from '@/components/platform/PreviewBanner'
import { QuickCaptureButton } from '@/components/capture/QuickCaptureButton'

export default async function DirectorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await getSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let academyName = ''
  let academyId = ''
  let pendingCount = 0
  let userEmail = ''
  let userDisplayName = ''

  if (user) {
    userEmail = user.email ?? ''

    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id, display_name')
      .eq('id', user.id)
      .single()

    if (profile?.display_name) {
      userDisplayName = profile.display_name
    }

    if (profile?.academy_id) {
      academyId = profile.academy_id

      const { data: academy } = await supabase
        .from('academies')
        .select('name')
        .eq('id', profile.academy_id)
        .single()

      if (academy?.name) {
        academyName = academy.name
      }

      // Real pending count — all proposed_actions pending review for this academy
      const rawDb = supabase as any
      const { count } = await rawDb
        .from('proposed_actions')
        .select('id', { count: 'exact', head: true })
        .eq('academy_id', profile.academy_id)
        .eq('status', 'pending_review')

      pendingCount = count ?? 0
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <SidebarNav
        academyName={academyName}
        pendingCount={pendingCount}
        userEmail={userEmail}
        userDisplayName={userDisplayName}
      />
      <main className="flex-1 ml-60 min-h-screen">
        <PreviewBanner />
        {children}
      </main>
      {academyId && <QuickCaptureButton academyId={academyId} />}
    </div>
  )
}
