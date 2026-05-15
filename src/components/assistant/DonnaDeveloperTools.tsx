'use client'

// Sprint 384 — DONNA Modularization
// Developer / QA diagnostic panel — rendered only in non-production environments.
// All state is read-only props; mutations go through callbacks into the parent orchestrator.
// Future agent owner: QA / voice diagnostics team.

import type { ConversationState } from './donnaConversationController'
import { summarizeDraft } from './donnaDraftRuntime'
import type { AttendanceExceptionDraft } from './donnaAttendanceWorkflow'
import type { DonnaApprovalExecutionResult } from './donnaApprovalExecutionTypes'
import type { DonnaPreferences } from './donnaPreferenceMemory'
import type { DonnaRecommendationSet } from './donnaRecommendationTypes'
import type { LastCardActionRecord } from './donnaWorkflowCardActions'
import { hasDraftSession } from './donnaDraftPersistence'
import { getAuditTrail } from './donnaAuditTrail'
import { DONNA_VOICE_MODE_LABELS } from './donnaVoicePolicy'
import type { DonnaVoiceMode } from './donnaVoiceRuntime'
import type { DonnaRealtimeStatus } from './useDonnaRealtimeVoice'
import { DonnaVoiceDiagnostics } from './DonnaVoiceDiagnostics'

interface Props {
  convState: ConversationState
  convShowDraftReview: boolean
  attendanceExceptionDraft: AttendanceExceptionDraft | null
  attendanceQueueResult: DonnaApprovalExecutionResult | null
  preferences: DonnaPreferences
  recommendationSet: DonnaRecommendationSet | null
  lastCardAction: LastCardActionRecord | null
  realtimeStatus: DonnaRealtimeStatus
  realtimeUnavailableReason: string | null
  voiceGreetingStatus: 'idle' | 'starting' | 'speaking' | 'stalled' | 'done' | 'error'
  isSpeaking: boolean
  isVoiceListening: boolean
  isVoiceSupported: boolean | null
  voiceMode: DonnaVoiceMode
  wakeListeningActive: boolean
  wakeDetectedCommand: string | null
  testVoiceStatus: 'idle' | 'speaking' | 'done' | 'error'
  lastServerTtsInfo: { source: string; text: string } | null
  draftRestoredFromSession: boolean
  // Callbacks
  onResetIntro: () => void
  onTestBrowserVoice: () => void
  onStartWakeListening: () => void
  onStopWakeListening: () => void
  onTestRealtime: () => void
  onResetVoice: () => void
}

