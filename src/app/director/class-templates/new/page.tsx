import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { getSupabaseServer } from '@/lib/supabase/server'
import { NewClassTemplateForm } from './NewClassTemplateForm'

export default async function NewClassTemplatePage() {
  // Read Academy DNA from settings — same pattern as director/page.tsx
  let dnaSessionBlocks: string[] = []
  let dnaDevelopmentPriorities: string[] = []
  let hasDna = false

  try {
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const rawDb = supabase as any

      const { data: profile } = await rawDb
        .from('profiles')
        .select('academy_id')
        .eq('id', user.id)
        .single()

      if (profile?.academy_id) {
        const { data: academyData } = await rawDb
          .from('academies')
          .select('settings')
          .eq('id', profile.academy_id)
          .single()

        const settings = (academyData?.settings as Record<string, unknown>) ?? {}
        const dna = typeof settings.academy_dna === 'object' && settings.academy_dna !== null
          ? (settings.academy_dna as Record<string, unknown>)
          : null

        if (dna) {
          hasDna = true

          const sessionDesign = typeof dna.session_design === 'object' && dna.session_design !== null
            ? (dna.session_design as Record<string, unknown>)
            : null
          const rawBlocks = sessionDesign?.session_blocks
          if (Array.isArray(rawBlocks)) {
            dnaSessionBlocks = rawBlocks.filter((b): b is string => typeof b === 'string')
          }

          const playerDev = typeof dna.player_development === 'object' && dna.player_development !== null
            ? (dna.player_development as Record<string, unknown>)
            : null
          const rawPriorities = playerDev?.development_priorities
          if (Array.isArray(rawPriorities)) {
            dnaDevelopmentPriorities = rawPriorities.filter((p): p is string => typeof p === 'string')
          }
        }
      }
    }
  } catch {
    // DNA read is best-effort — fail silently, show static DONNA card
  }

  return (
    <div className="p-6 animate-fade-in space-y-6 max-w-3xl">
      <div>
        <Link
          href="/director/class-templates"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Class Templates
        </Link>
        <p className="page-eyebrow">Curriculum</p>
        <h1 className="page-title">Create Class Template</h1>
        <p className="page-subtitle">
          Turn your Academy DNA into a coach-ready session structure.
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-[10px] text-text-muted">
          Draft first — nothing published to coaches until you apply it
        </div>
      </div>

      {/* Sprint 819: data-donna-focus-id so DonnaHighlightBanner can glow this section */}
      <div data-donna-focus-id="create-template-form">
        <Card>
          <CardContent className="py-5">
            <NewClassTemplateForm
              dnaSessionBlocks={dnaSessionBlocks}
              dnaDevelopmentPriorities={dnaDevelopmentPriorities}
              hasDna={hasDna}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
