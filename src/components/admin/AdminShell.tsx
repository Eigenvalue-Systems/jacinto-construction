'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { signOut } from '@/app/admin/actions'
import { LogoMark, Wordmark } from '@/components/brand/Logo'
import type { Locale } from '@/lib/data/types'

interface NavStrings {
  projects: string
  media: string
  messages: string
  settings: string
  viewSite: string
  logout: string
  language: string
}

interface Props {
  locale: Locale
  strings: NavStrings
  email: string
  localBanner: string | null
  children: ReactNode
}

export function AdminShell({ locale, strings, email, localBanner, children }: Props) {
  const pathname = usePathname()
  const items = [
    { href: '/admin/projects', label: strings.projects },
    { href: '/admin/media', label: strings.media },
    { href: '/admin/messages', label: strings.messages },
    { href: '/admin/settings', label: strings.settings },
  ]
  const other = locale === 'en' ? 'es' : 'en'

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link href="/admin/projects" className="admin-brand">
          <LogoMark size={26} />
          <Wordmark stacked />
        </Link>
        <nav className="admin-nav" aria-label={strings.projects}>
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="admin-nav-link" aria-current={pathname.startsWith(item.href) ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="admin-side-foot">
          <a href="/" className="admin-side-link" target="_blank" rel="noopener">
            {strings.viewSite} ↗
          </a>
          <a href={`${pathname}?lang=${other}`} className="admin-side-link mono" lang={other}>
            {other === 'es' ? 'Español' : 'English'}
          </a>
          <p className="admin-side-email">{email}</p>
          <form action={signOut}>
            <button type="submit" className="admin-side-link">
              {strings.logout}
            </button>
          </form>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar">
          <Link href="/admin/projects" className="admin-brand">
            <LogoMark size={22} />
            <Wordmark stacked />
          </Link>
          <div className="admin-topbar-links">
            <a href="/" className="admin-side-link" target="_blank" rel="noopener">
              {strings.viewSite} ↗
            </a>
            <a href={`${pathname}?lang=${other}`} className="admin-side-link mono" lang={other}>
              {other.toUpperCase()}
            </a>
            <form action={signOut}>
              <button type="submit" className="admin-side-link">
                {strings.logout}
              </button>
            </form>
          </div>
        </div>
        {localBanner ? <p className="admin-banner">{localBanner}</p> : null}
        <div className="admin-content">{children}</div>
      </div>
      <nav className="admin-bottom" aria-label={strings.projects}>
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="admin-bottom-link" aria-current={pathname.startsWith(item.href) ? 'page' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
