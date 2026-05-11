import { getSupabaseServer } from '@/lib/supabase/server'
import { Clock, CheckCircle, Lock, ArrowUpRight, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

interface Props {
  templateId: string
}

interface PlanItem {
  title: string
  contentType: string
  domain: string | null
  sessionBlockHint: string | null
  isCoachOnly: boolean
  description: string | null
  cues: string[] | null
  criteria: string[] | null
  progressions: string[] | null
  regressions: string[] | null
  durationMin: number | null
}

interface PlanBlock {
  blockId: string
  blockName: string
  orderIndex: number
  items: PlanItem[]
}

export async function CoachSessionCurriculumPanel({ templateId }: Props) {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  const { data: tblData } = await rawDb
    .from('template_blocks')
    .select('id, name, order_index')
    .eq('template_id', templateId)
    .order('order_index')

  const tblList = (tblData ?? []) as Array<{ id: string; name: string; order_index: number }>
  if (tblList.length === 0) return null

  const tblIds = tblList.map(b => b.id)

  const { data: cctbData } = await rawDb
    .from('curriculum_class_template_blocks')
    .select(`
      block_id,
      order_index,
      duration_min,
      content_item:curriculum_content_items(title, content_type, domain, session_block_hint, is_coach_only, description, coach_cues, success_criteria, progressions, regressions, duration_min),
      drill:curriculum_drills(name, domain, coaching_cues, success_criteria, progression_easier, progression_harder, duration_min)
    `)
    .in('block_id', tblIds)
    .order('order_index')

  const rows = (cctbData ?? []) as Array<{
    block_id: string
    order_index: number
    duration_min: number | null
    content_item: {
      title: string
      content_type: string
      domain: string | null
      session_block_hint: string | null
      is_coach_only: boolean
      description: string | null
      coach_cues: string[] | null
      success_criteria: string[] | null
      progressions: string[] | null
      regressions: string[] | null
      duration_min: number | null
    } | null
    drill: {
      name: string
      domain: string | null
      coaching_cues: unknown
      success_criteria: string | null
      progression_easier: string | null
      progression_harder: string | null
      duration_min: number | null
    } | null
  }>

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-4 text-center">
          <p className="text-xs text-text-muted">No planned focus content yet.</p>
          <p className="text-[11px] text-text-muted mt-1">Run the session from the blocks below and add a wrap-up after class.</p>
        </CardContent>
      </Card>
    )
  }

  const grouped = new Map<string, typeof rows>()
  for (const row of rows) {
    const arr = grouped.get(row.block_id) ?? []
    arr.push(row)
    grouped.set(row.block_id, arr)
  }

  const planBlocks: PlanBlock[] = []
  for (const tb of tblList) {
    const blockRows = grouped.get(tb.id) ?? []
    if (blockRows.length === 0) continue
    planBlocks.push({
      blockId: tb.id,
      blockName: tb.name,
      orderIndex: tb.order_index,
      items: blockRows.map(row => {
        const drillCriteria = row.drill?.success_criteria ?? null
        return {
          title: row.content_item?.title ?? row.drill?.name ?? 'Untitled',
          contentType: row.content_item?.content_type ?? 'drill',
          domain: row.content_item?.domain ?? row.drill?.domain ?? null,
          sessionBlockHint: row.content_item?.session_block_hint ?? null,
          isCoachOnly: row.content_item?.is_coach_only ?? false,
          description: row.content_item?.description ?? null,
          cues: row.content_item?.coach_cues ?? null,
          criteria: row.content_item?.success_criteria ?? (drillCriteria ? [drillCriteria] : null),
          progressions: row.content_item?.progressions ??
            (row.drill?.progression_harder ? [row.drill.progression_harder] : null),
          regressions: row.content_item?.regressions ??
            (row.drill?.progression_easier ? [row.drill.progression_easier] : null),
          durationMin: row.duration_min ?? row.content_item?.duration_min ?? row.drill?.duration_min ?? null,
        }
      }),
    })
  }

  if (planBlocks.length === 0) return null

  return (
    <div className="space-y-3">
      {planBlocks.map((block, i) => (
        <Card key={block.blockId}>
          <CardContent className="py-3">
            {/* Block header */}
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[10px] font-mono text-lime w-5 shrink-0">{i + 1}</span>
              <p className="text-xs font-semibold text-text-primary">{block.blockName}</p>
            </div>

            {/* Curriculum items */}
            <ul className="space-y-3 pl-7">
              {block.items.map((item, j) => (
                <li key={j}>
                  <div className="flex items-start gap-2">
                    <span className="text-lime/60 text-xs mt-0.5 shrink-0">›</span>
                    <div className="min-w-0 flex-1">

                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[11px] font-medium text-text-primary">{item.title}</p>
                        {item.isCoachOnly && (
                          <span className="text-[9px] text-text-muted flex items-center gap-0.5 border border-border px-1.5 py-0.5 rounded">
                            <Lock className="w-2 h-2" />
                            Internal
                          </span>
                        )}
                        {item.durationMin != null && (
                          <span className="text-[10px] text-text-muted flex items-center gap-0.5 ml-auto shrink-0">
                            <Clock className="w-2.5 h-2.5" />
                            {item.durationMin}min
                          </span>
                        )}
                      </div>

                      {/* Domain + session block hint */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        {item.domain && (
                          <span className="text-[10px] text-text-muted">{item.domain}</span>
                        )}
                        {item.sessionBlockHint && (
                          <span className="text-[10px] text-text-muted">
                            {item.domain ? '·' : ''} {item.sessionBlockHint}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {item.description && (
                        <p className="text-[10px] text-text-muted/80 mt-0.5 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {/* Coach cues */}
                      {item.cues && item.cues.length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          {item.cues.slice(0, 3).map((cue, k) => (
                            <p key={k} className="text-[10px] text-text-secondary flex items-start gap-1">
                              <span className="text-lime/70 shrink-0 mt-0.5">·</span>
                              {cue}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Success criteria */}
                      {item.criteria && item.criteria.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {item.criteria.slice(0, 2).map((c, k) => (
                            <p key={k} className="text-[10px] text-text-muted flex items-start gap-1">
                              <CheckCircle className="w-2.5 h-2.5 text-status-green shrink-0 mt-0.5" />
                              {c}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Progressions + Regressions */}
                      {((item.progressions && item.progressions.length > 0) || (item.regressions && item.regressions.length > 0)) && (
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                          {item.progressions && item.progressions.length > 0 && (
                            <div className="space-y-0.5">
                              <p className="text-[9px] uppercase tracking-widest text-lime/70">Make It Harder</p>
                              {item.progressions.slice(0, 2).map((p, k) => (
                                <p key={k} className="text-[10px] text-text-muted flex items-start gap-1">
                                  <ArrowUpRight className="w-2.5 h-2.5 text-lime shrink-0 mt-0.5" />
                                  {p}
                                </p>
                              ))}
                            </div>
                          )}
                          {item.regressions && item.regressions.length > 0 && (
                            <div className="space-y-0.5">
                              <p className="text-[9px] uppercase tracking-widest text-text-muted/60">Make It Easier</p>
                              {item.regressions.slice(0, 2).map((r, k) => (
                                <p key={k} className="text-[10px] text-text-muted flex items-start gap-1">
                                  <ArrowRight className="w-2.5 h-2.5 text-text-muted shrink-0 mt-0.5 rotate-180" />
                                  {r}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
