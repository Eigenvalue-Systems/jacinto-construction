import { localePath, pick } from '@/lib/i18n'
import type { ImageUrls, Locale, Project, ProjectImage, Repository, SiteSettings } from '@/lib/data/types'
import { formatMoney, phoneToE164, splitLines, splitParagraphs } from '@/lib/data/util'

export function coverOf(project: Project): ProjectImage | null {
  const byId = project.coverImageId ? project.images.find((i) => i.id === project.coverImageId) : null
  return byId ?? project.images.find((i) => i.group === 'gallery') ?? project.images[0] ?? null
}

export function galleryOf(project: Project) {
  return project.images.filter((i) => i.group === 'gallery')
}

export function beforeAfterOf(project: Project) {
  const before = project.images.filter((i) => i.group === 'before')
  const after = project.images.filter((i) => i.group === 'after')
  if (before.length === 0 && after.length === 0) return null
  const pairs: Array<{ before: ProjectImage | null; after: ProjectImage | null }> = []
  const n = Math.max(before.length, after.length)
  for (let i = 0; i < n; i++) pairs.push({ before: before[i] ?? null, after: after[i] ?? null })
  return pairs
}

export function projectHref(locale: Locale, slug: string) {
  return localePath(locale, `/projects/${slug}`)
}

export function localizedProject(project: Project, locale: Locale) {
  const paragraphs = splitParagraphs(pick(locale, project.description, project.descriptionEs))
  return {
    name: pick(locale, project.name, project.nameEs),
    location: pick(locale, project.location, project.locationEs),
    shortDescription: pick(locale, project.shortDescription, project.shortDescriptionEs) || paragraphs[0] || '',
    paragraphs,
    details: splitLines(pick(locale, project.details, project.detailsEs)),
    value: formatMoney(project.projectValue),
  }
}

export function localizedSettings(settings: SiteSettings, locale: Locale) {
  const phone = phoneToE164(settings.phone)
  return {
    serviceArea: pick(locale, settings.serviceArea, settings.serviceAreaEs),
    homepageHeadline: pick(locale, settings.homepageHeadline, settings.homepageHeadlineEs),
    homepageIntro: pick(locale, settings.homepageIntro, settings.homepageIntroEs),
    aboutIntro: pick(locale, settings.aboutIntro, settings.aboutIntroEs),
    aboutParagraphs: splitParagraphs(pick(locale, settings.aboutCopy, settings.aboutCopyEs)),
    services: splitLines(pick(locale, settings.servicesList, settings.servicesListEs)),
    contactCopy: pick(locale, settings.contactCopy, settings.contactCopyEs),
    metaDescription: pick(locale, settings.defaultMetaDescription, settings.defaultMetaDescriptionEs),
    phoneHref: `tel:${phone}`,
    smsHref: `sms:${phone}`,
    emailHref: `mailto:${settings.email}`,
  }
}

export function imageUrlsFor(repo: Repository, image: ProjectImage | null): ImageUrls | null {
  return image ? repo.imageUrls(image) : null
}

export function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}
