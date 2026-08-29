import { Resend } from 'resend'

export interface ContactEmailInput {
  name: string
  contact: string
  message: string
  locale: string
}

export interface ContactEmailPayload {
  from: string
  to: string[]
  subject: string
  text: string
  html: string
  replyTo?: string
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)
}

export type EmailEnv = Record<string, string | undefined>

export function emailConfigured(env: EmailEnv = process.env) {
  return !!(env.RESEND_API_KEY?.trim() && env.CONTACT_TO_EMAIL?.trim())
}

export function buildContactEmail(input: ContactEmailInput, env: EmailEnv = process.env): ContactEmailPayload | null {
  const to = env.CONTACT_TO_EMAIL?.trim()
  if (!to) return null
  const from = env.CONTACT_FROM_EMAIL?.trim() || 'Jacinto Construction <onboarding@resend.dev>'
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contact)
  const language = input.locale === 'es' ? 'Spanish' : 'English'
  return {
    from,
    to: [to],
    subject: `Website message from ${input.name}`,
    text: [`Name: ${input.name}`, `Phone or email: ${input.contact}`, `Language: ${language}`, '', input.message].join('\n'),
    html: `<p><strong>Name:</strong> ${escapeHtml(input.name)}<br><strong>Phone or email:</strong> ${escapeHtml(input.contact)}<br><strong>Language:</strong> ${language}</p><p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>`,
    replyTo: isEmail ? input.contact : undefined,
  }
}

export async function sendContactEmail(input: ContactEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const payload = buildContactEmail(input)
  if (!apiKey || !payload) return { sent: false as const, reason: 'not-configured' as const }
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send(payload)
  if (error) return { sent: false as const, reason: 'failed' as const, detail: error.message }
  return { sent: true as const }
}
