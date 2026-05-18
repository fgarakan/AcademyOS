import Link from 'next/link'
import { ChevronRight, AlertCircle, CheckCircle2, Sparkles, Users, LayoutTemplate, BookOpen, GraduationCap, Activity, MessageSquare, Calendar, Shield, ArrowRight, Eye } from 'lucide-react'
import { TemplateDonnaPanel } from '@/components/templates/TemplateDonnaPanel'

// demo-only — not saved — not applied — local-only
// Nothing changes until the director reviews and approves.

const DEMO_TEMPLATE = {
  name: 'Net Approach & Volley Patterns',
  level: 'Intermediate',
  type: 'Class Template',
}

const IMPACT_CARDS = [
  {
    id: 'sessions',
    label: 'Sessions Affected',
    value: '4',
    sub: 'Future sessions that would use this template',
    icon: Calendar,
    color: 'lime',
  },
  {
    id: 'players',
    label: 'Players Affected',
    value: '12',
    sub: 'Players in groups where this template applies',
    icon: Users,
    color: 'status-blue',
  },
  {
    id: 'coaches',
    label: 'Coaches Briefed',
    value: '2',
    sub: 'Coaches assigned to these groups',
    icon: Activity,
    color: 'status-purple',
  },
  {
    id: 'curriculum',
    label: 'Curriculum Items',
    value: '6',
    sub: 'Goals and gates connected to this template',
    icon: BookOpen,
    color: 'status-green',
  },
]

const FUTURE_SESSIONS = [
  {
    id: 's1',
    date: 'Mon, May 20',
    group: 'Intermediate Group A',
    coach: 'Marco T.',
    players: 6,
    status: 'scheduled',
  },
  {
    id: 's2',
    date: 'Wed, May 22',
    group: 'Intermediate Group B',
    coach: 'Priya K.',
    players: 6,
    status: 'scheduled',
  },
  {
    id: 's3',
    date: 'Fri, May 24',
    group: 'Intermediate Group A',
    coach: 'Marco T.',
    players: 6,
    status: 'tentative',
  },
  {
    id: 's4',
    date: 'Mon, May 27',
    group: 'Intermediate Group B',
    coach: 'Priya K.',
    players: 6,
    status: 'tentative',
  },
]

const CURRICULUM_CONNECTIONS = [
  { goal: 'Net approach pattern', level: 'Level 2', status: 'primary', domain: 'Net Game' },
  { goal: 'First volley contact point', level: 'Level 2', status: 'primary', domain: 'Net Game' },
  { goal: 'Split-step timing', level: 'Level 2', status: 'supporting', domain: 'Footwork' },
  { goal: 'Approach shot decision-making', level: 'Level 2', status: 'supporting', domain: 'Tactics' },
  { goal: 'Overhead smash foundation', level: 'Level 2', status: 'adjacent', domain: 'Net Game' },
  { goal: 'Court positioning at net', level: 'Level 2', status: 'adjacent', domain: 'Tactics' },
]

const PLAYER_REQUIREMENTS = [
  { req: 'Consistent baseline rally (10+ in a row)', status: 'met', affectsCount: 10 },
  { req: 'Open stance forehand established', status: 'met', affectsCount: 12 },
  { req: 'Continental grip for volley', status: 'partial', affectsCount: 4 },
  { req: 'Split-step timing gate passed', status: 'partial', affectsCount: 3 },
]

const ASSESSMENT_OPPORTUNITIES = [
  'First volley contact point (in front of body)',
  'Approach shot decision (right ball + right moment)',
  'Net coverage positioning',
  'Split-step timing against a live ball',
]

const SCOPE_ACTIONS = [
  { label: 'Apply to Intermediate Group A only', risk: 'low' },
  { label: 'Apply to both Intermediate groups', risk: 'medium' },
  { label: 'Apply to all upcoming sessions this level', risk: 'medium' },
  { label: 'Schedule as a 4-week unit', risk: 'medium' },
]

interface PageProps {
  searchParams: Promise<{ name?: string; level?: string; type?: string }>
}

