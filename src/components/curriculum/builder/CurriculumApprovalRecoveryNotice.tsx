/**
 * CurriculumApprovalRecoveryNotice — Sprint 907
 *
 * Pure display component. Renders a calm, secondary recovery notice when
 * any academy_curriculum_overrides rows are stuck in status='approved'
 * longer than the safe threshold (10 minutes).
 *
 * This is a visibility-only layer. No actions, no mutations, no buttons.
 * Directors see it as "needs review" — not "system is broken."
 *
 * Returns null (renders nothing) when items is empty. The parent
 * CurriculumBuilderChangeQueue only passes items when the recovery query
 * returns results, so the card is fully hidden in the normal case.
 *
 * Does NOT call execute_curriculum_override().
 * Does NOT use proposed_actions.
 * Does NOT mutate any rows.
 * Read-only.
 *
 * Related:
 *   src/app/director/curriculum/builder/CurriculumBuilderChangeQueue.tsx — passes items
 *   src/lib/actions/curriculumOverrideApprovalActions.ts — approval action that writes
 *     curriculum_override.approve_cleanup audit entries on failure (Sprint 906)
 *   supabase/migrations/048_academy_curriculum_clone.sql — override table schema
 */

import { AlertTriangle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApprovalRecoveryItem {
  /** UUID of the academy_curriculum_overrides row */
  id: string
  /** Extracted from proposed_change->>'title' or raw_input fallback */
  title: string
  /** Extracted from proposed_change->>'content_type' */
  contentType: string | null
  /** approved_at ISO string — when the row was marked approved */
  approvedAt: string | null
  /** created_at ISO string */
  createdAt: string
  /** Extracted from proposed_change->>'description' */
  description: string | null
}

interface Props {
  items: ApprovalRecoveryItem[]
}

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatContentType(ct: string | null): string | null {
  if (!ct) return null
  const map: Record<string, string> = {
    drill:       'Drill',
    fitness:     'Fitness exercise',
    assessment:  'Assessment gate',
    game:        'Game',
    skill:       'Skill',
    warmup:      'Warmup',
    cooldown:    'Cooldown',
    tactical:    'Tactical',
    competition: 'Competition',
  }
  return map[ct] ?? ct
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CurriculumApprovalRecoveryNotice({ items }: Props) {
  // Hidden entirely when no stuck rows — no empty state card
  if (items.length === 0) return null

  return (
    <div
      className="rounded-xl space-y-2.5 px-3 py-3"
      style={{
        border:     '1px solid rgba(255,149,0,0.15)',
        background: 'rgba(255,149,0,0.03)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-status-orange">
          Needs Review
        </p>
      </div>

      <p className="text-[10px] text-text-muted leading-relaxed">
        Some approved curriculum drafts may need review.
      </p>

      {/* Items */}
      <div className="space-y-1.5">
        {items.map(item => {
          const displayContentType = formatContentType(item.contentType)
          const dateStr = item.approvedAt
            ? new Date(item.approvedAt).toLocaleDateString()
            : new Date(item.createdAt).toLocaleDateString()

          return (
            <div
              key={item.id}
              className="rounded-lg px-2.5 py-2 space-y-1"
              style={{
                background: 'rgba(0,0,0,0.20)',
                border:     '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {/* Title */}
              <p className="text-[10px] font-medium text-text-secondary leading-snug line-clamp-2">
                {item.title}
              </p>

              {/* Badges + date */}
              <div className="flex flex-wrap items-center gap-1">
                {displayContentType && (
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border:     '1px solid rgba(255,255,255,0.08)',
                      color:      '#AAAAAA',
                    }}
                  >
                    {displayContentType}
                  </span>
                )}
                <span className="text-[9px] text-text-muted">{dateStr}</span>
              </div>

              {/* Description (optional) */}
              {item.description && (
                <p className="text-[9px] text-text-muted leading-relaxed line-clamp-1">
                  {item.description}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer guidance */}
      <p className="text-[9px] text-text-muted leading-relaxed pt-0.5">
        These drafts were approved, but I haven&apos;t confirmed that they finished
        applying yet. Leave them for now or ask an admin to review.
      </p>
    </div>
  )
}
