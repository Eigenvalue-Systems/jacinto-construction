import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ContactForm } from '@/components/site/ContactForm'
import { Reveal } from '@/components/site/Reveal'
import { getPublicRepo } from '@/lib/data'
import { getDictionary, isLocale } from '@/lib/i18n'
import { pageAlternates } from '@/lib/seo'
import { localizedSettings } from '@/lib/view'
import styles from './contact.module.css'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  const settings = await getPublicRepo().getSettings()
  return {
    title: dict.contact.title,
    description: `${dict.nav.call} ${settings.phone}. ${localizedSettings(settings, locale).contactCopy}`,
    alternates: pageAlternates('/contact', locale),
  }
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const settings = await getPublicRepo().getSettings()
  const s = localizedSettings(settings, locale)
  const textLabel = locale === 'es' ? 'Mandar texto' : 'Text'
  const emailLabel = locale === 'es' ? 'Enviar correo' : 'Email'

  return (
    <section className={`section-tight ${styles.page}`}>
      <div className="wrap">
        <div className={styles.head}>
          <Reveal as="p" className="eyebrow" index={0}>
            {dict.contact.label}
          </Reveal>
          <Reveal as="h1" className="section-title" index={1}>
            {dict.contact.title}
          </Reveal>
          <Reveal as="p" className={`reflective ${styles.intro}`} index={2}>
            {s.contactCopy}
          </Reveal>
        </div>

        <Reveal className={styles.quickActions} index={2}>
          <a href={s.phoneHref} className={`${styles.quickAction} ${styles.quickPrimary}`}>
            <span className="eyebrow">{dict.contact.callTitle}</span>
            <strong>{settings.phone}</strong>
            <span className={styles.quickHint}>{locale === 'es' ? 'Tocar para llamar' : 'Tap to call'}</span>
          </a>
          <a href={s.smsHref} className={styles.quickAction}>
            <span className="eyebrow">{textLabel}</span>
            <strong>{settings.phone}</strong>
            <span className={styles.quickHint}>SMS</span>
          </a>
          <a href={s.emailHref} className={styles.quickAction}>
            <span className="eyebrow">{emailLabel}</span>
            <strong className={styles.quickEmail}>{settings.email}</strong>
            <span className={styles.quickHint}>{locale === 'es' ? 'Abrir correo' : 'Open email'}</span>
          </a>
        </Reveal>

        <div className={styles.grid}>
          <Reveal as="dl" className={styles.details} index={2}>
            <div className={styles.detail}>
              <dt className="eyebrow">{dict.contact.locationTitle}</dt>
              <dd className={styles.plain}>{settings.location}</dd>
            </div>
            <div className={styles.detail}>
              <dt className="eyebrow">{dict.contact.serviceTitle}</dt>
              <dd className={styles.plain}>{s.serviceArea}</dd>
            </div>
            <div className={styles.detail}>
              <dt className="eyebrow">{locale === 'es' ? 'Contacto directo' : 'Direct contact'}</dt>
              <dd className={styles.directLinks}>
                <a href={s.phoneHref}>{settings.phone}</a>
                <a href={s.emailHref}>{settings.email}</a>
              </dd>
            </div>
          </Reveal>

          <Reveal className={styles.formCol} index={3}>
            <ContactForm locale={locale} strings={dict.contact} />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
