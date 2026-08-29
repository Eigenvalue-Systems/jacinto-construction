'use client'

import { useActionState, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { saveProject, type FormState } from '@/app/admin/actions'
import type { Project } from '@/lib/data/types'
import { slugify } from '@/lib/data/util'

interface EditorStrings {
  basics: string
  name: string
  year: string
  location: string
  locationHint: string
  value: string
  valueHint: string
  description: string
  descriptionHint: string
  optional: string
  optionalDetails: string
  optionalHint: string
  slug: string
  slugHint: string
  details: string
  detailsHint: string
  featured: string
  featuredHint: string
  spanish: string
  spanishHint: string
  nameEs: string
  descriptionEs: string
  locationEs: string
  locationEsHint: string
  detailsEs: string
  photos: string
  save: string
  saveDraft: string
  publish: string
  unpublish: string
  saved: string
  publishedMsg: string
  unpublishedMsg: string
  errors: {
    nameRequired: string
    yearInvalid: string
    locationRequired: string
    descriptionRequired: string
    slugTaken: string
    slugInvalid: string
    valueInvalid: string
    generic: string
  }
}

interface Props {
  project: Project
  strings: EditorStrings
  photos: ReactNode
}

const FORM_ID = 'project-form'
const idle: FormState = { status: 'idle' }

function yearOptions() {
  const current = new Date().getFullYear()
  const years: number[] = []
  for (let y = current + 1; y >= 1980; y--) years.push(y)
  return years
}

export function ProjectEditor({ project, strings, photos }: Props) {
  const [state, action, pending] = useActionState(saveProject, idle)
  const [slug, setSlug] = useState(project.slug)
  const [slugTouched, setSlugTouched] = useState(project.published || project.slug !== slugify(project.name))
  const router = useRouter()

  useEffect(() => {
    if (state.status === 'ok') router.refresh()
  }, [state, router])

  const errorFor = (code?: string) => {
    const key = code as keyof EditorStrings['errors'] | undefined
    return key && strings.errors[key] ? strings.errors[key] : strings.errors.generic
  }

  const message = (() => {
    if (state.status === 'ok') {
      if (state.code === 'published') return strings.publishedMsg
      if (state.code === 'unpublished') return strings.unpublishedMsg
      return strings.saved
    }
    if (state.status === 'error') return errorFor(state.code)
    return null
  })()

  const fieldError = (field: string) => {
    const code = state.fields?.[field]
    return code ? errorFor(code) : null
  }

  return (
    <div className="admin-grid">
      <form id={FORM_ID} action={action} className="admin-section" aria-labelledby="basics-title">
        <input type="hidden" name="id" value={project.id} />
        <h2 id="basics-title" className="admin-section-title">
          {strings.basics}
        </h2>
        <div className="field">
          <label htmlFor="p-name">{strings.name}</label>
          <input
            id="p-name"
            name="name"
            type="text"
            defaultValue={project.name}
            required
            maxLength={160}
            onChange={(e) => {
              if (!slugTouched) setSlug(slugify(e.target.value))
            }}
          />
          {fieldError('name') ? <p className="field-error">{fieldError('name')}</p> : null}
        </div>
        <div className="admin-grid admin-grid-2">
          <div className="field">
            <label htmlFor="p-year">{strings.year}</label>
            <select id="p-year" name="year" defaultValue={project.year} required>
              {yearOptions().map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {fieldError('year') ? <p className="field-error">{fieldError('year')}</p> : null}
          </div>
          <div className="field">
            <label htmlFor="p-value">
              {strings.value} <span className="muted">({strings.optional})</span>
            </label>
            <input id="p-value" name="projectValue" type="text" inputMode="numeric" defaultValue={project.projectValue ?? ''} maxLength={40} placeholder="185000" />
            <p className="field-hint">{strings.valueHint}</p>
            {fieldError('projectValue') ? <p className="field-error">{fieldError('projectValue')}</p> : null}
          </div>
        </div>
        <div className="field">
          <label htmlFor="p-location">{strings.location}</label>
          <input id="p-location" name="location" type="text" defaultValue={project.location} maxLength={120} placeholder="South Chicago, IL" />
          <p className="field-hint">{strings.locationHint}</p>
          {fieldError('location') ? <p className="field-error">{fieldError('location')}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="p-description">{strings.description}</label>
          <textarea id="p-description" name="description" defaultValue={project.description} rows={8} maxLength={8000} />
          <p className="field-hint">{strings.descriptionHint}</p>
          {fieldError('description') ? <p className="field-error">{fieldError('description')}</p> : null}
        </div>
      </form>

      <section className="admin-section" aria-labelledby="photos-title">
        <h2 id="photos-title" className="admin-section-title">
          {strings.photos}
        </h2>
        {photos}
      </section>

      <details className="admin-section admin-details">
        <summary className="admin-summary">
          <span className="admin-section-title">{strings.optionalDetails}</span>
          <span className="admin-section-hint">{strings.optionalHint}</span>
        </summary>
        <div className="admin-grid" style={{ marginTop: 22 }}>
          <label className="check">
            <input form={FORM_ID} type="checkbox" name="featured" defaultChecked={project.featured} />
            <span>
              {strings.featured}
              <span className="check-hint">{strings.featuredHint}</span>
            </span>
          </label>
          <div className="field">
            <label htmlFor="p-details">{strings.details}</label>
            <textarea form={FORM_ID} id="p-details" name="details" defaultValue={project.details} rows={5} maxLength={2000} />
            <p className="field-hint">{strings.detailsHint}</p>
          </div>
          <div className="field">
            <label htmlFor="p-slug">{strings.slug}</label>
            <input
              form={FORM_ID}
              id="p-slug"
              name="slug"
              type="text"
              value={slug}
              maxLength={120}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
              onBlur={() => setSlug((s) => slugify(s))}
            />
            <p className="field-hint">{strings.slugHint}</p>
            {fieldError('slug') ? <p className="field-error">{fieldError('slug')}</p> : null}
          </div>
        </div>
      </details>

      <details className="admin-section admin-details">
        <summary className="admin-summary">
          <span className="admin-section-title">{strings.spanish}</span>
          <span className="admin-section-hint">{strings.spanishHint}</span>
        </summary>
        <div className="admin-grid" style={{ marginTop: 22 }} lang="es">
          <div className="field">
            <label htmlFor="p-name-es">{strings.nameEs}</label>
            <input form={FORM_ID} id="p-name-es" name="nameEs" type="text" defaultValue={project.nameEs ?? ''} maxLength={160} />
          </div>
          <div className="field">
            <label htmlFor="p-description-es">{strings.descriptionEs}</label>
            <textarea form={FORM_ID} id="p-description-es" name="descriptionEs" defaultValue={project.descriptionEs ?? ''} rows={6} maxLength={8000} />
          </div>
          <div className="field">
            <label htmlFor="p-location-es">{strings.locationEs}</label>
            <input form={FORM_ID} id="p-location-es" name="locationEs" type="text" defaultValue={project.locationEs ?? ''} maxLength={120} />
            <p className="field-hint">{strings.locationEsHint}</p>
          </div>
          <div className="field">
            <label htmlFor="p-details-es">{strings.detailsEs}</label>
            <textarea form={FORM_ID} id="p-details-es" name="detailsEs" defaultValue={project.detailsEs ?? ''} rows={4} maxLength={2000} />
          </div>
        </div>
      </details>

      <div className="admin-sticky-bar">
        <button form={FORM_ID} type="submit" name="intent" value="save" className="btn btn-outline btn-sm" disabled={pending}>
          {project.published ? strings.save : strings.saveDraft}
        </button>
        {project.published ? (
          <button form={FORM_ID} type="submit" name="intent" value="unpublish" className="btn btn-outline btn-sm" disabled={pending}>
            {strings.unpublish}
          </button>
        ) : (
          <button form={FORM_ID} type="submit" name="intent" value="publish" className="btn btn-brick btn-sm" disabled={pending}>
            {strings.publish}
          </button>
        )}
        {message ? (
          <p className={`admin-sticky-msg ${state.status === 'error' ? 'field-error' : ''}`} role="status">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
