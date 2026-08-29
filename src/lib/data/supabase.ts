import type { SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import type {
  AdminRepository,
  ContactMessage,
  ImageGroup,
  ImageInput,
  ImagePatch,
  ImageUrls,
  Locale,
  Project,
  ProjectFilter,
  ProjectImage,
  ProjectInput,
  ProjectPatch,
  ProjectType,
  SettingsPatch,
  SiteSettings,
  SocialLink,
  StoredFile,
} from './types'
import { getSeedSettings } from './seed'
import { toProjectInput } from './util'

export const BUCKET = 'project-images'

interface ImageRow {
  id: string
  project_id: string | null
  storage_key: string
  storage_key_medium: string | null
  storage_key_thumb: string | null
  alt_text: string
  caption: string
  width: number
  height: number
  image_group: ImageGroup
  display_order: number
  created_at: string
}

interface ProjectRow {
  id: string
  name: string
  name_es: string | null
  slug: string
  year: number
  location: string
  location_es: string | null
  project_value: number | string | null
  project_type: ProjectType | null
  short_description: string
  short_description_es: string | null
  full_description: string
  full_description_es: string | null
  details: string
  details_es: string | null
  featured: boolean
  published: boolean
  display_order: number
  cover_image_id: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
  images?: ImageRow[]
}

interface SettingsRow {
  company_name: string
  owner_name: string
  phone: string
  email: string
  location: string
  service_area: string
  service_area_es: string | null
  homepage_headline: string
  homepage_headline_es: string | null
  homepage_intro: string
  homepage_intro_es: string | null
  about_intro: string
  about_intro_es: string | null
  about_copy: string
  about_copy_es: string | null
  services_list: string
  services_list_es: string | null
  contact_copy: string
  contact_copy_es: string | null
  default_meta_description: string
  default_meta_description_es: string | null
  social_links: SocialLink[] | null
  hero_image_id: string | null
  about_image_id: string | null
  logo_key: string | null
  favicon_key: string | null
  updated_at: string
}

interface MessageRow {
  id: string
  name: string
  contact: string
  message: string
  locale: string
  created_at: string
}

const PROJECT_SELECT = '*, images:project_images!project_images_project_id_fkey(*)'

function mapImage(r: ImageRow): ProjectImage {
  return {
    id: r.id,
    projectId: r.project_id,
    storageKey: r.storage_key,
    storageKeyMedium: r.storage_key_medium,
    storageKeyThumb: r.storage_key_thumb,
    altText: r.alt_text ?? '',
    caption: r.caption ?? '',
    width: r.width,
    height: r.height,
    group: r.image_group,
    displayOrder: r.display_order,
    createdAt: r.created_at,
  }
}

function mapProject(r: ProjectRow): Project {
  return {
    id: r.id,
    name: r.name,
    nameEs: r.name_es,
    slug: r.slug,
    year: r.year,
    location: r.location,
    locationEs: r.location_es,
    projectValue: r.project_value === null || r.project_value === undefined ? null : Number(r.project_value),
    projectType: r.project_type ?? null,
    description: r.full_description ?? '',
    descriptionEs: r.full_description_es,
    shortDescription: r.short_description ?? '',
    shortDescriptionEs: r.short_description_es,
    details: r.details ?? '',
    detailsEs: r.details_es,
    featured: r.featured,
    published: r.published,
    displayOrder: r.display_order,
    coverImageId: r.cover_image_id,
    isDemo: r.is_demo,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    images: (r.images ?? [])
      .map(mapImage)
      .sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt.localeCompare(b.createdAt)),
  }
}

