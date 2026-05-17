import Link from 'next/link'
import {
  Calendar, AlertTriangle, ClipboardList, TrendingUp,
  MessageSquare, Activity, BookOpen, BarChart2,
} from 'lucide-react'

interface KpiCard {
  label: string
  value: string | number
  sublabel: string
  href: string
  icon: React.ReactNode
  accent: 'lime' | 'teal' | 'orange' | 'red' | 'yellow' | 'green' | 'muted'
}

interface AcademyKpiCardsSectionProps {
  sessionsToday: number
  attendanceExceptions: number
  coachRecaps: number
  levelUpCandidates: number
  parentUpdates: number
  academyHealthPct: number
  curriculumExecution: number
  playerProgress: number
  activePlayers: number
}

const ACCENT_STYLES: Record<KpiCard['accent'], { num: string; bg: string; border: string; hover: string }> = {
  lime:   { num: 'text-lime',          bg: 'bg-lime/5',          border: 'border-lime/20',          hover: 'hover:border-lime/40' },
  teal:   { num: 'text-teal-400',      bg: 'bg-teal-400/5',      border: 'border-teal-400/20',      hover: 'hover:border-teal-400/40' },
  orange: { num: 'text-status-orange', bg: 'bg-status-orange/5', border: 'border-status-orange/20', hover: 'hover:border-status-orange/40' },
  red:    { num: 'text-status-red',    bg: 'bg-status-red/5',    border: 'border-status-red/20',    hover: 'hover:border-status-red/40' },
  yellow: { num: 'text-yellow-400',    bg: 'bg-yellow-500/5',    border: 'border-yellow-500/20',    hover: 'hover:border-yellow-500/40' },
  green:  { num: 'text-status-green',  bg: 'bg-status-green/5',  border: 'border-status-green/20',  hover: 'hover:border-status-green/40' },
  muted:  { num: 'text-text-secondary',bg: 'bg-surface-raised',  border: 'border-border',           hover: 'hover:border-lime/20' },
}

function KpiMetricCard({ label, value, sublabel, href, icon, accent }: KpiCard) {
  const s = ACCENT_STYLES[accent]
  return (
    <Link href={href} className="block group">
      <div className={`${s.bg} border ${s.border} ${s.hover} rounded-2xl p-4 h-full flex flex-col gap-2 transition-all duration-150 hover:shadow-sm`}>
        <div className="flex items-center justify-between">
          <span className={`${s.num} opacity-70`}>{icon}</span>
        </div>
        <p className={`font-mono font-bold text-3xl leading-none ${s.num} ${String(value).length > 4 ? 'text-2xl' : ''}`}>
          {value}
        </p>
        <div>
          <p className="text-xs font-semibold text-text-primary">{label}</p>
          <p className="text-[11px] text-text-secondary mt-0.5">{sublabel}</p>
        </div>
      </div>
    </Link>
  )
}

export function AcademyKpiCardsSection({
  sessionsToday,
  attendanceExceptions,
  coachRecaps,
  levelUpCandidates,
  parentUpdates,
  academyHealthPct,
  curriculumExecution,
  playerProgress,
  activePlayers,
}: AcademyKpiCardsSectionProps) {
  const cards: KpiCard[] = [
    {
      label: "Today's Sessions",
      value: sessionsToday,
      sublabel: sessionsToday === 1 ? '1 session scheduled' : `${sessionsToday} sessions scheduled`,
      href: '/director/sessions',
      icon: <Calendar className="w-4 h-4" />,
      accent: sessionsToday > 0 ? 'lime' : 'muted',
    },
    {
      label: 'Attendance Exceptions',
      value: attendanceExceptions,
      sublabel: attendanceExceptions > 0 ? 'Needs review' : 'All clear',
      href: '/director/review?tab=needs-approval',
      icon: <AlertTriangle className="w-4 h-4" />,
      accent: attendanceExceptions > 0 ? 'yellow' : 'muted',
    },
    {
      label: 'Coach Recaps',
      value: coachRecaps,
      sublabel: coachRecaps > 0 ? 'Awaiting review' : 'None pending',
      href: '/director/review?tab=needs-approval',
      icon: <ClipboardList className="w-4 h-4" />,
      accent: coachRecaps > 0 ? 'orange' : 'muted',
    },
    {
      label: 'Level-Up Candidates',
      value: levelUpCandidates,
      sublabel: levelUpCandidates > 0 ? 'Eligible to advance' : 'None ready yet',
      href: '/director/players',
      icon: <TrendingUp className="w-4 h-4" />,
      accent: levelUpCandidates > 0 ? 'green' : 'muted',
    },
    {
      label: 'Parent Updates',
      value: parentUpdates,
      sublabel: parentUpdates > 0 ? 'Requests pending' : 'No new requests',
      href: '/director/review?tab=needs-approval',
      icon: <MessageSquare className="w-4 h-4" />,
      accent: parentUpdates > 0 ? 'orange' : 'muted',
    },
    {
      label: 'Academy Health',
      value: `${academyHealthPct}%`,
      sublabel: academyHealthPct >= 80 ? 'On track' : academyHealthPct >= 60 ? 'Needs attention' : 'At risk',
      href: '/director/signals',
      icon: <Activity className="w-4 h-4" />,
      accent: academyHealthPct >= 80 ? 'teal' : academyHealthPct >= 60 ? 'yellow' : 'red',
    },
    {
      label: 'Curriculum Execution',
      value: `${curriculumExecution}%`,
      sublabel: activePlayers > 0 ? `${Math.round(activePlayers * curriculumExecution / 100)} of ${activePlayers} with level` : 'No active players',
      href: '/director/curriculum',
      icon: <BookOpen className="w-4 h-4" />,
      accent: curriculumExecution >= 80 ? 'lime' : curriculumExecution >= 50 ? 'yellow' : 'orange',
    },
    {
      label: 'Player Progress',
      value: playerProgress,
      sublabel: `${playerProgress > 0 ? `${playerProgress} improving` : 'No assessment data yet'}`,
      href: '/director/players',
      icon: <BarChart2 className="w-4 h-4" />,
      accent: playerProgress > 0 ? 'green' : 'muted',
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="label-xs">Academy Overview</p>
          <p className="text-[11px] text-text-muted mt-0.5">Live counts across your academy. Updates as sessions run and coaches submit recaps.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map(card => (
          <KpiMetricCard key={card.label} {...card} />
        ))}
      </div>
    </div>
  )
}
