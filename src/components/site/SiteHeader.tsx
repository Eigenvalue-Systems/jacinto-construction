'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LogoMark, Wordmark } from '@/components/brand/Logo'
import { localePath, stripLocale } from '@/lib/i18n'
import type { Locale } from '@/lib/data/types'
import styles from './SiteHeader.module.css'

export interface NavStrings {
  home: string
  projects: string
  about: string
  contact: string
  call: string
  menu: string
  openMenu: string
  closeMenu: string
  language: string
  english: string
  spanish: string
  switchTo: string
}

interface Props {
  locale: Locale
  strings: NavStrings
  phone: string
  phoneHref: string
  location: string
  companyName: string
  logoUrl: string | null
}

const REDUCED = '(prefers-reduced-motion: reduce)'

export function SiteHeader({ locale, strings, phone, phoneHref, location, companyName, logoUrl }: Props) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)
  const { path } = stripLocale(pathname)

  useEffect(() => {
    let ticking = false
    const update = () => {
      setScrolled(window.scrollY > 24)
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const close = useCallback(() => {
    const dialog = dialogRef.current
    if (!dialog || !dialog.open) return
    const reduced = window.matchMedia(REDUCED).matches
    dialog.classList.remove(styles.menuOpen)
    setOpen(false)
    const finish = () => {
      if (dialog.open) dialog.close()
      document.documentElement.classList.remove('menu-open')
      openerRef.current?.focus()
    }
    if (reduced) finish()
    else window.setTimeout(finish, 420)
  }, [])

  const show = useCallback(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    dialog.showModal()
    document.documentElement.classList.add('menu-open')
    setOpen(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => dialog.classList.add(styles.menuOpen))
    })
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onCancel = (e: Event) => {
      e.preventDefault()
      close()
    }
    const onClick = (e: MouseEvent) => {
      if (e.target === dialog) close()
    }
    dialog.addEventListener('cancel', onCancel)
    dialog.addEventListener('click', onClick)
    return () => {
      dialog.removeEventListener('cancel', onCancel)
      dialog.removeEventListener('click', onClick)
    }
  }, [close])

  const lastPath = useRef(pathname)
  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    close()
  }, [pathname, close])

  const links = [
    { href: localePath(locale, '/'), label: strings.home, match: '/' },
    { href: localePath(locale, '/projects'), label: strings.projects, match: '/projects' },
    { href: localePath(locale, '/about'), label: strings.about, match: '/about' },
    { href: localePath(locale, '/contact'), label: strings.contact, match: '/contact' },
  ]
  const isActive = (match: string) => (match === '/' ? path === '/' : path === match || path.startsWith(`${match}/`))
  const otherLocale: Locale = locale === 'en' ? 'es' : 'en'
  const switchHref = `${localePath(otherLocale, path)}?lang=${otherLocale}`

  return (
    <>
      <header className={styles.header} data-scrolled={scrolled ? 'true' : 'false'}>
        <div className={`wrap ${styles.inner}`}>
          <Link href={localePath(locale, '/')} className={styles.brand} aria-label={companyName}>
            {logoUrl ? <img src={logoUrl} alt="" className={styles.customLogo} /> : <LogoMark size={30} />}
            <Wordmark stacked className={styles.wordmark} />
          </Link>

          <nav className={styles.nav} aria-label={strings.menu}>
            <ul className={styles.navList}>
              {links.slice(1).map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={styles.navLink} aria-current={isActive(l.match) ? 'page' : undefined}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.actions}>
            <a href={switchHref} className={styles.lang} lang={otherLocale} title={strings.switchTo}>
              {otherLocale === 'es' ? strings.spanish : strings.english}
            </a>
            <a href={phoneHref} className={`btn btn-ink ${styles.callBtn}`}>
              <span className={styles.callLabel}>{strings.call}</span> {phone}
            </a>
            <a href={phoneHref} className={styles.callIcon} aria-label={`${strings.call} ${phone}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"
                />
              </svg>
            </a>
            <button
              ref={openerRef}
              type="button"
              className={styles.menuBtn}
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={show}
            >
              {strings.menu}
            </button>
          </div>
        </div>
      </header>

      <dialog ref={dialogRef} id="site-menu" className={styles.menu} aria-label={strings.menu}>
        <div className={styles.menuPanel}>
          <div className={styles.menuTop}>
            <Link href={localePath(locale, '/')} className={styles.brand} aria-label={companyName} onClick={close}>
              {logoUrl ? <img src={logoUrl} alt="" className={styles.customLogo} /> : <LogoMark size={30} />}
              <Wordmark stacked className={styles.wordmark} />
            </Link>
            <button type="button" className={styles.closeBtn} onClick={close}>
              {strings.closeMenu}
              <span className={styles.closeX} aria-hidden="true">
                ×
              </span>
            </button>
          </div>
          <ul className={styles.menuList}>
            {links.map((l, i) => (
              <li key={l.href} style={{ ['--i' as string]: i }}>
                <Link href={l.href} className={styles.menuLink} aria-current={isActive(l.match) ? 'page' : undefined} onClick={close}>
                  <span className={styles.menuNum}>{String(i + 1).padStart(2, '0')}</span>
                  <span>{l.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.menuFoot}>
            <a href={phoneHref} className={styles.menuPhone}>
              {phone}
            </a>
            <p className={`eyebrow ${styles.menuLocation}`}>{location}</p>
            <div className={styles.menuLang}>
              <a href={`${localePath('en', path)}?lang=en`} lang="en" aria-current={locale === 'en' ? 'true' : undefined}>
                {strings.english}
              </a>
              <span aria-hidden="true">/</span>
              <a href={`${localePath('es', path)}?lang=es`} lang="es" aria-current={locale === 'es' ? 'true' : undefined}>
                {strings.spanish}
              </a>
            </div>
          </div>
        </div>
      </dialog>
    </>
  )
}
