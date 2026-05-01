import { Mic, FileText, Eye, Shield } from 'lucide-react'
import { Card, CardContent, SectionHeader } from '@/components/ui'

const COMING_SOON_TILES = [
  {
    Icon: Mic,
    label: 'Record Voice Note',
    description: 'Dictate an observation right after a session.',
  },
  {
    Icon: FileText,
    label: 'Structure into Observation',
    description: 'AI helps format your note into a structured player record.',
  },
  {
    Icon: Eye,
    label: 'Review Before Saving',
    description: 'You review and approve every draft before it is saved.',
  },
]

export default function CoachVoicePage() {
  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <p className="page-eyebrow">Voice Notes</p>
        <h1 className="page-title">Voice Notes</h1>
        <p className="text-text-muted text-sm mt-1">
          Faster coach notes — no typing required.
        </p>
      </div>

      {/* ── Hero card ────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
              <Mic className="w-6 h-6 text-lime" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-text-primary text-base leading-snug">
                Capture coach notes faster
              </p>
              <p className="text-text-secondary text-sm mt-1 leading-relaxed">
                Speak your observation right after a session. The platform structures
                it into a player record — you review before anything is saved.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Coming soon tiles ────────────────────────────────── */}
      <div>
        <SectionHeader title="HOW IT WILL WORK" />
        <div className="space-y-3">
          {COMING_SOON_TILES.map(({ Icon, label, description }, i) => (
            <div
              key={label}
              className="flex items-start gap-4 p-4 rounded-2xl bg-surface border border-border opacity-60 select-none"
            >
              <div className="w-9 h-9 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-text-muted" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-text-primary">{label}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-lime/10 text-lime border border-lime/30">
                    Soon
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{description}</p>
              </div>
              <span className="shrink-0 w-6 h-6 rounded-full bg-surface-raised border border-border flex items-center justify-center mt-0.5">
                <span className="text-[10px] font-bold text-text-muted">{i + 1}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Safety note ──────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary mb-0.5">
                Coach review required
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                All voice notes require coach review before they are saved to a player record.
                Nothing is written automatically — you stay in control.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
