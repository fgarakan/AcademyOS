// Sprint 522 — COO Demo Live/Demo Toggle V1
// Shared utility for detecting and managing COO demo mode.
// Demo mode is triggered by ?demo=1 in the URL (searchParams).
// Never touches the database in demo mode — all data comes from donnaDemoSeed.ts.

// ── Demo detection ────────────────────────────────────────────────────────────

/** Returns true when the page is running in COO demo mode (?demo=1). */
export function isDemoMode(
  searchParams: Record<string, string | string[] | undefined>,
): boolean {
  const val = searchParams['demo']
  return val === '1' || val === 'true'
}

/** Appends ?demo=1 to a path string. */
export function demoPath(path: string): string {
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}demo=1`
}

/** Strips the demo param from a path string. */
export function livePath(path: string): string {
  return path.replace(/[?&]demo=[^&]*/g, '').replace(/[?&]$/, '')
}
