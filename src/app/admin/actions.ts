'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { dataMode, getAdminRepo } from '@/lib/data'
import { IMAGE_GROUPS, PROJECT_TYPES, type ImageGroup, type ProjectInput, type ProjectType, type SocialLink } from '@/lib/data/types'
import { makeExcerpt, parseMoney, slugify } from '@/lib/data/util'
import { isEmailAllowed } from '@/lib/supabase/env'
import { createServerSupabase } from '@/lib/supabase/server'
import { siteUrl } from '@/lib/view'

export interface FormState {
  status: 'idle' | 'ok' | 'error'
  code?: string
  message?: string
  fields?: Record<string, string>
}

const ok = (code?: string): FormState => ({ status: 'ok', code })
const fail = (code: string, fields?: Record<string, string>): FormState => ({ status: 'error', code, fields })

function text(formData: FormData, key: string, max = 4000) {
  return String(formData.get(key) ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, max)
}

function optional(formData: FormData, key: string, max = 4000) {
  const value = text(formData, key, max)
  return value ? value : null
}

function refreshSite() {
  revalidatePath('/', 'layout')
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  if (dataMode() === 'local') redirect('/admin/projects')
  const email = text(formData, 'email', 200).toLowerCase()
  const password = String(formData.get('password') ?? '')
  const next = text(formData, 'next', 200)
  if (!email || !password) return fail('failed')
  if (!isEmailAllowed(email)) return fail('not-allowed')
  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return fail('failed')
  const repo = await getAdminRepo()
  if (!(await repo.isAdmin())) {
    await supabase.auth.signOut()
    return fail('not-allowed')
  }
  redirect(next.startsWith('/admin') && !next.startsWith('/admin/login') ? next : '/admin/projects')
}

export async function signOut() {
  if (dataMode() === 'supabase') {
    const supabase = await createServerSupabase()
    await supabase.auth.signOut()
  }
  redirect('/admin/login')
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  if (dataMode() === 'local') return ok('reset-sent')
  const email = text(formData, 'email', 200).toLowerCase()
  if (!email) return fail('failed')
  const supabase = await createServerSupabase()
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl()}/admin/auth/callback?next=/admin/reset` })
  return ok('reset-sent')
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')
  if (password.length < 8) return fail('too-short')
  if (password !== confirm) return fail('mismatch')
  if (dataMode() === 'supabase') {
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return fail('invalid')
  }
  return ok('reset-done')
}

export async function createProject(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const name = text(formData, 'name', 160)
  if (!name) return fail('nameRequired')
  const repo = await getAdminRepo()
  let slug = slugify(name) || 'project'
  if (await repo.isSlugTaken(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`
  const project = await repo.createProject({
    name,
    nameEs: null,
    slug,
    year: new Date().getFullYear(),
    location: '',
    locationEs: null,
    projectValue: null,
    projectType: 'other',
    description: '',
    descriptionEs: null,
    shortDescription: '',
    shortDescriptionEs: null,
    details: '',
    detailsEs: null,
    featured: false,
    published: false,
    displayOrder: 0,
    coverImageId: null,
    isDemo: false,
  })
  redirect(`/admin/projects/${project.id}`)
}

export async function saveProject(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const id = text(formData, 'id', 80)
  const intent = text(formData, 'intent', 20)
  const repo = await getAdminRepo()
  const existing = await repo.getProjectById(id)
  if (!existing) return fail('generic')

  const name = text(formData, 'name', 160)
  if (!name) return fail('nameRequired', { name: 'nameRequired' })

  const yearRaw = text(formData, 'year', 4)
  const year = yearRaw ? Number(yearRaw) : null
  if (year !== null && (!Number.isInteger(year) || year < 1900 || year > 2100)) return fail('yearInvalid', { year: 'yearInvalid' })

  const projectTypeRaw = text(formData, 'projectType', 30)
  const projectType: ProjectType = PROJECT_TYPES.includes(projectTypeRaw as ProjectType) ? (projectTypeRaw as ProjectType) : 'other'
  const location = text(formData, 'location', 120)
  const description = text(formData, 'description', 8000)
  const valueRaw = text(formData, 'projectValue', 40)
  const projectValue = parseMoney(valueRaw)
  if (valueRaw && projectValue === null) return fail('valueInvalid', { projectValue: 'valueInvalid' })

  const rawSlug = text(formData, 'slug', 120)
  const slug = slugify(rawSlug || name)
  if (!slug) return fail('slugInvalid', { slug: 'slugInvalid' })
  if (await repo.isSlugTaken(slug, id)) return fail('slugTaken', { slug: 'slugTaken' })

  let published = existing.published
  if (intent === 'publish') published = true
  if (intent === 'unpublish') published = false
  if (published) {
    if (!location) return fail('locationRequired', { location: 'locationRequired' })
    if (!description) return fail('descriptionRequired', { description: 'descriptionRequired' })
  }

  const descriptionEs = optional(formData, 'descriptionEs', 8000)
  const patch: Partial<ProjectInput> = {
    name,
    nameEs: optional(formData, 'nameEs', 160),
    slug,
    year: (year as number) ?? (null as never),
    location,
    locationEs: optional(formData, 'locationEs', 120),
    projectValue,
    projectType,
    description,
    descriptionEs,
    shortDescription: makeExcerpt(description),
    shortDescriptionEs: descriptionEs ? makeExcerpt(descriptionEs) : null,
    details: text(formData, 'details', 2000),
    detailsEs: optional(formData, 'detailsEs', 2000),
    featured: formData.get('featured') === 'on',
    published,
  }

  try {
    await repo.updateProject(id, patch)
  } catch {
    return fail('generic')
  }
  refreshSite()
  if (intent === 'publish') return ok('published')
  if (intent === 'unpublish') return ok('unpublished')
  return ok('saved')
}

