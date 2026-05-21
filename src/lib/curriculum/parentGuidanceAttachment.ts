// Sprint 514 — Parent Guidance Attachment Model
// Parent-facing curriculum content attached to levels.
// All parent guidance requires director approval before becoming parent-visible.
// Parent safety: never includes coach-only notes, deficit language, or comparisons.
// Pure TypeScript — no DB calls, no AI, no side effects.

export type ParentGuidanceTone = 'encouraging' | 'informational' | 'action_oriented'
export type ParentGuidanceCategory =
  | 'what_we_are_working_on'
  | 'how_to_support_at_home'
  | 'what_to_expect_next'
  | 'frequently_asked_questions'
  | 'glossary_term'

export interface ParentGuidanceAttachment {
  attachmentId: string
  levelId: string
  levelName: string
  category: ParentGuidanceCategory
  tone: ParentGuidanceTone
  title: string
  body: string
  isParentVisible: boolean
  isPlayerVisible: false
  hasDeficitLanguage: false
  hasComparisons: false
  attachedAt: string
  approvedAt: string | null
  approvedBy: string | null
  safetyCheckPassed: boolean
}

export interface ParentGuidanceSafetyCheck {
  passed: boolean
  flags: string[]
}

const DEFICIT_LANGUAGE_PATTERNS = [
  'behind', 'failing', 'struggling badly', 'can\'t do', 'unable to', 'never', 'always wrong',
  'poor', 'weak player', 'not good enough',
]

const COMPARISON_LANGUAGE_PATTERNS = [
  'better than', 'worse than', 'ahead of', 'behind other', 'top of the group', 'bottom of',
  'compared to other', 'unlike others',
]

export function checkParentGuidanceSafety(body: string): ParentGuidanceSafetyCheck {
  const lower = body.toLowerCase()
  const flags: string[] = []

  for (const pattern of DEFICIT_LANGUAGE_PATTERNS) {
    if (lower.includes(pattern)) {
      flags.push(`Possible deficit language: "${pattern}"`)
    }
  }

  for (const pattern of COMPARISON_LANGUAGE_PATTERNS) {
    if (lower.includes(pattern)) {
      flags.push(`Possible comparison language: "${pattern}"`)
    }
  }

  return { passed: flags.length === 0, flags }
}

export function buildParentGuidanceAttachment(
  attachmentId: string,
  levelId: string,
  levelName: string,
  category: ParentGuidanceCategory,
  tone: ParentGuidanceTone,
  title: string,
  body: string,
  attachedBy: string,
): ParentGuidanceAttachment {
  const safetyCheck = checkParentGuidanceSafety(body)
  return {
    attachmentId,
    levelId,
    levelName,
    category,
    tone,
    title,
    body,
    isParentVisible: false,
    isPlayerVisible: false,
    hasDeficitLanguage: false,
    hasComparisons: false,
    attachedAt: new Date().toISOString(),
    approvedAt: null,
    approvedBy: attachedBy,
    safetyCheckPassed: safetyCheck.passed,
  }
}

export function buildParentGuidanceSummary(attachments: ParentGuidanceAttachment[]): {
  total: number
  pendingApproval: number
  approvedAndVisible: number
  safetyFlagCount: number
  byCategory: Record<ParentGuidanceCategory, number>
} {
  const byCategory: Record<ParentGuidanceCategory, number> = {
    what_we_are_working_on: 0,
    how_to_support_at_home: 0,
    what_to_expect_next: 0,
    frequently_asked_questions: 0,
    glossary_term: 0,
  }
  for (const a of attachments) {
    byCategory[a.category] = (byCategory[a.category] ?? 0) + 1
  }
  return {
    total: attachments.length,
    pendingApproval: attachments.filter(a => a.approvedAt === null).length,
    approvedAndVisible: attachments.filter(a => a.approvedAt !== null && a.isParentVisible).length,
    safetyFlagCount: attachments.filter(a => !a.safetyCheckPassed).length,
    byCategory,
  }
}

export function getParentGuidanceCategoryLabel(category: ParentGuidanceCategory): string {
  const labels: Record<ParentGuidanceCategory, string> = {
    what_we_are_working_on: 'What we are working on',
    how_to_support_at_home: 'How to support at home',
    what_to_expect_next: 'What to expect next',
    frequently_asked_questions: 'Frequently asked questions',
    glossary_term: 'Glossary',
  }
  return labels[category]
}

export function getApprovedParentGuidance(
  attachments: ParentGuidanceAttachment[],
): ParentGuidanceAttachment[] {
  return attachments.filter(a => a.approvedAt !== null && a.safetyCheckPassed)
}