export function DonnaDeveloperTools({
  convState,
  convShowDraftReview,
  attendanceExceptionDraft,
  attendanceQueueResult,
  preferences,
  recommendationSet,
  lastCardAction,
  realtimeStatus,
  realtimeUnavailableReason,
  voiceGreetingStatus,
  isSpeaking,
  isVoiceListening,
  isVoiceSupported,
  voiceMode,
  wakeListeningActive,
  wakeDetectedCommand,
  testVoiceStatus,
  lastServerTtsInfo,
  draftRestoredFromSession,
  onResetIntro,
  onTestBrowserVoice,
  onStartWakeListening,
  onStopWakeListening,
  onTestRealtime,
  onResetVoice,
}: Props) {
  if (process.env.NODE_ENV === 'production') return null

  return (
    <details className="mx-4 mb-2">
      <summary className="text-[10px] uppercase tracking-widest text-text-muted cursor-pointer">
        Developer Tools
      </summary>
      <div className="mt-2 space-y-3">

        {/* Reset Donna intro */}
        <button
          type="button"
          onClick={onResetIntro}
          className="w-full text-[11px] rounded-lg px-3 py-1.5 transition-all"
          style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.2)', color: '#C8FF00' }}
        >
          Reset Donna intro
        </button>

        {/* Last TTS source */}
        {lastServerTtsInfo && (
          <div className="p-2 rounded text-[10px] font-mono space-y-0.5" style={{ background: 'var(--surface-raised)' }}>
            <div className="text-text-muted uppercase tracking-widest">Last TTS</div>
            <div className="text-text-secondary">
              Source: <span className="text-lime">{DONNA_VOICE_MODE_LABELS[lastServerTtsInfo.source as keyof typeof DONNA_VOICE_MODE_LABELS] ?? lastServerTtsInfo.source}</span>
            </div>
            <div className="text-text-secondary truncate">
              Text: <span className="text-text-primary">{lastServerTtsInfo.text}</span>
            </div>
          </div>
        )}

        {/* Hey Donna wake phrase */}
        <div>
          <button
            type="button"
            onClick={wakeListeningActive ? onStopWakeListening : onStartWakeListening}
            className="w-full text-[11px] rounded-lg px-3 py-1.5 transition-all"
            style={wakeListeningActive
              ? { background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', color: '#FF3B30' }
              : { background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)', color: '#c4b5fd' }
            }
          >
            {wakeListeningActive ? 'Stop wake listening' : 'Start wake listening'}
          </button>
          {wakeDetectedCommand !== null && (
            <p className="mt-1 text-[10px] text-lime leading-snug">
              {wakeDetectedCommand
                ? `Donna heard: "${wakeDetectedCommand}"`
                : 'Hey Donna detected. Speak your command.'}
            </p>
          )}
        </div>

        {/* Test browser TTS */}
        <button
          type="button"
          onClick={onTestBrowserVoice}
          disabled={testVoiceStatus === 'speaking'}
          className="w-full text-[11px] text-text-muted hover:text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-center py-1"
        >
          {testVoiceStatus === 'idle' && 'Test Donna browser voice'}
          {testVoiceStatus === 'speaking' && 'Speaking…'}
          {testVoiceStatus === 'done' && '✓ Browser voice working'}
          {testVoiceStatus === 'error' && 'Voice test failed — check browser sound settings'}
        </button>

        {/* Voice diagnostics */}
        <DonnaVoiceDiagnostics
          realtimeStatus={realtimeStatus}
          realtimeUnavailableReason={realtimeUnavailableReason}
          voiceGreetingStatus={voiceGreetingStatus}
          isSpeaking={isSpeaking}
          isVoiceListening={isVoiceListening}
          isVoiceSupported={isVoiceSupported}
          voiceMode={voiceMode}
          wakeListeningActive={wakeListeningActive}
          onTestRealtime={onTestRealtime}
          onTestBrowserVoice={onTestBrowserVoice}
          onResetVoice={onResetVoice}
        />

        {/* Audit trail (last 5 events) */}
        {(() => {
          const trail = getAuditTrail()
          const last5 = trail.slice(-5).reverse()
          return (
            <div className="p-2 rounded text-[10px] font-mono space-y-0.5" style={{ background: 'var(--surface-raised)' }}>
              <div className="text-text-muted uppercase tracking-widest">Audit Trail ({trail.length})</div>
              {last5.length === 0 ? (
                <div className="text-text-muted italic">No events yet.</div>
              ) : last5.map(ev => (
                <div key={ev.id} className="text-text-secondary">
                  <span className="text-lime">{ev.type}</span>{' '}
                  <span className="text-text-muted">{ev.description.slice(0, 40)}</span>
                </div>
              ))}
            </div>
          )
        })()}

        {/* Preference memory */}
        <div className="p-2 rounded text-[10px] font-mono space-y-0.5" style={{ background: 'var(--surface-raised)' }}>
          <div className="text-text-muted uppercase tracking-widest">Preferences (localStorage)</div>
          <div className="text-text-secondary">
            Last workflow: <span className="text-lime">{preferences.lastUsedWorkflowId ?? 'none'}</span>
          </div>
          <div className="text-text-secondary">
            Frequent categories: <span className="text-lime">{preferences.frequentCategories.join(', ') || 'none'}</span>
          </div>
        </div>

        {/* COO command routing state */}
        <div className="p-2 rounded text-[10px] font-mono space-y-0.5" style={{ background: 'var(--surface-raised)' }}>
          <div className="text-text-muted uppercase tracking-widest">COO Commands</div>
          <div className="text-text-secondary">
            Attendance draft:{' '}
            <span className={attendanceExceptionDraft ? 'text-lime' : 'text-text-muted'}>
              {attendanceExceptionDraft
                ? `active — ${attendanceExceptionDraft.playerName ?? (attendanceExceptionDraft.naturalInput ? 'natural input' : 'no player')} / ${attendanceExceptionDraft.type}`
                : 'none'}
            </span>
          </div>
          {attendanceExceptionDraft && (
            <>
              <div className="text-text-secondary">
                Session:{' '}
                <span className={attendanceExceptionDraft.sessionId ? 'text-status-green' : 'text-text-muted'}>
                  {attendanceExceptionDraft.sessionLabel ?? attendanceExceptionDraft.sessionId ?? 'not selected'}
                </span>
              </div>
              <div className="text-text-secondary">
                Ready for queue:{' '}
                <span className={attendanceExceptionDraft.sessionId && (attendanceExceptionDraft.naturalInput || attendanceExceptionDraft.playerName) ? 'text-status-green' : 'text-status-orange'}>
                  {attendanceExceptionDraft.sessionId && (attendanceExceptionDraft.naturalInput || attendanceExceptionDraft.playerName) ? 'YES' : 'no'}
                </span>
              </div>
              {attendanceExceptionDraft.flaggedAbsences && attendanceExceptionDraft.flaggedAbsences.length > 0 && (
                <div className="text-text-secondary">
                  Flagged absent: <span className="text-status-red">{attendanceExceptionDraft.flaggedAbsences.join(', ')}</span>
                </div>
              )}
              {attendanceExceptionDraft.flaggedUnrostered && attendanceExceptionDraft.flaggedUnrostered.length > 0 && (
                <div className="text-text-secondary">
                  Possible unrostered: <span className="text-status-orange">{attendanceExceptionDraft.flaggedUnrostered.join(', ')}</span>
                </div>
              )}
              {attendanceQueueResult && (
                <div className={attendanceQueueResult.ok ? 'text-status-green' : 'text-status-red'}>
                  Queue: {attendanceQueueResult.ok ? 'submitted ✓' : `blocked — ${attendanceQueueResult.message.slice(0, 40)}`}
                </div>
              )}
              <div className="text-text-muted">Official attendance execution: blocked</div>
            </>
          )}
          <div className="text-text-secondary">
            Recommendations:{' '}
            <span className={recommendationSet && recommendationSet.recommendations.length > 0 ? 'text-lime' : 'text-text-muted'}>
              {recommendationSet ? `${recommendationSet.recommendations.length} loaded` : 'not loaded'}
            </span>
          </div>
        </div>

        {/* Last workflow card action */}
        <div className="p-2 rounded text-[10px] font-mono space-y-0.5" style={{ background: 'var(--surface-raised)' }}>
          <div className="text-text-muted uppercase tracking-widest">Last Card Action</div>
          {lastCardAction ? (
            <>
              <div className="text-text-secondary">
                Action: <span className="text-lime">{lastCardAction.id}</span>
              </div>
              <div className="text-text-secondary">
                Safety: <span className={
                  lastCardAction.safetyLevel === 'safe' ? 'text-status-green'
                    : lastCardAction.safetyLevel === 'blocked' ? 'text-status-red'
                    : 'text-status-orange'
                }>{lastCardAction.safetyLevel}</span>
              </div>
              <div className="text-text-secondary">
                Mutates data: <span className={lastCardAction.mutatesData ? 'text-status-red' : 'text-status-green'}>
                  {lastCardAction.mutatesData ? 'YES' : 'no'}
                </span>
              </div>
              <div className="text-text-secondary">
                Requires approval: <span className={lastCardAction.requiresApproval ? 'text-status-orange' : 'text-text-muted'}>
                  {lastCardAction.requiresApproval ? 'YES' : 'no'}
                </span>
              </div>
              {lastCardAction.targetRoute && (
                <div className="text-text-secondary">
                  Route: <span className="text-lime">{lastCardAction.targetRoute}</span>
                </div>
              )}
              {lastCardAction.blockedReason && (
                <div className="text-status-red truncate">
                  Blocked: {lastCardAction.blockedReason.slice(0, 50)}
                </div>
              )}
            </>
          ) : (
            <div className="text-text-muted italic">No card action yet.</div>
          )}
        </div>

        {/* Draft session storage state */}
        <div className="p-2 rounded text-[10px] font-mono space-y-0.5" style={{ background: 'var(--surface-raised)' }}>
          <div className="text-text-muted uppercase tracking-widest">Draft Session Storage</div>
          <div className="text-text-secondary">
            Key present:{' '}
            <span className={hasDraftSession() ? 'text-lime' : 'text-text-muted'}>
              {hasDraftSession() ? 'yes' : 'no'}
            </span>
          </div>
          {convState.activeDraft && (
            <div className="text-text-secondary">
              Draft taskId:{' '}
              <span className="text-lime">{convState.activeDraft.taskId}</span>
            </div>
          )}
          {draftRestoredFromSession && (
            <div className="text-status-green">Restored from session ✓</div>
          )}
        </div>

        {/* Golden Path QA state */}
        <div className="p-2 rounded text-[11px] font-mono space-y-1" style={{ background: 'var(--surface-raised)' }}>
          <div className="text-text-muted text-[10px] uppercase tracking-widest">Controller</div>
          <div className="text-text-secondary">Phase: <span className="text-lime">{convState.phase}</span></div>
          <div className="text-text-secondary">Review panel: <span className="text-lime">{convShowDraftReview ? 'open' : 'closed'}</span></div>

          {convState.lastIntent && (
            <>
              <div className="text-text-muted text-[10px] uppercase tracking-widest mt-1">Last Intent</div>
              <div className="text-text-secondary">Type: <span className="text-lime">{convState.lastIntent.intentType}</span></div>
              <div className="text-text-secondary">Confidence: <span className="text-lime">{convState.lastIntent.confidence}</span></div>
              <div className="text-text-secondary">Approval required: <span className="text-lime">{convState.lastIntent.requiresApproval ? 'YES' : 'no'}</span></div>
            </>
          )}

          {convState.activeDraft && (() => {
            const s = summarizeDraft(convState.activeDraft)
            const isClassTemplate = convState.activeDraft.workflowId === 'class_template_creation'
            return (
              <>
                <div className="text-text-muted text-[10px] uppercase tracking-widest mt-1">Active Draft</div>
                <div className="text-text-secondary">Task: <span className="text-lime">{convState.activeDraft.taskId}</span></div>
                <div className="text-text-secondary">Version: <span className="text-lime">v{convState.activeDraft.history.length + 1}</span></div>
                <div className="text-text-secondary">Draft phase: <span className="text-lime">{convState.activeDraft.phase}</span></div>
                <div className="text-text-secondary">Undo stack depth: <span className="text-lime">{convState.activeDraft.history.length}</span></div>
                <div className="text-text-secondary">Progress: <span className="text-lime">{s.answeredCount} / {s.totalRequired} required</span></div>
                {s.missingRequiredIds.length > 0 && (
                  <div className="text-text-secondary">Missing: <span className="text-status-orange">{s.missingRequiredIds.join(', ')}</span></div>
                )}
                {s.fieldLines.length > 0 && (
                  <div className="text-text-secondary space-y-0.5">
                    {s.fieldLines.map(f => (
                      <div key={f.label}>· <span className="text-text-muted">{f.label}:</span> <span className="text-lime">{f.value}</span></div>
                    ))}
                  </div>
                )}
                {convState.currentFieldId && (
                  <div className="text-text-secondary">Asking for: <span className="text-lime">{convState.currentFieldId}</span></div>
                )}

                {isClassTemplate && (
                  <>
                    <div className="text-text-muted text-[10px] uppercase tracking-widest mt-1.5">Golden Path Checklist</div>
                    {[
                      { label: 'draft_started',              done: true },
                      { label: 'level collected',            done: !!convState.activeDraft.fields['level'] },
                      { label: 'durationMinutes collected',  done: !!convState.activeDraft.fields['durationMinutes'] },
                      { label: 'focusAreas collected',       done: !!convState.activeDraft.fields['focusAreas'] },
                      { label: 'ready_for_preview',          done: s.isComplete },
                      { label: 'review_panel_open',          done: convShowDraftReview },
                      { label: 'protected_action_blocked',   done: convState.lastIntent?.intentType === 'approve_or_execute' },
                    ].map(({ label, done }) => (
                      <div key={label} className={done ? 'text-status-green' : 'text-text-muted'}>
                        {done ? '✓' : '○'} {label}
                      </div>
                    ))}
                  </>
                )}
              </>
            )
          })()}
        </div>
      </div>
    </details>
  )
}
