'use client'

import { useState } from 'react'
import { Eye, MessageSquare, Shield, Star, AlertTriangle, Copy, Check } from 'lucide-react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card'
import type { CurriculumChangeScopeId } from '@/lib/curriculum/curriculumChangeScope'
import { SCOPE_BY_ID } from '@/lib/curriculum/curriculumChangeScope'

// ── Types ─────────────────────────────────────────────────────────────────────

export type LanguageAudience = 'internal' | 'parent' | 'player'

export interface CurriculumLanguagePanel {
  audience: LanguageAudience
  headline: string
  body: string
  tone: string
  safetyNote: string | null
  isApproved: boolean
}

export interface CurriculumLanguagePreviewData {
  scopeId: CurriculumChangeScopeId
  changeLabel: string
  internal: CurriculumLanguagePanel
  parent: CurriculumLanguagePanel
  player: CurriculumLanguagePanel
  notSentNote: string
  generatedAt: string
}

// ── Audience tab config ───────────────────────────────────────────────────────

const AUDIENCE_CONFIG: Record<LanguageAudience, {
  label: string
  icon: React.ReactNode
  accentClass: string
  badgeClass: string
}> = {
  internal: {
    label: 'Internal / Staff',
    icon: <Shield size={13} />,
    accentClass: 'text-status-blue',
    badgeClass: 'bg-status-blue/10 border-status-blue/30 text-status-blue',
  },
  parent: {
    label: 'Parent-safe',
    icon: <MessageSquare size={13} />,
    accentClass: 'text-status-green',
    badgeClass: 'bg-status-green/10 border-status-green/30 text-status-green',
  },
  player: {
    label: 'Player mission',
    icon: <Star size={13} />,
    accentClass: 'text-lime',
    badgeClass: 'bg-lime/10 border-lime/30 text-lime',
  },
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary border border-border rounded px-2 py-0.5 hover:border-border transition-colors"
    >
      {copied ? <Check size={10} className="text-lime" /> : <Copy size={10} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ── Panel component ───────────────────────────────────────────────────────────

function LanguagePanelView({ panel }: { panel: CurriculumLanguagePanel }) {
  const cfg = AUDIENCE_CONFIG[panel.audience]

  return (
    <div className="space-y-3">
      {/* Audience badge */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest border rounded px-2 py-0.5 ${cfg.badgeClass}`}>
          {cfg.icon}
          {cfg.label}
        </span>
        <span className="text-[10px] text-text-muted">Tone: {panel.tone}</span>
      </div>

      {/* Headline */}
      <div>
        <p className="label-xs mb-1">Headline</p>
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-snug ${cfg.accentClass}`}>{panel.headline}</p>
          <CopyButton text={panel.headline} />
        </div>
      </div>

      {/* Body */}
      <div>
        <p className="label-xs mb-1">Body</p>
        <div className="flex items-start gap-2">
          <p className="text-xs text-text-secondary leading-relaxed flex-1 bg-surface-raised border border-border rounded-lg px-3 py-2">
            {panel.body}
          </p>
        </div>
        <div className="flex justify-end mt-1">
          <CopyButton text={`${panel.headline}\n\n${panel.body}`} />
        </div>
      </div>

      {/* Safety note */}
      {panel.safetyNote && (
        <div className="flex items-start gap-1.5 text-[11px] text-status-orange bg-status-orange/5 border border-status-orange/20 rounded-lg px-3 py-2">
          <AlertTriangle size={11} className="shrink-0 mt-0.5" />
          {panel.safetyNote}
        </div>
      )}

      {/* Approval state */}
      {!panel.isApproved && (
        <div className="text-[11px] text-text-muted italic">
          Director review required before this language can be used.
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface CurriculumLanguagePreviewProps {
  data: CurriculumLanguagePreviewData
  className?: string
}

export function CurriculumLanguagePreview({ data, className }: CurriculumLanguagePreviewProps) {
  const [activeAudience, setActiveAudience] = useState<LanguageAudience>('internal')
  const scopeDef = SCOPE_BY_ID[data.scopeId]

  const panels: Record<LanguageAudience, CurriculumLanguagePanel> = {
    internal: data.internal,
    parent: data.parent,
    player: data.player,
  }

  const activePanel = panels[activeAudience]

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="label-xs mb-1">Curriculum Language Preview</p>
              <p className="text-text-primary font-medium text-sm">{data.changeLabel}</p>
              <p className="text-xs text-text-muted mt-0.5">Scope: {scopeDef?.label ?? data.scopeId}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-text-muted border border-border rounded px-1.5 py-0.5">
              <Eye size={9} />
              Not sent
            </span>
          </div>

          {/* Audience tabs */}
          <div className="flex gap-1">
            {(['internal', 'parent', 'player'] as LanguageAudience[]).map(audience => {
              const cfg = AUDIENCE_CONFIG[audience]
              const isActive = audience === activeAudience
              return (
                <button
                  key={audience}
                  onClick={() => setActiveAudience(audience)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    isActive
                      ? `${cfg.badgeClass} font-medium`
                      : 'text-text-muted border-border hover:border-text-muted hover:text-text-secondary'
                  }`}
                >
                  {cfg.icon}
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </CardHeader>

        <CardContent>
          <LanguagePanelView panel={activePanel} />
        </CardContent>

        <CardFooter>
          <div className="space-y-1">
            <p className="text-[11px] text-text-muted">
              {data.notSentNote}
            </p>
            <p className="text-[10px] text-text-muted italic">
              Generated {new Date(data.generatedAt).toLocaleString()} — preview only.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

// ── Factory helper ────────────────────────────────────────────────────────────
// Creates a placeholder preview for a curriculum change when no DB data is available.

export function buildPlaceholderLanguagePreview(
  scopeId: CurriculumChangeScopeId,
  changeLabel: string,
): CurriculumLanguagePreviewData {
  return {
    scopeId,
    changeLabel,
    internal: {
      audience: 'internal',
      headline: `Curriculum update: ${changeLabel}`,
      body: 'This change has been proposed to the curriculum. Review the impact preview and approve before applying.',
      tone: 'Factual',
      safetyNote: null,
      isApproved: false,
    },
    parent: {
      audience: 'parent',
      headline: `Your child's program is evolving`,
      body: `We're refining our curriculum to help players develop more effectively. This update supports continued progress at their current level.`,
      tone: 'Warm, reassuring',
      safetyNote: 'Do not publish until director reviews and approves this language.',
      isApproved: false,
    },
    player: {
      audience: 'player',
      headline: 'New challenge unlocked',
      body: `We're updating your training focus to help you level up faster. Stay focused, keep working on the fundamentals, and ask your coach about what's new in your program.`,
      tone: 'Motivating, mission-style',
      safetyNote: 'Do not show to player until director approves.',
      isApproved: false,
    },
    notSentNote: 'This language has not been sent to parents or players. Director review and approval required before any publication.',
    generatedAt: new Date().toISOString(),
  }
}
