// Sprint 1661 — DONNA Workflow Memory V1
// sessionStorage-backed tracker for incomplete director workflows.
// "Continue where we left off" capability.
//
// Design rules:
//   - Client-side only (sessionStorage). Never throws. Fails silently.
//   - Stores only safe metadata: workflow type, route, focus ID, label, timestamp.
//   - No player PII, no coach notes, no private data.
//   - TTL: 4 hours. Stale entries are discarded on read.
//   - One active workflow per session — most recent wins.
//
// Usage (in a client component):
//   setActiveWorkflow({ type: 'assessment', label: 'Jamie Chen', route: '/director/players/abc/assessments' })
//   const resume = continueWorkflow()
//   // resume.message: "Your assessment of Jamie Chen is in progress..."
//   // resume.route: '/director/players/abc/assessments'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type WorkflowType =
  | 'onboarding'
  | 'placement'
  | 'assessment'
  | 'parent_update'
  | 'curriculum_review'
  | 'draft'
  | 'promotion'            // Sprint 1711 — promotion review workflow

export interface WorkflowEntry {
  type:      WorkflowType
  label:     string          // human-readable label, e.g., "Jamie Chen", "Orange Ball 2"
  route:     string          // route to navigate to on resume
  focusId?:  string          // optional data-donna-focus-id target
  storedAt:  number          // Date.now() at time of set
  /** Optional extra context (safe string only) */
  context?:  string
  /** Sprint 1711 — current step in a multi-step guided workflow (1-based) */
  currentStep?: number
  /** Sprint 1711 — total steps in the workflow */
  totalSteps?:  number
}

export interface WorkflowResume {
  /** Whether a resumable workflow was found */
  found:    boolean
  workflow: WorkflowEntry | null
  /** DONNA message to display */
  message:  string
  /** Route to navigate to */
  route:    string | null
  /** Optional focus target */
  focusId:  string | null
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'donna_active_workflow'
const TTL_MS      = 4 * 60 * 60 * 1000  // 4 hours

// ─── Storage helpers ───────────────────────────────────────────────────────────

function readFromStorage(): WorkflowEntry | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as WorkflowEntry
    // Validate minimum shape
    if (!parsed.type || !parsed.route || typeof parsed.storedAt !== 'number') return null
    // TTL check
    if (Date.now() - parsed.storedAt > TTL_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeToStorage(entry: WorkflowEntry): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
  } catch {
    /* sessionStorage may be full or blocked */
  }
}

function clearStorage(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* non-fatal */
  }
}

// ─── DONNA message builders per workflow type ──────────────────────────────────

const WORKFLOW_RESUME_MESSAGES: Record<WorkflowType, (label: string, context?: string, step?: number, total?: number) => string> = {
  onboarding: (label) =>
    `Your academy onboarding is still in progress${label ? ` for ${label}` : ''}. I'll take you back to where you left off.`,
  placement: (label, _ctx, step, total) =>
    `The placement review for ${label || 'a player'} is still open${step && total ? ` — you were on step ${step} of ${total}` : ''}. I'll take you to the placement queue.`,
  assessment: (label, _ctx, step, total) =>
    `Your assessment of ${label || 'a player'} is in progress${step && total ? ` (step ${step} of ${total})` : ''}. I'll take you back to continue.`,
  parent_update: (label) =>
    `A parent update for ${label || 'a player'} is waiting for your review. I'll take you to the draft.`,
  curriculum_review: (label, _ctx, step, total) =>
    `Your curriculum review${label ? ` for ${label}` : ''} is in progress${step && total ? ` — you were on step ${step} of ${total}` : ''}. I'll take you back to the curriculum page.`,
  draft: (label, context) =>
    `${label ? `"${label}"` : 'A draft'} is waiting in your Review Center${context ? ` — ${context}` : ''}. I'll take you there.`,
  promotion: (label, _ctx, step, total) =>
    `Your promotion review for ${label || 'a player'} is in progress${step && total ? ` — you were on step ${step} of ${total}` : ''}. I'll take you back to continue.`,
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Set the active workflow. Called when a workflow-type action begins.
 * Overwrites any previously stored workflow.
 */
export function setActiveWorkflow(entry: Omit<WorkflowEntry, 'storedAt'>): void {
  writeToStorage({ ...entry, storedAt: Date.now() })
}

/**
 * Get the current active workflow entry (null if none or expired).
 */
export function getActiveWorkflow(): WorkflowEntry | null {
  return readFromStorage()
}

/**
 * Clear the active workflow. Called when a workflow is completed or cancelled.
 */
export function clearActiveWorkflow(): void {
  clearStorage()
}

/**
 * Build a WorkflowResume object for "continue where we left off" commands.
 * Returns `{ found: false }` when no active workflow exists.
 */
export function continueWorkflow(): WorkflowResume {
  const entry = readFromStorage()
  if (!entry) {
    return {
      found:    false,
      workflow: null,
      message:  "I don't have an active workflow to resume. Start by asking me what needs attention, or open a player or curriculum level.",
      route:    null,
      focusId:  null,
    }
  }
  const msgBuilder = WORKFLOW_RESUME_MESSAGES[entry.type]
  const message = msgBuilder(entry.label, entry.context, entry.currentStep, entry.totalSteps)
  return {
    found:    true,
    workflow: entry,
    message,
    route:    entry.route,
    focusId:  entry.focusId ?? null,
  }
}

/**
 * Returns a short label describing the current active workflow,
 * suitable for display in the COO status panel.
 */
export function getWorkflowStatusLabel(): string | null {
  const entry = readFromStorage()
  if (!entry) return null
  const typeLabels: Record<WorkflowType, string> = {
    onboarding:       'Onboarding in progress',
    placement:        'Placement review open',
    assessment:       'Assessment in progress',
    parent_update:    'Parent update pending',
    curriculum_review: 'Curriculum review open',
    draft:            'Draft awaiting review',
    promotion:        'Promotion review in progress',
  }
  const base = typeLabels[entry.type] ?? 'Workflow in progress'
  const stepSuffix = entry.currentStep && entry.totalSteps
    ? ` (step ${entry.currentStep}/${entry.totalSteps})`
    : ''
  const labelPart = entry.label ? ` — ${entry.label}` : ''
  return `${base}${labelPart}${stepSuffix}`
}
