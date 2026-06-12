'use client'
// Sprint 1806–1835 — DONNA Command Center & Operating Experience V1
// DONNA COO Conversations: 10 strategic questions answered with evidence.
// Powered by cooConversationEngine. No duplicate reasoning.

import { useState } from 'react'
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui'
import type { COOConversationAnswer } from '@/lib/donna/operations/operatingPartnerOutputContract'
import type { COOQuestion } from '@/lib/donna/operations/cooConversationEngine'

interface Props {
  answers: COOConversationAnswer[]
}

const QUESTION_LABELS: Record<COOQuestion, string> = {
  what_should_i_do_today:          'What should I do today?',
  what_needs_attention:            'What needs my attention?',
  what_changed_this_week:          'What changed this week?',
  what_changed_this_month:         'What changed this month?',
  what_is_holding_us_back:         'What is holding us back?',
  what_should_i_ignore:            'What should I ignore?',
  what_should_we_stop_doing:       'What should we stop doing?',
  what_should_we_double_down_on:   'What should we double down on?',
  what_are_our_biggest_opportunities: 'What are our biggest opportunities?',
  what_are_our_biggest_bottlenecks:   'What are our biggest bottlenecks?',
}

function COOItem({ answer }: { answer: COOConversationAnswer }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-raised/40 transition-colors gap-3"
      >
        <p className="text-sm text-text-secondary font-medium">{answer.question}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            answer.confidence === 'reliable'
              ? 'bg-status-green/10 text-status-green'
              : 'bg-status-orange/10 text-status-orange'
          }`}>
            {answer.confidence === 'reliable' ? 'Reliable' : 'Provisional'}
          </span>
          {open ? <ChevronUp size={13} className="text-text-muted" /> : <ChevronDown size={13} className="text-text-muted" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Answer */}
          <p className="text-sm text-text-secondary leading-relaxed">{answer.answer}</p>

          {/* Evidence */}
          {answer.evidenceUsed.length > 0 && (
            <div>
              <p className="label-xs text-text-muted mb-1.5">EVIDENCE</p>
              <ul className="space-y-1">
                {answer.evidenceUsed.map((e, i) => (
                  <li key={i} className="text-xs text-text-muted flex gap-2">
                    <span className="text-lime">›</span>
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing data */}
          {answer.missingData.length > 0 && (
            <div>
              <p className="label-xs text-status-orange mb-1.5">MISSING DATA</p>
              <ul className="space-y-1">
                {answer.missingData.map((m, i) => (
                  <li key={i} className="text-xs text-text-muted flex gap-2">
                    <span className="text-status-orange">!</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended action */}
          {answer.recommendedNextAction && (
            <div className="p-3 rounded-xl bg-lime/5 border border-lime/20">
              <p className="label-xs text-lime mb-1">RECOMMENDED ACTION</p>
              <p className="text-sm text-text-secondary">{answer.recommendedNextAction}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function DonnaCOOPanel({ answers }: Props) {
  const [panelOpen, setPanelOpen] = useState(false)

  return (
    <Card className="overflow-hidden">
      {/* Panel header */}
      <button
        onClick={() => setPanelOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-raised/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-lime" />
          <span className="text-sm font-semibold text-text-secondary">Ask DONNA</span>
          <span className="label-xs text-text-muted">{answers.length} questions answered</span>
        </div>
        {panelOpen ? (
          <ChevronUp size={14} className="text-text-muted" />
        ) : (
          <ChevronDown size={14} className="text-text-muted" />
        )}
      </button>

      {panelOpen && (
        <div className="border-t border-border">
          {answers.map((a, i) => (
            <COOItem key={i} answer={a} />
          ))}
        </div>
      )}
    </Card>
  )
}
