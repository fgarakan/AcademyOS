// Sprint 1034 — DONNA Multi Source Answer Formatting V1
// Formats DONNA answers for display: combines text, source labels, confidence.
// Supports: bullet lists, paragraph answers, short answers, multi-source answers.
// Applies confidence prefixes and source attribution consistently.
// No DB calls. No DB writes.

import type { DONNAConfidence } from '@/lib/donna/donnaCOOAnswerEngine'
import type { DonnaSourceLabel } from '@/lib/donna/donnaSourceLabels'
import type { ChatMessage } from '@/components/donna/DonnaChatThread'
import { getConfidencePrefix } from '@/lib/donna/donnaConfidence'
import { getSourceLabelText } from '@/lib/donna/donnaSourceLabels'

// ── Answer format types ───────────────────────────────────────────────────────

export type DonnaAnswerFormat =
  | 'short'       // Single sentence, direct answer
  | 'paragraph'   // 2-3 sentences with context
  | 'bullets'     // Bullet list of items
  | 'count'       // "X items / X players / X sessions"
  | 'status'      // "Clear" / "Warning" / "At risk"
  | 'unavailable' // Cannot answer

// ── Answer component ──────────────────────────────────────────────────────────

export interface DonnaAnswerComponent {
  format: DonnaAnswerFormat
  text: string
  bullets?: string[]
  count?: number
  countLabel?: string
  confidence: DONNAConfidence
  sourceLabels: DonnaSourceLabel[]
  followUp?: string
  followUpHref?: string
}

// ── Built answer ──────────────────────────────────────────────────────────────

export interface FormattedDonnaAnswer {
  displayText: string
  confidence: DONNAConfidence
  sourceNote: string | null
  followUp: string | null
  followUpHref: string | null
  hasMultipleSources: boolean
}

// ── Formatters ────────────────────────────────────────────────────────────────

function formatShortAnswer(component: DonnaAnswerComponent): string {
  const prefix = getConfidencePrefix(component.confidence)
  return prefix + component.text
}

function formatParagraphAnswer(component: DonnaAnswerComponent): string {
  const prefix = getConfidencePrefix(component.confidence)
  return prefix + component.text
}

function formatBulletAnswer(component: DonnaAnswerComponent): string {
  const prefix = getConfidencePrefix(component.confidence)
  if (!component.bullets || component.bullets.length === 0) {
    return prefix + component.text
  }

  const intro = component.text ? `${prefix}${component.text}\n` : ''
  const lines = component.bullets.map(b => `• ${b}`).join('\n')
  return intro + lines
}

function formatCountAnswer(component: DonnaAnswerComponent): string {
  const prefix = getConfidencePrefix(component.confidence)
  const count = component.count ?? 0
  const label = component.countLabel ?? 'item'
  const pluralLabel = count === 1 ? label : `${label}s`
  return prefix + `${count} ${pluralLabel}. ${component.text || ''}`.trim()
}

function formatStatusAnswer(component: DonnaAnswerComponent): string {
  const prefix = getConfidencePrefix(component.confidence)
  return prefix + component.text
}

function formatUnavailableAnswer(component: DonnaAnswerComponent): string {
  return component.text || "I don't have that information available right now."
}

// ── Source note builder ───────────────────────────────────────────────────────

function buildSourceNote(labels: DonnaSourceLabel[]): string | null {
  if (labels.length === 0) return null
  if (labels.length === 1) return getSourceLabelText(labels[0])
  const liveLabels = labels.filter(l => l.fieldStatus === 'live')
  if (liveLabels.length === labels.length) return 'Live data'
  if (liveLabels.length > 0) return `Live data + ${labels.length - liveLabels.length} partial source${labels.length - liveLabels.length > 1 ? 's' : ''}`
  return 'Partial data'
}

// ── Main formatter ────────────────────────────────────────────────────────────

