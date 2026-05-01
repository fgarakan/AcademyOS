import Link from 'next/link'
import { Upload, Users } from 'lucide-react'
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
    <div className="p-6 animate-fade-in space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="page-eyebrow">Academy</p>
          <h1 className="page-title">Player Directory</h1>
          <p className="page-subtitle">
            {players.length > 0
              ? `${players.length} player${players.length !== 1 ? 's' : ''} registered`
              : 'Academy-wide player tracking'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/director/players/import"
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <Upload className="w-4 h-4" />
            Import
          </Link>
        </div>
      </div>

      <PlayersDirectoryClient players={players} />
    </div>
  )
}
