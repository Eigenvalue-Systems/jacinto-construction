import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProjectIndex, type IndexItem } from '@/components/site/ProjectIndex'
import { Reveal } from '@/components/site/Reveal'
import { getPublicRepo } from '@/lib/data'
import type { Locale } from '@/lib/data/types'
import { getDictionary, isLocale, localePath, plural } from '@/lib/i18n'
import { pageAlternates } from '@/lib/seo'
import { coverOf, localizedProject } from '@/lib/view'
import styles from './projects.module.css'

type Search = Record<string, string | string[] | undefined>

function parseYear(value: string | string[] | undefined): number | undefined {
  const v = Array.isArray(value) ? value[0] : value
  const n = Number(v)
  return Number.isInteger(n) && n > 1900 && n < 2200 ? n : undefined
}

function filterHref(locale: Locale, year?: number) {
  return `${localePath(locale, '/projects')}${year ? `?year=${year}` : ''}`
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  return {
    title: dict.projects.label,
    description: dict.projects.intro,
    alternates: pageAlternates('/projects', locale),
  }
}

export default async function ProjectsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Search> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const search = await searchParams
  const year = parseYear(search.year)
  const dict = getDictionary(locale)
  const repo = getPublicRepo()
  const [projects, years] = await Promise.all([repo.listPublishedProjects({ year }), repo.listPublishedYears()])

  const items: IndexItem[] = projects.map((project, i) => {
    const cover = coverOf(project)
    const p = localizedProject(project, locale)
    return {
      id: project.id,
      number: String(i + 1).padStart(2, '0'),
      name: p.name,
      href: localePath(locale, `/projects/${project.slug}`),
      location: p.location,
      year: project.year,
      isDemo: project.isDemo,
      image: cover ? { urls: repo.imageUrls(cover), alt: cover.altText || p.name, width: cover.width, height: cover.height } : null,
    }
  })

  return (
    <section className={`section-tight ${styles.page}`}>
      <div className="wrap">
        <div className={styles.head}>
          <Reveal as="p" className="eyebrow" index={0}>
            {dict.projects.label} <span aria-hidden="true">/</span> {plural(projects.length, dict.projects.countOne, dict.projects.countMany)}
          </Reveal>
          <Reveal as="h1" className="section-title" index={1}>
            {dict.projects.title}
          </Reveal>
          <Reveal as="p" className={`reflective ${styles.intro}`} index={2}>
            {dict.projects.intro}
          </Reveal>
        </div>

        {years.length > 0 ? (
          <Reveal className={styles.filters} index={3}>
            <nav aria-label={dict.projects.filterYear} className={styles.filterRow}>
              <span className={`mono ${styles.filterLabel}`}>{dict.projects.filterYear}</span>
              <ul className={styles.filterList}>
                <li>
                  <Link href={filterHref(locale)} className={styles.filter} aria-current={!year ? 'true' : undefined}>
                    {dict.projects.all}
                  </Link>
                </li>
                {years.map((y) => (
                  <li key={y}>
                    <Link href={filterHref(locale, y)} className={styles.filter} aria-current={year === y ? 'true' : undefined}>
                      {y}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Reveal>
        ) : null}

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p className="title-md">{dict.projects.empty}</p>
            <p className="reflective">{dict.projects.emptyAction}</p>
            <Link href={localePath(locale, '/projects')} className="btn btn-outline">
              {dict.projects.viewAll}
            </Link>
          </div>
        ) : (
          <ProjectIndex items={items} sampleLabel={dict.common.sample} viewLabel={dict.projects.viewProject} />
        )}
      </div>
    </section>
  )
}
