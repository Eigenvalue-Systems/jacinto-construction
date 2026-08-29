import type { MetadataRoute } from 'next'
import { getPublicRepo } from '@/lib/data'
import { localePath, locales } from '@/lib/i18n'
import { siteUrl } from '@/lib/view'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const repo = getPublicRepo()
  let projects: Array<{ slug: string; updatedAt: string }> = []
  try {
    projects = await repo.listPublishedProjects()
  } catch {
    projects = []
  }
  const pages = ['/', '/projects', '/about', '/contact']
  const entries: MetadataRoute.Sitemap = []
  for (const path of pages) {
    for (const locale of locales) {
      entries.push({
        url: `${base}${localePath(locale, path)}`,
        changeFrequency: path === '/' ? 'weekly' : 'monthly',
        priority: path === '/' ? 1 : 0.7,
        alternates: { languages: { en: `${base}${localePath('en', path)}`, es: `${base}${localePath('es', path)}` } },
      })
    }
  }
  for (const project of projects) {
    const path = `/projects/${project.slug}`
    for (const locale of locales) {
      entries.push({
        url: `${base}${localePath(locale, path)}`,
        lastModified: new Date(project.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.6,
        alternates: { languages: { en: `${base}${localePath('en', path)}`, es: `${base}${localePath('es', path)}` } },
      })
    }
  }
  return entries
}
