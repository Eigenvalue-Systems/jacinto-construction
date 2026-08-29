import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AboutPreview, ContactClose, Hero, IndexPreview, SelectedWork } from '@/components/site/home/HomeSections'
import { getPublicRepo } from '@/lib/data'
import { getDictionary, isLocale } from '@/lib/i18n'
import { pageAlternates } from '@/lib/seo'
import { coverOf, localizedSettings } from '@/lib/view'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const settings = await getPublicRepo().getSettings()
  const s = localizedSettings(settings, locale)
  return {
    title: { absolute: `${settings.companyName} | ${s.homepageHeadline}` },
    description: s.metaDescription,
    alternates: pageAlternates('/', locale),
  }
}

const FEATURED_ORDER = [
  'chicago-south-side-kitchen',
  'homer-glen-steam-shower',
  'chicago-north-side-apartment',
  'lake-geneva-balcony',
  'hidden-basement-door',
  'toyota-dealership-tile',
]

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const repo = getPublicRepo()
  const [settings, markedRaw, allRaw] = await Promise.all([repo.getSettings(), repo.listFeaturedProjects(6), repo.listPublishedProjects()])
  const byDisplayOrder = <T extends { displayOrder: number; createdAt: string }>(items: T[]) =>
    [...items].sort((a, b) => a.displayOrder - b.displayOrder || b.createdAt.localeCompare(a.createdAt))
  const all = byDisplayOrder(allRaw)
  const marked = byDisplayOrder(markedRaw)
  const order = new Map(FEATURED_ORDER.map((slug, index) => [slug, index]))
  const featured = (marked.length > 0 ? marked : all.slice(0, 6)).sort(
    (a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999) || a.displayOrder - b.displayOrder,
  )

  const featuredDict = {
    ...dict,
    home: {
      ...dict.home,
      selectedLabel: locale === 'es' ? 'Portafolio' : 'Portfolio',
      selectedTitle: locale === 'es' ? 'Trabajo destacado.' : 'Featured work.',
    },
  }
  const featuredWithoutDates = featured.map((project) => ({ ...project, year: 0 }))

  const heroFromSettings = settings.heroImageId ? await repo.getImageById(settings.heroImageId) : null
  const heroProject = heroFromSettings
    ? (all.find((p) => p.id === heroFromSettings.projectId) ?? null)
    : (featured[0] ?? all[0] ?? null)
  const heroImage = heroFromSettings ?? (heroProject ? coverOf(heroProject) : null)
  const aboutImage = settings.aboutImageId ? await repo.getImageById(settings.aboutImageId) : null

  return (
    <>
      <Hero
        locale={locale}
        dict={dict}
        settings={settings}
        image={heroImage ? { image: heroImage, urls: repo.imageUrls(heroImage) } : null}
        project={heroProject}
      />
      <SelectedWork locale={locale} dict={featuredDict} projects={featuredWithoutDates} repo={repo} />
      <IndexPreview locale={locale} dict={dict} projects={all.slice(0, 8)} total={all.length} />
      <AboutPreview locale={locale} dict={dict} settings={settings} image={aboutImage ? { image: aboutImage, urls: repo.imageUrls(aboutImage) } : null} />
      <ContactClose locale={locale} dict={dict} settings={settings} />
    </>
  )
}
