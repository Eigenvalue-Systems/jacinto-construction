import { NextResponse, type NextRequest } from 'next/server'
import { getAdminRepo } from '@/lib/data'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const tokenHash = url.searchParams.get('token_hash')

  if (!tokenHash) {
    return NextResponse.redirect(new URL('/admin/login?error=invalid', url.origin))
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })

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
