'use client'

import { useState, useTransition, useRef } from 'react'
import { CheckCircle2, AlertCircle, FileText, ChevronDown, ChevronUp, Users, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui'
import { runPlayerImportDryRunAction, commitPlayerImportAction } from './playerImportActions'
import type { DryRunReport, CommitResult } from './playerImportActions'

const COLUMN_GUIDANCE = [
  { name: 'first_name', required: true, desc: 'First name' },
  { name: 'last_name', required: true, desc: 'Last name' },
  { name: 'birth_year', required: false, desc: '4-digit year, e.g. 2014' },
  { name: 'ball_level', required: false, desc: 'red / orange / green / yellow' },
  { name: 'current_group', required: false, desc: 'Must match an existing group name exactly' },
  { name: 'primary_coach', required: false, desc: 'Must match a coach display name exactly' },
  { name: 'curriculum_level', required: false, desc: 'Must match a curriculum level display name exactly' },
  { name: 'strength_1', required: false, desc: 'One strength (plain English)' },
  { name: 'strength_2', required: false, desc: '' },
  { name: 'strength_3', required: false, desc: '' },
  { name: 'need_1', required: false, desc: 'One development area (plain English)' },
  { name: 'need_2', required: false, desc: '' },
  { name: 'need_3', required: false, desc: '' },
  { name: 'current_priority', required: false, desc: 'The main focus for this player right now' },
  { name: 'coach_notes', required: false, desc: '1–2 sentences. Not visible to players or parents.' },
  { name: 'status', required: false, desc: 'active (default) or on_hold' },
]

function StatPill({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-surface-raised border border-border min-w-[60px]">
      <p className={`text-lg font-mono font-bold ${color ?? 'text-text-primary'}`}>{value}</p>
      <p className="text-[9px] uppercase tracking-widest text-text-muted mt-0.5 text-center">{label}</p>
    </div>
  )
}

function RowActionPill({ action }: { action: string }) {
  const styles: Record<string, string> = {
    create: 'bg-status-green/10 text-status-green border-status-green/30',
    update_dev_data: 'bg-status-blue/10 text-status-blue border-status-blue/30',
    skip_duplicate: 'bg-status-orange/10 text-status-orange border-status-orange/30',
    skip_error: 'bg-status-red/10 text-status-red border-status-red/30',
  }
  const labels: Record<string, string> = {
    create: 'Create',
    update_dev_data: 'Update',
    skip_duplicate: 'Skip',
    skip_error: 'Error',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-medium ${styles[action] ?? ''}`}>
      {labels[action] ?? action}
    </span>
  )
}

function DryRunReport({ report }: { report: DryRunReport }) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  function toggleRow(idx: number) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex flex-wrap gap-2">
        <StatPill label="Total" value={report.counts.total} />
        <StatPill label="Create" value={report.counts.toCreate} color="text-status-green" />
        {report.counts.toUpdateDevData > 0 && (
          <StatPill label="Update" value={report.counts.toUpdateDevData} color="text-status-blue" />
        )}
        {report.counts.skippedDuplicates > 0 && (
          <StatPill label="Dupes" value={report.counts.skippedDuplicates} color="text-status-orange" />
        )}
        {report.counts.skippedErrors > 0 && (
          <StatPill label="Errors" value={report.counts.skippedErrors} color="text-status-red" />
        )}
        {report.counts.unresolvedGroups > 0 && (
          <StatPill label="No Group" value={report.counts.unresolvedGroups} color="text-status-orange" />
        )}
        {report.counts.unresolvedLevels > 0 && (
          <StatPill label="No Level" value={report.counts.unresolvedLevels} color="text-status-orange" />
        )}
      </div>

      {/* Global warnings */}
      {report.warnings.length > 0 && (
        <div className="px-4 py-3 rounded-lg bg-status-orange/10 border border-status-orange/30 space-y-1">
          <p className="text-[9px] uppercase tracking-widest text-status-orange mb-1">Warnings</p>
          {report.warnings.slice(0, 5).map((w, i) => (
            <p key={i} className="text-xs text-status-orange">{w}</p>
          ))}
          {report.warnings.length > 5 && (
            <p className="text-xs text-text-muted">{report.warnings.length - 5} more warnings…</p>
          )}
        </div>
      )}

      {/* Row list */}
      {report.rows.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-widest text-text-muted mb-2">Row Preview</p>
          {report.rows.map(row => (
            <div key={row.rowIndex} className="rounded-lg border border-border bg-surface-raised overflow-hidden">
              <div
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface/60 transition-colors"
                onClick={() => toggleRow(row.rowIndex)}
              >
                <p className="text-sm text-text-primary flex-1 min-w-0 truncate">{row.fullName}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <RowActionPill action={row.action} />
                  {(row.warnings.length > 0 || row.errors.length > 0) && (
                    <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0" />
                  )}
                  {expandedRows.has(row.rowIndex)
                    ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" />
                    : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
                </div>
              </div>
              {expandedRows.has(row.rowIndex) && (
                <div className="px-3 pb-3 space-y-2 border-t border-border bg-surface/40">
                  <div className="flex flex-wrap gap-4 pt-2 text-xs text-text-muted">
                    {row.groupName && (
                      <span className={row.groupResolved ? 'text-status-green' : 'text-status-orange'}>
                        Group: {row.groupName}
                      </span>
                    )}
                    {row.curriculumLevelName && (
                      <span className={row.curriculumLevelResolved ? 'text-status-green' : 'text-status-orange'}>
                        Level: {row.curriculumLevelName}
                      </span>
                    )}
                    {row.existingPlayerId && (
                      <span className="text-status-blue">Existing player — dev data only</span>
                    )}
                  </div>
                  {row.errors.map((e, i) => (
                    <p key={i} className="text-xs text-status-red flex items-start gap-1.5">
                      <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                      {e}
                    </p>
                  ))}
                  {row.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-status-orange flex items-start gap-1.5">
                      <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                      {w}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CommitSection({
  report,
  csvText,
  onResult,
}: {
  report: DryRunReport
  csvText: string
  onResult: (r: CommitResult) => void
}) {
  const [confirmed, setConfirmed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const readyCount = report.counts.toCreate + report.counts.toUpdateDevData
  const hasErrors = report.counts.skippedErrors > 0

  function handleCommit() {
    setError(null)
    startTransition(async () => {
      const result = await commitPlayerImportAction(csvText)
      if (!result.ok) {
        setError(result.error ?? 'Import failed.')
      } else {
        onResult(result)
      }
    })
  }

  return (
    <div className="space-y-4 pt-2 border-t border-border">
      <div>
        <p className="text-[9px] uppercase tracking-widest text-text-muted mb-2">Ready to Import</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {report.counts.toCreate > 0 && (
            <span className="text-xs px-3 py-1 rounded-full bg-status-green/10 text-status-green border border-status-green/30">
              {report.counts.toCreate} player{report.counts.toCreate > 1 ? 's' : ''} will be created
            </span>
          )}
          {report.counts.toUpdateDevData > 0 && (
            <span className="text-xs px-3 py-1 rounded-full bg-status-blue/10 text-status-blue border border-status-blue/30">
              {report.counts.toUpdateDevData} existing player{report.counts.toUpdateDevData > 1 ? 's' : ''} — development data only
            </span>
          )}
          {report.counts.skippedErrors > 0 && (
            <span className="text-xs px-3 py-1 rounded-full bg-status-red/10 text-status-red border border-status-red/30">
              {report.counts.skippedErrors} row{report.counts.skippedErrors > 1 ? 's' : ''} will be skipped (errors)
            </span>
          )}
        </div>

        {hasErrors && (
          <p className="text-xs text-status-orange mb-3">
            Some rows have errors and will be skipped. You can still commit the valid rows.
          </p>
        )}

        {readyCount === 0 ? (
          <p className="text-sm text-text-muted">No rows ready to import.</p>
        ) : (
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-lime"
            />
            <span className="text-sm text-text-secondary leading-snug">
              I understand this will create or update player records for this academy. This action will be logged.
            </span>
          </label>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-status-red/10 border border-status-red/30 text-sm text-status-red">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {readyCount > 0 && (
        <button
          onClick={handleCommit}
          disabled={!confirmed || isPending}
          className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-lg bg-lime text-base font-semibold hover:bg-lime/90 transition-colors disabled:opacity-40"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isPending ? 'Importing…' : `Commit Import — ${readyCount} player${readyCount > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  )
}

function ImportResultReport({ result }: { result: CommitResult }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="w-5 h-5 text-status-green" />
        <p className="text-lg font-semibold text-text-primary">Import Complete</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatPill label="Created" value={result.createdCount} color="text-status-green" />
        {result.updatedCount > 0 && (
          <StatPill label="Updated" value={result.updatedCount} color="text-status-blue" />
        )}
        {result.skippedCount > 0 && (
          <StatPill label="Skipped" value={result.skippedCount} color="text-text-muted" />
        )}
        {result.profileSummaryCreatedCount > 0 && (
          <StatPill label="Dev Profiles" value={result.profileSummaryCreatedCount} color="text-lime" />
        )}
        {result.priorityCreatedCount > 0 && (
          <StatPill label="Priorities" value={result.priorityCreatedCount} color="text-lime" />
        )}
        {result.curriculumAssignedCount > 0 && (
          <StatPill label="Levels Set" value={result.curriculumAssignedCount} color="text-lime" />
        )}
        {result.groupAssignedCount > 0 && (
          <StatPill label="Groups Set" value={result.groupAssignedCount} color="text-lime" />
        )}
      </div>

      {result.warnings.length > 0 && (
        <div className="px-4 py-3 rounded-lg bg-status-orange/10 border border-status-orange/30 space-y-1">
          <p className="text-[9px] uppercase tracking-widest text-status-orange mb-1">Warnings</p>
          {result.warnings.slice(0, 8).map((w, i) => (
            <p key={i} className="text-xs text-status-orange">{w}</p>
          ))}
          {result.warnings.length > 8 && (
            <p className="text-xs text-text-muted">{result.warnings.length - 8} more…</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href="/director/players"
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-lime text-base font-semibold hover:bg-lime/90 transition-colors"
        >
          <Users className="w-4 h-4" />
          Go to Players
        </Link>
        <Link
          href="/director/players/development-intake"
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Development Profile Intake
        </Link>
      </div>
    </div>
  )
}

export function PlayerImportClient() {
  const [csvText, setCsvText] = useState('')
  const [showGuidance, setShowGuidance] = useState(false)
  const [isDryRunning, startDryRunTransition] = useTransition()
  const [dryRunReport, setDryRunReport] = useState<DryRunReport | null>(null)
  const [dryRunError, setDryRunError] = useState<string | null>(null)
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      setCsvText(text ?? '')
      setDryRunReport(null)
      setDryRunError(null)
      setCommitResult(null)
    }
    reader.readAsText(file)
  }

  function handleRunDryRun() {
    setDryRunError(null)
    setDryRunReport(null)
    setCommitResult(null)
    startDryRunTransition(async () => {
      const result = await runPlayerImportDryRunAction(csvText)
      if (!result.ok) {
        setDryRunError(result.error ?? result.headerError ?? 'Dry run failed.')
      } else {
        setDryRunReport(result)
      }
    })
  }

  if (commitResult) {
    return (
      <Card>
        <CardContent className="py-5">
          <ImportResultReport result={commitResult} />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Column guidance */}
      <Card>
        <CardContent className="py-4">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setShowGuidance(v => !v)}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-lime" />
              <p className="text-sm font-medium text-text-primary">CSV Column Guide</p>
            </div>
            {showGuidance
              ? <ChevronUp className="w-4 h-4 text-text-muted" />
              : <ChevronDown className="w-4 h-4 text-text-muted" />}
          </button>

          {showGuidance && (
            <div className="mt-3 space-y-1">
              <p className="text-xs text-text-muted mb-2">
                Header row required. First two columns are required; all others are optional.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                {COLUMN_GUIDANCE.map(col => (
                  <div key={col.name} className="flex items-start gap-2 py-0.5">
                    <code className="text-[10px] text-lime bg-surface-raised px-1.5 py-0.5 rounded shrink-0">
                      {col.name}
                    </code>
                    {col.required && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-lime/10 text-lime border border-lime/30 shrink-0">req</span>
                    )}
                    {col.desc && (
                      <span className="text-[11px] text-text-muted">{col.desc}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Input */}
      <Card>
        <CardContent className="py-5 space-y-4">
          <div>
            <p className="label-xs mb-2">Paste CSV or upload a file</p>
            <textarea
              className="w-full h-40 bg-surface-raised border border-border rounded-lg px-3 py-2.5 text-xs text-text-primary font-mono resize-y placeholder-text-muted focus:outline-none focus:border-lime/40 transition-colors"
              placeholder={`first_name,last_name,birth_year,...\nAlex,Chen,2014,...`}
              value={csvText}
              onChange={e => {
                setCsvText(e.target.value)
                setDryRunReport(null)
                setDryRunError(null)
              }}
              spellCheck={false}
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors"
            >
              Upload .csv file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
            {csvText && (
              <button
                onClick={() => {
                  setCsvText('')
                  setDryRunReport(null)
                  setDryRunError(null)
                }}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={handleRunDryRun}
            disabled={isDryRunning || !csvText.trim()}
            className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-lg bg-lime text-base font-semibold hover:bg-lime/90 transition-colors disabled:opacity-40"
          >
            {isDryRunning ? 'Checking…' : dryRunReport ? 'Re-run Dry Run' : 'Run Dry Run'}
          </button>
        </CardContent>
      </Card>

      {/* Dry run error */}
      {dryRunError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-status-red/10 border border-status-red/30 text-sm text-status-red">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {dryRunError}
        </div>
      )}

      {/* Dry run report + commit */}
      {dryRunReport && (
        <Card>
          <CardContent className="py-5 space-y-5">
            <div>
              <p className="label-xs mb-3">Dry Run Report</p>
              <DryRunReport report={dryRunReport} />
            </div>

            {dryRunReport.counts.total > 0 && (
              <CommitSection
                report={dryRunReport}
                csvText={csvText}
                onResult={setCommitResult}
              />
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-[10px] text-text-muted pt-2">
        No data is saved until you confirm and click Commit Import. Player data is not visible to players or parents.
      </p>
    </div>
  )
}
