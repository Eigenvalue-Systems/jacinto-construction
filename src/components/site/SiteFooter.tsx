import Link from 'next/link'
import { LogoMark, Wordmark } from '@/components/brand/Logo'
import { LangLinks } from './LangLinks'
import { fmt, localePath, type Dictionary } from '@/lib/i18n'
import type { Locale, SiteSettings } from '@/lib/data/types'
import { localizedSettings } from '@/lib/view'
import styles from './SiteFooter.module.css'

interface Props {
  locale: Locale
  dict: Dictionary
  settings: SiteSettings
  logoUrl: string | null
}

export function SiteFooter({ locale, dict, settings, logoUrl }: Props) {
  const s = localizedSettings(settings, locale)
  const year = new Date().getFullYear()
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.brandCol}>
          <Link href={localePath(locale, '/')} className={styles.brand} aria-label={settings.companyName}>
            {logoUrl ? <img src={logoUrl} alt="" className={styles.customLogo} /> : <LogoMark size={34} />}
            <Wordmark stacked />
          </Link>
          <p className={`eyebrow ${styles.location}`}>{settings.location}</p>
          <p className={styles.service}>{s.serviceArea}</p>
        </div>

        <div className={styles.col}>
          <p className={`eyebrow ${styles.colTitle}`}>{dict.footer.navigation}</p>
          <ul className={styles.list}>
            <li>
              <Link href={localePath(locale, '/')} className="link-line">
                {dict.nav.home}
              </Link>
            </li>
            <li>
              <Link href={localePath(locale, '/projects')} className="link-line">
                {dict.nav.projects}
              </Link>
            </li>
            <li>
              <Link href={localePath(locale, '/about')} className="link-line">
                {dict.nav.about}
              </Link>
            </li>
            <li>
              <Link href={localePath(locale, '/contact')} className="link-line">
                {dict.nav.contact}
              </Link>
            </li>
          </ul>
        </div>

        <div className={styles.col}>
          <p className={`eyebrow ${styles.colTitle}`}>{dict.nav.contact}</p>
          <ul className={styles.list}>
            <li>
              <a href={s.phoneHref} className="link-line">
                {settings.phone}
              </a>
            </li>
            <li>
              <a href={s.smsHref} className="link-line">
                {locale === 'es' ? 'Mandar texto' : 'Text'}
              </a>
            </li>
            <li>
              <a href={s.emailHref} className={`link-line ${styles.email}`}>
                {settings.email}
              </a>
            </li>
            {settings.socialLinks.map((l) => (
              <li key={l.url}>
                <a href={l.url} className="link-line" rel="noopener">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.col}>
          <p className={`eyebrow ${styles.colTitle}`}>{dict.footer.language}</p>
          <LangLinks locale={locale} english={dict.nav.english} spanish={dict.nav.spanish} className={styles.list} />
        </div>
      </div>
      <div className={`wrap ${styles.bottom}`}>
        <p className="mono muted">{fmt(dict.footer.rights, { year, name: settings.companyName })}</p>
      </div>
    </footer>
  )
}
