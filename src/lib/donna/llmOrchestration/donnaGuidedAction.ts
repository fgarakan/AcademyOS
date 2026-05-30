// Sprint 1009 — DONNA Cross-Page Guided Action V1
// Client-side helper for executing highlight and navigation actions from OrchestratorOutput.
// Wraps setDonnaFocusTarget + donna:highlight dispatch for the new orchestrator path.
//
// Client-only — uses sessionStorage and window.dispatchEvent.
// Never call from server components or server actions.
//
// Responsibility:
//   Encapsulates the two-step pattern used when DONNA points at a UI element:
//     1. Same-page: setDonnaFocusTarget → dispatch 'donna:highlight'
//     2. Cross-page: setDonnaFocusTarget → caller navigates via onNavigate()
//
// Safety:
//   Routes are validated against ALLOWED_ROUTE_PREFIXES before use.
//   External routes are silently rejected — no navigation occurs.
//   targetId and label must not contain player names, coach notes, or private data.
//   The orchestrator safety contract is responsible for ensuring output.text is safe;
//   this module is responsible for ensuring route navigation is internal-only.
//
// Usage (from Sprint 1011 DonnaAssistantButton wiring):
//   executeDonnaHighlight(output.highlightTarget, pathname, (route) => router.push(route))
//   executeDonnaNavigation(output.suggestedRoute, (route) => router.push(route))

import { setDonnaFocusTarget } from '@/lib/donna/donnaFocusTarget'
import type { OrchestratorOutput } from './types'

// ── Route safety ──────────────────────────────────────────────────────────────

const ALLOWED_ROUTE_PREFIXES = ['/director', '/coach', '/player', '/parent'] as const

/**
 * Returns true if the route is a safe internal AcademyOS route.
 * Rejects external URLs, absolute URLs, protocol-relative URLs.
 * Same check the LLM API client uses when sanitizing suggestedRoute.
 */
export function isAllowedRoute(route: string | null | undefined): route is string {
  if (!route || typeof route !== 'string') return false
  return ALLOWED_ROUTE_PREFIXES.some(prefix => route.startsWith(prefix))
}

// ── Same-page highlight ───────────────────────────────────────────────────────

/**
 * Dispatch a donna:highlight event for an element on the current page.
 * Writes to sessionStorage then fires the custom event.
 * DonnaHighlightBanner picks it up and applies the teal glow.
 *
 * Only call when the target element is on the current page (route === pathname).
 * For cross-page highlights use executeDonnaHighlight() instead.
 */
function dispatchSamePageHighlight(targetId: string, route: string, label: string): void {
  if (typeof window === 'undefined') return
  setDonnaFocusTarget({ targetId, route, label })
  window.dispatchEvent(new CustomEvent('donna:highlight'))
}

// ── Main guided action helpers ────────────────────────────────────────────────

/**
 * Execute a DONNA highlight action from an OrchestratorOutput.highlightTarget.
 *
 * Behavior:
 *   - Same page (highlightTarget.route === currentPathname):
 *       setDonnaFocusTarget + dispatch donna:highlight
 *   - Different page:
 *       setDonnaFocusTarget (so banner fires on arrival) + call onNavigate(route)
 *
 * No-op if:
 *   - highlightTarget is undefined
 *   - route is not an allowed internal route
 *   - running on server (window undefined)
 *
 * @param highlightTarget - From OrchestratorOutput.highlightTarget
 * @param currentPathname - Current page pathname (from usePathname)
 * @param onNavigate - Called with the route to navigate to (cross-page only)
 */
export function executeDonnaHighlight(
  highlightTarget: OrchestratorOutput['highlightTarget'],
  currentPathname: string,
  onNavigate: (route: string) => void,
): void {
  if (!highlightTarget) return
  if (typeof window === 'undefined') return

  const { targetId, route, label } = highlightTarget

  if (!isAllowedRoute(route)) return

  if (route === currentPathname) {
    // Same page — dispatch immediately
    dispatchSamePageHighlight(targetId, route, label)
  } else {
    // Cross-page — set focus target for pickup on arrival, then navigate
    setDonnaFocusTarget({ targetId, route, label })
    onNavigate(route)
  }
}

/**
 * Execute a DONNA navigation suggestion.
 * Calls onNavigate only for safe internal routes.
 * No-op for external routes, null routes, or server-side calls.
 *
 * @param route - The route to navigate to (from OrchestratorOutput.suggestedRoute)
 * @param onNavigate - Called with the route (caller handles router.push)
 */
export function executeDonnaNavigation(
  route: string | null | undefined,
  onNavigate: (route: string) => void,
): void {
  if (!isAllowedRoute(route)) return
  onNavigate(route)
}

/**
 * Execute the primary guided action from an OrchestratorOutput.
 * Handles both highlight and navigation in one call.
 *
 * Decision priority:
 *   1. If output.highlightTarget → executeDonnaHighlight (may also navigate cross-page)
 *   2. Else if output.suggestedRoute → executeDonnaNavigation
 *   3. Else → no-op (answer/clarification types with no navigation)
 *
 * @param output - The OrchestratorOutput to act on
 * @param currentPathname - Current page pathname (from usePathname)
 * @param onNavigate - Called with the route (caller handles router.push + panel close)
 */
export function executeDonnaPrimaryAction(
  output: OrchestratorOutput,
  currentPathname: string,
  onNavigate: (route: string) => void,
): void {
  if (output.highlightTarget) {
    executeDonnaHighlight(output.highlightTarget, currentPathname, onNavigate)
    return
  }
  if (output.suggestedRoute) {
    executeDonnaNavigation(output.suggestedRoute, onNavigate)
  }
}
