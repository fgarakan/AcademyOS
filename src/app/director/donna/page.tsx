import Link from 'next/link'
import { Sparkles, ChevronRight, ClipboardList, AlertCircle, Users, Calendar, BookOpen, Activity, ShieldCheck } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { loadCommandBriefLive } from '@/lib/donna/commandBriefLiveLoader'
import { Card, CardHeader, CardContent } from '@/components/ui'

// ── Director DONNA command center ─────────────────────────────────────────────
// Sprint 1004 — Director DONNA Command Center V1
// Entry point for Director DONNA across all academy dimensions.
// Uses live data where available; falls back to demo with clear labels.
// No DB writes. No approvals on this page. Links to existing review surfaces.

interface QuickLink {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string | number
  badgeColor?: string
}

export default async function DirectorDonnaPage() {
  const db = await getSupabaseServer()
  const { data: { user } } = await db.auth.getUser()

  let academyId: string | null = null
  let pendingCount = 0
  let todaySessionCount = 0
  let dataStatus: 'live' | 'demo' = 'demo'

  if (user) {
    const { data: profile } = await db.from('profiles').select('academy_id').eq('id', user.id).single()
    if (profile?.academy_id) {
      academyId = profile.academy_id
      const today = new Date().toISOString().slice(0, 10)

      const [pendingRes, sessionsRes] = await Promise.all([
        db.from('proposed_actions').select('id', { count: 'exact', head: true })
          .eq('academy_id', academyId).eq('status', 'pending_review'),
        db.from('sessions').select('id', { count: 'exact', head: true })
          .eq('academy_id', academyId).eq('scheduled_date', today),
      ])

      pendingCount = pendingRes.count ?? 0
      todaySessionCount = sessionsRes.count ?? 0
      dataStatus = 'live'
    }
  }

  const quickLinks: QuickLink[] = [
    {
      label: 'Review Queue',
      href: '/director/review',
      icon: <ClipboardList className="w-4 h-4" />,
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: 'bg-status-red/15 text-status-red',
    },
    {
      label: 'Today\'s Sessions',
      href: '/director/today',
      icon: <Calendar className="w-4 h-4" />,
      badge: todaySessionCount > 0 ? todaySessionCount : undefined,
      badgeColor: 'bg-lime/15 text-lime',
    },
    {
      label: 'Players',
      href: '/director/players',
      icon: <Users className="w-4 h-4" />,
    },
    {
      label: 'Curriculum',
      href: '/director/curriculum',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      label: 'Academy Intelligence',
      href: '/director/donna-coo-demo',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      label: 'Templates',
      href: '/director/templates',
      icon: <Sparkles className="w-4 h-4" />,
    },
  ]

  const DONNA_QUESTIONS = [
    'What needs my attention today?',
    'Which coaches are missing wrap-ups?',
    'Which players need review?',
    'Which curriculum levels have gaps?',
    'What templates need approval?',
    'Which players are close to level movement?',
    'What changed since yesterday?',
    'What are the top academy risks?',
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] text-text-muted select-none">
        <Link href="/director" className="hover:text-text-secondary transition-colors duration-100">AcademyOS</Link>
        <ChevronRight className="w-3 h-3 text-text-muted/40" />
        <span className="text-text-secondary font-medium">DONNA</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-lime/15 border border-lime/25 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-lime" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">DONNA</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-status-green/10 text-status-green border border-status-green/20">
              <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
              Director Mode
            </span>
          </div>
          <p className="text-sm text-text-secondary">Academy COO assistant — command center, review queue, and intelligence layer.</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] ${
          dataStatus === 'live'
            ? 'border-status-green/20 bg-status-green/5 text-status-green'
            : 'border-status-orange/20 bg-status-orange/5 text-status-orange'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dataStatus === 'live' ? 'bg-status-green' : 'bg-status-orange'}`} />
          {dataStatus === 'live' ? 'Live data' : 'Demo fallback'}
        </div>
      </div>

      {/* DONNA prompt */}
      <Card>
        <CardContent>
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-lg bg-lime/15 border border-lime/20 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-lime" />
            </div>
            <div>
              <p className="text-sm text-text-primary font-medium leading-relaxed">
                Good to see you. Here is your academy at a glance — pending reviews, today&apos;s sessions, and where I need your input.
              </p>
              {pendingCount > 0 && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-status-orange/20 bg-status-orange/5">
                  <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0" />
                  <span className="text-xs text-status-orange font-semibold">{pendingCount} item{pendingCount !== 1 ? 's' : ''} pending review</span>
                  <Link href="/director/review" className="ml-auto text-[10px] text-lime hover:text-lime/80 transition-colors">Review now</Link>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center justify-between gap-2 p-3.5 rounded-2xl border border-border bg-surface hover:border-lime/25 hover:bg-lime/4 transition-all duration-100"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-text-muted group-hover:text-lime transition-colors duration-100">{link.icon}</span>
              <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors duration-100">{link.label}</span>
            </div>
            {link.badge !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${link.badgeColor}`}>{link.badge}</span>
            )}
          </Link>
        ))}
      </div>

      {/* Ask DONNA — question suggestions */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-lime" />
            What can I help you understand today?
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DONNA_QUESTIONS.map((q) => (
              <Link
                key={q}
                href="/director/donna-coo-demo"
                className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border hover:border-lime/20 hover:bg-lime/5 transition-all duration-100"
              >
                <ChevronRight className="w-3.5 h-3.5 text-lime/30 group-hover:text-lime transition-colors duration-100 shrink-0" />
                <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors duration-100 leading-snug">{q}</span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-text-muted">Full COO Intelligence panel available at Academy Intelligence.</p>
        </CardContent>
      </Card>

      {/* Safety notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-lime/15 bg-lime/4">
        <ShieldCheck className="w-4 h-4 text-lime shrink-0 mt-0.5" />
        <p className="text-[11px] text-text-secondary leading-relaxed">
          DONNA proposes — you approve. No session note, player observation, attendance record, parent communication, or curriculum change takes effect until you review and approve it in the Review Queue.
        </p>
      </div>

    </div>
  )
}
