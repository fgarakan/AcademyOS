'use client'

import { useState } from 'react'
import { Sparkles, ChevronRight, Send, Zap } from 'lucide-react'
import Link from 'next/link'

const QUICK_ACTIONS = [
  { label: 'Build a class template from curriculum', href: '/director/templates/class/create' },
  { label: 'Build a fitness template', href: '/director/templates/fitness/create' },
  { label: 'Improve an existing template', href: '/director/templates/class' },
  { label: 'Find missing templates', href: '/director/templates/donna-suggestions' },
  { label: 'Create templates for a level', href: '/director/templates/class/create' },
]

export function TemplatesDonnaPanel() {
  const [input, setInput] = useState('')

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && input.trim()) {
      setInput('')
    }
  }

  return (
    <aside
      id="donna"
      className="sticky top-6 w-[300px] xl:w-[320px] shrink-0"
    >
      <div
        className="rounded-2xl border overflow-hidden flex flex-col"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-default)',
        }}
      >
        {/* ── Panel header ─────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="w-8 h-8 rounded-xl bg-lime/15 border border-lime/25 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-lime" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text-primary">DONNA</span>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-status-green/10 text-status-green border border-status-green/20">
                <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
                Active
              </span>
            </div>
            <p className="text-[11px] text-text-muted leading-none mt-0.5">AI Template Assistant</p>
          </div>
        </div>

        {/* ── Conversation area ─────────────────────────────────────── */}
        <div className="p-4 space-y-4">
          {/* DONNA prompt bubble */}
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-lime/15 border border-lime/20 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3 h-3 text-lime" />
            </div>
            <div
              className="flex-1 rounded-xl rounded-tl-sm px-3.5 py-2.5 border"
              style={{
                background: 'var(--bg-card-soft)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <p className="text-sm text-text-primary leading-relaxed">
                What are you trying to build?
              </p>
            </div>
          </div>

          {/* ── Quick Actions ─────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 px-0.5">
              <Zap className="w-3 h-3 text-lime" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                Quick Actions
              </span>
            </div>

            <div className="space-y-0.5">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-transparent hover:bg-lime/5 hover:border-lime/15 transition-all duration-100"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-lime/40 shrink-0 mt-px group-hover:text-lime transition-colors duration-100" />
                  <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors duration-100 leading-snug">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Input area ───────────────────────────────────────────── */}
        <div
          className="px-3 pb-3 pt-2"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-surface-overlay focus-within:border-lime/25 transition-colors duration-150">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask DONNA anything..."
              className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none min-w-0"
            />
            <button
              type="button"
              aria-label="Send"
              onClick={() => setInput('')}
              disabled={!input.trim()}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-text-muted hover:text-lime hover:bg-lime/10 transition-all duration-100 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
