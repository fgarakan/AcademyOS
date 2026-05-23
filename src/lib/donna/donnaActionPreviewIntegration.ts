// Sprint 692 — DONNA Action Preview + Review Routing Integration V1
// Natural-language action preview layer: converts director requests to preview cards
// with clear "what will happen / what will not happen / approval required" structure.
// Pure TS — no DB writes, no mutations. Previews only; director approves in Review Center.

import { classifyDirectorIntent } from './donnaIntentClassifier'
import type { DonnaDirectorIntent, DonnaSafetyClass } from './donnaIntentClassifier'
import {
  buildDirectorActionPreview,
  getActionPreviewVisibilityRisk,
  getActionPreviewApprovalRequirement,
  getActionPreviewSafetyLabel,
  type DirectorActionPreview,
} from './directorActionPreview'

// ── Request types that can generate a preview ─────────────────────────────────

const PREVIEW_ELIGIBLE_INTENTS = new Set<DonnaDirectorIntent>([
  'parent_summary',
  'level_movement',
  'assessment_or_placement',
  'curriculum_builder',
  'coach_note_summary',
])

// ── Natural-language request → preview result ─────────────────────────────────

export interface ActionPreviewResult {
  hasPreview: boolean
  preview: DirectorActionPreview | null
  naturalResponse: string
  safetyClass: DonnaSafetyClass
  requiresApproval: boolean
  visibilityImpact: string
  approvalRequirement: string
  reviewHref: string
  blockedReason: string | null
  safeAlternative: string | null
}

// ── Request → natural response mapping ───────────────────────────────────────

const NATURAL_RESPONSES: Record<string, string> = {
  move_player: `I can prepare that as a review item. I won't move the player or notify the parent until you approve it in the Review Center.`,
  draft_parent: `I can prepare that parent update for your review. Nothing will be sent to the parent until you've approved and published it.`,
  create_mission: `I can draft that mission for your review. It won't be visible to the player until you approve it.`,
  add_curriculum: `I can draft that curriculum change for your review. It won't take effect until you approve it in the Review Center.`,
  publish_video: `I can't change video visibility directly from chat. Any visibility change requires your explicit approval in the Review Center.`,
  promote_knowledge: `Promoting global knowledge requires platform-owner approval — this can't be done from the director dashboard. I can document the request for review.`,
  approve_all: `Approving all items at once isn't something I can do from here. Each item in the Review Center needs individual director review — they may have different risk levels. Let me help you prioritize instead.`,
  blocked: `I can't do that directly. Any action that affects player records, parent communications, or published content needs to go through the Review Center first.`,
}

function getNaturalResponse(intent: DonnaDirectorIntent, safetyClass: DonnaSafetyClass, text: string): string {
  const lower = text.toLowerCase()

  if (safetyClass === 'blocked') return NATURAL_RESPONSES.blocked

  if (lower.includes('approve all') || lower.includes('approve everything')) {
    return NATURAL_RESPONSES.approve_all
  }
  if (lower.includes('publish') && (lower.includes('video') || lower.includes('visibility'))) {
    return NATURAL_RESPONSES.publish_video
  }
  if (lower.includes('promote') && lower.includes('knowledge')) {
    return NATURAL_RESPONSES.promote_knowledge
  }
  if (lower.includes('create') && lower.includes('mission')) {
    return NATURAL_RESPONSES.create_mission
  }

  switch (intent) {
    case 'level_movement': return NATURAL_RESPONSES.move_player
    case 'parent_summary': return NATURAL_RESPONSES.draft_parent
    case 'curriculum_builder': return NATURAL_RESPONSES.add_curriculum
    default:
      return `I can prepare a draft for your review. Nothing will take effect until you approve it in the Review Center.`
  }
}

// ── Main integration function ─────────────────────────────────────────────────

export function getActionPreviewForRequest(text: string): ActionPreviewResult {
  const { intent, safetyClass } = classifyDirectorIntent(text)

  if (safetyClass === 'blocked') {
    return {
      hasPreview: false,
      preview: null,
      naturalResponse: NATURAL_RESPONSES.blocked,
      safetyClass: 'blocked',
      requiresApproval: false,
      visibilityImpact: 'No effect — request is blocked',
      approvalRequirement: 'Not applicable — this action is not permitted',
      reviewHref: '/director/review',
      blockedReason: 'This type of request exposes data or takes action that cannot be done safely from chat.',
      safeAlternative: 'I can help you find a safe alternative path through the Review Center.',
    }
  }

  if (!PREVIEW_ELIGIBLE_INTENTS.has(intent)) {
    return {
      hasPreview: false,
      preview: null,
      naturalResponse: text.length > 5
        ? `I understand you're asking about "${text.slice(0, 60)}${text.length > 60 ? '…' : ''}". Let me know more context and I can help.`
        : 'I can help with that. What would you like to do?',
      safetyClass: 'safe',
      requiresApproval: false,
      visibilityImpact: 'No visibility impact for this type of request',
      approvalRequirement: 'No approval required',
      reviewHref: '/director/review',
      blockedReason: null,
      safeAlternative: null,
    }
  }

  const preview = buildDirectorActionPreview(intent, text)
  const visibilityImpact = getActionPreviewVisibilityRisk(intent)
  const approvalReq = getActionPreviewApprovalRequirement(intent)
  const naturalResponse = getNaturalResponse(intent, safetyClass, text)

  return {
    hasPreview: preview !== null,
    preview,
    naturalResponse,
    safetyClass: 'needs_review',
    requiresApproval: true,
    visibilityImpact,
    approvalRequirement: approvalReq,
    reviewHref: '/director/review',
    blockedReason: null,
    safeAlternative: null,
  }
}

// ── Request examples for the Sprint 692 manual test ──────────────────────────

export const SPRINT_692_TEST_REQUESTS = [
  { text: 'Move Sarah up', expectedMode: 'route_to_review', note: 'Level movement → review' },
  { text: 'Draft a parent update', expectedMode: 'route_to_review', note: 'Parent summary → review' },
  { text: 'Create a mission', expectedMode: 'route_to_review', note: 'Mission → review' },
  { text: 'Add this curriculum change', expectedMode: 'route_to_review', note: 'Curriculum → review' },
  { text: 'Publish this video', expectedMode: 'block_or_review', note: 'Video visibility → needs review, not direct' },
  { text: 'Promote this knowledge', expectedMode: 'blocked', note: 'Platform-owner approval required' },
  { text: 'Approve all of these', expectedMode: 'blocked', note: 'Cannot bulk-approve from chat' },
  { text: 'Show the raw coach note to the parent', expectedMode: 'blocked', note: 'Unsafe visibility request' },
]

// ── Explanation message for blocked visibility ─────────────────────────────────

export function explainApprovalRequirement(firstName: string | null): string {
  const name = firstName ? `${firstName}, ` : ''
  return `${name}this belongs in the Review Center. I can prepare the draft, but I won't publish it to parents or move the player until you approve it. Nothing changes until you say so.`
}

export function explainBlockedRequest(firstName: string | null): string {
  const name = firstName ? `, ${firstName}` : ''
  return `I can't do that directly${name}. Any action that affects published content, parent communications, or official player records needs your explicit approval. Let me know what you're trying to accomplish and I'll find the safest path.`
}
