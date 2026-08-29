import { NextResponse, type NextRequest } from 'next/server'
import { getAdminRepo } from '@/lib/data'
import { createServerSupabase } from '@/lib/supabase/server'

const ACCESS_KEY = '06eGt12KpXiaEV9MzJYUztsBvePnkFJpOLG7ouNZQP0'
const TOKEN_ENDPOINT = 'https://pmyezxvflhsxjbggikwx.supabase.co/functions/v1/one-time-admin-link'

export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const key = url.searchParams.get('key')

  if (key !== ACCESS_KEY) {
    return NextResponse.redirect(new URL('/admin/login?error=invalid', url.origin))
  }

  const tokenResponse = await fetch(`${TOKEN_ENDPOINT}?key=${encodeURIComponent(ACCESS_KEY)}`, {
    cache: 'no-store',
  })

  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL('/admin/login?error=invalid', url.origin))
  }

  const payload = (await tokenResponse.json()) as { token_hash?: string }
  if (!payload.token_hash) {
    return NextResponse.redirect(new URL('/admin/login?error=invalid', url.origin))
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.verifyOtp({
    token_hash: payload.token_hash,
    type: 'magiclink',
  })

  if (error) {
    return NextResponse.redirect(new URL('/admin/login?error=invalid', url.origin))
  }

  const repo = await getAdminRepo()
  if (!(await repo.isAdmin())) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/admin/login?error=not-allowed', url.origin))
  }

  return NextResponse.redirect(new URL('/admin/projects', url.origin))
}
