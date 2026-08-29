export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key) return null
  return { url, key }
}

export function isSupabaseConfigured() {
  return supabaseEnv() !== null
}

export function adminAllowedEmails() {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isEmailAllowed(email: string | undefined | null) {
  const list = adminAllowedEmails()
  if (list.length === 0) return true
  return !!email && list.includes(email.toLowerCase())
}
