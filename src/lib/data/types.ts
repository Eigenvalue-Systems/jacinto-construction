export type Locale = 'en' | 'es'

export const PROJECT_TYPES = ['residential', 'commercial', 'renovation', 'other'] as const
export type ProjectType = (typeof PROJECT_TYPES)[number]

export const IMAGE_GROUPS = ['gallery', 'before', 'after'] as const
export type ImageGroup = (typeof IMAGE_GROUPS)[number]

export interface ProjectImage {
  id: string
  projectId: string | null
  storageKey: string
  storageKeyMedium: string | null
  storageKeyThumb: string | null
  altText: string
  caption: string
  width: number
  height: number
  group: ImageGroup
  displayOrder: number
  createdAt: string
}

export interface ImageUrls {
  full: string
  medium: string
  thumb: string
}

export interface Project {
  id: string
  name: string
  nameEs: string | null
  slug: string
  year: number
  location: string
  locationEs: string | null
  projectValue: number | null
  projectType: ProjectType | null
  description: string
  descriptionEs: string | null
  shortDescription: string
  shortDescriptionEs: string | null
  details: string
  detailsEs: string | null
  featured: boolean
  published: boolean
  displayOrder: number
  coverImageId: string | null
  isDemo: boolean
  createdAt: string
  updatedAt: string
  images: ProjectImage[]
}

export interface SocialLink {
  label: string
  url: string
}

export interface SiteSettings {
  companyName: string
  ownerName: string
  phone: string
  email: string
  location: string
  serviceArea: string
  serviceAreaEs: string | null
  homepageHeadline: string
  homepageHeadlineEs: string | null
  homepageIntro: string
  homepageIntroEs: string | null
  aboutIntro: string
  aboutIntroEs: string | null
  aboutCopy: string
  aboutCopyEs: string | null
  servicesList: string
  servicesListEs: string | null
  contactCopy: string
  contactCopyEs: string | null
  defaultMetaDescription: string
  defaultMetaDescriptionEs: string | null
  socialLinks: SocialLink[]
  heroImageId: string | null
  aboutImageId: string | null
  logoKey: string | null
  faviconKey: string | null
  updatedAt: string
}

export interface ContactMessage {
  id: string
  name: string
  contact: string
  message: string
  locale: Locale
  createdAt: string
}

export type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'images'>
export type ProjectPatch = Partial<ProjectInput>
export type ImageInput = Omit<ProjectImage, 'id' | 'createdAt'>
export type ImagePatch = Partial<Pick<ProjectImage, 'altText' | 'caption' | 'group' | 'displayOrder'>>
export type SettingsPatch = Partial<Omit<SiteSettings, 'updatedAt'>>

export interface ProjectFilter {
  year?: number
}

export interface StoredFile {
  key: string
  body: Uint8Array
  contentType: string
}

export interface Repository {
  readonly mode: 'local' | 'supabase'
  getSettings(): Promise<SiteSettings>
  listPublishedProjects(filter?: ProjectFilter): Promise<Project[]>
  listFeaturedProjects(limit?: number): Promise<Project[]>
  getPublishedProjectBySlug(slug: string): Promise<Project | null>
  listPublishedYears(): Promise<number[]>
  getImageById(id: string): Promise<ProjectImage | null>
  imageUrls(image: Pick<ProjectImage, 'storageKey' | 'storageKeyMedium' | 'storageKeyThumb'>): ImageUrls
  saveContactMessage(input: Omit<ContactMessage, 'id' | 'createdAt'>): Promise<void>
}

export interface AdminRepository extends Repository {
  isAdmin(): Promise<boolean>
  listAllProjects(): Promise<Project[]>
  getProjectById(id: string): Promise<Project | null>
  createProject(input: ProjectInput): Promise<Project>
  updateProject(id: string, patch: ProjectPatch): Promise<Project>
  deleteProject(id: string): Promise<void>
  duplicateProject(id: string): Promise<Project>
  reorderProjects(ids: string[]): Promise<void>
  isSlugTaken(slug: string, exceptId?: string): Promise<boolean>
  addImage(input: ImageInput): Promise<ProjectImage>
  updateImage(id: string, patch: ImagePatch): Promise<ProjectImage>
  deleteImage(id: string): Promise<void>
  reorderImages(projectId: string, ids: string[]): Promise<void>
  listAllImages(): Promise<Array<ProjectImage & { projectName: string | null; projectSlug: string | null }>>
  storeFiles(files: StoredFile[]): Promise<void>
  removeFiles(keys: string[]): Promise<void>
  updateSettings(patch: SettingsPatch): Promise<SiteSettings>
  countDemoProjects(): Promise<number>
  removeDemoProjects(): Promise<number>
  listContactMessages(): Promise<ContactMessage[]>
  deleteContactMessage(id: string): Promise<void>
}
