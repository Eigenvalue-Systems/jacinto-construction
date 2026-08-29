'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveSettings, type FormState } from '@/app/admin/actions'
import type { SiteSettings } from '@/lib/data/types'

export interface PickerImage {
  id: string
  label: string
  thumb: string
}

interface SettingsStrings {
  saved: string
  save: string
  company: string
  companyName: string
  ownerName: string
  phone: string
  email: string
  emailHint: string
  location: string
  serviceArea: string
  homepage: string
  homepageHeadline: string
  homepageIntro: string
  heroImage: string
  heroImageHint: string
  noImage: string
  none: string
  aboutPage: string
  aboutIntro: string
  aboutCopy: string
  aboutCopyHint: string
  servicesList: string
  servicesHint: string
  aboutImage: string
  contactPage: string
  contactCopy: string
  seo: string
  defaultMetaDescription: string
  metaHint: string
  social: string
  socialHint: string
  spanish: string
  spanishHint: string
  brand: string
  brandHint: string
  logo: string
  favicon: string
  useDefault: string
  upload: string
}

interface Props {
  settings: SiteSettings
  images: PickerImage[]
  brand: { logoUrl: string | null; faviconUrl: string | null }
  strings: SettingsStrings
  genericError: string
}

const idle: FormState = { status: 'idle' }

function ImagePicker({ id, name, label, hint, images, value, noImage }: { id: string; name: string; label: string; hint?: string; images: PickerImage[]; value: string | null; noImage: string }) {
  const [selected, setSelected] = useState(value ?? '')
  const current = images.find((i) => i.id === selected)
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="image-pick">
        {current ? <img src={current.thumb} alt="" width={96} height={96} /> : <span className="image-pick-empty" aria-hidden="true" />}
        <select id={id} name={name} value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">{noImage}</option>
          {images.map((img) => (
            <option key={img.id} value={img.id}>
              {img.label}
            </option>
          ))}
        </select>
      </div>
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  )
}

function BrandUpload({ id, name, label, initialKey, initialUrl, useDefault, upload }: { id: string; name: string; label: string; initialKey: string | null; initialUrl: string | null; useDefault: string; upload: string }) {
  const [key, setKey] = useState(initialKey ?? '')
  const [url, setUrl] = useState(initialUrl)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFile = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const body = new FormData()
      body.set('kind', 'brand')
      body.set('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body })
      if (!res.ok) throw new Error('upload')
      const data = (await res.json()) as { key: string; url: string }
      setKey(data.key)
      setUrl(data.url)
    } catch {
      setError(file.name)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input type="hidden" name={name} value={key} />
      <div className="brand-pick">
        {url ? <img src={url} alt="" /> : <span className="mono muted">{useDefault}</span>}
        <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
          {busy ? '…' : upload}
          <input
            id={id}
            type="file"
            accept="image/svg+xml,image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onFile(file)
              e.target.value = ''
            }}
          />
        </label>
        {key ? (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              setKey('')
              setUrl(null)
            }}
          >
            {useDefault}
          </button>
        ) : null}
      </div>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  )
}

