import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseEnv } from './env'

export async function updateSession(request: NextRequest) {
  const env = supabaseEnv()
  let response = NextResponse.next({ request })
  if (!env) return { response, email: null as string | null, authenticated: false }

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims as { email?: string; sub?: string } | undefined
  return { response, email: claims?.email ?? null, authenticated: !!claims?.sub }
}
