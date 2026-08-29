'use client'

import { useEffect, useRef, type CSSProperties, type ElementType, type HTMLAttributes, type ReactNode } from 'react'

interface Props extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'style' | 'children'> {
  as?: ElementType
  className?: string
  index?: number
  children: ReactNode
  style?: CSSProperties
}

export function Reveal({ as: Tag = 'div', className = '', index = 0, children, style, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-visible')
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('is-visible')
            observer.disconnect()
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag ref={ref} {...rest} className={`reveal ${className}`} style={{ ...style, ['--i' as string]: index }}>
      {children}
    </Tag>
  )
}
