// Sprint 628 — DONNA Director Action Preview V1
// Before DONNA drafts, routes, or prepares any sensitive action, show the director a
// clear structured preview: what will happen, what will not happen, who is affected,
// approval required, parent/player visibility impact, safety classification.
// Pure TypeScript — no DB calls, no mutations, no AI calls, no UI imports.

import { classifyDirectorIntent } from '@/lib/donna/donnaIntentClassifier'
import type { DonnaDirectorIntent } from '@/lib/donna/donnaIntentClassifier'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// ── Structured preview shape ──────────────────────────────────────────────────

export interface DirectorActionPreview {
  title: string
  summary: string
  willHappen: string[]
  willNotHappen: string[]
  affectedObjectLabel: string
  affectedRoleOrAudience: string
  approvalRequirement: string
  visibilityImpact: string
  safetyClass: 'safe' | 'needs_review' | 'blocked'
  confidence: 'high' | 'partial'
  nextStepLabel: string
}

// ── Visibility risk label ─────────────────────────────────────────────────────

export function getActionPreviewVisibilityRisk(intent: DonnaDirectorIntent): string {
  switch (intent) {
    case 'parent_summary':
      return 'Parent/player visible after director approval only'
    case 'level_movement':
      return 'No parent/player notification until separately approved'
    case 'assessment_or_placement':
      return 'Internal only — no parent/player visibility change'
    case 'curriculum_builder':
      return 'Not live until director approves'
    case 'coach_note_summary':
      return 'Director-only — never exposed to parents or players'
    default:
      return 'Director-only until explicitly approved'
  }
}

// ── Approval requirement label ────────────────────────────────────────────────

export function getActionPreviewApprovalRequirement(intent: DonnaDirectorIntent): string {
  switch (intent) {
    case 'parent_summary':
      return 'Director approval required before anything is sent to parent'
    case 'level_movement':
      return 'Director approval required before any level change is applied'
    case 'assessment_or_placement':
      return 'Director approval required before placement is finalized'
    case 'curriculum_builder':
      return 'Director approval required before curriculum is updated'
    case 'coach_note_summary':
      return 'No approval needed to view — director-only read'
    default:
      return 'Director approval required'
  }
}

// ── Safety class label ────────────────────────────────────────────────────────

export function getActionPreviewSafetyLabel(intent: DonnaDirectorIntent): string {
  switch (intent) {
    case 'coach_note_summary':
      return 'Safe read — director only'
    case 'parent_summary':
    case 'level_movement':
    case 'assessment_or_placement':
    case 'curriculum_builder':
      return 'Needs review — draft will enter review queue'
    default:
      return 'Needs review'
  }
}

// ── Full structured preview builder ──────────────────────────────────────────

