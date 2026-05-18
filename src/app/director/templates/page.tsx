import Link from 'next/link'
import {
  Sparkles, LayoutTemplate, Dumbbell, ClipboardList,
  ChevronRight, BookOpen, Users, Clock, AlertCircle,
  CheckCircle2, Zap, ArrowRight, Plus,
} from 'lucide-react'
import { TemplatesDonnaPanel } from './TemplatesDonnaPanel'

// ── Action cards ─────────────────────────────────────────────────────────────

const ACTIONS = [
  {
    id: 'create-class',
    label: 'Create Class Template',
    description: 'Build from curriculum, drills, and level goals',
    icon: Plus,
    href: '/director/templates/class/create',
    variant: 'primary' as const,
  },
  {
    id: 'create-fitness',
    label: 'Create Fitness Template',
    description: 'Design physical training blocks',
    icon: Dumbbell,
    href: '/director/templates/fitness/create',
    variant: 'default' as const,
  },
  {
    id: 'review',
    label: 'Review Existing Templates',
    description: 'Browse and manage your template library',
    icon: ClipboardList,
    href: '/director/templates/class',
    variant: 'default' as const,
  },
  {
    id: 'donna-suggest',
    label: 'Ask DONNA to Suggest',
    description: 'Let AI identify what templates you need',
    icon: Sparkles,
    href: '/director/templates/donna-suggestions',
    variant: 'donna' as const,
  },
]

// ── Stat cards ───────────────────────────────────────────────────────────────

