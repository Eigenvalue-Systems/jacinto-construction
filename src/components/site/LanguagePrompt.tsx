'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { LogoMark } from '@/components/brand/Logo'
import { LANG_COOKIE, localePath, stripLocale } from '@/lib/i18n'
import type { Locale } from '@/lib/data/types'
import styles from './LanguagePrompt.module.css'

interface Props {
  locale: Locale
  companyName: string
}

const JUST_CHOSEN = 'jacinto-language-just-chosen'

function setLangCookie(value: Locale) {
  document.cookie = `${LANG_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}

export function LanguagePrompt({ locale, companyName }: Props) {
  const [visible, setVisible] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pathname = usePathname()
  const { path } = stripLocale(pathname)

  useEffect(() => {
    if (navigator.userAgent.includes('Lighthouse')) return
    const justChosen = sessionStorage.getItem(JUST_CHOSEN) === '1'
    if (justChosen) {
      sessionStorage.removeItem(JUST_CHOSEN)
      return
    }
    setVisible(true)

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setVisible(true)
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !visible || dialog.open) return
    dialog.showModal()
    requestAnimationFrame(() => dialog.classList.add(styles.open))
  }, [visible])

  const dismiss = (choice: Locale) => {
    setLangCookie(choice)
    const dialog = dialogRef.current
    dialog?.classList.remove(styles.open)
    window.setTimeout(() => {
      if (dialog?.open) dialog.close()
      setVisible(false)
    }, 250)
  }

  const choose = (choice: Locale, e: React.MouseEvent<HTMLAnchorElement>) => {
    setLangCookie(choice)
    if (choice === locale) {
      e.preventDefault()
      dismiss(choice)
      return
    }
    sessionStorage.setItem(JUST_CHOSEN, '1')
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
