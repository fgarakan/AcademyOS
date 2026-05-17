import Link from 'next/link'
import { ArrowLeft, LayoutTemplate } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState } from '@/components/ui'
import { SessionFromTemplateForm } from './SessionFromTemplateForm'

export default async function NewSessionPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-text-secondary text-sm">Not authenticated.</p>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  const academyId = profile?.academy_id ?? null

  if (!academyId) {
    return (
      <div className="p-6">
        <p className="text-text-secondary text-sm">Academy context unavailable.</p>
      </div>
    )
  }

  const rawDb = supabase as any

  // Fetch fitness templates for this academy (category = 'fitness' or all templates)
  const { data: templateRows } = await rawDb
    .from('templates')
    .select('id, name, category, curriculum_level_id')
    .eq('academy_id', academyId)
    .order('name', { ascending: true })

  const templates: Array<{ id: string; name: string; category: string | null }> = (templateRows ?? []).map(
    (t: any) => ({ id: t.id, name: t.name, category: t.category ?? null })
  )

  // Fetch coaches in this academy
  const { data: memberRows } = await rawDb
    .from('academy_memberships')
    .select('profile_id, profiles(id, display_name)')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .in('role', ['coach', 'head_coach', 'academy_director'])

  const coaches: Array<{ id: string; display_name: string }> = ((memberRows ?? []) as Array<{
    profile_id: string
    profiles: { id: string; display_name: string } | null
  }>)
    .filter(m => m.profiles)
    .map(m => ({ id: m.profiles!.id, display_name: m.profiles!.display_name }))

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <Link
          href="/director/sessions"
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sessions
        </Link>
        <p className="page-eyebrow">Director</p>
        <h1 className="page-title">Create Session</h1>
        <p className="page-subtitle">Generate a new session from a fitness or class template.</p>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <EmptyState
              icon={<LayoutTemplate className="w-5 h-5" />}
              title="No templates found"
              description="Create a fitness template first, then return here to generate a session."
              action={
                <Link href="/director/fitness/templates" className="btn-lime text-xs px-4 py-2">
                  Go to Fitness Templates
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <SessionFromTemplateForm
          templates={templates}
          coaches={coaches}
          fallbackCoachId={user.id}
        />
      )}
    </div>
  )
}
