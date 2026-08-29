import { promises as fs } from 'node:fs'
import path from 'node:path'

export async function resetDemoData() {
  await fs.rm(path.join(process.cwd(), '.local-data'), { recursive: true, force: true })
}
