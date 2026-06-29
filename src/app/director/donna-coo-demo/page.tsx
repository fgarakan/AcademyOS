'use client'

// Sprint 509 — Full COO Demo Walkthrough V1
// Sprint 523 — COO Dashboard Data Sufficiency UI Pass V1
// Director-facing demo page showcasing all 7 COO Intelligence dashboard components.
// Uses DEMO seed data only. Clearly labeled. No DB calls.

import { useState } from 'react'
import { notFound } from 'next/navigation'
import { DonnaCommandBriefIntegration } from '@/components/assistant/DonnaCommandBriefIntegration'
import { DonnaCOOWeeklyReport } from '@/components/assistant/DonnaCOOWeeklyReport'
import { PlayerAttentionRiskDashboard } from '@/components/assistant/PlayerAttentionRiskDashboard'
import { GroupHealthReviewDashboard } from '@/components/assistant/GroupHealthReviewDashboard'
import { CoachSupportNeededDashboard } from '@/components/assistant/CoachSupportNeededDashboard'
import { ParentTrustCoverageDashboard } from '@/components/assistant/ParentTrustCoverageDashboard'
import { CurriculumBottleneckDashboard } from '@/components/assistant/CurriculumBottleneckDashboard'
import {
  DEMO_COMMAND_BRIEF_DATA,
  DEMO_COO_REPORT_DATA,
  DEMO_PLAYER_ATTENTION_RISK,
  DEMO_GROUP_HEALTH,
  DEMO_COACH_SUPPORT,
  DEMO_PARENT_COVERAGE,
  DEMO_CURRICULUM_BOTTLENECKS,
  DEMO_SEED_MARKER,
} from '@/lib/donna/donnaDemoSeed'
import { getStatusLabel, getStatusDot } from '@/lib/donna/cooDataStatus'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'

// ── Section nav ───────────────────────────────────────────────────────────────

type DemoSection =
  | 'command_brief'
  | 'coo_report'
  | 'player_attention'
  | 'group_health'
  | 'coach_support'
  | 'parent_coverage'
  | 'curriculum'

const SECTIONS: { id: DemoSection; label: string; dataStatus: COOFieldStatus }[] = [
  { id: 'command_brief', label: 'Command Brief', dataStatus: 'partial' },
  { id: 'coo_report', label: 'COO Report', dataStatus: 'partial' },
  { id: 'player_attention', label: 'Player Attention', dataStatus: 'partial' },
  { id: 'group_health', label: 'Group Health', dataStatus: 'partial' },
  { id: 'coach_support', label: 'Coach Support', dataStatus: 'partial' },
  { id: 'parent_coverage', label: 'Parent Coverage', dataStatus: 'blocked_by_schema' },
  { id: 'curriculum', label: 'Curriculum', dataStatus: 'blocked_by_schema' },
]

// ── Data sufficiency badge ────────────────────────────────────────────────────

