// Parent Updates — Sprint 1079 stub. Full content in Sprint 1082.
import { Card, CardContent } from '@/components/ui'
import { Bell } from 'lucide-react'

export default function ParentUpdatesPage() {
  return (
    <div className="space-y-4">
      <div className="pt-2">
        <p className="page-eyebrow">From the Academy</p>
        <h1 className="page-title">Updates</h1>
        <p className="page-subtitle">Coach notes and academy announcements for parents.</p>
      </div>
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-status-blue/10 border border-status-blue/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-status-blue" />
          </div>
          <p className="text-text-primary text-sm font-medium">Updates coming soon</p>
          <p className="text-text-muted text-xs leading-relaxed max-w-xs">
            Coach summaries and academy announcements will appear here when your coaching team shares them.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
