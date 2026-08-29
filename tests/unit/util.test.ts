import { describe, expect, it } from 'vitest'
import { formatMoney, makeExcerpt, parseMoney, phoneToE164, slugify, splitLines, splitParagraphs } from '@/lib/data/util'
import { fmt, localePath, pick, plural, stripLocale } from '@/lib/i18n'
import { layoutRows } from '@/components/site/project/Gallery'
import { buildContactEmail, emailConfigured } from '@/lib/email'
import { isEmailAllowed } from '@/lib/supabase/env'
import { sortProjects } from '@/lib/data/local'

describe('slugify', () => {
  it('lowercases, strips accents and collapses separators', () => {
    expect(slugify('Restauración de Mampostería 2025')).toBe('restauracion-de-mamposteria-2025')
    expect(slugify('  Two-Flat  Masonry / Repair!! ')).toBe('two-flat-masonry-repair')
    expect(slugify('')).toBe('')
  })
})

describe('phoneToE164', () => {
  it('formats a US ten digit number', () => {
    expect(phoneToE164('(773) 574-1060')).toBe('+17735741060')
    expect(phoneToE164('1 773 574 1060')).toBe('+17735741060')
  })
})

describe('text helpers', () => {
  it('splits lines and paragraphs', () => {
    expect(splitLines('a\n\n b \nc')).toEqual(['a', 'b', 'c'])
    expect(splitParagraphs('one\ntwo\n\nthree')).toEqual(['one\ntwo', 'three'])
  })

  it('makes a short preview from the first sentences of a description', () => {
    const description = 'The front and side elevations were ground out and repointed. Six rusted lintels were replaced and the parapet was rebuilt. Scaffolding came down as each elevation finished.\n\nSecond paragraph that should not appear.'
    const excerpt = makeExcerpt(description)
    expect(excerpt).toBe('The front and side elevations were ground out and repointed. Six rusted lintels were replaced and the parapet was rebuilt.')
    expect(makeExcerpt('Short and sweet.')).toBe('Short and sweet.')
    expect(makeExcerpt('')).toBe('')
    const long = 'A'.repeat(300)
    expect(makeExcerpt(long).length).toBeLessThanOrEqual(161)
  })
})

describe('project value', () => {
  it('parses plain numbers, commas and dollar signs', () => {
    expect(parseMoney('185000')).toBe(185000)
    expect(parseMoney('185,000')).toBe(185000)
    expect(parseMoney('$1,250,000')).toBe(1250000)
    expect(parseMoney('25000.50')).toBe(25000.5)
    expect(parseMoney('')).toBeNull()
    expect(parseMoney('   ')).toBeNull()
    expect(parseMoney('abc')).toBeNull()
    expect(parseMoney('-5')).toBe(5)
  })

  it('formats as whole US dollars and stays blank when empty', () => {
    expect(formatMoney(185000)).toBe('$185,000')
    expect(formatMoney(1250000)).toBe('$1,250,000')
    expect(formatMoney(25000.5)).toBe('$25,001')
    expect(formatMoney(null)).toBeNull()
    expect(formatMoney(undefined)).toBeNull()
  })
})

describe('project ordering', () => {
  it('sorts newest year first, then manual order, then newest created', () => {
    const list = [
      { id: 'a', year: 2023, displayOrder: 1, createdAt: '2024-01-01' },
      { id: 'b', year: 2025, displayOrder: 2, createdAt: '2024-01-01' },
      { id: 'c', year: 2025, displayOrder: 1, createdAt: '2024-01-01' },
      { id: 'd', year: 2024, displayOrder: 0, createdAt: '2024-06-01' },
      { id: 'e', year: 2024, displayOrder: 0, createdAt: '2024-02-01' },
    ]
    expect(sortProjects(list).map((p) => p.id)).toEqual(['c', 'b', 'd', 'e', 'a'])
  })
})

