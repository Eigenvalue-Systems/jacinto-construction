import Link from 'next/link'
import { Picture } from '@/components/site/Picture'
import { Reveal } from '@/components/site/Reveal'
import { BeforeAfterSlider } from '@/components/site/project/BeforeAfterSlider'
import type { ImageUrls, Locale, Project, ProjectImage, Repository, SiteSettings } from '@/lib/data/types'
import { localePath, type Dictionary } from '@/lib/i18n'
import { projectTypeLabel } from '@/lib/projectTypes'
import { beforeAfterOf, coverOf, localizedProject, localizedSettings, projectHref } from '@/lib/view'
import styles from './Home.module.css'

interface ImageWithUrls {
  image: ProjectImage
  urls: ImageUrls
}

interface HeroProps {
  locale: Locale
  dict: Dictionary
  settings: SiteSettings
  image: ImageWithUrls | null
  project: Project | null
}

export function Hero({ locale, dict, settings, image, project }: HeroProps) {
  const s = localizedSettings(settings, locale)
  const proj = project ? localizedProject(project, locale) : null
  const sentences = s.homepageHeadline.split(/(?<=[.!?])\s+/).filter(Boolean)
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={`wrap ${styles.heroHead}`}>
        <Reveal as="p" className="eyebrow" index={0}>
          {settings.companyName} <span aria-hidden="true">/</span> {settings.location}
        </Reveal>
        <Reveal as="h1" className={`display ${styles.heroTitle}`} index={1} id="hero-title">
          {sentences.map((line, i) => (
            <span key={i} className={styles.heroLine}>
              {line}
            </span>
          ))}
        </Reveal>
      </div>
      <div className={`wrap ${styles.heroGrid}`}>
        <div className={styles.heroText}>
          <Reveal as="p" className={`reflective ${styles.heroIntro}`} index={2}>
            {s.homepageIntro}
          </Reveal>
          <Reveal className={styles.heroActions} index={3}>
            <Link href={localePath(locale, '/projects')} className="btn btn-ink">
              {dict.home.viewProjects} <span className="arrow" aria-hidden="true">→</span>
            </Link>
            <a href={s.phoneHref} className="btn btn-outline">
              {dict.nav.call} {settings.phone}
            </a>
          </Reveal>
        </div>

        {image && project && proj ? (
          <Reveal className={styles.heroMedia} index={2}>
            <Link href={projectHref(locale, project.slug)} className={`project-link ${styles.heroImageLink}`}>
              <span className={`project-image ${styles.heroImage}`}>
                <Picture
                  urls={image.urls}
                  alt={image.image.altText || proj.name}
                  width={image.image.width}
                  height={image.image.height}
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  priority
                />
              </span>
              <span className={`eyebrow ${styles.heroMeta}`}>
                <span className="eyebrow-ink">{dict.home.heroMeta}</span>
                <span aria-hidden="true"> / </span>
                {proj.name}
                {project.projectType ? (
                  <>
                    <span aria-hidden="true"> / </span>
                    {projectTypeLabel(project.projectType, locale)}
                  </>
                ) : null}
              </span>
            </Link>
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}

interface SelectedProps {
  locale: Locale
  dict: Dictionary
  projects: Project[]
  repo: Repository
}

export function SelectedWork({ locale, dict, projects, repo }: SelectedProps) {
  if (projects.length === 0) return null
  return (
    <section className={`section ${styles.selected}`} aria-labelledby="selected-title">
      <div className="wrap">
        <div className={styles.sectionHead}>
          <Reveal as="p" className="eyebrow" index={0}>
            {dict.home.selectedLabel}
          </Reveal>
          <Reveal as="h2" className="section-title" index={1} id="selected-title">
            {dict.home.selectedTitle}
          </Reveal>
        </div>
        <ol className={styles.modules}>
          {projects.map((project, i) => {
            const cover = coverOf(project)
            const comparison = beforeAfterOf(project)?.[0] ?? null
            const hasComparison = Boolean(comparison?.before && comparison?.after)
            const p = localizedProject(project, locale)
            const number = String(i + 1).padStart(2, '0')
            const year = Number.isInteger(project.year) && project.year > 1900 ? String(project.year) : null
            const meta = [p.location, project.projectType ? projectTypeLabel(project.projectType, locale) : null, year].filter(Boolean).join(' · ')
            return (
              <li key={project.id} className={`${styles.module} ${i % 2 === 1 ? styles.moduleFlip : ''}`}>
                <Reveal className={styles.moduleMedia}>
                  {hasComparison && comparison?.before && comparison.after ? (
                    <BeforeAfterSlider
                      before={{
                        urls: repo.imageUrls(comparison.before),
                        alt: comparison.before.altText,
                        width: comparison.before.width,
                        height: comparison.before.height,
                      }}
                      after={{
                        urls: repo.imageUrls(comparison.after),
                        alt: comparison.after.altText,
                        width: comparison.after.width,
                        height: comparison.after.height,
                      }}
                      beforeLabel={dict.project.before}
                      afterLabel={dict.project.after}
                      hint={locale === 'es' ? 'Deslice para comparar' : 'Drag to compare'}
                      projectName={p.name}
                    />
                  ) : (
                    <Link href={projectHref(locale, project.slug)} className={`project-link ${styles.moduleLink}`} aria-label={p.name}>
                      {cover ? (
                        <span className={`project-image ${styles.moduleImage}`} style={{ aspectRatio: `${cover.width} / ${cover.height}` }}>
                          <Picture
                            urls={repo.imageUrls(cover)}
                            alt={cover.altText || p.name}
                            width={cover.width}
                            height={cover.height}
                            sizes="(min-width: 1024px) 58vw, 100vw"
                          />
                        </span>
                      ) : (
                        <span className={`project-image ${styles.moduleImage} ${styles.noImage}`} style={{ aspectRatio: '3 / 2' }} />
                      )}
                    </Link>
                  )}
                </Reveal>
                <Reveal className={styles.moduleText} index={1}>
                  <p className="eyebrow">
                    <span className="eyebrow-ink">{number}</span>
                    {project.isDemo ? <span className={styles.sampleTag}>{dict.common.sample}</span> : null}
                  </p>
                  <h3 className={`title-md ${styles.moduleTitle}`}>
                    <Link href={projectHref(locale, project.slug)} className={styles.moduleTitleLink}>
                      {p.name}
                    </Link>
                  </h3>
                  {meta ? <p className={`eyebrow ${styles.moduleMeta}`}>{meta}</p> : null}
                  <p className={`reflective ${styles.moduleDesc}`}>{p.shortDescription}</p>
                  <Link href={projectHref(locale, project.slug)} className={`link-arrow ${styles.moduleMore}`}>
                    {dict.projects.viewProject} <span className="arrow" aria-hidden="true">→</span>
                  </Link>
                </Reveal>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

interface IndexProps {
  locale: Locale
  dict: Dictionary
  projects: Project[]
  total: number
}

export function IndexPreview({ locale, dict, projects, total }: IndexProps) {
  if (projects.length === 0) return null
  const intro = locale === 'es' ? 'Cocinas, baños, interiores, exteriores y trabajo especial, todo en un solo lugar.' : 'Kitchens, bathrooms, interior, exterior and custom work, all in one place.'
  return (
    <section className={`section ${styles.index}`} aria-labelledby="index-title">
      <div className="wrap">
        <div className={`${styles.sectionHead} ${styles.indexHead}`}>
          <div>
            <Reveal as="p" className="eyebrow" index={0}>
              {dict.home.indexLabel}
            </Reveal>
            <Reveal as="h2" className="section-title" index={1} id="index-title">
              {dict.home.indexTitle}
            </Reveal>
          </div>
          <Reveal as="p" className={`reflective ${styles.indexIntro}`} index={2}>
            {intro}
          </Reveal>
        </div>
        <Reveal as="ol" className={styles.rows} index={2}>
          {projects.map((project, i) => {
            const p = localizedProject(project, locale)
            return (
              <li key={project.id}>
                <Link href={projectHref(locale, project.slug)} className={styles.row}>
                  <span className={`mono ${styles.rowNum}`}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={styles.rowName}>{p.name}</span>
                  <span className={`mono ${styles.rowLocation}`}>{p.location}</span>
                  <span className={`mono ${styles.rowYear}`}>{projectTypeLabel(project.projectType, locale)}</span>
                </Link>
              </li>
            )
          })}
        </Reveal>
        <Reveal className={styles.indexFoot} index={3}>
          <Link href={localePath(locale, '/projects')} className="link-arrow">
            {dict.home.allProjects} ({total}) <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

interface AboutProps {
  locale: Locale
  dict: Dictionary
  settings: SiteSettings
  image: ImageWithUrls | null
}

export function AboutPreview({ locale, dict, settings, image }: AboutProps) {
  const s = localizedSettings(settings, locale)
  return (
    <section className={`section ${styles.about}`} aria-labelledby="about-title">
      <div className={`wrap ${styles.aboutGrid} ${image ? '' : styles.aboutNoImage}`}>
        <div className={styles.aboutText}>
          <Reveal as="p" className="eyebrow" index={0}>
            {dict.home.aboutLabel}
          </Reveal>
          <Reveal as="h2" className={`reflective-lg ${styles.aboutIntro}`} index={1} id="about-title">
            {s.aboutIntro}
          </Reveal>
          <Reveal index={2}>
            <Link href={localePath(locale, '/about')} className="link-arrow">
              {dict.home.aboutMore} <span className="arrow" aria-hidden="true">→</span>
            </Link>
          </Reveal>
        </div>
        {image ? (
          <Reveal className={styles.aboutMedia} index={1}>
            <span className={`project-image ${styles.aboutImage}`} style={{ aspectRatio: `${image.image.width} / ${image.image.height}` }}>
              <Picture urls={image.urls} alt={image.image.altText} width={image.image.width} height={image.image.height} sizes="(min-width: 1024px) 50vw, 100vw" />
            </span>
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}

interface ContactProps {
  locale: Locale
  dict: Dictionary
  settings: SiteSettings
}

export function ContactClose({ locale, dict, settings }: ContactProps) {
  const s = localizedSettings(settings, locale)
  return (
    <section className={`section ${styles.contact}`} aria-labelledby="contact-title">
      <div className={`wrap ${styles.contactGrid}`}>
        <div>
          <Reveal as="p" className={`eyebrow ${styles.contactEyebrow}`} index={0}>
            {dict.home.contactLabel}
          </Reveal>
          <Reveal as="h2" className={`section-title ${styles.contactTitle}`} index={1} id="contact-title">
            {dict.home.contactTitle}
          </Reveal>
          <Reveal as="p" className={`reflective ${styles.contactCopy}`} index={2}>
            {s.contactCopy}
          </Reveal>
        </div>
        <Reveal className={styles.contactActions} index={2}>
          <a href={s.phoneHref} className={styles.contactPhone}>
            <span className={`eyebrow ${styles.contactEyebrow}`}>{dict.nav.call}</span>
            {settings.phone}
          </a>
          <a href={s.emailHref} className={styles.contactEmail}>
            <span className={`eyebrow ${styles.contactEyebrow}`}>{dict.common.email}</span>
            {settings.email}
          </a>
          <Link href={localePath(locale, '/contact')} className="btn btn-paper">
            {dict.home.contactMessage} <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
