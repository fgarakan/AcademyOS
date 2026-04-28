import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database, Tables } from '@/lib/supabase/database.types'

const PUBLIC_ROUTES = ['/login', '/auth']
const ROLE_ROUTES: Record<string, string> = {
  academy_director: '/director',
  head_coach:       '/coach',
  coach:            '/coach',
  player:           '/player',
  parent:           '/parent',
}

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

  // Get role from academy_memberships
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single<Pick<Tables<'academy_memberships'>, 'role'>>()

  const role = membership?.role ?? 'player'
  const homeRoute = ROLE_ROUTES[role] ?? '/player'

  // Root → redirect to role home
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = homeRoute
    return NextResponse.redirect(url)
  }

  // Enforce route access: coaches can't access /director, players can't access /coach, etc.
  const routeOwner = pathname.split('/')[1]
  const allowed = (() => {
    if (routeOwner === 'director') return role === 'academy_director'
    if (routeOwner === 'coach')    return ['academy_director', 'head_coach', 'coach'].includes(role)
    if (routeOwner === 'player')   return role === 'player'
    if (routeOwner === 'parent')   return role === 'parent'
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
