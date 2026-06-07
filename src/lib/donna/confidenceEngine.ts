// Confidence Engine — derives DONNA confidence level and plain-language evidence summary
// from data point counts. Used by all DONNA recommendation surfaces.
//
// Rules:
//   - Never fabricate confidence. If data is thin, say so.
//   - Evidence summary is always plain language — never field names.
//   - Confidence translates directly into tone: High = assertion, Low = observation.

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface ConfidenceSignal {
  confidence: ConfidenceLevel
  evidenceSummary: string
}

interface DeriveInput {
  recordCount: number
  windowDays?: number
  label?: string
}

export function deriveConfidence({
  recordCount,
  windowDays,
  label = 'records',
}: DeriveInput): ConfidenceSignal {
  const windowPhrase = windowDays ? ` over ${windowDays} days` : ''

  if (recordCount >= 10) {
    return {
      confidence: 'high',
      evidenceSummary: `Based on ${recordCount} ${label}${windowPhrase}`,
    }
  }
  if (recordCount >= 4) {
    return {
      confidence: 'medium',
      evidenceSummary: `Based on ${recordCount} ${label}${windowPhrase}`,
    }
  }
  if (recordCount >= 1) {
    return {
      confidence: 'low',
      evidenceSummary: `Only ${recordCount} ${label} recorded — signal will strengthen as more data accumulates`,
    }
  }
  return {
    confidence: 'low',
    evidenceSummary: 'Insufficient data — this signal will sharpen as sessions accumulate',
  }
}

export function factualConfidence(description: string): ConfidenceSignal {
  return { confidence: 'high', evidenceSummary: description }
}

export function inferredConfidence(description: string): ConfidenceSignal {
  return { confidence: 'medium', evidenceSummary: description }
}

export function earlySignalConfidence(description: string): ConfidenceSignal {
  return { confidence: 'low', evidenceSummary: description }
}
