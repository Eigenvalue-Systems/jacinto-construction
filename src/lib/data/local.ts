import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type {
  AdminRepository,
  ContactMessage,
  ImageInput,
  ImagePatch,
  ImageUrls,
  Project,
  ProjectFilter,
  ProjectImage,
  ProjectInput,
  ProjectPatch,
  SettingsPatch,
  SiteSettings,
  StoredFile,
} from './types'
import { loadSeedProjects, loadSeedSettings } from './seed'

interface Db {
  projects: Array<Omit<Project, 'images'>>
  images: ProjectImage[]
  settings: SiteSettings
  messages: ContactMessage[]
}

export const LOCAL_DIR = path.join(process.cwd(), '.local-data')
const DB_FILE = path.join(LOCAL_DIR, 'db.json')
export const MEDIA_DIR = path.join(LOCAL_DIR, 'media')

let queue: Promise<unknown> = Promise.resolve()

function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn)
  queue = run.catch(() => undefined)
  return run
}

let initPromise: Promise<void> | null = null

function ensureDb() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await fs.access(DB_FILE)
      } catch {
        await writeDb(await freshDb())
      }
    })()
  }
  return initPromise
}

async function readDb(): Promise<Db> {
  await ensureDb()
  try {
    return JSON.parse(await fs.readFile(DB_FILE, 'utf8')) as Db
  } catch {
    initPromise = null
    await ensureDb()
    return JSON.parse(await fs.readFile(DB_FILE, 'utf8')) as Db
  }
}

async function freshDb(): Promise<Db> {
  const seeded = await loadSeedProjects()
  const settings = await loadSeedSettings()
  const projects: Db['projects'] = []
  const images: ProjectImage[] = []
  for (const p of seeded) {
    const { images: imgs, ...rest } = p
    projects.push(rest)
    images.push(...imgs)
  }
  return { projects, images, settings, messages: [] }
}

async function writeDb(db: Db) {
  await fs.mkdir(LOCAL_DIR, { recursive: true })
  const tmp = `${DB_FILE}.${randomUUID()}.tmp`
  await fs.writeFile(tmp, JSON.stringify(db, null, 2))
  await fs.rename(tmp, DB_FILE)
}

function now() {
  return new Date().toISOString()
}

function sortImages(images: ProjectImage[]) {
  return [...images].sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt.localeCompare(b.createdAt))
}

function attach(db: Db, p: Omit<Project, 'images'>): Project {
  return { ...p, images: sortImages(db.images.filter((i) => i.projectId === p.id)) }
}

export function sortProjects<T extends { displayOrder: number; year: number; createdAt: string }>(list: T[]) {
  return [...list].sort((a, b) => b.year - a.year || a.displayOrder - b.displayOrder || b.createdAt.localeCompare(a.createdAt))
}

function localUrl(key: string) {
  if (key.startsWith('public:')) return `/${key.slice('public:'.length)}`
  return `/api/local-media/${key}`
}

export class LocalRepository implements AdminRepository {
  readonly mode = 'local' as const

  async isAdmin() {
    return true
  }

  imageUrls(image: Pick<ProjectImage, 'storageKey' | 'storageKeyMedium' | 'storageKeyThumb'>): ImageUrls {
    const full = localUrl(image.storageKey)
    return {
      full,
      medium: image.storageKeyMedium ? localUrl(image.storageKeyMedium) : full,
      thumb: image.storageKeyThumb ? localUrl(image.storageKeyThumb) : full,
    }
  }

  async getSettings() {
    const db = await readDb()
    return db.settings
  }

  async listPublishedProjects(filter: ProjectFilter = {}) {
    const db = await readDb()
    return sortProjects(db.projects.filter((p) => p.published))
      .filter((p) => (filter.year ? p.year === filter.year : true))
      .map((p) => attach(db, p))
  }

  async listFeaturedProjects(limit = 6) {
    const db = await readDb()
    return sortProjects(db.projects.filter((p) => p.published && p.featured))
      .slice(0, limit)
      .map((p) => attach(db, p))
  }

