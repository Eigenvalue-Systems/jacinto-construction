import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogoMark, Wordmark } from '@/components/brand/Logo'
import { adminDictionary } from '@/lib/admin/auth'
import { dataMode, localAdminEnabled } from '@/lib/data'

export default async function NotConfiguredPage() {
  if (dataMode() === 'supabase' || localAdminEnabled()) redirect('/admin/projects')
  const { dict } = await adminDictionary()
  return (
    <div className="admin-card">
      <div className="admin-card-brand">
        <LogoMark size={28} />
        <Wordmark stacked />
      </div>
      <h1 className="admin-title">{dict.admin.notConfigured.title}</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 15 }}>{dict.admin.notConfigured.body}</p>
      <Link href="/" className="link-plain" style={{ fontSize: 14 }}>
        {dict.admin.nav.viewSite}
      </Link>
    </div>
  )
}