export function buildDirectorActionPreview(
  intent: DonnaDirectorIntent,
  _text: string,
): DirectorActionPreview | null {
  switch (intent) {
    case 'parent_summary':
      return {
        title: 'Parent summary draft',
        summary: 'I will draft a parent-safe progress summary and route it to your review queue.',
        willHappen: [
          'A parent-safe draft will be created',
          'The draft will appear in your review queue',
        ],
        willNotHappen: [
          'No message is sent to the parent',
          'Raw coach notes are not included in the draft',
          'Nothing changes in the player record',
        ],
        affectedObjectLabel: 'Player + parent contact',
        affectedRoleOrAudience: 'Parent (after approval only)',
        approvalRequirement: getActionPreviewApprovalRequirement(intent),
        visibilityImpact: getActionPreviewVisibilityRisk(intent),
        safetyClass: 'needs_review',
        confidence: 'partial',
        nextStepLabel: 'Confirm player name to proceed',
      }

    case 'level_movement':
      return {
        title: 'Level movement proposal',
        summary: 'I will draft a level movement proposal and route it to your review queue.',
        willHappen: [
          'A level movement draft will be created',
          'The draft will appear in your review queue for your decision',
        ],
        willNotHappen: [
          'The player level does not change until you approve',
          'No parent or player notification is sent automatically',
          'No group assignment changes automatically',
        ],
        affectedObjectLabel: 'Player curriculum state',
        affectedRoleOrAudience: 'Director review only',
        approvalRequirement: getActionPreviewApprovalRequirement(intent),
        visibilityImpact: getActionPreviewVisibilityRisk(intent),
        safetyClass: 'needs_review',
        confidence: 'partial',
        nextStepLabel: 'Confirm player and target level to proceed',
      }

    case 'assessment_or_placement':
      return {
        title: 'Assessment or placement proposal',
        summary: 'I will draft an assessment or placement recommendation for your review.',
        willHappen: [
          'An assessment or placement draft will be created',
          'The draft will appear in your review queue',
        ],
        willNotHappen: [
          'No placement is applied automatically',
          "The player's current state is unchanged",
          'No parent/player notification is sent',
        ],
        affectedObjectLabel: 'Player placement record',
        affectedRoleOrAudience: 'Director review only',
        approvalRequirement: getActionPreviewApprovalRequirement(intent),
        visibilityImpact: getActionPreviewVisibilityRisk(intent),
        safetyClass: 'needs_review',
        confidence: 'partial',
        nextStepLabel: 'Confirm player name to proceed',
      }

    case 'curriculum_builder':
      return {
        title: 'Curriculum draft',
        summary: 'I will draft the curriculum item and route it to your review queue.',
        willHappen: [
          'A curriculum draft will be created',
          'The draft will appear in your review queue',
        ],
        willNotHappen: [
          'Nothing is added to the live curriculum until you approve',
          'No player or parent sees this content automatically',
          'No existing curriculum content is changed',
        ],
        affectedObjectLabel: 'Curriculum level or group',
        affectedRoleOrAudience: 'Director review only',
        approvalRequirement: getActionPreviewApprovalRequirement(intent),
        visibilityImpact: getActionPreviewVisibilityRisk(intent),
        safetyClass: 'needs_review',
        confidence: 'partial',
        nextStepLabel: 'Confirm level or group to proceed',
      }

    case 'coach_note_summary':
      return {
        title: 'Coach note summary',
        summary: 'I will summarize internal coach observations for your review — director-only.',
        willHappen: [
          'Coach observations will be summarized for your review',
          'Summary is shown to you in this session only',
        ],
        willNotHappen: [
          'Summary is not shared with parents or players',
          'No notes are modified or flagged automatically',
          'No proposed action is created',
        ],
        affectedObjectLabel: 'Player observation history',
        affectedRoleOrAudience: 'Director only',
        approvalRequirement: getActionPreviewApprovalRequirement(intent),
        visibilityImpact: getActionPreviewVisibilityRisk(intent),
        safetyClass: 'needs_review',
        confidence: 'high',
        nextStepLabel: 'Confirm player name to proceed',
      }

    default:
      return null
  }
}

// ── Flat text preview for chat display ───────────────────────────────────────
// Converts the structured preview to a human-readable chat message.

function previewToText(preview: DirectorActionPreview): string {
  const lines: string[] = [
    `Action preview — ${preview.title}`,
    '',
    preview.summary,
    '',
    `What will happen: ${preview.willHappen.join('; ')}.`,
    `What will not happen: ${preview.willNotHappen.join('; ')}.`,
    `Who is affected: ${preview.affectedObjectLabel} (${preview.affectedRoleOrAudience}).`,
    `Approval required: ${preview.approvalRequirement}.`,
    preview.visibilityImpact,
    `Safety: ${preview.safetyClass === 'needs_review' ? 'Needs review' : preview.safetyClass}.`,
    '',
    preview.nextStepLabel,
  ]
  return lines.join('\n')
}

// ── Actionid helper ───────────────────────────────────────────────────────────

function previewActionId(intent: DonnaDirectorIntent): string {
  return `preview_${intent}`
}

// ── Follow-up hint ────────────────────────────────────────────────────────────

function followUpHint(intent: DonnaDirectorIntent): string {
  switch (intent) {
    case 'coach_note_summary':
      return 'Let me know the player name and I will pull the summary.'
    default:
      return 'Confirm the details above and I will route a draft to the review center.'
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────
// Called from DonnaVoiceReadyShell after clarification check returns null.
// Only fires for needs_review intents — safe intents skip this entirely.

export function tryBuildActionPreview(text: string): DonnaSafeReadAnswer | null {
  const intentResult = classifyDirectorIntent(text)

  if (intentResult.safetyClass !== 'needs_review') return null

  const preview = buildDirectorActionPreview(intentResult.intent, text)
  if (!preview) return null

  return {
    actionId: previewActionId(intentResult.intent),
    text: previewToText(preview),
    confidence: preview.confidence === 'high' ? 'high' : 'partial',
    sourceNote: 'Action preview — approval required before proceeding',
    followUp: followUpHint(intentResult.intent),
    href: '/director/review',
    isAnswerable: true,
  }
}
