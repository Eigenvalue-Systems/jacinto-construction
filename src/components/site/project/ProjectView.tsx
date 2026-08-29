import Link from 'next/link'
import { Picture } from '@/components/site/Picture'
import { Reveal } from '@/components/site/Reveal'
import { BeforeAfterSlider } from '@/components/site/project/BeforeAfterSlider'
import { Gallery, type GalleryImage } from '@/components/site/project/Gallery'
import type { Locale, Project, ProjectImage, Repository, SiteSettings } from '@/lib/data/types'
import { localePath, type Dictionary } from '@/lib/i18n'
import { projectTypeFieldLabel, projectTypeLabel } from '@/lib/projectTypes'
import { beforeAfterOf, coverOf, galleryOf, localizedProject, localizedSettings, projectHref } from '@/lib/view'
import styles from './ProjectView.module.css'

interface Props {
  locale: Locale
  dict: Dictionary
  project: Project
  settings: SiteSettings
  repo: Repository
  previous: Project | null
  next: Project | null
}

function toGalleryImage(repo: Repository, image: ProjectImage, fallbackAlt: string): GalleryImage {
  return {
    id: image.id,
    urls: repo.imageUrls(image),
    alt: image.altText || `${fallbackAlt}, ${image.displayOrder}`,
    caption: image.caption,
    width: image.width,
    height: image.height,
  }
}