describe('i18n helpers', () => {
  it('builds locale paths', () => {
    expect(localePath('en', '/projects')).toBe('/projects')
    expect(localePath('es', '/projects')).toBe('/es/projects')
    expect(localePath('es', '/')).toBe('/es')
  })
  it('strips locale prefixes', () => {
    expect(stripLocale('/es/projects/x')).toEqual({ locale: 'es', path: '/projects/x' })
    expect(stripLocale('/es')).toEqual({ locale: 'es', path: '/' })
    expect(stripLocale('/about')).toEqual({ locale: 'en', path: '/about' })
  })
  it('formats templates and plurals', () => {
    expect(fmt('{i} of {n}', { i: 2, n: 7 })).toBe('2 of 7')
    expect(plural(1, '1 photo', '{n} photos')).toBe('1 photo')
    expect(plural(3, '1 photo', '{n} photos')).toBe('3 photos')
  })
  it('falls back to English when a Spanish field is empty', () => {
    expect(pick('es', 'Kitchen', 'Cocina')).toBe('Cocina')
    expect(pick('es', 'Kitchen', '')).toBe('Kitchen')
    expect(pick('es', 'Kitchen', null)).toBe('Kitchen')
    expect(pick('en', 'Kitchen', 'Cocina')).toBe('Kitchen')
  })
})

describe('gallery layout', () => {
  it('pairs consecutive portraits and alternates landscape rows', () => {
    const rows = layoutRows([
      { width: 3000, height: 2000 },
      { width: 2000, height: 3000 },
      { width: 2000, height: 3000 },
      { width: 3000, height: 2000 },
      { width: 2000, height: 3000 },
    ])
    expect(rows.map((r) => r.kind)).toEqual(['full', 'pair', 'wide', 'portrait'])
    expect(rows.flatMap((r) => r.items)).toEqual([0, 1, 2, 3, 4])
  })
})

describe('contact recipient configuration', () => {
  const env = { CONTACT_TO_EMAIL: 'luisjacinto1107@gmail.com', RESEND_API_KEY: 're_test', CONTACT_FROM_EMAIL: 'Jacinto Construction <onboarding@resend.dev>' }

  it('addresses messages to the configured recipient, not the admin', () => {
    const payload = buildContactEmail({ name: 'Ana', contact: 'ana@example.com', message: 'Porch repair', locale: 'es' }, env)
    expect(payload?.to).toEqual(['luisjacinto1107@gmail.com'])
    expect(payload?.replyTo).toBe('ana@example.com')
    expect(payload?.text).toContain('Language: Spanish')
    expect(payload?.html).not.toContain('<script')
  })

  it('uses no reply address for a phone number and escapes html', () => {
    const payload = buildContactEmail({ name: '<b>Bob</b>', contact: '773 555 0100', message: 'Hi', locale: 'en' }, env)
    expect(payload?.replyTo).toBeUndefined()
    expect(payload?.html).toContain('&lt;b&gt;Bob&lt;/b&gt;')
  })

  it('is not configured without a key or recipient', () => {
    expect(emailConfigured({ CONTACT_TO_EMAIL: 'x@y.com' })).toBe(false)
    expect(emailConfigured(env)).toBe(true)
    expect(buildContactEmail({ name: 'a', contact: 'b', message: 'c', locale: 'en' }, {})).toBeNull()
  })
})

describe('admin allow list', () => {
  it('only allows the configured admin when ADMIN_EMAILS is set', () => {
    const previous = process.env.ADMIN_EMAILS
    process.env.ADMIN_EMAILS = 'chaidezjason@gmail.com'
    expect(isEmailAllowed('chaidezjason@gmail.com')).toBe(true)
    expect(isEmailAllowed('CHAIDEZJASON@gmail.com')).toBe(true)
    expect(isEmailAllowed('luisjacinto1107@gmail.com')).toBe(false)
    expect(isEmailAllowed(null)).toBe(false)
    process.env.ADMIN_EMAILS = ''
    expect(isEmailAllowed('anyone@example.com')).toBe(true)
    process.env.ADMIN_EMAILS = previous
  })
})