export function formatDonnaAnswer(component: DonnaAnswerComponent): FormattedDonnaAnswer {
  let displayText: string

  switch (component.format) {
    case 'short': displayText = formatShortAnswer(component); break
    case 'paragraph': displayText = formatParagraphAnswer(component); break
    case 'bullets': displayText = formatBulletAnswer(component); break
    case 'count': displayText = formatCountAnswer(component); break
    case 'status': displayText = formatStatusAnswer(component); break
    case 'unavailable': displayText = formatUnavailableAnswer(component); break
    default: displayText = component.text
  }

  return {
    displayText,
    confidence: component.confidence,
    sourceNote: buildSourceNote(component.sourceLabels),
    followUp: component.followUp ?? null,
    followUpHref: component.followUpHref ?? null,
    hasMultipleSources: component.sourceLabels.length > 1,
  }
}

// ── Multi-source answer combiner ──────────────────────────────────────────────

export function combineAnswerComponents(
  components: DonnaAnswerComponent[],
  separator = '\n\n',
): FormattedDonnaAnswer {
  if (components.length === 0) {
    return {
      displayText: "I don't have enough information to answer that right now.",
      confidence: 'insufficient',
      sourceNote: null,
      followUp: null,
      followUpHref: null,
      hasMultipleSources: false,
    }
  }

  if (components.length === 1) return formatDonnaAnswer(components[0])

  const parts = components.map(c => formatDonnaAnswer(c))
  const displayText = parts.map(p => p.displayText).join(separator)

  const allSourceLabels = components.flatMap(c => c.sourceLabels)
  const combinedSourceNote = buildSourceNote(allSourceLabels)

  const lastFollowUp = [...parts].reverse().find(p => p.followUp)

  // Use lowest confidence from all components
  const CONFIDENCE_ORDER: Record<DONNAConfidence, number> = {
    blocked: 0, insufficient: 1, partial: 2, high: 3,
  }
  const lowestConfidence = components.reduce<DONNAConfidence>((min, c) => {
    return CONFIDENCE_ORDER[c.confidence] < CONFIDENCE_ORDER[min] ? c.confidence : min
  }, 'high')

  return {
    displayText,
    confidence: lowestConfidence,
    sourceNote: combinedSourceNote,
    followUp: lastFollowUp?.followUp ?? null,
    followUpHref: lastFollowUp?.followUpHref ?? null,
    hasMultipleSources: allSourceLabels.length > 1,
  }
}

// ── Chat message builder ──────────────────────────────────────────────────────

export function buildChatMessageFromFormatted(
  answer: FormattedDonnaAnswer,
  actionId = 'unknown',
): ChatMessage {
  return {
    id: `donna-${actionId}-${Date.now()}`,
    role: 'donna',
    kind: 'answer',
    text: answer.displayText,
    timestamp: new Date().toISOString(),
    confidence: answer.confidence,
    sourceNote: answer.sourceNote ?? undefined,
    followUp: answer.followUp ?? undefined,
    followUpHref: answer.followUpHref ?? undefined,
  }
}

// ── Quick answer builders ─────────────────────────────────────────────────────

export function buildCountAnswer(
  count: number,
  label: string,
  context: string,
  confidence: DONNAConfidence,
  sourceLabels: DonnaSourceLabel[] = [],
): DonnaAnswerComponent {
  return {
    format: 'count',
    text: context,
    count,
    countLabel: label,
    confidence,
    sourceLabels,
  }
}

export function buildBulletAnswer(
  intro: string,
  bullets: string[],
  confidence: DONNAConfidence,
  sourceLabels: DonnaSourceLabel[] = [],
): DonnaAnswerComponent {
  return {
    format: 'bullets',
    text: intro,
    bullets,
    confidence,
    sourceLabels,
  }
}

export function buildUnavailableAnswer(
  reason: string,
  sourceLabels: DonnaSourceLabel[] = [],
): DonnaAnswerComponent {
  return {
    format: 'unavailable',
    text: reason,
    confidence: 'insufficient',
    sourceLabels,
  }
}
