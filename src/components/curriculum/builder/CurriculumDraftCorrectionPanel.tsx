'use client'

import { useState } from 'react'
import { Sparkles, X, Shield, Edit3, CheckCircle2 } from 'lucide-react'
import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'
import type { DraftChangeType } from './CurriculumDraftSummaryPanel'

interface Props {
  level: CurriculumLevel
  allLevels?: CurriculumLevel[]
  changeType: DraftChangeType
  initialText: string
  onSaveDraft: (corrected: { text: string; levelId: string; domain: string }) => void
  onCancel: () => void
}

const DOMAINS = ['Technical', 'Tactical', 'Movement', 'Competition', 'Mentality', 'Fitness Support']

export function CurriculumDraftCorrectionPanel({ level, allLevels = [], changeType, initialText, onSaveDraft, onCancel }: Props) {
  const [text, setText] = useState(initialText)
  const [selectedLevelId, setSelectedLevelId] = useState(level.id)
  const [domain, setDomain] = useState(DOMAINS[0])
  const [saved, setSaved] = useState(false)

  function handleSave() {
    onSaveDraft({ text: text.trim(), levelId: selectedLevelId, domain })
    setSaved(true)
  }

  if (saved) {
    return (
      <div className="rounded-2xl border border-status-green/20 bg-status-green/[0.04] p-5 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
          <p className="text-[12px] font-semibold text-status-green">Draft saved to Review Queue</p>
        </div>
        <p className="text-[11px] text-text-muted">Nothing is applied until a director approves it there.</p>
        <button onClick={onCancel} className="text-[11px] text-lime hover:text-lime/80 transition-colors">Done</button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-lime shrink-0" />
          <p className="text-[12px] font-semibold text-text-primary">Correct before saving</p>
        </div>
        <button onClick={onCancel} className="text-text-muted hover:text-lime transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Edit wording */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1.5">Edit wording</p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full h-24 bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40"
          />
        </div>

        {/* Change level */}
        {allLevels.length > 1 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1.5">Assign to level</p>
            <select
              value={selectedLevelId}
              onChange={e => setSelectedLevelId(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-text-primary focus:outline-none focus:border-lime/40"
            >
              {allLevels.map(l => (
                <option key={l.id} value={l.id}>{l.display_name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Change domain */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1.5">Domain</p>
          <div className="flex flex-wrap gap-2">
            {DOMAINS.map(d => (
              <button
                key={d}
                onClick={() => setDomain(d)}
                className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${
                  domain === d
                    ? 'border-lime/30 bg-lime/10 text-lime'
                    : 'border-border text-text-muted hover:text-text-secondary hover:border-border/80'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Safety note */}
        <div className="flex items-start gap-2 rounded-xl border border-lime/10 bg-lime/[0.02] px-3 py-2">
          <Shield className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-muted">Draft only — nothing applies until director approval in the Review Queue.</p>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-border flex items-center justify-between gap-3">
        <button onClick={onCancel} className="text-[12px] text-text-muted hover:text-text-secondary transition-colors">Cancel</button>
        <button
          onClick={handleSave}
          disabled={text.trim().length < 10}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: '#C8FF00', color: '#0A0A0A' }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Save draft
        </button>
      </div>
    </div>
  )
}
