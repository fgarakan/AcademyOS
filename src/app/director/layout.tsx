import { SidebarNav } from '@/components/nav/SidebarNav'
import { getSupabaseServer } from '@/lib/supabase/server'
import { PreviewBanner } from '@/components/platform/PreviewBanner'

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
      const { data: academy } = await supabase
        .from('academies')
        .select('name')
        .eq('id', profile.academy_id)
        .single()

      if (academy?.name) {
        academyName = academy.name
      }
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
    </div>
  )
}
