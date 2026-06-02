// Mega Sprint 1101-1110 — Parent Delivery Reliability Service V1
//
// Pure TypeScript service layer — no DB calls, no server actions.
// Models delivery methods, delivery status lifecycle, and reliability
// rules for parent communications.
//
// V1 delivery model: 'portal_published' only.
// Email/SMS/push delivery paths are defined here as types so future
// sprints can extend without restructuring the service layer.
//
// Safety invariants:
//   - Delivery method selection never bypasses the review queue.
//   - 'portal_published' is the only method that writes live data.
//   - All other methods remain as defined types — no execution path yet.
//   - No external provider credentials referenced here.
//   - Raw coach notes are never passed to any delivery method.

// ---------------------------------------------------------------------------
// Delivery method types
// ---------------------------------------------------------------------------

export type ParentDeliveryMethod =
  | 'portal_published'  // V1: live — writes to parent_updates + player_development_summary
  | 'email'             // Future — requires email provider integration
  | 'sms'               // Future — requires SMS provider integration
  | 'push'              // Future — requires push notification provider

// ---------------------------------------------------------------------------
// Delivery status lifecycle
// ---------------------------------------------------------------------------

export type ParentDeliveryStatus =
  | 'pending'       // Delivery attempted but not confirmed
  | 'delivered'     // Confirmed delivered to the channel
  | 'failed'        // Delivery attempt failed — see failureReason
  | 'portal_live'   // portal_published only — content visible on /parent/updates
  | 'cancelled'     // Cancelled before delivery

// ---------------------------------------------------------------------------
// Delivery result — returned by delivery execution paths
// ---------------------------------------------------------------------------

export interface ParentDeliveryResult {
  ok: boolean
  method: ParentDeliveryMethod
  status: ParentDeliveryStatus
  deliveredAt: string | null
  failureReason: string | null
  /** For portal_published: the parent_updates row id */
  parentUpdateId: string | null
  /** For portal_published: whether player_development_summary was updated */
  developmentSummaryUpdated: boolean
}

// ---------------------------------------------------------------------------
// Delivery method metadata — used for display in review UI
// ---------------------------------------------------------------------------

export interface ParentDeliveryMethodMeta {
  method: ParentDeliveryMethod
  label: string
  description: string
  /** true = actually sends/publishes (V1: only portal_published) */
  isLive: boolean
  requiresProvider: boolean
  v1Supported: boolean
}

export const PARENT_DELIVERY_METHOD_META: Record<ParentDeliveryMethod, ParentDeliveryMethodMeta> = {
  portal_published: {
    method: 'portal_published',
    label: 'Portal Published',
    description: 'Publishes directly to the parent portal. Parent sees the update on next load of /updates.',
    isLive: true,
    requiresProvider: false,
    v1Supported: true,
  },
  email: {
    method: 'email',
    label: 'Email',
    description: 'Sends an email to the parent. Requires email provider configuration.',
    isLive: false,
    requiresProvider: true,
    v1Supported: false,
  },
  sms: {
    method: 'sms',
    label: 'SMS',
    description: 'Sends an SMS to the parent. Requires SMS provider configuration.',
    isLive: false,
    requiresProvider: true,
    v1Supported: false,
  },
  push: {
    method: 'push',
    label: 'Push Notification',
    description: 'Sends a push notification to the parent app. Requires push provider configuration.',
    isLive: false,
    requiresProvider: true,
    v1Supported: false,
  },
}

// ---------------------------------------------------------------------------
// Delivery guards — pure functions, no side effects
// ---------------------------------------------------------------------------

/**
 * Returns true if the given method is supported in V1.
 * Only 'portal_published' is supported in V1.
 */
export function isDeliveryMethodSupportedV1(method: ParentDeliveryMethod): boolean {
  return PARENT_DELIVERY_METHOD_META[method]?.v1Supported === true
}

/**
 * Returns an error message if the given method cannot be used in V1.
 * Returns null if the method is safe to use.
 */
export function getDeliveryMethodUnsupportedReason(
  method: ParentDeliveryMethod,
): string | null {
  const meta = PARENT_DELIVERY_METHOD_META[method]
  if (!meta) return `Unknown delivery method: ${method}`
  if (!meta.v1Supported) {
    return `Delivery method '${meta.label}' is not yet supported. Use Portal Published in V1.`
  }
  return null
}

/**
 * Builds a DeliveryResult for the portal_published path.
 * Called by applyParentCommunicationAction after a successful write.
 */
export function buildPortalPublishedResult(params: {
  parentUpdateId: string
  developmentSummaryUpdated: boolean
  deliveredAt: string
}): ParentDeliveryResult {
  return {
    ok: true,
    method: 'portal_published',
    status: 'portal_live',
    deliveredAt: params.deliveredAt,
    failureReason: null,
    parentUpdateId: params.parentUpdateId,
    developmentSummaryUpdated: params.developmentSummaryUpdated,
  }
}

/**
 * Builds a failed DeliveryResult for any method.
 */
export function buildFailedDeliveryResult(
  method: ParentDeliveryMethod,
  failureReason: string,
): ParentDeliveryResult {
  return {
    ok: false,
    method,
    status: 'failed',
    deliveredAt: null,
    failureReason,
    parentUpdateId: null,
    developmentSummaryUpdated: false,
  }
}

/**
 * Returns a human-readable delivery status label.
 */
export function getDeliveryStatusLabel(status: ParentDeliveryStatus): string {
  switch (status) {
    case 'pending':      return 'Pending'
    case 'delivered':    return 'Delivered'
    case 'failed':       return 'Failed'
    case 'portal_live':  return 'Live on Portal'
    case 'cancelled':    return 'Cancelled'
    default:             return 'Unknown'
  }
}

/** Returns the default V1 delivery method. */
export function getDefaultV1DeliveryMethod(): ParentDeliveryMethod {
  return 'portal_published'
}
