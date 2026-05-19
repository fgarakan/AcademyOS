// Player Ask DONNA — Sprint 1068 stub. Full content in Sprint 1077.
import { Card, CardContent } from '@/components/ui'
import { MessageCircle, Shield } from 'lucide-react'

export default function PlayerAskDonnaPage() {
  return (
    <div className="space-y-4">
      <div className="pt-2">
        <p className="page-eyebrow">Ask DONNA</p>
        <h1 className="page-title">Your Training Guide</h1>
        <p className="page-subtitle">Questions about your mission, practice, or next level.</p>
      </div>
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-status-blue/5 border border-status-blue/20">
        <Shield className="w-4 h-4 text-status-blue shrink-0" />
        <p className="text-xs text-status-blue leading-relaxed">
          DONNA shares coach-approved summaries only. No rankings, no pressure, no private notes.
        </p>
      </div>
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-status-blue/10 border border-status-blue/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-status-blue" />
          </div>
          <p className="text-text-primary text-sm font-medium">DONNA coming soon</p>
          <p className="text-text-muted text-xs leading-relaxed max-w-xs">
            Ask DONNA about your mission, what to practice, how to prepare for a match, or how to get to the next level.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
