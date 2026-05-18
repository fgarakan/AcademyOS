import Link from 'next/link'
import { ArrowLeft, Database, AlertTriangle, CheckCircle2, Map, Sparkles } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getCurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { CurriculumLevelMap } from '@/components/curriculum/builder/CurriculumLevelMap'
import { CurriculumRelationshipMapNav } from '@/components/curriculum/builder/CurriculumRelationshipMapNav'
import { CurriculumSearch } from '@/components/curriculum/builder/CurriculumSearch'
import { CurriculumDonnaPanel } from '@/components/curriculum/builder/CurriculumDonnaPanel'
import type { CurriculumDonnaPanelHealthItem } from '@/components/curriculum/builder/CurriculumDonnaPanel'

export default async function CurriculumMapPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const explorerData = await getCurriculumExplorerData(supabase)

  const { tablesAvailable, levels, gates, drills } = explorerData

  // ── Data provenance label ───────────────────────────────────────────────────
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

  // ── Health stats for DONNA panel ───────────────────────────────────────────
  const gatesByLevel = gates.reduce<Record<string, number>>((acc, g) => {
    acc[g.from_level_id] = (acc[g.from_level_id] ?? 0) + 1
    return acc
  }, {})
  const drillsByLevel = drills.reduce<Record<string, number>>((acc, d) => {
    if (d.level_min_id) acc[d.level_min_id] = (acc[d.level_min_id] ?? 0) + 1
    return acc
  }, {})

  let readyCount = 0
  let needsReviewCount = 0
  let incompleteCount = 0
  let customCount = 0

  for (const level of levels) {
    const g = gatesByLevel[level.id] ?? 0
    const d = drillsByLevel[level.id] ?? 0
    const hasCustom = drills.some(dr => dr.level_min_id === level.id && dr.source_type === 'academy')
    if (hasCustom) customCount++
    if (g >= 2 && d >= 3) {
      readyCount++
    } else if (g === 0 && d === 0) {
      incompleteCount++
    } else {
      needsReviewCount++
    }
  }

  const needsAttentionCount = needsReviewCount + incompleteCount

  const healthItems: CurriculumDonnaPanelHealthItem[] = [
    { label: 'Ready',        count: readyCount,       color: '#30D158' },
    { label: 'Needs Review', count: needsReviewCount, color: '#FF9500' },
    { label: 'Incomplete',   count: incompleteCount,  color: '#FF3B30' },
    { label: 'Custom',       count: customCount,      color: '#0A84FF' },
  ]

  // ── Subtitle stats ─────────────────────────────────────────────────────────
  const pathwayCount = new Set(levels.map(l => l.stage).filter(Boolean)).size
  const subtitle = tablesAvailable && levels.length > 0
    ? `${levels.length} level${levels.length !== 1 ? 's' : ''} across ${pathwayCount} pathway${pathwayCount !== 1 ? 's' : ''}${needsAttentionCount > 0 ? ` · ${needsAttentionCount} need attention` : ''}`
    : 'All levels at a glance. Click any level to explore its drills, gates, and coaching language.'

  return (
    <div className="animate-fade-in flex gap-6 p-6 items-start">

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/director/curriculum/builder" className="text-text-muted hover:text-lime transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="page-eyebrow">Curriculum</p>
            <h1 className="page-title">Curriculum Map</h1>
          </div>
          {/* Top action buttons */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Link
              href="/director/curriculum/guided"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors"
              style={{ border: '1px solid rgba(17,217,223,0.20)', color: '#11d9df', background: 'rgba(17,217,223,0.05)' }}
            >
              <Sparkles className="w-3 h-3" />
              Start Guided Review
            </Link>
            <Link
              href="/director/curriculum/builder"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-border text-text-muted hover:text-text-secondary transition-colors"
            >
              <Map className="w-3 h-3" />
              Jump to Level
            </Link>
          </div>
        </div>

        {/* Dynamic subtitle */}
        <p className="text-[12px] text-text-secondary leading-relaxed max-w-xl">
          {subtitle}
        </p>

        {/* Jump-to search */}
        {tablesAvailable && levels.length > 0 && (
          <CurriculumSearch data={explorerData} />
        )}

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

        <CurriculumRelationshipMapNav levels={explorerData.levels} gates={explorerData.gates} drills={explorerData.drills} />

        <div className="border-t border-border pt-6">
          <CurriculumLevelMap data={explorerData} />
        </div>
      </div>

      {/* ── Right DONNA panel (desktop only) ──────────────────────────────── */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-6 self-start">
        <CurriculumDonnaPanel
          mode="map"
          healthItems={healthItems}
        />
      </aside>
    </div>
  )
}