function mapSettings(r: SettingsRow): SiteSettings {
  return {
    companyName: r.company_name,
    ownerName: r.owner_name,
    phone: r.phone,
    email: r.email,
    location: r.location,
    serviceArea: r.service_area,
    serviceAreaEs: r.service_area_es,
    homepageHeadline: r.homepage_headline,
    homepageHeadlineEs: r.homepage_headline_es,
    homepageIntro: r.homepage_intro,
    homepageIntroEs: r.homepage_intro_es,
    aboutIntro: r.about_intro,
    aboutIntroEs: r.about_intro_es,
    aboutCopy: r.about_copy,
    aboutCopyEs: r.about_copy_es,
    servicesList: r.services_list,
    servicesListEs: r.services_list_es,
    contactCopy: r.contact_copy,
    contactCopyEs: r.contact_copy_es,
    defaultMetaDescription: r.default_meta_description,
    defaultMetaDescriptionEs: r.default_meta_description_es,
    socialLinks: r.social_links ?? [],
    heroImageId: r.hero_image_id,
    aboutImageId: r.about_image_id,
    logoKey: r.logo_key,
    faviconKey: r.favicon_key,
    updatedAt: r.updated_at,
  }
}

function projectToRow(p: Partial<ProjectInput>): Partial<ProjectRow> {
  const row: Partial<ProjectRow> = {}
  if (p.name !== undefined) row.name = p.name
  if (p.nameEs !== undefined) row.name_es = p.nameEs
  if (p.slug !== undefined) row.slug = p.slug
  if (p.year !== undefined) row.year = p.year
  if (p.location !== undefined) row.location = p.location
  if (p.locationEs !== undefined) row.location_es = p.locationEs
  if (p.projectValue !== undefined) row.project_value = p.projectValue
  if (p.projectType !== undefined) row.project_type = p.projectType
  if (p.description !== undefined) row.full_description = p.description
  if (p.descriptionEs !== undefined) row.full_description_es = p.descriptionEs
  if (p.shortDescription !== undefined) row.short_description = p.shortDescription
  if (p.shortDescriptionEs !== undefined) row.short_description_es = p.shortDescriptionEs
  if (p.details !== undefined) row.details = p.details
  if (p.detailsEs !== undefined) row.details_es = p.detailsEs
  if (p.featured !== undefined) row.featured = p.featured
  if (p.published !== undefined) row.published = p.published
  if (p.displayOrder !== undefined) row.display_order = p.displayOrder
  if (p.coverImageId !== undefined) row.cover_image_id = p.coverImageId
  if (p.isDemo !== undefined) row.is_demo = p.isDemo
  return row
}

function imageToRow(i: Partial<ImageInput>): Partial<ImageRow> {
  const row: Partial<ImageRow> = {}
  if (i.projectId !== undefined) row.project_id = i.projectId
  if (i.storageKey !== undefined) row.storage_key = i.storageKey
  if (i.storageKeyMedium !== undefined) row.storage_key_medium = i.storageKeyMedium
  if (i.storageKeyThumb !== undefined) row.storage_key_thumb = i.storageKeyThumb
  if (i.altText !== undefined) row.alt_text = i.altText
  if (i.caption !== undefined) row.caption = i.caption
  if (i.width !== undefined) row.width = i.width
  if (i.height !== undefined) row.height = i.height
  if (i.group !== undefined) row.image_group = i.group
  if (i.displayOrder !== undefined) row.display_order = i.displayOrder
  return row
}

