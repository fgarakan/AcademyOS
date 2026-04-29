export const PREVIEW_COOKIE = 'ao_preview'

export type PreviewRole = 'academy_director' | 'coach' | 'player' | 'parent'

export interface PreviewContext {
  role: PreviewRole
  academy_id: string
  academy_name: string
  started_at: string
}

const VALID_ROLES: PreviewRole[] = ['academy_director', 'coach', 'player', 'parent']

// Pure function — safe to import in middleware (Edge Runtime).
// No next/headers import at module level.
export function parsePreviewCookie(value: string | undefined): PreviewContext | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !VALID_ROLES.includes(parsed.role) ||
      typeof parsed.academy_id !== 'string' ||
      typeof parsed.academy_name !== 'string' ||
      typeof parsed.started_at !== 'string'
    ) return null
    return parsed as PreviewContext
  } catch {
    return null
  }
}

// Server Component / Server Action use only.
// Dynamic import keeps next/headers out of Edge Runtime module evaluation.
export async function getPreviewContext(): Promise<PreviewContext | null> {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  return parsePreviewCookie(cookieStore.get(PREVIEW_COOKIE)?.value)
}

export async function isPreviewMode(): Promise<boolean> {
  return (await getPreviewContext()) !== null
}

export async function assertNotPreviewMode(): Promise<void> {
  if (await isPreviewMode()) {
    throw new Error('Writes are disabled in preview mode.')
  }
}
