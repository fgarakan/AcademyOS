import { FileText, Video, ClipboardCheck, AlertCircle } from 'lucide-react'

type EvidenceSource = 'session_note' | 'assessment_score' | 'video_review' | 'coach_observation' | 'match_result'

interface EvidenceLink {
  gate_criterion: string
  sources: EvidenceSource[]
  note?: string
}

interface Props {
  links: EvidenceLink[]
  levelName: string
}

const SOURCE_CONFIG: Record<EvidenceSource, { label: string; Icon: typeof FileText; color: string }> = {
  session_note:      { label: 'Session note',      Icon: FileText,       color: 'text-status-blue' },
  assessment_score:  { label: 'Assessment score',  Icon: ClipboardCheck, color: 'text-status-green' },
  video_review:      { label: 'Video review',      Icon: Video,          color: 'text-status-orange' },
  coach_observation: { label: 'Coach observation', Icon: AlertCircle,    color: 'text-lime' },
  match_result:      { label: 'Match result',      Icon: ClipboardCheck, color: 'text-status-blue' },
}

export function EvidenceMappingDisplay({ links, levelName }: Props) {
  if (links.length === 0) {
    return (
      <div className="rounded-xl border border-border border-dashed p-5 text-center">
        <p className="text-[12px] text-text-secondary">No evidence mapping defined for {levelName}.</p>
        <p className="text-[11px] text-text-muted mt-1">Evidence mapping connects gate criteria to the data sources that satisfy them.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {links.map((link, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface-raised overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border">
            <p className="text-[12px] font-semibold text-text-primary">{link.gate_criterion}</p>
          </div>
          <div className="px-4 py-2.5 space-y-2">
            <div className="flex flex-wrap gap-2">
              {link.sources.map(source => {
                const cfg = SOURCE_CONFIG[source]
                return (
                  <div key={source} className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1">
                    <cfg.Icon className={`w-3 h-3 shrink-0 ${cfg.color}`} />
                    <span className="text-[10px] text-text-secondary">{cfg.label}</span>
                  </div>
                )
              })}
            </div>
            {link.note && (
              <p className="text-[11px] text-text-muted">{link.note}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
