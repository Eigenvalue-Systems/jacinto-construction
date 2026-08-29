import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { supabaseEnv } from './env'

export async function createServerSupabase() {
  const env = supabaseEnv()
  if (!env) throw new Error('Supabase is not configured')
  const cookieStore = await cookies()
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          return
        }
      },
    },
  })
}

let publicClient: ReturnType<typeof createClient> | null = null

export function createPublicSupabase() {
  const env = supabaseEnv()
  if (!env) throw new Error('Supabase is not configured')
  if (!publicClient) {
    publicClient = createClient(env.url, env.key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  }
  return publicClient
}
