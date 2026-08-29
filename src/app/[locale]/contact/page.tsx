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

        <div className={styles.grid}>
          <Reveal as="dl" className={styles.details} index={2}>
            <div className={styles.detail}>
              <dt className="eyebrow">{dict.contact.callTitle}</dt>
              <dd>
                <a href={s.phoneHref} className={styles.phone}>
                  {settings.phone}
                </a>
              </dd>
            </div>
            <div className={styles.detail}>
              <dt className="eyebrow">{dict.contact.emailTitle}</dt>
              <dd>
                <a href={s.emailHref} className={`link-line ${styles.email}`}>
                  {settings.email}
                </a>
              </dd>
            </div>
            <div className={styles.detail}>
              <dt className="eyebrow">{dict.contact.locationTitle}</dt>
              <dd className={styles.plain}>{settings.location}</dd>
            </div>
            <div className={styles.detail}>
              <dt className="eyebrow">{dict.contact.serviceTitle}</dt>
              <dd className={styles.plain}>{s.serviceArea}</dd>
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
