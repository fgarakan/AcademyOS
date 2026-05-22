'use client'

// Sprint 633 — Approval Preview Card V1
// Client component — no DB calls, no mutations.
// Shows the director an exact outcome preview BEFORE they click approve.
// No hidden mutations — every consequence is surfaced before the action.

import { ShieldCheck, AlertTriangle, Eye, Database, Bell, Undo2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui'
import type { ApprovalPreview } from '@/lib/review/approvalPreview'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ApprovalPreviewCardProps {
  preview: ApprovalPreview
  className?: string
}

// ── Safety class styles ───────────────────────────────────────────────────────

function safetyBorderColor(safetyClass: ApprovalPreview['safetyClass']): string {
  if (safetyClass === 'high_visibility_risk') return 'border-status-red/30'
  if (safetyClass === 'irreversible') return 'border-status-orange/30'
  return 'border-border'
}

function safetyHeaderColor(safetyClass: ApprovalPreview['safetyClass']): string {
  if (safetyClass === 'high_visibility_risk') return 'text-status-red'
  if (safetyClass === 'irreversible') return 'text-status-orange'
  return 'text-lime'
}

function safetyHeaderText(safetyClass: ApprovalPreview['safetyClass']): string {
  if (safetyClass === 'high_visibility_risk') return 'High Visibility Risk — Review Carefully'
  if (safetyClass === 'irreversible') return 'Two-Step Approval — Apply Step Required'
  return 'Approval Preview'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ApprovalPreviewCard({ preview, className = '' }: ApprovalPreviewCardProps) {
  return (
    <Card className={cn('border', safetyBorderColor(preview.safetyClass), className)}>
      <CardContent className="py-4 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-2">
          {preview.safetyClass === 'high_visibility_risk' ? (
            <AlertTriangle className="w-3.5 h-3.5 text-status-red shrink-0" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-lime shrink-0" />
          )}
          <p className={cn('text-[10px] uppercase tracking-widest font-semibold', safetyHeaderColor(preview.safetyClass))}>
            {safetyHeaderText(preview.safetyClass)}
          </p>
        </div>

        {/* Database object */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-muted font-semibold">
            <Database className="w-3 h-3" />
            <span>What changes</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-snug pl-4">{preview.databaseObjectAffected}</p>
        </div>

        {/* Applies immediately or next step */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-muted font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>When it takes effect</span>
          </div>
          <p className={cn('text-[11px] leading-snug pl-4', preview.appliesImmediately ? 'text-text-secondary' : 'text-status-orange font-medium')}>
            {preview.immediateOrNextStep}
          </p>
        </div>

        {/* Visibility */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-muted font-semibold">
            <Eye className="w-3 h-3" />
            <span>Parent / Player visibility</span>
          </div>
          <p className={cn('text-[11px] leading-snug pl-4', preview.safetyClass === 'high_visibility_risk' ? 'text-status-red font-medium' : 'text-text-secondary')}>
            {preview.parentPlayerVisibility}
          </p>
        </div>

        {/* Notification */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-muted font-semibold">
            <Bell className="w-3 h-3" />
            <span>Notifications</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-snug pl-4">{preview.notificationNote}</p>
        </div>

        {/* Will NOT happen automatically */}
        {preview.willNotHappenAutomatically.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Will NOT happen automatically</p>
            <div className="space-y-1 pl-2">
              {preview.willNotHappenAutomatically.map((item, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-text-muted">
                  <span className="shrink-0 text-status-red mt-0.5">✗</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit log */}
        {preview.auditLogRequired && (
          <div className="flex items-start gap-2 text-[10px] text-text-muted">
            <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5 text-status-green" />
            <span>{preview.auditLogNote}</span>
          </div>
        )}

        {/* Rollback */}
        <div className="flex items-start gap-2 text-[10px] text-text-muted">
          <Undo2 className="w-3 h-3 shrink-0 mt-0.5" />
          <span>{preview.rollbackNote}</span>
        </div>

      </CardContent>
    </Card>
  )
}