export function ProjectView({ locale, dict, project, settings, repo, previous, next }: Props) {
  const p = localizedProject(project, locale)
  const s = localizedSettings(settings, locale)
  const cover = coverOf(project)
  const pairs = beforeAfterOf(project)
  const comparisonIds = new Set((pairs ?? []).flatMap((pair) => [pair.before?.id, pair.after?.id]).filter(Boolean))
  const gallery = galleryOf(project).filter((i) => i.id !== cover?.id && !comparisonIds.has(i.id))
  const galleryImages = gallery.map((i) => toGalleryImage(repo, i, `${p.name}, ${dict.project.photoLabel}`))
  const [statement, ...rest] = p.paragraphs
  const hasYear = Number.isInteger(project.year) && project.year > 1900
  const category = projectTypeLabel(project.projectType, locale)
  const lightboxStrings = {
    close: dict.lightbox.close,
    previous: dict.lightbox.previous,
    next: dict.lightbox.next,
    counter: dict.lightbox.counter,
    label: dict.lightbox.label,
    open: dict.project.openImage,
  }

  return (
    <article className={styles.article}>
      <header className={`wrap ${styles.head}`}>
        <Reveal as="p" className="eyebrow" index={0}>
          <Link href={localePath(locale, '/projects')} className={styles.crumb}>
            {dict.projects.label}
          </Link>
          <span aria-hidden="true"> / </span>
          {category}
          {project.isDemo ? <span className={styles.sample}>{dict.common.sample}</span> : null}
        </Reveal>
        <Reveal as="h1" className={`section-title ${styles.title}`} index={1}>
          {p.name}
        </Reveal>
        <Reveal as="dl" className={styles.meta} index={2}>
          {p.location ? (
            <div>
              <dt className="eyebrow">{dict.project.location}</dt>
              <dd>{p.location}</dd>
            </div>
          ) : null}
          {project.projectType ? (
            <div>
              <dt className="eyebrow">{projectTypeFieldLabel(locale)}</dt>
              <dd>{category}</dd>
            </div>
          ) : null}
          {hasYear ? (
            <div>
              <dt className="eyebrow">{dict.project.year}</dt>
              <dd>{project.year}</dd>
            </div>
          ) : null}
          {p.value ? (
            <div>
              <dt className="eyebrow">{dict.project.value}</dt>
              <dd data-testid="project-value">{p.value}</dd>
            </div>
          ) : null}
        </Reveal>
      </header>

      {cover ? (
        <Reveal className={`wrap ${styles.cover}`} index={2}>
          <figure className={`project-image ${styles.coverImage}`} style={{ aspectRatio: `${cover.width} / ${cover.height}` }}>
            <Picture urls={repo.imageUrls(cover)} alt={cover.altText || p.name} width={cover.width} height={cover.height} sizes="(min-width: 1360px) 1240px, 100vw" priority />
          </figure>
          {cover.caption ? <p className={`eyebrow ${styles.caption}`}>{cover.caption}</p> : null}
        </Reveal>
      ) : null}

      <div className={`wrap ${styles.body}`}>
        <div className={styles.statement}>
          {statement ? (
            <Reveal as="p" className="reflective-lg" index={0}>
              {statement}
            </Reveal>
          ) : null}
          {rest.length > 0 ? (
            <Reveal className={`prose ${styles.paragraphs}`} index={1}>
              {rest.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </Reveal>
          ) : null}
        </div>
        {p.details.length > 0 ? (
          <Reveal as="aside" className={styles.details} index={2} aria-label={dict.project.scope}>
            <p className="eyebrow">{dict.project.scope}</p>
            <ul className={styles.detailList}>
              {p.details.map((d, i) => (
                <li key={i}>
                  <span className={`mono ${styles.detailNum}`}>{String(i + 1).padStart(2, '0')}</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}
      </div>

      {pairs ? (
        <section className={`wrap ${styles.beforeAfter}`} aria-labelledby="before-after-title">
          <Reveal as="h2" className={`eyebrow ${styles.beforeAfterTitle}`} id="before-after-title">
            {dict.project.beforeAfter}
          </Reveal>
          <div className={styles.pairs}>
            {pairs.map((pair, i) => (
              <Reveal key={i} className={styles.pair} index={i}>
                {pair.before && pair.after ? (
                  <BeforeAfterSlider
                    before={{
                      urls: repo.imageUrls(pair.before),
                      alt: pair.before.altText,
                      width: pair.before.width,
                      height: pair.before.height,
                    }}
                    after={{
                      urls: repo.imageUrls(pair.after),
                      alt: pair.after.altText,
                      width: pair.after.width,
                      height: pair.after.height,
                    }}
                    beforeLabel={dict.project.before}
                    afterLabel={dict.project.after}
                    projectName={p.name}
                  />
                ) : (
                  <div className={styles.pairFallback}>
                    {[
                      { img: pair.before, label: dict.project.before },
                      { img: pair.after, label: dict.project.after },
                    ].map(({ img, label }) => (
                      <figure key={label} className={styles.pairItem}>
                        {img ? (
                          <span className={`project-image ${styles.pairImage}`} style={{ aspectRatio: `${img.width} / ${img.height}` }}>
                            <Picture urls={repo.imageUrls(img)} alt={img.altText || `${label}: ${p.name}`} width={img.width} height={img.height} sizes="(min-width: 860px) 50vw, 100vw" />
                          </span>
                        ) : (
                          <span className={`project-image ${styles.pairImage} ${styles.pairEmpty}`} style={{ aspectRatio: '4 / 5' }} />
                        )}
                        <figcaption className={`eyebrow ${styles.pairCaption}`}>
                          <span className="eyebrow-ink">{label}</span>
                          {img?.caption && img.caption !== label ? <span> / {img.caption}</span> : null}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {galleryImages.length > 0 ? (
        <div className={`wrap ${styles.gallery}`}>
          <Gallery images={galleryImages} strings={lightboxStrings} />
        </div>
      ) : null}

      <nav className={`wrap ${styles.pager}`} aria-label={`${dict.project.previous} / ${dict.project.next}`}>
        {previous ? (
          <Link href={projectHref(locale, previous.slug)} className={styles.pagerLink}>
            <span className="eyebrow">← {dict.project.previous}</span>
            <span className={styles.pagerName}>{localizedProject(previous, locale).name}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={projectHref(locale, next.slug)} className={`${styles.pagerLink} ${styles.pagerNext}`}>
            <span className="eyebrow">{dict.project.next} →</span>
            <span className={styles.pagerName}>{localizedProject(next, locale).name}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <section className={`wrap ${styles.cta}`} aria-labelledby="project-cta">
        <div>
          <h2 id="project-cta" className="title-md">
            {dict.project.ctaTitle}
          </h2>
          <p className={`reflective ${styles.ctaBody}`}>{dict.project.ctaBody}</p>
        </div>
        <div className={styles.ctaActions}>
          <a href={s.phoneHref} className="btn btn-ink">
            {dict.nav.call} {settings.phone}
          </a>
          <a href={s.smsHref} className="btn btn-outline">
            {locale === 'es' ? 'Mandar texto' : 'Text'}
          </a>
          <Link href={localePath(locale, '/contact')} className="btn btn-outline">
            {dict.home.contactMessage}
          </Link>
        </div>
      </section>
    </article>
  )
}
