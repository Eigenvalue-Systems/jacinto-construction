import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProjectIndex, type IndexItem } from '@/components/site/ProjectIndex'
import { Reveal } from '@/components/site/Reveal'
import { getPublicRepo } from '@/lib/data'
import { PROJECT_TYPES, type Locale, type ProjectType } from '@/lib/data/types'
import { getDictionary, isLocale, localePath, plural } from '@/lib/i18n'
import { projectTypeLabel } from '@/lib/projectTypes'
import { pageAlternates } from '@/lib/seo'
import { coverOf, localizedProject } from '@/lib/view'
import styles from './projects.module.css'

type Search = Record<string, string | string[] | undefined>

function parseCategory(value: string | string[] | undefined): ProjectType | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  return raw && PROJECT_TYPES.includes(raw as ProjectType) ? (raw as ProjectType) : undefined
}

function filterHref(locale: Locale, category?: ProjectType) {
  return `${localePath(locale, '/projects')}${category ? `?category=${category}` : ''}`
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  return {
    title: dict.projects.label,
    description: locale === 'es' ? 'Cocinas, baños, interiores, exteriores y trabajo especial de Jacinto Construction.' : 'Kitchens, bathrooms, interior, exterior and custom work by Jacinto Construction.',
    alternates: pageAlternates('/projects', locale),
  }
}

export default async function ProjectsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Search> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const search = await searchParams
  const category = parseCategory(search.category)
  const dict = getDictionary(locale)
  const repo = getPublicRepo()
  const allProjects = (await repo.listPublishedProjects()).sort((a, b) => a.displayOrder - b.displayOrder || b.createdAt.localeCompare(a.createdAt))
  const categories = PROJECT_TYPES.filter((type) => allProjects.some((project) => project.projectType === type))
  const projects = category ? allProjects.filter((project) => project.projectType === category) : allProjects

  const items: IndexItem[] = projects.map((project, i) => {
    const cover = coverOf(project)
    const p = localizedProject(project, locale)
    return {
      id: project.id,
      number: String(i + 1).padStart(2, '0'),
      name: p.name,
      href: localePath(locale, `/projects/${project.slug}`),
      location: p.location,
      category: projectTypeLabel(project.projectType, locale, 'singular'),
      isDemo: project.isDemo,
      image: cover ? { urls: repo.imageUrls(cover), alt: cover.altText || p.name, width: cover.width, height: cover.height } : null,
    }
  })

  const intro = locale === 'es'
    ? 'Vea el trabajo por tipo. Cada proyecto muestra el proceso y el resultado final.'
    : 'Browse the work by type. Each project shows the process and the finished result.'
  const filterLabel = locale === 'es' ? 'Tipo de trabajo' : 'Type of work'
  const emptyAction = locale === 'es' ? 'Elija otro tipo o vea todos los proyectos.' : 'Choose another type or view all projects.'

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
            {intro}
          </Reveal>
        </div>

        {categories.length > 1 ? (
          <Reveal className={styles.filters} index={3}>
            <nav aria-label={filterLabel} className={styles.filterRow}>
              <span className={`mono ${styles.filterLabel}`}>{filterLabel}</span>
              <ul className={styles.filterList}>
                <li>
                  <Link href={filterHref(locale)} className={styles.filter} aria-current={!category ? 'true' : undefined}>
                    {dict.projects.all}
                  </Link>
                </li>
                {categories.map((type) => (
                  <li key={type}>
                    <Link href={filterHref(locale, type)} className={styles.filter} aria-current={category === type ? 'true' : undefined}>
                      {projectTypeLabel(type, locale, 'filter')}
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
            <p className="reflective">{emptyAction}</p>
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
