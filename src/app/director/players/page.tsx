import Link from 'next/link'
import { Upload } from 'lucide-react'
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Players</h1>
          <p className="text-sm text-text-secondary mt-1">
            Director operating list for every active academy player
          </p>
        </div>
        <Link
          href="/director/players/import"
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors shrink-0"
        >
          <Upload className="w-4 h-4" />
          Import Players
        </Link>
      </div>

      <PlayersDirectoryClient players={players} />
    </div>
  )
}
