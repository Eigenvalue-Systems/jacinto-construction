import type { Locale, ProjectType } from '@/lib/data/types'

type LabelSet = Record<ProjectType, string>

const FILTER_LABELS: Record<Locale, LabelSet> = {
  en: {
    kitchen: 'Kitchens',
    bathroom: 'Bathrooms',
    interior: 'Interior',
    exterior: 'Exterior',
    commercial: 'Commercial',
    custom: 'Custom work',
    other: 'Other',
  },
  es: {
    kitchen: 'Cocinas',
    bathroom: 'Baños',
    interior: 'Interiores',
    exterior: 'Exteriores',
    commercial: 'Comercial',
    custom: 'Trabajo especial',
    other: 'Otros',
  },
}

const SINGULAR_LABELS: Record<Locale, LabelSet> = {
  en: {
    kitchen: 'Kitchen',
    bathroom: 'Bathroom',
    interior: 'Interior',
    exterior: 'Exterior',
    commercial: 'Commercial',
    custom: 'Custom work',
    other: 'Other',
  },
  es: {
    kitchen: 'Cocina',
    bathroom: 'Baño',
    interior: 'Interior',
    exterior: 'Exterior',
    commercial: 'Comercial',
    custom: 'Trabajo especial',
    other: 'Otro',
  },
}

export function projectTypeLabel(type: ProjectType | null | undefined, locale: Locale, form: 'filter' | 'singular' = 'singular') {
  if (!type) return locale === 'es' ? 'Proyecto' : 'Project'
  return (form === 'filter' ? FILTER_LABELS : SINGULAR_LABELS)[locale][type]
}

export function projectTypeFieldLabel(locale: Locale) {
  return locale === 'es' ? 'Tipo de trabajo' : 'Type of work'
}

export function yearNotListedLabel(locale: Locale) {
  return locale === 'es' ? 'No mostrar año' : 'Do not show year'
}
