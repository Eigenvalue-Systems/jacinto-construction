import type { Metadata } from 'next'
import type { Locale, SiteSettings } from '@/lib/data/types'
import { phoneToE164 } from '@/lib/data/util'
import { localePath } from '@/lib/i18n'
import { localizedSettings, siteUrl } from '@/lib/view'

export function businessJsonLd(settings: SiteSettings, locale: Locale, logoUrl: string | null) {
  const s = localizedSettings(settings, locale)
  const base = siteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'GeneralContractor',
    '@id': `${base}/#business`,
    name: settings.companyName,
    url: base,
    telephone: phoneToE164(settings.phone),
    email: settings.email,
    description: s.metaDescription,
    image: logoUrl ? (logoUrl.startsWith('http') ? logoUrl : `${base}${logoUrl}`) : `${base}/brand/og-default.png`,
    logo: logoUrl ? (logoUrl.startsWith('http') ? logoUrl : `${base}${logoUrl}`) : `${base}/brand/logo-mark.svg`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Chicago',
      addressRegion: 'IL',
      addressCountry: 'US',
    },
    areaServed: [{ '@type': 'City', name: 'Chicago' }],
    knowsLanguage: ['en', 'es'],
    sameAs: settings.socialLinks.map((l) => l.url),
  }
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  const base = siteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  }
}

export function pageAlternates(path: string, locale: Locale): NonNullable<Metadata['alternates']> {
  return {
    canonical: localePath(locale, path),
    languages: {
      en: localePath('en', path),
      es: localePath('es', path),
      'x-default': localePath('en', path),
    },
  }
}
