import { getSupabaseServer } from '@/lib/supabase/server'
import { getPlayerSummaries } from '@/lib/backend/players'
import { PlayersDirectoryClient } from './_components/PlayersDirectoryClient'

export default async function PlayersPage() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  let academyId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()
    academyId = profile?.academy_id ?? null
  }

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  const players = await getPlayerSummaries(supabase, academyId)

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Players</h1>
        <p className="text-sm text-text-secondary mt-1">
          Director operating list for every active academy player
        </p>
      </div>

      <PlayersDirectoryClient players={players} />
    </div>
  )
}