export default async function TemplateImpactPreviewPage({ searchParams }: PageProps) {
  const params = await searchParams
  const templateName = params.name ?? DEMO_TEMPLATE.name
  const templateLevel = params.level ?? DEMO_TEMPLATE.level
  const templateType = params.type ?? DEMO_TEMPLATE.type

  return (
    <div className="flex gap-4 lg:gap-6 p-4 lg:p-6 min-h-screen items-start">

      <div className="flex-1 min-w-0 space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] text-text-muted select-none">
          <Link href="/director" className="hover:text-text-secondary transition-colors duration-100">AcademyOS</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <Link href="/director/templates" className="hover:text-text-secondary transition-colors duration-100">Templates</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <span className="text-text-secondary font-medium">Impact Preview</span>
        </nav>

        {/* Header */}
        <div>
          <p className="page-eyebrow">Templates</p>
          <h1 className="page-title">Impact Preview</h1>
          <p className="page-subtitle">Review what this template affects before deploying it to sessions.</p>
        </div>

        {/* Safety banner */}
        <div
          className="relative overflow-hidden rounded-2xl border border-lime/20 p-5"
          style={{ background: 'linear-gradient(135deg, rgba(200,255,0,0.06) 0%, transparent 60%)' }}
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-lime shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-text-primary">Nothing changes until you review and approve.</p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                This is a read-only impact preview. No sessions are modified, no coaches are briefed, and no curriculum gates are changed by viewing this page. All changes require explicit director approval.
              </p>
            </div>
          </div>
        </div>

        {/* Demo notice */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-status-orange/20 bg-status-orange/5 text-[11px] text-status-orange">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Demo view — sample impact data. Backend wiring coming in a future sprint.</span>
        </div>

        {/* Template being previewed */}
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-surface">
          <LayoutTemplate className="w-4 h-4 text-lime shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Previewing Template</p>
            <p className="text-sm font-semibold text-text-primary">{templateName}</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-lime/20 bg-lime/8 text-lime">
            <GraduationCap className="w-2.5 h-2.5" />
            {templateLevel}
          </span>
        </div>

        {/* Impact cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {IMPACT_CARDS.map(card => {
            const Icon = card.icon
            return (
              <div key={card.id} className="flex flex-col gap-3.5 p-4 rounded-2xl border border-border bg-surface">
                <div className="flex items-center justify-between">
                  <span className="label-xs">{card.label}</span>
                  <div className={`w-7 h-7 rounded-lg bg-${card.color}/10 border border-${card.color}/20 flex items-center justify-center`}>
                    <Icon className={`w-3.5 h-3.5 text-${card.color}`} />
                  </div>
                </div>
                <div>
                  <p className={`text-2xl font-mono font-bold text-${card.color}`}>{card.value}</p>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{card.sub}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Future sessions */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Calendar className="w-4 h-4 text-lime" />
            Future Sessions
          </h2>
          <div className="space-y-2">
            {FUTURE_SESSIONS.map(session => (
              <div key={session.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface-raised">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-text-primary">{session.group}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${session.status === 'scheduled' ? 'text-status-green border-status-green/30 bg-status-green/8' : 'text-text-muted border-border'}`}>
                      {session.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">{session.date} · Coach: {session.coach} · {session.players} players</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coach briefings */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-lime" />
            Coach Briefings
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            When this template is approved and deployed, the following coaches will receive a session brief via DONNA. The brief will include today&apos;s focus, block structure, watch-fors, and player notes.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Marco T. — Intermediate Group A', 'Priya K. — Intermediate Group B'].map(c => (
              <div key={c} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface-raised">
                <div className="w-5 h-5 rounded-full bg-lime/15 border border-lime/20 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-lime">{c[0]}</span>
                </div>
                <span className="text-xs text-text-secondary">{c}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-text-muted">Briefings are sent only after director approval — not from this preview.</p>
        </div>

        {/* Curriculum connections */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-lime" />
            Curriculum Connections
          </h2>
          <div className="space-y-2">
            {CURRICULUM_CONNECTIONS.map(c => (
              <div key={c.goal} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface-raised">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border shrink-0 ${
                  c.status === 'primary' ? 'text-lime border-lime/30 bg-lime/8'
                  : c.status === 'supporting' ? 'text-status-blue border-status-blue/30 bg-status-blue/8'
                  : 'text-text-muted border-border'
                }`}>
                  {c.status}
                </span>
                <span className="text-xs text-text-primary">{c.goal}</span>
                <span className="ml-auto text-[10px] text-text-muted">{c.domain}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Player requirements */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-lime" />
            Player Requirements
          </h2>
          <div className="space-y-2">
            {PLAYER_REQUIREMENTS.map(req => (
              <div key={req.req} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface-raised">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  req.status === 'met' ? 'border-status-green bg-status-green/20' : 'border-status-orange bg-status-orange/10'
                }`}>
                  {req.status === 'met' && <CheckCircle2 className="w-2.5 h-2.5 text-status-green" />}
                  {req.status === 'partial' && <AlertCircle className="w-2.5 h-2.5 text-status-orange" />}
                </div>
                <span className="text-xs text-text-primary flex-1">{req.req}</span>
                {req.status === 'partial' && (
                  <span className="text-[10px] text-status-orange shrink-0">{req.affectsCount} players not ready</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-text-muted">Requirements where some players are not ready will be highlighted in the coach brief. Coaches can adapt in real-time.</p>
        </div>

        {/* Assessment opportunities */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Eye className="w-4 h-4 text-lime" />
            Assessment Opportunities
          </h2>
          <p className="text-xs text-text-secondary">These observable skills can be formally assessed during sessions using this template.</p>
          <div className="flex flex-wrap gap-2">
            {ASSESSMENT_OPPORTUNITIES.map(a => (
              <span key={a} className="inline-flex items-center px-3 py-1.5 rounded-xl border border-lime/15 bg-lime/5 text-[11px] text-lime">
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Parent / player summaries */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Users className="w-4 h-4 text-lime" />
            Parent + Player Summaries
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            After sessions, DONNA can generate parent-facing and player-facing summaries that explain what was practiced. These go through the review queue before being released.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-border bg-surface-raised">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Player Summary Sample</p>
              <p className="text-xs text-text-secondary leading-relaxed italic">
                &ldquo;Today we worked on approaching the net and winning the point with your first volley. You practiced the approach shot and learned when to come in.&rdquo;
              </p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-surface-raised">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Parent Summary Sample</p>
              <p className="text-xs text-text-secondary leading-relaxed italic">
                &ldquo;Your player worked on net approach patterns today — a key Level 2 skill. Coach will note improvement in the next update.&rdquo;
              </p>
            </div>
          </div>
          <p className="text-[10px] text-text-muted">These are generated summaries — not sent without director approval.</p>
        </div>

        {/* Fitness pathway */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-status-purple" />
            Fitness Pathway
          </h2>
          <p className="text-xs text-text-secondary">
            Sessions using this template can be paired with a fitness block. Recommended fitness template: <span className="font-semibold text-text-primary">Court Speed & First Step</span>.
          </p>
          <Link
            href="/director/templates/fitness/ft-001"
            className="inline-flex items-center gap-1.5 text-xs text-status-purple hover:text-status-purple/80 transition-colors duration-100"
          >
            View Fitness Template
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Review queue */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-lime" />
            Review Queue
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            When this template is approved and deployed, wrap-ups from sessions will appear in the Director Review Queue. Coach observations, attendance notes, and DONNA summaries will all be available for review.
          </p>
          <Link href="/director/review" className="inline-flex items-center gap-1.5 text-xs text-lime hover:text-lime/80 transition-colors duration-100">
            Open Review Queue
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Scope actions */}
        <div className="rounded-2xl border border-lime/15 bg-lime/4 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-lime" />
            <h2 className="text-sm font-bold text-text-primary">Scope Actions</h2>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Choose how broadly this template is deployed. All of the following require explicit director confirmation — nothing is applied automatically.
          </p>
          <div className="space-y-2">
            {SCOPE_ACTIONS.map(action => (
              <button
                key={action.label}
                onClick={() => alert('Demo only — no action taken.')}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-lime/20 bg-lime/5 hover:bg-lime/10 transition-all duration-100 text-left group"
              >
                <span className="text-xs text-text-primary group-hover:text-text-primary">{action.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${
                  action.risk === 'low' ? 'text-status-green border-status-green/30' : 'text-status-orange border-status-orange/30'
                }`}>
                  {action.risk} risk
                </span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-text-muted font-semibold">
            Nothing changes until you review and approve. No sessions are modified from this preview.
          </p>
        </div>

      </div>

      <TemplateDonnaPanel mode="impact" />
    </div>
  )
}
