'use client'

// Post-Migration Verification + Pilot Smoke Test Dashboard
// Sprint 1166-1185 Post-Verification
//
// Live checks against the actual DB:
//   1. Table existence for migrations 076–080
//   2. Row counts per academy
//   3. Non-destructive write smoke tests (insert + immediate delete)
//   4. DONNA quick question test
//
// Director/head_coach only.

import { useState, useTransition } from 'react'
import {
  CheckCircle2, XCircle, Clock, Loader2, Database, Shield,
  Play, AlertTriangle, ChevronDown, ChevronUp, ArrowLeft, Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import {
  postMigrationVerifyAction,
  runMigrationSmokeTest,
  type MigrationVerificationResult,
  type SmokeSuiteResult,
} from '@/app/director/_actions/postMigrationVerifyAction'
import { donnaGlobalCommandAction, type DonnaCommandResult } from '@/app/director/_actions/donnaGlobalCommandAction'

// ── Status icons ──────────────────────────────────────────────────────────────

function TableStatusBadge({ status }: { status: 'applied' | 'missing' | 'error' }) {
  if (status === 'applied') return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-status-green bg-status-green/8 border border-status-green/20 rounded px-1.5 py-0.5">
      <CheckCircle2 className="w-2.5 h-2.5" /> Applied
    </span>
  )
  if (status === 'missing') return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-status-red bg-status-red/8 border border-status-red/20 rounded px-1.5 py-0.5">
      <XCircle className="w-2.5 h-2.5" /> Missing
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-status-orange bg-status-orange/8 border border-status-orange/20 rounded px-1.5 py-0.5">
      <AlertTriangle className="w-2.5 h-2.5" /> Error
    </span>
  )
}

// ── DONNA test questions ──────────────────────────────────────────────────────

const DONNA_TEST_QUESTIONS = [
  'Who needs attention today?',
  'Who needs reassessment?',
  'What should I do first?',
  'Which parent updates need approval?',
  'Which players are stalled?',
]

// ── Main component ────────────────────────────────────────────────────────────

