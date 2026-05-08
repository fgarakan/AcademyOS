import { Info } from 'lucide-react'

interface QAItem {
  q: string
  a: string
}

interface Props {
  title: string
  body: string
  qa?: QAItem[]
}

export function PageExplainerCard({ title, body, qa }: Props) {
  return (
    <div className="rounded-2xl border border-lime/15 bg-surface px-5 py-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-3.5 h-3.5 text-lime" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">{body}</p>
        </div>
      </div>
      {qa && qa.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {qa.map((item) => (
            <div key={item.q} className="px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">{item.q}</p>
              <p className="text-[11px] text-text-secondary leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
