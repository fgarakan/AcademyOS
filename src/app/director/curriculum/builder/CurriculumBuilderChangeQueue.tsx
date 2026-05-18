import { getSupabaseServer } from '@/lib/supabase/server'
import { CurriculumChangeQueue } from '@/components/curriculum/builder/CurriculumChangeQueue'
import type { CurriculumChangeItem } from '@/components/curriculum/builder/CurriculumChangeQueue'

export async function CurriculumBuilderChangeQueue() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('academy_id').eq('id', user.id).single()
  if (!profile?.academy_id) return null

  const rawDb = supabase as unknown as {
    from: (t: string) => {
      select: (s: string) => {
        eq: (col: string, val: string) => {
          eq: (col: string, val: string) => {
            order: (col: string, opts: { ascending: boolean }) => {
              limit: (n: number) => Promise<{ data: Array<{
                id: string
                action_type: string
                action_label: string
                status: string
                created_at: string
              }> | null; error: unknown }>
            }
          }
        }
      }
    }
  }

  const { data: rows } = await rawDb
    .from('proposed_actions')
    .select('id,action_type,action_label,status,created_at')
    .eq('academy_id', profile.academy_id)
    .eq('target_module', 'curriculum_builder')
    .order('created_at', { ascending: false })
    .limit(10)

  const items: CurriculumChangeItem[] = (rows ?? []).map(r => ({
    id: r.id,
    action_type: r.action_type,
    description: r.action_label,
    status: (['pending_review', 'approved', 'applied', 'rejected'].includes(r.status)
      ? r.status
      : 'pending_review') as CurriculumChangeItem['status'],
    created_at: r.created_at,
  }))

  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Curriculum Change Queue</p>
      <CurriculumChangeQueue items={items} />
    </div>
  )
}
