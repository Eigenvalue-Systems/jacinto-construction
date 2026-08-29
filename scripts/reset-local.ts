import { rmSync } from 'node:fs'
import path from 'node:path'

rmSync(path.join(process.cwd(), '.local-data'), { recursive: true, force: true })
console.log('Demo data reset. The sample projects come back the next time the site starts.')
