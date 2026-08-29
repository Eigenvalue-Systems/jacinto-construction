'use server'

import { getPublicRepo } from '@/lib/data'
import { sendContactEmail } from '@/lib/email'
import { isLocale } from '@/lib/i18n'

export interface ContactState {
  status: 'idle' | 'success' | 'error'
  errors: { name?: string; contact?: string; message?: string }
}

function looksLikeContact(value: string) {
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  const digits = value.replace(/\D/g, '')
  return email || (digits.length >= 7 && digits.length <= 15)
}

export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const name = String(formData.get('name') ?? '').trim().slice(0, 120)
  const contact = String(formData.get('contact') ?? '').trim().slice(0, 160)
  const message = String(formData.get('message') ?? '').trim().slice(0, 4000)
  const honeypot = String(formData.get('company') ?? '')
  const started = Number(formData.get('started') ?? 0)
  const localeRaw = String(formData.get('locale') ?? 'en')
  const locale = isLocale(localeRaw) ? localeRaw : 'en'

  const errors: ContactState['errors'] = {}
  if (!name) errors.name = 'required'
  if (!contact) errors.contact = 'required'
  else if (!looksLikeContact(contact)) errors.contact = 'invalid'
  if (!message) errors.message = 'required'
  else if (message.length < 10) errors.message = 'short'
  if (Object.keys(errors).length > 0) return { status: 'error', errors }

  if (honeypot || (started > 0 && Date.now() - started < 2500)) return { status: 'success', errors: {} }

  let stored = false
  try {
    await getPublicRepo().saveContactMessage({ name, contact, message, locale })
    stored = true
  } catch {
    stored = false
  }

  let sent = false
  try {
    const result = await sendContactEmail({ name, contact, message, locale })
    sent = result.sent
  } catch {
    sent = false
  }

  if (!stored && !sent) return { status: 'error', errors: {} }
  return { status: 'success', errors: {} }
}
