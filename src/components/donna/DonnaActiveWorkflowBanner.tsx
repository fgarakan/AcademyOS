'use client'

// Sprint 1721 — DONNA Active Workflow Banner V1
// Reads the active workflow from sessionStorage on mount.
// When a workflow is active and the current page matches the workflow route,
// renders DonnaDecisionGuidePanel embedded at the top of the page.
// Collapsed by default. Dismissible per session (sessionStorage key).
// Mounts on: Player Profile, Review page — any page that needs workflow guidance.
//
// Design rules:
//   - No mutations. Display only.
//   - Never shows fake or stale data.
//   - Only renders when a workflow is genuinely active.
//   - Dismissed state stored in sessionStorage (cleared on browser tab close).

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getActiveWorkflow, updateWorkflowStep } from '@/lib/donna/workflow/workflowMemory'
import type { WorkflowEntry } from '@/lib/donna/workflow/workflowMemory'
import {
  buildWorkflowForType,
  type DecisionWorkflowType,
} from '@/lib/donna/workflows/decisionWorkflowEngine'
import { DonnaDecisionGuidePanel } from '@/components/donna/DonnaDecisionGuidePanel'

// Map WorkflowType → DecisionWorkflowType (they overlap but are distinct types)
const WORKFLOW_MAP: Partial<Record<WorkflowEntry['type'], DecisionWorkflowType>> = {
  promotion:        'promotion',
  placement:        'placement',
  assessment:       'assessment',
  parent_update:    'parent_update',
  curriculum_review: 'curriculum_review',
}

const DISMISS_KEY = 'donna_workflow_banner_dismissed'

function isDismissed(route: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(`${DISMISS_KEY}:${route}`) === 'true'
  } catch { return false }
}

function markDismissed(route: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(`${DISMISS_KEY}:${route}`, 'true')
  } catch { /* non-fatal */ }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export interface DonnaActiveWorkflowBannerProps {
  /** Optional: force-show the banner even without sessionStorage match (for testing) */
  forceShow?: boolean
  className?: string
}

export function DonnaActiveWorkflowBanner({ forceShow, className = '' }: DonnaActiveWorkflowBannerProps) {
  const pathname = usePathname() ?? ''
  const [entry, setEntry] = useState<WorkflowEntry | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const stored = getActiveWorkflow()
    if (!stored) return
    // Only show when the current path is related to the workflow route
    // (starts with or equals the stored route base path)
    const routeBase = stored.route.split('?')[0]
    const pathnameBase = pathname.split('?')[0]
    const isRelevant = pathnameBase === routeBase ||
      pathnameBase.startsWith(routeBase) ||
      // Review page routes are always relevant for review-type workflows
      (pathnameBase === '/director/review' && ['placement', 'parent_update', 'draft'].includes(stored.type))

    if (!isRelevant && !forceShow) return
    if (isDismissed(stored.route)) { setDismissed(true); return }

    setEntry(stored)
  }, [pathname, forceShow])

  if (!entry || dismissed) return null

  const decisionType = WORKFLOW_MAP[entry.type]
  if (!decisionType) return null

  const workflow = buildWorkflowForType(decisionType, entry.label, entry.context ?? undefined)

  function handleDismiss() {
    markDismissed(entry!.route)
    setDismissed(true)
  }

  return (
    <div className={`${className}`}>
      <DonnaDecisionGuidePanel
        workflow={workflow}
        currentStep={entry.currentStep ?? 1}
        showAllSteps
        onDismiss={handleDismiss}
        onStepChange={(step) => updateWorkflowStep(step)}
      />
    </div>
  )
}
