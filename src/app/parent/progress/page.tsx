// Parent Progress — Sprint 1079 stub. Full content in Sprint 1080.
import { Card, CardContent } from '@/components/ui'
import { TrendingUp } from 'lucide-react'

export default function ParentProgressPage() {
  return (
    <div className="space-y-4">
      <div className="pt-2">
        <p className="page-eyebrow">Development</p>
        <h1 className="page-title">Progress Overview</h1>
        <p className="page-subtitle">A summary of your child's development journey.</p>
      </div>
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-lime" />
          </div>
          <p className="text-text-primary text-sm font-medium">Development view coming soon</p>
          <p className="text-text-muted text-xs leading-relaxed max-w-xs">
            Your child's level, focus areas, and advancement progress will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
