import Link from 'next/link'
import { ArrowLeft, Database, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getCurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { CurriculumLevelMap } from '@/components/curriculum/builder/CurriculumLevelMap'
import { CurriculumRelationshipMap } from '@/components/curriculum/builder/CurriculumRelationshipMap'

export default async function CurriculumMapPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const explorerData = await getCurriculumExplorerData(supabase)

  const { tablesAvailable, levels, gates, drills } = explorerData
  const seedDrills = drills.filter(d => d.source_type === 'seed' || d.source_type === 'master')
  const isAllSeed = drills.length > 0 && seedDrills.length === drills.length
  const hasMixed = drills.length > 0 && seedDrills.length > 0 && seedDrills.length < drills.length

  let dataLabel: { icon: typeof Database; text: string; color: string; bg: string } | null = null
  if (!tablesAvailable || levels.length === 0) {
    dataLabel = { icon: AlertTriangle, text: 'Curriculum data unavailable — tables not yet seeded', color: '#FF9500', bg: 'rgba(255,149,0,0.08)' }
  } else if (isAllSeed) {
    dataLabel = { icon: Database, text: `Seed curriculum — ${levels.length} levels · ${gates.length} gates · ${drills.length} drills · Not yet customized for your academy`, color: '#0A84FF', bg: 'rgba(10,132,255,0.07)' }
  } else if (hasMixed) {
    dataLabel = { icon: Database, text: `Partially customized — ${seedDrills.length} seed drills · ${drills.length - seedDrills.length} academy drills`, color: '#FF9500', bg: 'rgba(255,149,0,0.08)' }
  } else {
    dataLabel = { icon: CheckCircle2, text: `Live academy data — ${levels.length} levels · ${gates.length} gates · ${drills.length} drills`, color: '#30D158', bg: 'rgba(48,209,88,0.07)' }
  }

  return (
    <div className="animate-fade-in p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/director/curriculum/builder" className="text-text-muted hover:text-lime transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <p className="page-eyebrow">Curriculum</p>
          <h1 className="page-title">Curriculum Map</h1>
        </div>
      </div>
      <p className="page-subtitle max-w-xl">
        All levels at a glance. Click any level to explore its drills, gates, and coaching language.
        Coloured dots show sufficiency: green = ready, orange = low, red = missing content.
      </p>

      {/* Data provenance label */}
      {dataLabel && (
        <div
          className="flex items-center gap-2.5 rounded-xl px-4 py-2.5"
          style={{ background: dataLabel.bg, border: `1px solid ${dataLabel.color}22` }}
        >
          <dataLabel.icon className="w-3.5 h-3.5 shrink-0" style={{ color: dataLabel.color }} />
          <p className="text-[11px]" style={{ color: dataLabel.color }}>{dataLabel.text}</p>
        </div>
      )}

      <CurriculumRelationshipMap levels={explorerData.levels} />

      <div className="border-t border-border pt-6">
        <CurriculumLevelMap data={explorerData} />
      </div>
    </div>
  )
}
