import { NextResponse, type NextRequest } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const code = url.searchParams.get('code')
  const nextParam = url.searchParams.get('next') ?? '/admin/projects'
  const next = nextParam.startsWith('/admin') ? nextParam : '/admin/projects'
  if (!isSupabaseConfigured() || !code) return NextResponse.redirect(new URL('/admin/login?error=invalid', url.origin))
  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(new URL('/admin/login?error=invalid', url.origin))
  return NextResponse.redirect(new URL(next, url.origin))
}
