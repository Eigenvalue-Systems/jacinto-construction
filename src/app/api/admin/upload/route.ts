import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/auth'
import { getAdminRepo } from '@/lib/data'
import { IMAGE_GROUPS, type ImageGroup, type StoredFile } from '@/lib/data/types'

const LIMITS = { full: 6 * 1024 * 1024, medium: 2 * 1024 * 1024, thumb: 600 * 1024, brand: 1024 * 1024 }
const BRAND_TYPES: Record<string, string> = { 'image/svg+xml': 'svg', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

async function bytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer())
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) return bad('unauthorized', 401)
  const form = await request.formData()
  const kind = String(form.get('kind') ?? 'project')
  const repo = await getAdminRepo()

  if (kind === 'brand') {
    const file = form.get('file')
    if (!(file instanceof File)) return bad('missing-file')
    const ext = BRAND_TYPES[file.type]
    if (!ext) return bad('unsupported-type')
    if (file.size > LIMITS.brand) return bad('too-large')
    const body = await bytes(file)
    if (ext === 'svg') {
      const text = new TextDecoder().decode(body)
      if (/<script|on[a-z]+\s*=|javascript:|<foreignObject/i.test(text)) return bad('unsupported-type')
    }
    const key = `brand/${randomUUID()}.${ext}`
    await repo.storeFiles([{ key, body, contentType: file.type }])
    return NextResponse.json({ key, url: repo.imageUrls({ storageKey: key, storageKeyMedium: null, storageKeyThumb: null }).full })
  }

  const projectIdRaw = String(form.get('projectId') ?? '')
  const projectId = projectIdRaw ? projectIdRaw : null
  const groupRaw = String(form.get('group') ?? 'gallery') as ImageGroup
  const group: ImageGroup = IMAGE_GROUPS.includes(groupRaw) ? groupRaw : 'gallery'
  const width = Number(form.get('width'))
  const height = Number(form.get('height'))
  const altText = String(form.get('altText') ?? '').slice(0, 300)
  const full = form.get('full')
  const medium = form.get('medium')
  const thumb = form.get('thumb')
  if (!(full instanceof File) || !(medium instanceof File) || !(thumb instanceof File)) return bad('missing-file')
  if (![full, medium, thumb].every((f) => f.type === 'image/jpeg')) return bad('unsupported-type')
  if (full.size > LIMITS.full || medium.size > LIMITS.medium || thumb.size > LIMITS.thumb) return bad('too-large')
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 10000 || height > 10000) return bad('bad-dimensions')

  const parent = projectId ? await repo.getProjectById(projectId) : null
  if (projectId && !parent) return bad('project-not-found', 404)
  const existing = parent?.images ?? []

  const imageId = randomUUID()
  const base = projectId ? `projects/${projectId}/${imageId}` : `site/${imageId}`
  const files: StoredFile[] = [
    { key: `${base}-full.jpg`, body: await bytes(full), contentType: 'image/jpeg' },
    { key: `${base}-medium.jpg`, body: await bytes(medium), contentType: 'image/jpeg' },
    { key: `${base}-thumb.jpg`, body: await bytes(thumb), contentType: 'image/jpeg' },
  ]
  await repo.storeFiles(files)

  const defaultAlt = parent ? `${parent.name}, project photo ${existing.length + 1}` : ''
  const image = await repo.addImage({
    projectId,
    storageKey: files[0].key,
    storageKeyMedium: files[1].key,
    storageKeyThumb: files[2].key,
    altText: altText.trim() || defaultAlt,
    caption: '',
    width,
    height,
    group,
    displayOrder: existing.reduce((m, i) => Math.max(m, i.displayOrder), 0) + 1,
  })
  const project = projectId ? await repo.getProjectById(projectId) : null
  revalidatePath('/', 'layout')
  return NextResponse.json({ image: { ...image, urls: repo.imageUrls(image) }, coverImageId: project?.coverImageId ?? null })
}