export async function deleteProject(formData: FormData) {
  await requireAdmin()
  const id = text(formData, 'id', 80)
  const repo = await getAdminRepo()
  await repo.deleteProject(id)
  refreshSite()
  redirect('/admin/projects?deleted=1')
}

export async function duplicateProject(formData: FormData) {
  await requireAdmin()
  const id = text(formData, 'id', 80)
  const repo = await getAdminRepo()
  const copy = await repo.duplicateProject(id)
  refreshSite()
  redirect(`/admin/projects/${copy.id}`)
}

export async function moveProject(formData: FormData) {
  await requireAdmin()
  const id = text(formData, 'id', 80)
  const direction = text(formData, 'direction', 5)
  const repo = await getAdminRepo()
  const all = [...(await repo.listAllProjects())].sort((a, b) => a.displayOrder - b.displayOrder || b.createdAt.localeCompare(a.createdAt))
  const group = all.map((p) => p.id)
  const index = group.indexOf(id)
  const target = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || target < 0 || target >= group.length) return
  ;[group[index], group[target]] = [group[target], group[index]]
  await repo.reorderProjects(group)
  refreshSite()
  revalidatePath('/admin/projects')
}

export async function removeDemoProjects() {
  await requireAdmin()
  const repo = await getAdminRepo()
  await repo.removeDemoProjects()
  refreshSite()
  redirect('/admin/projects?demoRemoved=1')
}

export async function updateImageDetails(input: { id: string; altText: string; caption: string; group: ImageGroup }) {
  await requireAdmin()
  const repo = await getAdminRepo()
  const group: ImageGroup = IMAGE_GROUPS.includes(input.group) ? input.group : 'gallery'
  const image = await repo.updateImage(input.id, {
    altText: input.altText.trim().slice(0, 300),
    caption: input.caption.trim().slice(0, 300),
    group,
  })
  refreshSite()
  return image
}

export async function deleteImage(input: { id: string }) {
  await requireAdmin()
  const repo = await getAdminRepo()
  await repo.deleteImage(input.id)
  refreshSite()
  return { ok: true }
}

export async function reorderImages(input: { projectId: string; ids: string[] }) {
  await requireAdmin()
  const repo = await getAdminRepo()
  await repo.reorderImages(input.projectId, input.ids.slice(0, 500))
  refreshSite()
  return { ok: true }
}

export async function setCoverImage(input: { projectId: string; imageId: string }) {
  await requireAdmin()
  const repo = await getAdminRepo()
  await repo.updateProject(input.projectId, { coverImageId: input.imageId })
  refreshSite()
  return { ok: true }
}

function parseSocialLinks(raw: string): SocialLink[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(',')
      const url = rest.join(',').trim()
      return { label: label.trim().slice(0, 60), url: url.slice(0, 300) }
    })
    .filter((l) => l.label && /^https?:\/\//.test(l.url))
    .slice(0, 10)
}

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const repo = await getAdminRepo()
  const heroImageId = optional(formData, 'heroImageId', 80)
  const aboutImageId = optional(formData, 'aboutImageId', 80)
  const logoKey = optional(formData, 'logoKey', 300)
  const faviconKey = optional(formData, 'faviconKey', 300)
  try {
    await repo.updateSettings({
      companyName: text(formData, 'companyName', 120) || 'Jacinto Construction',
      ownerName: text(formData, 'ownerName', 120),
      phone: text(formData, 'phone', 40),
      email: text(formData, 'email', 160),
      location: text(formData, 'location', 120),
      serviceArea: text(formData, 'serviceArea', 200),
      serviceAreaEs: optional(formData, 'serviceAreaEs', 200),
      homepageHeadline: text(formData, 'homepageHeadline', 160),
      homepageHeadlineEs: optional(formData, 'homepageHeadlineEs', 160),
      homepageIntro: text(formData, 'homepageIntro', 600),
      homepageIntroEs: optional(formData, 'homepageIntroEs', 600),
      aboutIntro: text(formData, 'aboutIntro', 600),
      aboutIntroEs: optional(formData, 'aboutIntroEs', 600),
      aboutCopy: text(formData, 'aboutCopy', 8000),
      aboutCopyEs: optional(formData, 'aboutCopyEs', 8000),
      servicesList: text(formData, 'servicesList', 2000),
      servicesListEs: optional(formData, 'servicesListEs', 2000),
      contactCopy: text(formData, 'contactCopy', 600),
      contactCopyEs: optional(formData, 'contactCopyEs', 600),
      defaultMetaDescription: text(formData, 'defaultMetaDescription', 400),
      defaultMetaDescriptionEs: optional(formData, 'defaultMetaDescriptionEs', 400),
      socialLinks: parseSocialLinks(text(formData, 'socialLinks', 3000)),
      heroImageId,
      aboutImageId,
      logoKey,
      faviconKey,
    })
  } catch {
    return fail('generic')
  }
  refreshSite()
  return ok('saved')
}

export async function deleteMessage(formData: FormData) {
  await requireAdmin()
  const id = text(formData, 'id', 80)
  const repo = await getAdminRepo()
  await repo.deleteContactMessage(id)
  revalidatePath('/admin/messages')
}

export async function deleteMediaImage(formData: FormData) {
  await requireAdmin()
  const id = text(formData, 'id', 80)
  const repo = await getAdminRepo()
  await repo.deleteImage(id)
  refreshSite()
  revalidatePath('/admin/media')
}
