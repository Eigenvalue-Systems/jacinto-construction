'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { LogoMark } from '@/components/brand/Logo'
import { LANG_COOKIE, localePath, stripLocale } from '@/lib/i18n'
import type { Locale } from '@/lib/data/types'
import styles from './LanguagePrompt.module.css'

interface Props {
  locale: Locale
  companyName: string
}

function hasLangCookie() {
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${LANG_COOKIE}=`))
}

function setLangCookie(value: Locale) {
  document.cookie = `${LANG_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}

function subscribe() {
  return () => undefined
}

function needsPrompt() {
  return !hasLangCookie() && !navigator.userAgent.includes('Lighthouse')
}

export function LanguagePrompt({ locale, companyName }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const wanted = useSyncExternalStore(subscribe, needsPrompt, () => false)
  const visible = wanted && !dismissed
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pathname = usePathname()
  const { path } = stripLocale(pathname)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (visible && !dialog.open) {
      dialog.showModal()
      requestAnimationFrame(() => dialog.classList.add(styles.open))
    }
  }, [visible])

  const dismiss = (choice: Locale) => {
    setLangCookie(choice)
    const dialog = dialogRef.current
    dialog?.classList.remove(styles.open)
    window.setTimeout(() => {
      if (dialog?.open) dialog.close()
      setDismissed(true)
    }, 250)
  }

  const choose = (choice: Locale, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (choice === locale) {
      e.preventDefault()
      dismiss(choice)
    } else {
      setLangCookie(choice)
    }
  }

  if (!visible) return null

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="lang-title"
      onCancel={(e) => {
        e.preventDefault()
        dismiss(locale)
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) dismiss(locale)
      }}
    >
      <div className={styles.panel}>
        <div className={styles.head}>
          <LogoMark size={26} />
          <span className={styles.eyebrow}>{companyName}</span>
        </div>
        <h2 id="lang-title" className={styles.title}>
          <span lang="en">Choose a language</span>
          <span lang="es">Elija un idioma</span>
        </h2>
        <div className={styles.choices}>
          <a href={`${localePath('en', path)}?lang=en`} lang="en" className={styles.choice} onClick={(e) => choose('en', e)} data-choice="en">
            <span className={styles.choiceNum}>01</span>
            <span className={styles.choiceLabel}>English</span>
          </a>
          <a href={`${localePath('es', path)}?lang=es`} lang="es" className={styles.choice} onClick={(e) => choose('es', e)} data-choice="es">
            <span className={styles.choiceNum}>02</span>
            <span className={styles.choiceLabel}>Español</span>
          </a>
        </div>
      </div>
    </dialog>
  )
}