function settingsToRow(s: SettingsPatch): Partial<SettingsRow> {
  const row: Partial<SettingsRow> = {}
  const map: Record<keyof SettingsPatch, keyof SettingsRow> = {
    companyName: 'company_name',
    ownerName: 'owner_name',
    phone: 'phone',
    email: 'email',
    location: 'location',
    serviceArea: 'service_area',
    serviceAreaEs: 'service_area_es',
    homepageHeadline: 'homepage_headline',
    homepageHeadlineEs: 'homepage_headline_es',
    homepageIntro: 'homepage_intro',
    homepageIntroEs: 'homepage_intro_es',
    aboutIntro: 'about_intro',
    aboutIntroEs: 'about_intro_es',
    aboutCopy: 'about_copy',
    aboutCopyEs: 'about_copy_es',
    servicesList: 'services_list',
    servicesListEs: 'services_list_es',
    contactCopy: 'contact_copy',
    contactCopyEs: 'contact_copy_es',
    defaultMetaDescription: 'default_meta_description',
    defaultMetaDescriptionEs: 'default_meta_description_es',
    socialLinks: 'social_links',
    heroImageId: 'hero_image_id',
    aboutImageId: 'about_image_id',
    logoKey: 'logo_key',
    faviconKey: 'favicon_key',
  }
  for (const key of Object.keys(s) as Array<keyof SettingsPatch>) {
    const value = s[key]
    if (value === undefined) continue
    ;(row as Record<string, unknown>)[map[key]] = value
  }
  return row
}

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? 'unknown error'}`)
}

export class SupabaseRepository implements AdminRepository {
  readonly mode = 'supabase' as const
  private readonly baseUrl: string

  constructor(private readonly client: SupabaseClient) {
    this.baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`
  }

  private url(key: string) {
    if (key.startsWith('public:')) return `/${key.slice('public:'.length)}`
    return this.baseUrl + key
  }

  imageUrls(image: Pick<ProjectImage, 'storageKey' | 'storageKeyMedium' | 'storageKeyThumb'>): ImageUrls {
    const full = this.url(image.storageKey)
    return {
      full,
      medium: image.storageKeyMedium ? this.url(image.storageKeyMedium) : full,
      thumb: image.storageKeyThumb ? this.url(image.storageKeyThumb) : full,
    }
  }

  async isAdmin() {
    const { data, error } = await this.client.rpc('is_admin')
    if (error) return false
    return data === true
  }

  async getSettings() {
    const { data, error } = await this.client.from('site_settings').select('*').eq('id', 1).maybeSingle()
    if (error) fail('Load settings', error)
    return data ? mapSettings(data as SettingsRow) : getSeedSettings()
  }

  async listPublishedProjects(filter: ProjectFilter = {}) {
    let q = this.client.from('projects').select(PROJECT_SELECT).eq('published', true)
    if (filter.year) q = q.eq('year', filter.year)
    const { data, error } = await q.order('year', { ascending: false }).order('display_order').order('created_at', { ascending: false })
    if (error) fail('List projects', error)
    return (data as ProjectRow[]).map(mapProject)
  }

  async listFeaturedProjects(limit = 6) {
    const { data, error } = await this.client
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('published', true)
      .eq('featured', true)
      .order('year', { ascending: false })
      .order('display_order')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) fail('List featured projects', error)
    return (data as ProjectRow[]).map(mapProject)
  }

  async getPublishedProjectBySlug(slug: string) {
    const { data, error } = await this.client
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle()
    if (error) fail('Load project', error)
    return data ? mapProject(data as ProjectRow) : null
  }

  async listPublishedYears() {
    const { data, error } = await this.client.from('projects').select('year').eq('published', true)
    if (error) fail('List years', error)
    return [...new Set((data as Array<{ year: number }>).map((r) => r.year))].sort((a, b) => b - a)
  }

  async getImageById(id: string) {
    const { data, error } = await this.client.from('project_images').select('*').eq('id', id).maybeSingle()
    if (error) fail('Load image', error)
    return data ? mapImage(data as ImageRow) : null
  }

  async saveContactMessage(input: Omit<ContactMessage, 'id' | 'createdAt'>) {
    const { error } = await this.client.from('contact_messages').insert({
      name: input.name,
      contact: input.contact,
      message: input.message,
      locale: input.locale,
    })
    if (error) fail('Save message', error)
  }

  async listAllProjects() {
    const { data, error } = await this.client
      .from('projects')
      .select(PROJECT_SELECT)
      .order('year', { ascending: false })
      .order('display_order')
      .order('created_at', { ascending: false })
    if (error) fail('List projects', error)
    return (data as ProjectRow[]).map(mapProject)
  }

  async getProjectById(id: string) {
    const { data, error } = await this.client.from('projects').select(PROJECT_SELECT).eq('id', id).maybeSingle()
    if (error) fail('Load project', error)
    return data ? mapProject(data as ProjectRow) : null
  }

  async createProject(input: ProjectInput) {
    const { data: maxRow } = await this.client
      .from('projects')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextOrder = ((maxRow as { display_order: number } | null)?.display_order ?? 0) + 1
    const row = projectToRow({ ...input, displayOrder: input.displayOrder || nextOrder })
    const { data, error } = await this.client.from('projects').insert(row).select(PROJECT_SELECT).single()
    if (error) fail('Create project', error)
    return mapProject(data as ProjectRow)
  }

  async updateProject(id: string, patch: ProjectPatch) {
    const { data, error } = await this.client
      .from('projects')
      .update({ ...projectToRow(patch), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(PROJECT_SELECT)
      .single()
    if (error) fail('Update project', error)
    return mapProject(data as ProjectRow)
  }

  async deleteProject(id: string) {
    const project = await this.getProjectById(id)
    if (!project) return
    const keys = project.images.flatMap((i) => [i.storageKey, i.storageKeyMedium, i.storageKeyThumb]).filter((k): k is string => !!k)
    const { error } = await this.client.from('projects').delete().eq('id', id)
    if (error) fail('Delete project', error)
    await this.removeFiles(keys)
  }

  async duplicateProject(id: string) {
    const src = await this.getProjectById(id)
    if (!src) throw new Error('Project not found')
    const copy = await this.createProject({
      ...toProjectInput(src),
      name: `${src.name} (copy)`,
      slug: `${src.slug}-copy-${Math.random().toString(36).slice(2, 6)}`,
      published: false,
      featured: false,
      coverImageId: null,
      displayOrder: 0,
    })
    let coverId: string | null = null
    for (const img of src.images) {
      const copied = await this.copyImageFiles(img, copy.id)
      const created = await this.addImage({ ...copied, projectId: copy.id })
      if (img.id === src.coverImageId) coverId = created.id
    }
    return this.updateProject(copy.id, { coverImageId: coverId })
  }

  private async copyImageFiles(img: ProjectImage, projectId: string): Promise<ImageInput> {
    const newId = randomUUID()
    const copyKey = async (key: string | null, suffix: string) => {
      if (!key) return null
      if (key.startsWith('public:')) return key
      const ext = key.split('.').pop() ?? 'jpg'
      const target = `projects/${projectId}/${newId}-${suffix}.${ext}`
      const { error } = await this.client.storage.from(BUCKET).copy(key, target)
      if (error) fail('Copy image file', error)
      return target
    }
    return {
      projectId,
      storageKey: (await copyKey(img.storageKey, 'full')) as string,
      storageKeyMedium: await copyKey(img.storageKeyMedium, 'medium'),
      storageKeyThumb: await copyKey(img.storageKeyThumb, 'thumb'),
      altText: img.altText,
      caption: img.caption,
      width: img.width,
      height: img.height,
      group: img.group,
      displayOrder: img.displayOrder,
    }
  }

  async reorderProjects(ids: string[]) {
    for (const [i, id] of ids.entries()) {
      const { error } = await this.client.from('projects').update({ display_order: i + 1 }).eq('id', id)
      if (error) fail('Reorder projects', error)
    }
  }

  async isSlugTaken(slug: string, exceptId?: string) {
    let q = this.client.from('projects').select('id').eq('slug', slug)
    if (exceptId) q = q.neq('id', exceptId)
    const { data, error } = await q.limit(1)
    if (error) fail('Check slug', error)
    return (data ?? []).length > 0
  }

  async addImage(input: ImageInput) {
    const { data, error } = await this.client.from('project_images').insert(imageToRow(input)).select('*').single()
    if (error) fail('Add image', error)
    const image = mapImage(data as ImageRow)
    if (image.projectId && image.group === 'gallery') {
      const { data: p } = await this.client.from('projects').select('cover_image_id').eq('id', image.projectId).maybeSingle()
      if (p && !(p as { cover_image_id: string | null }).cover_image_id) {
        await this.client.from('projects').update({ cover_image_id: image.id }).eq('id', image.projectId)
      }
    }
    return image
  }

  async updateImage(id: string, patch: ImagePatch) {
    const { data, error } = await this.client.from('project_images').update(imageToRow(patch)).eq('id', id).select('*').single()
    if (error) fail('Update image', error)
    return mapImage(data as ImageRow)
  }

  async deleteImage(id: string) {
    const img = await this.getImageById(id)
    if (!img) return
    const { error } = await this.client.from('project_images').delete().eq('id', id)
    if (error) fail('Delete image', error)
    if (img.projectId) {
      const { data: p } = await this.client.from('projects').select('cover_image_id').eq('id', img.projectId).maybeSingle()
      if (p && (p as { cover_image_id: string | null }).cover_image_id === null) {
        const { data: next } = await this.client
          .from('project_images')
          .select('id')
          .eq('project_id', img.projectId)
          .eq('image_group', 'gallery')
          .order('display_order')
          .limit(1)
          .maybeSingle()
        if (next) await this.client.from('projects').update({ cover_image_id: (next as { id: string }).id }).eq('id', img.projectId)
      }
    }
    await this.removeFiles([img.storageKey, img.storageKeyMedium, img.storageKeyThumb].filter((k): k is string => !!k))
  }

  async reorderImages(projectId: string, ids: string[]) {
    for (const [i, id] of ids.entries()) {
      const { error } = await this.client.from('project_images').update({ display_order: i + 1 }).eq('id', id).eq('project_id', projectId)
      if (error) fail('Reorder images', error)
    }
  }

  async listAllImages() {
    const { data, error } = await this.client
      .from('project_images')
      .select('*, project:projects(name, slug)')
      .order('created_at', { ascending: false })
    if (error) fail('List images', error)
    return (data as Array<ImageRow & { project: { name: string; slug: string } | null }>).map((r) => ({
      ...mapImage(r),
      projectName: r.project?.name ?? null,
      projectSlug: r.project?.slug ?? null,
    }))
  }

  async storeFiles(files: StoredFile[]) {
    for (const f of files) {
      const body = new Blob([f.body as BlobPart], { type: f.contentType })
      const { error } = await this.client.storage.from(BUCKET).upload(f.key, body, { contentType: f.contentType, upsert: false })
      if (error) fail('Upload file', error)
    }
  }

  async removeFiles(keys: string[]) {
    const real = keys.filter((k) => !k.startsWith('public:'))
    if (real.length === 0) return
    await this.client.storage.from(BUCKET).remove(real)
  }

  async updateSettings(patch: SettingsPatch) {
    const { data, error } = await this.client
      .from('site_settings')
      .upsert({ id: 1, ...settingsToRow(patch), updated_at: new Date().toISOString() }, { onConflict: 'id' })
      .select('*')
      .single()
    if (error) fail('Save settings', error)
    return mapSettings(data as SettingsRow)
  }

  async countDemoProjects() {
    const { count, error } = await this.client.from('projects').select('id', { count: 'exact', head: true }).eq('is_demo', true)
    if (error) fail('Count demo projects', error)
    return count ?? 0
  }

  async removeDemoProjects() {
    const { data, error } = await this.client.from('projects').select('id').eq('is_demo', true)
    if (error) fail('List demo projects', error)
    const ids = (data as Array<{ id: string }>).map((r) => r.id)
    for (const id of ids) await this.deleteProject(id)
    return ids.length
  }

  async listContactMessages() {
    const { data, error } = await this.client.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(200)
    if (error) fail('List messages', error)
    return (data as MessageRow[]).map((r) => ({
      id: r.id,
      name: r.name,
      contact: r.contact,
      message: r.message,
      locale: (r.locale === 'es' ? 'es' : 'en') as Locale,
      createdAt: r.created_at,
    }))
  }

  async deleteContactMessage(id: string) {
    const { error } = await this.client.from('contact_messages').delete().eq('id', id)
    if (error) fail('Delete message', error)
  }
}
