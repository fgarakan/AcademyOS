// Parent Wins — Sprint 1079 stub. Full content in Sprint 1081.
import { Card, CardContent } from '@/components/ui'
import { Star } from 'lucide-react'

export default function ParentWinsPage() {
  return (
    <div className="space-y-4">
      <div className="pt-2">
        <p className="page-eyebrow">Highlights</p>
        <h1 className="page-title">Wins & Highlights</h1>
        <p className="page-subtitle">Positive moments from your child's tennis journey.</p>
      </div>
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-status-orange/10 border border-status-orange/20 flex items-center justify-center">
            <Star className="w-5 h-5 text-status-orange" />
          </div>
          <p className="text-text-primary text-sm font-medium">Highlights coming soon</p>
          <p className="text-text-muted text-xs leading-relaxed max-w-xs">
            Positive highlights and session wins will appear here as your child attends sessions.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
