import { Zap, TrendingUp, Trophy, MessageCircle } from 'lucide-react'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'

const COMING_SOON = ['Progress tracking', 'Skill badges', 'Competition log']

export default function PlayerHome() {
  return (
    <div className="space-y-4">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="pt-2">
        <p className="page-eyebrow">Your Journey</p>
        <h1 className="page-title">Player Home</h1>
        <p className="page-subtitle">Show up. Level up. Every day.</p>
      </div>

      {/* ── Today's Mission ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-lime" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Today's Mission</p>
              <p className="text-text-muted text-xs">What your coach has set for you today</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Zap className="w-5 h-5" />}
            title="No mission set for today"
            description="Check back after your next session with your coach."
            className="py-10"
          />
        </CardContent>
      </Card>

      {/* ── My Skills ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">My Skills</p>
              <p className="text-text-muted text-xs">Your skill path</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<TrendingUp className="w-5 h-5" />}
            title="Your skill path will appear here"
            description="As you progress through the academy, your skills will be tracked here."
            className="py-8"
          />
        </CardContent>
      </Card>

      {/* ── Wins & Streaks ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Wins & Streaks</p>
              <p className="text-text-muted text-xs">Your achievements</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Trophy className="w-5 h-5" />}
            title="Your wins will show up here"
            description="Keep showing up — your achievements are being tracked."
            className="py-8"
          />
        </CardContent>
      </Card>

      {/* ── Messages ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Messages</p>
              <p className="text-text-muted text-xs">From your coach and academy</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<MessageCircle className="w-5 h-5" />}
            title="No messages yet"
            description="Your coach will reach out here."
            className="py-8"
          />
        </CardContent>
      </Card>

      {/* ── Coming Soon ───────────────────────────────────────── */}
      <div className="pt-1 pb-2">
        <p className="label-xs mb-3">COMING SOON</p>
        <div className="flex flex-wrap gap-2">
          {COMING_SOON.map(item => (
            <span
              key={item}
              className="px-3 py-1 rounded-full text-xs text-text-muted border border-border bg-surface-raised"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

    </div>
  )
}