const STATS = [
  {
    id: 'class',
    label: 'Class Templates',
    value: '12',
    sub: '4 ready · 6 draft · 2 review',
    icon: LayoutTemplate,
    iconClass: 'text-lime',
    bgClass: 'bg-lime/10',
    borderClass: 'border-lime/20',
  },
  {
    id: 'fitness',
    label: 'Fitness Templates',
    value: '8',
    sub: '5 ready · 2 draft · 1 review',
    icon: Dumbbell,
    iconClass: 'text-status-purple',
    bgClass: 'bg-status-purple/10',
    borderClass: 'border-status-purple/20',
  },
  {
    id: 'review',
    label: 'Needs Review',
    value: '3',
    sub: 'Awaiting director approval',
    icon: AlertCircle,
    iconClass: 'text-status-orange',
    bgClass: 'bg-status-orange/10',
    borderClass: 'border-status-orange/20',
  },
  {
    id: 'recent',
    label: 'Recently Updated',
    value: '5',
    sub: 'In the last 7 days',
    icon: Clock,
    iconClass: 'text-status-blue',
    bgClass: 'bg-status-blue/10',
    borderClass: 'border-status-blue/20',
  },
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  return (
    <div className="flex gap-4 lg:gap-6 p-4 lg:p-6 min-h-screen items-start">

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] text-text-muted select-none">
          <Link href="/director" className="hover:text-text-secondary transition-colors duration-100">
            AcademyOS
          </Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <span className="text-text-secondary font-medium">Templates</span>
        </nav>

        {/* Page header */}
        <div>
          <p className="page-eyebrow">Templates</p>
          <h1 className="page-title">Templates</h1>
          <p className="page-subtitle">
            Build reusable class and fitness templates powered by your curriculum.
          </p>
        </div>

        {/* ── DONNA hero card ──────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl border border-lime/20 p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(17,217,223,0.07) 0%, rgba(17,217,223,0.02) 55%, transparent 100%)',
          }}
        >
          {/* Ambient glow */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-lime/6 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/3 w-32 h-24 rounded-full bg-lime/4 blur-2xl pointer-events-none" />

          {/* Header row */}
          <div className="relative flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-lime/15 border border-lime/25 flex items-center justify-center shadow-[0_0_12px_rgba(17,217,223,0.15)]">
              <Sparkles className="w-4.5 h-4.5 text-lime" />
            </div>
            <span className="font-bold text-text-primary">DONNA</span>
            <span className="ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-lime/10 text-lime border border-lime/20">
              AI Assistant
            </span>
          </div>

          {/* Hero message */}
          <p className="relative text-text-primary text-[15px] font-medium leading-relaxed max-w-2xl">
            Your templates turn curriculum into repeatable coaching systems.{' '}
            <span className="text-lime">What would you like to build today?</span>
          </p>
        </div>

        {/* ── Primary action cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {ACTIONS.map((action) => {
            const Icon = action.icon
            const isDonna = action.variant === 'donna'
            const isPrimary = action.variant === 'primary'

            return (
              <Link
                key={action.id}
                href={action.href}
                className={[
                  'group relative flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-150',
                  isPrimary
                    ? 'bg-lime/5 border-lime/20 hover:bg-lime/10 hover:border-lime/30 hover:shadow-cyan'
                    : isDonna
                      ? 'bg-lime/4 border-lime/15 hover:bg-lime/8 hover:border-lime/25 hover:shadow-cyan'
                      : 'bg-surface border-border hover:border-lime/20 hover:bg-surface-raised hover:shadow-cyan',
                ].join(' ')}
              >
                {/* Icon */}
                <div className={[
                  'w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-150',
                  isPrimary || isDonna
                    ? 'bg-lime/10 border-lime/20 group-hover:bg-lime/15'
                    : 'bg-surface-overlay border-border group-hover:bg-surface-raised',
                ].join(' ')}>
                  <Icon className={[
                    'w-4 h-4 transition-colors duration-150',
                    isPrimary || isDonna ? 'text-lime' : 'text-text-secondary group-hover:text-lime',
                  ].join(' ')} />
                </div>

                {/* Text */}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary mb-0.5 leading-snug">
                    {action.label}
                  </p>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    {action.description}
                  </p>
                </div>

                {/* Arrow on hover */}
                <ChevronRight className="absolute right-3 bottom-4 w-4 h-4 text-lime/0 group-hover:text-lime/40 transition-all duration-150" />
              </Link>
            )
          })}
        </div>

        {/* ── Stat cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {STATS.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.id}
                className="flex flex-col gap-3.5 p-4 rounded-2xl border bg-surface"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="label-xs">{stat.label}</span>
                  <div className={`w-7 h-7 rounded-lg ${stat.bgClass} border ${stat.borderClass} flex items-center justify-center`}>
                    <Icon className={`w-3.5 h-3.5 ${stat.iconClass}`} />
                  </div>
                </div>
                <div>
                  <p className="metric-number">{stat.value}</p>
                  <p className="text-[11px] text-text-muted mt-1.5 leading-relaxed">{stat.sub}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Category cards ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Class Templates */}
          <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 flex flex-col gap-5 hover:border-lime/20 transition-all duration-200">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-lime/4 blur-3xl pointer-events-none group-hover:bg-lime/7 transition-all duration-300" />

            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(17,217,223,0.08)]">
                <LayoutTemplate className="w-5.5 h-5.5 text-lime" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-text-primary mb-1.5">Class Templates</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Build tennis session structures from your curriculum, drills, skills, and level goals.
                </p>
              </div>
            </div>

            <div className="relative flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <BookOpen className="w-3.5 h-3.5 text-lime/60" />
                <span>Curriculum powered</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <Users className="w-3.5 h-3.5 text-lime/60" />
                <span>Level-specific</span>
              </div>
            </div>

            <Link
              href="/director/templates/class"
              className="relative btn-lime inline-flex items-center gap-2 w-fit"
            >
              Open Class Templates
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Fitness Templates */}
          <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 flex flex-col gap-5 hover:border-status-purple/20 transition-all duration-200">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-status-purple/4 blur-3xl pointer-events-none group-hover:bg-status-purple/8 transition-all duration-300" />

            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-status-purple/10 border border-status-purple/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(181,108,255,0.08)]">
                <Dumbbell className="w-5.5 h-5.5 text-status-purple" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-text-primary mb-1.5">Fitness Templates</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Build physical training blocks that support mobility, speed, strength, coordination, and tennis transfer.
                </p>
              </div>
            </div>

            <div className="relative flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <Zap className="w-3.5 h-3.5 text-status-purple/60" />
                <span>Performance focused</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-purple/60" />
                <span>Tennis transfer</span>
              </div>
            </div>

            <Link
              href="/director/templates/fitness"
              className="relative inline-flex items-center gap-2 w-fit px-4 py-2 rounded-xl text-sm font-semibold text-status-purple border border-status-purple/30 bg-status-purple/10 hover:bg-status-purple/15 active:scale-95 transition-all duration-100 shadow-[0_0_16px_rgba(181,108,255,0.10)]"
            >
              Open Fitness Templates
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>

      {/* ── DONNA assistant panel ─────────────────────────────────────────── */}
      <TemplatesDonnaPanel />

    </div>
  )
}
