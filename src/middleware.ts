import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database, Tables } from '@/lib/supabase/database.types'
import {
  parsePreviewCookie,
  PREVIEW_COOKIE,
  type PreviewRole,
} from '@/lib/utils/previewMode'

const PUBLIC_ROUTES = ['/login', '/auth']
const ROLE_ROUTES: Record<string, string> = {
  academy_director: '/director',
  head_coach:       '/coach',
  coach:            '/coach',
  player:           '/player',
  parent:           '/parent',
}

// Maps PreviewRole to the top-level route segment it unlocks.
const PREVIEW_ROLE_TO_SEGMENT: Record<PreviewRole, string> = {
  academy_director: 'director',
  coach:            'coach',
  player:           'player',
  parent:           'parent',
}

const PORTAL_SEGMENTS = new Set(['director', 'coach', 'player', 'parent'])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Build Supabase client with request cookies
  let response = NextResponse.next({ request })
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet: Array<{ name: string; value: string; options: any }>) => {
          toSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Not authenticated → login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // ── Platform role check (runs before academy_memberships) ──────────────────
  // platform_roles is not yet in database.types.ts — rawDb cast required.
  const rawDb = supabase as any
  const { data: platformRoleRow } = await rawDb
    .from('platform_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  const isPlatformUser = !!(platformRoleRow as { role?: string } | null)?.role

  // /platform routes: only accessible to platform users
  if (pathname.startsWith('/platform')) {
    if (isPlatformUser) return response
    // Non-platform user tried /platform — redirect to their academy home
    const { data: mem } = await supabase
      .from('academy_memberships')
      .select('role')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .single<Pick<Tables<'academy_memberships'>, 'role'>>()
    const url = request.nextUrl.clone()
    url.pathname = ROLE_ROUTES[mem?.role ?? 'player'] ?? '/player'
    return NextResponse.redirect(url)
  }

  // ── Platform user routing — preview mode gates portal access ───────────────
  if (isPlatformUser) {
    // Root always goes to /platform for platform users
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/platform'
      return NextResponse.redirect(url)
    }

    const routeSegment = pathname.split('/')[1]

    if (PORTAL_SEGMENTS.has(routeSegment)) {
      // Portal routes require a valid matching preview cookie
      const previewCtx = parsePreviewCookie(
        request.cookies.get(PREVIEW_COOKIE)?.value
      )

      if (!previewCtx) {
        const url = request.nextUrl.clone()
        url.pathname = '/platform'
        return NextResponse.redirect(url)
      }

      if (PREVIEW_ROLE_TO_SEGMENT[previewCtx.role] !== routeSegment) {
        const url = request.nextUrl.clone()
        url.pathname = '/platform'
        return NextResponse.redirect(url)
      }

      return response
    }

    // Non-portal routes (e.g. API or other) — pass through
    return response
  }

  // ── Academy membership check (existing behavior, unchanged) ───────────────
  // Non-platform users follow normal role-based routing.
  // ao_preview cookie has no effect for non-platform users.
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single<Pick<Tables<'academy_memberships'>, 'role'>>()

  const role = membership?.role ?? 'player'
  const homeRoute = ROLE_ROUTES[role] ?? '/player'

  // Root redirect
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = homeRoute
    return NextResponse.redirect(url)
  }

  // Enforce route access
  const routeSegment = pathname.split('/')[1]
  const allowed = (() => {
    if (routeSegment === 'director') return role === 'academy_director'
    if (routeSegment === 'coach')    return ['academy_director', 'head_coach', 'coach'].includes(role)
    if (routeSegment === 'player')   return role === 'player'
    if (routeSegment === 'parent')   return role === 'parent'
    return true
  })()

  if (!allowed) {
    const url = request.nextUrl.clone()
    url.pathname = homeRoute
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