  async getPublishedProjectBySlug(slug: string) {
    const db = await readDb()
    const p = db.projects.find((x) => x.slug === slug && x.published)
    return p ? attach(db, p) : null
  }

  async listPublishedYears() {
    const db = await readDb()
    return [...new Set(db.projects.filter((p) => p.published).map((p) => p.year))].sort((a, b) => b - a)
  }

  async getImageById(id: string) {
    const db = await readDb()
    return db.images.find((i) => i.id === id) ?? null
  }

  async saveContactMessage(input: Omit<ContactMessage, 'id' | 'createdAt'>) {
    await serialize(async () => {
      const db = await readDb()
      db.messages.unshift({ ...input, id: randomUUID(), createdAt: now() })
      await writeDb(db)
    })
  }

  async listAllProjects() {
    const db = await readDb()
    return sortProjects(db.projects).map((p) => attach(db, p))
  }

  async getProjectById(id: string) {
    const db = await readDb()
    const p = db.projects.find((x) => x.id === id)
    return p ? attach(db, p) : null
  }

  async createProject(input: ProjectInput) {
    return serialize(async () => {
      const db = await readDb()
      const ts = now()
      const maxOrder = db.projects.reduce((m, p) => Math.max(m, p.displayOrder), 0)
      const project = { ...input, displayOrder: input.displayOrder || maxOrder + 1, id: randomUUID(), createdAt: ts, updatedAt: ts }
      db.projects.push(project)
      await writeDb(db)
      return attach(db, project)
    })
  }

  async updateProject(id: string, patch: ProjectPatch) {
    return serialize(async () => {
      const db = await readDb()
      const idx = db.projects.findIndex((p) => p.id === id)
      if (idx === -1) throw new Error('Project not found')
      db.projects[idx] = { ...db.projects[idx], ...patch, updatedAt: now() }
      await writeDb(db)
      return attach(db, db.projects[idx])
    })
  }

  async deleteProject(id: string) {
    await serialize(async () => {
      const db = await readDb()
      const keys = db.images.filter((i) => i.projectId === id).flatMap((i) => [i.storageKey, i.storageKeyMedium, i.storageKeyThumb])
      db.projects = db.projects.filter((p) => p.id !== id)
      db.images = db.images.filter((i) => i.projectId !== id)
      await writeDb(db)
      await this.removeFiles(keys.filter((k): k is string => !!k))
    })
  }

  async duplicateProject(id: string) {
    return serialize(async () => {
      const db = await readDb()
      const src = db.projects.find((p) => p.id === id)
      if (!src) throw new Error('Project not found')
      const ts = now()
      const copy = {
        ...src,
        id: randomUUID(),
        name: `${src.name} (copy)`,
        slug: `${src.slug}-copy-${Math.random().toString(36).slice(2, 6)}`,
        published: false,
        featured: false,
        coverImageId: null as string | null,
        displayOrder: db.projects.reduce((m, p) => Math.max(m, p.displayOrder), 0) + 1,
        createdAt: ts,
        updatedAt: ts,
      }
      const idMap = new Map<string, string>()
      const copies: ProjectImage[] = db.images
        .filter((i) => i.projectId === id)
        .map((i) => {
          const nid = randomUUID()
          idMap.set(i.id, nid)
          return { ...i, id: nid, projectId: copy.id, createdAt: ts }
        })
      if (src.coverImageId && idMap.has(src.coverImageId)) copy.coverImageId = idMap.get(src.coverImageId)!
      db.projects.push(copy)
      db.images.push(...copies)
      await writeDb(db)
      return attach(db, copy)
    })
  }

  async reorderProjects(ids: string[]) {
    await serialize(async () => {
      const db = await readDb()
      ids.forEach((id, i) => {
        const p = db.projects.find((x) => x.id === id)
        if (p) p.displayOrder = i + 1
      })
      await writeDb(db)
    })
  }

  async isSlugTaken(slug: string, exceptId?: string) {
    const db = await readDb()
    return db.projects.some((p) => p.slug === slug && p.id !== exceptId)
  }

