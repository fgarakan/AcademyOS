import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getPlatformRole } from '@/lib/backend/platform'
import { PlatformNav } from '@/components/nav/PlatformNav'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const platformRole = await getPlatformRole(supabase, user.id)
  if (!platformRole) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <PlatformNav role={platformRole.role} />
      <main className="flex-1 ml-60">{children}</main>
    </div>
  )
}
