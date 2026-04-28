import { SidebarNav } from '@/components/nav/SidebarNav'
import { getSupabaseServer } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'

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

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single<Pick<Tables<'profiles'>, 'academy_id'>>()

    if (profile?.academy_id) {
      const { data: academy } = await supabase
        .from('academies')
        .select('name')
        .eq('id', profile.academy_id)
        .single<Pick<Tables<'academies'>, 'name'>>()

      if (academy?.name) {
        academyName = academy.name
      }
    }
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav academyName={academyName} pendingCount={pendingCount} />
      <main className="flex-1 ml-60">{children}</main>
    </div>
  )
}