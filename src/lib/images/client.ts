export interface PreparedImage {
  full: Blob
  medium: Blob
  thumb: Blob
  width: number
  height: number
}

export const MAX_SOURCE_BYTES = 60 * 1024 * 1024
const TARGETS = [
  { key: 'full', edge: 2400, quality: 0.86 },
  { key: 'medium', edge: 1200, quality: 0.84 },
  { key: 'thumb', edge: 480, quality: 0.82 },
] as const

const HEIC_TYPES = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'])

export function looksLikeHeic(file: File) {
  return HEIC_TYPES.has(file.type.toLowerCase()) || /\.(heic|heif)$/i.test(file.name)
}

async function hasHeicSignature(file: File) {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const brand = String.fromCharCode(...head.subarray(8, 12)).trim()
  return ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand)
}

export async function convertHeic(file: File, onStart?: () => void): Promise<File> {
  onStart?.()
  const { heicTo } = await import('heic-to/csp')
  const jpeg = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.95 })
  return new File([jpeg], file.name.replace(/\.(heic|heif)$/i, '') + '.jpg', { type: 'image/jpeg' })
}

async function decodeWithBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: 'from-image' })
}

function decodeWithElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('unreadable'))
    }
    img.src = url
  })
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await decodeWithBitmap(file)
    } catch {
      return decodeWithElement(file)
    }
  }
  return decodeWithElement(file)
}

function sizeOf(source: ImageBitmap | HTMLImageElement) {
  if ('naturalWidth' in source) return { width: source.naturalWidth, height: source.naturalHeight }
  return { width: source.width, height: source.height }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode'))), 'image/jpeg', quality)
  })
}

async function scaled(source: ImageBitmap | HTMLImageElement, edge: number, quality: number) {
  const { width, height } = sizeOf(source)
  const ratio = Math.min(1, edge / Math.max(width, height))
  const w = Math.max(1, Math.round(width * ratio))
  const h = Math.max(1, Math.round(height * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(source, 0, 0, w, h)
  const blob = await toBlob(canvas, quality)
  canvas.width = 0
  canvas.height = 0
  return { blob, w, h }
}

export async function prepareImage(file: File, onConvert?: () => void): Promise<PreparedImage> {
  if (file.size > MAX_SOURCE_BYTES) throw new Error('too-large')
  let input = file
  let source: ImageBitmap | HTMLImageElement
  try {
    if (looksLikeHeic(file) || (await hasHeicSignature(file))) input = await convertHeic(file, onConvert)
    source = await decode(input)
  } catch {
    try {
      if (input === file) input = await convertHeic(file, onConvert)
      source = await decode(input)
    } catch {
      throw new Error('unreadable')
    }
  }
  const { width, height } = sizeOf(source)
  if (!width || !height) throw new Error('unreadable')
  const out: Partial<Record<(typeof TARGETS)[number]['key'], Blob>> = {}
  let fullW = width
  let fullH = height
  for (const target of TARGETS) {
    const result = await scaled(source, target.edge, target.quality)
    out[target.key] = result.blob
    if (target.key === 'full') {
      fullW = result.w
      fullH = result.h
    }
  }
  if ('close' in source) source.close()
  return { full: out.full!, medium: out.medium!, thumb: out.thumb!, width: fullW, height: fullH }
}
