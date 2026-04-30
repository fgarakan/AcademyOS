import { AlertCircle } from 'lucide-react'

interface RecapEntry {
  id: string
  raw_input: string
  created_at: string
}

interface Props {
  recaps: RecapEntry[]
}

export function SessionRecapSummary({ recaps }: Props) {
  if (recaps.length === 0) {
    return (
      <p className="text-sm text-text-muted py-2 text-center">No coach recap recorded yet.</p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-orange/5 border border-status-orange/20 text-xs text-status-orange">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>Raw coach recap — not yet AI-structured or parent-safe.</span>
      </div>
      {recaps.map((recap, idx) => (
        <div key={recap.id} className={idx > 0 ? 'pt-4 border-t border-border' : ''}>
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5">
            {new Date(recap.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
          <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
            {recap.raw_input}
          </p>
        </div>
      ))}
    </div>
  )
}
