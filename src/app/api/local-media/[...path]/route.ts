import { promises as fs } from 'node:fs'
import { NextResponse, type NextRequest } from 'next/server'
import { dataMode } from '@/lib/data'
import { safeMediaPath } from '@/lib/data/local'

const TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml' }

export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (dataMode() !== 'local') return new NextResponse('Not found', { status: 404 })
  const { path } = await params
  const key = path.join('/')
  let target: string
  try {
    target = safeMediaPath(key)
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
  try {
    const body = await fs.readFile(target)
    const ext = key.split('.').pop()?.toLowerCase() ?? ''
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': TYPES[ext] ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
