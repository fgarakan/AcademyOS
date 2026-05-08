import { getSupabaseServer } from '@/lib/supabase/server'
import { BookOpen, Clock, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

interface Props {
  templateId: string
}

interface PlanItem {
  title: string
  contentType: string
  domain: string | null
  cues: string[] | null
  criteria: string[] | null
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

  // Fetch template blocks for this template
  const { data: tblData } = await rawDb
    .from('template_blocks')
    .select('id, name, order_index')
    .eq('template_id', templateId)
    .order('order_index')

  const tblList = (tblData ?? []) as Array<{ id: string; name: string; order_index: number }>
  if (tblList.length === 0) return null

  const tblIds = tblList.map(b => b.id)

  // Fetch curriculum class template blocks with joined content
  const { data: cctbData } = await rawDb
    .from('curriculum_class_template_blocks')
    .select(`
      block_id,
      order_index,
      duration_min,
      content_item:curriculum_content_items(title, content_type, domain, coach_cues, success_criteria, duration_min),
      drill:curriculum_drills(name, domain, cues, success_criteria, duration_min)
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
      coach_cues: string[] | null
      success_criteria: string[] | null
      duration_min: number | null
    } | null
    drill: {
      name: string
      domain: string | null
      cues: string[] | null
      success_criteria: string[] | null
      duration_min: number | null
    } | null
  }>

  if (rows.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-3.5 h-3.5 text-lime" />
          <p className="label-xs">Curriculum Lesson Plan</p>
        </div>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-text-muted">Director has not applied a curriculum lesson plan yet.</p>
            <p className="text-[11px] text-text-muted mt-1">Run the session from the blocks below and add a wrap-up after class.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Group rows by block_id
  const grouped = new Map<string, typeof rows>()
  for (const row of rows) {
    const arr = grouped.get(row.block_id) ?? []
    arr.push(row)
    grouped.set(row.block_id, arr)
  }

  // Build ordered plan blocks (skip blocks with no curriculum content)
  const planBlocks: PlanBlock[] = []
  for (const tb of tblList) {
    const blockRows = grouped.get(tb.id) ?? []
    if (blockRows.length === 0) continue
    planBlocks.push({
      blockId: tb.id,
      blockName: tb.name,
      orderIndex: tb.order_index,
      items: blockRows.map(row => ({
        title: row.content_item?.title ?? row.drill?.name ?? 'Untitled',
        contentType: row.content_item?.content_type ?? 'drill',
        domain: row.content_item?.domain ?? row.drill?.domain ?? null,
        cues: row.content_item?.coach_cues ?? row.drill?.cues ?? null,
        criteria: row.content_item?.success_criteria ?? row.drill?.success_criteria ?? null,
        durationMin: row.duration_min ?? row.content_item?.duration_min ?? row.drill?.duration_min ?? null,
      })),
    })
  }

  if (planBlocks.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-3.5 h-3.5 text-lime" />
        <p className="label-xs">Curriculum Lesson Plan</p>
      </div>
      <div className="space-y-3">
        {planBlocks.map((block, i) => (
          <Card key={block.blockId}>
            <CardContent className="py-3">
              {/* Block header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono text-text-muted w-5 shrink-0">{i + 1}</span>
                <p className="text-xs font-semibold text-text-primary">{block.blockName}</p>
              </div>

              {/* Curriculum items */}
              <ul className="space-y-2.5 pl-7">
                {block.items.map((item, j) => (
                  <li key={j}>
                    <div className="flex items-start gap-2">
                      <span className="text-lime text-xs mt-0.5 shrink-0">›</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[11px] font-medium text-text-primary">{item.title}</p>
                          {item.domain && (
                            <span className="text-[10px] text-text-muted">{item.domain}</span>
                          )}
                          {item.durationMin != null && (
                            <span className="text-[10px] text-text-muted flex items-center gap-0.5 ml-auto shrink-0">
                              <Clock className="w-2.5 h-2.5" />
                              {item.durationMin}min
                            </span>
                          )}
                        </div>

                        {/* Coach cues (up to 3) */}
                        {item.cues && item.cues.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {item.cues.slice(0, 3).map((cue, k) => (
                              <p key={k} className="text-[10px] text-text-secondary flex items-start gap-1">
                                <span className="text-lime/70 shrink-0 mt-0.5">·</span>
                                {cue}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Success criteria (up to 2) */}
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
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
