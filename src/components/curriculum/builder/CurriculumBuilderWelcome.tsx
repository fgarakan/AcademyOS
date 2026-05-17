import Link from 'next/link'
import { Sparkles, Map, List, GitBranch, Settings } from 'lucide-react'

interface Props {
  hasActiveVersion: boolean
  directorName?: string
}

const CHIPS_WITH_VERSION = [
  {
    label: 'View curriculum map',
    href: '/director/curriculum/map',
    icon: <Map className="w-3.5 h-3.5" />,
    desc: 'See all 15 levels in one view.',
  },
  {
    label: 'Guided level review',
    href: '/director/curriculum/guided',
    icon: <List className="w-3.5 h-3.5" />,
    desc: 'Step through each level with DONNA.',
  },
  {
    label: 'Review change queue',
    href: '/director/review',
    icon: <GitBranch className="w-3.5 h-3.5" />,
    desc: 'See pending curriculum changes.',
  },
  {
    label: 'Advanced tools',
    href: '#curriculum-explorer',
    icon: <Settings className="w-3.5 h-3.5" />,
    desc: 'Explorer, version, voice override.',
    scroll: true,
  },
]

const CHIPS_NO_VERSION = [
  {
    label: 'Start curriculum setup',
    href: '/director/onboarding/curriculum',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    desc: 'Activate the Academy OS starter spine.',
  },
  {
    label: 'Explore the global curriculum',
    href: '#curriculum-explorer',
    icon: <Map className="w-3.5 h-3.5" />,
    desc: 'Browse levels, drills, and gates.',
    scroll: true,
  },
]

export function CurriculumBuilderWelcome({ hasActiveVersion, directorName }: Props) {
  const greeting = directorName ? `Hi ${directorName.split(' ')[0]}` : 'Hello'
  const chips = hasActiveVersion ? CHIPS_WITH_VERSION : CHIPS_NO_VERSION

  const message = hasActiveVersion
    ? "Your curriculum spine is active. Here's what you can do today."
    : "Your curriculum spine isn't active yet. Let's get it set up."

  return (
    <div className="rounded-2xl border border-lime/20 bg-lime/[0.03] p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-lime/15 border border-lime/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-lime" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-lime font-semibold mb-1">DONNA</p>
          <p className="text-sm text-text-primary font-medium">{greeting} — {message}</p>
          <p className="text-[12px] text-text-secondary mt-1">
            What would you like to work on today?
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {chips.map(chip => (
          <ChipLink key={chip.label} {...chip} />
        ))}
      </div>
    </div>
  )
}

function ChipLink({
  label,
  href,
  icon,
  desc,
}: {
  label: string
  href: string
  icon: React.ReactNode
  desc: string
  scroll?: boolean
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border border-border bg-surface hover:border-lime/30 hover:bg-lime/[0.03] transition-colors group"
    >
      <div className="mt-0.5 text-text-muted group-hover:text-lime transition-colors shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-text-primary group-hover:text-lime transition-colors">
          {label}
        </p>
        <p className="text-[11px] text-text-muted mt-0.5">{desc}</p>
      </div>
    </Link>
  )
}
