import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProjectView } from '@/components/site/project/ProjectView'
import { getPublicRepo } from '@/lib/data'
import { getDictionary, isLocale, locales } from '@/lib/i18n'
import { breadcrumbJsonLd, pageAlternates } from '@/lib/seo'
import { coverOf, localizedProject, projectHref } from '@/lib/view'

export const revalidate = 300

type Params = Promise<{ locale: string; slug: string }>

export async function generateStaticParams() {
  try {
    const projects = await getPublicRepo().listPublishedProjects()
    return locales.flatMap((locale) => projects.map((p) => ({ locale, slug: p.slug })))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const repo = getPublicRepo()
  const project = await repo.getPublishedProjectBySlug(slug)
  if (!project) return {}
  const p = localizedProject(project, locale)
  const cover = coverOf(project)
  const description = `${p.shortDescription} ${project.location}, ${project.year}.`.trim()
  return {
    title: p.name,
    description,
    alternates: pageAlternates(`/projects/${project.slug}`, locale),
    openGraph: {
      type: 'article',
      title: p.name,
      description,
      images: cover ? [{ url: repo.imageUrls(cover).full, width: cover.width, height: cover.height, alt: cover.altText || p.name }] : undefined,
    },
  }
}

export default async function ProjectPage({ params }: { params: Params }) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const repo = getPublicRepo()
  const [project, settings, all] = await Promise.all([repo.getPublishedProjectBySlug(slug), repo.getSettings(), repo.listPublishedProjects()])
  if (!project) notFound()
  const dict = getDictionary(locale)
  const position = all.findIndex((p) => p.id === project.id)
  const previous = position > 0 ? all[position - 1] : null
  const next = position >= 0 && position < all.length - 1 ? all[position + 1] : null
  const p = localizedProject(project, locale)

  return (
    <>
      <ProjectView locale={locale} dict={dict} project={project} settings={settings} repo={repo} previous={previous} next={next} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: dict.nav.home, path: locale === 'es' ? '/es' : '/' },
              { name: dict.projects.label, path: locale === 'es' ? '/es/projects' : '/projects' },
              { name: p.name, path: projectHref(locale, project.slug) },
            ]),
          ),
        }}
      />
    </>
  )
}