function DataSufficiencyBadge({ status }: { status: COOFieldStatus }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusDot(status)}`} />
      <span className="text-[10px] text-text-muted">{getStatusLabel(status)}</span>
    </span>
  )
}

// ── Demo banner ───────────────────────────────────────────────────────────────

function DemoBanner() {
  return (
    <div className="bg-status-blue/10 border border-status-blue/30 rounded-xl px-4 py-3 mb-6">
      <p className="text-[11px] text-status-blue font-mono">{DEMO_SEED_MARKER}</p>
      <p className="text-[12px] text-status-blue mt-0.5">
        This page uses demo seed data only. No real player, coach, or session data is shown.
        Nothing on this page writes to the database.
      </p>
    </div>
  )
}

// ── Section nav pills ─────────────────────────────────────────────────────────

function SectionNav({
  active,
  onChange,
}: {
  active: DemoSection
  onChange: (s: DemoSection) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {SECTIONS.map(s => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border transition-colors ${
            active === s.id
              ? 'bg-lime text-black border-lime font-semibold'
              : 'bg-surface-raised text-text-muted border-border hover:text-text-secondary'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusDot(s.dataStatus)}`} />
          {s.label}
        </button>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DonnaCOODemoPage() {
  // Phase 0: hardcoded demo-seed walkthrough — kept out of the production director
  // portal (the labelled product demo lives at /director/demo). Non-production only.
  if (process.env.NODE_ENV === 'production') notFound()

  const [activeSection, setActiveSection] = useState<DemoSection>('command_brief')

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
          DONNA COO Intelligence — Demo Walkthrough
        </p>
        <h1 className="text-2xl font-semibold text-text-primary">Sprint 509 Demo</h1>
        <p className="text-sm text-text-muted mt-1">
          All 7 COO dashboard components using demo seed data.
        </p>
      </div>

      <DemoBanner />

      <SectionNav active={activeSection} onChange={setActiveSection} />

      {/* Command Brief */}
      {activeSection === 'command_brief' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="label-xs">Daily Command Brief</p>
            <DataSufficiencyBadge status="partial" />
          </div>
          <div>
            <DonnaCommandBriefIntegration
              data={DEMO_COMMAND_BRIEF_DATA}
              onOpenReviewQueue={() => setActiveSection('player_attention')}
              onDismiss={() => {}}
            />
          </div>
        </div>
      )}

      {/* COO Weekly Report */}
      {activeSection === 'coo_report' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="label-xs">Weekly COO Report</p>
            <DataSufficiencyBadge status="partial" />
          </div>
          <DonnaCOOWeeklyReport data={DEMO_COO_REPORT_DATA} />
        </div>
      )}

      {/* Player Attention Risk */}
      {activeSection === 'player_attention' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="label-xs">Player Attention Risk</p>
            <DataSufficiencyBadge status="partial" />
          </div>
          <PlayerAttentionRiskDashboard
            players={DEMO_PLAYER_ATTENTION_RISK}
            overallSeverity="warning"
            onViewPlayer={(id, name) => console.log('View player:', id, name)}
          />
        </div>
      )}

      {/* Group Health */}
      {activeSection === 'group_health' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="label-xs">Group Health Review</p>
            <DataSufficiencyBadge status="partial" />
          </div>
          <GroupHealthReviewDashboard
            groups={DEMO_GROUP_HEALTH}
            overallSeverity="warning"
            onViewGroup={(id, name) => console.log('View group:', id, name)}
          />
        </div>
      )}

      {/* Coach Support */}
      {activeSection === 'coach_support' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="label-xs">Coach Support Needed</p>
            <DataSufficiencyBadge status="partial" />
          </div>
          <CoachSupportNeededDashboard
            coaches={DEMO_COACH_SUPPORT}
            overallSeverity="warning"
            onViewCoach={(id, name) => console.log('View coach:', id, name)}
          />
        </div>
      )}

      {/* Parent Coverage */}
      {activeSection === 'parent_coverage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="label-xs">Parent Trust Coverage</p>
            <DataSufficiencyBadge status="blocked_by_schema" />
          </div>
          <div className="bg-surface-raised border border-border rounded-xl px-4 py-3 text-[12px] text-text-muted">
            Live data blocked — requires <code className="font-mono text-status-orange">proposed_actions.applied_at</code> and a parent contact history table (pending migration).
          </div>
          <ParentTrustCoverageDashboard
            entries={DEMO_PARENT_COVERAGE}
            overallSeverity="warning"
            onDraftParentUpdate={(id, name) => console.log('Draft parent update for:', id, name)}
          />
        </div>
      )}

      {/* Curriculum Bottlenecks */}
      {activeSection === 'curriculum' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="label-xs">Curriculum Bottlenecks</p>
            <DataSufficiencyBadge status="blocked_by_schema" />
          </div>
          <div className="bg-surface-raised border border-border rounded-xl px-4 py-3 text-[12px] text-text-muted">
            Live data blocked — requires <code className="font-mono text-status-orange">curriculum_requirements</code> and <code className="font-mono text-status-orange">player_curriculum_levels</code> tables (migrations 041–044 pending).
          </div>
          <CurriculumBottleneckDashboard
            bottlenecks={DEMO_CURRICULUM_BOTTLENECKS}
            overallSeverity="critical"
            onViewCurriculumPanel={() => console.log('View curriculum panel')}
          />
        </div>
      )}

      {/* Sprint info footer */}
      <div className="mt-8 pt-4 border-t border-border">
        <p className="text-[10px] text-text-muted">
          Sprint 523 — COO Dashboard Data Sufficiency UI Pass V1 · Sprints 461–523 · 2026-05-17
        </p>
        <p className="text-[10px] text-text-muted">
          All data is demo-only. No DB reads or writes from this page.
        </p>
      </div>
    </div>
  )
}
