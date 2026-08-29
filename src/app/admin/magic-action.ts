'use server'

import type { FormState } from '@/app/admin/actions'
import { createServerSupabase } from '@/lib/supabase/server'
import { siteUrl } from '@/lib/view'

const fail = (code: string): FormState => ({ status: 'error', code })
const ok = (code: string): FormState => ({ status: 'ok', code })

export async function requestMagicLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase().slice(0, 200)
  const nextRaw = String(formData.get('next') ?? '').trim().slice(0, 200)
  const next = nextRaw.startsWith('/admin') && !nextRaw.startsWith('/admin/login') ? nextRaw : '/admin/projects'

  if (!email) return fail('failed')

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${siteUrl()}/admin/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (error) return fail('failed')
  return ok('magic-sent')
}
