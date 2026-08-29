'use client'

import { useActionState } from 'react'
import { createProject, type FormState } from '@/app/admin/actions'

interface Props {
  strings: { name: string; create: string }
  errorText: string
}

const idle: FormState = { status: 'idle' }

export function NewProjectForm({ strings, errorText }: Props) {
  const [state, action, pending] = useActionState(createProject, idle)
  return (
    <form action={action} className="admin-grid">
      <div className="field">
        <label htmlFor="new-name">{strings.name}</label>
        <input id="new-name" name="name" type="text" required maxLength={160} autoFocus />
        {state.status === 'error' ? <p className="field-error">{errorText}</p> : null}
      </div>
      <div className="admin-actions">
        <button type="submit" className="btn btn-ink" disabled={pending}>
          {strings.create}
        </button>
      </div>
    </form>
  )
}
