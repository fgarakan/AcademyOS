import { TrendingUp, MessageSquare, Calendar, Heart, Bell } from 'lucide-react'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'

export default function ParentHome() {
  return (
    <div className="space-y-4">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="pt-2">
        <p className="label-xs mb-1">FAMILY PORTAL</p>
        <h1 className="text-2xl font-bold text-text-primary">Parent Home</h1>
        <p className="text-text-secondary text-sm mt-1">
          Stay connected to your child's tennis development.
        </p>
      </div>

      {/* ── Child's Progress ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-lime" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Child's Progress</p>
              <p className="text-text-muted text-xs">How your child is advancing</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<TrendingUp className="w-5 h-5" />}
            title="Progress updates will appear here"
            description="As your child advances through the program, their progress will be shared here."
            className="py-10"
          />
        </CardContent>
      </Card>

      {/* ── Latest Coach Update ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Latest Coach Update</p>
              <p className="text-text-muted text-xs">Parent-ready summaries from your coaching team</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<MessageSquare className="w-5 h-5" />}
            title="No updates yet"
            description="Your coach's latest update will appear here."
            className="py-8"
          />
        </CardContent>
      </Card>

      {/* ── Session Consistency ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Session Consistency</p>
              <p className="text-text-muted text-xs">Attendance and participation</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Calendar className="w-5 h-5" />}
            title="Attendance will appear here"
            description="Session consistency and attendance data will be shared here."
            className="py-8"
          />
        </CardContent>
      </Card>

      {/* ── Support at Home ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Support at Home</p>
              <p className="text-text-muted text-xs">How to help your player off the court</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary text-sm leading-relaxed">
            Tips and guidance from your coaching team will appear here to help you support your
            player's development away from the court.
          </p>
        </CardContent>
      </Card>

      {/* ── Messages & Updates ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Messages & Updates</p>
              <p className="text-text-muted text-xs">Communications from your academy</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Bell className="w-5 h-5" />}
            title="No messages yet"
            description="Messages and announcements from your academy will appear here."
            className="py-8"
          />
        </CardContent>
      </Card>

    </div>
  )
}