  async addImage(input: ImageInput) {
    return serialize(async () => {
      const db = await readDb()
      const image: ProjectImage = { ...input, id: randomUUID(), createdAt: now() }
      db.images.push(image)
      if (image.projectId) {
        const p = db.projects.find((x) => x.id === image.projectId)
        if (p && !p.coverImageId && image.group === 'gallery') p.coverImageId = image.id
      }
      await writeDb(db)
      return image
    })
  }

  async updateImage(id: string, patch: ImagePatch) {
    return serialize(async () => {
      const db = await readDb()
      const idx = db.images.findIndex((i) => i.id === id)
      if (idx === -1) throw new Error('Image not found')
      db.images[idx] = { ...db.images[idx], ...patch }
      await writeDb(db)
      return db.images[idx]
    })
  }

  async deleteImage(id: string) {
    await serialize(async () => {
      const db = await readDb()
      const img = db.images.find((i) => i.id === id)
      if (!img) return
      db.images = db.images.filter((i) => i.id !== id)
      for (const p of db.projects) {
        if (p.coverImageId === id) {
          const next = sortImages(db.images.filter((i) => i.projectId === p.id && i.group === 'gallery'))[0]
          p.coverImageId = next?.id ?? null
        }
      }
      if (db.settings.heroImageId === id) db.settings.heroImageId = null
      if (db.settings.aboutImageId === id) db.settings.aboutImageId = null
      await writeDb(db)
      await this.removeFiles([img.storageKey, img.storageKeyMedium, img.storageKeyThumb].filter((k): k is string => !!k))
    })
  }

  async reorderImages(projectId: string, ids: string[]) {
    await serialize(async () => {
      const db = await readDb()
      ids.forEach((id, i) => {
        const img = db.images.find((x) => x.id === id && x.projectId === projectId)
        if (img) img.displayOrder = i + 1
      })
      await writeDb(db)
    })
  }

  async listAllImages() {
    const db = await readDb()
    return sortImages(db.images)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((i) => {
        const p = db.projects.find((x) => x.id === i.projectId)
        return { ...i, projectName: p?.name ?? null, projectSlug: p?.slug ?? null }
      })
  }

  async storeFiles(files: StoredFile[]) {
    for (const f of files) {
      const target = safeMediaPath(f.key)
      await fs.mkdir(path.dirname(target), { recursive: true })
      await fs.writeFile(target, f.body)
    }
  }

  async removeFiles(keys: string[]) {
    for (const key of keys) {
      if (key.startsWith('public:')) continue
      try {
        await fs.unlink(safeMediaPath(key))
      } catch {
        continue
      }
    }
  }

  async updateSettings(patch: SettingsPatch) {
    return serialize(async () => {
      const db = await readDb()
      db.settings = { ...db.settings, ...patch, updatedAt: now() }
      await writeDb(db)
      return db.settings
    })
  }

  async countDemoProjects() {
    const db = await readDb()
    return db.projects.filter((p) => p.isDemo).length
  }

  async removeDemoProjects() {
    return serialize(async () => {
      const db = await readDb()
      const ids = new Set(db.projects.filter((p) => p.isDemo).map((p) => p.id))
      db.projects = db.projects.filter((p) => !ids.has(p.id))
      db.images = db.images.filter((i) => !(i.projectId && ids.has(i.projectId)))
      if (db.settings.heroImageId && !db.images.some((i) => i.id === db.settings.heroImageId)) db.settings.heroImageId = null
      if (db.settings.aboutImageId && !db.images.some((i) => i.id === db.settings.aboutImageId)) db.settings.aboutImageId = null
      await writeDb(db)
      return ids.size
    })
  }

  async listContactMessages() {
    const db = await readDb()
    return db.messages
  }

  async deleteContactMessage(id: string) {
    await serialize(async () => {
      const db = await readDb()
      db.messages = db.messages.filter((m) => m.id !== id)
      await writeDb(db)
    })
  }
}

export function safeMediaPath(key: string) {
  const resolved = path.resolve(MEDIA_DIR, key)
  if (!resolved.startsWith(MEDIA_DIR + path.sep)) throw new Error('Invalid media key')
  return resolved
}

let instance: LocalRepository | null = null

export function getLocalRepository() {
  if (!instance) instance = new LocalRepository()
  return instance
}
