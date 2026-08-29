import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Picture } from '@/components/site/Picture'
import { Reveal } from '@/components/site/Reveal'
import { getPublicRepo } from '@/lib/data'
import { getDictionary, isLocale, localePath } from '@/lib/i18n'
import { pageAlternates } from '@/lib/seo'
import { localizedSettings } from '@/lib/view'
import styles from './about.module.css'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  const settings = await getPublicRepo().getSettings()
  return {
    title: dict.about.title,
    description: localizedSettings(settings, locale).aboutIntro,
    alternates: pageAlternates('/about', locale),
  }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const repo = getPublicRepo()
  const settings = await repo.getSettings()
  const s = localizedSettings(settings, locale)
  const image = settings.aboutImageId ? await repo.getImageById(settings.aboutImageId) : null

  return (
    <article className={`section-tight ${styles.page}`}>
      <div className="wrap">
        <header className={styles.head}>
          <Reveal as="p" className="eyebrow" index={0}>
            {dict.about.label} <span aria-hidden="true">/</span> {settings.companyName}
          </Reveal>
          <Reveal as="h1" className={`reflective-lg ${styles.intro}`} index={1}>
            {s.aboutIntro}
          </Reveal>
        </header>

        {image ? (
          <Reveal className={styles.media} index={2}>
            <span className={`project-image ${styles.image}`} style={{ aspectRatio: `${image.width} / ${image.height}` }}>
              <Picture urls={repo.imageUrls(image)} alt={image.altText || settings.companyName} width={image.width} height={image.height} sizes="(min-width: 1360px) 1240px, 100vw" priority />
            </span>
            {image.caption ? <p className={`eyebrow ${styles.caption}`}>{image.caption}</p> : null}
          </Reveal>
        ) : null}

        <div className={styles.body}>
          <Reveal className={`prose ${styles.copy}`} index={0}>
            {s.aboutParagraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </Reveal>

          <div className={styles.side}>
            {s.services.length > 0 ? (
              <Reveal as="section" className={styles.block} index={1} aria-labelledby="services-title">
                <h2 id="services-title" className="eyebrow">
                  {dict.about.whatWeDo}
                </h2>
                <ul className={styles.list}>
                  {s.services.map((item, i) => (
                    <li key={i}>
                      <span className={`mono ${styles.num}`}>{String(i + 1).padStart(2, '0')}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : null}
            <Reveal as="section" className={styles.block} index={2} aria-labelledby="where-title">
              <h2 id="where-title" className="eyebrow">
                {dict.about.where}
              </h2>
              <p className={styles.where}>{s.serviceArea}</p>
              <p className={`eyebrow ${styles.based}`}>{settings.location}</p>
            </Reveal>
          </div>
        </div>

        <Reveal className={styles.cta} index={0}>
          <h2 className="title-md">{dict.about.ctaTitle}</h2>
          <div className={styles.ctaActions}>
            <a href={s.phoneHref} className="btn btn-ink">
              {dict.nav.call} {settings.phone}
            </a>
            <Link href={localePath(locale, '/contact')} className="btn btn-outline">
              {dict.home.contactMessage}
            </Link>
          </div>
        </Reveal>
      </div>
    </article>
  )
}
