import { PlayerPortalShell } from '@/components/player/PlayerPortalShell'
import { PreviewBanner } from '@/components/platform/PreviewBanner'
import { getSupabaseServer } from '@/lib/supabase/server'
import { FirstRunDeckGate } from '@/components/onboarding/FirstRunDeckGate'

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let hasSeenFirstRunDeck = true
  let firstName: string | null = null
  let levelName: string | null = null

  if (user) {
    const rawDb = supabase as any

    const { data: profile } = await rawDb
      .from('profiles')
      .select('has_seen_first_run_deck, academy_id')
      .eq('id', user.id)
      .single()

    hasSeenFirstRunDeck = (profile?.has_seen_first_run_deck ?? true) as boolean

    if (profile?.academy_id) {
      const { data: playerRow } = await rawDb
        .from('players')
        .select('first_name, curriculum_level_id')
        .eq('profile_id', user.id)
        .eq('academy_id', profile.academy_id)
        .eq('is_active', true)
        .maybeSingle()

      firstName = playerRow?.first_name ?? null

      if (playerRow?.curriculum_level_id) {
        const { data: levelRow } = await rawDb
          .from('curriculum_levels')
          .select('display_name')
          .eq('id', playerRow.curriculum_level_id)
          .maybeSingle()

        levelName = levelRow?.display_name ?? null
      }
    }
  }

  return (
    <PlayerPortalShell firstName={firstName} levelName={levelName}>
      <PreviewBanner />
      <FirstRunDeckGate hasSeenDeck={hasSeenFirstRunDeck} role="player">
        {children}
      </FirstRunDeckGate>
    </PlayerPortalShell>
  )
}
