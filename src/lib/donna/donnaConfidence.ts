// Sprint 1018 — DONNA Confidence Unknown State Logic V1
// Confidence derivation and unknown-state handling for all DONNA answers.
// Centralizes confidence logic so every DONNA answer surface uses consistent rules.
// No DB calls. No DB writes.

import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'
import type { DONNAConfidence } from '@/lib/donna/donnaCOOAnswerEngine'

// ── Re-export for convenience ─────────────────────────────────────────────────

export type { DONNAConfidence }

// ── Confidence reason ─────────────────────────────────────────────────────────

export type ConfidenceReason =
  | 'all_live'
  | 'some_partial'
  | 'no_data_yet'
  | 'schema_blocked'
  | 'rls_blocked'
  | 'demo_fallback'
  | 'stale_data'
  | 'mixed'

export interface ConfidenceResult {
  confidence: DONNAConfidence
  reason: ConfidenceReason
  label: string
  detail: string | null
  isAnswerable: boolean
}

// ── Labels per confidence level ───────────────────────────────────────────────

const CONFIDENCE_LABELS: Record<DONNAConfidence, string> = {
  high: 'Live data',
  partial: 'Partial data',
  insufficient: 'No data yet',
  blocked: 'Blocked',
}

const CONFIDENCE_COLORS: Record<DONNAConfidence, string> = {
  high: 'text-status-green',
  partial: 'text-status-orange',
  insufficient: 'text-text-muted',
  blocked: 'text-status-red',
}

const CONFIDENCE_DOT_COLORS: Record<DONNAConfidence, string> = {
  high: 'bg-status-green',
  partial: 'bg-status-orange',
  insufficient: 'bg-text-muted',
  blocked: 'bg-status-red',
}

// ── Derivation from field statuses ────────────────────────────────────────────

export function deriveConfidenceFromStatuses(
  statuses: COOFieldStatus[],
): ConfidenceResult {
  if (statuses.length === 0) {
    return {
      confidence: 'insufficient',
      reason: 'no_data_yet',
      label: CONFIDENCE_LABELS.insufficient,
      detail: 'No data sources available.',
      isAnswerable: false,
    }
  }

  const hasRLSBlock = statuses.some(s => s === 'blocked_by_rls')
  const hasSchemaBlock = statuses.some(s => s === 'blocked_by_schema')
  const hasInsufficientData = statuses.some(s => s === 'insufficient_data')
  const allLive = statuses.every(s => s === 'live')
  const someLive = statuses.some(s => s === 'live')

  if (hasRLSBlock) {
    return {
      confidence: 'blocked',
      reason: 'rls_blocked',
      label: CONFIDENCE_LABELS.blocked,
      detail: 'Access restricted — insufficient permissions for this data.',
      isAnswerable: false,
    }
  }

  if (hasSchemaBlock) {
    return {
      confidence: 'blocked',
      reason: 'schema_blocked',
      label: CONFIDENCE_LABELS.blocked,
      detail: 'Schema migration pending — this data will be available after the migration is applied.',
      isAnswerable: false,
    }
  }

  if (allLive) {
    return {
      confidence: 'high',
      reason: 'all_live',
      label: CONFIDENCE_LABELS.high,
      detail: null,
      isAnswerable: true,
    }
  }

  if (someLive && hasInsufficientData) {
    return {
      confidence: 'partial',
      reason: 'mixed',
      label: CONFIDENCE_LABELS.partial,
      detail: 'Some data sources are unavailable — answer based on available data only.',
      isAnswerable: true,
    }
  }

  if (someLive) {
    return {
      confidence: 'partial',
      reason: 'some_partial',
      label: CONFIDENCE_LABELS.partial,
      detail: 'Not all data sources are live.',
      isAnswerable: true,
    }
  }

  return {
    confidence: 'insufficient',
    reason: 'no_data_yet',
    label: CONFIDENCE_LABELS.insufficient,
    detail: 'No live data available — this will populate as the academy is used.',
    isAnswerable: false,
  }
}

// ── Unknown state messages ────────────────────────────────────────────────────

export interface UnknownStateMessage {
  headline: string
  detail: string
  action: string | null
}

export function getUnknownStateMessage(
  confidence: DONNAConfidence,
  reason: ConfidenceReason,
  topicLabel: string,
): UnknownStateMessage {
  switch (reason) {
    case 'rls_blocked':
      return {
        headline: `${topicLabel} — access restricted`,
        detail: 'Your role does not have permission to view this data.',
        action: null,
      }

    case 'schema_blocked':
      return {
        headline: `${topicLabel} — migration pending`,
        detail: 'This feature requires a schema migration that has not been applied yet.',
        action: 'Apply pending migrations to enable this signal.',
      }

    case 'no_data_yet':
      return {
        headline: `No ${topicLabel.toLowerCase()} data yet`,
        detail: 'This will populate as coaches and players use the system.',
        action: 'Complete some sessions and wrap-ups to see data here.',
      }

    case 'demo_fallback':
      return {
        headline: `${topicLabel} — demo data`,
        detail: 'Showing demo data — not from your live academy.',
        action: 'Connect a live academy to see real data.',
      }

    case 'stale_data':
      return {
        headline: `${topicLabel} may be out of date`,
        detail: 'This data was last updated some time ago and may not reflect current state.',
        action: 'Refresh or re-check the data.',
      }

    case 'some_partial':
    case 'mixed':
      return {
        headline: `${topicLabel} — partial data`,
        detail: 'Some data sources are unavailable. Answer is based on available data only.',
        action: null,
      }

    case 'all_live':
    default:
      return {
        headline: topicLabel,
        detail: 'Live data from your academy.',
        action: null,
      }
  }
}

// ── Confidence-aware answer prefix ────────────────────────────────────────────

export function getConfidencePrefix(confidence: DONNAConfidence): string {
  switch (confidence) {
    case 'high': return ''
    case 'partial': return 'Based on available data: '
    case 'insufficient': return 'No data yet — '
    case 'blocked': return 'Unable to answer — '
  }
}

// ── Convenience accessors ─────────────────────────────────────────────────────

export function getConfidenceLabel(confidence: DONNAConfidence): string {
  return CONFIDENCE_LABELS[confidence]
}

export function getConfidenceColor(confidence: DONNAConfidence): string {
  return CONFIDENCE_COLORS[confidence]
}

export function getConfidenceDotColor(confidence: DONNAConfidence): string {
  return CONFIDENCE_DOT_COLORS[confidence]
}

export function isAnswerable(confidence: DONNAConfidence): boolean {
  return confidence === 'high' || confidence === 'partial'
}

// ── Confidence downgrade logic ────────────────────────────────────────────────
// Used when combining multiple context sources — always takes the lowest confidence.

export function mergeConfidence(...confidences: DONNAConfidence[]): DONNAConfidence {
  const ORDER: Record<DONNAConfidence, number> = {
    blocked: 0,
    insufficient: 1,
    partial: 2,
    high: 3,
  }
  return confidences.reduce<DONNAConfidence>((min, c) => {
    return ORDER[c] < ORDER[min] ? c : min
  }, 'high')
}