export function SettingsForm({ settings, images, brand, strings, genericError }: Props) {
  const [state, action, pending] = useActionState(saveSettings, idle)
  const router = useRouter()

  useEffect(() => {
    if (state.status === 'ok') router.refresh()
  }, [state, router])

  const socialText = settings.socialLinks.map((l) => `${l.label}, ${l.url}`).join('\n')

  return (
    <form action={action} className="admin-grid">
      <section className="admin-section">
        <h2 className="admin-section-title">{strings.company}</h2>
        <div className="admin-grid admin-grid-2">
          <div className="field">
            <label htmlFor="s-company">{strings.companyName}</label>
            <input id="s-company" name="companyName" type="text" defaultValue={settings.companyName} required maxLength={120} />
          </div>
          <div className="field">
            <label htmlFor="s-owner">{strings.ownerName}</label>
            <input id="s-owner" name="ownerName" type="text" defaultValue={settings.ownerName} maxLength={120} />
          </div>
          <div className="field">
            <label htmlFor="s-phone">{strings.phone}</label>
            <input id="s-phone" name="phone" type="tel" defaultValue={settings.phone} maxLength={40} />
          </div>
          <div className="field">
            <label htmlFor="s-email">{strings.email}</label>
            <input id="s-email" name="email" type="email" defaultValue={settings.email} maxLength={160} />
            <p className="field-hint">{strings.emailHint}</p>
          </div>
          <div className="field">
            <label htmlFor="s-location">{strings.location}</label>
            <input id="s-location" name="location" type="text" defaultValue={settings.location} maxLength={120} />
          </div>
          <div className="field">
            <label htmlFor="s-area">{strings.serviceArea}</label>
            <input id="s-area" name="serviceArea" type="text" defaultValue={settings.serviceArea} maxLength={200} />
          </div>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">{strings.homepage}</h2>
        <div className="field">
          <label htmlFor="s-headline">{strings.homepageHeadline}</label>
          <input id="s-headline" name="homepageHeadline" type="text" defaultValue={settings.homepageHeadline} maxLength={160} />
        </div>
        <div className="field">
          <label htmlFor="s-intro">{strings.homepageIntro}</label>
          <textarea id="s-intro" name="homepageIntro" defaultValue={settings.homepageIntro} rows={3} maxLength={600} style={{ minHeight: 90 }} />
        </div>
        <ImagePicker id="s-hero" name="heroImageId" label={strings.heroImage} hint={strings.heroImageHint} images={images} value={settings.heroImageId} noImage={strings.noImage} />
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">{strings.aboutPage}</h2>
        <div className="field">
          <label htmlFor="s-about-intro">{strings.aboutIntro}</label>
          <textarea id="s-about-intro" name="aboutIntro" defaultValue={settings.aboutIntro} rows={3} maxLength={600} style={{ minHeight: 90 }} />
        </div>
        <div className="field">
          <label htmlFor="s-about-copy">{strings.aboutCopy}</label>
          <textarea id="s-about-copy" name="aboutCopy" defaultValue={settings.aboutCopy} rows={10} maxLength={8000} />
          <p className="field-hint">{strings.aboutCopyHint}</p>
        </div>
        <div className="field">
          <label htmlFor="s-services">{strings.servicesList}</label>
          <textarea id="s-services" name="servicesList" defaultValue={settings.servicesList} rows={6} maxLength={2000} />
          <p className="field-hint">{strings.servicesHint}</p>
        </div>
        <ImagePicker id="s-about-image" name="aboutImageId" label={strings.aboutImage} images={images} value={settings.aboutImageId} noImage={strings.none} />
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">{strings.contactPage}</h2>
        <div className="field">
          <label htmlFor="s-contact">{strings.contactCopy}</label>
          <textarea id="s-contact" name="contactCopy" defaultValue={settings.contactCopy} rows={3} maxLength={600} style={{ minHeight: 90 }} />
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">{strings.seo}</h2>
        <div className="field">
          <label htmlFor="s-meta">{strings.defaultMetaDescription}</label>
          <textarea id="s-meta" name="defaultMetaDescription" defaultValue={settings.defaultMetaDescription} rows={3} maxLength={400} style={{ minHeight: 90 }} />
          <p className="field-hint">{strings.metaHint}</p>
        </div>
        <div className="field">
          <label htmlFor="s-social">{strings.social}</label>
          <textarea id="s-social" name="socialLinks" defaultValue={socialText} rows={3} maxLength={3000} style={{ minHeight: 90 }} />
          <p className="field-hint">{strings.socialHint}</p>
        </div>
      </section>

      <section className="admin-section">
        <div>
          <h2 className="admin-section-title">{strings.spanish}</h2>
          <p className="admin-section-hint">{strings.spanishHint}</p>
        </div>
        <div className="field">
          <label htmlFor="s-area-es">{strings.serviceArea}</label>
          <input id="s-area-es" name="serviceAreaEs" type="text" defaultValue={settings.serviceAreaEs ?? ''} maxLength={200} lang="es" />
        </div>
        <div className="field">
          <label htmlFor="s-headline-es">{strings.homepageHeadline}</label>
          <input id="s-headline-es" name="homepageHeadlineEs" type="text" defaultValue={settings.homepageHeadlineEs ?? ''} maxLength={160} lang="es" />
        </div>
        <div className="field">
          <label htmlFor="s-intro-es">{strings.homepageIntro}</label>
          <textarea id="s-intro-es" name="homepageIntroEs" defaultValue={settings.homepageIntroEs ?? ''} rows={3} maxLength={600} style={{ minHeight: 90 }} lang="es" />
        </div>
        <div className="field">
          <label htmlFor="s-about-intro-es">{strings.aboutIntro}</label>
          <textarea id="s-about-intro-es" name="aboutIntroEs" defaultValue={settings.aboutIntroEs ?? ''} rows={3} maxLength={600} style={{ minHeight: 90 }} lang="es" />
        </div>
        <div className="field">
          <label htmlFor="s-about-copy-es">{strings.aboutCopy}</label>
          <textarea id="s-about-copy-es" name="aboutCopyEs" defaultValue={settings.aboutCopyEs ?? ''} rows={8} maxLength={8000} lang="es" />
        </div>
        <div className="field">
          <label htmlFor="s-services-es">{strings.servicesList}</label>
          <textarea id="s-services-es" name="servicesListEs" defaultValue={settings.servicesListEs ?? ''} rows={6} maxLength={2000} lang="es" />
        </div>
        <div className="field">
          <label htmlFor="s-contact-es">{strings.contactCopy}</label>
          <textarea id="s-contact-es" name="contactCopyEs" defaultValue={settings.contactCopyEs ?? ''} rows={3} maxLength={600} style={{ minHeight: 90 }} lang="es" />
        </div>
        <div className="field">
          <label htmlFor="s-meta-es">{strings.defaultMetaDescription}</label>
          <textarea id="s-meta-es" name="defaultMetaDescriptionEs" defaultValue={settings.defaultMetaDescriptionEs ?? ''} rows={3} maxLength={400} style={{ minHeight: 90 }} lang="es" />
        </div>
      </section>

      <section className="admin-section">
        <div>
          <h2 className="admin-section-title">{strings.brand}</h2>
          <p className="admin-section-hint">{strings.brandHint}</p>
        </div>
        <BrandUpload id="s-logo" name="logoKey" label={strings.logo} initialKey={settings.logoKey} initialUrl={brand.logoUrl} useDefault={strings.useDefault} upload={strings.upload} />
        <BrandUpload id="s-favicon" name="faviconKey" label={strings.favicon} initialKey={settings.faviconKey} initialUrl={brand.faviconUrl} useDefault={strings.useDefault} upload={strings.upload} />
      </section>

      <div className="admin-sticky-bar">
        <button type="submit" className="btn btn-ink btn-sm" disabled={pending}>
          {strings.save}
        </button>
        {state.status === 'ok' ? (
          <p className="admin-sticky-msg" role="status">
            {strings.saved}
          </p>
        ) : null}
        {state.status === 'error' ? (
          <p className="admin-sticky-msg field-error" role="alert">
            {genericError}
          </p>
        ) : null}
      </div>
    </form>
  )
}
