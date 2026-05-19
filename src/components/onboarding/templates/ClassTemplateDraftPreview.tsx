'use client'

import { CLASS_BLOCKS } from './ClassTemplateBlockSelector'

interface Props {
  selectedBlocks: string[]
  blockDurations: Record<string, number>
}

export function ClassTemplateDraftPreview({ selectedBlocks, blockDurations }: Props) {
  const blocks = selectedBlocks
    .map(id => CLASS_BLOCKS.find(b => b.id === id))
    .filter((b): b is (typeof CLASS_BLOCKS)[number] => b !== undefined)
    .map(b => ({
      id: b.id,
      label: b.label,
      duration: blockDurations[b.id] ?? b.defaultDuration,
    }))

  const totalDuration = blocks.reduce((s, b) => s + b.duration, 0)

  if (blocks.length === 0) return null

  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden">
      <div className="px-4 py-3 bg-surface-raised border-b border-border flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Coach preview</p>
          <p className="text-xs font-semibold text-text-secondary mt-0.5">Draft first class template</p>
        </div>
        <span className="text-[11px] font-mono text-text-muted">~{totalDuration} min</span>
      </div>

      {/* Proportional timeline bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-1 h-6">
          {blocks.map((block, i) => (
            <div
              key={i}
              className="flex-1 rounded border border-lime/20 bg-lime/5 flex items-center justify-center min-w-0 overflow-hidden"
              style={{ flex: block.duration }}
            >
              <span className="text-[8px] font-semibold text-lime px-1 truncate whitespace-nowrap">
                {block.label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-0.5 mb-3">
          {blocks.map((block, i) => (
            <div key={i} style={{ flex: block.duration }} className="text-center min-w-0 overflow-hidden">
              <span className="text-[7px] font-mono text-text-muted/50 whitespace-nowrap">{block.duration}m</span>
            </div>
          ))}
        </div>
      </div>

      {/* Block list */}
      <div className="divide-y divide-border">
        {blocks.map((block, i) => (
          <div key={block.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="w-5 h-5 rounded-full bg-lime/10 border border-lime/20 flex items-center justify-center text-[9px] font-bold text-lime shrink-0">
              {i + 1}
            </span>
            <p className="flex-1 text-xs font-medium text-text-secondary">{block.label}</p>
            <span className="text-[11px] font-mono text-text-muted shrink-0">{block.duration} min</span>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-border">
        <p className="text-[10px] text-text-muted/50 leading-relaxed text-center">
          This stays as an onboarding draft. Nothing is published or sent to coaches yet.
        </p>
      </div>
    </div>
  )
}
