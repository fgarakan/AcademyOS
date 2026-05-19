// Parent Ask DONNA — Sprint 1079 stub. Full content in Sprint 1083.
import { Card, CardContent } from '@/components/ui'
import { MessageCircle, Shield } from 'lucide-react'

export default function ParentAskDonnaPage() {
  return (
    <div className="space-y-4">
      <div className="pt-2">
        <p className="page-eyebrow">Ask DONNA</p>
        <h1 className="page-title">Parent Guide</h1>
        <p className="page-subtitle">Questions about supporting your child at home.</p>
      </div>
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-status-blue/5 border border-status-blue/20">
        <Shield className="w-4 h-4 text-status-blue shrink-0" />
        <p className="text-xs text-status-blue leading-relaxed">
          DONNA shares coach-approved guidance only. No rankings, no comparisons, no private notes.
        </p>
      </div>
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-status-blue/10 border border-status-blue/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-status-blue" />
          </div>
          <p className="text-text-primary text-sm font-medium">Parent DONNA coming soon</p>
          <p className="text-text-muted text-xs leading-relaxed max-w-xs">
            Guidance on how to support your child at home, what to say after practice, and when to ask the coach.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
