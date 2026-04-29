import { Calendar, Users, FileText, Plus, Mic, Layers } from 'lucide-react'
import { type LucideIcon } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  EmptyState,
  SectionHeader,
} from '@/components/ui'

type QuickAction = { label: string; Icon: LucideIcon }

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Add Observation', Icon: Plus },
  { label: 'Voice Note',      Icon: Mic },
  { label: 'View Sessions',   Icon: Calendar },
  { label: 'View Players',    Icon: Users },
]

const ROADMAP_ITEMS = [
  'Sessions',
  'Attendance',
  'Group Plans',
  'Voice Notes',
  'Player Follow-Ups',
]

export default function CoachHome() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  })

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <p className="label-xs mb-1">YOUR WORKSPACE</p>
        <h1 className="text-2xl font-bold text-text-primary">Coach Hub</h1>
        <p className="text-text-muted text-sm mt-1">{today}</p>
      </div>

      {/* ── Today ────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="TODAY" />
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-lime" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">Today's Sessions</p>
                <p className="text-text-muted text-xs">Your session plan for today</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Calendar className="w-5 h-5" />}
              title="No sessions scheduled yet"
              description="Your session plan will appear here once sessions are set up in the platform."
              className="py-10"
            />
          </CardContent>
          <CardFooter>
            <p className="text-text-muted text-xs">
              Coming soon: Session plan · Attendance · Group check-in
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* ── Players + Notes ───────────────────────────────────── */}
      <div>
        <SectionHeader title="PLAYERS & NOTES" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* My Players */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-text-muted" />
                  </div>
                  <p className="font-semibold text-text-primary text-sm truncate">My Players</p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-lime/10 text-lime border border-lime/30 shrink-0">
                  Soon
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<Users className="w-5 h-5" />}
                title="No players assigned yet"
                description="Your assigned players will appear here."
                className="py-8"
              />
            </CardContent>
          </Card>

          {/* Recent Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-text-muted" />
                  </div>
                  <p className="font-semibold text-text-primary text-sm truncate">Recent Notes</p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-lime/10 text-lime border border-lime/30 shrink-0">
                  Soon
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<FileText className="w-5 h-5" />}
                title="No notes yet"
                description="Recent player notes will appear here."
                className="py-8"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <div>
        <SectionHeader title="QUICK ACTIONS" />
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(({ label, Icon }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface border border-border opacity-50 cursor-not-allowed select-none"
            >
              <div className="w-9 h-9 rounded-xl bg-surface-raised border border-border flex items-center justify-center">
                <Icon className="w-4 h-4 text-text-muted" />
              </div>
              <span className="text-xs font-medium text-text-secondary text-center leading-tight">
                {label}
              </span>
              <span className="text-[10px] text-text-muted">Coming soon</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Roadmap ───────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-3.5 h-3.5 text-text-muted" />
            <p className="label-xs">ON THE ROADMAP</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ROADMAP_ITEMS.map(item => (
              <span
                key={item}
                className="px-3 py-1 rounded-full text-xs text-text-muted border border-border bg-surface-raised"
              >
                {item}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
