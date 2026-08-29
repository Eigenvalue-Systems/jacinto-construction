import en from './en'
import es from './es'
import type { Dictionary } from './types'
import type { Locale } from '@/lib/data/types'

export const locales: Locale[] = ['en', 'es']
export const defaultLocale: Locale = 'en'
export const LANG_COOKIE = 'lang'

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'en' || value === 'es'
}

export function getDictionary(locale: Locale): Dictionary {
  return locale === 'es' ? es : en
}

export function localePath(locale: Locale, path = '/') {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (locale === 'en') return clean
  return clean === '/' ? '/es' : `/es${clean}`
}

export function stripLocale(pathname: string): { locale: Locale; path: string } {
  if (pathname === '/es') return { locale: 'es', path: '/' }
  if (pathname.startsWith('/es/')) return { locale: 'es', path: pathname.slice(3) }
  return { locale: 'en', path: pathname }
}

export function pick(locale: Locale, base: string, alt: string | null | undefined) {
  if (locale === 'es' && alt && alt.trim()) return alt
  return base
}

export type { Dictionary }

export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''))
}

export function plural(n: number, one: string, many: string) {
  return n === 1 ? one : fmt(many, { n })
}
