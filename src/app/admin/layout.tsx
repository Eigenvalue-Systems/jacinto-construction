import '@/styles/globals.css'
import '@/styles/admin.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AdminShell } from '@/components/admin/AdminShell'
import { adminDictionary, getAdminSession } from '@/lib/admin/auth'
import { dataMode, localAdminEnabled } from '@/lib/data'
import { fontClass } from '@/lib/fonts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { default: 'Admin | Jacinto Construction', template: '%s | Admin' },
  robots: { index: false, follow: false },
  icons: { icon: '/brand/favicon.svg' },
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { locale, dict } = await adminDictionary()
  const session = await getAdminSession()
  const mode = dataMode()

  return (
    <html lang={dict.htmlLang} className={fontClass}>
      <body className="admin-body">
        {session ? (
          <AdminShell locale={locale} strings={dict.admin.nav} email={session.email} localBanner={mode === 'local' && localAdminEnabled() ? dict.admin.localBanner : null}>
            {children}
          </AdminShell>
        ) : (
          <div className="admin-bare">{children}</div>
        )}
      </body>
    </html>
  )
}
