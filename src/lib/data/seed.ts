import demoProjects from '../../../database/seed/demo-projects.json'
import defaultSettings from '../../../database/seed/default-settings.json'
import type { ImageGroup, Project, ProjectImage, ProjectType, SiteSettings, SocialLink } from './types'
import { makeExcerpt } from './util'

const SEED_TIMESTAMP = '2025-01-01T00:00:00.000Z'
const DEMO_TYPES: ProjectType[] = ['exterior', 'kitchen', 'commercial', 'bathroom', 'interior', 'custom']

interface SeedImage {
  id: string
  file: string
  width: number
  height: number
  group: string
  altText: string
  caption: string
}

interface SeedProject {
  id: string
  name: string
  nameEs: string | null
  slug: string
  year: number
  location: string
  locationEs: string | null
  projectValue: number | null
  description: string
  descriptionEs: string | null
  details: string
  detailsEs: string | null
  featured: boolean
  published: boolean
  displayOrder: number
  coverImageId: string | null
  isDemo: boolean
  images: SeedImage[]
}

export function getSeedProjects(): Project[] {
  return (demoProjects as SeedProject[]).map((s, projectIndex) => {
    const images: ProjectImage[] = s.images.map((img, i) => ({
      id: img.id,
      projectId: s.id,
      storageKey: `public:placeholders/${img.file}`,
      storageKeyMedium: null,
      storageKeyThumb: null,
      altText: img.altText,
      caption: img.caption,
      width: img.width,
      height: img.height,
      group: img.group as ImageGroup,
      displayOrder: i + 1,
      createdAt: SEED_TIMESTAMP,
    }))
    return {
      id: s.id,
      name: s.name,
      nameEs: s.nameEs,
      slug: s.slug,
      year: s.year,
      location: s.location,
      locationEs: s.locationEs,
      projectValue: s.projectValue,
      projectType: DEMO_TYPES[projectIndex] ?? 'other',
      description: s.description,
      descriptionEs: s.descriptionEs,
      shortDescription: makeExcerpt(s.description),
      shortDescriptionEs: s.descriptionEs ? makeExcerpt(s.descriptionEs) : null,
      details: s.details,
      detailsEs: s.detailsEs,
      featured: s.featured,
      published: s.published,
      displayOrder: s.displayOrder,
      coverImageId: s.coverImageId,
      isDemo: true,
      images,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    }
  })
}

export function getSeedSettings(): SiteSettings {
  const s = defaultSettings as Omit<SiteSettings, 'updatedAt' | 'socialLinks'> & { socialLinks?: SocialLink[] }
  return { ...s, socialLinks: s.socialLinks ?? [], updatedAt: SEED_TIMESTAMP }
}

export async function loadSeedProjects() {
  return getSeedProjects()
}

export async function loadSeedSettings() {
  return getSeedSettings()
}
