import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { dataMode, getAdminRepo, localAdminEnabled } from '@/lib/data'
import { LANG_COOKIE, getDictionary, isLocale } from '@/lib/i18n'
import type { Locale } from '@/lib/data/types'
import { isEmailAllowed } from '@/lib/supabase/env'
import { createServerSupabase } from '@/lib/supabase/server'

export interface AdminSession {
  email: string
  mode: 'local' | 'supabase'
}

export type SessionCheck = { session: AdminSession; reason: null } | { session: null; reason: 'none' | 'not-allowed' | 'not-configured' }

export async function checkAdminSession(): Promise<SessionCheck> {
  if (dataMode() === 'local') {
    return localAdminEnabled() ? { session: { email: 'demo', mode: 'local' }, reason: null } : { session: null, reason: 'not-configured' }
  }
  const supabase = await createServerSupabase()
  const { data } = await supabase.auth.getUser()
  const email = data.user?.email ?? null
  if (!email) return { session: null, reason: 'none' }
  if (!isEmailAllowed(email)) return { session: null, reason: 'not-allowed' }
  const repo = await getAdminRepo()
  if (!(await repo.isAdmin())) return { session: null, reason: 'not-allowed' }
  return { session: { email, mode: 'supabase' }, reason: null }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  return (await checkAdminSession()).session
}

export async function requireAdmin(): Promise<AdminSession> {
  const result = await checkAdminSession()
  if (result.session) return result.session
  if (result.reason === 'not-configured') redirect('/admin/not-configured')
  if (result.reason === 'not-allowed') {
    const supabase = await createServerSupabase()
    await supabase.auth.signOut()
    redirect('/admin/login?error=not-allowed')
  }
  redirect('/admin/login?error=expired')
}

export async function adminLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LANG_COOKIE)?.value
  return isLocale(value) ? value : 'en'
}

export async function adminDictionary() {
  const locale = await adminLocale()
  return { locale, dict: getDictionary(locale) }
}
