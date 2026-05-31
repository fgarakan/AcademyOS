'use client'

// Sprint 1025 — DONNA Panel Simplification + Premium Response UI V1
// Unified response renderer for the DONNA panel.
// Replaces the mixed cooThread + commandResponse + godModeOutput display.
//
// Design goals:
//   - One clean conversation thread (not three separate display areas)
//   - Premium styling: darker background, clear turn separation, no legacy sprint comments
//   - DonnaResponseCard used for god-mode responses; simple bubbles for COO turns
//   - Loading state is inline in the thread (not a separate indicator)
//   - Error/fallback responses are styled as honest messages, not failures
//
// V1 limitations:
//   - Not yet wired to DonnaAssistantButton — Sprint 1026 wires it
//   - cooThread format is different from OrchestratorTurn — V2 will unify types
//
// Usage (Sprint 1026 integration):
//   <DonnaPanelResponseRenderer
//     cooThread={cooThread}
//     godModeOutput={godModeOutput}
//     isGodModeLoading={isGodModeLoading}
//     commandResponse={commandResponse}
//     onGodModeNavigate={(route) => { router.push(route); closePanel() }}
//     onGodModeHighlight={(targetId, route, label) => {
//       executeDonnaHighlight({ targetId, route, label }, pathname, (r) => router.push(r))
//       closePanel()
//     }}
//   />

import { useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { DonnaResponseCard } from '@/components/donna/DonnaResponseCard'
import type { OrchestratorOutput } from '@/lib/donna/llmOrchestration/types'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CooThreadTurn {
  user: string
  donna: string
  label?: string
  type?: 'info' | 'honest'
}

export interface CommandResponseData {
  message: string
  type: 'info' | 'honest'
  label?: string
}

export interface DonnaPanelResponseRendererProps {
  /** COO conversational thread turns (legacy path — still supported) */
  cooThread?: CooThreadTurn[]
  /** God Mode orchestrator response (new LLM path) */
  godModeOutput?: OrchestratorOutput | null
  /** Whether God Mode is loading */
  isGodModeLoading?: boolean
  /** Inline command response (fallback / error / simple answers) */
  commandResponse?: CommandResponseData | null
  /** Suppress commandResponse when it duplicates the last cooThread turn */
  suppressCommandResponseCard?: boolean
  /** onNavigate callback for DonnaResponseCard */
  onGodModeNavigate?: (route: string) => void
  /** onHighlight callback for DonnaResponseCard */
  onGodModeHighlight?: (targetId: string, route: string, label: string) => void
}

// ── COO thread bubble ─────────────────────────────────────────────────────────

function DonnaBubble({
  text,
  label,
  type = 'info',
}: {
  text: string
  label?: string
  type?: 'info' | 'honest'
}) {
  const isHonest = type === 'honest'
  return (
    <div className="max-w-[88%] space-y-1">
      {label && (
        <p
          className="text-[10px] uppercase tracking-widest font-semibold px-1"
          style={{ color: isHonest ? '#FF9500' : 'rgba(139,92,246,0.7)' }}
        >
          {label}
        </p>
      )}
      <div
        className="rounded-2xl rounded-tl-sm px-3 py-2"
        style={{
          background: isHonest ? 'rgba(255,149,0,0.06)' : 'rgba(139,92,246,0.06)',
          border: isHonest ? '1px solid rgba(255,149,0,0.18)' : '1px solid rgba(139,92,246,0.12)',
        }}
      >
        <p className="text-[12px] text-text-secondary leading-relaxed">
          {text.length > 200 ? text.slice(0, 197) + '…' : text}
        </p>
      </div>
    </div>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[84%] rounded-2xl rounded-tr-sm px-3 py-2"
        style={{ background: 'rgba(200,255,0,0.07)', border: '1px solid rgba(200,255,0,0.15)' }}
      >
        <p className="text-[12px] text-text-primary leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

// ── Loading indicator ─────────────────────────────────────────────────────────

function DonnaThinkingIndicator() {
  return (
    <div className="flex items-center gap-2.5 py-2">
      <div className="w-6 h-6 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0">
        <span className="text-lime text-[9px] font-bold">D</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Loader2 className="w-3 h-3 text-lime/60 animate-spin" />
        <span className="text-[11px] text-text-muted">Thinking…</span>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DonnaPanelResponseRenderer({
  cooThread = [],
  godModeOutput = null,
  isGodModeLoading = false,
  commandResponse = null,
  suppressCommandResponseCard = false,
  onGodModeNavigate,
  onGodModeHighlight,
}: DonnaPanelResponseRendererProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (cooThread.length > 0 || godModeOutput || commandResponse) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [cooThread.length, godModeOutput, commandResponse])

  const hasCooContent = cooThread.length > 0
  const hasGodMode = godModeOutput !== null
  const hasInlineResponse = commandResponse !== null && !suppressCommandResponseCard

  if (!hasCooContent && !hasGodMode && !isGodModeLoading && !hasInlineResponse) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* COO thread bubbles */}
      {hasCooContent && (
        <div className="space-y-2.5 px-0 max-h-[260px] overflow-y-auto">
          {cooThread.slice(-5).map((turn, i) => (
            <div key={i} className="space-y-1.5">
              <UserBubble text={turn.user} />
              <div className="flex justify-start">
                <DonnaBubble
                  text={turn.donna}
                  label={turn.label}
                  type={turn.type}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline command response (simple answers, errors) */}
      {hasInlineResponse && (
        <div className="flex justify-start">
          <DonnaBubble
            text={commandResponse.message}
            label={commandResponse.label}
            type={commandResponse.type}
          />
        </div>
      )}

      {/* God Mode loading indicator */}
      {isGodModeLoading && <DonnaThinkingIndicator />}

      {/* God Mode response card */}
      {hasGodMode && !isGodModeLoading && (
        <DonnaResponseCard
          output={godModeOutput!}
          onNavigate={onGodModeNavigate}
          onHighlight={onGodModeHighlight}
        />
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  )
}
