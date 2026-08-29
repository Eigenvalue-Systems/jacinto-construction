'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { requestPasswordReset, signIn, updatePassword, type FormState } from '@/app/admin/actions'

export interface LoginStrings {
  title: string
  email: string
  password: string
  submit: string
  forgot: string
  sendReset: string
  resetSent: string
  backToLogin: string
  failed: string
  notAllowed: string
  sessionExpired: string
  resetTitle: string
  newPassword: string
  confirmPassword: string
  resetSubmit: string
  resetMismatch: string
  resetTooShort: string
  resetDone: string
  resetInvalid: string
}

const idle: FormState = { status: 'idle' }

function messageFor(strings: LoginStrings, code?: string) {
  switch (code) {
    case 'failed':
      return strings.failed
    case 'not-allowed':
      return strings.notAllowed
    case 'expired':
      return strings.sessionExpired
    case 'reset-sent':
      return strings.resetSent
    case 'too-short':
      return strings.resetTooShort
    case 'mismatch':
      return strings.resetMismatch
    case 'invalid':
      return strings.resetInvalid
    case 'reset-done':
      return strings.resetDone
    default:
      return null
  }
}

export function LoginForm({ strings, next, initialError }: { strings: LoginStrings; next: string; initialError?: string }) {
  const [state, action, pending] = useActionState(signIn, idle)
  const message = messageFor(strings, state.code ?? initialError)
  return (
    <form action={action} className="admin-grid">
      <h1 className="admin-title">{strings.title}</h1>
      {message ? (
        <p className={`admin-notice ${state.status === 'error' || initialError ? 'admin-notice-error' : ''}`} role="alert">
          {message}
        </p>
      ) : null}
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="login-email">{strings.email}</label>
        <input id="login-email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="field">
        <label htmlFor="login-password">{strings.password}</label>
        <input id="login-password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <div className="admin-actions">
        <button type="submit" className="btn btn-ink" disabled={pending}>
          {strings.submit}
        </button>
      </div>
      <Link href="/admin/login?reset=1" className="link-plain" style={{ fontSize: 14 }}>
        {strings.forgot}
      </Link>
    </form>
  )
}

export function ResetRequestForm({ strings }: { strings: LoginStrings }) {
  const [state, action, pending] = useActionState(requestPasswordReset, idle)
  const message = messageFor(strings, state.code)
  return (
    <form action={action} className="admin-grid">
      <h1 className="admin-title">{strings.forgot}</h1>
      {message ? (
        <p className={`admin-notice ${state.status === 'error' ? 'admin-notice-error' : 'admin-notice-ok'}`} role="status">
          {message}
        </p>
      ) : null}
      <div className="field">
        <label htmlFor="reset-email">{strings.email}</label>
        <input id="reset-email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="admin-actions">
        <button type="submit" className="btn btn-ink" disabled={pending}>
          {strings.sendReset}
        </button>
      </div>
      <Link href="/admin/login" className="link-plain" style={{ fontSize: 14 }}>
        {strings.backToLogin}
      </Link>
    </form>
  )
}

export function NewPasswordForm({ strings }: { strings: LoginStrings }) {
  const [state, action, pending] = useActionState(updatePassword, idle)
  const message = messageFor(strings, state.code)
  return (
    <form action={action} className="admin-grid">
      <h1 className="admin-title">{strings.resetTitle}</h1>
      {message ? (
        <p className={`admin-notice ${state.status === 'error' ? 'admin-notice-error' : 'admin-notice-ok'}`} role="status">
          {message}
        </p>
      ) : null}
      {state.status === 'ok' ? (
        <Link href="/admin/projects" className="btn btn-ink" style={{ alignSelf: 'flex-start' }}>
          {strings.backToLogin}
        </Link>
      ) : (
        <>
          <div className="field">
            <label htmlFor="new-password">{strings.newPassword}</label>
            <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          </div>
          <div className="field">
            <label htmlFor="confirm-password">{strings.confirmPassword}</label>
            <input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
          </div>
          <div className="admin-actions">
            <button type="submit" className="btn btn-ink" disabled={pending}>
              {strings.resetSubmit}
            </button>
          </div>
        </>
      )}
    </form>
  )
}
