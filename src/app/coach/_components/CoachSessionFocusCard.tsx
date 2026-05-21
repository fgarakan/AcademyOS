'use client'

// Sprint 585 — Coach Session Plan Curriculum Focus V1
// Shows curriculum focus, assessment opportunities, player watch-fors,
// and a quick note button for on-court capture.
// Uses local state for the quick note. No DB write.

import { useState } from 'react'
import { Target, ClipboardList, Eye, Sparkles, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react'

interface WatchFor {
  playerName: string
  focus: string
  isAssessmentOpportunity: boolean
}

interface Props {
  sessionName: string
  curriculumFocus: string | null
  keyDomains: string[]
  watchFors: WatchFor[]
  assessmentOpportunities: string[]
  drilNote: string | null
}

export function CoachSessionFocusCard({
  sessionName,
  curriculumFocus,
  keyDomains,
  watchFors,
  assessmentOpportunities,
  drilNote,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [quickNote, setQuickNote] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)

  function handleSaveNote() {
    if (!quickNote.trim()) return
    setNoteSaved(true)
  }

  const hasContent = curriculumFocus || keyDomains.length > 0 || watchFors.length > 0 || assessmentOpportunities.length > 0

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Target className="w-3.5 h-3.5 text-lime shrink-0" />
          <span className="text-[12px] font-medium text-text-secondary">
            Session Focus — {sessionName}
          </span>
          {assessmentOpportunities.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-lime/10 border border-lime/20 text-lime">
              {assessmentOpportunities.length} assessment opp.
            </span>
          )}
        </div>
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
          {!hasContent ? (
            <div className="py-4 text-center space-y-1">
              <p className="text-[12px] text-text-muted">No curriculum focus set for this session.</p>
              <p className="text-[10px] text-text-muted/70">
                The director can add curriculum focus items to the session template.
              </p>
            </div>
          ) : (
            <>
              {/* Curriculum focus */}
              {curriculumFocus && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">Today's curriculum focus</p>
                  <p className="text-[13px] font-semibold text-text-primary">{curriculumFocus}</p>
                </div>
              )}

              {/* Key domains */}
              {keyDomains.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">Key domains</p>
                  <div className="flex flex-wrap gap-1.5">
                    {keyDomains.map(d => (
                      <span
                        key={d}
                        className="px-2.5 py-1 rounded-lg text-[10px] border border-border bg-surface text-text-secondary"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Assessment opportunities */}
              {assessmentOpportunities.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <ClipboardList className="w-3 h-3 text-lime" />
                    <p className="text-[10px] uppercase tracking-widest text-lime">Assessment opportunities</p>
                  </div>
                  {assessmentOpportunities.map((opp, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg border border-lime/20 bg-lime/5">
                      <Sparkles className="w-3 h-3 text-lime shrink-0 mt-0.5" />
                      <p className="text-[11px] text-text-secondary leading-relaxed">{opp}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Player watch-fors */}
              {watchFors.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3 h-3 text-text-muted" />
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">Player watch-fors</p>
                  </div>
                  {watchFors.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg border border-border bg-surface">
                      <span className="text-[10px] font-semibold text-text-secondary shrink-0 w-16 truncate">
                        {w.playerName.split(' ')[0]}
                      </span>
                      <p className="text-[11px] text-text-muted flex-1 leading-relaxed">{w.focus}</p>
                      {w.isAssessmentOpportunity && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-lime/10 text-lime border border-lime/20 shrink-0">
                          assess
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Drill note */}
              {drilNote && (
                <div className="px-3 py-2.5 rounded-lg border border-border bg-surface">
                  <p className="text-[10px] text-text-muted mb-0.5">Drill note</p>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{drilNote}</p>
                </div>
              )}
            </>
          )}

          {/* Quick note */}
          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Quick note</p>
            {noteSaved ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-lime/20 bg-lime/5">
                <CheckCircle className="w-3.5 h-3.5 text-lime shrink-0" />
                <p className="text-[11px] text-lime">Note saved locally. Submit at wrap-up.</p>
              </div>
            ) : (
              <>
                <textarea
                  value={quickNote}
                  onChange={e => setQuickNote(e.target.value)}
                  placeholder="On-court thought — observation, adjustment, idea…"
                  rows={2}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors"
                />
                <button
                  onClick={handleSaveNote}
                  disabled={!quickNote.trim()}
                  className="btn-lime w-full text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save Note
                </button>
              </>
            )}
            <p className="text-[9px] text-text-muted">Stays local until you complete the session wrap-up.</p>
          </div>
        </div>
      )}
    </div>
  )
}
