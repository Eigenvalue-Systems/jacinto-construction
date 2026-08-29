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

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const repo = getPublicRepo()
  const [settings, marked, all] = await Promise.all([repo.getSettings(), repo.listFeaturedProjects(6), repo.listPublishedProjects()])
  const featured = marked.length > 0 ? marked : all.slice(0, 6)

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
      <SelectedWork locale={locale} dict={dict} projects={featured} repo={repo} />
      <IndexPreview locale={locale} dict={dict} projects={all.slice(0, 8)} total={all.length} />
      <AboutPreview locale={locale} dict={dict} settings={settings} image={aboutImage ? { image: aboutImage, urls: repo.imageUrls(aboutImage) } : null} />
      <ContactClose locale={locale} dict={dict} settings={settings} />
    </>
  )
}
