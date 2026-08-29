'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

interface Props {
  confirm: string
  className?: string
  children: ReactNode
  disabled?: boolean
}

export function ConfirmSubmit({ confirm, className, children, disabled }: Props) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className={className}
      disabled={disabled || pending}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault()
      }}
    >
      {children}
    </button>
  )
}
