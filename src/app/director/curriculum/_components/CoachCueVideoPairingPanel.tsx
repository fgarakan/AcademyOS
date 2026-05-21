'use client'

import { useState } from 'react'
import { MessageSquare, Video, ChevronDown, ChevronRight, AlertTriangle, Lock } from 'lucide-react'

interface Props {
  levelId: string
  levelName: string
}

const CUE_TYPES = [
  'observation_prompt',
  'correction_language',
  'reinforcement_language',
  'gate_check_prompt',
  'session_setup_note',
] as const

type CueType = typeof CUE_TYPES[number]

const CUE_TYPE_LABELS: Record<CueType, string> = {
  observation_prompt:      'Observation Prompt',
  correction_language:     'Correction Language',
  reinforcement_language:  'Reinforcement Language',
  gate_check_prompt:       'Gate Check Prompt',
  session_setup_note:      'Session Setup Note',
}

const DOMAIN_OPTIONS = [
  'technical', 'tactical', 'footwork', 'mental', 'competition',
] as const

type Domain = typeof DOMAIN_OPTIONS[number]

const INPUT_CLS = 'w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors'

export function CoachCueVideoPairingPanel({ levelName }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [prompt, setPrompt] = useState('')
  const [cueType, setCueType] = useState<CueType>('observation_prompt')
  const [domain, setDomain] = useState<Domain>('technical')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [context, setContext] = useState('')

  const isValid = prompt.trim().length > 0

  function handleReset() {
    setPrompt(''); setCueType('observation_prompt'); setDomain('technical')
    setVideoUrl(''); setVideoTitle(''); setContext(''); setSubmitted(false)
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface-raised transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <p className="text-[12px] font-medium text-text-secondary">Coach Cue + Video Pairing</p>
          <span className="text-[10px] text-text-muted">for {levelName}</span>
        </div>
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
        }
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-3 bg-surface">
          {/* Coach-only notice */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-400/5 border border-yellow-400/20">
            <Lock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <p className="text-[10px] text-text-muted leading-relaxed">
              <span className="text-yellow-400 font-medium">Coach &amp; Director only.</span>{' '}
              Coach cues are never shown to parents or players.
            </p>
          </div>

          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-orange/5 border border-status-orange/20">
            <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
            <p className="text-[10px] text-text-muted">
              <span className="text-status-orange font-medium">Draft only.</span>{' '}
              Requires director approval.
            </p>
          </div>

          {!submitted ? (
            <div className="space-y-3">
              {/* Cue type */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Cue Type</p>
                <div className="flex flex-wrap gap-1">
                  {CUE_TYPES.map(t => (
                    <button key={t} onClick={() => setCueType(t)}
                      className={`px-2 py-1 rounded text-[9px] font-medium border transition-colors ${
                        cueType === t
                          ? 'bg-lime/10 border-lime/30 text-lime'
                          : 'border-border bg-surface-raised text-text-muted hover:border-lime/20'
                      }`}
                    >{CUE_TYPE_LABELS[t]}</button>
                  ))}
                </div>
              </div>

              {/* Domain */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Domain</p>
                <div className="flex flex-wrap gap-1">
                  {DOMAIN_OPTIONS.map(d => (
                    <button key={d} onClick={() => setDomain(d)}
                      className={`px-2 py-1 rounded text-[9px] font-medium border capitalize transition-colors ${
                        domain === d
                          ? 'bg-lime/10 border-lime/30 text-lime'
                          : 'border-border bg-surface-raised text-text-muted hover:border-lime/20'
                      }`}
                    >{d}</button>
                  ))}
                </div>
              </div>

              {/* Prompt */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Prompt / Cue *</p>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={2}
                  placeholder="e.g. Watch where the ball bounces before deciding direction…"
                  className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors" />
              </div>

              {/* Context */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Context / When to Use</p>
                <input type="text" value={context} onChange={e => setContext(e.target.value)}
                  placeholder="e.g. Use after second error in a row" className={INPUT_CLS} />
              </div>

              {/* Video reference */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Video className="w-3 h-3 text-text-muted" />
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">Video Reference (optional)</p>
                </div>
                <input type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)}
                  placeholder="Video title…" className={INPUT_CLS} />
                <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/…" className={INPUT_CLS} />
              </div>

              <button
                onClick={() => isValid && setSubmitted(true)}
                disabled={!isValid}
                className="btn-lime w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Cue Draft
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 space-y-1.5">
                <p className="text-[11px] font-medium text-lime">Coach cue draft saved</p>
                <p className="text-[11px] text-text-secondary leading-relaxed italic">"{prompt}"</p>
                <div className="flex gap-2">
                  <span className="text-[9px] font-mono text-text-muted bg-surface border border-border px-1.5 py-0.5 rounded">
                    {CUE_TYPE_LABELS[cueType]}
                  </span>
                  <span className="text-[9px] font-mono text-text-muted bg-surface border border-border px-1.5 py-0.5 rounded capitalize">
                    {domain}
                  </span>
                </div>
                {videoTitle && (
                  <p className="text-[10px] text-lime/70">📹 {videoTitle}</p>
                )}
                <div className="flex items-start gap-1.5 pt-1.5 border-t border-lime/10">
                  <Lock className="w-3 h-3 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-text-muted">Coach &amp; director visibility only. Requires approval.</p>
                </div>
              </div>
              <button onClick={handleReset} className="btn-ghost w-full">Draft Another</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
