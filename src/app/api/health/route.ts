import { NextResponse } from 'next/server'
import { dataMode, getPublicRepo } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const years = await getPublicRepo().listPublishedYears()
    return NextResponse.json({ ok: true, mode: dataMode(), years: years.length, time: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ ok: false, mode: dataMode(), error: error instanceof Error ? error.message : 'unknown' }, { status: 500 })
  }
}
