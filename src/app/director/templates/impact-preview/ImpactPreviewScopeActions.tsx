'use client'

import { Sparkles } from 'lucide-react'

interface ScopeAction {
  label: string
  risk: string
}

interface ImpactPreviewScopeActionsProps {
  actions: ScopeAction[]
}

export function ImpactPreviewScopeActions({ actions }: ImpactPreviewScopeActionsProps) {
  return (
    <div className="rounded-2xl border border-lime/15 bg-lime/4 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-lime" />
        <h2 className="text-sm font-bold text-text-primary">Scope Actions</h2>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">
        Choose how broadly this template is deployed. All of the following require explicit director confirmation — nothing is applied automatically.
      </p>
      <div className="space-y-2">
        {actions.map(action => (
          <button
            key={action.label}
            onClick={() => alert('Demo only — no action taken.')}
            className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-lime/20 bg-lime/5 hover:bg-lime/10 transition-all duration-100 text-left group"
          >
            <span className="text-xs text-text-primary group-hover:text-text-primary">{action.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${
              action.risk === 'low' ? 'text-status-green border-status-green/30' : 'text-status-orange border-status-orange/30'
            }`}>
              {action.risk} risk
            </span>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-text-muted font-semibold">
        Nothing changes until you review and approve. No sessions are modified from this preview.
      </p>
    </div>
  )
}
