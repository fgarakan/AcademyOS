// Sprint 514 — COO Data Status Model V1
// Shared status type and display helpers for all COO surfaces.

export type COOFieldStatus =
  | 'live'
  | 'partial'
  | 'insufficient_data'
  | 'blocked_by_rls'
  | 'blocked_by_schema'

const STATUS_LABEL: Record<COOFieldStatus, string> = {
  live: 'Live',
  partial: 'Partial',
  insufficient_data: 'No data yet',
  blocked_by_rls: 'Blocked',
  blocked_by_schema: 'Schema gap',
}

const STATUS_DOT_CLASS: Record<COOFieldStatus, string> = {
  live: 'bg-status-green',
  partial: 'bg-status-orange',
  insufficient_data: 'bg-text-muted',
  blocked_by_rls: 'bg-status-red',
  blocked_by_schema: 'bg-status-red',
}

export function getStatusLabel(status: COOFieldStatus): string {
  return STATUS_LABEL[status]
}

export function getStatusDot(status: COOFieldStatus): string {
  return STATUS_DOT_CLASS[status]
}

/** Derives an overall status from a list of field statuses.
 *  'insufficient_data' wins over 'partial'; blocked states are treated as insufficient. */
export function deriveOverallStatus(
  statuses: COOFieldStatus[],
): 'live' | 'partial' | 'insufficient_data' {
  if (statuses.includes('insufficient_data')) return 'insufficient_data'
  if (statuses.includes('blocked_by_rls')) return 'insufficient_data'
  if (statuses.includes('blocked_by_schema')) return 'insufficient_data'
  if (statuses.includes('partial')) return 'partial'
  return 'live'
}
