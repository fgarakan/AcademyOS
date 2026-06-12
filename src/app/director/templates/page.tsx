import Link from 'next/link'
import { LayoutTemplate, Dumbbell, Plus, Zap, ChevronRight } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'

// ---------------------------------------------------------------------------
// Templates Hub — canonical route: /director/templates
// Sprint 2171–2200: replaces Tree A hub. Links to Tree B builders.
// Class Templates → /director/class-templates
// Fitness Templates → /director/fitness/templates
// ---------------------------------------------------------------------------

export default async function TemplatesHubPage() {
  const supabase = await getSupabaseServer()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawDb = supabase as any

  let classCount = 0
  let fitnessCount = 0
  let countsAvailable = false

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('academy_id')
        .eq('id', user.id)
        .single()

      if (profile?.academy_id) {
        const { data: rows, error } = await rawDb
          .from('templates')
          .select('id, category')
          .eq('academy_id', profile.academy_id)

        if (!error) {
          countsAvailable = true
          for (const t of (rows ?? []) as Array<{ id: string; category: string | null }>) {
            const cat = (t.category ?? '').toLowerCase()
            if (cat === 'fitness' || cat.includes('fitness')) {
              fitnessCount++
            } else {
              classCount++
            }
          }
        }
      }
    }
  } catch {
    // counts remain 0 — page still renders
  }

  return (
    <div className="p-6 animate-fade-in space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <p className="page-eyebrow">Academy Operations</p>
        <h1 className="page-title">Templates</h1>
        <p className="page-subtitle">
          Build and manage your class and fitness templates. Templates define how sessions run.
        </p>
      </div>

      {/* Counts */}
      {countsAvailable && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="label-xs mb-1">Class Templates</p>
              <p className="font-mono text-2xl text-lime font-semibold">{classCount}</p>
              <p className="text-xs text-text-muted mt-1">in your library</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="label-xs mb-1">Fitness Templates</p>
              <p className="font-mono text-2xl text-lime font-semibold">{fitnessCount}</p>
              <p className="text-xs text-text-muted mt-1">in your library</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/director/class-templates"
          className="group flex items-start gap-4 p-5 rounded-xl bg-surface border border-border hover:border-lime/30 hover:bg-surface-raised transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0 group-hover:bg-lime/15 transition-colors">
            <LayoutTemplate className="w-5 h-5 text-lime" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary group-hover:text-lime transition-colors">
              Class Templates
            </p>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
              Structure, drills, and curriculum blocks for coaching sessions.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors shrink-0 mt-0.5" />
        </Link>

        <Link
          href="/director/fitness/templates"
          className="group flex items-start gap-4 p-5 rounded-xl bg-surface border border-border hover:border-lime/30 hover:bg-surface-raised transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-surface-raised border border-border flex items-center justify-center shrink-0 group-hover:bg-lime/10 group-hover:border-lime/20 transition-colors">
            <Dumbbell className="w-5 h-5 text-text-muted group-hover:text-lime transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary group-hover:text-lime transition-colors">
              Fitness Templates
            </p>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
              Physical training blocks. Reusable across class templates.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors shrink-0 mt-0.5" />
        </Link>

        <Link
          href="/director/class-templates/new"
          className="group flex items-start gap-4 p-5 rounded-xl bg-surface border border-border hover:border-lime/30 hover:bg-surface-raised transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-surface-raised border border-border flex items-center justify-center shrink-0 group-hover:bg-lime/10 group-hover:border-lime/20 transition-colors">
            <Plus className="w-5 h-5 text-text-muted group-hover:text-lime transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary group-hover:text-lime transition-colors">
              Create Template
            </p>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
              Build a new class template from scratch or from curriculum.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors shrink-0 mt-0.5" />
        </Link>

        <Link
          href="/director/sessions/new"
          className="group flex items-start gap-4 p-5 rounded-xl bg-surface border border-border hover:border-lime/30 hover:bg-surface-raised transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-surface-raised border border-border flex items-center justify-center shrink-0 group-hover:bg-lime/10 group-hover:border-lime/20 transition-colors">
            <Zap className="w-5 h-5 text-text-muted group-hover:text-lime transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary group-hover:text-lime transition-colors">
              Generate Session
            </p>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
              Create a new session from a template.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors shrink-0 mt-0.5" />
        </Link>
      </div>
    </div>
  )
}
