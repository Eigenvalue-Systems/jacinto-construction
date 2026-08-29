'use client'

import Link from 'next/link'
import { useLocale } from '@/components/site/LocaleContext'
import { getDictionary, localePath } from '@/lib/i18n'
import styles from './not-found.module.css'

export default function NotFound() {
  const locale = useLocale()
  const dict = getDictionary(locale)
  return (
    <section className={`section ${styles.wrap}`}>
      <div className="wrap">
        <p className={`eyebrow ${styles.code}`}>{dict.notFound.code}</p>
        <h1 className={`section-title ${styles.title}`}>{dict.notFound.title}</h1>
        <div className={styles.actions}>
          <Link href={localePath(locale, '/projects')} className="btn btn-ink">
            {dict.notFound.action} <span className="arrow" aria-hidden="true">→</span>
          </Link>
          <Link href={localePath(locale, '/')} className="btn btn-outline">
            {dict.notFound.home}
          </Link>
        </div>
      </div>
    </section>
  )
}
