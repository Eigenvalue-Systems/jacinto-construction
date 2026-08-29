import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const url = process.env.TEST_DATABASE_URL
const root = process.cwd()

function psql(file: string) {
  const result = spawnSync('psql', ['-v', 'ON_ERROR_STOP=1', '-q', '-d', url as string, '-f', path.join(root, file)], { encoding: 'utf8' })
  return { ok: result.status === 0, output: `${result.stdout}\n${result.stderr}` }
}

describe.skipIf(!url)('row level security (needs TEST_DATABASE_URL pointing at an empty Postgres database)', () => {
  it('applies both migrations twice and enforces the admin allowlist', () => {
    const migrations = ['database/migrations/0001_init.sql', 'database/migrations/0002_v2_corrections.sql']
    for (const file of ['tests/db/stub-supabase.sql', ...migrations, ...migrations]) {
      const result = psql(file)
      expect(result.ok, `${file}\n${result.output}`).toBe(true)
    }
    const checks = psql('tests/db/rls.sql')
    expect(checks.ok, checks.output).toBe(true)
    expect(checks.output).toContain('RLS checks passed')
  })
})
