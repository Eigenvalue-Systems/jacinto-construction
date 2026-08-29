import '@/styles/globals.css'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { LocaleProvider } from '@/components/site/LocaleContext'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { getPublicRepo } from '@/lib/data'
import { fontClass } from '@/lib/fonts'
import { getDictionary, isLocale, locales } from '@/lib/i18n'
import { localizedSettings, siteUrl } from '@/lib/view'
import { businessJsonLd } from '@/lib/seo'

export const revalidate = 300

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const repo = getPublicRepo()
  const settings = await repo.getSettings()
  const s = localizedSettings(settings, locale)
  const faviconUrl = settings.faviconKey ? repo.imageUrls({ storageKey: settings.faviconKey, storageKeyMedium: null, storageKeyThumb: null }).full : '/brand/favicon.svg'
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: `${settings.companyName} | ${settings.location}`,
      template: `%s | ${settings.companyName}`,
    },
    description: s.metaDescription,
    applicationName: settings.companyName,
    openGraph: {
      type: 'website',
      siteName: settings.companyName,
      locale: locale === 'es' ? 'es_US' : 'en_US',
      images: [{ url: '/brand/og-default.png', width: 1200, height: 630, alt: settings.companyName }],
    },
    twitter: { card: 'summary_large_image' },
    icons: {
      icon: [{ url: faviconUrl }],
      apple: [{ url: '/brand/apple-icon.png', sizes: '180x180' }],
    },
    robots: { index: true, follow: true },
  }
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const repo = getPublicRepo()
  const settings = await repo.getSettings()
  const s = localizedSettings(settings, locale)
  const logoUrl = settings.logoKey ? repo.imageUrls({ storageKey: settings.logoKey, storageKeyMedium: null, storageKeyThumb: null }).full : null

  return (
    <html lang={dict.htmlLang} className={fontClass} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <a href="#main" className="skip-link">
          {dict.common.skipToContent}
        </a>
        <SiteHeader
          locale={locale}
          strings={dict.nav}
          phone={settings.phone}
          phoneHref={s.phoneHref}
          location={settings.location}
          companyName={settings.companyName}
          logoUrl={logoUrl}
        />
        <main id="main">
          <LocaleProvider locale={locale}>{children}</LocaleProvider>
        </main>
        <SiteFooter locale={locale} dict={dict} settings={settings} logoUrl={logoUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd(settings, locale, logoUrl)) }}
        />
      </body>
    </html>
  )
}
