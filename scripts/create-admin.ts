import { adminClient, done, fail } from './lib'

async function main() {
  const [emailArg, password] = process.argv.slice(2)
  const email = emailArg?.trim().toLowerCase()
  if (!email || !password) fail('Usage: npm run admin:create -- chaidezjason@gmail.com "a long password"')
  if (password.length < 8) fail('Use a password with at least 8 characters.')
  const supabase = adminClient()

  let userId: string | null = null
  const { data: created, error: createError } = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
  if (createError) {
    const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (listError) fail('Could not create or find the user.', createError)
    const existing = list.users.find((u) => u.email?.toLowerCase() === email)
    if (!existing) fail('Could not create the user.', createError)
    userId = existing.id
    const { error: passwordError } = await supabase.auth.admin.updateUserById(existing.id, { password })
    if (passwordError) fail('The user exists but the password could not be updated.', passwordError)
    console.log(`User already existed: ${email}. Password updated.`)
  } else {
    userId = created.user?.id ?? null
    console.log(`User created: ${email}`)
  }
  if (!userId) fail('No user id returned.')

  const { error: adminError } = await supabase.from('admin_users').upsert({ user_id: userId, email }, { onConflict: 'user_id' })
  if (adminError) fail('The user exists but could not be registered as an admin. Did you run database/migrations/0002_v2_corrections.sql?', adminError)
  done(`${email} is registered as the approved admin. Log in at /admin/login.`)
}

main().catch((error) => fail('Failed.', error))
