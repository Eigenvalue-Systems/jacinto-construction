import { redirect } from 'next/navigation'
import { LoginForm, ResetRequestForm } from '@/components/admin/AuthForms'
import { LogoMark, Wordmark } from '@/components/brand/Logo'
import { adminDictionary, getAdminSession } from '@/lib/admin/auth'
import { dataMode, localAdminEnabled } from '@/lib/data'

type Search = Promise<Record<string, string | string[] | undefined>>

export default async function LoginPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams
  if (dataMode() === 'local') redirect(localAdminEnabled() ? '/admin/projects' : '/admin/not-configured')
  const session = await getAdminSession()
  if (session) redirect('/admin/projects')
  const { dict } = await adminDictionary()
  const error = typeof params.error === 'string' ? params.error : undefined
  const next = typeof params.next === 'string' ? params.next : '/admin/projects'
  const reset = params.reset === '1'

  return (
    <div className="admin-card">
      <div className="admin-card-brand">
        <LogoMark size={28} />
        <Wordmark stacked />
      </div>
      {reset ? <ResetRequestForm strings={dict.admin.login} /> : <LoginForm strings={dict.admin.login} next={next} initialError={error} />}
    </div>
  )
}
