'use client'

import { usePathname } from 'next/navigation'
import { localePath, stripLocale } from '@/lib/i18n'
import type { Locale } from '@/lib/data/types'

interface Props {
  locale: Locale
  english: string
  spanish: string
  className?: string
  linkClassName?: string
}

export function LangLinks({ locale, english, spanish, className, linkClassName = 'link-line' }: Props) {
  const { path } = stripLocale(usePathname())
  return (
    <ul className={className}>
      <li>
        <a href={`${localePath('en', path)}?lang=en`} lang="en" className={linkClassName} aria-current={locale === 'en' ? 'true' : undefined}>
          {english}
        </a>
      </li>
      <li>
        <a href={`${localePath('es', path)}?lang=es`} lang="es" className={linkClassName} aria-current={locale === 'es' ? 'true' : undefined}>
          {spanish}
        </a>
      </li>
    </ul>
  )
}
