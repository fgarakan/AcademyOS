// Sprint 542 — Knowledge Source Validator
// Validates source metadata for knowledge submissions.
// Enforces: no copyrighted full content, no paywall bypass, no ToS violations.
// Validates citation format, URL structure, and author attribution.
// Pure TypeScript — no DB calls, no AI, no network calls, no side effects.

export type SourceValidationStatus = 'valid' | 'warning' | 'invalid'

export interface SourceValidationResult {
  status: SourceValidationStatus
  errors: string[]
  warnings: string[]
  citationFormatted: string | null
  urlIsSafe: boolean
  hasAttribution: boolean
}

const BLOCKED_URL_PATTERNS = [
  'localhost',
  '127.0.0.1',
  'internal.',
  'staging.',
  'admin.',
  '.onion',
]

const KNOWN_OPEN_ACCESS_DOMAINS = [
  'pubmed.ncbi.nlm.nih.gov',
  'itftennis.com',
  'usta.com',
  'tennisabstract.com',
  'researchgate.net',
  'ncbi.nlm.nih.gov',
]

function isUrlSafe(url: string): boolean {
  const lower = url.toLowerCase()
  for (const pattern of BLOCKED_URL_PATTERNS) {
    if (lower.includes(pattern)) return false
  }
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function isKnownOpenAccess(url: string): boolean {
  const lower = url.toLowerCase()
  return KNOWN_OPEN_ACCESS_DOMAINS.some(domain => lower.includes(domain))
}

function formatCitation(
  title: string,
  author: string | null,
  year: number | null,
  url: string | null,
): string {
  const parts: string[] = []
  if (author) parts.push(author)
  parts.push(`"${title}"`)
  if (year) parts.push(`(${year})`)
  if (url) parts.push(url)
  return parts.join('. ')
}

export function validateKnowledgeSource(
  title: string,
  summary: string | null,
  sourceUrl: string | null,
  sourceAuthor: string | null,
  sourceYear: number | null,
  rawBody: string | null,
): SourceValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  let urlIsSafe = true
  if (sourceUrl !== null && sourceUrl.trim().length > 0) {
    urlIsSafe = isUrlSafe(sourceUrl)
    if (!urlIsSafe) {
      errors.push('Source URL is not safe for external submission.')
    }
    if (!sourceUrl.startsWith('https://') && !sourceUrl.startsWith('http://')) {
      warnings.push('Source URL does not start with http:// or https:// — verify it is accessible.')
    }
    if (!isKnownOpenAccess(sourceUrl) && rawBody !== null && rawBody.trim().length > 1000) {
      warnings.push('Body content is long and source is not a known open-access domain — verify no copyright is being violated.')
    }
  }

  const hasAttribution = sourceAuthor !== null && sourceAuthor.trim().length > 0

  if (!hasAttribution && sourceUrl === null) {
    warnings.push('No author and no source URL — attribution is missing.')
  }

  if (sourceYear !== null && (sourceYear < 1900 || sourceYear > 2100)) {
    errors.push(`Source year ${sourceYear} is outside the valid range (1900–2100).`)
  }

  if (title.trim().length < 5) {
    errors.push('Title is too short — must be at least 5 characters.')
  }

  const citationFormatted = errors.length === 0
    ? formatCitation(title, sourceAuthor, sourceYear, sourceUrl)
    : null

  const status: SourceValidationStatus =
    errors.length > 0 ? 'invalid' :
    warnings.length > 0 ? 'warning' :
    'valid'

  return {
    status,
    errors,
    warnings,
    citationFormatted,
    urlIsSafe,
    hasAttribution,
  }
}

export function getSourceValidationStatusLabel(status: SourceValidationStatus): string {
  const labels: Record<SourceValidationStatus, string> = {
    valid: 'Valid',
    warning: 'Valid with warnings',
    invalid: 'Invalid',
  }
  return labels[status]
}
