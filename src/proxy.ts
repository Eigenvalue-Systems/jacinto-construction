import { NextResponse, type NextRequest } from 'next/server'
import { LANG_COOKIE, isLocale } from '@/lib/i18n'
import { isEmailAllowed, isSupabaseConfigured } from '@/lib/supabase/env'
import { updateSession } from '@/lib/supabase/proxy'

const COOKIE = { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' as const }
const PUBLIC_ADMIN = ['/admin/login', '/admin/auth/callback', '/admin/quick-auth', '/admin/not-configured']

export async function proxy(request: NextRequest) {
  const url = request.nextUrl
  const { pathname } = url

  if (pathname === '/admin' || pathname.startsWith('/admin/')) return adminProxy(request)

  const langParam = url.searchParams.get('lang')
  if (langParam && isLocale(langParam)) {
    const target = url.clone()
    target.searchParams.delete('lang')
    const res = NextResponse.redirect(target, 303)
    res.cookies.set(LANG_COOKIE, langParam, COOKIE)
    return res
  }

  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const target = url.clone()
    target.pathname = pathname.slice(3) || '/'
    return NextResponse.redirect(target, 308)
  }

  if (pathname === '/es' || pathname.startsWith('/es/')) return NextResponse.next()

  const preferred = request.cookies.get(LANG_COOKIE)?.value
  if (preferred === 'es' && request.method === 'GET' && !request.headers.get('next-router-prefetch')) {
    const target = url.clone()
    target.pathname = pathname === '/' ? '/es' : `/es${pathname}`
    return NextResponse.redirect(target, 307)
  }

  const rewritten = url.clone()
  rewritten.pathname = pathname === '/' ? '/en' : `/en${pathname}`
  return NextResponse.rewrite(rewritten)
}

async function adminProxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const langParam = request.nextUrl.searchParams.get('lang')
  if (langParam && isLocale(langParam)) {
    const target = request.nextUrl.clone()
    target.searchParams.delete('lang')
    const res = NextResponse.redirect(target, 303)
    res.cookies.set(LANG_COOKIE, langParam, COOKIE)
    return res
  }
  if (!isSupabaseConfigured()) return NextResponse.next()

  const { response, email, authenticated } = await updateSession(request)
  const isPublic = PUBLIC_ADMIN.includes(pathname)

  const redirectWithCookies = (to: string) => {
    const target = request.nextUrl.clone()
    target.pathname = to
    target.search = ''
    if (to === '/admin/login' && !isPublic) target.searchParams.set('next', pathname)
    const res = NextResponse.redirect(target)
    response.cookies.getAll().forEach((c) => res.cookies.set(c))
    return res
  }

  if (!authenticated && !isPublic) return redirectWithCookies('/admin/login')
  if (authenticated && !isEmailAllowed(email) && pathname !== '/admin/login') {
    const res = redirectWithCookies('/admin/login')
    res.headers.set('Location', '/admin/login?error=not-allowed')
    return res
  }
  if (authenticated && pathname === '/admin/login' && isEmailAllowed(email)) return redirectWithCookies('/admin/projects')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api/|.*\\..*).*)'],
}
