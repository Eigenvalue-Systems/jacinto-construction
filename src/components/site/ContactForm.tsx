'use client'

import { useActionState, useEffect, useRef } from 'react'
import { sendContactMessage, type ContactState } from '@/app/[locale]/contact/actions'
import styles from './ContactForm.module.css'

export interface ContactFormStrings {
  formTitle: string
  name: string
  contactField: string
  message: string
  send: string
  sending: string
  successTitle: string
  success: string
  errorTitle: string
  error: string
  required: string
  invalidContact: string
  tooShort: string
}

interface Props {
  locale: string
  strings: ContactFormStrings
}

const initial: ContactState = { status: 'idle', errors: {} }

export function ContactForm({ locale, strings }: Props) {
  const [state, action, pending] = useActionState(sendContactMessage, initial)
  const startedRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now())
  }, [])

  const errorText = (code?: string) => {
    if (!code) return null
    if (code === 'required') return strings.required
    if (code === 'invalid') return strings.invalidContact
    if (code === 'short') return strings.tooShort
    return null
  }

  if (state.status === 'success') {
    return (
      <div className={`notice notice-ok ${styles.result}`} role="status">
        <p className={styles.resultTitle}>{strings.successTitle}</p>
        <p className="reflective">{strings.success}</p>
      </div>
    )
  }

  const failed = state.status === 'error' && Object.keys(state.errors).length === 0

  return (
    <form action={action} className={styles.form} noValidate>
      <h2 className={`eyebrow ${styles.formTitle}`}>{strings.formTitle}</h2>
      <input type="hidden" name="locale" value={locale} />
      <input ref={startedRef} type="hidden" name="started" defaultValue="" />
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="contact-company">Company</label>
        <input id="contact-company" type="text" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="field">
        <label htmlFor="contact-name">{strings.name}</label>
        <input id="contact-name" name="name" type="text" autoComplete="name" required aria-invalid={!!state.errors.name} aria-describedby={state.errors.name ? 'contact-name-error' : undefined} />
        {state.errors.name ? (
          <p id="contact-name-error" className="field-error">
            {errorText(state.errors.name)}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="contact-contact">{strings.contactField}</label>
        <input id="contact-contact" name="contact" type="text" autoComplete="tel email" inputMode="text" required aria-invalid={!!state.errors.contact} aria-describedby={state.errors.contact ? 'contact-contact-error' : undefined} />
        {state.errors.contact ? (
          <p id="contact-contact-error" className="field-error">
            {errorText(state.errors.contact)}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="contact-message">{strings.message}</label>
        <textarea id="contact-message" name="message" rows={5} required aria-invalid={!!state.errors.message} aria-describedby={state.errors.message ? 'contact-message-error' : undefined} />
        {state.errors.message ? (
          <p id="contact-message-error" className="field-error">
            {errorText(state.errors.message)}
          </p>
        ) : null}
      </div>

      {failed ? (
        <div className="notice notice-error" role="alert">
          <p className={styles.resultTitle}>{strings.errorTitle}</p>
          <p>{strings.error}</p>
        </div>
      ) : null}

      <div className={styles.actions}>
        <button type="submit" className="btn btn-ink" disabled={pending}>
          {pending ? strings.sending : strings.send} <span className="arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  )
}