export default function MigrationVerifyPage() {
  const [verification, setVerification] = useState<MigrationVerificationResult | null>(null)
  const [smokeTest, setSmokeTest] = useState<SmokeSuiteResult | null>(null)
  const [donnaResults, setDonnaResults] = useState<Record<string, DonnaCommandResult>>({})
  const [showSmokeDetail, setShowSmokeDetail] = useState(false)
  const [runningDonna, setRunningDonna] = useState<string | null>(null)

  const [isVerifying, startVerify] = useTransition()
  const [isSmokeTesting, startSmoke] = useTransition()

  function handleVerify() {
    startVerify(async () => {
      const result = await postMigrationVerifyAction()
      setVerification(result)
    })
  }

  function handleSmokeTest() {
    startSmoke(async () => {
      const result = await runMigrationSmokeTest()
      setSmokeTest(result)
    })
  }

  async function runDonnaQuestion(question: string) {
    setRunningDonna(question)
    const result = await donnaGlobalCommandAction({
      question,
      pagePath: '/director/migration-verify',
    })
    setDonnaResults(prev => ({ ...prev, [question]: result }))
    setRunningDonna(null)
  }

  const appliedCount = verification?.appliedTables?.length ?? 0
  const totalCount   = verification?.tables?.length ?? 5

  return (
    <div className="p-6 space-y-6 max-w-3xl animate-fade-in">

      {/* Header */}
      <div className="space-y-1">
        <Link href="/director" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors mb-3">
          <ArrowLeft className="w-3.5 h-3.5" />
          Today
        </Link>
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-lime" />
          <p className="page-eyebrow">Internal</p>
        </div>
        <h1 className="page-title">Post-Migration Verification</h1>
        <p className="page-subtitle">
          Verify migrations 076–080 are live and pilot-critical flows work end-to-end.
        </p>
      </div>

      {/* Step 1: Check table existence */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-surface-raised flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-text-muted" />
            <p className="text-sm font-semibold text-text-primary">Step 1 — Table Existence Check</p>
          </div>
          {verification && (
            <span className={`text-[10px] font-bold uppercase tracking-wide rounded px-2 py-1 ${
              verification.overallStatus === 'all_applied'
                ? 'text-status-green bg-status-green/8 border border-status-green/20'
                : verification.overallStatus === 'partial'
                ? 'text-status-orange bg-status-orange/8 border border-status-orange/20'
                : 'text-status-red bg-status-red/8 border border-status-red/20'
            }`}>
              {appliedCount}/{totalCount} applied
            </span>
          )}
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-xs text-text-muted">
            Checks which tables from migrations 076–080 exist in the live database.
          </p>

          {!verification && (
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lime text-base text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-40"
            >
              {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
              {isVerifying ? 'Checking…' : 'Run Table Check'}
            </button>
          )}

          {verification && !verification.ok && (
            <p className="text-sm text-status-red">{verification.error}</p>
          )}

          {verification?.tables && (
            <div className="space-y-2">
              {verification.tables.map(t => (
                <div key={t.tableName} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-surface">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-mono font-semibold text-text-primary">{t.tableName}</p>
                      <span className="text-[9px] text-text-muted">migration {t.migration}</span>
                      <TableStatusBadge status={t.status} />
                    </div>
                    <p className="text-[10px] text-text-muted mt-0.5">{t.description}</p>
                    {t.status === 'applied' && t.rowCount !== null && (
                      <p className="text-[10px] text-status-green mt-0.5">{t.rowCount} rows (this academy)</p>
                    )}
                    {t.errorMessage && (
                      <p className="text-[10px] text-status-red mt-0.5">{t.errorMessage}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {verification?.missingTables && verification.missingTables.length > 0 && (
            <div className="px-4 py-3 rounded-xl border border-status-orange/20 bg-status-orange/4">
              <p className="text-[11px] text-status-orange font-semibold mb-1">Missing tables — apply migrations</p>
              <p className="text-[10px] text-text-muted">
                Open Supabase → SQL Editor → paste each missing migration file → Run.
                Order: {verification.missingTables.map(t => {
                  const m = ['player_mission_assignments', 'friction_reports', 'player_development_blueprints', 'assessment_events', 'donna_placement_recommendations']
                  const idx = m.indexOf(t)
                  return `07${6 + idx}`
                }).join(' → ')}.
                Files in: <code className="font-mono">supabase/migrations/</code>
              </p>
            </div>
          )}

          {verification && (
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Re-run check
            </button>
          )}
        </div>
      </div>

      {/* Step 2: Write smoke test */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-surface-raised flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-text-muted" />
            <p className="text-sm font-semibold text-text-primary">Step 2 — Write Smoke Test</p>
          </div>
          {smokeTest && (
            <span className={`text-[10px] font-bold uppercase tracking-wide rounded px-2 py-1 ${
              smokeTest.failCount === 0
                ? 'text-status-green bg-status-green/8 border border-status-green/20'
                : smokeTest.passCount > 0
                ? 'text-status-orange bg-status-orange/8 border border-status-orange/20'
                : 'text-status-red bg-status-red/8 border border-status-red/20'
            }`}>
              {smokeTest.passCount}/{smokeTest.results.length} pass
            </span>
          )}
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-xs text-text-muted">
            Attempts a non-destructive insert + immediate delete on each new table.
            Confirms RLS allows director writes and the schema is correctly configured.
          </p>

          {!smokeTest && (
            <button
              onClick={handleSmokeTest}
              disabled={isSmokeTesting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-raised border border-border text-sm font-semibold text-text-secondary hover:border-lime/30 hover:text-text-primary transition-all disabled:opacity-40"
            >
              {isSmokeTesting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSmokeTesting ? 'Testing…' : 'Run Smoke Test'}
            </button>
          )}

          {smokeTest && !smokeTest.ok && (
            <p className="text-sm text-status-red">{smokeTest.error}</p>
          )}

          {smokeTest?.results && (
            <div className="space-y-2">
              {smokeTest.results.map(r => (
                <div key={r.tableName} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-surface">
                  {r.canInsert && r.canSelect
                    ? <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
                    : <XCircle     className="w-4 h-4 text-status-red    shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-text-primary">{r.tableName}</p>
                    {r.errorMessage && (
                      <p className="text-[10px] text-status-red mt-0.5">{r.errorMessage}</p>
                    )}
                  </div>
                  <span className={`text-[9px] font-bold ${r.canInsert ? 'text-status-green' : 'text-status-red'}`}>
                    {r.canInsert ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {smokeTest && (
            <button
              onClick={handleSmokeTest}
              disabled={isSmokeTesting}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Re-run
            </button>
          )}
        </div>
      </div>

      {/* Step 3: DONNA Question Test */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-surface-raised flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lime" />
          <p className="text-sm font-semibold text-text-primary">Step 3 — DONNA Question Test</p>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-xs text-text-muted">
            Run core DONNA questions and verify responses use real data (not generic fallbacks).
          </p>

          <div className="space-y-3">
            {DONNA_TEST_QUESTIONS.map(q => {
              const result = donnaResults[q]
              const isRunning = runningDonna === q

              return (
                <div key={q} className="rounded-xl border border-border bg-surface overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <p className="text-xs font-semibold text-text-primary flex-1">"{q}"</p>
                    <button
                      onClick={() => runDonnaQuestion(q)}
                      disabled={!!runningDonna}
                      className="inline-flex items-center gap-1 text-[10px] text-lime hover:brightness-110 font-semibold disabled:opacity-40 shrink-0"
                    >
                      {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      {isRunning ? 'Asking…' : 'Ask'}
                    </button>
                  </div>

                  {result && (
                    <div className="border-t border-border px-4 py-3 bg-lime/3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 border ${
                          result.confidence >= 80
                            ? 'text-status-green bg-status-green/8 border-status-green/20'
                            : result.confidence >= 60
                            ? 'text-status-blue bg-status-blue/8 border-status-blue/20'
                            : 'text-text-muted bg-surface-raised border-border'
                        }`}>
                          {result.intent.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[9px] text-text-muted">{result.confidence}% confidence</span>
                      </div>
                      <p className="text-[12px] text-text-secondary leading-relaxed">{result.answer}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Step 4: Role safety checks */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-surface-raised flex items-center gap-2">
          <Shield className="w-4 h-4 text-text-muted" />
          <p className="text-sm font-semibold text-text-primary">Step 4 — Role Safety Verification</p>
        </div>
        <div className="px-5 py-4 space-y-2">
          <p className="text-xs text-text-muted mb-3">
            Manually verify these safety checks during the pilot session:
          </p>
          {[
            'Parent portal (/parent) shows no coach notes or assessment scores',
            'Player portal (/player) shows no raw scores or director content',
            'Coach portal (/coach) shows no parent communication drafts',
            'Quick Capture writes to correct academy (check voice_notes.academy_id)',
            'Level movement requires director approval (no auto-advance)',
            'Parent update requires director approval before visible in parent portal',
          ].map((check, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl bg-surface-raised border border-border">
              <div className="w-4 h-4 rounded border border-border bg-surface shrink-0 mt-0.5" />
              <p className="text-[11px] text-text-secondary">{check}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Overall readiness */}
      {verification && smokeTest && (
        <div className={`rounded-2xl border px-5 py-5 ${
          verification.readyForPilot && smokeTest.failCount === 0
            ? 'border-status-green/25 bg-status-green/5'
            : 'border-status-orange/25 bg-status-orange/4'
        }`}>
          <p className={`text-base font-bold ${
            verification.readyForPilot && smokeTest.failCount === 0
              ? 'text-status-green'
              : 'text-status-orange'
          }`}>
            {verification.readyForPilot && smokeTest.failCount === 0
              ? '✓ Pilot Ready — migrations applied, smoke tests pass'
              : '⚠ Not fully ready — see issues above'}
          </p>
          <p className="text-[11px] text-text-muted mt-1">
            Tables applied: {verification.appliedTables.join(', ') || 'none'}.
            {verification.missingTables.length > 0 && ` Missing: ${verification.missingTables.join(', ')}.`}
          </p>
        </div>
      )}

    </div>
  )
}
