// Sprint 4354 — Page-Owned Workflow Boundary (single source of truth)
//
// PROBLEM THIS SOLVES
// Template creation/editing is PAGE-OWNED. The actual template form lives on the
// Templates builder pages. DONNA may guide, explain, navigate, and highlight —
// but DONNA must NEVER host a template editor/collector as a sidebar card or as
// a persisted "operating session" mission. When DONNA was allowed to own a
// template collector, the collector state leaked across routes (sessionStorage +
// donna_working_memory) and a stale "CREATE CLASS TEMPLATE" card kept rendering
// on unrelated routes like /director/today.
//
// THE RULE (enforced everywhere via this module):
//   A page-owned workflow may not render as a DONNA sidebar collector/editor,
//   and may not be tracked as a DONNA operating-session mission.
//
// This file is the ONLY place that lists which workflows are page-owned. Every
// enforcement point (conversation controller, draft persistence, operating-session
// route lifecycle, the Today mission surface, the sidebar render layer, and the
// certification runner) imports the predicate from here. Add a workflow id here
// and it is banned from the sidebar everywhere — no second list to keep in sync.
//
// Pure TypeScript. No DB, no React, no API, no side effects.

import type { DonnaWorkflowType } from './workflow/donnaWorkflowState'

/**
 * Workflow ids whose editor/collector is owned by a page, not by DONNA.
 *
 * These string ids are shared across two parallel systems:
 *   - DonnaWorkflowType (operating-session missions, donnaWorkflowState.ts)
 *   - WorkflowId         (conversation-controller drafts, donnaIntentRouter.ts)
 * Both use the literal 'class_template_creation', so one predicate covers both.
 */
export const PAGE_OWNED_WORKFLOW_IDS = [
  'class_template_creation',
  'fitness_template_creation',
  'session_creation',
  'player_assessment',
] as const

export type PageOwnedWorkflowId = (typeof PAGE_OWNED_WORKFLOW_IDS)[number]

// Compile-time proof that every page-owned id is a real DonnaWorkflowType.
// If a typo or a removed workflow type slips in, this fails `tsc`.
const _typeCheck: readonly DonnaWorkflowType[] = PAGE_OWNED_WORKFLOW_IDS
void _typeCheck

const PAGE_OWNED_SET: ReadonlySet<string> = new Set(PAGE_OWNED_WORKFLOW_IDS)

/**
 * True when the given workflow id is page-owned and therefore must never render
 * as a DONNA sidebar collector/editor or persist as an operating-session mission.
 * Accepts the loose string/null shapes the call sites already hold.
 */
export function isPageOwnedWorkflow(
  workflowId: string | null | undefined,
): boolean {
  return workflowId != null && PAGE_OWNED_SET.has(workflowId)
}

// ── Passive guidance (what DONNA does instead of collecting) ────────────────────

export interface PageOwnedGuidance {
  workflowId: PageOwnedWorkflowId
  /** Where the page-owned form actually lives. DONNA navigates here. */
  builderRoute: string
  /** Human label for the destination. */
  pageLabel: string
  /** Spoken/written guidance — explains, never collects. */
  guidance: string
}

const GUIDANCE: Record<PageOwnedWorkflowId, PageOwnedGuidance> = {
  class_template_creation: {
    workflowId: 'class_template_creation',
    builderRoute: '/director/class-templates',
    pageLabel: 'Class Templates',
    guidance:
      "Class templates are built on the Class Templates page — I've opened it for you. " +
      "Create or edit the template right there. I can explain blocks, levels, or curriculum " +
      'fit while you build, but the template form itself lives on the page.',
  },
  fitness_template_creation: {
    workflowId: 'fitness_template_creation',
    builderRoute: '/director/fitness/templates',
    pageLabel: 'Fitness Templates',
    guidance:
      "Fitness templates are built on the Fitness Templates page — I've opened it for you. " +
      'Create or edit the template right there. I can guide you on exercises and structure ' +
      'while you build, but the template form itself lives on the page.',
  },
  session_creation: {
    workflowId: 'session_creation',
    builderRoute: '/director/sessions/new',
    pageLabel: 'Sessions',
    guidance:
      "Sessions are built on the Sessions page — I've opened the session builder for you. " +
      'Add the date, group, and blocks right there. I can suggest a template or flag conflicts ' +
      'while you build, but the session form itself lives on the page.',
  },
  player_assessment: {
    workflowId: 'player_assessment',
    builderRoute: '/director/assessment-template',
    pageLabel: 'Assessments',
    guidance:
      "Assessments are built on the Assessment page — I've opened it for you. " +
      'Score the criteria right there. I can explain the rubric or what a level expects ' +
      'while you assess, but the assessment form itself lives on the page.',
  },
}

/** Guidance + builder route for a page-owned workflow, or null when not page-owned. */
export function getPageOwnedGuidance(
  workflowId: string | null | undefined,
): PageOwnedGuidance | null {
  if (workflowId == null) return null
  return (GUIDANCE as Record<string, PageOwnedGuidance>)[workflowId] ?? null
}

/**
 * Infer which page-owned template builder a free-text request refers to.
 * Fitness wins on an explicit fitness mention; otherwise class is the default.
 * Returns the class builder guidance as a safe default so the "create a template"
 * entry always has somewhere page-owned to send the director.
 */
export function inferTemplateBuilderGuidance(rawText: string): PageOwnedGuidance {
  const lower = rawText.toLowerCase()
  if (/\bfitness|conditioning|strength|agility\b/.test(lower)) {
    return GUIDANCE.fitness_template_creation
  }
  return GUIDANCE.class_template_creation
}
