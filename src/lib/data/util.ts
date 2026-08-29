import type { Project, ProjectInput } from './types'

export function toProjectInput(p: Project): ProjectInput {
  return {
    name: p.name,
    nameEs: p.nameEs,
    slug: p.slug,
    year: p.year,
    location: p.location,
    locationEs: p.locationEs,
    projectValue: p.projectValue,
    projectType: p.projectType,
    description: p.description,
    descriptionEs: p.descriptionEs,
    shortDescription: p.shortDescription,
    shortDescriptionEs: p.shortDescriptionEs,
    details: p.details,
    detailsEs: p.detailsEs,
    featured: p.featured,
    published: p.published,
    displayOrder: p.displayOrder,
    coverImageId: p.coverImageId,
    isDemo: p.isDemo,
  }
}

export function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function phoneToE164(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return `+${digits}`
}

export function splitLines(text: string | null | undefined) {
  return (text ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
}

export function splitParagraphs(text: string | null | undefined) {
  return (text ?? '')
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function makeExcerpt(text: string | null | undefined, max = 160) {
  const paragraph = splitParagraphs(text)[0] ?? ''
  const flat = paragraph.replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  const sentences = flat.match(/[^.!?]+[.!?]+(\s|$)/g) ?? []
  let out = ''
  for (const sentence of sentences) {
    if ((out + sentence).trim().length > max) break
    out += sentence
  }
  out = out.trim()
  if (out.length >= 40) return out
  const cut = flat.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 60 ? lastSpace : max).trim()}…`
}

export function parseMoney(raw: string | null | undefined): number | null {
  if (!raw) return null
  const cleaned = raw.replace(/[^0-9.]/g, '')
  if (!cleaned) return null
  const value = Number(cleaned)
  if (!Number.isFinite(value) || value < 0 || value > 999999999999) return null
  return Math.round(value * 100) / 100
}

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}
